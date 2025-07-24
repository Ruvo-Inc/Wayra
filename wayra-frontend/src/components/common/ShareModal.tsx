import React, { useState, useEffect } from 'react';
import { XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Collection, User } from '../../types/adventure';
import { UserCard } from './UserCard';

interface ShareModalProps {
  collection: Collection;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (collection: Collection) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  collection,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [sharedWithUsers, setSharedWithUsers] = useState<User[]>([]);
  const [notSharedWithUsers, setNotSharedWithUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, collection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/auth/users');
      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
        
        const sharedWith = collection.sharedWith || [];
        const shared = users.filter((user: User) => sharedWith.includes(user.id));
        const notShared = users.filter((user: User) => !sharedWith.includes(user.id));
        
        setSharedWithUsers(shared);
        setNotSharedWithUsers(notShared);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (user: User) => {
    try {
      const response = await fetch(`/api/collections/${collection.id}/share/${user.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setSharedWithUsers(prev => [...prev, user]);
        setNotSharedWithUsers(prev => prev.filter(u => u.id !== user.id));
        
        // Update collection
        const updatedCollection = {
          ...collection,
          sharedWith: [...(collection.sharedWith || []), user.id]
        };
        
        if (onUpdate) {
          onUpdate(updatedCollection);
        }

        // Show success message (you might want to add a toast system)
        console.log(`Shared ${collection.name} with ${user.firstName} ${user.lastName}`);
      }
    } catch (error) {
      console.error('Error sharing collection:', error);
    }
  };

  const handleUnshare = async (user: User) => {
    try {
      const response = await fetch(`/api/collections/${collection.id}/unshare/${user.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setNotSharedWithUsers(prev => [...prev, user]);
        setSharedWithUsers(prev => prev.filter(u => u.id !== user.id));
        
        // Update collection
        const updatedCollection = {
          ...collection,
          sharedWith: (collection.sharedWith || []).filter(id => id !== user.id)
        };
        
        if (onUpdate) {
          onUpdate(updatedCollection);
        }

        // Show success message
        console.log(`Unshared ${collection.name} with ${user.firstName} ${user.lastName}`);
      }
    } catch (error) {
      console.error('Error unsharing collection:', error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto mx-4"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShareIcon className="w-6 h-6" />
                Share {collection.name}
              </h2>
              <p className="text-gray-600">
                Share this collection with other users to collaborate on adventures together.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Shared With Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shared With</h3>
                {sharedWithUsers.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-80 overflow-y-auto pr-2">
                    {sharedWithUsers.map(user => (
                      <UserCard
                        key={user.id}
                        user={user}
                        sharing={true}
                        sharedWith={collection.sharedWith}
                        onUnshare={handleUnshare}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No users have access to this collection yet.</p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Not Shared With Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Users</h3>
                {notSharedWithUsers.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-80 overflow-y-auto pr-2">
                    {notSharedWithUsers.map(user => (
                      <UserCard
                        key={user.id}
                        user={user}
                        sharing={true}
                        sharedWith={collection.sharedWith}
                        onShare={handleShare}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">All users already have access to this collection.</p>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
