const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const User = require('../models/User');
const redisUtils = require('../utils/redis');
const { 
  authMiddleware, 
  requireAuth, 
  requireProfile, 
  getUserContext,
  isAuthenticated,
  hasPermission,
  rateLimitMiddleware
} = require('../middleware/auth');

/**
 * User Profile API Routes
 * Provides endpoints for user profile management, preferences, and statistics
 */

// Initialize UserService
const userService = new UserService();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply rate limiting to prevent abuse
router.use(rateLimitMiddleware({
  limit: 100, // 100 requests per hour per user
  window: 3600,
  keyGenerator: (req) => req.user?.uid || req.ip
}));

// ==================== USER PROFILE ENDPOINTS ====================

/**
 * GET /api/user/profile
 * Get current user's profile information
 */
router.get('/profile', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    
    // Return user profile with computed fields
    const profileData = {
      id: user.profile._id,
      firebaseUid: user.uid,
      email: user.email,
      profile: user.profile.profile,
      preferences: user.preferences,
      settings: user.settings,
      stats: user.profile.stats,
      isActive: user.profile.isActive,
      isEmailVerified: user.profile.isEmailVerified,
      lastLoginAt: user.profile.lastLoginAt,
      lastActivityAt: user.profile.lastActivityAt,
      accountCreatedAt: user.profile.accountCreatedAt,
      createdAt: user.profile.createdAt,
      updatedAt: user.profile.updatedAt,
      
      // Virtual fields
      fullName: user.profile.profile?.firstName && user.profile.profile?.lastName 
        ? `${user.profile.profile.firstName} ${user.profile.profile.lastName}`
        : user.profile.profile?.displayName || user.email,
      
      // Computed fields
      completionRate: user.profile.stats?.tripsPlanned > 0 
        ? Math.round((user.profile.stats.tripsCompleted / user.profile.stats.tripsPlanned) * 100)
        : 0,
      
      isNewUser: (new Date() - new Date(user.profile.accountCreatedAt)) / (1000 * 60 * 60 * 24) <= 7
    };

    res.json({
      success: true,
      data: profileData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      code: 'PROFILE_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/user/profile
 * Update current user's profile information
 */
router.put('/profile', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    const updates = req.body;

    // Validate and sanitize input
    const allowedFields = [
      'profile.displayName',
      'profile.firstName', 
      'profile.lastName',
      'profile.phoneNumber',
      'profile.dateOfBirth',
      'profile.location'
    ];

    // Build update object with only allowed fields
    const updateData = {};
    
    if (updates.profile) {
      updateData.profile = {};
      
      // Handle nested profile updates
      if (updates.profile.displayName !== undefined) {
        updateData.profile.displayName = updates.profile.displayName?.trim();
      }
      if (updates.profile.firstName !== undefined) {
        updateData.profile.firstName = updates.profile.firstName?.trim();
      }
      if (updates.profile.lastName !== undefined) {
        updateData.profile.lastName = updates.profile.lastName?.trim();
      }
      if (updates.profile.phoneNumber !== undefined) {
        updateData.profile.phoneNumber = updates.profile.phoneNumber?.trim();
      }
      if (updates.profile.dateOfBirth !== undefined) {
        updateData.profile.dateOfBirth = updates.profile.dateOfBirth;
      }
      if (updates.profile.location !== undefined) {
        updateData.profile.location = {
          ...user.profile.profile.location,
          ...updates.profile.location
        };
      }
    }

    // Validate required fields
    if (updateData.profile?.displayName !== undefined && !updateData.profile.displayName) {
      return res.status(400).json({
        success: false,
        error: 'Display name is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Update user profile
    const result = await userService.updateUserProfile(user.profile._id.toString(), updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.user,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      code: 'PROFILE_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== USER PREFERENCES ENDPOINTS ====================

/**
 * GET /api/user/preferences
 * Get current user's travel preferences
 */
router.get('/preferences', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);

    res.json({
      success: true,
      data: user.preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get preferences error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user preferences',
      code: 'PREFERENCES_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/user/preferences
 * Update current user's travel preferences
 */
router.put('/preferences', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    const preferences = req.body;

    // Validate preferences structure
    const allowedPreferences = [
      'budgetRange',
      'travelStyle',
      'interests',
      'accommodationPreferences',
      'transportationPreferences',
      'dietaryRestrictions',
      'accessibility'
    ];

    // Filter to only allowed preferences
    const filteredPreferences = {};
    allowedPreferences.forEach(key => {
      if (preferences[key] !== undefined) {
        filteredPreferences[key] = preferences[key];
      }
    });

    // Validate budget range if provided
    if (filteredPreferences.budgetRange) {
      const { min, max, currency } = filteredPreferences.budgetRange;
      if (min !== undefined && max !== undefined && min > max) {
        return res.status(400).json({
          success: false,
          error: 'Minimum budget cannot be greater than maximum budget',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update user preferences
    const result = await userService.updateUserPreferences(
      user.profile._id.toString(), 
      filteredPreferences
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.user.preferences,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update preferences error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences',
      code: 'PREFERENCES_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== USER SETTINGS ENDPOINTS ====================

/**
 * GET /api/user/settings
 * Get current user's settings
 */
router.get('/settings', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);

    res.json({
      success: true,
      data: user.settings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get settings error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user settings',
      code: 'SETTINGS_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/user/settings
 * Update current user's settings
 */
router.put('/settings', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    const settings = req.body;

    // Validate settings structure
    const allowedSettings = [
      'notifications',
      'privacy',
      'ai',
      'language',
      'timezone'
    ];

    // Filter to only allowed settings
    const filteredSettings = {};
    allowedSettings.forEach(key => {
      if (settings[key] !== undefined) {
        filteredSettings[key] = settings[key];
      }
    });

    // Merge with existing settings to preserve nested structure
    const mergedSettings = {
      ...user.settings,
      ...filteredSettings
    };

    // Handle nested settings merging
    if (settings.notifications) {
      mergedSettings.notifications = {
        ...user.settings.notifications,
        ...settings.notifications
      };
    }

    if (settings.privacy) {
      mergedSettings.privacy = {
        ...user.settings.privacy,
        ...settings.privacy
      };
    }

    if (settings.ai) {
      mergedSettings.ai = {
        ...user.settings.ai,
        ...settings.ai
      };
    }

    // Update user settings
    const result = await userService.updateUserSettings(
      user.profile._id.toString(), 
      mergedSettings
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.user.settings,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update settings error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update user settings',
      code: 'SETTINGS_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== USER TRAVEL HISTORY ENDPOINTS ====================

/**
 * GET /api/user/travel-history
 * Get current user's travel history (trips and collaborations)
 */
router.get('/travel-history', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    const { 
      page = 1, 
      limit = 20, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build cache key for travel history
    const cacheKey = `user:travel-history:${user.profile._id}:${page}:${limit}:${status || 'all'}:${sortBy}:${sortOrder}`;
    
    // Check cache first
    let travelHistory = null;
    try {
      travelHistory = await redisUtils.get(cacheKey);
    } catch (cacheError) {
      console.warn('⚠️ Travel history cache check failed:', cacheError.message);
    }

    if (!travelHistory) {
      // For now, return trip references from user model until Trip model is implemented
      // This will be enhanced when TripService is available
      const userWithTrips = await User.findById(user.profile._id)
        .populate('trips', 'title destination dates status budget.total createdAt updatedAt')
        .populate('collaboratedTrips', 'title destination dates status budget.total createdAt updatedAt')
        .lean();

      if (!userWithTrips) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Combine owned trips and collaborated trips
      const allTrips = [
        ...(userWithTrips.trips || []).map(trip => ({ ...trip, role: 'owner' })),
        ...(userWithTrips.collaboratedTrips || []).map(trip => ({ ...trip, role: 'collaborator' }))
      ];

      // Filter by status if provided
      let filteredTrips = allTrips;
      if (status && ['planning', 'booked', 'completed', 'cancelled'].includes(status)) {
        filteredTrips = allTrips.filter(trip => trip.status === status);
      }

      // Sort trips
      const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
      filteredTrips.sort((a, b) => {
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          return (new Date(a[sortBy]) - new Date(b[sortBy])) * sortMultiplier;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title) * sortMultiplier;
        }
        return 0;
      });

      // Paginate results
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

      travelHistory = {
        trips: paginatedTrips,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredTrips.length / parseInt(limit)),
          totalTrips: filteredTrips.length,
          hasNextPage: endIndex < filteredTrips.length,
          hasPrevPage: parseInt(page) > 1
        },
        summary: {
          totalOwned: (userWithTrips.trips || []).length,
          totalCollaborated: (userWithTrips.collaboratedTrips || []).length,
          byStatus: {
            planning: allTrips.filter(t => t.status === 'planning').length,
            booked: allTrips.filter(t => t.status === 'booked').length,
            completed: allTrips.filter(t => t.status === 'completed').length,
            cancelled: allTrips.filter(t => t.status === 'cancelled').length
          }
        }
      };

      // Cache the result
      try {
        await redisUtils.set(cacheKey, travelHistory, 900); // 15 minutes TTL
      } catch (cacheError) {
        console.warn('⚠️ Travel history caching failed:', cacheError.message);
      }
    }

    res.json({
      success: true,
      data: travelHistory,
      fromCache: !!travelHistory,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get travel history error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve travel history',
      code: 'TRAVEL_HISTORY_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/user/travel-summary
 * Get current user's travel summary statistics
 */
router.get('/travel-summary', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);

    // Get user stats and enhanced travel summary
    const statsResult = await userService.getUserStats(user.profile._id.toString());

    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        error: statsResult.error,
        code: statsResult.code,
        timestamp: new Date().toISOString()
      });
    }

    // Get recent trips for summary
    const userWithRecentTrips = await User.findById(user.profile._id)
      .populate('trips', 'title destination dates status budget.total createdAt', null, { 
        sort: { createdAt: -1 }, 
        limit: 5 
      })
      .lean();

    const travelSummary = {
      statistics: {
        ...statsResult.stats,
        completionRate: statsResult.stats.tripsPlanned > 0 
          ? Math.round((statsResult.stats.tripsCompleted / statsResult.stats.tripsPlanned) * 100)
          : 0,
        averageBudgetPerTrip: statsResult.stats.tripsCompleted > 0 && statsResult.stats.totalBudgetSaved > 0
          ? Math.round(statsResult.stats.totalBudgetSaved / statsResult.stats.tripsCompleted)
          : 0
      },
      recentTrips: userWithRecentTrips?.trips || [],
      achievements: {
        firstTrip: statsResult.stats.tripsPlanned > 0,
        frequentTraveler: statsResult.stats.tripsCompleted >= 5,
        budgetMaster: statsResult.stats.totalBudgetSaved > 1000,
        collaborator: statsResult.stats.totalTripsCollaborated > 0,
        explorer: (statsResult.stats.favoriteDestinations || []).length >= 3
      },
      fromCache: statsResult.fromCache
    };

    res.json({
      success: true,
      data: travelSummary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get travel summary error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve travel summary',
      code: 'TRAVEL_SUMMARY_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== USER STATISTICS ENDPOINTS ====================

/**
 * GET /api/user/stats
 * Get current user's statistics and travel history
 */
router.get('/stats', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);

    // Get detailed stats from UserService
    const statsResult = await userService.getUserStats(user.profile._id.toString());

    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        error: statsResult.error,
        code: statsResult.code,
        timestamp: new Date().toISOString()
      });
    }

    // Add computed statistics
    const enhancedStats = {
      ...statsResult.stats,
      completionRate: statsResult.stats.tripsPlanned > 0 
        ? Math.round((statsResult.stats.tripsCompleted / statsResult.stats.tripsPlanned) * 100)
        : 0,
      averageBudgetPerTrip: statsResult.stats.tripsCompleted > 0 && statsResult.stats.totalBudgetSaved > 0
        ? Math.round(statsResult.stats.totalBudgetSaved / statsResult.stats.tripsCompleted)
        : 0,
      fromCache: statsResult.fromCache
    };

    res.json({
      success: true,
      data: enhancedStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics',
      code: 'STATS_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/user/stats/favorite-destination
 * Add a favorite destination to user's statistics
 */
router.post('/stats/favorite-destination', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    const { destination } = req.body;

    if (!destination || typeof destination !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Destination name is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    const result = await userService.addFavoriteDestination(
      user.profile._id.toString(),
      destination.trim()
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        favoriteDestinations: result.favoriteDestinations
      },
      message: 'Favorite destination added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Add favorite destination error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite destination',
      code: 'FAVORITE_ADD_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== USER SEARCH AND DISCOVERY ENDPOINTS ====================

/**
 * GET /api/user/search
 * Search for users (respecting privacy settings)
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    const result = await userService.searchUsers(query.trim(), {
      limit: Math.min(parseInt(limit), 50), // Cap at 50 results
      includePrivate: false // Respect privacy settings
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        code: result.code,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.users,
      query: query.trim(),
      fromCache: result.fromCache,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ User search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      code: 'USER_SEARCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/user/discover/:travelStyle
 * Discover users by travel style for collaboration
 */
router.get('/discover/:travelStyle', requireAuth, async (req, res) => {
  try {
    const { travelStyle } = req.params;
    const { limit = 20 } = req.query;

    const validTravelStyles = [
      'budget', 'luxury', 'adventure', 'cultural', 'relaxation', 
      'business', 'family', 'solo', 'group'
    ];

    if (!validTravelStyles.includes(travelStyle)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid travel style',
        code: 'VALIDATION_ERROR',
        validStyles: validTravelStyles,
        timestamp: new Date().toISOString()
      });
    }

    const result = await userService.getUsersByTravelStyle(travelStyle, {
      limit: Math.min(parseInt(limit), 50)
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        code: result.code,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.users,
      travelStyle,
      fromCache: result.fromCache,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ User discovery error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to discover users',
      code: 'USER_DISCOVERY_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== ACCOUNT MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/user/deactivate
 * Deactivate current user's account
 */
router.post('/deactivate', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);
    const { reason = 'user_request' } = req.body;

    const result = await userService.deactivateUser(
      user.profile._id.toString(),
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Account deactivated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Deactivate account error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account',
      code: 'DEACTIVATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/user/export
 * Export user data for GDPR compliance
 */
router.get('/export', requireAuth, requireProfile, async (req, res) => {
  try {
    const user = getUserContext(req);

    // Check if user allows data export
    if (!user.settings?.privacy?.allowDataExport) {
      return res.status(403).json({
        success: false,
        error: 'Data export is disabled in privacy settings',
        code: 'EXPORT_DISABLED',
        timestamp: new Date().toISOString()
      });
    }

    // Prepare comprehensive user data export
    const exportData = {
      profile: user.profile,
      preferences: user.preferences,
      settings: user.settings,
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.uid,
        dataVersion: '1.0'
      }
    };

    res.json({
      success: true,
      data: exportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Export data error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data',
      code: 'EXPORT_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;