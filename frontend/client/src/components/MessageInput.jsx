import React, { useState } from 'react';
import FileUpload from './FileUpload';
import axios from '../utils/axios';

const MessageInput = ({ conversationId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !attachedFile) || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (message.trim()) {
        formData.append('text', message.trim());
      }
      if (attachedFile) {
        formData.append('file', attachedFile);
      }
      formData.append('conversationId', conversationId);

      await axios.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('');
      setAttachedFile(null);
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (file) => {
    setAttachedFile(file);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      {attachedFile && (
        <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            {attachedFile.type?.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(attachedFile)}
                alt={attachedFile.name}
                className="w-8 h-8 object-cover rounded mr-2"
                onError={(e) => {
                  console.error('Preview image load error:', e);
                  e.target.src = 'https://via.placeholder.com/32?text=Error';
                }}
              />
            ) : (
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
            <span className="text-sm text-gray-600">{attachedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <FileUpload onFileUpload={handleFileUpload} />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={(!message.trim() && !attachedFile) || isSending}
          className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            ${(!message.trim() && !attachedFile) || isSending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default MessageInput; 