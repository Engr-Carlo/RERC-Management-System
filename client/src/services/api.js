import axios from 'axios';

// Use relative path for Vercel deployment
const API_URL = '/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set up axios defaults
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth?action=login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  getMe: async () => {
    const response = await api.get('/auth?action=me');
    return response.data;
  }
};

// Application services
export const applicationService = {
  getAll: async () => {
    const response = await api.get('/applications');
    return response.data;
  },

  getById: async (rowIndex) => {
    const response = await api.get(`/applications?rowIndex=${rowIndex}`);
    return response.data;
  },

  update: async (rowIndex, fieldName, value) => {
    const response = await api.patch(`/applications?rowIndex=${rowIndex}`, { fieldName, value });
    return response.data;
  },

  getHistory: async (rowIndex) => {
    const response = await api.get(`/applications?history=true&rowIndex=${rowIndex}`);
    return response.data;
  }
};

// Audit services
export const auditService = {
  getAll: async (limit = 100) => {
    const response = await api.get(`/audit?limit=${limit}`);
    return response.data;
  }
};

// User services
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (username, password, email, role) => {
    const response = await api.post('/users', { username, password, email, role });
    return response.data;
  },

  delete: async (userId) => {
    const response = await api.delete(`/users?id=${userId}`);
    return response.data;
  },

  changePassword: async (newPassword) => {
    const response = await api.put('/users', { newPassword });
    return response.data;
  }
};

// Program services
export const programService = {
  getAll: async () => {
    const response = await api.get('/programs');
    return response.data;
  }
};

// Reviewer program assignment services
export const reviewerProgramService = {
  getPrograms: async (userId) => {
    const response = await api.get(`/reviewer-programs?userId=${userId}`);
    return response.data;
  },

  updatePrograms: async (userId, programs) => {
    const response = await api.post(`/reviewer-programs?userId=${userId}`, { programs });
    return response.data;
  }
};

export default api;
