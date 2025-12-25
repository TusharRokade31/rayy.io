/**
 * Runtime Configuration
 * Automatically detects environment and sets correct API URL
 * Supports web browsers and Capacitor native apps (iOS/Android)
 */

const getRuntimeConfig = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Check if running in Capacitor native app
  const isCapacitor = protocol === 'capacitor:' || 
                      protocol === 'ionic:' || 
                      (hostname === 'localhost' && protocol === 'https:');
  
  // Capacitor native apps (iOS/Android) - use production API
  if (isCapacitor) {
    // Use environment variable if set, otherwise use production domain
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://rrray.com';
    return {
      API_URL: `${backendUrl}/api`,
      BASE_URL: backendUrl,
      ENV: 'mobile-app'
    };
  }
  
  // Production domain (web)
  if (hostname === 'rrray.com' || hostname === 'www.rrray.com') {
    return {
      API_URL: `${protocol}//rrray.com/api`,
      BASE_URL: `${protocol}//rrray.com`,
      ENV: 'production'
    };
  }
  
  // Emergent preview domains (web)
  // CRITICAL FIX: Use the correct environment variable access for React
  if (hostname.includes('emergentagent.com') || hostname.includes('emergent.host')) {
    // In React, environment variables are available at build time, not runtime
    const backendUrl = process.env.REACT_APP_BACKEND_URL || `${protocol}//${hostname}`;
    return {
      API_URL: `${backendUrl}/api`,
      BASE_URL: `${protocol}//${hostname}`,
      ENV: 'preview'
    };
  }
  
  // Local development (web)
  if (hostname === 'localhost' || hostname === '127.0.0.1:8001') {
    return {
      API_URL: 'http://localhost:8001/api',
      BASE_URL: 'http://localhost:3000',
      ENV: 'development'
    };
  }
  
  // Fallback: use current origin
  return {
    API_URL: `${protocol}//${hostname}/api`,
    BASE_URL: `${protocol}//${hostname}`,
    ENV: 'unknown'
  };
};

const config = getRuntimeConfig();

export const API_URL = config.API_URL;
export const BASE_URL = config.BASE_URL;
export const ENV = config.ENV;

export default config;
