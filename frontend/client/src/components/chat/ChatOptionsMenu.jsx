import { useState } from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';
import { chatAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const ChatOptionsMenu = ({ conversationId, onDeleteHistory, onDeleteChat }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteHistory = async () => {
    try {
      await chatAPI.deleteChatHistory(conversationId);
      toast.success('Chat history deleted');
      onDeleteHistory?.();
    } catch (error) {
      console.error('Error deleting chat history:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat history');
    }
    setIsOpen(false);
  };

  const handleDeleteChat = async () => {
    try {
      await chatAPI.deleteConversation(conversationId);
      toast.success('Chat deleted');
      onDeleteChat?.();
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Chat options"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          <button
            onClick={handleDeleteHistory}
            className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Delete Chat History
          </button>
          <button
            onClick={handleDeleteChat}
            className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Delete Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatOptionsMenu; 