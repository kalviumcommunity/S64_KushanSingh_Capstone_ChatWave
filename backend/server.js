const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const socketIO = require('./socket');
const app = require('./app');

// Connect to database
connectDB();

const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
