const mongoose = require('mongoose');

// Delete the existing model if it exists
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

const messageSchema = new mongoose.Schema({
  // Conversation this message belongs to
  conversation: {
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

  // Recipient of the message
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Text content of the message (optional for media-only messages)
  content: {
    type: String,
    trim: true,
    default: '',
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

  // Message type (text, image, file)
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Index for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });

// Create the model
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
