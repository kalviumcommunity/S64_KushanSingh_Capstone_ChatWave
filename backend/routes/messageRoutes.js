const express = require("express");
const router = express.Router();

// GET /api/messages
router.get("/", (req, res) => {
  res.send("✅ GET request to /api/messages works!");
});

// POST /api/messages
router.post("/", (req, res) => {
  const { senderId, receiverId, text } = req.body;
  res.status(201).json({
    message: "Message sent!",
    data: { senderId, receiverId, text },
  });
});


module.exports = router;
