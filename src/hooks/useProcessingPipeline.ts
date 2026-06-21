import { useState, useEffect, useRef } from 'react';
import { loadModel, preprocess, runInference, loadOrientationModel, preprocessOrientation, runOrientationInference } from '../utils/inference';
import { extractCrops, drawDetections, rotateImage } from '../utils/imageProcessing';
import { GalleryImage } from '../types';

interface UseProcessingPipelineProps {
  files: File[];
  modelSrc: string | File;
  onComplete: (results: GalleryImage[]) => void;
}

export function useProcessingPipeline({ files, modelSrc, onComplete }: UseProcessingPipelineProps) {
  const [state, setState] = useState({ stepIndex: 0, photo: 0 });
  const processedImages = useRef<GalleryImage[]>([]);

  const totalPhotos = files.length;
  const currentTotal = state.stepIndex === 1 ? Math.max(1, processedImages.current.length) : totalPhotos;
  const totalSteps = 2; 

  const progress = state.stepIndex >= totalSteps
    ? 100
    : (state.photo / Math.max(1, currentTotal)) * 100;

  useEffect(() => {
    let isCancelled = false;

    async function process() {
      try {
        setState({ stepIndex: 0, photo: 0 });
        
        // Step 0 & 1
        let session;
        let orientationSession;
        let classNames: Record<number, string> = {};

        if (modelSrc === 'sam3-external') {
          console.log("[Pipeline] SAM 3 External mode: Skipping segmentation model load & inference.");
          try {
            orientationSession = await loadOrientationModel('./orientation_model.onnx');
          } catch (err) {
            console.error("[Pipeline] Failed to load orientation model.", err);
            return;
          }

          // In SAM 3 mode, uploaded files are ALREADY cropped.
          // Map them directly to GalleryImage format.
          for (let i = 0; i < files.length; i++) {
            if (isCancelled) return;
            const file = files[i];
            const imgUrl = URL.createObjectURL(file);
            processedImages.current.push({
              id: `${file.name}-${i}-${Date.now()}`,
              url: imgUrl,
              filename: file.name,
              type: `Photo ${processedImages.current.length + 1}`
            });
            // Update UI progress
            setState({ stepIndex: 0, photo: i + 1 });
            // Add a tiny delay to show progress for UX
            await new Promise(r => setTimeout(r, 100));
          }

        } else {
          try {
            console.log("[Pipeline] Starting to load ONNX models...");
            console.time("Model Load Time");
            const modelUrl = typeof modelSrc === 'string' ? modelSrc : URL.createObjectURL(modelSrc);
            const loaded = await loadModel(modelUrl);
            session = loaded.session;
            classNames = loaded.classNames;

            orientationSession = await loadOrientationModel('./orientation_model.onnx');

            console.timeEnd("Model Load Time");
            console.log("[Pipeline] Models loaded successfully!");
          } catch (err) {
            console.error("[Pipeline] Failed to load models. Ensure they are accessible.", err);
            return;
          }
          
          if (isCancelled) return;

          // Step 1: Inference & Cropping per image
          for (let i = 0; i < files.length; i++) {
            if (isCancelled) return;
            
            const file = files[i];
            console.log(`[Pipeline] --- Processing Photo ${i + 1}/${files.length}: ${file.name} ---`);
            console.time(`Photo ${i + 1} Total Time`);
            
            const imgUrl = URL.createObjectURL(file);
            
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imgUrl;
            });

            const { tensor, padX, padY, ratio } = preprocess(img);
            const predictions = await runInference(session, tensor, ratio, padX, padY);
            const crops = await extractCrops(img, file.name, predictions);
            
            const galleryImages: GalleryImage[] = crops.map((c, idx) => ({
              id: `${file.name}-${idx}-${Date.now()}`,
              url: c.url,
              filename: c.filename,
              type: `Photo ${processedImages.current.length + idx + 1}`
            }));

            processedImages.current.push(...galleryImages);

            // Update photo progress but stay on step 0
            setState({ stepIndex: 0, photo: i + 1 });
          }
        }

        if (isCancelled) return;

        // Step 1: Rotating & Straightening
        setState({ stepIndex: 1, photo: 0 });
        
        for (let i = 0; i < processedImages.current.length; i++) {
          if (isCancelled) return;
          const currentImage = processedImages.current[i];
          
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = currentImage.url;
          });

          const tensor = preprocessOrientation(img);
          const classId = await runOrientationInference(orientationSession, tensor);
          
          if (classId !== 0) {
            const newUrl = await rotateImage(currentImage.url, classId);
            processedImages.current[i].url = newUrl;
          }

          setState({ stepIndex: 1, photo: i + 1 });
        }

        if (isCancelled) return;

        // Final completion state
        setState({ stepIndex: 2, photo: totalPhotos });
        
        console.log("[Pipeline] All photos processed successfully!");
        // Wait briefly to show 100% completion state
        await new Promise(r => setTimeout(r, 500));
        
        if (!isCancelled) {
          onComplete(processedImages.current);
        }

      } catch (err) {
        console.error("[Pipeline] Critical processing error:", err);
      }
    }

    if (files.length > 0) {
      process();
    }

    return () => {
      isCancelled = true;
    };
  }, [files, onComplete]);

  const getStepStatus = (stepIndex: number): 'done' | 'active' | 'waiting' => {
    if (state.stepIndex > stepIndex) return 'done';
    if (state.stepIndex === stepIndex) return 'active';
    return 'waiting';
  };

  return {
    currentStepIndex: state.stepIndex,
    currentPhoto: state.photo,
    totalPhotos: currentTotal,
    progress,
    getStepStatus,
  };
}
