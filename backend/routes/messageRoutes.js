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

// Update a message (e.g., edit message content)
router.put("/:id", async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { text: req.body.text },
      { new: true }
    );
    res.status(200).json(updatedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});
  
module.exports = router;
