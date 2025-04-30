const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  profilePic: {
    type: String,
    default: '',
  },

  status: {
    type: String,
    default: 'Hey there! I am using ChatWave 🌊',
    trim: true,
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  lastSeen: {
    type: Date,
    default: Date.now,
  },

  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],

}, {
  timestamps: true,
});

// 🔐 Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔍 Password match method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if the model already exists before creating it
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
