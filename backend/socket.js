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
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
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

        // Emit the updated online user status to the current user
        socket.emit("updateUserStatus", { userId, isOnline: true });
      } catch (err) {
        console.error("Error updating user online status:", err);
      }
    });

    // User disconnects from the socket server
    socket.on("disconnect", async () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        console.log(`User ${userId} is offline.`);

        // Update user's online status in the database
        await User.findByIdAndUpdate(userId, { 
          isOnline: false,
          lastSeen: new Date()
        });

        // Emit to all users that a user has gone offline
        socket.broadcast.emit("updateUserStatus", { userId, isOnline: false });
      }
    });

    // Listen for message seen event
    socket.on("messageSeen", async (messageData) => {
      const { messageId, userId, conversationId } = messageData;

      try {
        // Update the message as seen
        const message = await Message.findById(messageId);
        if (message && !message.readBy.includes(userId)) {
          message.readBy.push(userId);
          await message.save();

          // Emit the message seen event to the specific conversation
          socket.to(conversationId).emit("messageSeen", messageData);
        }
      } catch (err) {
        console.error("Error marking message as seen:", err);
      }
    });

    // Listen for typing indicator event
    socket.on("typing", async (data) => {
      const { conversationId, userId } = data;
      
      try {
        // Emit typing event to other users in the conversation
        socket.to(conversationId).emit("typing", userId);

        // Update typing status in conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation && !conversation.isTyping.includes(userId)) {
          conversation.isTyping.push(userId);
          await conversation.save();
        }
      } catch (err) {
        console.error("Error handling typing event:", err);
      }
    });

    // Listen for stop typing event
    socket.on("stopTyping", async (data) => {
      const { conversationId, userId } = data;

      try {
        // Update typing status in conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.isTyping = conversation.isTyping.filter(
            (id) => id.toString() !== userId.toString()
          );
          await conversation.save();
        }

        // Emit stop typing event to other users in the conversation
        socket.to(conversationId).emit("stopTyping", userId);
      } catch (err) {
        console.error("Error handling stop typing event:", err);
      }
    });

    // Listen for new message event
    socket.on("newMessage", async (messageData) => {
      const { senderId, content, conversationId, media } = messageData;

      // Validate the incoming message data
      if (!senderId || !conversationId) {
        return socket.emit("error", { message: "Message data is incomplete." });
      }

      try {
        // Save the new message to the database
        const newMessage = new Message({
          sender: senderId,
          content: content || "",
          conversation: conversationId,
          media: media || "",
        });

        // Populate sender information before saving
        await newMessage.populate('sender', 'username profilePic');
        await newMessage.save();

        // Get the conversation to find all participants
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', '_id');

        if (!conversation) {
          return socket.emit("error", { message: "Conversation not found." });
        }

        // Emit the new message to all participants in the conversation
        socket.to(conversationId).emit("message:receive", {
          conversationId,
          message: newMessage
        });

        // Also emit to the sender
        socket.emit("message:receive", {
          conversationId,
          message: newMessage
        });

        // Update the conversation with the last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id,
          updatedAt: new Date()
        });

      } catch (err) {
        console.error("Error handling new message:", err);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    // Listen for a user joining a conversation
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Listen for a user leaving a conversation
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(`User left conversation: ${conversationId}`);
    });

  });

  return socket;
};

module.exports = socketIO;
