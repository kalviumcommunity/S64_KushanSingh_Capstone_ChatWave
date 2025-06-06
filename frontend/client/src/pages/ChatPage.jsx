import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import { chatAPI } from '../utils/api';
import { toast } from 'react-hot-toast';

const ChatPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [conversations, setConversations] = useState([]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Handler for starting a new chat from anywhere
  const handleOpenNewChatModal = () => setIsNewChatModalOpen(true);
  const handleCloseNewChatModal = () => setIsNewChatModalOpen(false);

  // Handler for when a user is selected in the modal
  const handleSelectUser = async (selectedUser) => {
    try {
      console.log('Creating conversation with user:', selectedUser);
      const response = await chatAPI.createOrGetConversation(selectedUser._id);
      console.log('Server response:', response);
      
      if (response.data && response.data.success && response.data.conversation) {
        const conversation = response.data.conversation;
        console.log('Created conversation:', conversation);
        
        // Add to conversations if not already present
        setConversations(prev => {
          const exists = prev.some(conv => conv._id === conversation._id);
          if (!exists) {
            return [conversation, ...prev];
          }
          return prev.map(conv => 
            conv._id === conversation._id ? conversation : conv
          );
        });
        
        setSelectedConversation(conversation);
        setIsNewChatModalOpen(false);
        toast.success('Chat started');
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
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
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Please login again to continue');
        } else {
          toast.error(error.response.data?.message || 'Failed to start new chat');
        }
      } else {
        toast.error('Failed to start new chat. Please try again.');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <ChatSidebar 
          onSelectConversation={setSelectedConversation} 
          onOpenNewChat={handleOpenNewChatModal}
          conversations={conversations}
          setConversations={setConversations}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center p-8 max-w-md">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome to ChatWave
              </h2>
              <p className="text-gray-600 mb-6">
                Select a conversation or start a new chat to begin messaging
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleOpenNewChatModal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Start New Chat
                </button>
                <p className="text-sm text-gray-500">
                  Your messages are end-to-end encrypted
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={handleCloseNewChatModal}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
};

export default ChatPage; 