import axios from 'axios';

// Use environment variable for API URL, fallback to localhost
// This allows the app to work on both desktop and mobile
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Authentication APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/auth/me')
};

// User APIs
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (id, data) => api.put(`/users/${id}`, data),
    getAllUsers: () => api.get('/users'),
    getStats: () => api.get('/users/stats'),
    deleteUser: (id) => api.delete(`/users/${id}`)
};

// Company APIs
export const companyAPI = {
    getAll: () => api.get('/companies'),
    getById: (id) => api.get(`/companies/${id}`),
    create: (data) => api.post('/companies', data),
    update: (id, data) => api.put(`/companies/${id}`, data),
    delete: (id) => api.delete(`/companies/${id}`)
};

// Application APIs
export const applicationAPI = {
    getAll: () => api.get('/applications'),
    getById: (id) => api.get(`/applications/${id}`),
    create: (data) => api.post('/applications', data),
    update: (id, data) => api.put(`/applications/${id}`, data),
    delete: (id) => api.delete(`/applications/${id}`),
    getMyApplications: () => api.get('/applications/my')
};

// Analytics APIs (DSA-Powered)
export const analyticsAPI = {
    getDailyRecommendation: () => api.get('/analytics/daily-recommendation'),
    getSortedApplications: (sortBy = 'deadline') => api.get(`/analytics/sorted-applications?sortBy=${sortBy}`),
    getCumulativeStats: () => api.get('/analytics/cumulative-stats'),
    getInterviewSchedule: () => api.get('/analytics/interview-schedule'),
    getStatusDistribution: () => api.get('/analytics/status-distribution'),
    getDashboardSummary: () => api.get('/analytics/dashboard-summary')
};

// Resume APIs
export const resumeAPI = {
    upload: (formData) => {
        return axios.post(`${API_URL}/resume/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    },
    download: () => {
        return axios.get(`${API_URL}/resume/download`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            responseType: 'blob'
        });
    },
    downloadStudent: (userId) => {
        return axios.get(`${API_URL}/resume/download/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            responseType: 'blob'
        });
    },
    delete: () => api.delete('/resume'),
    view: () => {
        return axios.get(`${API_URL}/resume/view`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            responseType: 'blob'
        });
    },
    score: (companyId) => api.post('/resume/score', { companyId })
};

export default api;
