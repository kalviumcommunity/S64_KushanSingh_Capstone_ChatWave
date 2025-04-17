const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true // Ensures that a conversationId is required
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Ensures that a sender is required
  },
  content: {
    type: String,
    default: '' // Default to an empty string if no content is provided
  },
  media: {
    type: String, // Used for storing file/image URLs
    default: '' // Default to an empty string if no media is provided
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // This will store the IDs of users who have read the message
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
