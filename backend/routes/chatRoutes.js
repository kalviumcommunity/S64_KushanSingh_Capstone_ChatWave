const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getConversations,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  searchUsers,
  createOrGetConversation,
  deleteChatHistory,
  deleteConversation,
  createGroup,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup
} = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'group-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware.auth);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversation', createOrGetConversation);
router.delete('/conversation/:conversationId', deleteConversation);
router.delete('/conversation/:conversationId/history', deleteChatHistory);

// Group chat routes
router.post('/conversations/group', upload.single('groupImage'), createGroup);
router.put('/conversations/group/:id', upload.single('groupImage'), updateGroup);
router.post('/conversations/group/:id/members', addGroupMembers);
router.delete('/conversations/group/:id/members/:userId', removeGroupMember);
router.post('/conversations/group/:id/leave', leaveGroup);

// Message routes
router.get('/messages/:conversationId', getMessages);
router.put('/messages/read', markMessagesAsRead);
router.delete('/messages/:messageId', deleteMessage);

// User routes
router.get('/users/search', searchUsers);

module.exports = router; 