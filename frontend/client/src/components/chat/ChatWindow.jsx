import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Send, Image, Smile, MoreVertical, Paperclip, X, Bell, Users } from 'lucide-react';
import api, { chatAPI } from '../../utils/api';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import ChatOptionsMenu from './ChatOptionsMenu';
import Message from './Message';
import EmojiPicker from './EmojiPicker';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatWindow = ({ conversation, onDeleteChat, onDeleteHistory, onConversationUpdate }) => {
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
  const { socket, notifications, clearNotification, isUserOnline } = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const wasAtBottomRef = useRef(true);
  const prevMessagesLength = useRef(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const navigate = useNavigate();
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  const otherUser = conversation && !conversation.isGroup && Array.isArray(conversation.participants)
    ? conversation.participants.find(p => p._id !== user._id)
    : null;
  const isGroup = conversation?.isGroup;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/messages/${conversation._id}`);
        setMessages(response.data.messages);
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
    if (!socket || !conversation) return;
    socket.emit('joinConversation', conversation._id);
    const handleNewMessage = (data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === data.message._id);
          if (!exists) {
            const filtered = prev.filter(msg => 
              !msg.isOptimistic || msg.content !== data.message.content
            );
            return [...filtered, data.message];
          }
          return prev;
        });
        setHasNewMessage(false);
      }
    };
    socket.on('message:receive', handleNewMessage);
    socket.on('user:typing', (data) => {
      if (otherUser && data.userId === otherUser._id) {
        setIsTyping(data.isTyping);
      }
    });
    return () => {
      socket.emit('leaveConversation', conversation._id);
      socket.off('message:receive', handleNewMessage);
      socket.off('user:typing');
    };
  }, [socket, conversation?._id, otherUser?._id]);

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
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
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

      const tempMessage = {
        _id: Date.now().toString(),
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
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isOptimistic);
          return [...filtered, response.data.data];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${otherUser._id}`);
  };

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
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const getOtherParticipants = () => {
    if (!conversation) return [];
    return conversation.participants.filter(p => p._id !== user._id);
  };

  const handleGroupUpdated = (updatedGroup) => {
    if (onConversationUpdate) {
      onConversationUpdate(updatedGroup);
    }
  };

  const renderHeader = () => {
    if (!conversation) return null;

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          {conversation.isGroup ? (
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {conversation.name ? conversation.name[0].toUpperCase() : 'G'}
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={otherUser?.profilePic || '/default-avatar.png'}
                alt={otherUser?.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isUserOnline(otherUser?._id) ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {conversation.isGroup ? conversation.name : otherUser?.username}
            </h2>
            {!conversation.isGroup && (
              <p className="text-sm text-gray-500">
                {isUserOnline(otherUser?._id) ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setOptionsMenuOpen((open) => !open)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          {optionsMenuOpen && (
            <ChatOptionsMenu
              conversationId={conversation._id}
              onDeleteHistory={handleDeleteHistory}
              onDeleteChat={handleDeleteChat}
              isGroup={conversation.isGroup}
              group={conversation}
              onGroupUpdated={handleGroupUpdated}
              isOpen={optionsMenuOpen}
              onOpen={() => setOptionsMenuOpen(true)}
              onClose={() => setOptionsMenuOpen(false)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {renderHeader()}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100"
      >
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
            <Message
              key={message._id}
              message={message}
              isOwnMessage={message.sender && message.sender._id === user._id}
              showAvatar={conversation?.isGroup}
            />
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
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
            aria-label="Attach image"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Attach file"
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
            className="flex-1 px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors shadow-sm"
            aria-label="Type a message"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5 text-gray-600" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200">
                <EmojiPicker onSelect={addEmoji} />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
