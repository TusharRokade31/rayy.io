import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CapacitorService from '../services/capacitor';

const MobileDetector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is on mobile app (Capacitor) and on home page
    if (CapacitorService.isNative() && location.pathname === '/') {
      navigate('/mobile', { replace: true });
    }
  }, [location.pathname]);

  return null;
};

export default MobileDetector;
