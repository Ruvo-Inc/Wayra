#!/usr/bin/env node

/**
 * Test script for enhanced authentication middleware
 * Tests user profile loading, session caching, and activity tracking
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { authMiddleware, optionalAuthMiddleware, getUserContext, isAuthenticated, hasPermission } = require('../src/middleware/auth');
const redisUtils = require('../src/utils/redis');
const { configLoader } = require('../src/config/configLoader');

// Mock Express request and response objects
const createMockReq = (headers = {}) => ({
  headers,
  user: null,
  ip: '127.0.0.1'
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null
  };
  
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  
  res.json = (data) => {
    res.body = data;
    return res;
  };
  
  res.set = (headers) => {
    Object.assign(res.headers, headers);
    return res;
  };
  
  return res;
};

const createMockNext = () => {
  let called = false;
  const next = (error) => {
    called = true;
    if (error) {
      console.error('Next called with error:', error);
    }
  };
  next.wasCalled = () => called;
  return next;
};

async function testAuthMiddleware() {
  console.log('🧪 Testing Enhanced Authentication Middleware\n');

  try {
    // Initialize database connection
    console.log('📊 Connecting to database...');
    const dbConfig = configLoader.getDatabaseConfig();
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    console.log('✅ Database connected\n');

    // Initialize Redis
    console.log('🔄 Initializing Redis...');
    await redisUtils.initialize();
    console.log('✅ Redis initialized\n');

    // Test 1: Development mode without token
    console.log('🔧 Test 1: Development mode without authentication token');
    process.env.NODE_ENV = 'development';
    
    const req1 = createMockReq();
    const res1 = createMockRes();
    const next1 = createMockNext();
    
    await authMiddleware(req1, res1, next1);
    
    if (next1.wasCalled() && req1.user) {
      console.log('✅ Development mode test passed');
      console.log(`   User: ${req1.user.email} (${req1.user.isDevelopmentUser ? 'Dev User' : 'Regular User'})`);
      console.log(`   Profile loaded: ${req1.user.profile ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Development mode test failed');
    }
    console.log();

    // Test 2: Missing authorization header
    console.log('🔒 Test 2: Missing authorization header');
    process.env.NODE_ENV = 'production';
    
    const req2 = createMockReq();
    const res2 = createMockRes();
    const next2 = createMockNext();
    
    await authMiddleware(req2, res2, next2);
    
    if (res2.statusCode === 401 && res2.body?.code === 'MISSING_AUTH_HEADER') {
      console.log('✅ Missing auth header test passed');
      console.log(`   Status: ${res2.statusCode}, Code: ${res2.body.code}`);
    } else {
      console.log('❌ Missing auth header test failed');
      console.log(`   Status: ${res2.statusCode}, Body:`, res2.body);
    }
    console.log();

    // Test 3: Invalid token format
    console.log('🔑 Test 3: Invalid token format');
    
    const req3 = createMockReq({ authorization: 'InvalidFormat token123' });
    const res3 = createMockRes();
    const next3 = createMockNext();
    
    await authMiddleware(req3, res3, next3);
    
    if (res3.statusCode === 401 && res3.body?.code === 'MISSING_AUTH_HEADER') {
      console.log('✅ Invalid token format test passed');
      console.log(`   Status: ${res3.statusCode}, Code: ${res3.body.code}`);
    } else {
      console.log('❌ Invalid token format test failed');
      console.log(`   Status: ${res3.statusCode}, Body:`, res3.body);
    }
    console.log();

    // Test 4: Optional authentication without token
    console.log('🔓 Test 4: Optional authentication without token');
    
    const req4 = createMockReq();
    const res4 = createMockRes();
    const next4 = createMockNext();
    
    await optionalAuthMiddleware(req4, res4, next4);
    
    if (next4.wasCalled() && req4.user === null) {
      console.log('✅ Optional auth without token test passed');
      console.log('   User: null (as expected)');
    } else {
      console.log('❌ Optional auth without token test failed');
      console.log(`   User:`, req4.user);
    }
    console.log();

    // Test 5: Helper functions
    console.log('🛠️  Test 5: Helper functions');
    
    // Create a mock authenticated request
    const mockAuthReq = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        isAuthenticated: true,
        permissions: {
          canCreateTrips: true,
          canCollaborate: false
        },
        preferences: {
          budgetRange: { min: 500, max: 2000 }
        },
        settings: {
          language: 'en'
        }
      }
    };

    const userContext = getUserContext(mockAuthReq);
    const authenticated = isAuthenticated(mockAuthReq);
    const canCreateTrips = hasPermission(mockAuthReq, 'canCreateTrips');
    const canCollaborate = hasPermission(mockAuthReq, 'canCollaborate');

    console.log('✅ Helper functions test results:');
    console.log(`   getUserContext: ${userContext ? 'Found' : 'Not found'}`);
    console.log(`   isAuthenticated: ${authenticated}`);
    console.log(`   hasPermission(canCreateTrips): ${canCreateTrips}`);
    console.log(`   hasPermission(canCollaborate): ${canCollaborate}`);
    console.log();

    // Test 6: Session caching (simulate)
    console.log('💾 Test 6: Session caching functionality');
    
    const testSessionKey = 'auth:session:test123';
    const testSessionData = {
      decodedToken: { uid: 'test-uid', email: 'test@example.com' },
      userProfile: { _id: 'profile123', profile: { displayName: 'Test User' } },
      expiresAt: Date.now() + 30000 // 30 seconds from now
    };

    // Test caching
    const cacheResult = await redisUtils.set(testSessionKey, testSessionData, 30);
    console.log(`   Cache set result: ${cacheResult ? 'Success' : 'Failed'}`);

    // Test retrieval
    const cachedData = await redisUtils.get(testSessionKey);
    console.log(`   Cache retrieval: ${cachedData ? 'Success' : 'Failed'}`);
    
    if (cachedData) {
      console.log(`   Cached user: ${cachedData.decodedToken.email}`);
      console.log(`   Expires at: ${new Date(cachedData.expiresAt).toISOString()}`);
    }

    // Cleanup test cache
    await redisUtils.del(testSessionKey);
    console.log('   Test cache cleaned up');
    console.log();

    console.log('🎉 All authentication middleware tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    try {
      await mongoose.disconnect();
      await redisUtils.disconnect();
      console.log('🧹 Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAuthMiddleware()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAuthMiddleware };