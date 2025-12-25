import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

const OptimizedVideoPlayer = ({ 
  src, 
  poster, 
  muted = true, 
  loop = true,
  controls = false,
  className = '',
  onPlay,
  onPause,
  showControls = false,
  lazyLoad = true
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(!lazyLoad); // If not lazy loading, always in view
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(!lazyLoad); // If not lazy loading, load immediately

  // Lazy load video when it enters viewport - MORE AGGRESSIVE for iOS
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // ONLY load video when user explicitly plays (don't auto-load)
            // This prevents iOS from preloading all videos
          } else {
            setIsInView(false);
            // Pause and unload video when out of view to save memory
            if (videoRef.current) {
              if (!videoRef.current.paused) {
                videoRef.current.pause();
              }
              setIsPlaying(false);
              // Aggressive memory cleanup for iOS
              videoRef.current.src = '';
              videoRef.current.load();
              setHasLoaded(false);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px' } // Only when actually visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, hasLoaded]);

  // Auto-play when in view (muted)
  useEffect(() => {
    if (!isInView || !hasLoaded) return;
    
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        setShowOverlay(false);
      } catch (error) {
        // Autoplay prevented by browser, user interaction needed
        console.log('Autoplay prevented:', error);
      }
    };

    // Small delay to ensure smooth loading
    const timer = setTimeout(() => {
      if (isInView) {
        playVideo();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isInView, hasLoaded]);

  const togglePlay = (e) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    // Load video on first play
    if (!hasLoaded && src) {
      video.src = src;
      video.load();
      setHasLoaded(true);
    }

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setShowOverlay(false);
        onPlay?.();
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setShowOverlay(true);
      onPause?.();
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={isInView && hasLoaded ? src : undefined}
        poster={poster}
        loop={loop}
        muted={muted}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="none"
        className="w-full h-full object-cover"
        controls={controls}
        onClick={togglePlay}
        style={{ objectFit: 'cover' }}
        onLoadStart={() => console.log('Video load started')}
        onError={(e) => console.error('Video error:', e)}
      />

      {/* Loading State */}
      {!hasLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-white/70 text-xs">Loading video...</p>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      {showControls && hasLoaded && (
        <>
          {/* Play/Pause Overlay */}
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              onClick={togglePlay}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl"
              >
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </motion.button>
            </motion.div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-1" />
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Video Badge */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-semibold flex items-center gap-1 z-10">
        <Play className="w-3 h-3" />
        Video
      </div>
    </div>
  );
};

export default OptimizedVideoPlayer;
