const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  searchUsers
} = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware.auth);

// Conversation routes
router.get('/conversations', getConversations);

// Message routes
router.get('/messages/:conversationId', getMessages);
router.put('/messages/read', markMessagesAsRead);
router.delete('/messages/:messageId', deleteMessage);

// User routes
router.get('/users/search', searchUsers);

module.exports = router; 