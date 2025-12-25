import React, { useState, useEffect, useRef } from 'react';

/**
 * OptimizedImage component with native lazy loading and intersection observer fallback
 * Features:
 * - Native lazy loading (loading="lazy")
 * - Intersection Observer for better control
 * - Blur-up placeholder effect
 * - Error handling with fallback image
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  fallback = 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=Image+Not+Available',
  priority = false, // Set true for above-the-fold images
  aspectRatio = null, // e.g., '16/9', '4/3', '1/1'
  objectFit = 'cover',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return; // Skip observer for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageSrc = hasError ? fallback : src;

  // Add responsive image params if width/height provided
  const optimizedSrc = imageSrc && width && height 
    ? `${imageSrc}${imageSrc.includes('?') ? '&' : '?'}w=${width}&h=${height}&fit=crop`
    : imageSrc;

  return (
    <div
      ref={imgRef}
      style={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: aspectRatio || undefined,
        overflow: 'hidden',
        backgroundColor: '#e2e8f0',
        ...style,
      }}
      className={className}
    >
      {isInView && (
        <>
          {/* Blur placeholder */}
          {!isLoaded && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          )}
          
          {/* Actual image */}
          <img
            src={optimizedSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: objectFit,
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
            {...props}
          />
        </>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default OptimizedImage;
