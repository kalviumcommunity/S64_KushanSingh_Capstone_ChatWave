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
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required." });
  }

  try {
    const newUser = new User({ username, email });
    const savedUser = await newUser.save();
    res.status(201).json({
      message: "User created successfully!",
      user: savedUser,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

// PUT /api/users/:id - Update user by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

module.exports = router;
