/**
 * Enhanced Wayra Authentication Middleware
 * Handles Firebase authentication, user profile loading, session caching, and activity tracking
 */

const admin = require('firebase-admin');
const UserService = require('../services/UserService');
const redisUtils = require('../utils/redis');

// Initialize Firebase Admin (if not already initialized)
let firebaseInitialized = false;

if (!admin.apps.length) {
  try {
    // Check if we have all required Firebase credentials
    const hasFirebaseCredentials = 
      process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');

    if (hasFirebaseCredentials) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️  Firebase credentials not properly configured - running in development mode');
      console.warn('   To enable Firebase auth, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL');
    }
  } catch (error) {
    console.warn('⚠️  Firebase Admin initialization failed:', error.message);
  }
}

// Initialize UserService instance
const userService = new UserService();

/**
 * Enhanced authentication middleware for protected routes
 * Includes user profile loading, session caching, and activity tracking
 */
const authMiddleware = async (req, res, next) => {
  try {
    // For development, allow requests without authentication but load dev user profile
    if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
      console.log('🔓 Development mode: Loading development user profile');
      
      // Try to get or create development user
      const devUserResult = await userService.createOrUpdateUser(
        'dev-user-firebase-uid',
        'dev@wayra.com',
        {
          displayName: 'Development User',
          firstName: 'Dev',
          lastName: 'User'
        }
      );

      if (devUserResult.success) {
        req.user = {
          uid: 'dev-user-firebase-uid',
          email: 'dev@wayra.com',
          name: 'Development User',
          picture: null,
          profile: devUserResult.user,
          isAuthenticated: true,
          isDevelopmentUser: true,
          
          // User permissions and settings for development
          permissions: {
            canCreateTrips: devUserResult.user?.isActive || true,
            canCollaborate: devUserResult.user?.settings?.privacy?.allowInvitations || true,
            canUseAI: devUserResult.user?.settings?.ai?.personalizationEnabled || true
          },
          
          // User preferences for AI context
          preferences: devUserResult.user?.preferences || {},
          settings: devUserResult.user?.settings || {}
        };
        
        // Track activity for development user
        await userService.updateActivity(devUserResult.user._id.toString());
      } else {
        // Fallback to basic dev user if database operations fail
        req.user = {
          uid: 'dev-user-firebase-uid',
          email: 'dev@wayra.com',
          name: 'Development User',
          picture: null,
          profile: null,
          isAuthenticated: true,
          isDevelopmentUser: true
        };
      }
      
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authentication token',
        code: 'MISSING_TOKEN'
      });
    }

    // Check session cache first for performance
    const sessionKey = `auth:session:${token.substring(0, 20)}`;
    let cachedSession = null;
    
    try {
      cachedSession = await redisUtils.get(sessionKey);
    } catch (cacheError) {
      console.warn('⚠️ Session cache check failed:', cacheError.message);
    }

    let decodedToken;
    let userProfile = null;

    if (cachedSession && cachedSession.expiresAt > Date.now()) {
      // Use cached session data
      decodedToken = cachedSession.decodedToken;
      userProfile = cachedSession.userProfile;
      console.log(`📋 Using cached session for user: ${decodedToken.email}`);
    } else {
      // Verify the Firebase token
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (tokenError) {
        console.error('❌ Firebase token verification failed:', tokenError.message);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token',
          code: 'INVALID_TOKEN'
        });
      }

      // Load user profile from database
      const userResult = await userService.getUserByFirebaseUid(decodedToken.uid);
      
      if (!userResult.success) {
        // User not found in database, try to create from Firebase data
        console.log(`👤 User not found in database, creating profile for: ${decodedToken.email}`);
        
        const createResult = await userService.createOrUpdateUser(
          decodedToken.uid,
          decodedToken.email,
          {
            displayName: decodedToken.name || decodedToken.email.split('@')[0],
            photoURL: decodedToken.picture
          }
        );

        if (createResult.success) {
          userProfile = createResult.user;
        } else {
          console.error('❌ Failed to create user profile:', createResult.error);
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to load user profile',
            code: 'PROFILE_LOAD_ERROR'
          });
        }
      } else {
        userProfile = userResult.user;
        
        // Update last login time
        await userService.updateLastLogin(userProfile._id.toString());
      }

      // Cache the session for future requests
      try {
        const sessionData = {
          decodedToken,
          userProfile,
          expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
        };
        await redisUtils.set(sessionKey, sessionData, 1800); // 30 minutes TTL
      } catch (cacheError) {
        console.warn('⚠️ Session caching failed:', cacheError.message);
      }
    }

    // Add comprehensive user context to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || userProfile?.profile?.displayName,
      picture: decodedToken.picture || userProfile?.profile?.photoURL,
      profile: userProfile,
      isAuthenticated: true,
      isDevelopmentUser: false,
      
      // User permissions and settings
      permissions: {
        canCreateTrips: userProfile?.isActive || false,
        canCollaborate: userProfile?.settings?.privacy?.allowInvitations || false,
        canUseAI: userProfile?.settings?.ai?.personalizationEnabled || false
      },
      
      // User preferences for AI context
      preferences: userProfile?.preferences || {},
      settings: userProfile?.settings || {},
      
      // Firebase token claims
      tokenClaims: {
        iss: decodedToken.iss,
        aud: decodedToken.aud,
        exp: decodedToken.exp,
        iat: decodedToken.iat
      }
    };

    // Track user activity (non-blocking)
    if (userProfile) {
      setImmediate(async () => {
        try {
          await userService.updateActivity(userProfile._id.toString());
        } catch (activityError) {
          console.warn('⚠️ Activity tracking failed:', activityError.message);
        }
      });
    }

    next();
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication processing failed',
      code: 'AUTH_PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Enhanced optional authentication middleware (doesn't block if no token)
 * Includes user profile loading and session caching when token is provided
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No authentication provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Check session cache first for performance
    const sessionKey = `auth:session:${token.substring(0, 20)}`;
    let cachedSession = null;
    
    try {
      cachedSession = await redisUtils.get(sessionKey);
    } catch (cacheError) {
      console.warn('⚠️ Optional auth session cache check failed:', cacheError.message);
    }

    let decodedToken;
    let userProfile = null;

    if (cachedSession && cachedSession.expiresAt > Date.now()) {
      // Use cached session data
      decodedToken = cachedSession.decodedToken;
      userProfile = cachedSession.userProfile;
    } else {
      // Try to verify the Firebase token
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
        
        // Load user profile from database
        const userResult = await userService.getUserByFirebaseUid(decodedToken.uid);
        
        if (userResult.success) {
          userProfile = userResult.user;
          
          // Update activity for authenticated optional requests
          setImmediate(async () => {
            try {
              await userService.updateActivity(userProfile._id.toString());
            } catch (activityError) {
              console.warn('⚠️ Optional auth activity tracking failed:', activityError.message);
            }
          });
        }

        // Cache the session for future requests
        try {
          const sessionData = {
            decodedToken,
            userProfile,
            expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
          };
          await redisUtils.set(sessionKey, sessionData, 1800); // 30 minutes TTL
        } catch (cacheError) {
          console.warn('⚠️ Optional auth session caching failed:', cacheError.message);
        }
      } catch (tokenError) {
        // Authentication failed, but continue without user
        console.warn('⚠️ Optional authentication failed:', tokenError.message);
        req.user = null;
        return next();
      }
    }

    // Add user context to request if authentication succeeded
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || userProfile?.profile?.displayName,
      picture: decodedToken.picture || userProfile?.profile?.photoURL,
      profile: userProfile,
      isAuthenticated: true,
      isDevelopmentUser: false,
      
      // User permissions and settings
      permissions: {
        canCreateTrips: userProfile?.isActive || false,
        canCollaborate: userProfile?.settings?.privacy?.allowInvitations || false,
        canUseAI: userProfile?.settings?.ai?.personalizationEnabled || false
      },
      
      // User preferences for AI context
      preferences: userProfile?.preferences || {},
      settings: userProfile?.settings || {}
    };

    next();
  } catch (error) {
    // Authentication processing failed, but continue without user
    console.warn('⚠️ Optional authentication processing failed:', error.message);
    req.user = null;
    next();
  }
};

/**
 * Invalidate user session cache
 * @param {string} userId - User ID or Firebase UID
 * @returns {Promise<boolean>} Success status
 */
const invalidateUserSession = async (userId) => {
  try {
    // Invalidate user-specific caches
    await redisUtils.invalidateUserCache(userId);
    
    // Note: We can't easily invalidate token-based session cache without the token
    // This is handled by TTL expiration
    
    console.log(`✅ User session cache invalidated for: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Session invalidation failed:', error.message);
    return false;
  }
};

/**
 * Get user context from request (helper function for routes)
 * @param {Object} req - Express request object
 * @returns {Object|null} User context or null
 */
const getUserContext = (req) => {
  return req.user || null;
};

/**
 * Check if user is authenticated (helper function for routes)
 * @param {Object} req - Express request object
 * @returns {boolean} Authentication status
 */
const isAuthenticated = (req) => {
  return req.user && req.user.isAuthenticated === true;
};

/**
 * Check if user has specific permission (helper function for routes)
 * @param {Object} req - Express request object
 * @param {string} permission - Permission to check
 * @returns {boolean} Permission status
 */
const hasPermission = (req, permission) => {
  if (!req.user || !req.user.permissions) {
    return false;
  }
  return req.user.permissions[permission] === true;
};

/**
 * Get user preferences for AI context (helper function for AI services)
 * @param {Object} req - Express request object
 * @returns {Object} User preferences object
 */
const getUserPreferences = (req) => {
  if (!req.user || !req.user.preferences) {
    return {};
  }
  return req.user.preferences;
};

/**
 * Get user settings (helper function for routes)
 * @param {Object} req - Express request object
 * @returns {Object} User settings object
 */
const getUserSettings = (req) => {
  if (!req.user || !req.user.settings) {
    return {};
  }
  return req.user.settings;
};

/**
 * Middleware to require authentication (throws 401 if not authenticated)
 */
const requireAuth = (req, res, next) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to require specific permission
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(req, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

/**
 * Middleware to ensure user profile is loaded
 */
const requireProfile = (req, res, next) => {
  if (!req.user || !req.user.profile) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'User profile not available',
      code: 'PROFILE_NOT_LOADED'
    });
  }
  next();
};

/**
 * Rate limiting middleware using Redis
 * @param {Object} options - Rate limiting options
 */
const rateLimitMiddleware = (options = {}) => {
  const {
    limit = 100,
    window = 3600, // 1 hour
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const rateLimitResult = await redisUtils.checkRateLimit(key, limit, window);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limit,
        'X-RateLimit-Remaining': rateLimitResult.remaining || 0,
        'X-RateLimit-Reset': rateLimitResult.resetTime || Date.now() + (window * 1000)
      });

      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      console.warn('⚠️ Rate limiting failed:', error.message);
      // Continue without rate limiting if Redis fails
      next();
    }
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  invalidateUserSession,
  getUserContext,
  isAuthenticated,
  hasPermission,
  getUserPreferences,
  getUserSettings,
  requireAuth,
  requirePermission,
  requireProfile,
  rateLimitMiddleware
};
