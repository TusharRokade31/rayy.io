/**
 * Performance Optimization Utilities
 * Implements lazy loading, code splitting, and resource optimization
 */

// Lazy load images with intersection observer
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before visible
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Debounce function for scroll/resize events
export const debounce = (func, wait = 200) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Preload critical resources
export const preloadCriticalResources = (resources) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = resource.as;
    link.href = resource.href;
    if (resource.type) link.type = resource.type;
    if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
    document.head.appendChild(link);
  });
};

// Report web vitals
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((webVitals) => {
      webVitals.onCLS(onPerfEntry);
      // onFID deprecated, using onINP (Interaction to Next Paint) instead
      if (webVitals.onINP) {
        webVitals.onINP(onPerfEntry);
      } else if (webVitals.onFID) {
        webVitals.onFID(onPerfEntry);
      }
      webVitals.onFCP(onPerfEntry);
      webVitals.onLCP(onPerfEntry);
      webVitals.onTTFB(onPerfEntry);
    }).catch((error) => {
      console.warn('Web Vitals loading failed:', error);
    });
  }
};

// Optimize third-party scripts
export const loadScriptAsync = (src, id) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// Request idle callback polyfill
export const requestIdleCallbackPolyfill = (cb) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(cb);
  }
  return setTimeout(() => cb({ timeRemaining: () => 50 }), 1);
};

// Reduce layout thrashing
export const batchDOMReads = (reads) => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      const results = reads.map(read => read());
      resolve(results);
    });
  });
};

export const batchDOMWrites = (writes) => {
  requestAnimationFrame(() => {
    writes.forEach(write => write());
  });
};