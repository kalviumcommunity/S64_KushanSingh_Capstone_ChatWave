// src/components/chat/MessageInput.jsx
import { useState } from 'react';
import { sendMessage } from '../../utils/api';
import { Send } from 'lucide-react';

const MessageInput = ({ selectedChat, onMessageSent }) => {
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const newMessage = await sendMessage(selectedChat._id, content);
      onMessageSent(newMessage);
      setContent('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 border-t border-gray-300">
      <input
        type="text"
        placeholder="Type your message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-3 rounded-full bg-gray-100 outline-none"
      />
      <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;
