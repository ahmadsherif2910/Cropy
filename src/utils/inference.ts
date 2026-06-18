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
 * Loads the ONNX model from the given URL.
 */
export async function loadModel(modelUrl: string): Promise<ort.InferenceSession> {
  // Use wasm or webgl based on browser capabilities. 'wasm' is more stable across devices.
  return await ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] });
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
