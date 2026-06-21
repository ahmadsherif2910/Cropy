<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Cropy

Cropy is a powerful, privacy-first web application that allows you to detect, crop, and orient objects in images entirely within your browser using Artificial Intelligence.

View your app in AI Studio: https://ai.studio/apps/5104d674-797e-4693-b707-4113b27f6a0e

## Features

- **On-Device AI Inference**: Uses ONNX Runtime Web to run AI models directly in your browser without sending your images to any server, guaranteeing privacy.
- **YOLOv8-OBB Integration**: Employs Oriented Bounding Boxes (OBB) to accurately detect and crop objects, even when they are rotated.
- **Auto-Orientation Correction**: Features a dedicated orientation model to automatically ensure cropped images are rotated correctly (handling 0°, 90°, 180°, and 270° adjustments).
- **Batch Processing**: Upload multiple images simultaneously and process them through the pipeline.
- **Zip Export**: Easily download all your processed and cropped images in a single bundled `.zip` archive.
- **Modern UI/UX**: Built with React and Tailwind CSS, featuring smooth interface transitions and animations.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI/ML**: ONNX Runtime Web (WASM backend)
- **Utilities**: JSZip, Lucide React, Motion (Framer Motion)

## Run Locally

**Prerequisites:** Node.js (v18 or higher recommended)

1. Navigate to the project directory.
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. If necessary, set the `GEMINI_API_KEY` in your `.env.local` file to your Gemini API key.
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the provided localhost URL (usually `http://localhost:3000`).

## How It Works

Cropy's processing pipeline leverages two ONNX models running directly in your browser:
1. **Detection Phase**: Images are preprocessed and fed into a YOLOv8-OBB model, which predicts bounding box coordinates, dimensions, and angles.
2. **Orientation Phase**: The extracted crops are then analyzed by a specialized orientation model which determines if the crop needs further rotation to be properly upright.
3. **Extraction**: The application handles all HTML5 Canvas manipulations required to rotate, crop, and display the final refined images to the user.
