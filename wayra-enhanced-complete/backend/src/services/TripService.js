const Trip = require('../models/Trip');
const User = require('../models/User');
const redisUtils = require('../utils/redis');
const mongoose = require('mongoose');

/**
 * TripService - Comprehensive trip management service for Wayra
 * Provides CRUD operations with permission checking, collaboration workflows,
 * invitation management, search capabilities, and Redis caching integration
 */
class TripService {
  constructor() {
    this.cacheEnabled = true;
    this.defaultCacheTTL = {
      trip: 1800,         // 30 minutes
      tripList: 900,      // 15 minutes
      collaborators: 600, // 10 minutes
      search: 300,        // 5 minutes
      stats: 1800         // 30 minutes
    };
  }

  // ==================== TRIP CREATION AND MANAGEMENT ====================

  /**
   * Create a new trip with owner permissions
   * @param {string} userId - Owner user ID
   * @param {Object} tripData - Trip data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created trip and success status
   */
  async createTrip(userId, tripData, options = {}) {
    try {
      console.log(`🔄 Creating trip: ${tripData.title} for user: ${userId}`);

      // Validate user exists
      const userResult = await this.validateUser(userId);
      if (!userResult.success) {
        return userResult;
      }

      // Prepare trip data with owner
      const newTripData = {
        ...tripData,
        owner: userId,
        collaborators: [{
          userId: userId,
          role: 'owner',
          invitedBy: userId,
          status: 'accepted',
          acceptedAt: new Date(),
          lastActiveAt: new Date()
        }],
        status: tripData.status || 'draft',
        visibility: tripData.visibility || 'private',
        version: 1,
        lastModifiedBy: userId
      };

      // Create trip in database
      const trip = new Trip(newTripData);
      await trip.save();

      // Log initial activity
      trip.logActivity(userId, 'trip_created', {
        title: trip.title,
        destination: trip.destination.name
      });
      await trip.save();

      // Cache trip data
      if (this.cacheEnabled) {
        await this.cacheTripData(trip._id.toString(), trip);
        await this.invalidateUserTripCache(userId);
      }

      console.log(`✅ Trip created successfully: ${trip.title} (${trip._id})`);
      
      return {
        success: true,
        trip: trip.toObject(),
        isNewTrip: true
      };

    } catch (error) {
      console.error('❌ Trip creation failed:', error.message);
      
      if (error.name === 'ValidationError') {
        return {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: Object.keys(error.errors).map(field => ({
            field,
            message: error.errors[field].message
          }))
        };
      }

      return {
        success: false,
        error: error.message,
        code: 'CREATION_ERROR'
      };
    }
  }

  /**
   * Get trip by ID with permission checking
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID requesting the trip
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Trip data and success status
   */
  async getTripById(tripId, userId, options = {}) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return {
          success: false,
          error: 'Invalid trip ID format',
          code: 'INVALID_ID'
        };
      }

      // Check cache first
      if (this.cacheEnabled && !options.skipCache) {
        const cachedTrip = await redisUtils.getCachedTrip(tripId);
        if (cachedTrip) {
          // Still need to check permissions
          const permissionResult = await this.checkTripPermission(tripId, userId, 'view_trip');
          if (!permissionResult.success || !permissionResult.hasPermission) {
            return {
              success: false,
              error: 'Insufficient permissions to view this trip',
              code: 'PERMISSION_DENIED'
            };
          }

          console.log(`📋 Trip retrieved from cache: ${tripId}`);
          return {
            success: true,
            trip: cachedTrip,
            fromCache: true
          };
        }
      }

      // Query database with population
      let query = Trip.findById(tripId);
      
      if (options.includeCollaborators) {
        query = query.populate('collaborators.userId', 'profile.displayName profile.photoURL email');
      }
      
      if (options.includeOwner) {
        query = query.populate('owner', 'profile.displayName profile.photoURL email');
      }

      const trip = await query.lean();
      
      if (!trip || trip.isArchived) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Check permissions
      const permissionResult = await this.checkTripPermission(tripId, userId, 'view_trip');
      if (!permissionResult.success || !permissionResult.hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions to view this trip',
          code: 'PERMISSION_DENIED'
        };
      }

      // Update user activity
      await this.updateUserActivity(tripId, userId);

      // Cache the result
      if (this.cacheEnabled) {
        await this.cacheTripData(tripId, trip);
      }

      return {
        success: true,
        trip,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get trip by ID failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Update trip with permission checking and activity logging
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID making the update
   * @param {Object} updates - Trip updates
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated trip and success status
   */
  async updateTrip(tripId, userId, updates, options = {}) {
    try {
      console.log(`🔄 Updating trip: ${tripId} by user: ${userId}`);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return {
          success: false,
          error: 'Invalid trip ID format',
          code: 'INVALID_ID'
        };
      }

      // Check permissions
      const permissionResult = await this.checkTripPermission(tripId, userId, 'edit_trip');
      if (!permissionResult.success || !permissionResult.hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions to edit this trip',
          code: 'PERMISSION_DENIED'
        };
      }

      // Get current trip for comparison
      const currentTrip = await Trip.findById(tripId);
      if (!currentTrip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Prepare update data
      const updateData = {
        ...updates,
        lastModifiedBy: userId,
        updatedAt: new Date()
      };

      // Remove fields that shouldn't be directly updated
      delete updateData._id;
      delete updateData.owner;
      delete updateData.collaborators;
      delete updateData.createdAt;

      // Update trip in database
      const updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          lean: true
        }
      );

      if (!updatedTrip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Log customization activity
      if (options.logChanges !== false) {
        await currentTrip.addCustomization(
          userId,
          options.changeType || 'trip_update',
          updates,
          this.extractPreviousValues(currentTrip, updates),
          options.reason || 'Trip updated'
        );
      }

      // Invalidate and update cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId);
        await this.cacheTripData(tripId, updatedTrip);
        
        // Invalidate collaborators' trip lists
        const collaboratorIds = updatedTrip.collaborators
          .filter(c => c.status === 'accepted')
          .map(c => c.userId.toString());
        await this.invalidateUserTripCaches(collaboratorIds);
      }

      // Publish real-time update
      await redisUtils.publishTripUpdate(tripId, {
        type: 'trip_updated',
        userId,
        changes: updates,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Trip updated: ${tripId}`);
      
      return {
        success: true,
        trip: updatedTrip
      };

    } catch (error) {
      console.error('❌ Update trip failed:', error.message);
      
      if (error.name === 'ValidationError') {
        return {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: Object.keys(error.errors).map(field => ({
            field,
            message: error.errors[field].message
          }))
        };
      }

      return {
        success: false,
        error: error.message,
        code: 'UPDATE_ERROR'
      };
    }
  }

  /**
   * Delete trip with permission checking
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID requesting deletion
   * @returns {Promise<Object>} Success status
   */
  async deleteTrip(tripId, userId) {
    try {
      console.log(`🔄 Deleting trip: ${tripId} by user: ${userId}`);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return {
          success: false,
          error: 'Invalid trip ID format',
          code: 'INVALID_ID'
        };
      }

      // Check permissions (only owner can delete)
      const permissionResult = await this.checkTripPermission(tripId, userId, 'delete_trip');
      if (!permissionResult.success || !permissionResult.hasPermission) {
        return {
          success: false,
          error: 'Only trip owner can delete the trip',
          code: 'PERMISSION_DENIED'
        };
      }

      // Get trip for cleanup
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Get collaborator IDs for cache cleanup
      const collaboratorIds = trip.collaborators
        .filter(c => c.status === 'accepted')
        .map(c => c.userId.toString());

      // Delete trip from database
      await Trip.findByIdAndDelete(tripId);

      // Clear all related cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId, collaboratorIds);
        await this.invalidateUserTripCaches(collaboratorIds);
      }

      // Publish deletion notification
      await redisUtils.publishTripUpdate(tripId, {
        type: 'trip_deleted',
        userId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Trip deleted: ${tripId}`);
      
      return {
        success: true,
        message: 'Trip deleted successfully'
      };

    } catch (error) {
      console.error('❌ Delete trip failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'DELETION_ERROR'
      };
    }
  }

  // ==================== COLLABORATION MANAGEMENT ====================

  /**
   * Invite user to collaborate on trip
   * @param {string} tripId - Trip ID
   * @param {string} inviterUserId - User ID of inviter
   * @param {string} inviteeEmail - Email of user to invite
   * @param {string} role - Collaborator role ('editor', 'contributor', 'viewer')
   * @param {Object} options - Invitation options
   * @returns {Promise<Object>} Invitation result and success status
   */
  async inviteCollaborator(tripId, inviterUserId, inviteeEmail, role = 'viewer', options = {}) {
    try {
      console.log(`🔄 Inviting collaborator: ${inviteeEmail} to trip: ${tripId}`);

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return {
          success: false,
          error: 'Invalid trip ID format',
          code: 'INVALID_ID'
        };
      }

      if (!['editor', 'contributor', 'viewer'].includes(role)) {
        return {
          success: false,
          error: 'Invalid collaborator role',
          code: 'INVALID_ROLE'
        };
      }

      // Check permissions
      const permissionResult = await this.checkTripPermission(tripId, inviterUserId, 'invite_users');
      if (!permissionResult.success || !permissionResult.hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions to invite users',
          code: 'PERMISSION_DENIED'
        };
      }

      // Find invitee user
      const inviteeUser = await User.findOne({ email: inviteeEmail.toLowerCase() }).lean();
      if (!inviteeUser) {
        return {
          success: false,
          error: 'User not found with this email',
          code: 'USER_NOT_FOUND'
        };
      }

      // Get trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Check if user is already a collaborator
      const existingCollaborator = trip.collaborators.find(c => 
        c.userId.toString() === inviteeUser._id.toString()
      );

      if (existingCollaborator) {
        if (existingCollaborator.status === 'accepted') {
          return {
            success: false,
            error: 'User is already a collaborator on this trip',
            code: 'ALREADY_COLLABORATOR'
          };
        } else if (existingCollaborator.status === 'pending') {
          return {
            success: false,
            error: 'User already has a pending invitation',
            code: 'INVITATION_PENDING'
          };
        }
      }

      // Add collaborator using model method
      await trip.addCollaborator(inviteeUser._id, role, inviterUserId);

      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId);
        await redisUtils.del(`trip:collaborators:${tripId}`);
      }

      // Publish invitation notification
      await redisUtils.publishTripUpdate(tripId, {
        type: 'collaborator_invited',
        inviterUserId,
        inviteeUserId: inviteeUser._id,
        inviteeEmail,
        role,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Collaborator invited: ${inviteeEmail} to trip: ${tripId}`);
      
      return {
        success: true,
        invitation: {
          tripId,
          inviteeUserId: inviteeUser._id,
          inviteeEmail,
          role,
          status: 'pending',
          invitedBy: inviterUserId,
          invitedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Invite collaborator failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'INVITATION_ERROR'
      };
    }
  }

  /**
   * Accept collaboration invitation
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID accepting invitation
   * @returns {Promise<Object>} Acceptance result and success status
   */
  async acceptInvitation(tripId, userId) {
    try {
      console.log(`🔄 Accepting invitation: trip ${tripId} by user: ${userId}`);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return {
          success: false,
          error: 'Invalid trip ID format',
          code: 'INVALID_ID'
        };
      }

      // Get trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Find pending invitation
      const collaborator = trip.collaborators.find(c => 
        c.userId.toString() === userId.toString() && c.status === 'pending'
      );

      if (!collaborator) {
        return {
          success: false,
          error: 'No pending invitation found for this user',
          code: 'INVITATION_NOT_FOUND'
        };
      }

      // Accept invitation using model method
      await trip.acceptInvitation(userId);

      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId);
        await this.invalidateUserTripCache(userId);
        await redisUtils.del(`trip:collaborators:${tripId}`);
      }

      // Publish acceptance notification
      await redisUtils.publishTripUpdate(tripId, {
        type: 'collaborator_accepted',
        userId,
        role: collaborator.role,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Invitation accepted: trip ${tripId} by user: ${userId}`);
      
      return {
        success: true,
        collaboration: {
          tripId,
          userId,
          role: collaborator.role,
          status: 'accepted',
          acceptedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Accept invitation failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'ACCEPTANCE_ERROR'
      };
    }
  }

  /**
   * Decline collaboration invitation
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID declining invitation
   * @returns {Promise<Object>} Decline result and success status
   */
  async declineInvitation(tripId, userId) {
    try {
      console.log(`🔄 Declining invitation: trip ${tripId} by user: ${userId}`);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return {
          success: false,
          error: 'Invalid trip ID format',
          code: 'INVALID_ID'
        };
      }

      // Get trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Find pending invitation
      const collaboratorIndex = trip.collaborators.findIndex(c => 
        c.userId.toString() === userId.toString() && c.status === 'pending'
      );

      if (collaboratorIndex === -1) {
        return {
          success: false,
          error: 'No pending invitation found for this user',
          code: 'INVITATION_NOT_FOUND'
        };
      }

      // Update status to declined
      trip.collaborators[collaboratorIndex].status = 'declined';
      trip.collaborators[collaboratorIndex].lastActiveAt = new Date();

      // Log activity
      trip.logActivity(userId, 'collaborator_declined', {
        role: trip.collaborators[collaboratorIndex].role
      });

      await trip.save();

      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId);
        await redisUtils.del(`trip:collaborators:${tripId}`);
      }

      // Publish decline notification
      await redisUtils.publishTripUpdate(tripId, {
        type: 'collaborator_declined',
        userId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Invitation declined: trip ${tripId} by user: ${userId}`);
      
      return {
        success: true,
        message: 'Invitation declined successfully'
      };

    } catch (error) {
      console.error('❌ Decline invitation failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'DECLINE_ERROR'
      };
    }
  }

  /**
   * Remove collaborator from trip
   * @param {string} tripId - Trip ID
   * @param {string} collaboratorUserId - User ID to remove
   * @param {string} removerUserId - User ID performing the removal
   * @returns {Promise<Object>} Removal result and success status
   */
  async removeCollaborator(tripId, collaboratorUserId, removerUserId) {
    try {
      console.log(`🔄 Removing collaborator: ${collaboratorUserId} from trip: ${tripId}`);

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(collaboratorUserId)) {
        return {
          success: false,
          error: 'Invalid ID format',
          code: 'INVALID_ID'
        };
      }

      // Check permissions
      const permissionResult = await this.checkTripPermission(tripId, removerUserId, 'manage_collaborators');
      if (!permissionResult.success || !permissionResult.hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions to remove collaborators',
          code: 'PERMISSION_DENIED'
        };
      }

      // Get trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Remove collaborator using model method
      await trip.removeCollaborator(collaboratorUserId, removerUserId);

      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId);
        await this.invalidateUserTripCache(collaboratorUserId);
        await redisUtils.del(`trip:collaborators:${tripId}`);
      }

      // Publish removal notification
      await redisUtils.publishTripUpdate(tripId, {
        type: 'collaborator_removed',
        removedUserId: collaboratorUserId,
        removerUserId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Collaborator removed: ${collaboratorUserId} from trip: ${tripId}`);
      
      return {
        success: true,
        message: 'Collaborator removed successfully'
      };

    } catch (error) {
      console.error('❌ Remove collaborator failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'REMOVAL_ERROR'
      };
    }
  }

  /**
   * Update collaborator role
   * @param {string} tripId - Trip ID
   * @param {string} collaboratorUserId - User ID to update
   * @param {string} newRole - New role
   * @param {string} updaterUserId - User ID performing the update
   * @returns {Promise<Object>} Update result and success status
   */
  async updateCollaboratorRole(tripId, collaboratorUserId, newRole, updaterUserId) {
    try {
      console.log(`🔄 Updating collaborator role: ${collaboratorUserId} to ${newRole} in trip: ${tripId}`);

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(collaboratorUserId)) {
        return {
          success: false,
          error: 'Invalid ID format',
          code: 'INVALID_ID'
        };
      }

      if (!['editor', 'contributor', 'viewer'].includes(newRole)) {
        return {
          success: false,
          error: 'Invalid collaborator role',
          code: 'INVALID_ROLE'
        };
      }

      // Check permissions
      const permissionResult = await this.checkTripPermission(tripId, updaterUserId, 'manage_collaborators');
      if (!permissionResult.success || !permissionResult.hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions to manage collaborators',
          code: 'PERMISSION_DENIED'
        };
      }

      // Get trip
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        };
      }

      // Update role using model method
      await trip.updateCollaboratorRole(collaboratorUserId, newRole, updaterUserId);

      // Invalidate cache
      if (this.cacheEnabled) {
        await this.invalidateTripCache(tripId);
        await redisUtils.del(`trip:collaborators:${tripId}`);
      }

      // Publish role update notification
      await redisUtils.publishTripUpdate(tripId, {
        type: 'collaborator_role_updated',
        collaboratorUserId,
        newRole,
        updaterUserId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Collaborator role updated: ${collaboratorUserId} to ${newRole} in trip: ${tripId}`);
      
      return {
        success: true,
        collaboration: {
          tripId,
          userId: collaboratorUserId,
          role: newRole,
          updatedBy: updaterUserId,
          updatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Update collaborator role failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'ROLE_UPDATE_ERROR'
      };
    }
  }

  // ==================== TRIP RETRIEVAL AND LISTING ====================

  /**
   * Get user's trips with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User trips and success status
   */
  async getUserTrips(userId, filters = {}, options = {}) {
    try {
      // Check cache first
      const cacheKey = `user:trips:${userId}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
      if (this.cacheEnabled && !options.skipCache) {
        const cachedTrips = await redisUtils.get(cacheKey);
        if (cachedTrips) {
          return {
            success: true,
            trips: cachedTrips.trips,
            pagination: cachedTrips.pagination,
            fromCache: true
          };
        }
      }

      // Build query
      const query = {
        $or: [
          { owner: userId },
          { 'collaborators.userId': userId, 'collaborators.status': 'accepted' }
        ],
        isArchived: false
      };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.destination) {
        query['destination.name'] = { $regex: filters.destination, $options: 'i' };
      }

      if (filters.dateRange) {
        if (filters.dateRange.start) {
          query['dates.start'] = { $gte: new Date(filters.dateRange.start) };
        }
        if (filters.dateRange.end) {
          query['dates.end'] = { $lte: new Date(filters.dateRange.end) };
        }
      }

      if (filters.budgetRange) {
        if (filters.budgetRange.min) {
          query['budget.total'] = { $gte: filters.budgetRange.min };
        }
        if (filters.budgetRange.max) {
          query['budget.total'] = { ...query['budget.total'], $lte: filters.budgetRange.max };
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      // Set up pagination
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100); // Max 100 trips per page
      const skip = (page - 1) * limit;

      // Execute query with population
      const tripsQuery = Trip.find(query)
        .populate('owner', 'profile.displayName profile.photoURL email')
        .populate('collaborators.userId', 'profile.displayName profile.photoURL email')
        .sort(options.sortBy || { updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const [trips, totalCount] = await Promise.all([
        tripsQuery,
        Trip.countDocuments(query)
      ]);

      // Prepare pagination info
      const pagination = {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      };

      const result = { trips, pagination };

      // Cache the results
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, result, this.defaultCacheTTL.tripList);
      }

      return {
        success: true,
        trips,
        pagination,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get user trips failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Search trips with advanced filtering
   * @param {string} query - Search query
   * @param {string} userId - User ID performing search
   * @param {Object} filters - Additional filters
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results and success status
   */
  async searchTrips(query, userId, filters = {}, options = {}) {
    try {
      const cacheKey = `search:trips:${userId}:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.cacheEnabled && !options.skipCache) {
        const cachedResults = await redisUtils.get(cacheKey);
        if (cachedResults) {
          return {
            success: true,
            trips: cachedResults.trips,
            pagination: cachedResults.pagination,
            fromCache: true
          };
        }
      }

      // Use Trip model's search method
      const searchQuery = Trip.searchTrips(query, userId, {
        limit: options.limit || 20,
        ...filters
      });

      const trips = await searchQuery;

      // Prepare pagination (simplified for search)
      const pagination = {
        page: 1,
        limit: options.limit || 20,
        totalCount: trips.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      const result = { trips, pagination };

      // Cache the results
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, result, this.defaultCacheTTL.search);
      }

      return {
        success: true,
        trips,
        pagination,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Search trips failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'SEARCH_ERROR'
      };
    }
  }

  /**
   * Get upcoming trips for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of trips to return
   * @returns {Promise<Object>} Upcoming trips and success status
   */
  async getUpcomingTrips(userId, limit = 10) {
    try {
      const cacheKey = `user:upcoming:${userId}:${limit}`;
      
      // Check cache first
      if (this.cacheEnabled) {
        const cachedTrips = await redisUtils.get(cacheKey);
        if (cachedTrips) {
          return {
            success: true,
            trips: cachedTrips,
            fromCache: true
          };
        }
      }

      // Use Trip model's method
      const trips = await Trip.getUpcomingTrips(userId, limit);

      // Cache the results
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, trips, this.defaultCacheTTL.tripList);
      }

      return {
        success: true,
        trips,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get upcoming trips failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'RETRIEVAL_ERROR'
      };
    }
  }

  // ==================== PERMISSION CHECKING ====================

  /**
   * Check if user has permission for trip operation
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @param {string} permission - Permission to check
   * @returns {Promise<Object>} Permission check result
   */
  async checkTripPermission(tripId, userId, permission) {
    try {
      // Check cache first
      const cacheKey = `permission:${tripId}:${userId}:${permission}`;
      if (this.cacheEnabled) {
        const cachedResult = await redisUtils.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      const trip = await Trip.findById(tripId).lean();
      
      if (!trip) {
        return {
          success: false,
          hasPermission: false,
          error: 'Trip not found'
        };
      }

      // Find user's collaboration
      const collaborator = trip.collaborators.find(c => 
        c.userId.toString() === userId.toString() && c.status === 'accepted'
      );

      if (!collaborator) {
        return {
          success: true,
          hasPermission: false,
          reason: 'User is not a collaborator'
        };
      }

      const hasPermission = collaborator.permissions.includes(permission);

      const result = {
        success: true,
        hasPermission,
        role: collaborator.role,
        permissions: collaborator.permissions
      };

      // Cache the result for 5 minutes
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, result, 300);
      }

      return result;

    } catch (error) {
      console.error('❌ Check trip permission failed:', error.message);
      return {
        success: false,
        hasPermission: false,
        error: error.message
      };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate user exists and is active
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Validation result
   */
  async validateUser(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
          code: 'INVALID_USER_ID'
        };
      }

      const user = await User.findById(userId).select('isActive').lean();
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive',
          code: 'USER_NOT_FOUND'
        };
      }

      return { success: true, user };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'USER_VALIDATION_ERROR'
      };
    }
  }

  /**
   * Update user activity for a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateUserActivity(tripId, userId) {
    try {
      await Trip.findOneAndUpdate(
        { 
          _id: tripId,
          'collaborators.userId': userId,
          'collaborators.status': 'accepted'
        },
        { 
          $set: { 'collaborators.$.lastActiveAt': new Date() }
        }
      );

      // Set user presence
      await redisUtils.setUserPresence(tripId, userId, {
        lastSeen: new Date().toISOString(),
        isOnline: true
      });

    } catch (error) {
      console.warn('⚠️ Update user activity failed:', error.message);
    }
  }

  /**
   * Extract previous values for change tracking
   * @param {Object} currentTrip - Current trip object
   * @param {Object} updates - Updates being applied
   * @returns {Object} Previous values
   */
  extractPreviousValues(currentTrip, updates) {
    const previousValues = {};
    
    Object.keys(updates).forEach(key => {
      if (currentTrip[key] !== undefined) {
        previousValues[key] = currentTrip[key];
      }
    });

    return previousValues;
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Cache trip data
   * @param {string} tripId - Trip ID
   * @param {Object} tripData - Trip data to cache
   * @returns {Promise<boolean>} Success status
   */
  async cacheTripData(tripId, tripData) {
    try {
      if (!this.cacheEnabled) return false;

      await redisUtils.cacheTrip(tripId, tripData, this.defaultCacheTTL.trip);
      return true;

    } catch (error) {
      console.error('❌ Cache trip data failed:', error.message);
      return false;
    }
  }

  /**
   * Invalidate trip-related cache
   * @param {string} tripId - Trip ID
   * @param {Array} collaboratorIds - Optional collaborator IDs
   * @returns {Promise<boolean>} Success status
   */
  async invalidateTripCache(tripId, collaboratorIds = []) {
    try {
      if (!this.cacheEnabled) return false;

      await redisUtils.invalidateTripCache(tripId, collaboratorIds);
      return true;

    } catch (error) {
      console.error('❌ Invalidate trip cache failed:', error.message);
      return false;
    }
  }

  /**
   * Invalidate user trip cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateUserTripCache(userId) {
    try {
      if (!this.cacheEnabled) return false;

      await redisUtils.del(`user:trips:${userId}`);
      await redisUtils.deleteByPattern(`user:trips:${userId}:*`);
      await redisUtils.del(`user:upcoming:${userId}:*`);
      
      return true;

    } catch (error) {
      console.error('❌ Invalidate user trip cache failed:', error.message);
      return false;
    }
  }

  /**
   * Invalidate multiple users' trip caches
   * @param {Array} userIds - Array of user IDs
   * @returns {Promise<boolean>} Success status
   */
  async invalidateUserTripCaches(userIds) {
    try {
      if (!this.cacheEnabled || !userIds.length) return false;

      const promises = userIds.map(userId => this.invalidateUserTripCache(userId));
      await Promise.all(promises);
      
      return true;

    } catch (error) {
      console.error('❌ Invalidate user trip caches failed:', error.message);
      return false;
    }
  }

  // ==================== SERVICE HEALTH AND STATISTICS ====================

  /**
   * Get service health status
   * @returns {Promise<Object>} Service health information
   */
  async getHealthStatus() {
    try {
      const dbHealth = await Trip.findOne().limit(1).lean();
      const cacheHealth = this.cacheEnabled ? await redisUtils.healthCheck() : null;

      return {
        status: 'healthy',
        database: {
          connected: !!dbHealth,
          status: dbHealth ? 'connected' : 'disconnected'
        },
        cache: {
          enabled: this.cacheEnabled,
          status: cacheHealth?.status || 'disabled',
          connected: cacheHealth?.connected || false
        },
        features: {
          tripCreation: true,
          tripRetrieval: true,
          tripUpdates: true,
          collaboration: true,
          invitations: true,
          permissions: true,
          search: true,
          caching: this.cacheEnabled,
          realTimeUpdates: true
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get trip statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Trip statistics
   */
  async getTripStats(userId) {
    try {
      const cacheKey = `user:trip:stats:${userId}`;
      
      // Check cache first
      if (this.cacheEnabled) {
        const cachedStats = await redisUtils.get(cacheKey);
        if (cachedStats) {
          return {
            success: true,
            stats: cachedStats,
            fromCache: true
          };
        }
      }

      // Use Trip model's method
      const statsResult = await Trip.getTripStats(userId);
      const stats = statsResult[0] || {
        totalTrips: 0,
        completedTrips: 0,
        upcomingTrips: 0,
        totalBudget: 0,
        totalSpent: 0,
        averageDuration: 0
      };

      // Cache the stats
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, stats, this.defaultCacheTTL.stats);
      }

      return {
        success: true,
        stats,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get trip stats failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'STATS_ERROR'
      };
    }
  }
}

module.exports = TripService;