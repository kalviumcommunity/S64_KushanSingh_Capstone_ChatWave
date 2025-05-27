import React, { useState } from 'react';

const MessageActions = ({ message, currentUser, onEdit, onDelete, isEditing, setEditingMessageId }) => {
  const [editedText, setEditedText] = useState(message.text);

  const handleEdit = () => {
    setEditingMessageId(message._id);
  };

  const handleSave = () => {
    onEdit(message._id, editedText);
    setEditingMessageId(null);
  };

  const handleCancel = () => {
    setEditedText(message.text);
    setEditingMessageId(null);
  };

  // Use both _id and id for comparison
  const senderId = message.sender._id || message.sender.id;
  const userId = currentUser._id || currentUser.id;
  if (senderId !== userId) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center space-x-2 bg-yellow-100 p-1 rounded">
      <span style={{ color: 'red', fontWeight: 'bold' }}>ACTIONS</span>
      {isEditing ? (
        <div className="flex space-x-2">
          <input
            type="text"
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            className="text-black px-2 py-1 rounded border"
            style={{ minWidth: 80 }}
          />
          <button
            onClick={handleSave}
            className="text-green-500 hover:text-green-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="text-blue-500 hover:text-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(message._id)}
            className="text-red-500 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageActions; 