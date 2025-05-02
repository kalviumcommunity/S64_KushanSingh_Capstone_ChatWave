import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
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
      transports: ['websocket', 'polling'],
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
      },
      upgrade: true,
      rememberUpgrade: true,
      rejectUnauthorized: false
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

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('userOffline', user._id);
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}; 