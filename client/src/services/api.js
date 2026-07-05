import axios from 'axios';

/** Resolve API base URL — production build uses same-origin; Vite dev hits backend directly */
const resolveApiBase = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
    }
    if (!import.meta.env.DEV) {
        return '/api/v1';
    }
    return 'http://localhost:5000/api/v1';
};

export const API_BASE = resolveApiBase();

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'archive_access_token';
const REFRESH_TOKEN_KEY = 'archive_refresh_token';

export const tokenStorage = {
    getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setTokens: (access, refresh) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    },
    clearTokens: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
};

// Request interceptor — attach access token
api.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getAccess();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = tokenStorage.getRefresh();
            if (!refreshToken) {
                tokenStorage.clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const { data } = await api.post('/auth/refresh', { refreshToken }, { _retry: true });
                const { accessToken, refreshToken: newRefresh } = data.data;
                tokenStorage.setTokens(accessToken, newRefresh);
                api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
                processQueue(null, accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                tokenStorage.clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        } else if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/login')) {
            tokenStorage.clearTokens();
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    adminRegister: (data) => api.post('/auth/admin/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Projects API
export const projectsAPI = {
    getAll: (params) => api.get('/projects', { params }),
    getOne: (id) => api.get(`/projects/${id}`),
    getById: (id) => api.get(`/projects/${id}`),
    create: (formData) => api.post('/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, formData) => api.put(`/projects/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/projects/${id}`),
    addMember: (id, data) => api.post(`/projects/${id}/members`, data),
    removeMember: (id, regNo) => api.delete(`/projects/${id}/members/${regNo}`),
    exportCSV: (params) => api.get('/projects/export/csv', { params, responseType: 'blob' }),
    deleteFile: (id, fileId) => api.delete(`/projects/${id}/files/${fileId}`),
};

// Research API
export const researchAPI = {
    getAll: (params) => api.get('/research', { params }),
    getOne: (id) => api.get(`/research/${id}`),
    getById: (id) => api.get(`/research/${id}`),
    create: (formData) => api.post('/research', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, formData) => api.put(`/research/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/research/${id}`),
    deleteFile: (id, fileId) => api.delete(`/research/${id}/files/${fileId}`),
};

// Search API
export const searchAPI = {
    search: (params) => api.get('/search', { params }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getUsers: (params) => api.get('/dashboard/users', { params }),
    updateUser: (id, data) => api.put(`/dashboard/users/${id}`, data),
    deleteUser: (id) => api.delete(`/dashboard/users/${id}`),
    improveAbstract: (abstract) => api.post('/dashboard/ai/improve-abstract', { abstract }),
    generateAbstract: (data) => api.post('/dashboard/ai/generate-abstract', data),
    suggestTitles: (data) => api.post('/dashboard/ai/suggest-titles', data),
    getActivity: (params) => api.get('/dashboard/activity', { params }),
};

// Evaluations API
export const evaluationsAPI = {
    getAll: (params) => api.get('/evaluations', { params }),
    getOne: (id) => api.get(`/evaluations/${id}`),
    create: (data) => api.post('/evaluations', data),
    update: (id, data) => api.put(`/evaluations/${id}`, data),
    delete: (id) => api.delete(`/evaluations/${id}`),
};

// Form Templates API
export const formTemplatesAPI = {
    getAll: (params) => api.get('/form-templates', { params }),
    create: (formData) => api.post('/form-templates', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, formData) => api.put(`/form-templates/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/form-templates/${id}`),
    getDownloadUrl: (id) => `${API_BASE}/form-templates/${id}/download`,
};

// Notifications API
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
};

// Student Research API
export const studentResearchAPI = {
    getAll: (params) => api.get('/student-research', { params }),
    getOne: (id) => api.get(`/student-research/${id}`),
    create: (formData) => api.post('/student-research', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, formData) => api.put(`/student-research/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/student-research/${id}`),
    deleteFile: (id, fileId) => api.delete(`/student-research/${id}/files/${fileId}`),
};

// Lecturer Research API
export const lecturerResearchAPI = {
    getAll: (params) => api.get('/lecturer-research', { params }),
    getOne: (id) => api.get(`/lecturer-research/${id}`),
    create: (formData) => api.post('/lecturer-research', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, formData) => api.put(`/lecturer-research/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/lecturer-research/${id}`),
};

// File URL helpers (must hit the backend, not the Vite dev server)
export const getFileUrl = (entryId, fileId) => `${API_BASE}/files/${entryId}/${fileId}`;
export const getProjectProposalUrl = (id) => `${API_BASE}/files/projects/${id}/proposal`;
export const getProjectFinalReportUrl = (id) => `${API_BASE}/files/projects/${id}/final-report`;
export const getResearchProposalUrl = (id) => `${API_BASE}/files/research/${id}/proposal`;
export const getResearchFinalReportUrl = (id) => `${API_BASE}/files/research/${id}/final-report`;
export const getStudentResearchProposalUrl = (id) => `${API_BASE}/files/student-research/${id}/proposal`;
export const getStudentResearchFinalReportUrl = (id) => `${API_BASE}/files/student-research/${id}/final-report`;

export default api;
