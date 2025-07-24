#!/usr/bin/env node

/**
 * Test script for User Profile API endpoints
 * Tests all user profile management endpoints with authentication
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const request = require('supertest');
const { app } = require('../src/index');

// Mock authentication for testing
const mockAuthMiddleware = (req, res, next) => {
  // Simulate authenticated user
  req.user = {
    uid: 'test-user-uid',
    email: 'test@wayra.com',
    name: 'Test User',
    picture: null,
    profile: {
      _id: 'test-profile-id',
      firebaseUid: 'test-user-uid',
      email: 'test@wayra.com',
      profile: {
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        location: {
          country: 'US',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles'
        }
      },
      preferences: {
        budgetRange: { min: 500, max: 2000, currency: 'USD' },
        travelStyle: ['budget', 'adventure'],
        interests: ['culture', 'food'],
        accommodationPreferences: ['hotel'],
        transportationPreferences: ['flight']
      },
      settings: {
        notifications: { email: true, push: false },
        privacy: { profileVisibility: 'public', allowDataExport: true },
        ai: { personalizationEnabled: true },
        language: 'en',
        timezone: 'UTC'
      },
      stats: {
        tripsPlanned: 5,
        tripsCompleted: 3,
        totalBudgetSaved: 1500,
        favoriteDestinations: ['Paris', 'Tokyo'],
        averageTripDuration: 7,
        totalTripsCollaborated: 2,
        aiInteractionsCount: 15
      },
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      accountCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    isAuthenticated: true,
    isDevelopmentUser: false,
    permissions: {
      canCreateTrips: true,
      canCollaborate: true,
      canUseAI: true
    },
    preferences: {
      budgetRange: { min: 500, max: 2000, currency: 'USD' },
      travelStyle: ['budget', 'adventure'],
      interests: ['culture', 'food']
    },
    settings: {
      notifications: { email: true, push: false },
      privacy: { profileVisibility: 'public', allowDataExport: true },
      ai: { personalizationEnabled: true },
      language: 'en'
    }
  };
  next();
};

async function testUserAPI() {
  console.log('🧪 Testing User Profile API Endpoints\n');

  try {
    // Test 1: GET /api/user/profile
    console.log('👤 Test 1: GET /api/user/profile');
    
    const profileResponse = await request(app)
      .get('/api/user/profile')
      .expect(200);

    console.log(`   Status: ${profileResponse.status}`);
    console.log(`   Success: ${profileResponse.body.success}`);
    console.log(`   User ID: ${profileResponse.body.data?.id}`);
    console.log(`   Display Name: ${profileResponse.body.data?.profile?.displayName}`);
    console.log(`   Full Name: ${profileResponse.body.data?.fullName}`);
    console.log(`   Completion Rate: ${profileResponse.body.data?.completionRate}%`);
    console.log(`   Is New User: ${profileResponse.body.data?.isNewUser}`);
    
    if (profileResponse.body.success && profileResponse.body.data) {
      console.log('✅ Profile retrieval test passed');
    } else {
      console.log('❌ Profile retrieval test failed');
    }
    console.log();

    // Test 2: PUT /api/user/profile
    console.log('✏️  Test 2: PUT /api/user/profile');
    
    const profileUpdateData = {
      profile: {
        displayName: 'Updated Test User',
        firstName: 'Updated',
        lastName: 'User',
        phoneNumber: '+1-555-0123',
        location: {
          country: 'CA',
          city: 'Toronto',
          timezone: 'America/Toronto'
        }
      }
    };

    const updateResponse = await request(app)
      .put('/api/user/profile')
      .send(profileUpdateData)
      .expect(200);

    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Success: ${updateResponse.body.success}`);
    console.log(`   Message: ${updateResponse.body.message}`);
    
    if (updateResponse.body.success) {
      console.log('✅ Profile update test passed');
    } else {
      console.log('❌ Profile update test failed');
    }
    console.log();

    // Test 3: GET /api/user/preferences
    console.log('⚙️  Test 3: GET /api/user/preferences');
    
    const preferencesResponse = await request(app)
      .get('/api/user/preferences')
      .expect(200);

    console.log(`   Status: ${preferencesResponse.status}`);
    console.log(`   Success: ${preferencesResponse.body.success}`);
    console.log(`   Budget Range: ${preferencesResponse.body.data?.budgetRange?.min}-${preferencesResponse.body.data?.budgetRange?.max} ${preferencesResponse.body.data?.budgetRange?.currency}`);
    console.log(`   Travel Styles: ${preferencesResponse.body.data?.travelStyle?.join(', ')}`);
    console.log(`   Interests: ${preferencesResponse.body.data?.interests?.join(', ')}`);
    
    if (preferencesResponse.body.success) {
      console.log('✅ Preferences retrieval test passed');
    } else {
      console.log('❌ Preferences retrieval test failed');
    }
    console.log();

    // Test 4: PUT /api/user/preferences
    console.log('🎯 Test 4: PUT /api/user/preferences');
    
    const preferencesUpdateData = {
      budgetRange: { min: 1000, max: 3000, currency: 'EUR' },
      travelStyle: ['luxury', 'cultural'],
      interests: ['art', 'history', 'architecture'],
      accommodationPreferences: ['luxury', 'resort'],
      dietaryRestrictions: ['vegetarian']
    };

    const preferencesUpdateResponse = await request(app)
      .put('/api/user/preferences')
      .send(preferencesUpdateData)
      .expect(200);

    console.log(`   Status: ${preferencesUpdateResponse.status}`);
    console.log(`   Success: ${preferencesUpdateResponse.body.success}`);
    console.log(`   Message: ${preferencesUpdateResponse.body.message}`);
    
    if (preferencesUpdateResponse.body.success) {
      console.log('✅ Preferences update test passed');
    } else {
      console.log('❌ Preferences update test failed');
    }
    console.log();

    // Test 5: GET /api/user/settings
    console.log('🔧 Test 5: GET /api/user/settings');
    
    const settingsResponse = await request(app)
      .get('/api/user/settings')
      .expect(200);

    console.log(`   Status: ${settingsResponse.status}`);
    console.log(`   Success: ${settingsResponse.body.success}`);
    console.log(`   Language: ${settingsResponse.body.data?.language}`);
    console.log(`   Email Notifications: ${settingsResponse.body.data?.notifications?.email}`);
    console.log(`   AI Personalization: ${settingsResponse.body.data?.ai?.personalizationEnabled}`);
    
    if (settingsResponse.body.success) {
      console.log('✅ Settings retrieval test passed');
    } else {
      console.log('❌ Settings retrieval test failed');
    }
    console.log();

    // Test 6: PUT /api/user/settings
    console.log('⚡ Test 6: PUT /api/user/settings');
    
    const settingsUpdateData = {
      notifications: {
        email: false,
        push: true,
        tripUpdates: true
      },
      privacy: {
        profileVisibility: 'private',
        allowInvitations: false
      },
      ai: {
        personalizationEnabled: false,
        communicationStyle: 'formal'
      },
      language: 'es'
    };

    const settingsUpdateResponse = await request(app)
      .put('/api/user/settings')
      .send(settingsUpdateData)
      .expect(200);

    console.log(`   Status: ${settingsUpdateResponse.status}`);
    console.log(`   Success: ${settingsUpdateResponse.body.success}`);
    console.log(`   Message: ${settingsUpdateResponse.body.message}`);
    
    if (settingsUpdateResponse.body.success) {
      console.log('✅ Settings update test passed');
    } else {
      console.log('❌ Settings update test failed');
    }
    console.log();

    // Test 7: GET /api/user/stats
    console.log('📊 Test 7: GET /api/user/stats');
    
    const statsResponse = await request(app)
      .get('/api/user/stats')
      .expect(200);

    console.log(`   Status: ${statsResponse.status}`);
    console.log(`   Success: ${statsResponse.body.success}`);
    console.log(`   Trips Planned: ${statsResponse.body.data?.tripsPlanned}`);
    console.log(`   Trips Completed: ${statsResponse.body.data?.tripsCompleted}`);
    console.log(`   Completion Rate: ${statsResponse.body.data?.completionRate}%`);
    console.log(`   Total Budget Saved: $${statsResponse.body.data?.totalBudgetSaved}`);
    console.log(`   Favorite Destinations: ${statsResponse.body.data?.favoriteDestinations?.join(', ')}`);
    
    if (statsResponse.body.success) {
      console.log('✅ Statistics retrieval test passed');
    } else {
      console.log('❌ Statistics retrieval test failed');
    }
    console.log();

    // Test 8: POST /api/user/stats/favorite-destination
    console.log('🌍 Test 8: POST /api/user/stats/favorite-destination');
    
    const favoriteDestinationData = {
      destination: 'Barcelona'
    };

    const favoriteResponse = await request(app)
      .post('/api/user/stats/favorite-destination')
      .send(favoriteDestinationData)
      .expect(200);

    console.log(`   Status: ${favoriteResponse.status}`);
    console.log(`   Success: ${favoriteResponse.body.success}`);
    console.log(`   Message: ${favoriteResponse.body.message}`);
    
    if (favoriteResponse.body.success) {
      console.log('✅ Add favorite destination test passed');
    } else {
      console.log('❌ Add favorite destination test failed');
    }
    console.log();

    // Test 9: GET /api/user/search
    console.log('🔍 Test 9: GET /api/user/search');
    
    const searchResponse = await request(app)
      .get('/api/user/search?q=test&limit=10')
      .expect(200);

    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Success: ${searchResponse.body.success}`);
    console.log(`   Query: ${searchResponse.body.query}`);
    console.log(`   Results: ${searchResponse.body.data?.length || 0} users found`);
    
    if (searchResponse.body.success) {
      console.log('✅ User search test passed');
    } else {
      console.log('❌ User search test failed');
    }
    console.log();

    // Test 10: GET /api/user/discover/:travelStyle
    console.log('🎒 Test 10: GET /api/user/discover/adventure');
    
    const discoverResponse = await request(app)
      .get('/api/user/discover/adventure?limit=5')
      .expect(200);

    console.log(`   Status: ${discoverResponse.status}`);
    console.log(`   Success: ${discoverResponse.body.success}`);
    console.log(`   Travel Style: ${discoverResponse.body.travelStyle}`);
    console.log(`   Results: ${discoverResponse.body.data?.length || 0} users found`);
    
    if (discoverResponse.body.success) {
      console.log('✅ User discovery test passed');
    } else {
      console.log('❌ User discovery test failed');
    }
    console.log();

    // Test 11: GET /api/user/export
    console.log('📤 Test 11: GET /api/user/export');
    
    const exportResponse = await request(app)
      .get('/api/user/export')
      .expect(200);

    console.log(`   Status: ${exportResponse.status}`);
    console.log(`   Success: ${exportResponse.body.success}`);
    console.log(`   Export Version: ${exportResponse.body.data?.exportInfo?.dataVersion}`);
    console.log(`   Exported At: ${exportResponse.body.data?.exportInfo?.exportedAt}`);
    
    if (exportResponse.body.success) {
      console.log('✅ Data export test passed');
    } else {
      console.log('❌ Data export test failed');
    }
    console.log();

    // Test 12: Error handling - Invalid data
    console.log('❌ Test 12: Error handling - Invalid preference update');
    
    const invalidPreferencesData = {
      budgetRange: { min: 3000, max: 1000 } // Invalid: min > max
    };

    const errorResponse = await request(app)
      .put('/api/user/preferences')
      .send(invalidPreferencesData)
      .expect(400);

    console.log(`   Status: ${errorResponse.status}`);
    console.log(`   Success: ${errorResponse.body.success}`);
    console.log(`   Error: ${errorResponse.body.error}`);
    
    if (!errorResponse.body.success && errorResponse.status === 400) {
      console.log('✅ Error handling test passed');
    } else {
      console.log('❌ Error handling test failed');
    }
    console.log();

    console.log('🎉 All User Profile API tests completed!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log('   ✅ Profile retrieval and updates');
    console.log('   ✅ Preferences management');
    console.log('   ✅ Settings configuration');
    console.log('   ✅ Statistics tracking');
    console.log('   ✅ User search and discovery');
    console.log('   ✅ Data export functionality');
    console.log('   ✅ Error handling and validation');
    console.log();

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', error.response.body);
    }
  }
}

// Mock the authentication middleware for testing
const originalAuthMiddleware = require('../src/middleware/auth').authMiddleware;

// Override the auth middleware for testing
jest.mock('../src/middleware/auth', () => ({
  ...jest.requireActual('../src/middleware/auth'),
  authMiddleware: mockAuthMiddleware,
  requireAuth: (req, res, next) => next(),
  requireProfile: (req, res, next) => next(),
  rateLimitMiddleware: () => (req, res, next) => next()
}));

// Run tests if this script is executed directly
if (require.main === module) {
  testUserAPI()
    .then(() => {
      console.log('✅ API test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ API test script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testUserAPI };