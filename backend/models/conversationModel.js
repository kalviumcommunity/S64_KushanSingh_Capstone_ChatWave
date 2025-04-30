const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupPicture: {
    type: String,
    default: 'default-group.png'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1, lastActivity: -1 });

// Method to get conversation participants without sensitive data
conversationSchema.methods.getParticipants = async function() {
  await this.populate('participants', '-password');
  return this.participants;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation; 