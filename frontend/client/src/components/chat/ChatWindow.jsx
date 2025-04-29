import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ messages = [] }) => {
  return (
    <div className="flex flex-col justify-between w-3/4 h-full">
      <MessageList messages={messages} />
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
