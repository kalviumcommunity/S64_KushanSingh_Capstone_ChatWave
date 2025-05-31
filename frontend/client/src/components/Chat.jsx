import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConversationList from './ConversationList';
import axios from '../utils/axios';

const Chat = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    if (selectedConversation) {
      console.log('Selected conversation:', selectedConversation);
      fetchMessages();
    }
  }, [selectedConversation]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for conversation:', selectedConversation._id);
      const response = await axios.get(`/messages/${selectedConversation._id}`);
      console.log('Fetched messages:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      await axios.put(`/messages/${messageId}`, {
        text: newText
      });
      fetchMessages(); // Refresh messages after edit
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/messages/${messageId}`);
      fetchMessages(); // Refresh messages after deletion
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleMessageSent = () => {
    console.log('Message sent, refreshing messages...');
    fetchMessages();
  };

  return (
    <div className="flex w-screen h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">ChatWave</h2>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Welcome, {user.username}!</p>
          </div>
        </div>
        <ConversationList
          currentUser={user}
          onSelectConversation={setSelectedConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={messages}
                currentUser={user}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
              />
            </div>
            <div className="p-4 border-t bg-white">
              <MessageInput
                conversationId={selectedConversation._id}
                onMessageSent={handleMessageSent}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Welcome to ChatWave!</h3>
                <p className="text-gray-600">
                  Click "New Chat" to start a conversation or select an existing chat from the sidebar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 