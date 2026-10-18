import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (username, password, type = 'admin') =>
  api.post('/auth/login', { username, password, type });

export const getProjects  = ()                     => api.get('/projects');
export const addProject  = (payload) => api.post('/setup/projects', payload);
// Remove getProjects
export const getFilters = (params = {}) => api.get('/filters', { params });

export const getDashboard = (params = {}) => 
  api.get('/dashboard', { params });

export const getGridTrainer = (params = {}) =>
  api.get('/grid-trainer', { params });

export const getGridParticipant = (params = {}) =>
  api.get('/grid-participant', { params });

export const getPermissionAdmins  = ()       => api.get('/permissions/admins');
export const getPermissionOptions = (userId) => api.get('/permissions/options', { params: { userId } });
export const savePermissions      = (payload) => api.post('/permissions', payload);

export const getMe              = ()           => api.get('/chatbot/me');
export const getUsers           = ()           => api.get('/users');
export const getConversations   = ()           => api.get('/conversations');
export const createConversation = (peerId)     => api.post('/conversations', { peerId });
export const getMessages        = (id, params) => api.get(`/conversations/${id}/messages`, { params });
export const getTrainerToken    = (trainerId)  => api.post(`/chat/trainer-token/${trainerId}`);

export default api;