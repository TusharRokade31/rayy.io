import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

const VideoPlayer = ({ 
  src, 
  poster, 
  autoPlay = false, 
  muted = true, 
  loop = true,
  controls = false,
  className = '',
  onPlay,
  onPause,
  showControls = false
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [showOverlay, setShowOverlay] = useState(!autoPlay);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Intersection Observer for autoplay on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && autoPlay) {
            video.play().catch(() => {
              // Autoplay failed, mute and try again
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

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
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        muted={muted}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="metadata"
        className="w-full h-full object-cover"
        controls={controls}
        onClick={togglePlay}
        style={{ objectFit: 'cover' }}
      />

      {/* Custom Controls Overlay */}
      {showControls && (
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
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-semibold flex items-center gap-1">
        <Play className="w-3 h-3" />
        Video
      </div>
    </div>
  );
};

export default VideoPlayer;
