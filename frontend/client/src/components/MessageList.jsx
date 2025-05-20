import React from 'react';

const MessageList = ({ messages, currentUser }) => {
  return (
    <div className="flex flex-col p-4 space-y-4 overflow-y-auto h-full">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.sender.id === currentUser.id
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800'
            }`}
          >
            {message.sender.id !== currentUser.id && (
              <div className="flex items-center mb-1">
                <img
                  src={message.sender.avatar}
                  alt={message.sender.name}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="text-sm font-semibold">{message.sender.name}</span>
              </div>
            )}
            <p className="text-sm">{message.text}</p>
            <span className="text-xs opacity-70 mt-1 block">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList; 