import React, { useState } from 'react';
import { Download, Plus, Search, Filter, Check } from 'lucide-react';
import { GALLERY_IMAGES } from '../constants';
import { GalleryImage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryViewProps {
  images: GalleryImage[];
  onNewUpload: () => void;
}

export default function GalleryView({ images, onNewUpload }: GalleryViewProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [displayCount, setDisplayCount] = useState(images.length || 10);
  
  const displayedImages = images.slice(0, displayCount);

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
          <button className="brutalist-button bg-black text-white flex items-center justify-center gap-2 text-sm">
            <Download size={20} />
            Download All
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
          <ImageCard key={`${image.id}-${idx}`} image={image} index={idx} />
        ))}
      </div>
    </div>
  );
}

interface ImageCardProps {
  image: GalleryImage;
  index: number;
  key?: string;
}

function ImageCard({ image, index }: ImageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col bg-white border-2 border-black hover:-translate-y-2 hover:shadow-[8px_8px_0_0_#000000] transition-all cursor-pointer overflow-hidden"
    >
      <div className="aspect-square relative overflow-hidden border-b-2 border-black">
        <img 
          src={image.url} 
          alt={image.filename} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 px-2 py-1 bg-primary border border-black text-[9px] font-black uppercase tracking-widest">
          {image.type}
        </div>
      </div>
      
      <div className="p-4 flex items-center justify-between bg-white group-hover:bg-primary transition-colors">
        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
          {image.filename}
        </span>
        <div className="w-8 h-8 border border-black flex items-center justify-center bg-white group-hover:invert transition-all">
          <Download size={14} />
        </div>
      </div>
    </motion.div>
  );
}
