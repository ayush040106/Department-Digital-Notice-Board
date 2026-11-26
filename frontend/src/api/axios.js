import axios from 'axios';
import { handleMockRequest, resetDemoData } from './mockApi';

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('noticeboard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('noticeboard_token');
        localStorage.removeItem('noticeboard_user');
      }
    }
    return Promise.reject(error);
  }
);

const api = USE_MOCK_API
  ? {
      get: (url, config) => handleMockRequest('GET', url, null, config),
      post: (url, data, config) => handleMockRequest('POST', url, data, config),
      put: (url, data, config) => handleMockRequest('PUT', url, data, config),
      delete: (url, config) => handleMockRequest('DELETE', url, null, config),
    }
  : axiosInstance;

export { resetDemoData, USE_MOCK_API };

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return error?.response?.data?.message || error?.message || fallback;
};

export default api;
