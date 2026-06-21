<div align="center">
  <img width="1200" height="475" alt="Cropy Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <br/>
  <h1>✂️ Cropy</h1>
  <p><strong>A privacy-first, purely in-browser AI image cropping and orientation tool.</strong></p>
</div>

---

## 🌟 Overview

**Cropy** is a web application that leverages state-of-the-art ONNX models to automatically detect, crop, and orient objects in images. Because all inference happens via WebAssembly directly in your browser, your images **never** leave your device, ensuring complete data privacy.

## ✨ Key Features

- **🔒 100% Client-Side Processing**: No servers, no uploads. Everything runs locally in your browser using ONNX Runtime Web.
- **🎯 Precise Object Detection**: Uses a YOLOv8-OBB (Oriented Bounding Boxes) model to identify and isolate objects, even when they are skewed or angled.
- **🔄 Auto-Orientation**: A secondary neural network evaluates cropped patches and automatically corrects their rotation (0°, 90°, 180°, or 270°) to an upright position.
- **⚡ Batch Operations**: Upload multiple images at once, process them through the AI pipeline, and download all your results in a convenient `.zip` file.
- **🎨 Beautiful UI**: Crafted with React, Tailwind CSS, and Framer Motion for a fluid, app-like user experience.

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Machine Learning**: ONNX Runtime Web (`onnxruntime-web`)
- **Styling & Animation**: Tailwind CSS, Motion (Framer Motion), Lucide React
- **File Handling**: JSZip

## 🚀 Getting Started

Follow these instructions to set up and run the application on your local machine.

### Prerequisites
- Node.js (v18 or newer recommended)

### Installation

1. **Install the dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000` (or the port specified by Vite in your terminal).

## 🧠 Architecture & Pipeline

1. **Pre-processing**: The uploaded image is resized, padded, and normalized into a tensor suitable for the ONNX model input.
2. **Detection (YOLOv8-OBB)**: The primary ONNX model processes the tensor and returns oriented bounding boxes, giving the exact coordinates, dimensions, and angles of the objects.
3. **Orientation Check**: A lightweight secondary model analyzes the extracted image patches to determine their true vertical alignment.
4. **Final Render**: Using standard HTML5 Canvas operations, the application rotates and crops the original image according to the model predictions, outputting perfectly aligned crops for the user to review and download.

## 🤖 Model Training & Technical Details

The AI capabilities in Cropy are built upon extensive custom dataset generation and robust pre-trained models.

### Dataset Generation (YOLOv8-OBB)
To train the object detection model, we built a custom pipeline to automatically annotate images with Oriented Bounding Boxes (OBB):
- **[jupyter.ipynb](file:///c:/Ahmad/Programming/Cropytest/jupyter.ipynb)**: This notebook iterates over raw images and uses the Segment Anything Model 3 (SAM3) to accurately segment photos and documents. It computes the minimum area bounding rectangles around the identified contours and exports the bounding boxes in YOLO OBB format.
- **[public/autocrop_sam3.py](file:///c:/Ahmad/Programming/Cropytest/public/autocrop_sam3.py)**: A standalone Python script that demonstrates the underlying approach. It leverages SAM3 to perform semantic segmentation and applies perspective transformations to warp and extract flattened crops automatically.

### Auto-Orientation Model
After objects are detected and cropped, they might be sideways or upside down.
To solve this, we use the **[public/orientation_model.onnx](file:///c:/Ahmad/Programming/Cropytest/public/orientation_model.onnx)** to evaluate each crop. This lightweight classification model predicts the rotation needed (0°, 90°, 180°, or 270°) to perfectly upright the image. 
*Note: This orientation model was sourced from [duartebarbosadev/deep-image-orientation-detection](https://github.com/duartebarbosadev/deep-image-orientation-detection).*
