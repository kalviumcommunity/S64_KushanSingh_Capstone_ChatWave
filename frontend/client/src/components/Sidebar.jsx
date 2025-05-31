import React from 'react';

const Sidebar = () => {
  const users = [
    {
      id: '1',
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/40',
      status: 'online',
      lastMessage: 'Hey, how are you?',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      name: 'Jane Smith',
      avatar: 'https://via.placeholder.com/40',
      status: 'offline',
      lastMessage: 'See you tomorrow!',
      timestamp: 'Yesterday'
    },
    // Add more users as needed
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 absolute left-3 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-80px)]">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </h3>
                  <span className="text-xs text-gray-500">{user.timestamp}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{user.lastMessage}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 