import axios from 'axios';

// Use relative path for Vercel deployment
const API_URL = '/api';

// Auto-logout after 1 hour of inactivity
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
let inactivityTimer = null;

// Heartbeat interval (every 2 minutes)
const HEARTBEAT_INTERVAL = 2 * 60 * 1000;
let heartbeatTimer = null;

// Check if a JWT token is expired (without verifying signature)
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const performLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
};

const resetInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Only set timer if user is logged in
  const token = localStorage.getItem('token');
  if (token) {
    inactivityTimer = setTimeout(() => {
      performLogout();
      window.location.href = '/';
    }, INACTIVITY_TIMEOUT);
  }
};

// Track user activity
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
}

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set up axios defaults
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests — also check expiry before every call
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (isTokenExpired(token)) {
      // Token is expired — clear session and redirect to login
      performLogout();
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 responses — server rejected the token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const token = getToken();
      if (token) {
        // Server rejected token — force fresh login
        performLogout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth?action=login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      resetInactivityTimer(); // Start inactivity timer
      authService.startHeartbeat(); // Start heartbeat
    }
    return response.data;
  },

  logout: () => {
    // Send a final heartbeat to mark offline before clearing token
    const token = getToken();
    if (token) {
      // Fire-and-forget — don't await so logout is instant
      api.post('/auth?action=logout').catch(() => {});
    }
    performLogout();
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    const token = getToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      performLogout();
      return false;
    }
    return true;
  },

  getMe: async () => {
    const response = await api.get('/auth?action=me');
    return response.data;
  },

  sendHeartbeat: async () => {
    try {
      await api.post('/auth?action=heartbeat');
    } catch {
      // Ignore heartbeat errors
    }
  },

  startHeartbeat: () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    // Send immediate heartbeat on login
    authService.sendHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (getToken() && !isTokenExpired(getToken())) {
        authService.sendHeartbeat();
      } else {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    }, HEARTBEAT_INTERVAL);
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

  updateStatus: async (rowIndex, statusText, action) => {
    const response = await api.patch(`/applications?rowIndex=${rowIndex}&statusUpdate=true`, { 
      statusText, 
      action 
    });
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

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/users?action=changePassword', { currentPassword, newPassword });
    return response.data;
  },

  resetPassword: async () => {
    const response = await api.put('/users?action=resetPassword');
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
