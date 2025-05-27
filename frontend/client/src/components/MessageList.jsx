import React, { useEffect, useState } from 'react';
import MessageActions from './MessageActions';

const MessageList = ({ messages, currentUser, onEditMessage, onDeleteMessage }) => {
  const [editingMessageId, setEditingMessageId] = useState(null);

  useEffect(() => {
    console.log('MessageList received messages:', messages);
    console.log('Current user:', currentUser);
    setEditingMessageId(null); // Reset editing when messages change
  }, [messages, currentUser]);

  const renderFilePreview = (file) => {
    if (!file) return null;

    const isImage = file.mimetype?.startsWith('image/');
    const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

    if (isImage) {
      return (
        <div className="mt-2">
          <img
            src={fileUrl}
            alt={file.filename}
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(fileUrl, '_blank')}
            onError={(e) => {
              console.error('Image load error:', e);
              e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
            }}
          />
        </div>
      );
    }

    return (
      <div className="mt-2">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-sm text-gray-700">{file.filename}</span>
        </a>
      </div>
    );
  };

  return (
    <div className="flex flex-col p-4 space-y-4 overflow-y-auto h-full">
      {messages && messages.length > 0 ? (
        messages.map((message) => {
          const senderId = message.sender._id || message.sender.id;
          const userId = currentUser._id || currentUser.id;
          const isOwnMessage = senderId === userId;
          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 relative ${
                  isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                }`}
              >
                {!isOwnMessage && (
                  <div className="flex items-center mb-1">
                    <img
                      src={message.sender.avatar || 'https://via.placeholder.com/40'}
                      alt={message.sender.username}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-sm font-semibold">{message.sender.username}</span>
                  </div>
                )}
                {message.text && <p className="text-sm">{message.text}</p>}
                {message.file && renderFilePreview(message.file)}
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
                {/* Always show actions for your own messages */}
                {isOwnMessage && (
                  <MessageActions
                    message={message}
                    currentUser={currentUser}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    isEditing={editingMessageId === message._id}
                    setEditingMessageId={setEditingMessageId}
                  />
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No messages yet. Start the conversation!</p>
        </div>
      )}
    </div>
  );
};

export default MessageList; 