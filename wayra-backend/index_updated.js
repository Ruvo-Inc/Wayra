const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import utilities and routes
const DatabaseUtils = require('./utils/database');
const redisUtils = require('./utils/redis');
const tripsRouter = require('./routes/trips');
const usersRouter = require('./routes/users');
const collaborationRouter = require('./routes/collaboration');
const travelRouter = require('./routes/travel');

// Import new AdventureLog routes
const adventuresRouter = require('./routes/adventures');
const collectionsRouter = require('./routes/collections');
const geographyRouter = require('./routes/geography');

const CollaborationHandler = require('./socket/collaboration');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://wayra-frontend-424430120938.us-central1.run.app']
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 8080;

// Initialize collaboration handler
let collaborationHandler;

// Track MongoDB connection state
let mongoConnected = false;

// Initialize Database Connections
async function initializeDatabase() {
  // MongoDB Connection with robust settings for Cloud Run
  if (process.env.MONGODB_URI) {
    const mongoOptions = {
      serverSelectionTimeoutMS: 30000, // Increased timeout for Cloud Run
      socketTimeoutMS: 45000,
      bufferCommands: true, // Enable buffering to prevent premature queries
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000, // Increased for Cloud Run
      retryWrites: true,
      w: 'majority'
    };
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('📍 MongoDB URI (masked):', process.env.MONGODB_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    
    try {
      // Properly await the MongoDB connection
      await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
      console.log('✅ Connected to MongoDB Atlas successfully!');
      console.log('📊 Connection state:', mongoose.connection.readyState);
      mongoConnected = true;
      
      // Initialize database utilities after connection
      await DatabaseUtils.initialize();
      console.log('✅ Database utilities initialized');
      
      // Create geographic indexes for AdventureLog features
      await createGeographicIndexes();
      console.log('✅ Geographic indexes created');
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.error('🔍 Error details:', error.name, error.code);
      mongoConnected = false;
      // Continue running without MongoDB for now
    }
  } else {
    console.warn('⚠️  MONGODB_URI not found in environment variables');
    mongoConnected = false;
  }
    
  // Redis Connection
  try {
    if (process.env.REDIS_URL) {
      await redisUtils.initialize(process.env.REDIS_URL);
    } else {
      console.warn('⚠️  REDIS_URL not found in environment variables');
    }
    
    // Initialize Socket.io collaboration handler
    collaborationHandler = new CollaborationHandler(io);
    console.log('✅ Socket.io collaboration handler initialized');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
}

// Create geographic indexes for efficient queries
async function createGeographicIndexes() {
  try {
    const db = mongoose.connection.db;
    
    // Create indexes for adventures
    await db.collection('adventures').createIndex({ "coordinates": "2dsphere" });
    await db.collection('adventures').createIndex({ "userId": 1, "createdAt": -1 });
    await db.collection('adventures').createIndex({ "isPublic": 1, "createdAt": -1 });
    await db.collection('adventures').createIndex({ "tripId": 1, "createdAt": -1 });
    
    // Create indexes for geographic data
    await db.collection('countries').createIndex({ "coordinates": "2dsphere" });
    await db.collection('countries').createIndex({ "countryCode": 1 });
    await db.collection('regions').createIndex({ "coordinates": "2dsphere" });
    await db.collection('regions').createIndex({ "country": 1 });
    await db.collection('cities').createIndex({ "coordinates": "2dsphere" });
    await db.collection('cities').createIndex({ "region": 1 });
    
    // Create indexes for visited data
    await db.collection('visitedcountries').createIndex({ "userId": 1, "country": 1 }, { unique: true });
    await db.collection('visitedregions').createIndex({ "userId": 1, "region": 1 }, { unique: true });
    await db.collection('visitedcities').createIndex({ "userId": 1, "city": 1 }, { unique: true });
    
    // Create indexes for collections
    await db.collection('collections').createIndex({ "userId": 1, "createdAt": -1 });
    await db.collection('collections').createIndex({ "isPublic": 1, "createdAt": -1 });
    await db.collection('collections').createIndex({ "sharedWith": 1 });
    
    console.log('✅ All geographic indexes created successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Could not create some indexes:', error.message);
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Firebase Auth Middleware (placeholder - integrate with your existing auth)
const authenticateUser = async (req, res, next) => {
  try {
    // This should integrate with your existing Firebase auth middleware
    // For now, we'll use a placeholder that extracts user from headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract token and verify with Firebase (implement your existing logic)
    const token = authHeader.substring(7);
    
    // Placeholder: In real implementation, verify token with Firebase
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // For now, mock user (replace with actual Firebase verification)
    req.user = {
      _id: '507f1f77bcf86cd799439011', // Mock ObjectId
      firebaseUid: 'mock-firebase-uid',
      email: 'user@example.com',
      username: 'testuser'
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Apply auth middleware to protected routes
app.use('/api/adventures', authenticateUser);
app.use('/api/collections', authenticateUser);
app.use('/api/geography', authenticateUser);

// API Routes
app.use('/api/trips', tripsRouter);
app.use('/api/users', usersRouter);
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/travel', travelRouter);

// New AdventureLog routes
app.use('/api/adventures', adventuresRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/geography', geographyRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Wayra API with AdventureLog Integration',
    version: '2.0.0',
    status: 'running',
    features: {
      database: 'MongoDB Atlas + Redis Cloud',
      realtime: 'Socket.io collaboration',
      authentication: 'Firebase Auth integration',
      adventures: 'Adventure tracking and management',
      geography: 'World travel tracking',
      collections: 'Trip planning and itineraries',
      maps: 'Geographic visualization'
    },
    endpoints: {
      health: '/health',
      trips: '/api/trips',
      users: '/api/users',
      collaboration: '/api/collaboration',
      travel: '/api/travel',
      adventures: '/api/adventures',
      collections: '/api/collections',
      geography: '/api/geography',
      websocket: '/socket.io/',
      docs: 'https://github.com/Ruvo-Inc/Wayra'
    }
  });
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB health only if connected
    let mongoHealth;
    if (mongoConnected && mongoose.connection.readyState === 1) {
      mongoHealth = await DatabaseUtils.healthCheck();
      
      // Add AdventureLog collection counts
      const db = mongoose.connection.db;
      const adventureCount = await db.collection('adventures').countDocuments();
      const collectionCount = await db.collection('collections').countDocuments();
      const countryCount = await db.collection('countries').countDocuments();
      
      mongoHealth.collections = {
        ...mongoHealth.collections,
        adventures: adventureCount,
        collections: collectionCount,
        countries: countryCount
      };
    } else {
      mongoHealth = {
        status: mongoConnected ? 'connecting' : 'disconnected',
        connected: false,
        collections: { users: 0, trips: 0, adventures: 0, collections: 0, countries: 0 }
      };
    }
    
    const redisHealth = await redisUtils.healthCheck();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        mongodb: mongoHealth,
        redis: redisHealth,
        socketio: {
          status: 'running',
          connected_clients: io.engine.clientsCount || 0
        }
      },
      features: {
        adventures: mongoConnected,
        geography: mongoConnected,
        collections: mongoConnected,
        collaboration: true
      }
    };
    
    const httpStatus = mongoHealth.connected ? 200 : 503;
    res.status(httpStatus).json(healthStatus);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        mongodb: { status: 'error', connected: false },
        redis: { status: 'error', connected: false }
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: err.message
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'A record with this information already exists'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/trips',
      '/api/users', 
      '/api/collaboration',
      '/api/travel',
      '/api/adventures',
      '/api/collections',
      '/api/geography'
    ]
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      if (mongoConnected) {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
      }
      
      await redisUtils.close();
      console.log('🔌 Redis connection closed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Wayra API Server with AdventureLog Integration...');
    
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.warn('⚠️  Database initialization failed, but server will continue');
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Wayra API Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 MongoDB: ${mongoConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`🔄 Redis: ${redisUtils.isConnected() ? 'Connected' : 'Disconnected'}`);
      console.log(`🎯 Features: Adventures, Geography, Collections, Collaboration`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server, io };

