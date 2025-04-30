const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Message, Conversation } = require('../models');
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const { auth } = require("../middleware/authMiddleware");

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 💬 GET /api/messages/:conversationId - Fetch messages by conversation
router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate("sender", "username email profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// ✉️ POST /api/messages - Send a new message (text and/or media)
router.post("/", auth, upload.single('file'), async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required." });
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ error: "You are not a participant in this conversation." });
    }

    let mediaUrl = "";

    // If file is attached, upload it to Cloudinary
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file);
      mediaUrl = uploaded.secure_url;
    }

    // Create and save new message
    const newMessage = new Message({
      sender: senderId,
      conversationId,
      content: content || "",
      media: mediaUrl,
    });

    const savedMessage = await newMessage.save();

    // Update lastMessage field in Conversation
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: savedMessage._id });

    // Emit new message to connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit("message:receive", {
        conversationId,
        message: savedMessage
      });
    }

    res.status(201).json({
      message: "✅ Message sent successfully!",
      data: savedMessage,
    });

  } catch (err) {
    console.error("Error sending message:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to send message." });
  }
});

// 🛠 PUT /api/messages/:id - Edit a message
router.put("/:id", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Updated content is required." });
  }

  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.status(200).json({
      message: "✅ Message updated successfully.",
      data: updatedMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update message." });
  }
});

module.exports = router;
