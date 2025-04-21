const mongoose = require('mongoose');

// User Schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Trims spaces automatically
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Enforces lowercase emails
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'], // Regex for email validation
  },

  password: {
    type: String,
    required: true,
    minlength: 6, // Enforces password strength
  },

  profilePic: {
    type: String,
    default: '', // Stores image URL, can integrate with Cloudinary/AWS S3
  },

  status: {
    type: String,
    default: 'Hey there! I’m using ChatWave 🌊',
    trim: true,
  },

  isOnline: {
    type: Boolean,
    default: false, // Realtime presence status
  },

  lastSeen: {
    type: Date,
    default: Date.now, // Used for showing "last seen" status
  },

  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ], // Optional: To build a future "contacts/friends" system

}, {
  timestamps: true, // Adds createdAt & updatedAt
});

module.exports = mongoose.model('User', userSchema);
