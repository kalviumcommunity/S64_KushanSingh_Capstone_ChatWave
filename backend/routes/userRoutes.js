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


module.exports = router;
