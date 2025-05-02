import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { chatAPI } from '../../utils/api';
import { Search, LogOut, MessageSquarePlus } from 'lucide-react';
import ChatOptionsMenu from './ChatOptionsMenu';

const ChatSidebar = ({ onSelectConversation, onOpenNewChat }) => {
  const [conversations, setConversations] = useState([]);
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
          if (Array.isArray(response.data.conversations)) {
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
  }, [logout, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:receive', (data) => {
      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        const conversationIndex = updatedConversations.findIndex(
          conv => conv._id === data.conversationId
        );

        if (conversationIndex !== -1) {
          const conversation = updatedConversations[conversationIndex];
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);
        }

        return updatedConversations;
      });
    });

    return () => {
      socket.off('message:receive');
    };
  }, [socket]);

  const handleLogout = async () => {
    try {
      await logout();
      // No need to show success message as we're navigating away
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still navigate to login
      navigate('/login');
    }
  };

  const handleNewChat = async (selectedUser) => {
    try {
      const response = await chatAPI.createOrGetConversation(selectedUser._id);
      if (response.data && response.data.conversation) {
        const conversation = response.data.conversation;
        const exists = conversations.some(conv => conv._id === conversation._id);
        if (!exists) {
          setConversations(prev => [conversation, ...prev]);
        }
        onSelectConversation(conversation);
        toast.success('Chat started');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please login again to continue');
        } else {
          toast.error(error.response.data.message || 'Failed to start new chat');
        }
      } else {
        toast.error('Failed to start new chat. Please try again.');
      }
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

  const filteredConversations = conversations.filter(conversation => {
    const otherUser = conversation.participants.find(p => p._id !== user._id);
    return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
            onClick={() => navigate('/profile')}
          >
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-200">
                <span className="text-gray-500 text-sm font-semibold">
                  {user?.username?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-semibold text-gray-800">{user?.username}</span>
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
        <div className="relative">
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
      <div className="flex-1 overflow-y-auto">
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
            return (
              <div
                key={conversation._id}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
              >
                <div
                  className="flex-1 flex items-center"
                  onClick={() => onSelectConversation(conversation)}
                >
                  <img
                    src={otherUser?.profilePic || '/default-avatar.png'}
                    alt={otherUser?.username}
                    className="w-12 h-12 rounded-full mr-4 object-cover ring-2 ring-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 truncate">{otherUser?.username}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(conversation.lastMessage?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
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