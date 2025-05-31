import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileUpload = ({ onFileUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]); // Only upload the first file

      const response = await axios.post('http://localhost:5000/api/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onFileUpload) {
        onFileUpload(response.data.file);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Error uploading file. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  return (
    <div className="relative">
      <button
        type="button"
        {...getRootProps()}
        className={`p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isDragActive ? 'bg-blue-50' : ''}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={uploading}
      >
        <input {...getInputProps()} />
        <svg
          className="w-6 h-6 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 left-0 p-2 bg-red-50 border border-red-200 rounded text-red-500 text-xs whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 