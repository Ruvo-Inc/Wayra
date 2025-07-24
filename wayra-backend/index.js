const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');

console.log('🔄 Starting incremental backend restoration...');

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
const server = createServer(app);

// Step 1: Basic middleware (WORKING in minimal server)
console.log('Step 1: Adding basic middleware...');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Step 2: Basic routes (WORKING in minimal server)
console.log('Step 2: Adding basic routes...');
app.get('/', (req, res) => {
  res.json({ 
    message: 'Wayra API - Incremental Restoration', 
    status: 'working',
    step: 'basic_routes_loaded'
  });
});

// Add enhanced health endpoint that frontend expects
app.get('/api/health', async (req, res) => {
  try {
    const DatabaseUtils = require('./utils/database');
    const redisUtils = require('./utils/redis');
    
    // Get database health check
    const dbHealth = await DatabaseUtils.healthCheck();
    
    // Get Redis health check (if available)
    let redisHealth = { status: 'not_configured' };
    try {
      if (redisUtils && typeof redisUtils.healthCheck === 'function') {
        redisHealth = await redisUtils.healthCheck();
      }
    } catch (error) {
      redisHealth = { status: 'error', error: error.message };
    }
    
    // Determine overall health status
    const overallStatus = dbHealth.connected ? 'healthy' : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.status,
          connected: dbHealth.connected,
          host: dbHealth.host,
          database: dbHealth.database,
          features: dbHealth.features
        },
        redis: redisHealth,
        apis: {
          status: 'configured',
          openai: !!process.env.OPENAI_API_KEY,
          firebase: !!process.env.FIREBASE_PROJECT_ID
        }
      },
      connectionPool: dbHealth.connectionPool,
      retryInfo: {
        currentRetries: dbHealth.connectionInfo?.retryCount || 0,
        maxRetries: dbHealth.connectionInfo?.maxRetries || 0
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'error',
        redis: 'unknown',
        apis: 'unknown'
      }
    });
  }
});

// Step 3: Load original routes (WORKING in minimal server)
console.log('Step 3: Loading original routes...');
try {
  app.use('/api/trips', require('./routes/trips'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/collaboration', require('./routes/collaboration'));
  app.use('/api/travel', require('./routes/travel'));
  console.log('✅ Original routes loaded successfully');
} catch (error) {
  console.error('❌ Original routes failed:', error.message);
  process.exit(1);
}

// Step 4: Load AdventureLog routes (WORKING in minimal server)
console.log('Step 4: Loading AdventureLog routes...');
try {
  app.use('/api/adventures', require('./routes/adventures'));
  app.use('/api/collections', require('./routes/collections'));
  app.use('/api/geography', require('./routes/geography'));
  console.log('✅ AdventureLog routes loaded successfully');
} catch (error) {
  console.error('❌ AdventureLog routes failed:', error.message);
  process.exit(1);
}

// Step 4.5: Load AI routes (NEW - AI Integration)
console.log('Step 4.5: Loading AI routes...');
try {
  const AIConfigLoader = require('./utils/ai/configLoader');
  
  // Load AI conversation routes if enabled
  if (AIConfigLoader.isFeatureEnabled('aiConversation')) {
    app.use('/api/ai/conversation', require('./routes/ai/conversation'));
    console.log('✅ AI conversation routes loaded successfully');
  } else {
    console.log('ℹ️ AI conversation routes disabled by feature flag');
  }
  
  // Load multi-agent routes if enabled
  if (AIConfigLoader.isFeatureEnabled('multiAgents')) {
    app.use('/api/ai/agents', require('./routes/ai/agents'));
    console.log('✅ AI multi-agent routes loaded successfully');
  } else {
    console.log('ℹ️ AI multi-agent routes disabled by feature flag');
  }
} catch (error) {
  console.error('❌ AI routes failed:', error.message);
  console.log('ℹ️ Continuing without AI features...');
  // Don't exit - AI features are optional
}

// Step 5: Add Socket.io (POTENTIAL ISSUE)
console.log('Step 5: Adding Socket.io...');
try {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://wayra-frontend-424430120938.us-central1.run.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  console.log('✅ Socket.io initialized successfully');
} catch (error) {
  console.error('❌ Socket.io failed:', error.message);
  process.exit(1);
}

// Step 6: Add database connections (ENHANCED)
console.log('Step 6: Adding database connections...');
try {
  const DatabaseUtils = require('./utils/database');
  const redisUtils = require('./utils/redis');
  
  // Initialize enhanced database connections with retry and health monitoring
  DatabaseUtils.initialize().then(() => {
    console.log('✅ Enhanced database connections initialized');
    console.log('📊 Connection pooling, health checks, and retry mechanisms active');
  }).catch(error => {
    console.error('❌ Database connection failed:', error.message);
    console.log('ℹ️ Continuing without database - some features may be limited');
    // Don't exit - continue without database for now
  });
} catch (error) {
  console.error('❌ Database utilities failed:', error.message);
  console.log('ℹ️ Continuing without database - some features may be limited');
  // Don't exit - continue without database for now
}

// Step 7: Start server
console.log('Step 7: Starting server...');
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Incremental backend running on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}`);
  console.log('✅ Server startup completed successfully!');
  console.log('🎯 If you see this message, the incremental restoration worked!');
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
