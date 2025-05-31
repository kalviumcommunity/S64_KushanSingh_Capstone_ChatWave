import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { chatAPI } from '../../utils/api';
import { Search, LogOut, MessageSquarePlus, Users, UserPlus } from 'lucide-react';
import ChatOptionsMenu from './ChatOptionsMenu';
import GroupChatModal from './GroupChatModal';

const ChatSidebar = ({ onSelectConversation, onOpenNewChat, conversations, setConversations }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Memoize the fetch conversations function
  const fetchConversations = useCallback(async () => {
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await chatAPI.getConversations();
        // Check if response.data is an array directly
        if (Array.isArray(response.data)) {
          setConversations(response.data);
          setLoading(false);
          return;
        }
        // If response.data has a conversations property
        else if (response.data && Array.isArray(response.data.conversations)) {
            setConversations(response.data.conversations);
            setLoading(false);
            return;
        }
        // If response.data has a data property containing conversations
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setConversations(response.data.data);
          setLoading(false);
          return;
        }
        else {
            console.error('Invalid response format:', response.data);
            throw new Error('Invalid response format from server');
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
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
  }, [logout, navigate, setConversations]);

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
  }, [conversations.length, setConversations]);

  // Memoize the handle select conversation function
  const handleSelectConversation = useCallback((conversation) => {
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

    // Batch state updates
    setConversations(prev => {
      const filtered = prev.filter(c => c._id !== conversation._id);
      return [conversation, ...filtered];
    });

    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      onSelectConversation(conversation);
    });
  }, [socket, user._id, onSelectConversation]);

  // Memoize socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setConversations(prevConversations => {
        const conversationIndex = prevConversations.findIndex(
          conv => conv._id === data.conversationId
        );

        if (conversationIndex === -1) {
          fetchConversations();
          return prevConversations;
        }

        const updatedConversations = [...prevConversations];
        const conversation = data.conversation || updatedConversations[conversationIndex];

          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);

        return updatedConversations;
      });
    };

    const handleMessageRead = (data) => {
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
  }, [socket, fetchConversations]);

  // Memoize filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const otherUser = conversation.participants.find(p => p._id !== user._id);
      return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, user._id]);

  // Memoize conversation item render function
  const renderConversationItem = useCallback((conversation) => {
    const isGroup = conversation.isGroup;
    const otherUser = !isGroup ? conversation.participants.find(p => p._id !== user._id) : null;
    const hasUnreadMessages = conversation.lastMessage && 
      conversation.lastMessage.sender._id !== user._id && 
      !conversation.lastMessage.readBy?.includes(user._id);

    return (
      <div
        key={conversation._id}
        className={`flex items-center p-4 mb-2 bg-white rounded-xl shadow-sm transition-all duration-150 ease-in-out hover:shadow-md hover:bg-gray-50 cursor-pointer border border-gray-100 ${
          hasUnreadMessages ? 'bg-blue-50' : ''
        }`}
        onClick={() => handleSelectConversation(conversation)}
      >
        <div className="relative">
          {isGroup ? (
            <div className="w-12 h-12 rounded-full mr-4 bg-blue-100 flex items-center justify-center ring-2 ring-blue-400 shadow-sm">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          ) : (
            <img
              src={otherUser?.profilePic || '/default-avatar.png'}
              alt={otherUser?.username}
              className="w-12 h-12 rounded-full mr-4 object-cover ring-2 ring-blue-400 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className={`font-semibold text-gray-900 truncate text-base transition-all duration-150 ease-in-out ${
              hasUnreadMessages ? 'font-bold' : ''
            }`}>
              {isGroup ? conversation.name : otherUser?.username}
            </h3>
            <span className={`text-xs whitespace-nowrap ml-2 font-medium transition-all duration-150 ease-in-out ${
              hasUnreadMessages ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {conversation.lastMessage?.createdAt
                ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ' '}
            </span>
          </div>
          <p className={`text-sm truncate font-light transition-all duration-150 ease-in-out ${
            hasUnreadMessages ? 'text-gray-900 font-medium' : 'text-gray-500'
          }`}>
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
        </div>
        <ChatOptionsMenu
          conversationId={conversation._id}
          onDeleteHistory={() => handleDeleteHistory(conversation._id)}
          onDeleteChat={() => handleDeleteChat(conversation._id)}
          isGroup={isGroup}
        />
      </div>
    );
  }, [user._id, handleSelectConversation]);

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

  const handleGroupCreated = (newGroup) => {
    setConversations(prev => [newGroup, ...prev]);
    onSelectConversation(newGroup);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
          <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-all duration-150 ease-in-out"
            onClick={() => navigate('/profile')}
          >
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-400 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105"
              />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-blue-400 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105">
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
              onClick={() => setIsGroupModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-150 ease-in-out hover:scale-105"
              title="Create Group Chat"
            >
              <Users className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onOpenNewChat}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-150 ease-in-out hover:scale-105"
              title="New Chat"
            >
              <MessageSquarePlus className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-150 ease-in-out hover:scale-105"
              title="Logout"
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
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-150 ease-in-out"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquarePlus className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No conversations yet</p>
            <div className="flex space-x-4 mt-4">
            <button
                onClick={onOpenNewChat}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 ease-in-out hover:scale-105 shadow-sm"
            >
              Start New Chat
            </button>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-150 ease-in-out hover:scale-105 shadow-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        ) : (
          filteredConversations.map(renderConversationItem)
        )}
      </div>

      <GroupChatModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
        currentUser={user}
      />
    </div>
  );
};

export default ChatSidebar; 