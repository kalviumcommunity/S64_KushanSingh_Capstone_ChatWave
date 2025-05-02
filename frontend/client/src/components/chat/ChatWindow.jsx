import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Send, Image, Smile, MoreVertical, Paperclip, X, Bell } from 'lucide-react';
import api, { chatAPI } from '../../utils/api';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import ChatOptionsMenu from './ChatOptionsMenu';

const ChatWindow = ({ conversation, onDeleteChat, onDeleteHistory }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { socket, notifications, clearNotification } = useSocket();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const otherUser = conversation.participants.find(p => p._id !== user._id);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/messages/${conversation._id}`);
        setMessages(response.data.messages);
        // Clear notification when opening conversation
        clearNotification(conversation._id);
        setHasNewMessage(false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        toast.error('Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation._id, clearNotification]);

  useEffect(() => {
    if (!socket) return;

    // Join the conversation room when component mounts
    socket.emit('joinConversation', conversation._id);

    const handleNewMessage = (data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg._id === data.message._id);
          if (!exists) {
            // Remove any optimistic message for this content
            const filtered = prev.filter(msg => 
              !msg.isOptimistic || msg.content !== data.message.content
            );
            return [...filtered, data.message];
          }
          return prev;
        });
        scrollToBottom();
        setHasNewMessage(false);
      } else {
        // If message is from another conversation, show notification
        setHasNewMessage(true);
      }
    };

    // Listen for new messages
    socket.on('message:receive', handleNewMessage);

    // Listen for message updates
    socket.on('message:update', (data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, content: data.content } : msg
        ));
      }
    });

    // Listen for typing indicators
    socket.on('user:typing', (data) => {
      if (data.userId === otherUser._id) {
        setIsTyping(data.isTyping);
      }
    });

    // Cleanup when component unmounts
    return () => {
      socket.emit('leaveConversation', conversation._id);
      socket.off('message:receive', handleNewMessage);
      socket.off('message:update');
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
      formData.append('conversationId', conversation._id);
      formData.append('content', newMessage);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      // Optimistically update the UI
      const tempMessage = {
        _id: Date.now().toString(), // Temporary ID
        sender: user,
        content: newMessage,
        media: selectedFile ? URL.createObjectURL(selectedFile) : null,
        createdAt: new Date(),
        isOptimistic: true
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
      scrollToBottom();

      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        // Remove the optimistic message and add the real one
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isOptimistic);
          return [...filtered, response.data.data];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${otherUser._id}`);
  };

  // Add delete handlers for chat and history
  const handleDeleteHistory = async () => {
    try {
      await chatAPI.deleteChatHistory(conversation._id);
      toast.success('Chat history deleted');
      setMessages([]);
      if (onDeleteHistory) onDeleteHistory(conversation._id);
    } catch (error) {
      console.error('Error deleting chat history:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat history');
    }
  };

  const handleDeleteChat = async () => {
    try {
      await chatAPI.deleteConversation(conversation._id);
      toast.success('Chat deleted successfully');
      if (onDeleteChat) onDeleteChat(conversation._id);
      // Optionally, navigate away or clear chat window
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
          onClick={handleProfileClick}
        >
          <img
            src={otherUser?.profilePic || '/default-avatar.png'}
            alt={otherUser?.username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
          />
          <div>
            <h3 className="font-semibold text-gray-800">{otherUser?.username}</h3>
            {isTyping && (
              <p className="text-sm text-gray-500">typing...</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-auto">
          {hasNewMessage && (
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
          )}
          <ChatOptionsMenu
            conversationId={conversation._id}
            onDeleteHistory={handleDeleteHistory}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.sender._id === user._id
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
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
                <span className={`text-xs mt-1 block ${message.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'}`}>
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
      <div className="p-4 border-t border-gray-200 bg-white">
        {previewUrl && (
          <div className="relative mb-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs rounded-lg shadow-sm"
            />
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
            className="flex-1 px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
