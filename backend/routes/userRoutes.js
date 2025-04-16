const express = require("express");
const router = express.Router();

// Simple GET route
router.get("/", (req, res) => {
  res.send("✅ GET request to /api/users works!");
});

// POST /api/users
router.post("/", (req, res) => {
  const { username, email } = req.body;
  res.status(201).json({
    message: "User created successfully!",
    user: { username, email },
  });
});

// Update user profile (name or status)
router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;
