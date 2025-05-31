import React from 'react';

const UserAvatar = ({ src, alt, size = '40' }) => {
  return (
    <img
      src={src || '/default-avatar.png'}
      alt={alt || 'User Avatar'}
      className={`w-${size} h-${size} rounded-full object-cover`}
    />
  );
};

export default UserAvatar;
