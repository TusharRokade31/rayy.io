/**
 * API Configuration with error handling and fallback
 * Prevents app from freezing if backend is unavailable
 */

import axios from 'axios';

// Primary backend URL (production)
const PRIMARY_BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://rrray.com';

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: PRIMARY_BACKEND,
  timeout: 15000, // 15 second timeout to prevent indefinite loading
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server took too long to respond');
      error.message = 'Server is taking too long to respond. Please check your internet connection.';
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - cannot reach server');
      error.message = 'Cannot connect to server. Please check your internet connection.';
    } else if (error.response) {
      // Server responded with error
      console.error(`Server error: ${error.response.status}`, error.response.data);
    } else {
      console.error('Unknown error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export configured axios instance
export default apiClient;

// Export API base URL
export const API_BASE_URL = PRIMARY_BACKEND;
export const API = `${PRIMARY_BACKEND}/api`;

// Health check function
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${PRIMARY_BACKEND}/api/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Backend health check failed:', error.message);
    return false;
  }
};
