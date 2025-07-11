const express = require('express');
const router = express.Router();
const DatabaseUtils = require('../utils/database');
const redisUtils = require('../utils/redis');

/**
 * User Management API Routes
 * Handles user profile, preferences, and statistics
 */

// Middleware to validate user authentication (placeholder for Firebase Auth)
const authenticateUser = async (req, res, next) => {
  try {
    // TODO: Implement Firebase Auth token verification
    // For now, we'll use a mock user ID from headers
    const userId = req.headers['x-user-id'];
    const firebaseUid = req.headers['x-firebase-uid'];
    
    if (!userId || !firebaseUid) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide x-user-id and x-firebase-uid headers'
      });
    }
    
    req.user = { id: userId, firebaseUid };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * POST /api/users/profile
 * Create or update user profile
 */
router.post('/profile', authenticateUser, async (req, res) => {
  try {
    const { email, displayName, photoURL } = req.body;
    
    if (!email || !displayName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'displayName']
      });
    }
    
    const userData = {
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      photoURL: photoURL || null
    };
    
    const result = await DatabaseUtils.createOrUpdateUser(req.user.firebaseUid, userData);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to create/update user',
        message: result.error
      });
    }
    
    // Cache user session
    await redisUtils.setUserSession(result.user._id, {
      firebaseUid: req.user.firebaseUid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    });
    
    res.json({
      success: true,
      user: result.user,
      message: 'User profile updated successfully'
    });
    
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    // Check cache first
    const cachedSession = await redisUtils.getUserSession(req.user.id);
    if (cachedSession) {
      return res.json({
        success: true,
        user: cachedSession,
        cached: true
      });
    }
    
    const result = await DatabaseUtils.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch user profile',
        message: result.error
      });
    }
    
    if (!result.user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Please create your profile first'
      });
    }
    
    // Cache user session
    await redisUtils.setUserSession(result.user._id, {
      firebaseUid: result.user.firebaseUid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      preferences: result.user.preferences
    });
    
    res.json({
      success: true,
      user: result.user
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
router.put('/preferences', authenticateUser, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        error: 'Missing preferences data'
      });
    }
    
    const result = await DatabaseUtils.updateUserPreferences(req.user.firebaseUid, preferences);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to update preferences',
        message: result.error
      });
    }
    
    // Invalidate user session cache
    await redisUtils.deleteUserSession(req.user.id);
    
    res.json({
      success: true,
      user: result.user,
      message: 'Preferences updated successfully'
    });
    
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Check cache first
    const cacheKey = `user:${req.user.id}:stats`;
    const cachedStats = await redisUtils.get(cacheKey);
    
    if (cachedStats) {
      return res.json({
        success: true,
        stats: cachedStats,
        cached: true
      });
    }
    
    const result = await DatabaseUtils.getUserStats(req.user.id);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch user statistics',
        message: result.error
      });
    }
    
    // Cache stats for 1 hour
    await redisUtils.set(cacheKey, result.stats, 3600);
    
    res.json({
      success: true,
      stats: result.stats
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/users/login
 * Update user login timestamp
 */
router.post('/login', authenticateUser, async (req, res) => {
  try {
    const result = await DatabaseUtils.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!result.success || !result.user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Please create your profile first'
      });
    }
    
    // Update last login
    result.user.lastLoginAt = new Date();
    await result.user.save();
    
    // Update session cache
    await redisUtils.setUserSession(result.user._id, {
      firebaseUid: result.user.firebaseUid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      lastLoginAt: result.user.lastLoginAt
    });
    
    res.json({
      success: true,
      message: 'Login recorded successfully',
      lastLoginAt: result.user.lastLoginAt
    });
    
  } catch (error) {
    console.error('Update login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
