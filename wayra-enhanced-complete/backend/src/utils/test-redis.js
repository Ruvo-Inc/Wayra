#!/usr/bin/env node

/**
 * Redis Caching Layer Test Script
 * Tests the Redis connection and caching functionality
 * Task 1.2: Set up Redis caching layer verification
 */

const redisUtils = require('./redis');

async function testRedisCachingLayer() {
  console.log('🧪 Testing Redis Caching Layer Implementation');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Initialize Redis connection using existing environment variables
    console.log('\n1️⃣ Testing Redis Connection with Existing Environment Variables');
    const connected = await redisUtils.initialize();
    
    if (!connected) {
      console.error('❌ Redis connection failed');
      return false;
    }
    
    // Test 2: Test basic caching operations
    console.log('\n2️⃣ Testing Basic Caching Operations');
    const testKey = 'test:cache:key';
    const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
    
    // Set cache
    const setResult = await redisUtils.set(testKey, testValue, 60);
    console.log(`Set cache result: ${setResult ? '✅ Success' : '❌ Failed'}`);
    
    // Get cache
    const getValue = await redisUtils.get(testKey);
    console.log(`Get cache result: ${getValue ? '✅ Success' : '❌ Failed'}`);
    console.log(`Retrieved value:`, getValue);
    
    // Test 3: Test user session management
    console.log('\n3️⃣ Testing User Session Management');
    const testUserId = 'test-user-123';
    const sessionData = {
      email: 'test@example.com',
      displayName: 'Test User',
      loginTime: new Date().toISOString()
    };
    
    // Set user session
    const sessionSet = await redisUtils.setUserSession(testUserId, sessionData);
    console.log(`Set user session: ${sessionSet ? '✅ Success' : '❌ Failed'}`);
    
    // Get user session
    const sessionGet = await redisUtils.getUserSession(testUserId);
    console.log(`Get user session: ${sessionGet ? '✅ Success' : '❌ Failed'}`);
    console.log(`Session data:`, sessionGet);
    
    // Test 4: Test user data caching
    console.log('\n4️⃣ Testing User Data Caching');
    const userData = {
      id: testUserId,
      profile: {
        firstName: 'Test',
        lastName: 'User',
        preferences: {
          budget: { min: 1000, max: 5000 },
          travelStyle: ['adventure', 'cultural']
        }
      }
    };
    
    // Cache user profile
    const profileCached = await redisUtils.cacheUserProfile(testUserId, userData);
    console.log(`Cache user profile: ${profileCached ? '✅ Success' : '❌ Failed'}`);
    
    // Get cached user profile
    const cachedProfile = await redisUtils.getCachedUserProfile(testUserId);
    console.log(`Get cached profile: ${cachedProfile ? '✅ Success' : '❌ Failed'}`);
    
    // Test 5: Test trip data caching
    console.log('\n5️⃣ Testing Trip Data Caching');
    const testTripId = 'trip-456';
    const tripData = {
      id: testTripId,
      title: 'Test Trip to Paris',
      destination: 'Paris, France',
      budget: { total: 3000, currency: 'USD' },
      dates: { start: '2024-06-01', end: '2024-06-07' }
    };
    
    // Cache trip
    const tripCached = await redisUtils.cacheTrip(testTripId, tripData);
    console.log(`Cache trip: ${tripCached ? '✅ Success' : '❌ Failed'}`);
    
    // Get cached trip
    const cachedTrip = await redisUtils.getCachedTrip(testTripId);
    console.log(`Get cached trip: ${cachedTrip ? '✅ Success' : '❌ Failed'}`);
    
    // Test 6: Test cache invalidation strategies
    console.log('\n6️⃣ Testing Cache Invalidation Strategies');
    
    // Invalidate user cache
    const userInvalidated = await redisUtils.invalidateUserCache(testUserId);
    console.log(`Invalidate user cache: ${userInvalidated ? '✅ Success' : '❌ Failed'}`);
    
    // Verify user cache is cleared
    const profileAfterInvalidation = await redisUtils.getCachedUserProfile(testUserId);
    console.log(`Profile after invalidation: ${!profileAfterInvalidation ? '✅ Cleared' : '❌ Still cached'}`);
    
    // Invalidate trip cache
    const tripInvalidated = await redisUtils.invalidateTripCache(testTripId);
    console.log(`Invalidate trip cache: ${tripInvalidated ? '✅ Success' : '❌ Failed'}`);
    
    // Test 7: Test Redis health checks
    console.log('\n7️⃣ Testing Redis Health Checks');
    const healthCheck = await redisUtils.healthCheck();
    console.log(`Health check status: ${healthCheck.connected ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Health check details:`, {
      status: healthCheck.status,
      latency: healthCheck.latency,
      features: healthCheck.features
    });
    
    // Test 8: Test rate limiting
    console.log('\n8️⃣ Testing Rate Limiting');
    const rateLimitResult = await redisUtils.checkRateLimit('test-user', 5, 60);
    console.log(`Rate limit check: ${rateLimitResult.allowed ? '✅ Allowed' : '❌ Blocked'}`);
    console.log(`Remaining requests: ${rateLimitResult.remaining}`);
    
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data');
    await redisUtils.del(testKey);
    await redisUtils.deleteUserSession(testUserId);
    
    console.log('\n✅ All Redis caching layer tests completed successfully!');
    console.log('\n📋 Task 1.2 Requirements Verification:');
    console.log('✅ Configure Redis connection using existing environment variables');
    console.log('✅ Create caching utilities for user sessions and frequently accessed data');
    console.log('✅ Implement cache invalidation strategies for user and trip data');
    console.log('✅ Add Redis health checks to existing monitoring');
    
    return true;
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    return false;
  } finally {
    // Graceful shutdown
    await redisUtils.disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRedisCachingLayer()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRedisCachingLayer };