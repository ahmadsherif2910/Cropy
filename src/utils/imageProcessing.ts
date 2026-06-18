import { OBBResult } from './inference';

export interface CroppedImage {
  url: string;
  filename: string;
  classId: number;
}

/**
 * Extracts rotated crops from an image based on OBB predictions.
 * Replaces cv2.warpAffine and numpy slicing for performance and browser compatibility.
 */
export async function extractCrops(
  image: HTMLImageElement,
  originalFilename: string,
  predictions: OBBResult[],
  classNames: Record<number, string> = {}
): Promise<CroppedImage[]> {
  const crops: CroppedImage[] = [];

  for (let i = 0; i < predictions.length; i++) {
    const p = predictions[i];
    
    // Bounds check to ensure we don't try to create a 0-size canvas
    const w = Math.max(1, Math.round(p.w));
    const h = Math.max(1, Math.round(p.h));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) continue;

    // Translate to the center of the crop canvas
    ctx.translate(w / 2, h / 2);
    
    // Rotate the context. 
    // OpenCV's positive angles rotate counter-clockwise.
    // HTML5 Canvas positive angles rotate clockwise.
    // Therefore, we negate the angle to perfectly match the Python logic.
    ctx.rotate(-p.angle);
    
    // Translate the image so the center of the object is at (0, 0) of the rotated context
    ctx.translate(-p.x, -p.y);
    
    // Draw the full image; the context transformations will automatically crop and rotate it
    ctx.drawImage(image, 0, 0);

    // Convert the cropped canvas to a Blob URL
    const blobUrl = await new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve('');
        }
      }, 'image/png');
    });

    if (!blobUrl) continue;

    const className = classNames[p.classId] || `class_${p.classId}`;
    const filename = `${originalFilename.split('.')[0]}_obj_${i}.png`;

    crops.push({
      url: blobUrl,
      filename,
      classId: p.classId,
    });
  }

  return crops;
}

/**
 * DEVELOPMENT ONLY: Draws the rotated bounding boxes on the original image instead of cropping.
 */
export async function drawDetections(
  image: HTMLImageElement,
  originalFilename: string,
  predictions: OBBResult[],
  classNames: Record<number, string> = {}
): Promise<CroppedImage[]> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return [];

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Configure box style
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#00FF00'; // Green boxes
  ctx.fillStyle = '#00FF00';
  ctx.font = '24px Arial';

  for (let i = 0; i < predictions.length; i++) {
    const p = predictions[i];
    
    ctx.save();
    // Move to the center of the object
    ctx.translate(p.x, p.y);
    // Rotate counter-clockwise to match OpenCV
    ctx.rotate(-p.angle);
    
    // Draw the bounding box centered on the origin
    ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
    
    // Draw the label and confidence
    const label = `${classNames[p.classId] || p.classId} (${(p.confidence * 100).toFixed(1)}%)`;
    ctx.fillText(label, -p.w / 2, -p.h / 2 - 10);
    
    ctx.restore();
  }

  // Convert the canvas to a Blob URL
  const blobUrl = await new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        resolve('');
      }
    }, 'image/jpeg', 0.9);
  });

  if (!blobUrl) return [];

  return [{
    url: blobUrl,
    filename: `DEBUG_${originalFilename}`,
    classId: -1,
  }];
}
