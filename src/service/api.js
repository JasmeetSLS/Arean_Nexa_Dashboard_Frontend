import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
export const login = (username, password, type = 'admin') =>
  api.post('/auth/login', { username, password, type });

// =====================================================================
// DASHBOARD / GRID / FILTERS
// =====================================================================
export const getGrid      = () => api.get('/grid');
export const getDashboard = () => api.get('/dashboard');
export const getFilters   = () => api.get('/filters');

// =====================================================================
// SETUP PANEL
// =====================================================================
export const getSetup  = ()        => api.get('/setup');
export const saveSetup = (payload) => api.post('/setup', payload);

// =====================================================================
// ROLES & PERMISSIONS
// =====================================================================
export const getPermissionAdmins  = ()       => api.get('/permissions/admins');
export const getPermissionOptions = (userId) => api.get('/permissions/options', { params: { userId } });
export const savePermissions      = (payload)=> api.post('/permissions', payload);

// =====================================================================
// CHAT
// =====================================================================
export const getMe              = ()       => api.get('/chatbot/me');
export const getUsers           = ()       => api.get('/users');
export const getConversations   = ()       => api.get('/conversations');
export const createConversation = (peerId) => api.post('/conversations', { peerId });
export const getMessages        = (id, params) =>
  api.get(`/conversations/${id}/messages`, { params });
export const getTrainerToken    = (trainerId) =>
  api.post(`/chat/trainer-token/${trainerId}`);

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