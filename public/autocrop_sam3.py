"""
SAM 3 Auto-Cropping Pipeline
----------------------------
This script uses the Segment Anything Model 3 (SAM 3) to semantically identify 
objects (like photos or documents) in images. It extracts the segmentation masks, 
approximates a quadrilateral boundary, and applies a perspective warp to correctly 
align and crop the object.

Usage:
    python autocrop_sam3.py --input unseen/ --output cropped_results5/ --model sam3_model.pt
"""

import argparse
import os
from pathlib import Path
from typing import Tuple, List

import cv2
import numpy as np
from ultralytics.models.sam import SAM3SemanticPredictor

def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Robustly orders 4 points in the following order: 
    [top-left, top-right, bottom-right, bottom-left].
    
    Args:
        pts (np.ndarray): Array of 4 points.
        
    Returns:
        np.ndarray: Ordered points.
    """
    rect = np.zeros((4, 2), dtype="float32")
    pts = pts.reshape(4, 2)
    
    # Sort points by y-coordinate
    sorted_by_y = pts[np.argsort(pts[:, 1]), :]
    top_two = sorted_by_y[:2, :]
    bottom_two = sorted_by_y[2:, :]
    
    # Sort top two points by x-coordinate
    top_left = top_two[np.argsort(top_two[:, 0]), :][0]
    top_right = top_two[np.argsort(top_two[:, 0]), :][1]
    
    # Sort bottom two points by x-coordinate
    bottom_left = bottom_two[np.argsort(bottom_two[:, 0]), :][0]
    bottom_right = bottom_two[np.argsort(bottom_two[:, 0]), :][1]
    
    return np.array([top_left, top_right, bottom_right, bottom_left], dtype="float32")

def get_perspective_crop(img: np.ndarray, coords: np.ndarray) -> np.ndarray:
    """
    Given an image and boundary coordinates, approximates a quadrilateral,
    calculates dimensions, and performs a perspective warp to extract a flat crop.
    """
    epsilon = 0.02 * cv2.arcLength(coords, True)
    approx = cv2.approxPolyDP(coords, epsilon, True)

    # If approximation doesn't yield 4 points, fallback to minimum area bounding rectangle
    if len(approx) != 4:
        rect_min = cv2.minAreaRect(coords)
        approx = cv2.boxPoints(rect_min)
        approx = np.array(approx, dtype="float32")

    rect = order_points(approx)
    (tl, tr, br, bl) = rect

    # Calculate max width and max height for the target flat crop
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    # Destination points for perspective warp
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    transform_matrix = cv2.getPerspectiveTransform(rect, dst)
    final_crop = cv2.warpPerspective(img, transform_matrix, (max_width, max_height))
    
    return final_crop

def process_images(input_dir: str, output_dir: str, model_path: str, prompt: str = "photo"):
    """
    Iterates over all images in the input directory, runs SAM 3 semantic segmentation,
    and saves the warped/cropped objects to the output directory.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Configure predictor
    overrides = {
        "conf": 0.5,
        "task": "segment",
        "mode": "predict",
        "model": model_path,
        "half": True,
        "save_crop": False, # We are doing custom cropping manually
        "imgsz": 644
    }
    
    print(f"[*] Initializing SAM 3 Predictor with model: {model_path}")
    predictor = SAM3SemanticPredictor(overrides=overrides)

    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    image_files = [f for f in Path(input_dir).iterdir() if f.suffix.lower() in valid_extensions]

    if not image_files:
        print(f"[!] No valid images found in directory: '{input_dir}'")
        return

    print(f"[*] Found {len(image_files)} images in '{input_dir}'. Starting batch processing...\n")

    for img_path in image_files:
        image_path_str = str(img_path)
        print(f"    -> Processing: {img_path.name}")

        # Run inference using the text prompt
        results = predictor(image_path_str, text=[prompt])
        img = cv2.imread(image_path_str)

        if img is None:
            print(f"       [!] Failed to read image: {img_path.name}")
            continue

        # Process the detected masks
        for i, r in enumerate(results):
            if r.masks is None:
                continue

            for j, coords in enumerate(r.masks.xy):
                try:
                    final_crop = get_perspective_crop(img, coords)
                    
                    # Save output
                    output_filename = f"{img_path.stem}_crop_{i}_{j}.jpg"
                    save_path = os.path.join(output_dir, output_filename)
                    cv2.imwrite(save_path, final_crop)
                    
                except Exception as e:
                    print(f"       [!] Error cropping mask {j} for {img_path.name}: {e}")

    print(f"\n[*] Processing complete. Results saved to '{output_dir}'.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SAM 3 Auto-Cropping Pipeline")
    parser.add_argument("--input", type=str, default="photos_raw", help="Path to input images directory")
    parser.add_argument("--output", type=str, default="cropped_results", help="Path to save cropped outputs")
    parser.add_argument("--model", type=str, default="sam3_model.pt", help="Path to SAM 3 model weights (.pt)")
    parser.add_argument("--prompt", type=str, default="photo", help="Text prompt for semantic segmentation")
    
    args = parser.parse_args()
    
    process_images(
        input_dir=args.input,
        output_dir=args.output,
        model_path=args.model,
        prompt=args.prompt
    )
