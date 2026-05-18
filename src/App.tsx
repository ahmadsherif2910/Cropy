/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Screen } from './types';
import UploadView from './components/UploadView';
import ProcessingView from './components/ProcessingView';
import GalleryView from './components/GalleryView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('upload');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'upload':
        return <UploadView onStartProcessing={() => setActiveScreen('processing')} />;
      case 'processing':
        return <ProcessingView onComplete={() => setActiveScreen('gallery')} onCancel={() => setActiveScreen('upload')} />;
      case 'gallery':
        return <GalleryView onNewUpload={() => setActiveScreen('upload')} />;
      default:
        return <UploadView onStartProcessing={() => setActiveScreen('processing')} />;
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

