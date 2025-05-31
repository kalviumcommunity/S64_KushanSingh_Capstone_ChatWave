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
          user.lastSeen = new Date();
          await user.save();

          // Notify others about user's online status
          io.of("/api").emit('updateUserStatus', { userId: socket.userId, isOnline: true });
        }
      } catch (error) {
        console.error('User status update error:', error);
      }
    }

    // Handle new messages
    socket.on('newMessage', async (data) => {
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

        // Create and save the message
        const message = new Message({
          conversation: conversationId,
          sender: senderId,
          recipient: recipientId,
          content,
          media
        });

        await message.save();

        // Populate the message with sender details
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username profilePicture')
          .populate('recipient', 'username profilePicture');

        // Update conversation's last message and activity
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        await conversation.save();

        // Emit the message to all participants in the conversation
        io.of("/api").to(conversationId).emit('message:receive', {
          conversationId,
          message: populatedMessage
        });

        // Notify the sender that the message was sent successfully
        socket.emit('message:sent', { messageId: message._id });
      } catch (error) {
        console.error('Message sending error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Join conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    // Leave conversation room
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      const { conversationId, isTyping } = data;
      socket.to(conversationId).emit('user:typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        try {
          const user = await User.findById(socket.userId);
          if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();

            // Notify others about user's offline status
            io.of("/api").emit('updateUserStatus', { userId: socket.userId, isOnline: false });
          }
        } catch (error) {
          console.error('User status update error:', error);
        }
      }
    });
  });
};

module.exports = initializeSocket; 