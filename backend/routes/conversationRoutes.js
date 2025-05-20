const express = require("express");
const router = express.Router();
const { Conversation, Message } = require('../models');
const { auth } = require('../middleware/authMiddleware');

// GET /api/conversations - Fetch all conversations (exclude soft-deleted)
router.get("/", auth, async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({ 
      participants: userId,
      deletedBy: { $ne: userId }
    })
      .populate("participants", "username email profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
});

// POST /api/conversations - Find or create a conversation (with soft delete restore)
router.post("/", auth, async (req, res) => {
  try {
    const { participants, participantId, isGroup, groupName } = req.body;
    const userIds = [...new Set([...(participants || []), participantId, req.user._id.toString()])];

    // Try to find an existing conversation (even if soft-deleted)
    let conversation = await Conversation.findOne({
      participants: { $all: userIds, $size: userIds.length },
      isGroup: isGroup || false
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: userIds,
        isGroup: isGroup || false,
        groupName: groupName || ''
      });
      await conversation.save();
    } else if (conversation.deletedBy.includes(req.user._id)) {
      // If conversation was soft-deleted by this user, remove from deletedBy
      conversation.deletedBy = conversation.deletedBy.filter(
        id => id.toString() !== req.user._id.toString()
      );
      await conversation.save();
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "username email profilePic")
      .populate("lastMessage");

    res.status(201).json(populatedConversation);
  } catch (err) {
    console.error('Error creating/finding conversation:', err);
    res.status(500).json({ error: "Failed to create/find conversation." });
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

// DELETE /api/conversations/:id - Soft delete a conversation for the user
router.delete("/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    // Add user to deletedBy if not already present
    if (!conversation.deletedBy.includes(req.user._id)) {
      conversation.deletedBy.push(req.user._id);
      await conversation.save();
    }

    res.status(200).json({ message: "Conversation deleted for user." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation." });
  }
});

// DELETE /api/conversations/:id/history - Clear chat history
router.delete("/:id/history", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversation._id });

    // Update conversation's lastMessage to null
    conversation.lastMessage = null;
    await conversation.save();

    res.status(200).json({ message: "Chat history cleared successfully." });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({ error: "Failed to clear chat history." });
  }
});

module.exports = router;
