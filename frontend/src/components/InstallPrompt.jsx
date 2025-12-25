import React, { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { isPWA, showIOSInstallInstructions } from '../utils/pwa';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Don't show if already installed
    if (isPWA()) {
      return;
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem('rrray_install_dismissed');
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const daysSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    // Check for iOS
    const isIOSDevice = showIOSInstallInstructions();
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('rrray_install_dismissed', Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
        padding: '1rem',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* App Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#3B82F6',
            flexShrink: 0
          }}
        >
          R
        </div>

        {/* Content */}
        <div style={{ flex: 1, color: 'white' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: '700',
              marginBottom: '0.25rem',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            Install rayy App
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              opacity: 0.9,
              marginBottom: '0.75rem',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            {isIOS
              ? 'Tap Share, then "Add to Home Screen"'
              : 'Install for quick access & offline use'}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isIOS && (
              <button
                onClick={handleInstall}
                style={{
                  background: 'white',
                  color: '#3B82F6',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                <Download size={16} />
                Install
              </button>
            )}
            {isIOS && (
              <div
                style={{
                  background: 'white',
                  color: '#3B82F6',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                <Share size={16} />
                Tap Share Icon
              </div>
            )}
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Later
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            flexShrink: 0
          }}
        >
          <X size={20} />
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;
