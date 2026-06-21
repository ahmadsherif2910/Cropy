/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen, GalleryImage } from './types';
import UploadView from './components/UploadView';
import ProcessingView from './components/ProcessingView';
import GalleryView from './components/GalleryView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<GalleryImage[]>([]);
  const [modelSrc, setModelSrc] = useState<string | File>('./best.onnx');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'upload':
        return (
          <UploadView 
            files={uploadedFiles}
            setFiles={setUploadedFiles}
            onStartProcessing={(src) => {
              setModelSrc(src);
              setActiveScreen('processing');
            }} 
          />
        );
      case 'processing':
        return (
          <ProcessingView 
            files={uploadedFiles}
            modelSrc={modelSrc}
            onComplete={(images) => {
              setProcessedImages(images);
              setActiveScreen('gallery');
            }} 
            onCancel={() => {
              setUploadedFiles([]);
              setActiveScreen('upload');
            }} 
          />
        );
      case 'gallery':
        return (
          <GalleryView 
            images={processedImages}
            onNewUpload={() => {
              setUploadedFiles([]);
              setProcessedImages([]);
              setActiveScreen('upload');
            }} 
          />
        );
      default:
        return (
          <UploadView 
            files={uploadedFiles}
            setFiles={setUploadedFiles}
            onStartProcessing={(src) => {
              setModelSrc(src);
              setActiveScreen('processing');
            }} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}


