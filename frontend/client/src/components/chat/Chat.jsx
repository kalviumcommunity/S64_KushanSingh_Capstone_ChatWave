import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import NewChatModal from './NewChatModal';
import GroupChatModal from './GroupChatModal';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleConversationUpdate = (updatedConversation) => {
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv._id === updatedConversation._id ? updatedConversation : conv
      )
    );
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col ${isMobile ? (showSidebar ? 'block' : 'hidden') : 'block'}`}>
        {/* ... rest of the sidebar code ... */}
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${isMobile ? (showSidebar ? 'hidden' : 'block') : 'block'}`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onDeleteChat={handleDeleteChat}
            onDeleteHistory={handleDeleteHistory}
            onConversationUpdate={handleConversationUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
              <p className="mt-1 text-sm text-gray-500">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConversationCreated={handleNewConversation}
      />
      <GroupChatModal
        isOpen={showGroupChatModal}
        onClose={() => setShowGroupChatModal(false)}
        onGroupCreated={handleNewConversation}
      />
    </div>
  );
};

export default Chat; 