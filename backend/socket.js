const io = require("socket.io");
const User = require('./models/User');
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

// Map to keep track of online users
let onlineUsers = new Map();

// Function to initialize Socket.io
const socketIO = (server) => {
  const socket = io(server);

  // User connects to the socket server
  socket.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Track user online status (when user logs in)
    socket.on("userOnline", async (userId) => {
      onlineUsers.set(socket.id, userId);
      console.log(`User ${userId} is online.`);

      // Emit to all users that a user has come online
      socket.broadcast.emit("updateUserStatus", { userId, isOnline: true });

      // Emit the updated online user status to the current user
      socket.emit("updateUserStatus", { userId, isOnline: true });
    });

    // User disconnects from the socket server
    socket.on("disconnect", () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        console.log(`User ${userId} is offline.`);

        // Emit to all users that a user has gone offline
        socket.broadcast.emit("updateUserStatus", { userId, isOnline: false });
      }
    });

    // Listen for message seen event
    socket.on("messageSeen", async (messageData) => {
      const { messageId, userId, conversationId } = messageData;

      // Update the message as seen
      const message = await Message.findById(messageId);
      if (message && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();

        // Emit the message seen event to the specific conversation
        socket.to(conversationId).emit("messageSeen", messageData);
      }
    });

    // Listen for typing indicator event
    socket.on("typing", async (conversationId, userId) => {
      // Emit typing event to other users in the conversation
      socket.broadcast.to(conversationId).emit("typing", userId);

      // Optionally, add user to typing array in Conversation model
      const conversation = await Conversation.findById(conversationId);
      if (conversation && !conversation.isTyping.includes(userId)) {
        conversation.isTyping.push(userId);
        await conversation.save();
      }
    });

    // Listen for stop typing event
    socket.on("stopTyping", async (conversationId, userId) => {
      // Remove user from typing array in Conversation model
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.isTyping = conversation.isTyping.filter(
          (id) => id.toString() !== userId.toString()
        );
        await conversation.save();
      }

      // Emit stop typing event to other users in the conversation
      socket.broadcast.to(conversationId).emit("stopTyping", userId);
    });

    // Listen for new message event
    socket.on("newMessage", async (messageData) => {
      const { senderId, content, conversationId, media } = messageData;

      // Validate the incoming message data
      if (!senderId || !content || !conversationId) {
        return socket.emit("error", { message: "Message data is incomplete." });
      }

      // Save the new message to the database
      const newMessage = new Message({
        sender: senderId,
        content,
        conversationId,
        media: media || "", // Handle media if provided
      });

      await newMessage.save();

      // Emit the new message event to the specific conversation
      socket.to(conversationId).emit("newMessage", newMessage);

      // Update the conversation with the last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      // Optionally, update the last message in the participant's records (if needed)
      const participants = await Conversation.findById(conversationId).populate("participants");
      participants.forEach((participant) => {
        socket.to(participant._id.toString()).emit("newMessage", newMessage);
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
