// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { getChats } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');

    const fetchChats = async () => {
      const data = await getChats();
      setChats(data);
      if (data.length > 0) setSelectedChat(data[0]);
    };

    fetchChats();
  }, [navigate]);

  return (
    <div className="flex h-screen">
      {/* Sidebar removed as it is not used */}
      <ChatWindow selectedChat={selectedChat} />
    </div>
  );
};

export default Dashboard;
