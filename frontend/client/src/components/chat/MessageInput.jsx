import React, { useState } from 'react';
import Button from '../shared/Button';

const MessageInput = () => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      console.log('Send:', text);
      setText('');
    }
  };

  return (
    <div className="p-4 bg-white flex items-center gap-4">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
};

export default MessageInput;
