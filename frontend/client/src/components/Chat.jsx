import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">ChatWave</h2>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Welcome, {user.username}!</p>
          </div>
        </div>
        {/* Add your chat list/contacts here */}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Welcome to ChatWave!</h3>
              <p className="text-gray-600">
                This is your chat dashboard. You can start conversations with other users here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 