import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { Send, Image, Smile, MoreVertical, Paperclip, X } from 'lucide-react';
import api from '../../utils/api';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const ChatWindow = ({ conversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);

  const otherUser = conversation.participants.find(p => p._id !== user._id);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${conversation._id}`);
        setMessages(response.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
        toast.error('Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:receive', (data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    socket.on('user:typing', (data) => {
      if (data.userId === otherUser._id) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socket.off('message:receive');
      socket.off('user:typing');
    };
  }, [socket, conversation._id, otherUser._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (typingTimeout) clearTimeout(typingTimeout);

    socket.emit('user:typing', {
      conversationId: conversation._id,
      isTyping: true
    });

    const timeout = setTimeout(() => {
      socket.emit('user:typing', {
        conversationId: conversation._id,
        isTyping: false
      });
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('senderId', user._id);
      formData.append('conversationId', conversation._id);
      formData.append('content', newMessage);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
        <img
          src={otherUser?.profilePicture || '/default-avatar.png'}
          alt={otherUser?.username}
          className="w-10 h-10 rounded-full mr-4 object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{otherUser?.username}</h3>
          {isTyping && (
            <p className="text-sm text-gray-500">typing...</p>
          )}
        </div>
        <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender === user._id ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === user._id
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                {message.media && (
                  <img
                    src={message.media}
                    alt="Message attachment"
                    className="max-w-full h-auto rounded-lg mb-2"
                  />
                )}
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {previewUrl && (
          <div className="relative mb-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs rounded-lg"
            />
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message"
            className="flex-1 px-4 py-2 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Smile className="w-5 h-5 text-gray-600" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <Picker
                  data={data}
                  onEmojiSelect={addEmoji}
                  theme="light"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
