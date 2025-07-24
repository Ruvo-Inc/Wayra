const User = require('../models/User');
const redisUtils = require('../utils/redis');
const mongoose = require('mongoose');

/**
 * UserService - Comprehensive user management service for Wayra
 * Provides CRUD operations, preference management, travel history tracking,
 * and Redis caching integration for optimal performance
 */
class UserService {
  constructor() {
    this.cacheEnabled = true;
    this.defaultCacheTTL = {
      profile: 1800,      // 30 minutes
      preferences: 3600,  // 1 hour
      trips: 900,         // 15 minutes
      stats: 1800,        // 30 minutes
      search: 300         // 5 minutes
    };
  }

  // ==================== USER CREATION AND REGISTRATION ====================

  /**
   * Create a new user with Firebase UID
   * @param {string} firebaseUid - Firebase user ID
   * @param {string} email - User email
   * @param {Object} profileData - User profile data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created user and success status
   */
  async createUser(firebaseUid, email, profileData, options = {}) {
    try {
      console.log(`🔄 Creating user: ${email}`);

      // Check if user already exists
      const existingUser = await User.findByFirebaseUid(firebaseUid);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists',
          code: 'USER_EXISTS',
          user: existingUser
        };
      }

      // Prepare user data with defaults
      const userData = {
        firebaseUid,
        email: email.toLowerCase(),
        profile: {
          displayName: profileData.displayName || profileData.firstName || 'User',
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          photoURL: profileData.photoURL || null,
          phoneNumber: profileData.phoneNumber || null,
          dateOfBirth: profileData.dateOfBirth || null,
          location: {
            country: profileData.location?.country || '',
            city: profileData.location?.city || '',
            timezone: profileData.location?.timezone || 'UTC'
          }
        },
        preferences: this.getDefaultPreferences(options.preferences),
        settings: this.getDefaultSettings(options.settings),
        stats: this.getDefaultStats(),
        isEmailVerified: options.isEmailVerified || false,
        lastLoginAt: new Date(),
        accountCreatedAt: new Date()
      };

      // Create user in database
      const user = new User(userData);
      await user.save();

      // Cache user profile
      if (this.cacheEnabled) {
        await this.cacheUserData(user._id.toString(), user);
      }

      console.log(`✅ User created successfully: ${email}`);
      
      return {
        success: true,
        user: user.toObject(),
        isNewUser: true
      };

    } catch (error) {
      console.error('❌ User creation failed:', error.message);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return {
          success: false,
          error: `${field} already exists`,
          code: 'DUPLICATE_KEY',
          field
        };
      }

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
   * Create or update user (upsert operation)
   * @param {string} firebaseUid - Firebase user ID
   * @param {string} email - User email
   * @param {Object} profileData - User profile data
   * @returns {Promise<Object>} User data and operation status
   */
  async createOrUpdateUser(firebaseUid, email, profileData) {
    try {
      const existingUser = await User.findByFirebaseUid(firebaseUid);
      
      if (existingUser) {
        // Update existing user
        const updateResult = await this.updateUserProfile(existingUser._id.toString(), {
          profile: {
            ...existingUser.profile,
            ...profileData,
            location: {
              ...existingUser.profile.location,
              ...profileData.location
            }
          },
          lastLoginAt: new Date()
        });

        return {
          success: updateResult.success,
          user: updateResult.user,
          isNewUser: false,
          error: updateResult.error
        };
      } else {
        // Create new user
        return await this.createUser(firebaseUid, email, profileData);
      }
    } catch (error) {
      console.error('❌ Create or update user failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'UPSERT_ERROR'
      };
    }
  }

  // ==================== USER RETRIEVAL OPERATIONS ====================

  /**
   * Get user by Firebase UID with caching
   * @param {string} firebaseUid - Firebase user ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User data and success status
   */
  async getUserByFirebaseUid(firebaseUid, options = {}) {
    try {
      // Check cache first
      if (this.cacheEnabled && !options.skipCache) {
        const cachedUser = await redisUtils.getCachedUserProfile(firebaseUid);
        if (cachedUser) {
          console.log(`📋 User retrieved from cache: ${firebaseUid}`);
          return {
            success: true,
            user: cachedUser,
            fromCache: true
          };
        }
      }

      // Query database
      let query = User.findByFirebaseUid(firebaseUid);
      
      if (options.includeTrips) {
        query = query.populate('trips', 'title startDate endDate status budget.total');
      }

      const user = await query.lean();
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Cache the result
      if (this.cacheEnabled) {
        await this.cacheUserData(user._id.toString(), user);
      }

      return {
        success: true,
        user,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get user by Firebase UID failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Get user by ID with caching
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User data and success status
   */
  async getUserById(userId, options = {}) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
          code: 'INVALID_ID'
        };
      }

      // Check cache first
      if (this.cacheEnabled && !options.skipCache) {
        const cachedUser = await redisUtils.getCachedUserProfile(userId);
        if (cachedUser) {
          return {
            success: true,
            user: cachedUser,
            fromCache: true
          };
        }
      }

      // Query database
      let query = User.findById(userId);
      
      if (options.includeTrips) {
        query = query.populate('trips', 'title startDate endDate status budget.total');
      }

      const user = await query.lean();
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Cache the result
      if (this.cacheEnabled) {
        await this.cacheUserData(userId, user);
      }

      return {
        success: true,
        user,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get user by ID failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data and success status
   */
  async getUserByEmail(email) {
    try {
      const user = await User.findByEmail(email.toLowerCase()).lean();
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('❌ Get user by email failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'RETRIEVAL_ERROR'
      };
    }
  }

  // ==================== USER PROFILE MANAGEMENT ====================

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user and success status
   */
  async updateUserProfile(userId, updates, options = {}) {
    try {
      console.log(`🔄 Updating user profile: ${userId}`);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
          code: 'INVALID_ID'
        };
      }

      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // Update user in database
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          lean: true
        }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Invalidate and update cache
      if (this.cacheEnabled) {
        await redisUtils.invalidateUserCache(userId);
        await this.cacheUserData(userId, user);
      }

      console.log(`✅ User profile updated: ${userId}`);
      
      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('❌ Update user profile failed:', error.message);
      
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
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<Object>} Updated user and success status
   */
  async updateUserPreferences(userId, preferences) {
    try {
      console.log(`🔄 Updating user preferences: ${userId}`);

      const updateResult = await this.updateUserProfile(userId, {
        preferences: {
          ...preferences
        }
      });

      if (updateResult.success) {
        // Cache preferences separately for quick access
        if (this.cacheEnabled) {
          await redisUtils.cacheUserPreferences(
            userId, 
            updateResult.user.preferences, 
            this.defaultCacheTTL.preferences
          );
        }
      }

      return updateResult;

    } catch (error) {
      console.error('❌ Update user preferences failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'PREFERENCES_UPDATE_ERROR'
      };
    }
  }

  /**
   * Update user settings
   * @param {string} userId - User ID
   * @param {Object} settings - New settings
   * @returns {Promise<Object>} Updated user and success status
   */
  async updateUserSettings(userId, settings) {
    try {
      console.log(`🔄 Updating user settings: ${userId}`);

      return await this.updateUserProfile(userId, {
        settings: {
          ...settings
        }
      });

    } catch (error) {
      console.error('❌ Update user settings failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'SETTINGS_UPDATE_ERROR'
      };
    }
  }

  // ==================== USER ACTIVITY TRACKING ====================

  /**
   * Update user last login time
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success status
   */
  async updateLastLogin(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          lastLoginAt: new Date(),
          lastActivityAt: new Date()
        },
        { new: true, lean: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Update cache
      if (this.cacheEnabled) {
        await this.cacheUserData(userId, user);
      }

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('❌ Update last login failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'LOGIN_UPDATE_ERROR'
      };
    }
  }

  /**
   * Update user activity timestamp
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success status
   */
  async updateActivity(userId) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { lastActivityAt: new Date() }
      );

      return { success: true };

    } catch (error) {
      console.error('❌ Update activity failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'ACTIVITY_UPDATE_ERROR'
      };
    }
  }

  // ==================== USER STATISTICS MANAGEMENT ====================

  /**
   * Get user statistics with caching
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics and success status
   */
  async getUserStats(userId) {
    try {
      // Check cache first
      if (this.cacheEnabled) {
        const cachedStats = await redisUtils.get(`user:stats:${userId}`);
        if (cachedStats) {
          return {
            success: true,
            stats: cachedStats,
            fromCache: true
          };
        }
      }

      const user = await User.findById(userId).select('stats').lean();
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Cache the stats
      if (this.cacheEnabled) {
        await redisUtils.set(
          `user:stats:${userId}`, 
          user.stats, 
          this.defaultCacheTTL.stats
        );
      }

      return {
        success: true,
        stats: user.stats,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get user stats failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'STATS_RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Update user trip statistics
   * @param {string} userId - User ID
   * @param {string} type - Statistic type ('planned', 'completed', 'collaborated')
   * @param {number} increment - Increment value (default: 1)
   * @returns {Promise<Object>} Success status
   */
  async updateTripStats(userId, type, increment = 1) {
    try {
      const updateField = {};
      
      switch (type) {
        case 'planned':
          updateField['stats.tripsPlanned'] = increment;
          break;
        case 'completed':
          updateField['stats.tripsCompleted'] = increment;
          break;
        case 'collaborated':
          updateField['stats.totalTripsCollaborated'] = increment;
          break;
        default:
          return {
            success: false,
            error: 'Invalid statistic type',
            code: 'INVALID_STAT_TYPE'
          };
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: updateField },
        { new: true, lean: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Invalidate stats cache
      if (this.cacheEnabled) {
        await redisUtils.del(`user:stats:${userId}`);
        await redisUtils.invalidateUserCache(userId);
      }

      return {
        success: true,
        stats: user.stats
      };

    } catch (error) {
      console.error('❌ Update trip stats failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'STATS_UPDATE_ERROR'
      };
    }
  }

  /**
   * Update user budget saved
   * @param {string} userId - User ID
   * @param {number} amount - Amount saved
   * @returns {Promise<Object>} Success status
   */
  async updateBudgetSaved(userId, amount) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { 'stats.totalBudgetSaved': amount } },
        { new: true, lean: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Invalidate stats cache
      if (this.cacheEnabled) {
        await redisUtils.del(`user:stats:${userId}`);
      }

      return {
        success: true,
        stats: user.stats
      };

    } catch (error) {
      console.error('❌ Update budget saved failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'BUDGET_UPDATE_ERROR'
      };
    }
  }

  /**
   * Add favorite destination
   * @param {string} userId - User ID
   * @param {string} destination - Destination name
   * @returns {Promise<Object>} Success status
   */
  async addFavoriteDestination(userId, destination) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Use the model method
      await user.addFavoriteDestination(destination);

      // Invalidate cache
      if (this.cacheEnabled) {
        await redisUtils.invalidateUserCache(userId);
      }

      return {
        success: true,
        favoriteDestinations: user.stats.favoriteDestinations
      };

    } catch (error) {
      console.error('❌ Add favorite destination failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'FAVORITE_ADD_ERROR'
      };
    }
  }

  // ==================== USER SEARCH AND DISCOVERY ====================

  /**
   * Search users with caching
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results and success status
   */
  async searchUsers(query, options = {}) {
    try {
      const cacheKey = `search:users:${query}:${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.cacheEnabled && !options.skipCache) {
        const cachedResults = await redisUtils.get(cacheKey);
        if (cachedResults) {
          return {
            success: true,
            users: cachedResults,
            fromCache: true
          };
        }
      }

      const users = await User.searchUsers(query, {
        limit: options.limit || 20,
        includePrivate: options.includePrivate || false
      });

      // Cache the results
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, users, this.defaultCacheTTL.search);
      }

      return {
        success: true,
        users,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Search users failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'SEARCH_ERROR'
      };
    }
  }

  /**
   * Get users by travel style
   * @param {string} travelStyle - Travel style
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and success status
   */
  async getUsersByTravelStyle(travelStyle, options = {}) {
    try {
      const cacheKey = `users:travelStyle:${travelStyle}:${options.limit || 20}`;
      
      // Check cache first
      if (this.cacheEnabled) {
        const cachedUsers = await redisUtils.get(cacheKey);
        if (cachedUsers) {
          return {
            success: true,
            users: cachedUsers,
            fromCache: true
          };
        }
      }

      const users = await User.getUsersByTravelStyle(travelStyle, options.limit);

      // Cache the results
      if (this.cacheEnabled) {
        await redisUtils.set(cacheKey, users, this.defaultCacheTTL.search);
      }

      return {
        success: true,
        users,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Get users by travel style failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'TRAVEL_STYLE_QUERY_ERROR'
      };
    }
  }

  // ==================== USER DELETION AND DEACTIVATION ====================

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @param {string} reason - Deactivation reason
   * @returns {Promise<Object>} Success status
   */
  async deactivateUser(userId, reason = 'user_request') {
    try {
      console.log(`🔄 Deactivating user: ${userId}`);

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: reason
        },
        { new: true, lean: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      // Clear all user cache
      if (this.cacheEnabled) {
        await redisUtils.invalidateUserCache(userId);
        await redisUtils.deleteUserSession(userId);
      }

      console.log(`✅ User deactivated: ${userId}`);
      
      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('❌ Deactivate user failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'DEACTIVATION_ERROR'
      };
    }
  }

  /**
   * Reactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success status
   */
  async reactivateUser(userId) {
    try {
      console.log(`🔄 Reactivating user: ${userId}`);

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: true,
          $unset: { 
            deactivatedAt: 1,
            deactivationReason: 1
          }
        },
        { new: true, lean: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      console.log(`✅ User reactivated: ${userId}`);
      
      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('❌ Reactivate user failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'REACTIVATION_ERROR'
      };
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Cache user data
   * @param {string} userId - User ID
   * @param {Object} userData - User data to cache
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserData(userId, userData) {
    try {
      if (!this.cacheEnabled) return false;

      const cachePromises = [
        redisUtils.cacheUserProfile(userId, userData, this.defaultCacheTTL.profile),
        redisUtils.cacheUserPreferences(userId, userData.preferences, this.defaultCacheTTL.preferences)
      ];

      await Promise.all(cachePromises);
      return true;

    } catch (error) {
      console.error('❌ Cache user data failed:', error.message);
      return false;
    }
  }

  /**
   * Invalidate user cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateUserCache(userId) {
    try {
      if (!this.cacheEnabled) return false;

      await redisUtils.invalidateUserCache(userId);
      return true;

    } catch (error) {
      console.error('❌ Invalidate user cache failed:', error.message);
      return false;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get default user preferences
   * @param {Object} customPreferences - Custom preferences to merge
   * @returns {Object} Default preferences object
   */
  getDefaultPreferences(customPreferences = {}) {
    const defaults = {
      budgetRange: {
        min: 500,
        max: 2000,
        currency: 'USD'
      },
      travelStyle: ['budget'],
      interests: [],
      accommodationPreferences: ['hotel'],
      transportationPreferences: ['flight'],
      dietaryRestrictions: [],
      accessibility: []
    };

    return {
      ...defaults,
      ...customPreferences,
      budgetRange: {
        ...defaults.budgetRange,
        ...customPreferences.budgetRange
      }
    };
  }

  /**
   * Get default user settings
   * @param {Object} customSettings - Custom settings to merge
   * @returns {Object} Default settings object
   */
  getDefaultSettings(customSettings = {}) {
    const defaults = {
      notifications: {
        email: true,
        push: true,
        tripUpdates: true,
        priceAlerts: false,
        collaborationInvites: true,
        aiRecommendations: true
      },
      privacy: {
        profileVisibility: 'public',
        tripVisibility: 'private',
        allowInvitations: true,
        showOnlineStatus: true,
        allowDataExport: true
      },
      ai: {
        personalizationEnabled: true,
        dataUsageConsent: false,
        learningFromHistory: true,
        communicationStyle: 'casual',
        detailLevel: 'moderate',
        riskTolerance: 'moderate'
      },
      language: 'en',
      timezone: 'UTC'
    };

    return {
      ...defaults,
      ...customSettings,
      notifications: {
        ...defaults.notifications,
        ...customSettings.notifications
      },
      privacy: {
        ...defaults.privacy,
        ...customSettings.privacy
      },
      ai: {
        ...defaults.ai,
        ...customSettings.ai
      }
    };
  }

  /**
   * Get default user statistics
   * @returns {Object} Default statistics object
   */
  getDefaultStats() {
    return {
      tripsPlanned: 0,
      tripsCompleted: 0,
      totalBudgetSaved: 0,
      favoriteDestinations: [],
      averageTripDuration: 7,
      totalTripsCollaborated: 0,
      aiInteractionsCount: 0
    };
  }

  /**
   * Validate user permissions for operation
   * @param {string} userId - User ID performing operation
   * @param {string} targetUserId - Target user ID
   * @param {string} operation - Operation type
   * @returns {Promise<Object>} Permission validation result
   */
  async validateUserPermissions(userId, targetUserId, operation) {
    try {
      // Users can always operate on their own data
      if (userId === targetUserId) {
        return { success: true, allowed: true };
      }

      // For now, only allow self-operations
      // This can be extended for admin operations, friend operations, etc.
      return {
        success: true,
        allowed: false,
        reason: 'Insufficient permissions'
      };

    } catch (error) {
      console.error('❌ Permission validation failed:', error.message);
      return {
        success: false,
        error: error.message,
        code: 'PERMISSION_ERROR'
      };
    }
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} Service health information
   */
  async getHealthStatus() {
    try {
      const dbHealth = await User.findOne().limit(1).lean();
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
          userCreation: true,
          userRetrieval: true,
          userUpdates: true,
          caching: this.cacheEnabled,
          statistics: true,
          search: true
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
}

module.exports = UserService;