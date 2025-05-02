const express = require("express");
const router = express.Router();
const { Conversation, Message } = require('../models');
const { auth } = require('../middleware/authMiddleware');

// GET /api/conversations - Fetch all conversations
router.get("/", auth, async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username email profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
});

// POST /api/conversations - Create a new conversation
router.post("/", auth, async (req, res) => {
  try {
    const { participants, isGroup, groupName } = req.body;

    // Ensure current user is included in participants
    if (!participants.includes(req.user._id)) {
      participants.push(req.user._id);
    }

    const newConversation = new Conversation({
      participants,
      isGroup: isGroup || false,
      groupName: groupName || ''
    });

    await newConversation.save();

    // Populate the participants information
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate("participants", "username email profilePic")
      .populate("lastMessage");

    res.status(201).json(populatedConversation);
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: "Failed to create conversation." });
  }
});

// GET /api/conversations/:id - Get a specific conversation
router.get("/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "username email profilePic")
      .populate("lastMessage");

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: "Failed to fetch conversation." });
  }
});

// PUT /api/conversations/:id - Update a conversation
router.put("/:id", auth, async (req, res) => {
  const { name, participants } = req.body;

  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    // Update conversation
    if (name) conversation.name = name;
    if (participants) conversation.participants = participants;

    const updatedConversation = await conversation.save();

    res.status(200).json({
      message: "Conversation updated!",
      data: updatedConversation,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update conversation." });
  }
});

// DELETE /api/conversations/:id - Delete a conversation
router.delete("/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversation._id });

    // Delete the conversation
    await conversation.deleteOne();

    res.status(200).json({ message: "Conversation deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation." });
  }
});

module.exports = router;
