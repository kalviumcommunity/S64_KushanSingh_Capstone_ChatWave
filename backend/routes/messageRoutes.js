const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Message, Conversation } = require('../models');
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const { auth } = require("../middleware/authMiddleware");

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

    // Get the recipient (other participant in the conversation)
    const recipientId = conversation.participants.find(id => id.toString() !== senderId.toString());

    if (!recipientId) {
      return res.status(400).json({ error: "Could not determine recipient for this conversation." });
    }

    let mediaUrl = "";
    let type = "text";

    // If file is attached, upload it to Cloudinary
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file);
      mediaUrl = uploaded.secure_url;
      type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    }

    // Create and save new message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      conversation: conversationId,
      content: content || "",
      media: mediaUrl,
      type
    });

    const savedMessage = await newMessage.save();

    // Populate the sender and recipient information
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender", "username email profilePic")
      .populate("recipient", "username email profilePic");

    // Update lastMessage field in Conversation
    await Conversation.findByIdAndUpdate(conversationId, { 
      lastMessage: savedMessage._id,
      updatedAt: new Date()
    });

    // Emit new message to connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit("message:receive", {
        conversationId,
        message: populatedMessage
      });
    }

    res.status(201).json({
      message: "✅ Message sent successfully!",
      data: populatedMessage,
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
router.put("/:id", auth, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Updated content is required." });
  }

  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    // Check if the user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages." });
    }

    message.content = content;
    const updatedMessage = await message.save();

    // Emit the updated message to connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversation.toString()).emit("message:update", {
        messageId: updatedMessage._id,
        content: updatedMessage.content
      });
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
