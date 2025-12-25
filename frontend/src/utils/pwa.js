// PWA Installation and Service Worker utilities
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
};

export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
};

// Check if app is running as PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Check if PWA is installable
export const isInstallable = () => {
  return !isPWA() && 'BeforeInstallPromptEvent' in window;
};

// Get install prompt handler
export const getInstallPrompt = () => {
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('💾 PWA install prompt ready');
  });

  return {
    show: async () => {
      if (!deferredPrompt) {
        console.log('No install prompt available');
        return null;
      }

      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      
      // Clear the deferredPrompt
      deferredPrompt = null;
      
      return outcome;
    },
    isAvailable: () => deferredPrompt !== null
  };
};

// iOS Install Instructions
export const showIOSInstallInstructions = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandaloneMode = 'standalone' in window.navigator && window.navigator.standalone;
  
  return isIOS && !isInStandaloneMode;
};
