const io = require("socket.io");
const { User, Message, Conversation } = require('./models');

// Map to keep track of online users
let onlineUsers = new Map();

// Function to initialize Socket.io
const socketIO = (server) => {
  const socket = io(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // User connects to the socket server
  socket.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Track user online status (when user logs in)
    socket.on("userOnline", async (userId) => {
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

      // Save the new message to the database
      const newMessage = new Message({
        sender: senderId,
        content: content || "",
        conversationId,
        media: media || "", // Handle media if provided
      });

      await newMessage.save();

      // Emit the new message event to the specific conversation
      socket.to(conversationId).emit("message:receive", {
        conversationId,
        message: newMessage
      });

      // Update the conversation with the last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });
    });

    // Listen for a user joining a conversation
    socket.on("joinConversation", async (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Listen for a user leaving a conversation
    socket.on("leaveConversation", async (conversationId) => {
      socket.leave(conversationId);
      console.log(`User left conversation: ${conversationId}`);
    });

  });
};

module.exports = socketIO;
