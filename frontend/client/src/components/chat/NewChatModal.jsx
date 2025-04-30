import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import api from '../../utils/api';
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
        const response = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
        
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          setUsers([]);
          toast.error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
        if (error.response) {
          if (error.response.status === 401) {
            toast.error('Please login again to continue');
          } else {
            toast.error(error.response.data.message || 'Failed to search users');
          }
        } else {
          toast.error('Network error while searching users');
        }
      } finally {
        setLoading(false);
      }
    };

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(searchUsers, 500);

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
              >
                <img
                  src={user.profilePicture || '/default-avatar.png'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full mr-4"
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