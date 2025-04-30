// src/components/chat/MessageList.jsx
import { useEffect, useState } from 'react';
import { getMessages } from '../../utils/api';
import UserAvatar from '../shared/UserAvatar';

const MessageList = ({ selectedChat }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat?._id) {
        const data = await getMessages(selectedChat._id);
        setMessages(data);
      }
    };
    fetchMessages();
  }, [selectedChat]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map(msg => (
        <div key={msg._id} className="mb-4 flex items-start gap-2">
          <UserAvatar user={msg.sender} />
          <div className="bg-gray-200 p-3 rounded-xl">
            <p>{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
