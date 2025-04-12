const mongoose = require('mongoose');

// User Schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,  // Automatically trims spaces before and after
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Store emails in lowercase for consistency
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'], // Email format validation
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // You might want to enforce minimum length for password
  },
  profilePic: {
    type: String,
    default: '', // Initially, the profile picture will be empty
  },
  status: {
    type: String,
    default: 'Hey there! I’m using ChatWave 🌊',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });  // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('User', userSchema);
