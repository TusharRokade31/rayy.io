import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CapacitorService from '../services/capacitor';

const MobileRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if on root path
    if (location.pathname === '/') {
      // Check if native app OR mobile viewport
      const isMobileViewport = window.innerWidth <= 768;
      const isNativeApp = CapacitorService.isNative();
      
      if (isNativeApp || isMobileViewport) {
        // Redirect to mobile app
        navigate('/mobile', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return null;
};

export default MobileRedirect;
