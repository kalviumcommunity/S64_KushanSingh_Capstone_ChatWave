const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const cloudinary = require("../config/cloudinaryConfig");
const streamifier = require("streamifier");

// GET /api/users/me - Get logged-in user's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      status: user.status,
    });
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

// PUT /api/users/me - Update profile with deletion of old pic
router.put("/me", authMiddleware, upload.single("profilePic"), async (req, res) => {
  const { username, email, status } = req.body;
  let profilePicUrl = undefined;

  if (!username || !email)
    return res.status(400).json({ error: "Username and email are required." });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Upload new profile pic if available
    if (req.file) {
      // ✅ Delete old image from Cloudinary if exists
      if (user.profilePic) {
        const parts = user.profilePic.split('/');
        const filename = parts[parts.length - 1];
        const publicId = `chatwave_profiles/${filename.split('.')[0]}`;

        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("⚠️ Failed to delete old image:", err.message);
        }
      }

      // ✅ Upload new image
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "chatwave_profiles" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await streamUpload();
      profilePicUrl = result.secure_url;
    }

    // ✅ Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          username,
          email,
          status,
          ...(profilePicUrl && { profilePic: profilePicUrl }),
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "User updated successfully!",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        status: updatedUser.status,
      },
    });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: "Failed to update user." });
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
