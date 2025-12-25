import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Use environment variable from mobile/.env
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                     process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// API Services
export const authService = {
  login: (email, password) => api.post('/auth/login', {email, password}),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  addChild: (data) => api.post('/auth/add-child', data),
  editChild: (index, data) => api.put(`/auth/edit-child/${index}`, data),
  deleteChild: (index) => api.delete(`/auth/delete-child/${index}`),
};

export const homeService = {
  getCategories: () => api.get('/categories'),
  getTrending: () => api.get('/home/trending'),
  getTrials: () => api.get('/home/trials'),
  getWorkshops: () => api.get('/home/workshops'),
  getCamps: () => api.get('/home/camps'),
};

export const listingService = {
  search: (params) => api.get('/search', {params}),
  getById: (id) => api.get(`/listings/${id}`),
  getSessions: (id) => api.get(`/listings/${id}/sessions`),
  getWorkshops: () => api.get('/home/workshops'),
  getCamps: () => api.get('/home/camps'),
};

export const sessionService = {
  getById: (id) => api.get(`/sessions/${id}`),
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  reschedule: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  getAvailableSessions: (id) => api.get(`/bookings/${id}/available-sessions`),
};

export const walletService = {
  getWallet: () => api.get('/wallet'),
  getCreditPlans: () => api.get('/credit-plans'),
  subscribePlan: (planId) => api.post('/credit-plans/subscribe', {plan_id: planId}),
};

export const invoiceService = {
  getMyInvoices: () => api.get('/invoices/my'),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
};

export const aiAdvisorService = {
  chat: (message, sessionId = null) => api.post('/ai-advisor/chat', {message, session_id: sessionId}),
  recommendClass: (childAge, interests = [], sessionId = null) => 
    api.post('/ai-advisor/recommend-class', {child_age: childAge, interests, session_id: sessionId}),
  askAboutListing: (listingId, question, listingInfo, sessionId = null) =>
    api.post('/ai-advisor/ask-about-listing', {listing_id: listingId, question, listing_info: listingInfo, session_id: sessionId}),
};
