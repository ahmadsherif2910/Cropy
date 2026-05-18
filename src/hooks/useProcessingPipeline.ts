import { useState, useEffect } from 'react';

interface UseProcessingPipelineProps {
  totalPhotos?: number;
  onComplete: () => void;
}

export function useProcessingPipeline({ totalPhotos = 10, onComplete }: UseProcessingPipelineProps) {
  const [state, setState] = useState({ stepIndex: 0, photo: 0 });

  const totalSteps = 3;
  const currentStepIndex = state.stepIndex;
  const currentPhoto = state.photo;

  const progress = currentStepIndex >= totalSteps
    ? 100
    : (currentPhoto / totalPhotos) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.photo < totalPhotos) {
          return {
            ...prev,
            photo: prev.photo + 1,
          };
        } else {
          const nextStep = prev.stepIndex + 1;
          if (nextStep >= totalSteps) {
            clearInterval(interval);
            setTimeout(onComplete, 1000);
            return {
              stepIndex: totalSteps,
              photo: totalPhotos,
            };
          }
          return {
            stepIndex: nextStep,
            photo: 1,
          };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete, totalPhotos]);

  const getStepStatus = (stepIndex: number): 'done' | 'active' | 'waiting' => {
    if (currentStepIndex > stepIndex) return 'done';
    if (currentStepIndex === stepIndex) return 'active';
    return 'waiting';
  };

  return {
    currentStepIndex,
    currentPhoto,
    totalPhotos,
    progress,
    getStepStatus,
  };
}
