import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConversationList = ({ currentUser, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/search?q=${query}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const createConversation = async (userId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/conversations', {
        participants: [currentUser.id, userId]
      });
      setConversations([...conversations, response.data.data]);
      setShowNewChatModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(() => {
          const validConversations = conversations.filter(conversation => {
            const other = conversation.participants.find(p => p._id !== currentUser.id && p.username);
            return !!other;
          });
          if (validConversations.length === 0) return null;
          const conversation = validConversations[validConversations.length - 1];
          const other = conversation.participants.find(p => p._id !== currentUser.id && p.username);
          return (
            <div
              key={conversation._id}
              onClick={() => onSelectConversation(conversation)}
              className="p-4 border-b hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center">
                <img
                  src={other.avatar || 'https://via.placeholder.com/40'}
                  alt={other.username}
                  className="w-8 h-8 rounded-full mr-3"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{other.username}</h3>
                  <p className="text-sm text-gray-500">
                    {conversation.lastMessage ? conversation.lastMessage : 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">New Chat</h2>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
            />
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => createConversation(user._id)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                >
                  <div className="flex items-center">
                    <img
                      src={user.avatar || 'https://via.placeholder.com/40'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList; 