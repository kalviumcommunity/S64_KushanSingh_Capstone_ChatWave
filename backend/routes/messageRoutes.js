const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); 

// GET /api/messages - Fetch all messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST /api/messages - Send a new message
router.post("/", async (req, res) => {
  const { senderId, receiverId, text } = req.body;

  if (!senderId || !receiverId || !text) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newMessage = new Message({ senderId, receiverId, text });
    const savedMessage = await newMessage.save();
    res.status(201).json({
      message: "Message sent!",
      data: savedMessage,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

// PUT /api/messages/:id - Edit a message
router.put("/:id", async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { text: req.body.text },
      { new: true }
    );
    res.status(200).json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to update message." });
  }
});

module.exports = router;
