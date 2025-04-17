const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// GET /api/messages - Fetch all messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().populate("senderId receiverId", "username email");
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST /api/messages - Send a new message
router.post("/", async (req, res) => {
  const { senderId, receiverId, text, conversationId } = req.body;

  // Validate input data
  if (!senderId || !receiverId || !text || !conversationId) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Create a new message using the senderId, receiverId, text, and conversationId
    const newMessage = new Message({
      sender: senderId,          // Correctly map senderId to sender field
      content: text,             // The message content
      conversationId,            // The conversation's ID
      media: "",                 // Optional media field
    });

    // Save the message to the database
    const savedMessage = await newMessage.save();

    // Respond with a success message
    res.status(201).json({
      message: "Message sent!",
      data: savedMessage,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});


// PUT /api/messages/:id - Edit a message
router.put("/:id", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Message text is required to update." });
  }

  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { text },
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
    res.status(500).json({ error: "Failed to update message." });
  }
});

module.exports = router;
