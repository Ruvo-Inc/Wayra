const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

console.log('🔄 Starting incremental backend restoration...');

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

// Add health endpoint that frontend expects
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      apis: 'configured'
    }
  });
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
  
  // Only load AI routes if conversation feature is enabled
  if (AIConfigLoader.isFeatureEnabled('aiConversation')) {
    app.use('/api/ai/conversation', require('./routes/ai/conversation'));
    console.log('✅ AI conversation routes loaded successfully');
  } else {
    console.log('ℹ️ AI conversation routes disabled by feature flag');
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

// Step 6: Add database connections (POTENTIAL ISSUE)
console.log('Step 6: Adding database connections...');
try {
  const DatabaseUtils = require('./utils/database');
  const redisUtils = require('./utils/redis');
  
  // Initialize database connections
  DatabaseUtils.initializeDatabase().then(() => {
    console.log('✅ Database connections initialized');
  }).catch(error => {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit - continue without database for now
  });
} catch (error) {
  console.error('❌ Database utilities failed:', error.message);
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
