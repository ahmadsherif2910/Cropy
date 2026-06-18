import { useState, useEffect, useRef } from 'react';
import { loadModel, preprocess, runInference } from '../utils/inference';
import { extractCrops, drawDetections } from '../utils/imageProcessing';
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
  const totalSteps = 3; 

  const progress = state.stepIndex >= totalSteps
    ? 100
    : (state.photo / Math.max(1, totalPhotos)) * 100;

  useEffect(() => {
    let isCancelled = false;

    async function process() {
      try {
        setState({ stepIndex: 0, photo: 0 });
        
        // Step 0: Loading Model
        let session;
        let classNames: Record<number, string> = {};
        try {
          console.log("[Pipeline] Starting to load ONNX model...");
          console.time("Model Load Time");
          const modelUrl = typeof modelSrc === 'string' ? modelSrc : URL.createObjectURL(modelSrc);
          const loaded = await loadModel(modelUrl);
          session = loaded.session;
          classNames = loaded.classNames;
          console.timeEnd("Model Load Time");
          console.log("[Pipeline] Model loaded successfully!");
        } catch (err) {
          console.error("[Pipeline] Failed to load model. Ensure it is accessible.", err);
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

        if (isCancelled) return;

        // Step 1: Rotating & Straightening (Placeholder for future code)
        setState({ stepIndex: 1, photo: 0 });
        await new Promise(r => setTimeout(r, 500)); // Simulate work

        if (isCancelled) return;

        // Step 2: Generating structural previews (Placeholder for future code)
        setState({ stepIndex: 2, photo: 0 });
        await new Promise(r => setTimeout(r, 500)); // Simulate work

        if (isCancelled) return;
        
        // Final completion state
        setState({ stepIndex: 3, photo: totalPhotos });
        
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
    totalPhotos,
    progress,
    getStepStatus,
  };
}
