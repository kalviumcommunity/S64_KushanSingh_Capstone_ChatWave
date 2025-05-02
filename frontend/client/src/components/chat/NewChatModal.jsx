import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { chatAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let debounceTimer;
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await chatAPI.searchUsers(searchQuery);
        
        if (response.data && response.data.success && Array.isArray(response.data.users)) {
          setUsers(response.data.users);
        } else {
          console.error('Invalid response format:', response.data);
          setUsers([]);
          toast.error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
        } else if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Failed to search users. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchQuery.length >= 2) {
      debounceTimer = setTimeout(searchUsers, 500);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search users"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery.length < 2
                ? 'Type at least 2 characters to search'
                : 'No users found'}
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => onSelectUser(user)}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                role="button"
                tabIndex={0}
              >
                <img
                  src={user.profilePic || '/default-avatar.png'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h3 className="font-semibold">{user.username}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal; 