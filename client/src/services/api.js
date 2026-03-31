import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ags-tms-backend.onrender.com/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ags_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ags_token');
      localStorage.removeItem('ags_user');
      localStorage.removeItem('ags_session');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;