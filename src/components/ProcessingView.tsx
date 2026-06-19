import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, RefreshCw, MoreHorizontal, X } from 'lucide-react';
import { useProcessingPipeline } from '../hooks/useProcessingPipeline';
import { GalleryImage } from '../types';

interface ProcessingViewProps {
  files: File[];
  modelSrc: string | File;
  onComplete: (images: GalleryImage[]) => void;
  onCancel: () => void;
}

export default function ProcessingView({ files, modelSrc, onComplete, onCancel }: ProcessingViewProps) {
  const {
    currentStepIndex,
    currentPhoto,
    totalPhotos,
    progress,
    getStepStatus
  } = useProcessingPipeline({ files, modelSrc, onComplete });


  const radius = 130;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#F4F1EA] relative">
      <div className="text-center mb-8 md:mb-12 flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mb-2">Operation / Batch Optimize</span>
        <h2 className="font-display text-4xl md:text-7xl font-bold tracking-tighter uppercase leading-tight md:leading-[0.85] mb-2">Optimizing<br />Layouts</h2>
        <p className="text-on-surface-variant font-medium text-xs md:text-sm">Applying structural intelligence to your batch.</p>
      </div>

      <div className="relative w-full max-w-[340px] md:max-w-[400px] aspect-square mb-12 md:mb-16 flex items-center justify-center shrink-0">
        {/* Simple Ring Background */}
        <div className="absolute inset-0 rounded-full border-4 border-black/5" />

        {/* Progress Circle SVG */}
        <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(224,255,98,0.2)]" viewBox="0 0 400 400">
          <circle
            cx="200"
            cy="200"
            r={radius}
            fill="none"
            stroke="black"
            strokeOpacity="0.03"
            strokeWidth="32"
          />
          <motion.circle
            cx="200"
            cy="200"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="32"
            className="text-primary"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
          <circle
            cx="200"
            cy="200"
            r="146"
            fill="none"
            stroke="black"
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="200"
            r="114"
            fill="none"
            stroke="black"
            strokeWidth="2"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center m-12 md:m-16 bg-white border-2 border-black rounded-full shadow-[inner_0_4px_10px_rgba(0,0,0,0.05)]">
          <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] mb-2 opacity-50">Ingesting</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-none">
              {progress >= 100 ? totalPhotos : currentPhoto}
            </span>
            <span className="text-xl md:text-2xl font-bold tracking-tighter">/ {totalPhotos}</span>
          </div>
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2">
            {currentStepIndex === 1 ? 'crops' : 'photos'}
          </span>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 text-center">Runtime Logs</h3>
        <div className="space-y-2">
          {modelSrc !== 'sam3-external' && (
            <OperationItem
              status={getStepStatus(0)}
              label="Auto-cropping"
            />
          )}
          <OperationItem
            status={getStepStatus(1)}
            label="Rotating & Straightening"
          />
        </div>
      </div>

      {/* Sticky Action Button Container matched to UploadView */}
      <div className="flex justify-center sticky bottom-6 md:bottom-8 z-50 pointer-events-none mt-12 w-full">
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="brutalist-button bg-black text-white shadow-[8px_8px_0_0_#E0FF62] flex items-center gap-4 text-lg border-primary border-4 whitespace-nowrap min-w-[280px] md:min-w-0 pointer-events-auto"
        >
          <div className="w-10 h-10 bg-primary flex items-center justify-center text-black">
            <X size={24} />
          </div>
          <span className="mr-4 text-lg font-bold uppercase tracking-tighter">Cancel Batch</span>
        </motion.button>
      </div>
    </div>
  );
}

function OperationItem({ status, label }: { status: 'done' | 'active' | 'waiting', label: string }) {
  return (
    <div className={`p-4 border-2 transition-all flex items-center justify-between ${status === 'active' ? 'bg-primary border-black shadow-[4px_4px_0_0_#000000] translate-x-1 -translate-y-1' : 'bg-white border-black/50 opacity-60'
      }`}>
      <div className="flex items-center gap-4">
        {status === 'done' && <CheckCircle2 size={24} className="text-black" />}
        {status === 'active' && <RefreshCw size={24} className="text-black animate-spin" />}
        {status === 'waiting' && <MoreHorizontal size={24} className="text-black/30" />}

        <span className={`text-xs font-bold uppercase tracking-widest ${status === 'done' ? 'line-through opacity-50' : 'text-black'}`}>
          {label}
        </span>
      </div>

      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border border-black ${status === 'done' ? 'bg-black text-white' :
        status === 'active' ? 'bg-white text-black' : 'bg-transparent text-black opacity-30'
        }`}>
        {status === 'done' ? 'Done' : status === 'active' ? 'Active' : 'Wait'}
      </span>
    </div>
  );
}