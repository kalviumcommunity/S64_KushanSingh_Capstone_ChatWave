const io = require("socket.io");
const { User, Message, Conversation } = require('./models');

// Map to keep track of online users
let onlineUsers = new Map();

// Function to initialize Socket.io
const socketIO = (server) => {
  const socket = io(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    allowEIO3: true,
    transports: ['websocket'],
    pingTimeout: 30000,
    pingInterval: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });

  // User connects to the socket server
  socket.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Handle authentication error
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      if (error.type === "UnauthorizedError" || error.code === "ECONNRESET") {
        socket.disconnect();
      }
    });

    // Track user online status (when user logs in)
    socket.on("userOnline", async (userId) => {
      try {
        onlineUsers.set(socket.id, userId);
        console.log(`User ${userId} is online.`);

        // Update user's online status in the database
        await User.findByIdAndUpdate(userId, { 
          isOnline: true,
          lastSeen: new Date()
        });

        // Emit to all users that a user has come online
        socket.broadcast.emit("updateUserStatus", { userId, isOnline: true });
      } catch (error) {
        console.error("Error updating user online status:", error);
      }
    });

    // Handle user offline status
    socket.on('userOffline', async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        socket.broadcast.emit("updateUserStatus", { userId, isOnline: false });
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
    });

    // Handle conversation joining
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Handle conversation leaving
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User left conversation: ${conversationId}`);
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, senderId, media } = data;
        
        const message = new Message({
          conversation: conversationId,
          sender: senderId,
          content,
          media
        });

        await message.save();

        // Populate sender details
        await message.populate('sender', 'username profilePic');

        // Emit to all users in the conversation
        socket.to(conversationId).emit('message:receive', {
          conversationId,
          message
        });

        // Emit notification to other users
        const conversation = await message.populate('conversation');
        const otherUsers = conversation.conversation.participants.filter(
          p => p.toString() !== senderId
        );

        otherUsers.forEach(userId => {
          const recipientSocket = Array.from(io.sockets.sockets.values())
            .find(s => s.userId === userId.toString());
          
          if (recipientSocket && !recipientSocket.rooms.has(conversationId)) {
            recipientSocket.emit('newMessageNotification', {
              conversationId,
              message: {
                content,
                media
              },
              sender: message.sender
            });
          }
        });

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing status
    socket.on('user:typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(conversationId).emit('user:typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log("User disconnected: ", socket.id);
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        try {
          await User.findByIdAndUpdate(userId, { 
            isOnline: false,
            lastSeen: new Date()
          });
          socket.broadcast.emit("updateUserStatus", { userId, isOnline: false });
        } catch (error) {
          console.error("Error updating user offline status:", error);
        }
      }
    });
  });

  return socket;
};

module.exports = socketIO;
