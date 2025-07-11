'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketManager } from '@/lib/socket';
import { useAuth } from './AuthContext';

/**
 * Real-time Collaboration Context for Wayra
 * Manages Socket.io connection, presence, and real-time updates
 */

interface UserPresence {
  userId: string;
  socketId: string;
  displayName: string;
  photoURL?: string;
  lastAction: string;
  lastSeen: string;
  isOnline: boolean;
  cursor?: any;
}

interface CollaborationState {
  // Connection status
  isConnected: boolean;
  connectionError: string | null;
  
  // Current trip collaboration
  currentTripId: string | null;
  presence: UserPresence[];
  
  // Real-time updates
  recentUpdates: any[];
  typingUsers: Map<string, { field: string; userInfo: any }>;
  
  // Comments and activity
  comments: any[];
  activities: any[];
}

interface CollaborationContextType {
  // State
  state: CollaborationState;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  
  // Trip collaboration
  joinTrip: (tripId: string) => Promise<boolean>;
  leaveTrip: () => Promise<boolean>;
  
  // Trip updates
  updateTrip: (updateType: string, updateData: any) => boolean;
  updateItinerary: (day: number, activityIndex: number, activityData: any, action: string) => boolean;
  updateBudget: (budgetData: any, category: string) => boolean;
  
  // Interaction
  startTyping: (field: string) => boolean;
  stopTyping: (field: string) => boolean;
  updateCursor: (cursorData: any) => boolean;
  addComment: (comment: string, targetType: string, targetId: string) => boolean;
  
  // Event handlers
  onTripUpdate: (callback: (data: any) => void) => () => void;
  onPresenceUpdate: (callback: (presence: UserPresence[]) => void) => () => void;
  onUserTyping: (callback: (data: any) => void) => () => void;
  onCommentAdded: (callback: (data: any) => void) => () => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    connectionError: null,
    currentTripId: null,
    presence: [],
    recentUpdates: [],
    typingUsers: new Map(),
    comments: [],
    activities: []
  });

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user) {
      setupSocketListeners();
      socketManager.connect();
    } else {
      socketManager.disconnect();
    }

    return () => {
      socketManager.disconnect();
    };
  }, [user]);

  const setupSocketListeners = () => {
    // Connection status
    socketManager.on('connection-status', (data: { connected: boolean; reason?: string }) => {
      setState(prev => ({
        ...prev,
        isConnected: data.connected,
        connectionError: data.connected ? null : data.reason || 'Connection lost'
      }));
    });

    socketManager.on('connection-error', (data: { error: string }) => {
      setState(prev => ({
        ...prev,
        connectionError: data.error
      }));
    });

    // Presence updates
    socketManager.on('user-joined', (data: { userId: string; userInfo: any; presence: UserPresence[] }) => {
      setState(prev => ({
        ...prev,
        presence: data.presence || []
      }));
    });

    socketManager.on('user-left', (data: { userId: string; presence: UserPresence[] }) => {
      setState(prev => ({
        ...prev,
        presence: data.presence || []
      }));
    });

    socketManager.on('presence-update', (data: { presence: UserPresence[] }) => {
      setState(prev => ({
        ...prev,
        presence: data.presence || []
      }));
    });

    // Trip updates
    socketManager.on('trip-updated', (data: any) => {
      setState(prev => ({
        ...prev,
        recentUpdates: [data, ...prev.recentUpdates.slice(0, 49)] // Keep last 50 updates
      }));
    });

    socketManager.on('itinerary-updated', (data: any) => {
      setState(prev => ({
        ...prev,
        recentUpdates: [data, ...prev.recentUpdates.slice(0, 49)]
      }));
    });

    socketManager.on('budget-updated', (data: any) => {
      setState(prev => ({
        ...prev,
        recentUpdates: [data, ...prev.recentUpdates.slice(0, 49)]
      }));
    });

    // Typing indicators
    socketManager.on('user-typing', (data: { userId: string; field: string; userInfo: any; isTyping: boolean }) => {
      setState(prev => {
        const newTypingUsers = new Map(prev.typingUsers);
        
        if (data.isTyping) {
          newTypingUsers.set(data.userId, {
            field: data.field,
            userInfo: data.userInfo
          });
        } else {
          newTypingUsers.delete(data.userId);
        }
        
        return {
          ...prev,
          typingUsers: newTypingUsers
        };
      });
    });

    // Comments
    socketManager.on('comment-added', (data: any) => {
      setState(prev => ({
        ...prev,
        comments: [data, ...prev.comments.slice(0, 99)] // Keep last 100 comments
      }));
    });

    // System messages
    socketManager.on('system-message', (data: { message: string; timestamp: string }) => {
      console.log('📢 System message:', data.message);
      // You can add toast notifications here
    });

    // Socket errors
    socketManager.on('socket-error', (error: any) => {
      console.error('Socket error:', error);
      setState(prev => ({
        ...prev,
        connectionError: error.message || 'Socket error occurred'
      }));
    });
  };

  // Connection management
  const connect = () => {
    socketManager.connect();
  };

  const disconnect = () => {
    socketManager.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      currentTripId: null,
      presence: [],
      recentUpdates: [],
      typingUsers: new Map(),
      comments: [],
      activities: []
    }));
  };

  // Trip collaboration
  const joinTrip = async (tripId: string): Promise<boolean> => {
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    const success = socketManager.joinTrip(tripId, user.uid, {
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || null,
      email: user.email
    });

    if (success) {
      setState(prev => ({
        ...prev,
        currentTripId: tripId,
        recentUpdates: [],
        comments: [],
        activities: []
      }));
    }

    return success;
  };

  const leaveTrip = async (): Promise<boolean> => {
    if (!user || !state.currentTripId) return false;

    const success = socketManager.leaveTrip(state.currentTripId, user.uid);

    if (success) {
      setState(prev => ({
        ...prev,
        currentTripId: null,
        presence: [],
        recentUpdates: [],
        typingUsers: new Map(),
        comments: [],
        activities: []
      }));
    }

    return success;
  };

  // Trip updates
  const updateTrip = (updateType: string, updateData: any): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.updateTrip(state.currentTripId, user.uid, updateType, updateData);
  };

  const updateItinerary = (day: number, activityIndex: number, activityData: any, action: string): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.updateItinerary(state.currentTripId, user.uid, day, activityIndex, activityData, action);
  };

  const updateBudget = (budgetData: any, category: string): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.updateBudget(state.currentTripId, user.uid, budgetData, category);
  };

  // Interaction
  const startTyping = (field: string): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.startTyping(state.currentTripId, user.uid, field);
  };

  const stopTyping = (field: string): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.stopTyping(state.currentTripId, user.uid, field);
  };

  const updateCursor = (cursorData: any): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.updateCursor(state.currentTripId, user.uid, cursorData);
  };

  const addComment = (comment: string, targetType: string, targetId: string): boolean => {
    if (!user || !state.currentTripId) return false;
    return socketManager.addComment(state.currentTripId, user.uid, comment, targetType, targetId);
  };

  // Event handlers
  const onTripUpdate = (callback: (data: any) => void) => {
    socketManager.on('trip-updated', callback);
    return () => socketManager.off('trip-updated', callback);
  };

  const onPresenceUpdate = (callback: (presence: UserPresence[]) => void) => {
    const handler = (data: { presence: UserPresence[] }) => {
      callback(data.presence);
    };
    socketManager.on('presence-update', handler);
    return () => socketManager.off('presence-update', handler);
  };

  const onUserTyping = (callback: (data: any) => void) => {
    socketManager.on('user-typing', callback);
    return () => socketManager.off('user-typing', callback);
  };

  const onCommentAdded = (callback: (data: any) => void) => {
    socketManager.on('comment-added', callback);
    return () => socketManager.off('comment-added', callback);
  };

  const contextValue: CollaborationContextType = {
    state,
    connect,
    disconnect,
    joinTrip,
    leaveTrip,
    updateTrip,
    updateItinerary,
    updateBudget,
    startTyping,
    stopTyping,
    updateCursor,
    addComment,
    onTripUpdate,
    onPresenceUpdate,
    onUserTyping,
    onCommentAdded
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};

export default CollaborationProvider;
