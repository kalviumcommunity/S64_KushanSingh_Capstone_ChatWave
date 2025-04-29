import React from 'react';

const MessageList = ({ messages = [] }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {messages.map((msg, index) => (
        <div key={index} className={`mb-4 flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
          <div className={`p-3 rounded-lg max-w-xs ${msg.isOwn ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
