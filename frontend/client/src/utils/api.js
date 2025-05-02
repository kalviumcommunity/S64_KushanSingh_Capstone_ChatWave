// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
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

// Chat API endpoints
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId, page = 1, limit = 20) => 
    api.get(`/chat/messages/${conversationId}`, { params: { page, limit } }),
  markMessagesAsRead: (messageIds) => 
    api.put('/chat/messages/read', { messageIds }),
  deleteMessage: (messageId) => 
    api.delete(`/chat/messages/${messageId}`),
  searchUsers: (query) => 
    api.get('/chat/users/search', { params: { query } }),
  createOrGetConversation: (participantId) => 
    api.post('/chat/conversation', { participantId }),
  deleteChatHistory: (conversationId) => 
    api.delete(`/chat/conversation/${conversationId}/history`),
  deleteConversation: (conversationId) => 
    api.delete(`/chat/conversation/${conversationId}`)
};

export default api;
