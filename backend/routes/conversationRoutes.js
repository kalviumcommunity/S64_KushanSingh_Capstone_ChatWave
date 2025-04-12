const express = require("express");
const router = express.Router();

// GET /api/conversations
router.get("/", (req, res) => {
  res.send("✅ GET request to /api/conversations works!");
});

module.exports = router;
