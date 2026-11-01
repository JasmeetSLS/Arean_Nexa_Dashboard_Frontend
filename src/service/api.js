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
export const addProject  = (payload) => api.post('/projects', payload);

// ---- Participants Excel ----
export const downloadParticipantTemplate = () =>
  api.get('/participants/template', { responseType: 'blob' });

export const uploadParticipants = (file) => {
  const fd = new FormData();
  fd.append('file', file);       // no `project` field anymore
  return api.post('/participants/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
// Remove getProjects
export const getFilters = (params = {}) => api.get('/filters', { params });

export const getDashboard = (params = {}) => 
  api.get('/dashboard', { params });

export const getGridTrainer = (params = {}) =>
  api.get('/grid-trainer', { params });

export const getGridParticipant = (params = {}) =>
  api.get('/grid-participant', { params });

export const getMyPermissions = () => api.get('/my-permissions');

export const getPermissionAdmins  = ()       => api.get('/permissions/admins');
export const getPermissionOptions = (userId) => api.get('/permissions/options', { params: { userId } });
export const savePermissions      = (payload) => api.post('/permissions', payload);


export const getChatUsers   = ()                    => api.get('/chat/users');
export const getChatMessages = (userId, params = {}) =>
  api.get(`/chat/messages/${userId}`, { params });
export const postChatMessage = (peerId, message)    =>
  api.post('/chat/messages', { peerId, message });

// REPORTS (Arena)

export const getArenaFilters = (params = {}) =>
  api.get('/arena-filters', { params });

export const exportArenaDailyReport = (params = {}) =>
  api.get('/export-arena-daily-report', { params, responseType: 'blob' });

export const exportArenaOverallAttendance = (params = {}) =>
  api.get('/arena-overall-attendance', { params, responseType: 'blob' });

export const exportArenaOverallResult = (params = {}) =>
  api.get('/export-arena-overall-result', { params, responseType: 'blob' });

export const exportArenaWinner = (params = {}) =>
  api.get('/export-arena-winner', { params, responseType: 'blob' });

// REPORTS (TV)
export const exportTVMorning = (params = {}) =>
  api.get('/export-tv-morning', { params, responseType: 'blob' });

export const exportTVOverallAttendance = (params = {}) =>
  api.get('/export-tv-overall-attendance', { params, responseType: 'blob' });

export const exportTVOverallResult = (params = {}) =>
  api.get('/export-tv-overall-result', { params, responseType: 'blob' });

export const exportTVWinner = (params = {}) =>
  api.get('/export-tv-winner', { params, responseType: 'blob' });

// ZIP of all winner files — name it explicitly so it doesn't clash with the single-winner export
export const exportTVWinnersZIP = (params = {}) =>
  api.get('/export-tv-winners-zip', { params, responseType: 'blob' });

export const getTVFilters = () => api.get('/tv-filters');

export default api;