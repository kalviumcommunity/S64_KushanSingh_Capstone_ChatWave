const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/users - Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// POST /api/users - Create a new user
router.post("/", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required." });
  }

  try {
    const newUser = new User({ username, email, password });
    const savedUser = await newUser.save();
    res.status(201).json({
      message: "User created successfully!",
      user: savedUser,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username or email already exists." });
    }
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to create user." });
  }
});


// PUT /api/users/:id - Update user by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully!",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

module.exports = router;
