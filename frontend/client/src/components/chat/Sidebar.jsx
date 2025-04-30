// src/components/chat/Sidebar.jsx
import UserAvatar from '../shared/UserAvatar';

const Sidebar = ({ chats, onSelectChat }) => {
  return (
    <div className="w-1/3 border-r border-gray-300 p-4 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Chats</h2>
      <ul>
        {chats.map(chat => (
          <li key={chat._id} onClick={() => onSelectChat(chat)} className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer rounded-md">
            <UserAvatar user={chat.participants[1]} />
            <span className="font-semibold">{chat.participants[1]?.name || 'User'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
