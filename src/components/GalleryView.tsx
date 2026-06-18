import React, { useState, useEffect, useCallback } from 'react';
import { Download, Plus, Search, Filter, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryImage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';

interface GalleryViewProps {
  images: GalleryImage[];
  onNewUpload: () => void;
}

export default function GalleryView({ images, onNewUpload }: GalleryViewProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [displayCount, setDisplayCount] = useState(images.length || 10);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [expandedImage, setExpandedImage] = useState<GalleryImage | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Touch state for swipe to navigate
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  
  const displayedImages = images.slice(0, displayCount);

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedImages);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedImages(newSet);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const zip = new JSZip();
      
      const targetImages = selectedImages.size > 0 
        ? images.filter(img => selectedImages.has(img.id))
        : images;

      const fetchPromises = targetImages.map(async (img) => {
        const response = await fetch(img.url);
        const blob = await response.blob();
        zip.file(img.filename, blob);
      });

      await Promise.all(fetchPromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `cropy_export_${Date.now()}.zip`;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      
    } catch (err) {
      console.error("Failed to generate zip file:", err);
      alert("An error occurred while preparing the download.");
    } finally {
      setIsDownloading(false);
    }
  };

  const currentIndex = expandedImage ? displayedImages.findIndex(img => img.id === expandedImage.id) : -1;

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setExpandedImage(displayedImages[currentIndex - 1]);
    }
  }, [currentIndex, displayedImages]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex !== -1 && currentIndex < displayedImages.length - 1) {
      setExpandedImage(displayedImages[currentIndex + 1]);
    }
  }, [currentIndex, displayedImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!expandedImage) return;
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setExpandedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage, handlePrevious, handleNext]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-full bg-[#F4F1EA]">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 border-b-2 border-black pb-6 gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mb-2 block">Output / Asset Review</span>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-tight md:leading-[0.85]">Gallery<br />Overview</h1>
          <p className="text-on-surface-variant text-xs md:text-sm font-medium mt-4">
            {displayedImages.length} processed images ready for deployment.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-1">
          <button 
            onClick={onNewUpload}
            className="brutalist-button bg-primary text-black flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={20} />
            New Upload
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className={`brutalist-button flex items-center justify-center gap-2 text-sm transition-all ${
              isDownloading ? 'bg-stone-500 text-stone-200 cursor-wait' : 'bg-black text-white'
            }`}
          >
            <Download size={20} className={isDownloading ? "animate-pulse" : ""} />
            {isDownloading ? 'Zipping...' : (selectedImages.size > 0 ? `Download Selected (${selectedImages.size})` : 'Download All')}
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 mb-12">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0_0_#000000] transition-all font-bold uppercase tracking-widest text-xs"
            />
          </div>
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`brutalist-button flex items-center gap-2 transition-colors ${isFilterExpanded ? 'bg-primary text-black' : 'bg-white text-black'}`}
          >
            <Filter size={18} />
            Filter
          </button>
        </div>

        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0_0_#000000]"
            >
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest">Display Limit</span>
                    <span className="font-mono text-xs font-bold bg-primary px-2 py-1 border border-black">{displayCount} / {images.length}</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max={images.length}
                    value={displayCount}
                    onChange={(e) => setDisplayCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-stone-200 appearance-none cursor-pointer accent-black outline-none border border-black"
                  />
                  <div className="flex justify-between mt-2 text-[8px] font-bold uppercase opacity-50">
                    <span>1 Asset</span>
                    <span>{images.length} Assets</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[4, 8, 12, 16, 24].map((num) => {
                    const isDisabled = num > images.length;
                    return (
                      <button
                        key={num}
                        disabled={isDisabled}
                        onClick={() => setDisplayCount(num)}
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter border transition-colors ${
                          isDisabled
                            ? 'border-black/20 text-black/30 bg-stone-100 cursor-not-allowed opacity-50'
                            : displayCount === num
                              ? 'border-black bg-black text-white'
                              : 'border-black bg-white text-black hover:bg-stone-50'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setDisplayCount(images.length)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter border border-black transition-colors ${
                      displayCount === images.length ? 'bg-black text-white' : 'bg-white text-black hover:bg-stone-50'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayedImages.map((image, idx) => (
          <ImageCard 
            key={`${image.id}-${idx}`} 
            image={image} 
            index={idx} 
            isSelected={selectedImages.has(image.id)}
            onToggleSelect={toggleSelection}
            onClick={() => setExpandedImage(image)}
          />
        ))}
      </div>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="absolute top-6 right-6 flex gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement('a');
                  a.href = expandedImage.url;
                  a.download = expandedImage.filename;
                  a.click();
                }}
                className="brutalist-button bg-primary text-black flex items-center gap-2 p-2"
              >
                <Download size={20} />
                <span className="hidden sm:inline text-xs">Download</span>
              </button>
              <button 
                onClick={() => setExpandedImage(null)}
                className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {currentIndex > 0 && (
              <button 
                onClick={handlePrevious}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-primary transition-colors z-10"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {currentIndex < displayedImages.length - 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-primary transition-colors z-10"
              >
                <ChevronRight size={32} />
              </button>
            )}

            <img 
              src={expandedImage.url} 
              alt={expandedImage.filename}
              className="max-w-[80vw] max-h-[70vh] object-contain border-4 border-white shadow-[16px_16px_0_0_#E0FF62]"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="mt-8 bg-white border-2 border-black p-4 inline-flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">
                {currentIndex + 1} / {displayedImages.length}
              </span>
              <span className="font-mono font-bold text-sm">{expandedImage.filename}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ImageCardProps {
  image: GalleryImage;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
}

function ImageCard({ image, index, isSelected, onToggleSelect, onClick }: ImageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className={`group relative flex flex-col border-2 transition-all cursor-pointer overflow-hidden ${
        isSelected ? 'bg-primary border-black shadow-[8px_8px_0_0_#000000] -translate-y-2' : 'bg-white border-black hover:-translate-y-2 hover:shadow-[8px_8px_0_0_#000000]'
      }`}
    >
      <div className="aspect-square relative overflow-hidden border-b-2 border-black">
        <img 
          src={image.url} 
          alt={image.filename} 
          className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 px-2 py-1 bg-primary border border-black text-[9px] font-black uppercase tracking-widest z-10">
          {image.type}
        </div>
        
        {/* Large checkmark overlay when selected */}
        <AnimatePresence>
          {isSelected && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none"
            >
              <div className="w-16 h-16 bg-black text-primary rounded-full flex items-center justify-center border-4 border-primary">
                <Check size={32} strokeWidth={4} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className={`p-4 flex items-center justify-between transition-colors ${isSelected ? 'bg-primary' : 'bg-white group-hover:bg-stone-50'}`}>
        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
          {image.filename}
        </span>
        
        <div className="flex items-center gap-2">
          {/* Select Button */}
          <button 
            onClick={(e) => onToggleSelect(image.id, e)}
            className={`w-8 h-8 border border-black flex items-center justify-center transition-all ${
              isSelected ? 'bg-black text-white' : 'bg-white hover:bg-stone-200'
            }`}
            title={isSelected ? "Deselect" : "Select"}
          >
            <Check size={14} className={isSelected ? "opacity-100" : "opacity-30"} />
          </button>
          
          {/* Direct Download Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const a = document.createElement('a');
              a.href = image.url;
              a.download = image.filename;
              a.click();
            }}
            className="w-8 h-8 border border-black flex items-center justify-center bg-white hover:bg-black hover:text-white transition-all"
            title="Download image"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
