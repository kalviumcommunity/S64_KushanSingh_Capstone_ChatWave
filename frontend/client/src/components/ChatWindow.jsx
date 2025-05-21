import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [currentUser] = useState({
    id: '1',
    name: 'Current User',
    avatar: 'https://via.placeholder.com/40'
  });

  const handleSendMessage = (message, file) => {
    const newMessage = {
      id: Date.now(),
      text: message,
      file: file,
      sender: currentUser,
      timestamp: new Date().toISOString()
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <ChatHeader currentUser={currentUser} />
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} currentUser={currentUser} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow; 