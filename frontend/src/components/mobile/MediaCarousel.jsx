import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from './VideoPlayer';
import { ChevronLeft, ChevronRight, Play, Image as ImageIcon } from 'lucide-react';

const MediaCarousel = ({ media = [], className = '', autoPlayVideos = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia?.type === 'video' || 
                  currentMedia?.url?.match(/\.(mp4|webm|ogg)$/i) ||
                  currentMedia?.includes?.('.mp4') || 
                  currentMedia?.includes?.('.webm');

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const getMediaUrl = (item) => {
    if (typeof item === 'string') return item;
    return item?.url || item?.src || '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Media Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {isVideo ? (
            <VideoPlayer
              src={getMediaUrl(currentMedia)}
              poster={currentMedia?.thumbnail || media[0]}
              autoPlay={autoPlayVideos}
              muted={true}
              loop={true}
              showControls={true}
              className="w-full h-full"
            />
          ) : (
            <img
              src={getMediaUrl(currentMedia)}
              alt={`Media ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-20"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-20"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {media.items(item, idx) => {
            const itemIsVideo = item?.type === 'video' || 
                               item?.url?.match(/\.(mp4|webm|ogg)$/i) ||
                               (typeof item === 'string' && item.match(/\.(mp4|webm|ogg)$/i));
            
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all ${
                  idx === currentIndex
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50'
                } rounded-full flex items-center justify-center`}
              >
                {itemIsVideo && idx === currentIndex && (
                  <Play className="w-3 h-3" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Media Counter */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-semibold z-20">
        {currentIndex + 1} / {media.length}
      </div>
    </div>
  );
};

export default MediaCarousel;
