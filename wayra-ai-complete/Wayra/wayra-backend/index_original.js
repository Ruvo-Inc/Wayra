const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import utilities and routes
const DatabaseUtils = require('./utils/database');
const redisUtils = require('./utils/redis');
const tripsRouter = require('./routes/trips');
const usersRouter = require('./routes/users');
const collaborationRouter = require('./routes/collaboration');
const travelRouter = require('./routes/travel');
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

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/trips', tripsRouter);
app.use('/api/users', usersRouter);
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/travel', travelRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Wayra API',
    version: '1.0.0',
    status: 'running',
    features: {
      database: 'MongoDB Atlas + Redis Cloud',
      realtime: 'Socket.io collaboration',
      authentication: 'Firebase Auth integration'
    },
    endpoints: {
      health: '/health',
      trips: '/api/trips',
      users: '/api/users',
      collaboration: '/api/collaboration',
      travel: '/api/travel',
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
    } else {
      mongoHealth = {
        status: mongoConnected ? 'connecting' : 'disconnected',
        connected: false,
        collections: { users: 0, trips: 0 }
      };
    }
    
    const redisHealth = await redisUtils.healthCheck();
    
    const overallStatus = mongoHealth.connected && redisHealth.connected ? 'healthy' : 'degraded';
    
    res.status(200).json({ 
      status: overallStatus,
      message: 'Wayra backend health check',
      services: {
        mongodb: {
          status: mongoHealth.status,
          connected: mongoHealth.connected,
          collections: mongoHealth.collections,
          name: 'MongoDB Atlas'
        },
        redis: {
          status: redisHealth.status,
          connected: redisHealth.connected,
          latency: redisHealth.latency,
          memory: redisHealth.memory,
          name: 'Redis Cloud'
        },
        socketio: {
          status: 'active',
          connected: io.engine.clientsCount,
          name: 'Socket.io Real-time'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({ 
    service: 'Wayra API',
    version: '1.0.0',
    status: 'active'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server with database initialization
async function startServer() {
  const dbInitialized = await initializeDatabase();
  
  if (!dbInitialized) {
    console.error('❌ Failed to initialize database connections');
    process.exit(1);
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Wayra backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Trips API: http://localhost:${PORT}/api/trips`);
    console.log(`👤 Users API: http://localhost:${PORT}/api/users`);
    console.log(`⚡ Socket.io: http://localhost:${PORT}/socket.io/`);
    console.log(`📚 Documentation: https://github.com/Ruvo-Inc/Wayra`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  io.close();
  await mongoose.connection.close();
  await redisUtils.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  io.close();
  await mongoose.connection.close();
  await redisUtils.disconnect();
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
