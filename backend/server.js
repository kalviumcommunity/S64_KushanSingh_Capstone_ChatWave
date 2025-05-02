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
  transports: ['websocket'],
  pingTimeout: 30000,
  pingInterval: 10000,
  path: '/socket.io',
  allowEIO3: true,
  connectTimeout: 20000,
  maxHttpBufferSize: 1e8,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// Initialize socket manager
initializeSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
