import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';
const TOKEN_KEY = 'ayush_setu_token';
const AUTH_STORAGE_KEY = 'ayush_setu_auth';

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
      ? localStorage.getItem(TOKEN_KEY)
      : null;
    const path = (config.url || '').replace(/^\/+/, '');
    const isPublicAuthRequest = path === 'auth/login' || path === 'auth/register';

    if (token && !isPublicAuthRequest) {
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
    const requestAuthorization = error.config?.headers?.Authorization
      || error.config?.headers?.authorization
      || error.config?.headers?.get?.('Authorization');
    const currentToken = typeof localStorage !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY)
      : null;
    if (error.response?.status === 401 && requestAuthorization && requestAuthorization === (currentToken ? `Bearer ${currentToken}` : null)) {
      localStorage.removeItem(TOKEN_KEY);
      try {
        const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
        if (stored?.source === 'api') {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('ayush:auth-expired'));
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('ayush:auth-expired'));
      }
    }

    error.apiMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  },
);

export default api;

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (token) => api.post('/auth/logout', null, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }),
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
  getMyProfile: () => api.get('/startups/me'),
  updateMyProfile: (data) => api.put('/startups/me', data),
  getProfile: (id) => api.get(`/startups/${id}`),
  updateProfile: (id, data) => api.put(`/startups/${id}`, data),
};

export const officerAPI = {
  getAssigned: (officerOrParams, params) => api.get('/officer/applications', {
    params: params ?? (typeof officerOrParams === 'object' ? officerOrParams : undefined),
  }),
  getOfficers: () => api.get('/officer/officers'),
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
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

const resourceCache = new Map();
const RESOURCE_CACHE_TTL_MS = 60 * 1000;
const RESOURCE_CACHE_MAX_ENTRIES = 100;

function resourceCacheKey(params) {
  const normalizedParams = Object.fromEntries(
    Object.entries(params || {}).sort(([left], [right]) => left.localeCompare(right)),
  );
  return JSON.stringify(normalizedParams);
}

export const resourceAPI = {
  getAll: (params) => {
    const now = Date.now();
    for (const [key, entry] of resourceCache) {
      if (now - entry.timestamp >= RESOURCE_CACHE_TTL_MS) resourceCache.delete(key);
    }

    const cacheKey = resourceCacheKey(params);
    const cached = resourceCache.get(cacheKey);
    if (cached) {
      // Keep recently used entries at the end so eviction behaves like a small LRU cache.
      resourceCache.delete(cacheKey);
      resourceCache.set(cacheKey, cached);
      return Promise.resolve(cached.data);
    }
    return api.get('/resources', { params }).then((response) => {
      if (resourceCache.size >= RESOURCE_CACHE_MAX_ENTRIES) {
        const oldestKey = resourceCache.keys().next().value;
        if (oldestKey !== undefined) resourceCache.delete(oldestKey);
      }
      resourceCache.set(cacheKey, { timestamp: Date.now(), data: response });
      return response;
    });
  },
  getById: (id) => api.get(`/resources/${id}`),
  clearCache: () => resourceCache.clear(),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};
