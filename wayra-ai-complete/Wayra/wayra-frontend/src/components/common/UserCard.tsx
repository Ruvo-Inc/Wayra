import React from 'react';
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { User } from '../../types/adventure';

interface UserCardProps {
  user: User;
  sharing?: boolean;
  sharedWith?: string[];
  onShare?: (user: User) => void;
  onUnshare?: (user: User) => void;
  onViewProfile?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  sharing = false,
  sharedWith = [],
  onShare,
  onUnshare,
  onViewProfile,
  className = ''
}) => {
  const isShared = sharedWith.includes(user.id);

  const handleShare = () => {
    if (onShare) {
      onShare(user);
    }
  };

  const handleUnshare = () => {
    if (onUnshare) {
      onUnshare(user);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(user);
    }
  };

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 max-w-xs w-full ${className}`}>
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full ring-4 ring-blue-500 ring-offset-2 ring-offset-white overflow-hidden">
            {user.profilePic ? (
              <img 
                src={user.profilePic} 
                alt={user.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xl font-semibold text-gray-600">
                {getInitials()}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-gray-600">@{user.username}</p>
          
          {user.isStaff && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
              Admin
            </span>
          )}
        </div>

        {/* Join Date */}
        {user.dateJoined && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Joined {formatJoinDate(user.dateJoined)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="w-full pt-2">
          {!sharing ? (
            <button
              onClick={handleViewProfile}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              View Profile
            </button>
          ) : !isShared ? (
            <button
              onClick={handleShare}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Share
            </button>
          ) : (
            <button
              onClick={handleUnshare}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
