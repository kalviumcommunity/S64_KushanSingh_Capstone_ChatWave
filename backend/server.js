const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;


//Routes
app.get("/", (req, res) => {
  res.send("🌊 ChatWave backend is live!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
