// src/utils/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('API_URL:', API_URL); // <--- Add this line

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  updatePassword: (passwordData) => api.put('/auth/password', passwordData),
  uploadProfilePic: (formData) => api.post('/auth/upload-profile-pic', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const chatAPI = {
  // User related
  getUsers: () => api.get('/users'),
  searchUsers: (query) => api.get(`/users/search?q=${query}`),

  // Conversation related
  getConversations: () => api.get('/conversations'),
  getConversation: (id) => api.get(`/conversations/${id}`),
  createConversation: (data) => api.post('/conversations', data),
  deleteConversation: (id) => api.delete(`/conversations/${id}`),
  deleteChatHistory: (id) => api.delete(`/conversations/${id}/history`),

  // Group chat related
  createGroup: (formData) => api.post('/chat/conversations/group', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateGroup: (id, formData) => api.put(`/chat/conversations/group/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  leaveGroup: (id) => api.post(`/chat/conversations/group/${id}/leave`),
  addGroupMembers: (id, userIds) => api.post(`/chat/conversations/group/${id}/members`, { userIds }),
  removeGroupMember: (id, userId) => api.delete(`/chat/conversations/group/${id}/members/${userId}`),
  updateGroupSettings: (id, settings) => api.put(`/chat/conversations/group/${id}/settings`, settings),

  // Message related
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (data) => api.post('/messages', data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  markAsRead: (conversationId) => api.put(`/messages/${conversationId}/read`),
};

export default api;
