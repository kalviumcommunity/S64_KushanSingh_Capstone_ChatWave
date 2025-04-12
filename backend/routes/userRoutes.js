const express = require("express");
const router = express.Router();

// Simple GET route
router.get("/", (req, res) => {
  res.send("✅ GET request to /api/users works!");
});

module.exports = router;
