import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { chatAPI } from '../../utils/api';
import { Search, LogOut, MessageSquarePlus, Sun, Moon } from 'lucide-react';
import ChatOptionsMenu from './ChatOptionsMenu';

const ChatSidebar = ({ onSelectConversation, onOpenNewChat, conversations, setConversations }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await chatAPI.getConversations();
          if (response.data && response.data.success && Array.isArray(response.data.conversations)) {
            setConversations(response.data.conversations);
            setLoading(false);
            return;
          } else {
            console.error('Invalid response format:', response.data);
            throw new Error('Invalid response format from server');
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers
            }
          });
          retries--;
          if (retries === 0) {
            if (error.response?.status === 401) {
              toast.error('Session expired. Please login again.');
              logout();
              navigate('/login');
            } else if (error.response?.status >= 500 || !error.response) {
              toast.error('Failed to fetch conversations. Please try refreshing the page.');
            } else {
              toast.error('Failed to fetch conversations. Please try again later.');
            }
            setLoading(false);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };

    fetchConversations();
  }, [logout, navigate, setConversations]);

  // Refetch conversations when a new one is added
  useEffect(() => {
    if (conversations.length > 0) {
      const fetchLatestConversations = async () => {
        try {
          const response = await chatAPI.getConversations();
          if (response.data && response.data.success && Array.isArray(response.data.conversations)) {
            setConversations(response.data.conversations);
          }
        } catch (error) {
          console.error('Error refreshing conversations:', error);
        }
      };
      fetchLatestConversations();
    }
  }, [conversations.length]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      console.log('Received new message:', data);
      setConversations(prevConversations => {
        // Find the conversation that needs to be updated
        const conversationIndex = prevConversations.findIndex(
          conv => conv._id === data.conversationId
        );

        if (conversationIndex === -1) {
          // If conversation not found, fetch all conversations
          fetchConversations();
          return prevConversations;
        }

        // Create a new array to avoid mutating state
        const updatedConversations = [...prevConversations];
        const conversation = data.conversation || updatedConversations[conversationIndex];

        // Remove the conversation from its current position
        updatedConversations.splice(conversationIndex, 1);
        // Add it to the beginning of the array
        updatedConversations.unshift(conversation);

        return updatedConversations;
      });
    };

    const handleMessageRead = (data) => {
      console.log('Message read update:', data);
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv._id === data.conversationId) {
            return data.conversation || {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                readBy: [...(conv.lastMessage?.readBy || []), data.userId]
              }
            };
          }
          return conv;
        });
      });
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:read', handleMessageRead);
    };
  }, [socket]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleDeleteHistory = (conversationId) => {
    setConversations(prev => prev.map(conv => {
      if (conv._id === conversationId) {
        return { ...conv, lastMessage: null };
      }
      return conv;
    }));
  };

  const handleDeleteChat = async (conversationId) => {
    try {
      await chatAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      onSelectConversation(null);
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const handleSelectConversation = (conversation) => {
    // Mark messages as read when selecting a conversation
    if (conversation.lastMessage && 
        conversation.lastMessage.sender._id !== user._id && 
        !conversation.lastMessage.readBy?.includes(user._id)) {
      socket.emit('message:read', {
        messageId: conversation.lastMessage._id,
        userId: user._id,
        conversationId: conversation._id
      });
    }

    onSelectConversation(conversation);
    setConversations(prev => {
      const filtered = prev.filter(c => c._id !== conversation._id);
      return [conversation, ...filtered];
    });
  };

  const filteredConversations = conversations.filter(conversation => {
    const otherUser = conversation.participants.find(p => p._id !== user._id);
    return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => navigate('/profile')}
            >
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-400 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-blue-400 shadow-sm">
                  <span className="text-gray-500 text-sm font-semibold">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-semibold text-gray-800 text-lg">{user?.username}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewChat}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MessageSquarePlus className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquarePlus className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No conversations yet</p>
            <button
              onClick={onOpenNewChat}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherUser = conversation.participants.find(p => p._id !== user._id);
            const hasUnreadMessages = conversation.lastMessage && 
              conversation.lastMessage.sender._id !== user._id && 
              !conversation.lastMessage.readBy?.includes(user._id);

            return (
              <div
                key={conversation._id}
                className={`flex items-center p-4 mb-2 bg-white rounded-xl shadow transition-all duration-200 hover:shadow-md hover:bg-gray-50 cursor-pointer border border-gray-100 ${
                  hasUnreadMessages ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="relative">
                  <img
                    src={otherUser?.profilePic || '/default-avatar.png'}
                    alt={otherUser?.username}
                    className="w-12 h-12 rounded-full mr-4 object-cover ring-2 ring-blue-400 shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-semibold text-gray-900 truncate text-base ${
                      hasUnreadMessages ? 'font-bold' : ''
                    }`}>
                      {otherUser?.username}
                    </h3>
                    <span className={`text-xs whitespace-nowrap ml-2 font-medium ${
                      hasUnreadMessages ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {new Date(conversation.lastMessage?.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className={`text-sm truncate font-light ${
                    hasUnreadMessages ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                <ChatOptionsMenu
                  conversationId={conversation._id}
                  onDeleteHistory={() => handleDeleteHistory(conversation._id)}
                  onDeleteChat={() => handleDeleteChat(conversation._id)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar; 