import { useState } from 'react';
import { X } from 'lucide-react';
import { chatAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const EditGroupModal = ({ isOpen, onClose, group, onGroupUpdated }) => {
  const [groupName, setGroupName] = useState(group?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', groupName);

      const response = await chatAPI.updateGroup(group._id, formData);
      if (response.data.success) {
        onGroupUpdated(response.data.conversation);
        onClose();
        toast.success('Group updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Edit Group</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateGroup}
              disabled={loading || !groupName.trim()}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                loading || !groupName.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal; 