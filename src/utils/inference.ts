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
export function preprocess(image: HTMLImageElement, targetSize: number = 640): { tensor: ort.Tensor, padX: number, padY: number, ratio: number } {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d')!;

  // Fill with YOLO's default padding color (gray)
  ctx.fillStyle = 'rgb(114, 114, 114)';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Calculate scaling and padding
  const ratio = Math.min(targetSize / image.width, targetSize / image.height);
  const newW = image.width * ratio;
  const newH = image.height * ratio;
  const padX = (targetSize - newW) / 2;
  const padY = (targetSize - newH) / 2;

  // Draw the image on the canvas
  ctx.drawImage(image, padX, padY, newW, newH);

  // Extract pixel data
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize).data;
  
  // YOLOv8 expects format: [1, 3, 640, 640] - RGB channels separated, normalized 0-1
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
  confThreshold: number = 0.25,
  iouThreshold: number = 0.45
): Promise<OBBResult[]> {
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = tensor;

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]]; // [1, C, 8400]
  
  const dims = output.dims; // e.g. [1, 15, 8400] where 15 = 4(box) + 10(classes) + 1(angle)
  const numElements = dims[1]; 
  const numAnchors = dims[2];
  const numClasses = numElements - 5;
  const data = output.data as Float32Array;

  let candidates: OBBResult[] = [];

  for (let i = 0; i < numAnchors; i++) {
    let maxClassConf = 0;
    let classId = -1;

    // Find the highest class probability for this anchor
    for (let c = 0; c < numClasses; c++) {
      const conf = data[(4 + c) * numAnchors + i];
      if (conf > maxClassConf) {
        maxClassConf = conf;
        classId = c;
      }
    }

    if (maxClassConf >= confThreshold) {
      // Decode bounding box and angle
      const cx = data[0 * numAnchors + i];
      const cy = data[1 * numAnchors + i];
      const w = data[2 * numAnchors + i];
      const h = data[3 * numAnchors + i];
      const angle = data[(numElements - 1) * numAnchors + i];

      // Reverse the padding and scaling
      const originalX = (cx - padX) / ratio;
      const originalY = (cy - padY) / ratio;
      const originalW = w / ratio;
      const originalH = h / ratio;

      candidates.push({
        x: originalX,
        y: originalY,
        w: originalW,
        h: originalH,
        angle: angle,
        confidence: maxClassConf,
        classId: classId
      });
    }
  }

  // Apply standard NMS (Non-Maximum Suppression) on the Axis-Aligned bounding box approximation
  // Note: For perfect OBB, Rotated IoU is needed, but AABB IoU is often sufficient for non-dense objects.
  candidates.sort((a, b) => b.confidence - a.confidence);
  const finalResults: OBBResult[] = [];

  for (const c of candidates) {
    let keep = true;
    for (const f of finalResults) {
      if (c.classId !== f.classId) continue;
      
      const iou = calculateAABBIoU(c, f);
      if (iou > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) {
      finalResults.push(c);
    }
  }

  return finalResults;
}

// Simple Axis-Aligned Bounding Box IoU for NMS approximation
// Uses the True AABB of the rotated boxes to ensure proper suppression
function calculateAABBIoU(box1: OBBResult, box2: OBBResult): number {
  const c1 = Math.abs(Math.cos(box1.angle));
  const s1 = Math.abs(Math.sin(box1.angle));
  const w1 = box1.w * c1 + box1.h * s1;
  const h1 = box1.w * s1 + box1.h * c1;
  
  const b1x1 = box1.x - w1 / 2;
  const b1y1 = box1.y - h1 / 2;
  const b1x2 = box1.x + w1 / 2;
  const b1y2 = box1.y + h1 / 2;

  const c2 = Math.abs(Math.cos(box2.angle));
  const s2 = Math.abs(Math.sin(box2.angle));
  const w2 = box2.w * c2 + box2.h * s2;
  const h2 = box2.w * s2 + box2.h * c2;

  const b2x1 = box2.x - w2 / 2;
  const b2y1 = box2.y - h2 / 2;
  const b2x2 = box2.x + w2 / 2;
  const b2y2 = box2.y + h2 / 2;

  const interX1 = Math.max(b1x1, b2x1);
  const interY1 = Math.max(b1y1, b2y1);
  const interX2 = Math.min(b1x2, b2x2);
  const interY2 = Math.min(b1y2, b2y2);

  const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const b1Area = w1 * h1;
  const b2Area = w2 * h2;

  return interArea / (b1Area + b2Area - interArea);
}
