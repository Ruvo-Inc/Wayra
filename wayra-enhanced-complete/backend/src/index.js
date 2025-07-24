const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');

console.log('🔄 Starting Wayra Enhanced Complete Backend...');

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    console.log('ℹ️ Continuing without Firebase authentication...');
  }
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Wayra Enhanced Complete Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    const DatabaseUtils = require('./utils/database');
    const redisUtils = require('./utils/redis');
    
    const dbHealth = await DatabaseUtils.healthCheck();
    const redisHealth = await redisUtils.healthCheck();
    
    // Determine overall health status
    const overallStatus = (dbHealth.connected && redisHealth.connected) ? 'healthy' : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbHealth.status,
        connected: dbHealth.connected,
        features: dbHealth.features
      },
      redis: {
        status: redisHealth.status,
        connected: redisHealth.connected,
        latency: redisHealth.latency,
        memory: redisHealth.memory,
        version: redisHealth.version,
        features: redisHealth.features
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API health check endpoint (for frontend compatibility)
app.get('/api/health', async (req, res) => {
  try {
    const DatabaseUtils = require('./utils/database');
    const redisUtils = require('./utils/redis');
    
    // Get database and Redis health checks
    const dbHealth = await DatabaseUtils.healthCheck();
    const redisHealth = await redisUtils.healthCheck();
    
    // Determine overall health status
    const overallStatus = (dbHealth.connected && redisHealth.connected) ? 'healthy' : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbHealth.status,
          connected: dbHealth.connected,
          host: dbHealth.host,
          database: dbHealth.database,
          features: dbHealth.features
        },
        redis: {
          status: redisHealth.status,
          connected: redisHealth.connected,
          latency: redisHealth.latency,
          memory: redisHealth.memory,
          version: redisHealth.version,
          connectionState: redisHealth.connectionState,
          features: redisHealth.features
        },
        apis: {
          status: 'configured',
          openai: !!process.env.OPENAI_API_KEY,
          firebase: !!process.env.FIREBASE_PROJECT_ID
        }
      },
      connectionPool: dbHealth.connectionPool,
      retryInfo: {
        database: {
          currentRetries: dbHealth.connectionInfo?.retryCount || 0,
          maxRetries: dbHealth.connectionInfo?.maxRetries || 0
        },
        redis: {
          currentRetries: redisHealth.retryCount || 0,
          maxRetries: 5
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'error',
        redis: 'error',
        apis: 'unknown'
      }
    });
  }
});

// API Routes
try {
  // AI Routes
  const aiRoutes = require('./routes/ai/agents');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes loaded successfully');
} catch (error) {
  console.warn('⚠️  AI routes not available:', error.message);
}

try {
  // User Routes
  const userRoutes = require('./routes/user');
  app.use('/api/user', userRoutes);
  console.log('✅ User routes loaded successfully');
} catch (error) {
  console.warn('⚠️  User routes not available:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Handle join room for trip collaboration
  socket.on('join-trip', (tripId) => {
    socket.join(`trip-${tripId}`);
    console.log(`👥 Client ${socket.id} joined trip room: ${tripId}`);
    socket.to(`trip-${tripId}`).emit('user-joined', { socketId: socket.id });
  });
  
  // Handle leave room
  socket.on('leave-trip', (tripId) => {
    socket.leave(`trip-${tripId}`);
    console.log(`👋 Client ${socket.id} left trip room: ${tripId}`);
    socket.to(`trip-${tripId}`).emit('user-left', { socketId: socket.id });
  });
  
  // Handle real-time trip updates
  socket.on('trip-update', (data) => {
    const { tripId, update, userId } = data;
    console.log(`📝 Trip update for ${tripId} from user ${userId}`);
    socket.to(`trip-${tripId}`).emit('trip-updated', {
      update,
      userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle cursor/selection sharing
  socket.on('cursor-update', (data) => {
    const { tripId, userId, cursor } = data;
    socket.to(`trip-${tripId}`).emit('cursor-updated', {
      userId,
      cursor,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Initialize database and Redis connections
console.log('🔄 Initializing database and Redis connections...');

// Initialize database connection
try {
  const DatabaseUtils = require('./utils/database');
  
  // Initialize enhanced database connections with retry and health monitoring
  DatabaseUtils.initialize().then((success) => {
    if (success) {
      console.log('✅ Enhanced database connections initialized');
      console.log('📊 Connection pooling, health checks, and retry mechanisms active');
    } else {
      console.log('⚠️ Database connection failed - continuing with limited functionality');
    }
  }).catch(error => {
    console.error('❌ Database connection failed:', error.message);
    console.log('ℹ️ Continuing without database - some features may be limited');
  });
} catch (error) {
  console.error('❌ Database utilities failed:', error.message);
  console.log('ℹ️ Continuing without database - some features may be limited');
}

// Initialize Redis connection
try {
  const redisUtils = require('./utils/redis');
  
  // Initialize Redis with existing environment variables
  redisUtils.initialize().then((success) => {
    if (success) {
      console.log('✅ Redis caching layer initialized');
      console.log('📊 User sessions, data caching, and health monitoring active');
    } else {
      console.log('⚠️ Redis connection failed - continuing without caching');
    }
  }).catch(error => {
    console.error('❌ Redis connection failed:', error.message);
    console.log('ℹ️ Continuing without Redis - caching features disabled');
  });
} catch (error) {
  console.error('❌ Redis utilities failed:', error.message);
  console.log('ℹ️ Continuing without Redis - caching features disabled');
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Wayra Enhanced Complete Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
  console.log(`🔌 Socket.IO: Real-time collaboration enabled`);
  
  // Log configuration status
  console.log('\n📋 Configuration Status:');
  console.log(`   OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Firebase: ${process.env.FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   MongoDB: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Redis: ${process.env.REDIS_HOST ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Socket.IO: ✅ Configured`);
});

module.exports = { app, server, io };
