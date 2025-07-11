'use client';

import React from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';

/**
 * PresenceIndicator Component
 * Shows who's currently viewing/editing the trip
 */

interface PresenceIndicatorProps {
  className?: string;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ className = '' }) => {
  const { state } = useCollaboration();
  const { presence, isConnected } = state;

  if (!isConnected || presence.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Only you' : 'Disconnected'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection status */}
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {presence.length + 1} {presence.length === 0 ? 'person' : 'people'} viewing
        </span>
      </div>

      {/* User avatars */}
      <div className="flex -space-x-2">
        {presence.slice(0, 5).map((user) => (
          <div
            key={user.userId}
            className="relative"
            title={`${user.displayName} - ${user.lastAction}`}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Online indicator */}
            {user.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
        ))}
        
        {/* Show more indicator */}
        {presence.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-medium">
              +{presence.length - 5}
            </span>
          </div>
        )}
      </div>

      {/* Typing indicators */}
      {state.typingUsers.size > 0 && (
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs text-blue-600">
            {Array.from(state.typingUsers.values()).map(u => u.userInfo.displayName).join(', ')} typing...
          </span>
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator;
