const setupSocket = (io) => {
    io.on('connection', (socket) => {
      console.log('🟢 New client connected:', socket.id);
  
      // Join personal room
      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`👤 User ${userId} joined their room`);
      });
  
      // Send message
      socket.on('sendMessage', ({ senderId, receiverId, message }) => {
        io.to(receiverId).emit('receiveMessage', {
          senderId,
          message,
        });
      });
  
      // Typing Indicator
      socket.on('typing', ({ senderId, receiverId }) => {
        io.to(receiverId).emit('typing', { senderId });
      });
  
      socket.on('stopTyping', ({ senderId, receiverId }) => {
        io.to(receiverId).emit('stopTyping', { senderId });
      });
  
      // Disconnect
      socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
      });
    });
  };
  
  module.exports = setupSocket;
  