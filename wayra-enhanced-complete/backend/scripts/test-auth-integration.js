#!/usr/bin/env node

/**
 * Integration test for enhanced authentication middleware
 * Tests with actual database and Redis connections
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { authMiddleware, optionalAuthMiddleware } = require('../src/middleware/auth');
const UserService = require('../src/services/UserService');
const redisUtils = require('../src/utils/redis');

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

async function testAuthIntegration() {
  console.log('🧪 Testing Enhanced Authentication Middleware Integration\n');

  let userService;

  try {
    // Initialize database connection
    console.log('📊 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');

    // Initialize Redis
    console.log('🔄 Initializing Redis...');
    await redisUtils.initialize();
    console.log('✅ Redis initialized');

    // Initialize UserService
    userService = new UserService();
    console.log('✅ UserService initialized\n');

    // Test 1: Development mode with database operations
    console.log('🔧 Test 1: Development mode with user profile creation');
    process.env.NODE_ENV = 'development';
    
    const req1 = createMockReq();
    const res1 = createMockRes();
    const next1 = createMockNext();
    
    await authMiddleware(req1, res1, next1);
    
    if (next1.wasCalled() && req1.user) {
      console.log('✅ Development mode test passed');
      console.log(`   User: ${req1.user.email}`);
      console.log(`   Profile loaded: ${req1.user.profile ? 'Yes' : 'No'}`);
      console.log(`   User ID: ${req1.user.profile?._id || 'N/A'}`);
      console.log(`   Is development user: ${req1.user.isDevelopmentUser}`);
      
      if (req1.user.profile) {
        console.log(`   Display name: ${req1.user.profile.profile?.displayName}`);
        console.log(`   Permissions: ${JSON.stringify(req1.user.permissions)}`);
      }
    } else {
      console.log('❌ Development mode test failed');
      console.log(`   Response status: ${res1.statusCode}`);
      console.log(`   Response body:`, res1.body);
    }
    console.log();

    // Test 2: User activity tracking
    console.log('📊 Test 2: User activity tracking');
    
    if (req1.user && req1.user.profile) {
      const userId = req1.user.profile._id.toString();
      
      // Get initial activity time
      const userBefore = await userService.getUserById(userId);
      const initialActivity = userBefore.user?.lastActivityAt;
      
      console.log(`   Initial activity time: ${initialActivity}`);
      
      // Wait a moment and trigger another request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const req2 = createMockReq();
      const res2 = createMockRes();
      const next2 = createMockNext();
      
      await authMiddleware(req2, res2, next2);
      
      // Check if activity was updated
      const userAfter = await userService.getUserById(userId);
      const updatedActivity = userAfter.user?.lastActivityAt;
      
      console.log(`   Updated activity time: ${updatedActivity}`);
      
      if (new Date(updatedActivity) > new Date(initialActivity)) {
        console.log('✅ Activity tracking test passed');
      } else {
        console.log('❌ Activity tracking test failed - time not updated');
      }
    } else {
      console.log('⚠️ Skipping activity tracking test - no user profile');
    }
    console.log();

    // Test 3: Session caching
    console.log('💾 Test 3: Session caching functionality');
    
    // Create a mock session
    const testSessionKey = 'auth:session:test123456789012345';
    const testSessionData = {
      decodedToken: {
        uid: 'test-cache-uid',
        email: 'cache-test@wayra.com',
        name: 'Cache Test User'
      },
      userProfile: {
        _id: 'cache-profile-123',
        profile: { displayName: 'Cache Test User' },
        preferences: { budgetRange: { min: 1000, max: 3000 } },
        settings: { language: 'en' }
      },
      expiresAt: Date.now() + 30000 // 30 seconds from now
    };

    // Test caching
    const cacheResult = await redisUtils.set(testSessionKey, testSessionData, 30);
    console.log(`   Cache set result: ${cacheResult ? '✅ Success' : '❌ Failed'}`);

    // Test retrieval
    const cachedData = await redisUtils.get(testSessionKey);
    console.log(`   Cache retrieval: ${cachedData ? '✅ Success' : '❌ Failed'}`);
    
    if (cachedData) {
      console.log(`   Cached user email: ${cachedData.decodedToken.email}`);
      console.log(`   Cache expires: ${new Date(cachedData.expiresAt).toISOString()}`);
      console.log(`   Profile display name: ${cachedData.userProfile.profile.displayName}`);
    }

    // Cleanup test cache
    await redisUtils.del(testSessionKey);
    console.log('   ✅ Test cache cleaned up');
    console.log();

    // Test 4: Optional authentication middleware
    console.log('🔓 Test 4: Optional authentication middleware');
    
    const req4 = createMockReq();
    const res4 = createMockRes();
    const next4 = createMockNext();
    
    await optionalAuthMiddleware(req4, res4, next4);
    
    if (next4.wasCalled() && req4.user === null) {
      console.log('✅ Optional auth without token test passed');
    } else {
      console.log('❌ Optional auth without token test failed');
      console.log(`   User:`, req4.user);
    }
    console.log();

    // Test 5: User permissions and context
    console.log('🛡️  Test 5: User permissions and context');
    
    if (req1.user && req1.user.profile) {
      console.log('✅ User context available:');
      console.log(`   UID: ${req1.user.uid}`);
      console.log(`   Email: ${req1.user.email}`);
      console.log(`   Authenticated: ${req1.user.isAuthenticated}`);
      console.log(`   Can create trips: ${req1.user.permissions?.canCreateTrips}`);
      console.log(`   Can collaborate: ${req1.user.permissions?.canCollaborate}`);
      console.log(`   Can use AI: ${req1.user.permissions?.canUseAI}`);
      
      if (req1.user.preferences) {
        console.log(`   Budget range: ${req1.user.preferences.budgetRange?.min}-${req1.user.preferences.budgetRange?.max} ${req1.user.preferences.budgetRange?.currency}`);
        console.log(`   Travel styles: ${req1.user.preferences.travelStyle?.join(', ')}`);
      }
      
      if (req1.user.settings) {
        console.log(`   Language: ${req1.user.settings.language}`);
        console.log(`   AI personalization: ${req1.user.settings.ai?.personalizationEnabled}`);
      }
    } else {
      console.log('⚠️ No user context available for permissions test');
    }
    console.log();

    // Test 6: Cache invalidation
    console.log('🗑️  Test 6: Cache invalidation');
    
    if (req1.user && req1.user.profile) {
      const userId = req1.user.profile._id.toString();
      
      // Cache some user data
      await redisUtils.cacheUserProfile(userId, req1.user.profile, 300);
      await redisUtils.cacheUserPreferences(userId, req1.user.preferences, 300);
      
      // Verify cache exists
      const cachedProfile = await redisUtils.getCachedUserProfile(userId);
      const cachedPrefs = await redisUtils.getCachedUserPreferences(userId);
      
      console.log(`   Profile cached: ${cachedProfile ? '✅ Yes' : '❌ No'}`);
      console.log(`   Preferences cached: ${cachedPrefs ? '✅ Yes' : '❌ No'}`);
      
      // Invalidate cache
      const invalidateResult = await redisUtils.invalidateUserCache(userId);
      console.log(`   Cache invalidation: ${invalidateResult ? '✅ Success' : '❌ Failed'}`);
      
      // Verify cache is cleared
      const clearedProfile = await redisUtils.getCachedUserProfile(userId);
      const clearedPrefs = await redisUtils.getCachedUserPreferences(userId);
      
      console.log(`   Profile after invalidation: ${clearedProfile ? '❌ Still cached' : '✅ Cleared'}`);
      console.log(`   Preferences after invalidation: ${clearedPrefs ? '❌ Still cached' : '✅ Cleared'}`);
    } else {
      console.log('⚠️ Skipping cache invalidation test - no user profile');
    }
    console.log();

    console.log('🎉 All authentication middleware integration tests completed!\n');

  } catch (error) {
    console.error('❌ Integration test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('🧹 Database disconnected');
      }
      
      await redisUtils.disconnect();
      console.log('🧹 Redis disconnected');
      
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAuthIntegration()
    .then(() => {
      console.log('✅ Integration test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Integration test script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAuthIntegration };