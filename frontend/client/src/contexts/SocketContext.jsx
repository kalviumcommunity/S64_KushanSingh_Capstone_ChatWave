import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('No user, skipping socket connection');
      return;
    }

    console.log('Connecting to socket server...');
    const socketUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
    const newSocket = io(socketUrl, {
      withCredentials: true,
      auth: {
        token: user.token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      newSocket.emit('userOnline', user._id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat server');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Socket error occurred');
    });

    // Handle user online/offline status updates
    newSocket.on('updateUserStatus', ({ userId, isOnline }) => {
      console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Listen for the full list of online users
    newSocket.on('onlineUsers', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    newSocket.on('newMessageNotification', (data) => {
      console.log('New message notification:', data);
      const { message, sender } = data;
      setNotifications(prev => [...prev, data]);
      
      toast.custom((t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
          <img 
            src={sender.profilePic || '/default-avatar.png'} 
            alt={sender.username}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="font-semibold text-gray-800">{sender.username}</p>
            <p className="text-sm text-gray-600 truncate max-w-xs">
              {message.content || 'Sent a message'}
            </p>
          </div>
        </div>
      ), {
        duration: 4000,
        position: 'top-right'
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      if (newSocket) {
        newSocket.emit('userOffline', user._id);
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, [user]);

  const clearNotification = (conversationId) => {
    setNotifications(prev => prev.filter(n => n.conversationId !== conversationId));
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotification, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
}; 