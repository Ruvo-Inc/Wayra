#!/usr/bin/env node

/**
 * Simple UserService Test
 * Tests the UserService class structure and methods without database dependencies
 */

const path = require('path');

// Add src to require path
require('module').globalPaths.push(path.join(__dirname, '../src'));

async function testUserServiceStructure() {
  console.log('🧪 Testing UserService Structure');
  console.log('================================');

  try {
    // Test that UserService can be loaded
    console.log('🔄 Loading UserService class...');
    const UserService = require('../src/services/UserService');
    console.log('✅ UserService class loaded successfully');

    // Test service instantiation
    console.log('🔄 Testing service instantiation...');
    const userService = new UserService();
    console.log('✅ UserService instance created successfully');

    // Test service properties
    console.log('🔄 Testing service properties...');
    console.log(`   Cache enabled: ${userService.cacheEnabled}`);
    console.log(`   Default cache TTL keys: ${Object.keys(userService.defaultCacheTTL)}`);
    
    if (userService.cacheEnabled === true && 
        userService.defaultCacheTTL.profile === 1800) {
      console.log('✅ Service properties test passed');
    } else {
      console.log('❌ Service properties test failed');
      return false;
    }

    // Test helper methods
    console.log('🔄 Testing helper methods...');
    
    const defaultPreferences = userService.getDefaultPreferences();
    const defaultSettings = userService.getDefaultSettings();
    const defaultStats = userService.getDefaultStats();
    
    console.log(`   Default preferences has ${Object.keys(defaultPreferences).length} keys`);
    console.log(`   Default settings has ${Object.keys(defaultSettings).length} keys`);
    console.log(`   Default stats has ${Object.keys(defaultStats).length} keys`);
    
    if (defaultPreferences.budgetRange && 
        defaultSettings.notifications && 
        defaultStats.tripsPlanned === 0) {
      console.log('✅ Helper methods test passed');
    } else {
      console.log('❌ Helper methods test failed');
      return false;
    }

    // Test preferences merging
    console.log('🔄 Testing preferences merging...');
    
    const customPreferences = userService.getDefaultPreferences({
      budgetRange: { min: 1000, currency: 'EUR' },
      travelStyle: ['luxury', 'cultural']
    });
    
    if (customPreferences.budgetRange.min === 1000 && 
        customPreferences.budgetRange.currency === 'EUR' &&
        customPreferences.budgetRange.max === 2000 && // Should keep default max
        customPreferences.travelStyle.includes('luxury')) {
      console.log('✅ Preferences merging test passed');
    } else {
      console.log('❌ Preferences merging test failed');
      return false;
    }

    // Test settings merging
    console.log('🔄 Testing settings merging...');
    
    const customSettings = userService.getDefaultSettings({
      notifications: { email: false },
      ai: { communicationStyle: 'formal' }
    });
    
    if (customSettings.notifications.email === false &&
        customSettings.notifications.push === true && // Should keep default
        customSettings.ai.communicationStyle === 'formal') {
      console.log('✅ Settings merging test passed');
    } else {
      console.log('❌ Settings merging test failed');
      return false;
    }

    // Test method availability
    console.log('🔄 Testing method availability...');
    
    const expectedMethods = [
      'createUser',
      'createOrUpdateUser',
      'getUserByFirebaseUid',
      'getUserById',
      'getUserByEmail',
      'updateUserProfile',
      'updateUserPreferences',
      'updateUserSettings',
      'updateLastLogin',
      'updateActivity',
      'getUserStats',
      'updateTripStats',
      'updateBudgetSaved',
      'addFavoriteDestination',
      'searchUsers',
      'getUsersByTravelStyle',
      'deactivateUser',
      'reactivateUser',
      'cacheUserData',
      'invalidateUserCache',
      'validateUserPermissions',
      'getHealthStatus'
    ];
    
    const missingMethods = expectedMethods.filter(method => 
      typeof userService[method] !== 'function'
    );
    
    if (missingMethods.length === 0) {
      console.log(`✅ All ${expectedMethods.length} methods available`);
    } else {
      console.log(`❌ Missing methods: ${missingMethods.join(', ')}`);
      return false;
    }

    // Test permission validation (synchronous part)
    console.log('🔄 Testing permission validation...');
    
    try {
      const selfPermissionPromise = userService.validateUserPermissions('user1', 'user1', 'update');
      const otherPermissionPromise = userService.validateUserPermissions('user1', 'user2', 'update');
      
      // These should return promises
      if (selfPermissionPromise instanceof Promise && 
          otherPermissionPromise instanceof Promise) {
        console.log('✅ Permission validation methods return promises');
      } else {
        console.log('❌ Permission validation methods should return promises');
        return false;
      }
    } catch (error) {
      console.log('❌ Permission validation test failed:', error.message);
      return false;
    }

    // Test error handling structure
    console.log('🔄 Testing error response structure...');
    
    // Test that methods return proper error structure when called with invalid data
    try {
      const result = await userService.getUserById('invalid-id');
      
      if (typeof result === 'object' && 
          result.hasOwnProperty('success') &&
          result.hasOwnProperty('error') &&
          result.hasOwnProperty('code')) {
        console.log('✅ Error response structure test passed');
      } else {
        console.log('❌ Error response structure test failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Error response structure test failed:', error.message);
      return false;
    }

    console.log('\n🎉 All UserService structure tests passed!');
    console.log('\n📋 Service Features Verified:');
    console.log('   ✅ Class loading and instantiation');
    console.log('   ✅ Service configuration and properties');
    console.log('   ✅ Helper methods for defaults and merging');
    console.log('   ✅ Complete CRUD method availability');
    console.log('   ✅ Permission validation system structure');
    console.log('   ✅ Consistent error handling structure');
    console.log('   ✅ Caching integration points');
    console.log('   ✅ Statistics management methods');
    console.log('   ✅ Search and discovery methods');
    console.log('   ✅ Account management methods');

    console.log('\n📝 Note: Database integration tests require MongoDB connection');
    console.log('   Run with actual database to test full functionality');

    return true;

  } catch (error) {
    console.error('❌ UserService structure test failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run tests
testUserServiceStructure()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });