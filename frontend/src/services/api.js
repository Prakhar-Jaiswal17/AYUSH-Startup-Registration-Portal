import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ayush_setu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ayush_setu_auth');
      localStorage.removeItem('ayush_setu_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints (to be connected to Express backend)
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Application endpoints
export const applicationAPI = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
};

// Document endpoints
export const documentAPI = {
  getByApplication: (appId) => api.get(`/applications/${appId}/documents`),
  getByStartup: (startupId) => api.get(`/startups/${startupId}/documents`),
  upload: (appId, formData) => api.post(`/applications/${appId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verify: (docId, data) => api.patch(`/documents/${docId}/verify`, data),
  delete: (docId) => api.delete(`/documents/${docId}`),
};

// Startup endpoints
export const startupAPI = {
  getProfile: (id) => api.get(`/startups/${id}`),
  updateProfile: (id, data) => api.put(`/startups/${id}`, data),
};

// Officer endpoints
export const officerAPI = {
  getAssigned: (officerId, params) => api.get(`/officers/${officerId}/applications`, { params }),
  requestClarification: (appId, data) => api.post(`/applications/${appId}/clarify`, data),
};

// Admin endpoints
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getOfficers: (params) => api.get('/admin/officers', { params }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

// Notification endpoints
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Resource endpoints
export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
};

