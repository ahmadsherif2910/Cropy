<div align="center">
  <h1>✂️ Cropy</h1>
  <p><strong>A privacy-first, purely in-browser AI image cropping and orientation tool.</strong></p>
</div>

---

## 🌟 Overview

**Cropy** is a web application that leverages state-of-the-art ONNX models to automatically detect, crop, and orient objects in images. Because all inference happens via WebAssembly directly in your browser, your images **never** leave your device, ensuring complete data privacy.

## ✨ Key Features

- **🔒 100% Client-Side Processing**: Process everything locally in your browser using ONNX Runtime Web. We employ no servers and no uploads.
- **🎯 Precise Object Detection**: Identify and isolate objects using a YOLOv8-OBB (Oriented Bounding Boxes) model, even when they are skewed or angled.
- **🔄 Auto-Orientation**: Evaluate cropped patches with a secondary neural network and automatically correct their rotation (0°, 90°, 180°, or 270°) to an upright position.
- **⚡ Batch Operations**: Upload multiple images at once, process them through the AI pipeline, and download all your results in a convenient `.zip` file.
- **🎨 Beautiful UI**: Experience a fluid, app-like user interface crafted with React, Tailwind CSS, and Framer Motion.

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

1. **Pre-processing**: Resize, pad, and normalize the uploaded image into a tensor suitable for the ONNX model input.
2. **Detection (YOLOv8-OBB)**: Process the tensor with the primary ONNX model to return oriented bounding boxes, extracting the exact coordinates, dimensions, and angles of the objects.
3. **Orientation Check**: Analyze the extracted image patches using a lightweight secondary model to determine their true vertical alignment.
4. **Final Render**: Rotate and crop the original image according to the model predictions using standard HTML5 Canvas operations, outputting perfectly aligned crops for the user to review and download.

## 🤖 Model Training & Technical Details

The AI capabilities in Cropy are built upon extensive custom dataset generation and robust pre-trained models.

### Dataset Generation (YOLOv8-OBB)
To train the object detection model, we built a custom pipeline to automatically annotate images with Oriented Bounding Boxes (OBB):
- **[jupyter.ipynb](./jupyter.ipynb)**: Iterate over raw images and use the Segment Anything Model 3 (SAM3) to accurately segment photos and documents. Compute the minimum area bounding rectangles around the identified contours and export the bounding boxes in YOLO OBB format.
- **[public/autocrop_sam3.py](./public/autocrop_sam3.py)**: Demonstrate the underlying approach with a standalone Python script. Leverage SAM3 to perform semantic segmentation and apply perspective transformations to warp and extract flattened crops automatically.

### Auto-Orientation Model
After objects are detected and cropped, they might be sideways or upside down.
To solve this, evaluate each crop using the **[public/orientation_model.onnx](./public/orientation_model.onnx)** model. Predict the rotation needed (0°, 90°, 180°, or 270°) with this lightweight classification model to perfectly upright the image. 
*Note: This orientation model was sourced from [duartebarbosadev/deep-image-orientation-detection](https://github.com/duartebarbosadev/deep-image-orientation-detection).*
