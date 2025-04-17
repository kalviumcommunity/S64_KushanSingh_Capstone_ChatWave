const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");

// GET /api/conversations - Fetch all conversations
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find().populate("participants", "username email");
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
});

// POST /api/conversations - Create a new conversation
router.post("/", async (req, res) => {
  const { participants } = req.body;

  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    return res.status(400).json({
      error: "A conversation requires at least two participants.",
    });
  }

  try {
    const newConv = new Conversation({ participants });
    const savedConv = await newConv.save();
    res.status(201).json({
      message: "Conversation created!",
      data: savedConv,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation." });
  }
});


// PUT /api/conversations/:id - Update conversation (e.g., rename group or update participants)
router.put("/:id", async (req, res) => {
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
