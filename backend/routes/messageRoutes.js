const express = require("express");
const router = express.Router();
const multer = require("multer");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

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
router.post("/", upload.single('file'), async (req, res) => {
  const { senderId, conversationId, content } = req.body;

  if (!senderId || !conversationId) {
    return res.status(400).json({ error: "senderId and conversationId are required." });
  }

  try {
    let mediaUrl = "";

    // If file is attached, upload it to Cloudinary
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file); // Await the Cloudinary upload
      mediaUrl = uploaded.secure_url;  // Get the media URL from Cloudinary
    }

    // Create and save new message
    const newMessage = new Message({
      sender: senderId,
      conversationId,
      content: content || "", // If no text, set empty string
      media: mediaUrl,        // Store media URL if exists
    });

    const savedMessage = await newMessage.save();

    // Update lastMessage field in Conversation
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: savedMessage._id });

    // Emit new message to connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit("newMessage", savedMessage);
    }

    res.status(201).json({
      message: "✅ Message sent successfully!",
      data: savedMessage,
    });

  } catch (err) {
    console.error("Error sending message:", err);
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
