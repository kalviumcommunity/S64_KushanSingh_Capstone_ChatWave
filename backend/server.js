const dotenv = require("dotenv");
const connectDB = require("./config/db");

const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const setupSocket = require("./socket");

dotenv.config();

const PORT = process.env.PORT;

// Create HTTP server
const server = http.createServer(app);


// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (you can restrict later)
    methods: ["GET", "POST"],
  },
});


// Attach io to app if needed elsewhere
app.set('io', io);

// Connect DB and then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });


  // Setup Socket.IO listeners after DB is connected
  setupSocket(io);
});
