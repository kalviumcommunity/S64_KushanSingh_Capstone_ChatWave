import React from 'react';
import UserAvatar from '../shared/UserAvatar';

const Sidebar = ({ conversations = [] }) => {
  return (
    <div className="w-1/4 bg-gray-100 h-full p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Chats</h2>
      <div className="flex flex-col gap-4">
        {conversations.map((conv) => (
          <div key={conv.id} className="flex items-center gap-4 p-2 bg-white rounded-xl shadow hover:bg-primary-light cursor-pointer transition">
            <UserAvatar src={conv.avatar} alt={conv.name} size="10" />
            <div>
              <p className="font-semibold">{conv.name}</p>
              <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
