const express = require("express");
const router = express.Router();

// GET /api/messages
router.get("/", (req, res) => {
  res.send("✅ GET request to /api/messages works!");
});

module.exports = router;
