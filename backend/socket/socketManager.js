const { socketAuth } = require('../middleware/authMiddleware');
const { User, Message, Conversation } = require('../models');

const initializeSocket = (io) => {
  const connectedUsers = new Map();

  // Socket middleware for authentication
  io.use(socketAuth);

  io.of("/api").on("connection", async (socket) => {
    console.log('New client connected:', socket.id);

    // Store user connection
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);
      
      // Update user's online status
      try {
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = true;
          await user.save();

          // Notify others about user's online status
          socket.broadcast.emit('updateUserStatus', { userId: socket.userId, isOnline: true });
          socket.emit('updateUserStatus', { userId: socket.userId, isOnline: true });
        }
      } catch (error) {
        console.error('User status update error:', error);
      }
    }

    // Handle new messages
    socket.on('newMessage', async (data) => {
      try {
        const { senderId, content, conversationId, media } = data;

        // Save the message to the database
        const newMessage = new Message({
          sender: senderId,
          content: content || "",
          conversationId,
          media: media || ""
        });

        await newMessage.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id
        });

        // Emit the message to all users in the conversation
        io.to(conversationId).emit('message:receive', {
          conversationId,
          message: newMessage
        });
      } catch (error) {
        console.error('Message sending error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('user:typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.broadcast.to(conversationId).emit('user:typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle joining a conversation
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);

      // Find and update user's online status
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        try {
          const user = await User.findById(socket.userId);
          if (user) {
            user.isOnline = false;
            await user.save();
            socket.broadcast.emit('updateUserStatus', { userId: socket.userId, isOnline: false });
          }
        } catch (error) {
          console.error('User status update error:', error);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = initializeSocket; 