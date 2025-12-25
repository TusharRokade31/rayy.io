import { useState, useEffect } from 'react';

export function useLocationPref() {
  const [loc, setLoc] = useState(() => {
    const stored = localStorage.getItem("rrray_location");
    return stored ? JSON.parse(stored) : null;
  });

  const ask = () => {
    if (!navigator.geolocation) {
      setLoc({ denied: true, error: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          ts: Date.now(),
          method: 'gps'
        };
        localStorage.setItem("rrray_location", JSON.stringify(newLoc));
        setLoc(newLoc);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoc({ denied: true, error: error.message });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const setManualLocation = (pin, city) => {
    // Simple PIN to coordinates mapping for Gurgaon area
    // In production, use a proper geocoding service
    const pinMap = {
      '122001': { lat: 28.4595, lng: 77.0826, city: 'Gurgaon' },
      '122002': { lat: 28.4519, lng: 77.0931, city: 'Gurgaon' },
      '122003': { lat: 28.4942, lng: 77.0880, city: 'Gurgaon' },
      '122004': { lat: 28.4601, lng: 77.0469, city: 'Gurgaon' },
    };

    const coords = pinMap[pin] || { lat: 28.4595, lng: 77.0826, city: city || 'Gurgaon' };
    
    const newLoc = {
      ...coords,
      pin,
      ts: Date.now(),
      method: 'manual'
    };
    
    localStorage.setItem("rrray_location", JSON.stringify(newLoc));
    setLoc(newLoc);
  };

  const setOnlineOnly = () => {
    const newLoc = {
      onlineOnly: true,
      ts: Date.now(),
      method: 'online'
    };
    localStorage.setItem("rrray_location", JSON.stringify(newLoc));
    setLoc(newLoc);
  };

  const clearLocation = () => {
    localStorage.removeItem("rrray_location");
    setLoc(null);
  };

  const saveToProfile = async (token) => {
    if (!loc || !token) return;
    
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/auth/update-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loc)
      });
    } catch (error) {
      console.error('Failed to save location to profile:', error);
    }
  };

  return { 
    loc, 
    setLoc, 
    ask, 
    setManualLocation, 
    setOnlineOnly, 
    clearLocation,
    saveToProfile,
    hasLocation: Boolean(loc && !loc.denied),
    isOnlineOnly: Boolean(loc?.onlineOnly),
    isDenied: Boolean(loc?.denied)
  };
}
