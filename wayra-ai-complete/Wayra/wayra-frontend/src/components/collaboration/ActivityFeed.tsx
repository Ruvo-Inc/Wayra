'use client';

import React, { useEffect, useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';

/**
 * ActivityFeed Component
 * Shows real-time updates and activity in the trip
 */

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  className = '', 
  maxItems = 10 
}) => {
  const { state } = useCollaboration();
  const { recentUpdates, comments } = state;
  const [allActivity, setAllActivity] = useState<Array<Record<string, unknown>>>([]);

  // Combine updates and comments into a single activity feed
  useEffect(() => {
    const combined = [
      ...recentUpdates.map(update => ({ ...update, type: 'update' })),
      ...comments.map(comment => ({ ...comment, type: 'comment' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setAllActivity(combined.slice(0, maxItems));
  }, [recentUpdates, comments, maxItems]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (activity: Record<string, unknown>) => {
    switch (activity.type) {
      case 'update':
        switch (activity.updateType) {
          case 'trip-details':
            return '📝';
          case 'itinerary':
            return '📅';
          case 'budget':
            return '💰';
          case 'collaborator':
            return '👥';
          default:
            return '✏️';
        }
      case 'comment':
        return '💬';
      default:
        return '📌';
    }
  };

  const getActivityMessage = (activity: Record<string, unknown>) => {
    const userName = activity.userInfo?.displayName || 'Someone';
    
    switch (activity.type) {
      case 'update':
        switch (activity.updateType) {
          case 'trip-details':
            return `${userName} updated trip details`;
          case 'itinerary':
            return `${userName} modified the itinerary`;
          case 'budget':
            return `${userName} updated the budget`;
          case 'collaborator':
            return `${userName} ${activity.action === 'add' ? 'added' : 'removed'} a collaborator`;
          default:
            return `${userName} made changes`;
        }
      case 'comment':
        return `${userName} added a comment`;
      default:
        return `${userName} made an update`;
    }
  };

  if (!state.isConnected) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm">Connect to see live activity</span>
        </div>
      </div>
    );
  }

  if (allActivity.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">No recent activity</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {allActivity.map((activity, index) => (
          <div
            key={`${activity.type}-${activity.timestamp}-${index}`}
            className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              {/* Activity icon */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">{getActivityIcon(activity)}</span>
              </div>

              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {getActivityMessage(activity)}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>

                {/* Activity details */}
                {activity.type === 'comment' && activity.comment && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    &ldquo;{activity.comment}&rdquo;
                  </p>
                )}

                {activity.type === 'update' && activity.updateData && (
                  <div className="mt-1 text-xs text-gray-500">
                    {activity.updateType === 'budget' && activity.updateData.category && (
                      <span>Category: {activity.updateData.category}</span>
                    )}
                    {activity.updateType === 'itinerary' && activity.updateData.day && (
                      <span>Day {activity.updateData.day}</span>
                    )}
                  </div>
                )}

                {/* User avatar */}
                {activity.userInfo && (
                  <div className="mt-2 flex items-center space-x-2">
                    {activity.userInfo.photoURL ? (
                      <img
                        src={activity.userInfo.photoURL}
                        alt={activity.userInfo.displayName}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {activity.userInfo.displayName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {activity.userInfo.displayName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {allActivity.length >= maxItems && (
        <div className="p-4 border-t border-gray-200">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
