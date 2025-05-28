const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Trims spaces automatically
    minlength: 3
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true, // Enforces lowercase emails
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
    default: "Hey there! I'm using ChatWave 🌊",
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

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt & updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
