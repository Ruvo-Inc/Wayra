const admin = require('firebase-admin');

/**
 * Authentication middleware for Wayra backend
 * Verifies Firebase ID tokens and extracts user information
 */

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization token format'
      });
    }

    // Development bypass for local testing
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log('⚠️  Using development auth bypass');
      req.user = {
        uid: 'dev-user-123',
        email: 'dev@wayra.com',
        name: 'Development User',
        picture: null,
        emailVerified: true
      };
      return next();
    }

    // Debug token verification
    console.log('🔐 Attempting to verify Firebase ID token...');
    console.log('🔐 Token length:', idToken.length);
    console.log('🔐 Token starts with:', idToken.substring(0, 20) + '...');
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Token verification successful for user:', decodedToken.uid);
    
    // Add user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token revoked',
        code: 'TOKEN_REVOKED'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      req.user = null;
      return next();
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // For optional auth, continue without user info on error
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user owns a resource or has permission
 */
const checkOwnership = (resourceField = 'owner') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // This will be used in route handlers to check ownership
    // The actual ownership check happens in the route handler
    // This middleware just ensures user is authenticated
    next();
  };
};

/**
 * Middleware to check if user has specific role or permission
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // For now, all authenticated users have access
    // This can be extended later with role-based access control
    next();
  };
};

module.exports = {
  verifyToken,
  optionalAuth,
  checkOwnership,
  requireRole
};

