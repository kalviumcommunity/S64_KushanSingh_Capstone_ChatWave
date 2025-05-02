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

    // Handle new messages (both old and new event names)
    socket.on("newMessage", async (data) => {
      try {
        const { senderId, content, conversationId, media } = data;

        // Get the conversation to find the recipient
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', '_id');

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Find the recipient (other participant in the conversation)
        const recipientId = conversation.participants.find(
          participant => participant._id.toString() !== senderId.toString()
        )?._id;

        if (!recipientId) {
          return socket.emit('error', { message: 'Recipient not found' });
        }

        // Save the message to the database
        const newMessage = new Message({
          sender: senderId,
          recipient: recipientId,
          content: content || "",
          conversation: conversationId,
          media: media || ""
        });

        // Populate sender and recipient information
        await newMessage.populate('sender', 'username profilePic');
        await newMessage.populate('recipient', 'username profilePic');
        await newMessage.save();

        // Update conversation's last message and activity
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id,
          lastActivity: new Date()
        });

        // Emit the message to all users in the conversation
        socket.to(conversationId).emit('message:receive', {
          conversationId,
          message: newMessage
        });

        // Also emit to sender (for optimistic updates)
        socket.emit('message:receive', {
          conversationId,
          message: newMessage
        });

        // Emit notification to recipient if they're not in the conversation
        const recipientSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === recipientId.toString());
        
        if (recipientSocket && !recipientSocket.rooms.has(conversationId)) {
          recipientSocket.emit('newMessageNotification', {
            conversationId,
            message: newMessage,
            sender: newMessage.sender
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators (both old and new event names)
    socket.on("typing", async (data) => {
      const { conversationId, isTyping } = data;
      socket.to(conversationId).emit('user:typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle conversation room joining
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Handle conversation room leaving
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(`User left conversation: ${conversationId}`);
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
