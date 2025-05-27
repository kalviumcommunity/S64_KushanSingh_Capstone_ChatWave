const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Apply auth middleware to all routes
router.use(auth);

// GET /api/messages/:conversationId - Fetch messages for a conversation
router.get("/:conversationId", async (req, res) => {
  try {
    console.log('Fetching messages for conversation:', req.params.conversationId);
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate("sender", "username email avatar")
      .sort({ createdAt: 1 });
    console.log('Found messages:', messages);
    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST /api/messages - Send a new message
router.post("/", upload.single('file'), async (req, res) => {
  console.log('Received message request:', req.body);
  console.log('File:', req.file);
  console.log('User:', req.user);

  const { text, conversationId } = req.body;
  const senderId = req.user._id;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required." });
  }

  try {
    const newMessage = new Message({
      sender: senderId,
      text: text || "",
      conversationId,
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        path: req.file.path
      } : null
    });

    console.log('Creating new message:', newMessage);
    const savedMessage = await newMessage.save();
    console.log('Saved message:', savedMessage);

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender", "username email avatar");
    console.log('Populated message:', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// PUT /api/messages/:id - Edit a message
router.put("/:id", async (req, res) => {
  const { text } = req.body;
  const messageId = req.params.id;

  if (!text) {
    return res.status(400).json({ error: "Message text is required to update." });
  }

  try {
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    // Debug log
    console.log('EDIT: message.sender:', message.sender, 'req.user._id:', req.user._id);
    // Check if the user is the sender of the message
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ error: "You can only edit your own messages." });
    }

    message.text = text;
    const updatedMessage = await message.save();
    
    const populatedMessage = await Message.findById(updatedMessage._id)
      .populate("sender", "username email avatar");

    res.status(200).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to update message." });
  }
});

// DELETE /api/messages/:id - Delete a message
router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    // Debug log
    console.log('DELETE: message.sender:', message.sender, 'req.user._id:', req.user._id);
    // Check if the user is the sender of the message
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ error: "You can only delete your own messages." });
    }

    try {
      await Message.deleteOne({ _id: message._id });
      res.status(200).json({ message: "Message deleted successfully." });
    } catch (err) {
      console.error('Error removing message:', err);
      res.status(500).json({ error: "Failed to remove message." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message." });
  }
});

module.exports = router;
