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
    console.log('Saved message:', savedMessage);


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
    console.error(err);
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
