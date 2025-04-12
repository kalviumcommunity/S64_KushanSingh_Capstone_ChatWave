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

// Rename conversation (for group chat later)
router.put("/:id", async (req, res) => {
  try {
    const updatedConv = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedConv);
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;
