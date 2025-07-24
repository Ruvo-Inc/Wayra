const redisUtils = require('../utils/redis');
const DatabaseUtils = require('../utils/database');

/**
 * Real-time Collaboration Socket.io Handler
 * Manages live trip collaboration, presence, and real-time updates
 */

class CollaborationHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.id}`);

      // Handle user joining a trip room
      socket.on('join-trip', async (data) => {
        try {
          const { tripId, userId, userInfo } = data;
          
          // Verify user has access to the trip
          const tripResult = await DatabaseUtils.getTripById(tripId, userId);
          if (!tripResult.success || !tripResult.trip) {
            socket.emit('error', { message: 'Access denied to trip' });
            return;
          }

          // Join the trip room
          socket.join(`trip:${tripId}`);
          socket.tripId = tripId;
          socket.userId = userId;
          socket.userInfo = userInfo;

          // Set user presence in Redis
          await redisUtils.setUserPresence(tripId, userId, {
            socketId: socket.id,
            displayName: userInfo.displayName || 'Anonymous',
            photoURL: userInfo.photoURL || null,
            lastAction: 'joined trip',
            joinedAt: new Date().toISOString()
          });

          // Get current trip presence
          const presence = await redisUtils.getTripPresence(tripId);
          
          // Notify others in the trip room
          socket.to(`trip:${tripId}`).emit('user-joined', {
            userId,
            userInfo,
            presence
          });

          // Send current presence to the joining user
          socket.emit('presence-update', { presence });

          // Log activity
          await redisUtils.logActivity(tripId, userId, 'joined trip collaboration');

          console.log(`👥 User ${userId} joined trip ${tripId}`);
        } catch (error) {
          console.error('Join trip error:', error);
          socket.emit('error', { message: 'Failed to join trip' });
        }
      });

      // Handle user leaving a trip room
      socket.on('leave-trip', async (data) => {
        try {
          const { tripId, userId } = data;
          
          socket.leave(`trip:${tripId}`);
          
          // Remove user presence
          await redisUtils.removeUserPresence(tripId, userId);
          
          // Get updated presence
          const presence = await redisUtils.getTripPresence(tripId);
          
          // Notify others
          socket.to(`trip:${tripId}`).emit('user-left', {
            userId,
            presence
          });

          // Log activity
          await redisUtils.logActivity(tripId, userId, 'left trip collaboration');

          console.log(`👋 User ${userId} left trip ${tripId}`);
        } catch (error) {
          console.error('Leave trip error:', error);
        }
      });

      // Handle trip updates
      socket.on('trip-update', async (data) => {
        try {
          const { tripId, userId, updateType, updateData } = data;
          
          // Verify user has edit access
          const tripResult = await DatabaseUtils.getTripById(tripId, userId);
          if (!tripResult.success || !tripResult.trip) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Check if user has edit permissions
          const trip = tripResult.trip;
          const isOwner = trip.owner._id.toString() === userId;
          const isEditor = trip.collaborators.some(c => 
            c.user._id.toString() === userId && c.role === 'editor'
          );

          if (!isOwner && !isEditor) {
            socket.emit('error', { message: 'Insufficient permissions to edit' });
            return;
          }

          // Update the trip in database
          const updateResult = await DatabaseUtils.updateTrip(tripId, userId, updateData);
          if (!updateResult.success) {
            socket.emit('error', { message: 'Failed to update trip' });
            return;
          }

          // Invalidate cache
          await redisUtils.invalidateTripCache(tripId);

          // Log activity
          await redisUtils.logActivity(tripId, userId, `updated ${updateType}`);

          // Broadcast update to all users in the trip room
          this.io.to(`trip:${tripId}`).emit('trip-updated', {
            tripId,
            userId,
            updateType,
            updateData,
            timestamp: new Date().toISOString(),
            updatedBy: socket.userInfo
          });

          // Publish to Redis for cross-server communication
          await redisUtils.publishTripUpdate(tripId, {
            type: 'trip_updated',
            userId,
            updateType,
            updateData,
            timestamp: new Date().toISOString()
          });

          console.log(`📝 Trip ${tripId} updated by user ${userId}: ${updateType}`);
        } catch (error) {
          console.error('Trip update error:', error);
          socket.emit('error', { message: 'Failed to update trip' });
        }
      });

      // Handle itinerary item updates
      socket.on('itinerary-update', async (data) => {
        try {
          const { tripId, userId, day, activityIndex, activityData, action } = data;
          
          // Verify permissions (same as trip-update)
          const tripResult = await DatabaseUtils.getTripById(tripId, userId);
          if (!tripResult.success || !tripResult.trip) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          const trip = tripResult.trip;
          const isOwner = trip.owner._id.toString() === userId;
          const isEditor = trip.collaborators.some(c => 
            c.user._id.toString() === userId && c.role === 'editor'
          );

          if (!isOwner && !isEditor) {
            socket.emit('error', { message: 'Insufficient permissions to edit' });
            return;
          }

          // Log activity
          await redisUtils.logActivity(tripId, userId, `${action} itinerary item on day ${day}`);

          // Broadcast to all users in the trip room
          this.io.to(`trip:${tripId}`).emit('itinerary-updated', {
            tripId,
            userId,
            day,
            activityIndex,
            activityData,
            action,
            timestamp: new Date().toISOString(),
            updatedBy: socket.userInfo
          });

          console.log(`📅 Itinerary updated in trip ${tripId} by user ${userId}: ${action}`);
        } catch (error) {
          console.error('Itinerary update error:', error);
          socket.emit('error', { message: 'Failed to update itinerary' });
        }
      });

      // Handle user cursor/selection updates
      socket.on('cursor-update', async (data) => {
        try {
          const { tripId, userId, cursorData } = data;
          
          // Update user presence with cursor info
          await redisUtils.setUserPresence(tripId, userId, {
            socketId: socket.id,
            displayName: socket.userInfo?.displayName || 'Anonymous',
            photoURL: socket.userInfo?.photoURL || null,
            lastAction: 'editing',
            cursor: cursorData,
            lastSeen: new Date().toISOString()
          });

          // Broadcast cursor update to others (excluding sender)
          socket.to(`trip:${tripId}`).emit('cursor-updated', {
            userId,
            cursorData,
            userInfo: socket.userInfo
          });
        } catch (error) {
          console.error('Cursor update error:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing-start', async (data) => {
        try {
          const { tripId, userId, field } = data;
          
          socket.to(`trip:${tripId}`).emit('user-typing', {
            userId,
            field,
            userInfo: socket.userInfo,
            isTyping: true
          });
        } catch (error) {
          console.error('Typing start error:', error);
        }
      });

      socket.on('typing-stop', async (data) => {
        try {
          const { tripId, userId, field } = data;
          
          socket.to(`trip:${tripId}`).emit('user-typing', {
            userId,
            field,
            userInfo: socket.userInfo,
            isTyping: false
          });
        } catch (error) {
          console.error('Typing stop error:', error);
        }
      });

      // Handle comments/notes
      socket.on('comment-add', async (data) => {
        try {
          const { tripId, userId, comment, targetType, targetId } = data;
          
          // Log activity
          await redisUtils.logActivity(tripId, userId, `added comment on ${targetType}`);

          // Broadcast to all users in the trip room
          this.io.to(`trip:${tripId}`).emit('comment-added', {
            tripId,
            userId,
            comment,
            targetType,
            targetId,
            timestamp: new Date().toISOString(),
            userInfo: socket.userInfo
          });

          console.log(`💬 Comment added in trip ${tripId} by user ${userId}`);
        } catch (error) {
          console.error('Comment add error:', error);
          socket.emit('error', { message: 'Failed to add comment' });
        }
      });

      // Handle budget updates
      socket.on('budget-update', async (data) => {
        try {
          const { tripId, userId, budgetData, category } = data;
          
          // Verify permissions
          const tripResult = await DatabaseUtils.getTripById(tripId, userId);
          if (!tripResult.success || !tripResult.trip) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Log activity
          await redisUtils.logActivity(tripId, userId, `updated budget for ${category}`);

          // Broadcast to all users
          this.io.to(`trip:${tripId}`).emit('budget-updated', {
            tripId,
            userId,
            budgetData,
            category,
            timestamp: new Date().toISOString(),
            updatedBy: socket.userInfo
          });

          console.log(`💰 Budget updated in trip ${tripId} by user ${userId}: ${category}`);
        } catch (error) {
          console.error('Budget update error:', error);
          socket.emit('error', { message: 'Failed to update budget' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          if (socket.tripId && socket.userId) {
            // Remove user presence
            await redisUtils.removeUserPresence(socket.tripId, socket.userId);
            
            // Get updated presence
            const presence = await redisUtils.getTripPresence(socket.tripId);
            
            // Notify others
            socket.to(`trip:${socket.tripId}`).emit('user-left', {
              userId: socket.userId,
              presence
            });

            // Log activity
            await redisUtils.logActivity(socket.tripId, socket.userId, 'disconnected');
          }

          console.log(`👤 User disconnected: ${socket.id}`);
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  // Method to get trip activity
  async getTripActivity(tripId, limit = 20) {
    try {
      return await redisUtils.getTripActivity(tripId, limit);
    } catch (error) {
      console.error('Get trip activity error:', error);
      return [];
    }
  }

  // Method to get current presence
  async getTripPresence(tripId) {
    try {
      return await redisUtils.getTripPresence(tripId);
    } catch (error) {
      console.error('Get trip presence error:', error);
      return [];
    }
  }

  // Method to broadcast system message
  broadcastSystemMessage(tripId, message) {
    this.io.to(`trip:${tripId}`).emit('system-message', {
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = CollaborationHandler;
