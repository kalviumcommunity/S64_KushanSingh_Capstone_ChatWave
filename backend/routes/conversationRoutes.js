const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const redis = require('../utils/redis');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/conversations - Fetch all conversations
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user._id;

  // Check Redis cache first
  redis.get(`conversations:${userId}`, async (err, data) => {
    if (data) {
      return res.json(JSON.parse(data)); // Return cached data
    }

    try {
      const conversations = await Conversation.find({ participants: userId })
        .populate("participants", "username email")
        .populate("lastMessage");
      
      // Cache the result in Redis for 1 hour
      redis.setex(`conversations:${userId}`, 3600, JSON.stringify(conversations));

      res.status(200).json(conversations);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch conversations." });
    }
  });
});

// POST /api/conversations - Create a new conversation
router.post("/", authMiddleware, async (req, res) => {
  const { participants, isGroup, name } = req.body;

  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    return res.status(400).json({
      error: "A conversation requires at least two participants.",
    });
  }

  try {
    const newConv = new Conversation({ participants, isGroup, name });
    const savedConv = await newConv.save();

    res.status(201).json({
      message: "Conversation created!",
      data: savedConv,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation." });
  }
});

// POST /api/messages - Send a message (with optional media upload)
router.post("/messages", authMiddleware, uploadToCloudinary, async (req, res) => {
  const { content, conversationId } = req.body;
  const senderId = req.user._id;  // Get sender ID from JWT token

  const mediaUrl = req.fileUrl || ''; // If a file is uploaded, use the Cloudinary URL

  try {
    const newMessage = new Message({
      sender: senderId,
      content,
      conversationId,
      media: mediaUrl,
    });

    await newMessage.save();

    // Update the conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

// PUT /api/conversations/:id - Update conversation (e.g., rename group or update participants)
router.put("/:id", authMiddleware, async (req, res) => {
  const { participants, name } = req.body;

  if (participants && (!Array.isArray(participants) || participants.length < 2)) {
    return res.status(400).json({
      error: "Participants should be an array of at least 2 user IDs.",
    });
  }

  try {
    const updatedConv = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedConv) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    res.status(200).json({
      message: "✅ Conversation updated.",
      data: updatedConv,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update conversation." });
  }
});

module.exports = router;
