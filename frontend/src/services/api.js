import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const api = axios.create({
  baseURL: configuredBaseURL.replace(/\/+$/, ''),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('ayush_setu_token')
      : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const apiError = error?.response?.data?.error;
  if (typeof apiError === 'string' && apiError.trim()) return apiError;

  if (error?.request && !error?.response) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  return error?.message || fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof localStorage !== 'undefined') {
      // Keep the local demo session intact while clearing an expired API token.
      localStorage.removeItem('ayush_setu_token');
    }

    error.apiMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  },
);

export default api;

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const applicationAPI = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  getStatusHistory: (id) => api.get(`/applications/${id}/status-history`),
  updateStatus: (id, data = {}) => {
    const { status, ...details } = data;

    if (status === 'UNDER_REVIEW') {
      return api.patch(`/applications/${id}/review`);
    }

    if (status === 'APPROVED' || status === 'REJECTED') {
      return api.patch(`/applications/${id}/decide`, {
        decision: status,
        officerRemarks: details.officerRemarks ?? details.remarks,
      });
    }

    if (status === 'QUERY_RAISED') {
      return api.post(`/applications/${id}/queries`, {
        queryText: details.queryText ?? details.remarks,
      });
    }

    return Promise.reject(new Error(`Unsupported application status action: ${status || 'unknown'}`));
  },
};

export const documentAPI = {
  getByApplication: (appId) => api.get(`/applications/${appId}/documents`),
  upload: (appId, formData) => api.post(`/applications/${appId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verify: (docId, data) => api.patch(`/documents/${docId}/verify`, data),
  delete: (docId) => api.delete(`/documents/${docId}`),
};

export const startupAPI = {
  getProfile: (id) => api.get(`/startups/${id}`),
  updateProfile: (id, data) => api.put(`/startups/${id}`, data),
};

export const officerAPI = {
  getAssigned: (officerOrParams, params) => api.get('/officer/applications', {
    params: params ?? (typeof officerOrParams === 'object' ? officerOrParams : undefined),
  }),
  assign: (applicationId, data) => api.patch(`/applications/${applicationId}/assign`, data),
  startReview: (applicationId) => api.patch(`/applications/${applicationId}/review`),
  decide: (applicationId, data) => api.patch(`/applications/${applicationId}/decide`, data),
  requestClarification: (appId, data) => api.post(`/applications/${appId}/queries`, data),
};

export const queryAPI = {
  getByApplication: (appId) => api.get(`/applications/${appId}/queries`),
  respond: (queryId, data) => api.patch(`/queries/${queryId}/respond`, data),
  resolve: (queryId) => api.patch(`/queries/${queryId}/resolve`),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getOfficers: (params) => api.get('/admin/users', { params: { ...params, role: 'OFFICER' } }),
  toggleUserActive: (userId) => api.patch(`/admin/users/${userId}/toggle-active`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};
