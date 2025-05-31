import { useState, useRef, useEffect } from 'react';
import { Trash2, History, Users, UserPlus, UserMinus, Edit, LogOut } from 'lucide-react';
import { chatAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import EditGroupModal from './EditGroupModal';

const ChatOptionsMenu = ({ conversationId, onDeleteHistory, onDeleteChat, isGroup, group, onGroupUpdated, isOpen, onOpen, onClose }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleLeaveGroup = async () => {
    try {
      await chatAPI.leaveGroup(conversationId);
      onDeleteChat();
      toast.success('Left group successfully');
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleEditGroup = () => {
    setIsEditModalOpen(true);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
          ref={menuRef}
        >
          {isGroup && (
            <>
              <button
                onClick={handleEditGroup}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Group
              </button>
              <button
                onClick={() => {
                  onClose();
                  toast.info('Add members feature coming soon');
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Members
              </button>
              <button
                onClick={() => {
                  onClose();
                  handleLeaveGroup();
                }}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </button>
            </>
          )}
          <button
            onClick={() => {
              onClose();
              onDeleteHistory();
            }}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </button>
          <button
            onClick={() => {
              onClose();
              onDeleteChat();
            }}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Chat
          </button>
        </div>
      )}

      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={group}
        onGroupUpdated={onGroupUpdated}
      />
    </>
  );
};

export default ChatOptionsMenu; 