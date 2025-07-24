const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');

/**
 * Database utility functions for Wayra backend
 */

class DatabaseUtils {
  /**
   * Initialize database connection and setup
   */
  static async initialize() {
    try {
      // Create indexes asynchronously with timeout handling
      const indexPromises = [
        User.createIndexes().catch(err => console.warn('User indexes:', err.message)),
        Trip.createIndexes().catch(err => console.warn('Trip indexes:', err.message))
      ];
      
      // Wait for critical indexes with timeout
      await Promise.allSettled(indexPromises);
      
      console.log('✅ Database indexes initialization completed');
      return true;
    } catch (error) {
      console.warn('⚠️ Database initialization warning:', error.message);
      // Don't fail startup for index creation issues
      return true;
    }
  }

  /**
   * User Management Functions
   */
  static async createOrUpdateUser(firebaseUid, userData) {
    try {
      const user = await User.findOneAndUpdate(
        { firebaseUid },
        {
          ...userData,
          lastLoginAt: new Date()
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error creating/updating user:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserByFirebaseUid(firebaseUid) {
    try {
      const user = await User.findByFirebaseUid(firebaseUid)
        .populate('trips', 'title startDate endDate status')
        .lean();
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error fetching user:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUserPreferences(firebaseUid, preferences) {
    try {
      const user = await User.findOneAndUpdate(
        { firebaseUid },
        { $set: { preferences } },
        { new: true, runValidators: true }
      );
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error updating preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trip Management Functions
   */
  static async createTrip(ownerId, tripData) {
    try {
      const trip = new Trip({
        ...tripData,
        owner: ownerId
      });
      
      await trip.save();
      
      // Add trip to user's trips array
      await User.findByIdAndUpdate(
        ownerId,
        { $push: { trips: trip._id } }
      );
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error creating trip:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserTrips(userId) {
    try {
      const trips = await Trip.findUserTrips(userId)
        .sort({ createdAt: -1 })
        .lean();
      
      return { success: true, trips };
    } catch (error) {
      console.error('Database error fetching user trips:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTripById(tripId, userId) {
    try {
      const trip = await Trip.findOne({
        _id: tripId,
        $or: [
          { owner: userId },
          { 'collaborators.user': userId }
        ]
      })
      .populate('owner', 'displayName email photoURL')
      .populate('collaborators.user', 'displayName email photoURL')
      .lean();
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error fetching trip:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateTrip(tripId, userId, updateData) {
    try {
      const trip = await Trip.findOneAndUpdate(
        {
          _id: tripId,
          $or: [
            { owner: userId },
            { 'collaborators.user': userId, 'collaborators.role': 'editor' }
          ]
        },
        { 
          $set: updateData,
          'lastActivity.user': userId,
          'lastActivity.action': 'updated',
          'lastActivity.timestamp': new Date()
        },
        { new: true, runValidators: true }
      );
      
      if (!trip) {
        return { success: false, error: 'Trip not found or insufficient permissions' };
      }
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error updating trip:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteTrip(tripId, userId) {
    try {
      const trip = await Trip.findOneAndDelete({
        _id: tripId,
        owner: userId
      });
      
      if (!trip) {
        return { success: false, error: 'Trip not found or insufficient permissions' };
      }
      
      // Remove trip from user's trips array
      await User.findByIdAndUpdate(
        userId,
        { $pull: { trips: tripId } }
      );
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error deleting trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Collaboration Functions
   */
  static async addCollaborator(tripId, ownerId, collaboratorEmail, role = 'viewer') {
    try {
      const collaborator = await User.findByEmail(collaboratorEmail);
      if (!collaborator) {
        return { success: false, error: 'User not found' };
      }
      
      const trip = await Trip.findOneAndUpdate(
        { _id: tripId, owner: ownerId },
        {
          $addToSet: {
            collaborators: {
              user: collaborator._id,
              role,
              invitedBy: ownerId
            }
          }
        },
        { new: true }
      );
      
      if (!trip) {
        return { success: false, error: 'Trip not found or insufficient permissions' };
      }
      
      return { success: true, trip, collaborator };
    } catch (error) {
      console.error('Database error adding collaborator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analytics and Statistics
   */
  static async getUserStats(userId) {
    try {
      const stats = await Trip.aggregate([
        {
          $match: {
            $or: [
              { owner: mongoose.Types.ObjectId(userId) },
              { 'collaborators.user': mongoose.Types.ObjectId(userId) }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalBudget: { $sum: '$budget.total' },
            totalSpent: {
              $sum: {
                $add: [
                  '$budget.spent.accommodation',
                  '$budget.spent.transportation',
                  '$budget.spent.food',
                  '$budget.spent.activities',
                  '$budget.spent.shopping',
                  '$budget.spent.other'
                ]
              }
            }
          }
        }
      ]);
      
      return { 
        success: true, 
        stats: stats[0] || {
          totalTrips: 0,
          completedTrips: 0,
          totalBudget: 0,
          totalSpent: 0
        }
      };
    } catch (error) {
      console.error('Database error fetching user stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Health Check
   */
  static async healthCheck() {
    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      const userCount = await User.countDocuments();
      const tripCount = await Trip.countDocuments();
      
      return {
        status: states[dbState],
        connected: dbState === 1,
        collections: {
          users: userCount,
          trips: tripCount
        }
      };
    } catch (error) {
      console.error('Database health check error:', error);
      return {
        status: 'error',
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = DatabaseUtils;
