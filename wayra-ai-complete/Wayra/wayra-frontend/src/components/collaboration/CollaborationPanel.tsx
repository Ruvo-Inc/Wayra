'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import PresenceIndicator from './PresenceIndicator';
import ActivityFeed from './ActivityFeed';

/**
 * CollaborationPanel Component
 * Main panel for real-time collaboration features
 */

interface CollaborationPanelProps {
  tripId?: string;
  className?: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ 
  tripId,
  className = '' 
}) => {
  const { state, joinTrip, leaveTrip, addComment, startTyping, stopTyping } = useCollaboration();
  const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('activity');
  const [newComment, setNewComment] = useState('');
  const [isTypingComment, setIsTypingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Join trip when tripId changes
  useEffect(() => {
    if (tripId && tripId !== state.currentTripId) {
      joinTrip(tripId);
    }

    return () => {
      if (state.currentTripId) {
        leaveTrip();
      }
    };
  }, [tripId]);

  // Handle comment typing
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);

    if (!isTypingComment) {
      setIsTypingComment(true);
      startTyping('comment');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingComment(false);
      stopTyping('comment');
    }, 1000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newComment.trim() && state.currentTripId) {
      addComment(newComment.trim(), 'trip', state.currentTripId);
      setNewComment('');
      
      if (isTypingComment) {
        setIsTypingComment(false);
        stopTyping('comment');
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 border-b border-gray-200">
      <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm text-gray-600">
        {state.isConnected ? 'Connected' : 'Disconnected'}
        {state.connectionError && ` - ${state.connectionError}`}
      </span>
    </div>
  );

  // Tab navigation
  const TabNavigation = () => (
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => setActiveTab('activity')}
        className={`flex-1 py-2 px-4 text-sm font-medium ${
          activeTab === 'activity'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Activity ({state.recentUpdates.length})
      </button>
      <button
        onClick={() => setActiveTab('comments')}
        className={`flex-1 py-2 px-4 text-sm font-medium ${
          activeTab === 'comments'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Comments ({state.comments.length})
      </button>
    </div>
  );

  // Comments tab content
  const CommentsTab = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No comments yet</p>
            <p className="text-sm">Start a conversation about this trip</p>
          </div>
        ) : (
          state.comments.map((comment, index) => (
            <div key={`comment-${comment.timestamp}-${index}`} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-3">
                {comment.userInfo?.photoURL ? (
                  <img
                    src={comment.userInfo.photoURL}
                    alt={comment.userInfo.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {comment.userInfo?.displayName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.userInfo?.displayName || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{comment.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={!state.isConnected}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {isTypingComment && 'Typing...'}
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || !state.isConnected}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Collaboration</h2>
          <PresenceIndicator />
        </div>
      </div>

      {/* Connection status */}
      <ConnectionStatus />

      {/* Tab navigation */}
      <TabNavigation />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'activity' ? (
          <ActivityFeed className="h-full border-0 rounded-none" />
        ) : (
          <CommentsTab />
        )}
      </div>

      {/* Footer info */}
      {state.currentTripId && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Trip ID: {state.currentTripId.slice(-8)}
          </p>
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel;
