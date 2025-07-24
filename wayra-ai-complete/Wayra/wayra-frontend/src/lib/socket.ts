import { io, Socket } from 'socket.io-client';

/**
 * Socket.io client configuration for Wayra real-time collaboration
 */

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentTripId: string | null = null;
  private currentUserId: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wayra-backend-424430120938.us-central1.run.app'
      : 'http://localhost:8080';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to Wayra collaboration server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from collaboration server:', reason);
      this.isConnected = false;
      this.emit('connection-status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.emit('connection-error', { error: 'Max reconnection attempts reached' });
      }
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
      this.emit('socket-error', error);
    });

    // Real-time collaboration events
    this.socket.on('user-joined', (data) => {
      console.log('👤 User joined:', data);
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('👋 User left:', data);
      this.emit('user-left', data);
    });

    this.socket.on('presence-update', (data) => {
      this.emit('presence-update', data);
    });

    this.socket.on('trip-updated', (data) => {
      console.log('📝 Trip updated:', data);
      this.emit('trip-updated', data);
    });

    this.socket.on('itinerary-updated', (data) => {
      console.log('📅 Itinerary updated:', data);
      this.emit('itinerary-updated', data);
    });

    this.socket.on('cursor-updated', (data) => {
      this.emit('cursor-updated', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('comment-added', (data) => {
      console.log('💬 Comment added:', data);
      this.emit('comment-added', data);
    });

    this.socket.on('budget-updated', (data) => {
      console.log('💰 Budget updated:', data);
      this.emit('budget-updated', data);
    });

    this.socket.on('system-message', (data) => {
      console.log('📢 System message:', data);
      this.emit('system-message', data);
    });

    this.socket.on('pong', () => {
      this.emit('pong');
    });
  }

  // Connection management
  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.currentTripId = null;
      this.currentUserId = null;
    }
  }

  // Trip collaboration
  joinTrip(tripId: string, userId: string, userInfo: any) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.currentTripId = tripId;
    this.currentUserId = userId;

    this.socket.emit('join-trip', {
      tripId,
      userId,
      userInfo
    });

    return true;
  }

  leaveTrip(tripId: string, userId: string) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('leave-trip', {
      tripId,
      userId
    });

    this.currentTripId = null;
    this.currentUserId = null;
    return true;
  }

  // Trip updates
  updateTrip(tripId: string, userId: string, updateType: string, updateData: any) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('trip-update', {
      tripId,
      userId,
      updateType,
      updateData
    });

    return true;
  }

  // Itinerary updates
  updateItinerary(tripId: string, userId: string, day: number, activityIndex: number, activityData: any, action: string) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('itinerary-update', {
      tripId,
      userId,
      day,
      activityIndex,
      activityData,
      action
    });

    return true;
  }

  // Cursor tracking
  updateCursor(tripId: string, userId: string, cursorData: any) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('cursor-update', {
      tripId,
      userId,
      cursorData
    });

    return true;
  }

  // Typing indicators
  startTyping(tripId: string, userId: string, field: string) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('typing-start', {
      tripId,
      userId,
      field
    });

    return true;
  }

  stopTyping(tripId: string, userId: string, field: string) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('typing-stop', {
      tripId,
      userId,
      field
    });

    return true;
  }

  // Comments
  addComment(tripId: string, userId: string, comment: string, targetType: string, targetId: string) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('comment-add', {
      tripId,
      userId,
      comment,
      targetType,
      targetId
    });

    return true;
  }

  // Budget updates
  updateBudget(tripId: string, userId: string, budgetData: any, category: string) {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('budget-update', {
      tripId,
      userId,
      budgetData,
      category
    });

    return true;
  }

  // Health check
  ping() {
    if (!this.socket || !this.isConnected) return false;

    this.socket.emit('ping');
    return true;
  }

  // Event management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get tripId() {
    return this.currentTripId;
  }

  get userId() {
    return this.currentUserId;
  }

  // Cleanup
  destroy() {
    this.eventListeners.clear();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentTripId = null;
    this.currentUserId = null;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager;
