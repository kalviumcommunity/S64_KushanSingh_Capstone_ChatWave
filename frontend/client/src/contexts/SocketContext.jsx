import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(baseURL, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      path: '/socket.io',
      withCredentials: true,
      query: {
        token
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      // Emit user online status
      newSocket.emit('userOnline', user._id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message === 'xhr poll error') {
        console.log('Polling error, attempting to reconnect...');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => {
          if (!newSocket.connected) {
            newSocket.connect();
          }
        }, 1000);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle new message notifications
    newSocket.on('newMessageNotification', (data) => {
      const { message, sender } = data;
      setNotifications(prev => [...prev, data]);
      
      // Show toast notification
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

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotification }}>
      {children}
    </SocketContext.Provider>
  );
}; 