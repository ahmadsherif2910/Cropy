import * as ort from 'onnxruntime-web';

// Use CDN to fetch the WASM binaries so Vite doesn't intercept them and serve index.html
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/';
ort.env.wasm.numThreads = 1; 

export interface OBBResult {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number; // in radians
  confidence: number;
  classId: number;
}

/**
 * Wrapper to explicitly cache model files so they load instantly offline/on subsequent loads.
 */
async function fetchWithCache(url: string): Promise<string | ArrayBuffer> {
  if (url.startsWith('blob:')) return url; // Don't cache Object URLs
  if (!('caches' in window)) return url;

  try {
    const cache = await caches.open('cropy-models-v1');
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      console.log(`[Cache] Loaded model from cache: ${url}`);
      return await cachedResponse.arrayBuffer();
    }
    
    console.log(`[Cache] Fetching model from network: ${url}`);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response.clone());
      return await response.arrayBuffer();
    }
  } catch (err) {
    console.warn("Failed to use Cache API, falling back to network URL.", err);
  }
  
  return url;
}

/**
 * Loads the ONNX model from the given URL and attempts to extract class names.
 */
export async function loadModel(modelUrl: string): Promise<{ session: ort.InferenceSession, classNames: Record<number, string> }> {
  // Use wasm or webgl based on browser capabilities. 'wasm' is more stable across devices.
  const cachedInput = await fetchWithCache(modelUrl);
  const session = await ort.InferenceSession.create(cachedInput as any, { executionProviders: ['wasm'] });
  
  const classNames: Record<number, string> = {};
  
  try {
    // Ultralytics usually stores class names in custom metadata
    if (session.modelMetadata && session.modelMetadata.customMetadataMap) {
      const namesStr = session.modelMetadata.customMetadataMap.names;
      if (namesStr) {
        // namesStr is often a string like "{0: 'person', 1: 'bicycle'}"
        // Convert to valid JSON if needed (replace single quotes with double quotes)
        const validJson = namesStr.replace(/'/g, '"');
        const parsed = JSON.parse(validJson);
        for (const key of Object.keys(parsed)) {
          classNames[parseInt(key)] = parsed[key];
        }
      }
    }
  } catch (e) {
    console.warn("Could not parse class names from model metadata", e);
  }

  return { session, classNames };
}

/**
 * Prepares an HTMLImageElement for YOLOv8 inference (resizes and pads to 640x640).
 */
export function preprocess(image: HTMLImageElement, targetSize: number = 640) {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Failed to get canvas context");

  const imgW = image.naturalWidth || image.width;
  const imgH = image.naturalHeight || image.height;

  // Letterbox resize: maintain aspect ratio, pad with 114 (gray)
  const ratio = Math.min(targetSize / imgW, targetSize / imgH);
  const newW = imgW * ratio;
  const newH = imgH * ratio;
  const padX = (targetSize - newW) / 2;
  const padY = (targetSize - newH) / 2;

  ctx.fillStyle = 'rgb(114, 114, 114)';
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(image, padX, padY, newW, newH);

  const imageData = ctx.getImageData(0, 0, targetSize, targetSize).data;
  
  // Convert to [1, 3, targetSize, targetSize] Float32Array
  const float32Data = new Float32Array(3 * targetSize * targetSize);
  for (let i = 0; i < targetSize * targetSize; i++) {
    float32Data[i] = imageData[i * 4] / 255.0; // R
    float32Data[targetSize * targetSize + i] = imageData[i * 4 + 1] / 255.0; // G
    float32Data[2 * targetSize * targetSize + i] = imageData[i * 4 + 2] / 255.0; // B
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]);
  
  return { tensor, padX, padY, ratio };
}

/**
 * Runs the ONNX model and decodes the YOLOv8-OBB output.
 */
export async function runInference(
  session: ort.InferenceSession,
  tensor: ort.Tensor,
  ratio: number,
  padX: number,
  padY: number,
  confThreshold: number = 0.25
): Promise<OBBResult[]> {
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = tensor;

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]]; 
  
  const dims = output.dims; 
  const data = output.data as Float32Array;

  const finalResults: OBBResult[] = [];

  if (dims.length === 3 && dims[1] === 300 && dims[2] === 7) {
    const numDetections = dims[1];
    const featureSize = dims[2];

    for (let i = 0; i < numDetections; i++) {
      const offset = i * featureSize;
      
      const cx = data[offset + 0];
      const cy = data[offset + 1];
      const w = data[offset + 2];
      const h = data[offset + 3];
      
      const conf = data[offset + 4];
      const classId = Math.round(data[offset + 5]);
      const angle = data[offset + 6];

      if (conf < confThreshold) continue;

      // Scale back to original image
      const originalX = (cx - padX) / ratio;
      const originalY = (cy - padY) / ratio;
      const originalW = w / ratio;
      const originalH = h / ratio;

      finalResults.push({
        x: originalX,
        y: originalY,
        w: originalW,
        h: originalH,
        angle: angle,
        confidence: conf,
        classId: classId
      });
    }
  } else {
    console.error(`Unexpected tensor shape: ${dims.join('x')}`);
  }

  return finalResults;
}

/**
 * Loads the Orientation ONNX model.
 */
export async function loadOrientationModel(modelUrl: string): Promise<ort.InferenceSession> {
  const cachedInput = await fetchWithCache(modelUrl);
  return await ort.InferenceSession.create(cachedInput as any, { executionProviders: ['wasm'] });
}

/**
 * Prepares an image for Orientation model inference.
 * Replicates: T.Resize((416, 416)), T.CenterCrop(384), T.ToTensor(), T.Normalize()
 */
export function preprocessOrientation(image: HTMLImageElement): ort.Tensor {
  const targetSize = 416;
  const cropSize = 384;
  
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Failed to get canvas context");

  // T.Resize((416, 416)) -> stretches to exactly 416x416
  ctx.drawImage(image, 0, 0, targetSize, targetSize);

  // T.CenterCrop(384)
  const startX = Math.floor((targetSize - cropSize) / 2);
  const startY = Math.floor((targetSize - cropSize) / 2);
  const imageData = ctx.getImageData(startX, startY, cropSize, cropSize).data;

  // Convert to [1, 3, cropSize, cropSize] Float32Array with ImageNet normalization
  const float32Data = new Float32Array(3 * cropSize * cropSize);
  
  const means = [0.485, 0.456, 0.406];
  const stds = [0.229, 0.224, 0.225];

  for (let i = 0; i < cropSize * cropSize; i++) {
    const r = imageData[i * 4] / 255.0;
    const g = imageData[i * 4 + 1] / 255.0;
    const b = imageData[i * 4 + 2] / 255.0;

    float32Data[i] = (r - means[0]) / stds[0];
    float32Data[cropSize * cropSize + i] = (g - means[1]) / stds[1];
    float32Data[2 * cropSize * cropSize + i] = (b - means[2]) / stds[2];
  }

  return new ort.Tensor('float32', float32Data, [1, 3, cropSize, cropSize]);
}

/**
 * Runs the Orientation model and returns the predicted class ID (0, 1, 2, 3).
 */
export async function runOrientationInference(
  session: ort.InferenceSession,
  tensor: ort.Tensor
): Promise<number> {
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = tensor;

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]]; 
  const data = output.data as Float32Array;
  
  // output is [1, 4] (batch_size, num_classes)
  let maxIdx = 0;
  let maxVal = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > maxVal) {
      maxVal = data[i];
      maxIdx = i;
    }
  }

  return maxIdx;
}

