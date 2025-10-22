import axios, { AxiosError } from 'axios';

// In development, use relative path (Vite proxy will forward to backend)
// In production, use VITE_API_URL if set, otherwise use relative path (same origin)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.debug('🌐 [API] Request to:', config.url, '- Token:', token ? `${token.substring(0, 20)}...` : 'NONE');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('🌐 [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.debug('🌐 [API] Response from:', response.config.url, '- Status:', response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error('🌐 [API] Response error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('🌐 [API] 401 UNAUTHORIZED - Clearing auth and redirecting to login');
      console.trace('🌐 [API] 401 stack trace');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

export default api;
