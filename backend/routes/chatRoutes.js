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
const { Message } = require('../models');

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

// GET /api/chat/messages/:conversationId - Get messages for a conversation
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePic');

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST /api/chat/messages - Send a new message
router.post("/messages", async (req, res) => {
  const { conversationId, content, type = 'text' } = req.body;

  if (!conversationId || !content) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const message = new Message({
      conversationId,
      sender: req.user._id,
      content,
      type
    });

    const savedMessage = await message.save();
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'username profilePic');

    // Emit the new message to all participants in the conversation
    req.io.to(conversationId).emit('newMessage', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

module.exports = router; 