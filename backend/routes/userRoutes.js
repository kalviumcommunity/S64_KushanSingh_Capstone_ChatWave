const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const { User } = require("../models");
const { upload, handleFileUpload } = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const path = require('path');

// GET /api/users/me - Get logged-in user's profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// GET /api/users/search - Search users
router.get("/search", auth, async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters long." });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    })
    .select('username email profilePic status')
    .limit(10);

    res.status(200).json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: "Failed to search users." });
  }
});

// GET /api/users/:id - Get user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// POST /api/users - Sign up
router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Username, email, and password are required." });

  try {
    const newUser = new User({ username, email, password });
    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User created successfully!",
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Username or email already exists." });

    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to create user." });
  }
});

// PUT /api/users/me - Update user profile
router.put("/me", auth, upload.single('profilePic'), async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // If updating password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to set new password." });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }

      user.password = newPassword;
    }

    // Update username and email if provided
    if (username) user.username = username;
    if (email) user.email = email;

    // Handle profile picture upload
    if (req.file) {
      try {
        const profilePicUrl = await handleFileUpload(req.file);
        user.profilePic = profilePicUrl;
      } catch (uploadError) {
        console.error('Error handling file upload:', uploadError);
        return res.status(500).json({ error: "Failed to upload profile picture." });
      }
    }

    await user.save();

    // Return user without sensitive information
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic
    };

    res.status(200).json(userResponse);
  } catch (err) {
    console.error('Profile update error:', err);
    // Clean up uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// GET /api/users - List all users (optional)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

module.exports = router;
