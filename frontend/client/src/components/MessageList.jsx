import React from 'react';

const MessageList = ({ messages, currentUser }) => {
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
            {message.text && <p className="text-sm">{message.text}</p>}
            {message.file && renderFilePreview(message.file)}
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