const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation this message belongs to
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },

  // Sender of the message
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Text content of the message (optional for media-only messages)
  content: {
    type: String,
    default: '',
    trim: true,
  },

  // URL of media (images/files) if attached
  media: {
    type: String,
    default: '',
  },

  // Users who have read the message (for read receipt tracking)
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Check if the model already exists before creating it
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;
