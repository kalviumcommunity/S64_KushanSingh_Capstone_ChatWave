const express = require("express");
const router = express.Router();

// GET /api/conversations
router.get("/", (req, res) => {
  res.send("✅ GET request to /api/conversations works!");
});

// POST /api/conversations
router.post("/", (req, res) => {
  const { participants } = req.body;
  res.status(201).json({
    message: "Conversation created!",
    participants,
  });
});


module.exports = router;
