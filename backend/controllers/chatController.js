const { User, Message, Conversation } = require('../models');
const mongoose = require('mongoose');

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      deletedBy: { $ne: req.user._id }
    })
      .populate('participants', '-password')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    // Return the conversations array directly
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is part of the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }

    const messages = await Message.find({
      conversation: conversationId
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username profilePic')
      .populate('recipient', 'username profilePic');

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/messages/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient: req.user._id,
        readBy: { $ne: req.user._id }
      },
      {
        $push: { readBy: req.user._id }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedBy.push(req.user._id);
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/chat/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('-password');

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create or get conversation between two users
// @route   POST /api/chat/conversation
// @access  Private
const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    // Validate participantId
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Try to find an existing conversation (even if soft-deleted)
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [req.user._id, participantId],
        $size: 2
      },
      isGroup: false
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [req.user._id, participantId],
        isGroup: false
      });
      await conversation.save();
    } else if (conversation.deletedBy.includes(req.user._id)) {
      // If conversation was soft-deleted by this user, remove from deletedBy
      conversation.deletedBy = conversation.deletedBy.filter(
        id => id.toString() !== req.user._id.toString()
      );
      await conversation.save();
    }

    // Populate the conversation with necessary data
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username email profilePic')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      conversation: populatedConversation
    });
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete chat history for a conversation
// @route   DELETE /api/chat/conversation/:conversationId/history
// @access  Private
const deleteChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this conversation'
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });

    res.status(200).json({
      success: true,
      message: 'Chat history deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete conversation for a user
// @route   DELETE /api/chat/conversation/:conversationId
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this conversation'
      });
    }

    // Add user to deletedBy array if it doesn't exist
    if (!conversation.deletedBy) {
      conversation.deletedBy = [];
    }

    if (!conversation.deletedBy.includes(req.user._id)) {
      conversation.deletedBy.push(req.user._id);
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create a group chat
// @route   POST /api/chat/conversations/group
// @access  Private
const createGroup = async (req, res) => {
  try {
    const { name, participants } = req.body;
    const groupImage = req.file;

    if (!name || !participants) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a group name and participants'
      });
    }

    let participantsArray;
    try {
      participantsArray = JSON.parse(participants);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participants format'
      });
    }

    if (!Array.isArray(participantsArray) || participantsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one participant'
      });
    }

    // Create new group conversation
    const conversation = new Conversation({
      name,
      participants: [req.user._id, ...participantsArray],
      isGroup: true,
      createdBy: req.user._id,
      admins: [req.user._id]
    });

    // Handle group image if provided
    if (groupImage) {
      conversation.groupImage = `/uploads/${groupImage.filename}`;
    }

    await conversation.save();

    // Populate the conversation with necessary data
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username email profilePic')
      .populate('lastMessage');

    res.status(201).json({
      success: true,
      conversation: populatedConversation
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update group details
// @route   PUT /api/chat/conversations/group/:id
// @access  Private
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const groupImage = req.file;

    // Find the conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if it's a group
    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Not a group conversation'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a group member to update group details'
      });
    }

    // Update group details
    if (name) {
      conversation.name = name;
    }

    // Handle group image if provided
    if (groupImage) {
      conversation.groupImage = `/uploads/${groupImage.filename}`;
    }

    await conversation.save();

    // Populate the conversation with necessary data
    const updatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username email profilePic')
      .populate('lastMessage');

    res.json({
      success: true,
      conversation: updatedConversation
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add members to group
// @route   POST /api/chat/conversations/group/:id/members
// @access  Private
const addGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Not a group conversation'
      });
    }

    if (!conversation.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members to this group'
      });
    }

    // Add new members
    conversation.participants = [...new Set([...conversation.participants, ...userIds])];
    await conversation.save();

    const updatedConversation = await Conversation.findById(id)
      .populate('participants', 'username email profilePic')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      conversation: updatedConversation
    });
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/chat/conversations/group/:id/members/:userId
// @access  Private
const removeGroupMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Not a group conversation'
      });
    }

    if (!conversation.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members from this group'
      });
    }

    // Remove member
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== userId
    );

    // Remove from admins if they were an admin
    conversation.admins = conversation.admins.filter(
      a => a.toString() !== userId
    );

    await conversation.save();

    const updatedConversation = await Conversation.findById(id)
      .populate('participants', 'username email profilePic')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      conversation: updatedConversation
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Leave group
// @route   POST /api/chat/conversations/group/:id/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Not a group conversation'
      });
    }

    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    // Remove from admins if they were an admin
    conversation.admins = conversation.admins.filter(
      a => a.toString() !== req.user._id.toString()
    );

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  searchUsers,
  createOrGetConversation,
  deleteChatHistory,
  deleteConversation,
  createGroup,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup
}; 