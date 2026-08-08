import axios from 'axios';

/**
 * Axios instance configured for the Cafe API backend
 * Base URL read from environment variable or falls back to localhost:5000
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — attaches the JWT token from localStorage to every request
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cafeToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles 401 globally (token expired / invalid)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data and redirect to login
      localStorage.removeItem('cafeToken');
      localStorage.removeItem('cafeUser');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
