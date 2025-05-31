import { useState } from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';
import { chatAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const Message = ({ message, isOwnMessage, showAvatar }) => {
  const [showOptions, setShowOptions] = useState(false);
  console.log('Message object:', message);

  const handleDeleteMessage = async () => {
    try {
      await chatAPI.deleteMessage(message._id);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
    setShowOptions(false);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0 mr-2">
          <img
            src={message.sender.profilePic || '/default-avatar.png'}
            alt={message.sender.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}
      <div className="relative max-w-[70%]">
        {showAvatar && !isOwnMessage && (
          <span className="text-xs text-gray-500 mb-1 block">
            {message.sender.username}
          </span>
        )}
        <div
          className={`p-4 rounded-2xl shadow-sm transition-all duration-200 ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
          }`}
        >
          {message.media && (
            <img
              src={message.media}
              alt="Message attachment"
              className="max-w-full h-auto rounded-lg mb-2"
            />
          )}
          <p className="text-sm break-words">{message.content || message.text}</p>
          <div className="flex items-center justify-end mt-1 space-x-1">
            <span
              className={`text-xs ${
                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {formatTime(message.createdAt)}
            </span>
            {isOwnMessage && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 hover:bg-opacity-10 hover:bg-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showOptions && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                    <button
                      onClick={handleDeleteMessage}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {message.readBy?.length > 0 && isOwnMessage && (
          <div className="flex items-center justify-end mt-1">
            <span className="text-xs text-gray-500">
              Read by {message.readBy.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message; 