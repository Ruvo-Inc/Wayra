const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;
let isFirebaseInitialized = false;

try {
  // Check if Firebase is already initialized
  firebaseApp = admin.apps.length ? admin.app() : null;
  
  if (!firebaseApp) {
    // Initialize with service account or default credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'wayra-22'
      });
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin initialized with service account');
    } else {
      // For development without service account, use a simplified approach
      console.log('⚠️  Firebase service account not configured - using development mode');
      console.log('⚠️  In production, please configure FIREBASE_SERVICE_ACCOUNT_KEY');
      
      // Try to initialize with default credentials (this might work in some environments)
      try {
        firebaseApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'wayra-22'
        });
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin initialized with default credentials');
      } catch (defaultError) {
        console.log('⚠️  Firebase Admin could not initialize with default credentials');
        console.log('⚠️  Authentication will use development mode');
        isFirebaseInitialized = false;
      }
    }
  } else {
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin already initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  isFirebaseInitialized = false;
}

/**
 * Middleware to verify Firebase authentication tokens
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth Debug - Headers received:', {
      authorization: authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'None',
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 Auth Debug - No valid authorization header');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid authorization header found'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      console.log('🔐 Auth Debug - No token provided');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    console.log('🔐 Auth Debug - Token length:', token.length);
    console.log('🔐 Auth Debug - Firebase Admin initialized:', isFirebaseInitialized);

    // If Firebase Admin is not properly initialized, use development mode
    if (!isFirebaseInitialized) {
      console.log('⚠️  Using development authentication mode');
      
      // In development mode, create a mock user from the token
      // This is NOT secure and should only be used for development
      req.user = {
        uid: 'dev-user-' + Date.now(),
        email: 'dev@wayra.com',
        name: 'Development User',
        picture: null,
        firebase: { 
          uid: 'dev-user-' + Date.now(),
          email: 'dev@wayra.com',
          iss: 'development',
          aud: 'wayra-22'
        }
      };
      
      console.log('🔐 Auth Debug - Development user created:', req.user.email);
      return next();
    }

    // Try to verify the Firebase token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      console.log('🔐 Auth Debug - Token verified successfully for user:', decodedToken.email);
      
      // Add user information to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        firebase: decodedToken
      };

      return next();
    } catch (verifyError) {
      console.log('🔐 Auth Debug - Token verification failed:', verifyError.code);
      
      // If we're in development and token verification fails, use development mode
      if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log('⚠️  Development mode: allowing request with mock user');
        req.user = {
          uid: 'dev-user-fallback',
          email: 'dev@wayra.com',
          name: 'Development User (Fallback)',
          picture: null,
          firebase: { 
            uid: 'dev-user-fallback',
            email: 'dev@wayra.com',
            iss: 'development',
            aud: 'wayra-22'
          }
        };
        return next();
      }
      
      // In production or with proper Firebase setup, return the error
      throw verifyError;
    }
  } catch (error) {
    console.error('🔐 Auth Debug - Authentication error:', {
      code: error.code,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    
    // If Firebase Admin is not initialized and we get an error, use development mode
    if (!isFirebaseInitialized) {
      console.log('⚠️  Firebase error in development mode, allowing request');
      req.user = {
        uid: 'dev-user-fallback',
        email: 'dev@wayra.com',
        name: 'Development User (Fallback)',
        picture: null,
        firebase: { 
          uid: 'dev-user-fallback',
          email: 'dev@wayra.com',
          iss: 'development',
          aud: 'wayra-22'
        }
      };
      return next();
    }
    
    let errorMessage = 'Authentication failed';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token expired';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid token';
    } else if (error.code === 'auth/project-not-found') {
      errorMessage = 'Firebase project not configured';
    }

    return res.status(401).json({ 
      error: 'Authentication failed',
      message: errorMessage,
      code: error.code
    });
  }
};

/**
 * Optional authentication middleware (allows both authenticated and unauthenticated requests)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          if (isFirebaseInitialized) {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = {
              uid: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name,
              picture: decodedToken.picture,
              firebase: decodedToken
            };
          } else {
            // Development mode
            req.user = {
              uid: 'dev-user-optional',
              email: 'dev@wayra.com',
              name: 'Development User (Optional)',
              picture: null,
              firebase: { 
                uid: 'dev-user-optional',
                email: 'dev@wayra.com',
                iss: 'development',
                aud: 'wayra-22'
              }
            };
          }
        } catch (error) {
          // Token invalid, but continue without user
          console.warn('Optional auth token invalid:', error.message);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

module.exports = {
  authenticateUser,
  verifyToken: authenticateUser, // Alias for consistency
  optionalAuth
};

