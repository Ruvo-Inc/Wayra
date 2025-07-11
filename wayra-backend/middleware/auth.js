const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;
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
    } else {
      // Use default credentials (for local development)
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'wayra-22'
      });
    }
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

/**
 * Middleware to verify Firebase authentication tokens
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid authorization header found'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      firebase: decodedToken
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
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
          const decodedToken = await admin.auth().verifyIdToken(token);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            firebase: decodedToken
          };
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
  optionalAuth
};
