# 🌊 ChatWave

A real-time, secure, and scalable messaging platform built with Node.js, Express, MongoDB, Socket.io, and React.

## 🚀 Features

- Real-time messaging with Socket.io
- Secure user authentication with JWT
- MongoDB for data storage
- Modern React frontend with Tailwind CSS
- User presence tracking
- Typing indicators
- Message read receipts
- Responsive design

## 🛠️ Tech Stack

### Backend
- Node.js
- Express
- MongoDB
- Socket.io
- JWT Authentication
- Redis (optional, for caching)

### Frontend
- React
- Tailwind CSS
- Socket.io Client
- React Router
- React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatwave
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend/client directory with the following variables:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### MongoDB
- Make sure MongoDB is running on your local machine
- Update the `MONGODB_URI` in the backend `.env` file if needed

### Redis (Optional)
- Install Redis on your machine
- Uncomment and update the Redis configuration in the backend `.env` file

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Chat
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/messages/:conversationId` - Get messages for a conversation
- `PUT /api/chat/messages/read` - Mark messages as read
- `DELETE /api/chat/messages/:messageId` - Delete a message
- `GET /api/chat/users/search` - Search users

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.io for real-time communication
- MongoDB for database
- React for frontend framework
- Tailwind CSS for styling
