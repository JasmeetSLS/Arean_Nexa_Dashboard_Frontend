import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// =====================================================================
// AUTH
// =====================================================================
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

// =====================================================================
// DASHBOARD / GRID / FILTERS
// =====================================================================
export const getGrid      = () => api.get('/grid');
export const getDashboard = () => api.get('/dashboard');
export const getFilters   = () => api.get('/filters');

// =====================================================================
// CHAT APIs
// =====================================================================
export const getChatbotMe    = ()           => api.get('/chatbot/me');
export const getChatSummary  = ()           => api.get('/chat/summary');
export const getAllAdmins    = ()           => api.get('/chat/admins');
export const getAllTrainers  = ()           => api.get('/chat/trainers');

export const getChatMessages = (trainerId, params = {}) =>
  api.get(`/chat/${trainerId}/messages`, { params });

export const sendChatRest    = (trainerId, message) =>
  api.post(`/chat/${trainerId}/send`, { message });

export const markChatRead    = (trainerId) =>
  api.post(`/chat/${trainerId}/read`);

// =====================================================================
// EXPORT (Excel)
// =====================================================================
export const getExportUrl = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, v);
  });
  const token = localStorage.getItem('token');
  if (token) params.set('token', token);
  const qs = params.toString();
  return `${API_BASE_URL}/export/users${qs ? `?${qs}` : ''}`;
};

export default api;