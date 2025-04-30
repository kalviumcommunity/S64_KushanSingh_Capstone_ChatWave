const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const { User } = require("../models");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");

// GET /api/users/me - Get logged-in user's profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('conversations');
    res.status(200).json(user);
  } catch (err) {
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
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const user = await User.findById(req.user._id);

    // If a new profile picture was uploaded
    if (req.file) {
      // Delete old profile picture from Cloudinary if it exists
      if (user.profilePic) {
        const publicId = user.profilePic.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new profile picture to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'chatwave/profile-pics',
        width: 500,
        height: 500,
        crop: 'fill'
      });

      user.profilePic = result.secure_url;
    }

    user.username = username;
    user.email = email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic
    });
  } catch (err) {
    console.error('Profile update error:', err);
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

module.exports = router;
