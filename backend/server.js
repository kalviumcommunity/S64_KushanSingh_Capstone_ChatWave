const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/socketManager');
const app = require('./app');

// Connect to database
connectDB();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io',
  allowEIO3: true,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8
});

// Initialize socket manager
initializeSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
