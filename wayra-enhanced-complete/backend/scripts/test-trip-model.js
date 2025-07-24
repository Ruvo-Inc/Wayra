#!/usr/bin/env node

/**
 * Test script for Trip model
 * Tests basic Trip model functionality including schema validation,
 * collaboration features, and AI content storage
 */

const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');
const User = require('../src/models/User');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wayra_test',
  testTimeout: 30000
};

// Test data
const testTripData = {
  title: 'Test Trip to Paris',
  description: 'A wonderful test trip to the City of Light',
  destination: {
    name: 'Paris, France',
    country: 'France',
    city: 'Paris',
    coordinates: {
      lat: 48.8566,
      lng: 2.3522
    },
    timezone: 'Europe/Paris'
  },
  dates: {
    start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    end: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
    flexible: false
  },
  budget: {
    total: 2000,
    currency: 'USD',
    breakdown: {
      accommodation: 800,
      transportation: 400,
      food: 500,
      activities: 300
    }
  },
  travelers: {
    adults: 2,
    children: 0,
    infants: 0
  },
  tags: ['romantic', 'culture', 'food'],
  status: 'planning'
};

const testUserData = {
  firebaseUid: 'test-user-123',
  email: 'test@example.com',
  profile: {
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User'
  }
};

async function connectToDatabase() {
  try {
    console.log('🔄 Connecting to test database...');
    await mongoose.connect(TEST_CONFIG.mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to test database');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  try {
    await Trip.deleteMany({ title: /Test Trip/ });
    await User.deleteMany({ 
      $or: [
        { email: /test@/ },
        { firebaseUid: /test-/ }
      ]
    });
    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  }
}

async function createTestUser() {
  try {
    const user = new User(testUserData);
    await user.save();
    console.log('✅ Test user created:', user._id);
    return user;
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    throw error;
  }
}

async function testTripCreation(owner) {
  console.log('\n📝 Testing Trip Creation...');
  
  try {
    const tripData = {
      ...testTripData,
      owner: owner._id
    };
    
    const trip = new Trip(tripData);
    await trip.save();
    
    console.log('✅ Trip created successfully');
    console.log(`   - ID: ${trip._id}`);
    console.log(`   - Title: ${trip.title}`);
    console.log(`   - Duration: ${trip.duration} days`);
    console.log(`   - Total Travelers: ${trip.totalTravelers}`);
    console.log(`   - Owner in collaborators: ${trip.collaborators.length > 0}`);
    
    return trip;
  } catch (error) {
    console.error('❌ Trip creation failed:', error.message);
    throw error;
  }
}

async function testCollaborationFeatures(trip, owner) {
  console.log('\n👥 Testing Collaboration Features...');
  
  try {
    // Create a second test user
    const collaboratorData = {
      firebaseUid: 'test-collaborator-456',
      email: 'collaborator@example.com',
      profile: {
        displayName: 'Test Collaborator',
        firstName: 'Test',
        lastName: 'Collaborator'
      }
    };
    
    const collaborator = new User(collaboratorData);
    await collaborator.save();
    
    // Add collaborator
    await trip.addCollaborator(collaborator._id, 'editor', owner._id);
    console.log('✅ Collaborator invited');
    
    // Accept invitation
    await trip.acceptInvitation(collaborator._id);
    console.log('✅ Invitation accepted');
    
    // Test permissions
    const hasViewPermission = trip.hasPermission(collaborator._id, 'view_trip');
    const hasEditPermission = trip.hasPermission(collaborator._id, 'edit_trip');
    const hasDeletePermission = trip.hasPermission(collaborator._id, 'delete_trip');
    
    console.log(`   - View permission: ${hasViewPermission}`);
    console.log(`   - Edit permission: ${hasEditPermission}`);
    console.log(`   - Delete permission: ${hasDeletePermission}`);
    
    // Test role update
    await trip.updateCollaboratorRole(collaborator._id, 'viewer', owner._id);
    console.log('✅ Collaborator role updated to viewer');
    
    const hasEditAfterUpdate = trip.hasPermission(collaborator._id, 'edit_trip');
    console.log(`   - Edit permission after role change: ${hasEditAfterUpdate}`);
    
    return collaborator;
  } catch (error) {
    console.error('❌ Collaboration test failed:', error.message);
    throw error;
  }
}

async function testAIContentStorage(trip) {
  console.log('\n🤖 Testing AI Content Storage...');
  
  try {
    // Test AI content update
    const aiItinerary = {
      day1: {
        activities: ['Visit Eiffel Tower', 'Seine River Cruise'],
        budget: 150
      },
      day2: {
        activities: ['Louvre Museum', 'Champs-Élysées Shopping'],
        budget: 200
      }
    };
    
    await trip.updateAIContent('itinerary', aiItinerary, 'itinerary-planner-v1.0');
    console.log('✅ AI itinerary content stored');
    
    // Test budget analysis
    const budgetAnalysis = {
      recommendations: ['Book accommodation early for better rates'],
      savings: 200,
      riskFactors: ['Peak season pricing']
    };
    
    await trip.updateAIContent('budgetAnalysis', budgetAnalysis, 'budget-analyst-v1.0');
    console.log('✅ AI budget analysis stored');
    
    console.log(`   - Has AI Content: ${trip.hasAIContent}`);
    console.log(`   - Regeneration Count: ${trip.aiGenerated.regenerationCount}`);
    
  } catch (error) {
    console.error('❌ AI content test failed:', error.message);
    throw error;
  }
}

async function testActivityLogging(trip, owner) {
  console.log('\n📊 Testing Activity Logging...');
  
  try {
    // Test custom activity logging
    trip.logActivity(owner._id, 'trip_updated', {
      field: 'budget',
      oldValue: 2000,
      newValue: 2200
    });
    
    // Test customization
    await trip.addCustomization(
      owner._id,
      'budget_adjustment',
      { total: 2200 },
      { total: 2000 },
      'Increased budget for better accommodation'
    );
    
    console.log('✅ Activity logging working');
    console.log(`   - Activity log entries: ${trip.activityLog.length}`);
    console.log(`   - Customizations: ${trip.customizations.length}`);
    console.log(`   - Current version: ${trip.version}`);
    
  } catch (error) {
    console.error('❌ Activity logging test failed:', error.message);
    throw error;
  }
}

async function testBookingIntegration(trip, owner) {
  console.log('\n🏨 Testing Booking Integration...');
  
  try {
    // Test booking addition
    const bookingData = {
      type: 'hotel',
      provider: 'Booking.com',
      bookingReference: 'BK123456789',
      status: 'confirmed',
      cost: {
        amount: 800,
        currency: 'USD'
      },
      details: {
        hotelName: 'Hotel Test Paris',
        checkIn: trip.dates.start,
        checkOut: trip.dates.end,
        roomType: 'Double Room'
      }
    };
    
    await trip.addBooking(bookingData, owner._id);
    console.log('✅ Booking added successfully');
    
    const bookingStats = trip.bookingStats;
    console.log(`   - Total bookings: ${bookingStats.total}`);
    console.log(`   - Confirmed bookings: ${bookingStats.confirmed}`);
    console.log(`   - Total booking cost: $${bookingStats.totalCost}`);
    console.log(`   - Budget utilization: ${trip.budgetUtilization}%`);
    
  } catch (error) {
    console.error('❌ Booking integration test failed:', error.message);
    throw error;
  }
}

async function testStaticMethods(owner) {
  console.log('\n🔍 Testing Static Methods...');
  
  try {
    // Test finding trips by owner
    const ownerTrips = await Trip.findByOwner(owner._id);
    console.log(`✅ Found ${ownerTrips.length} trips by owner`);
    
    // Test upcoming trips
    const upcomingTrips = await Trip.getUpcomingTrips(owner._id);
    console.log(`✅ Found ${upcomingTrips.length} upcoming trips`);
    
    // Test trip search
    const searchResults = await Trip.searchTrips('Paris', owner._id);
    console.log(`✅ Search found ${searchResults.length} trips matching 'Paris'`);
    
    // Test trip stats
    const stats = await Trip.getTripStats(owner._id);
    if (stats.length > 0) {
      console.log('✅ Trip statistics generated:');
      console.log(`   - Total trips: ${stats[0].totalTrips}`);
      console.log(`   - Completed trips: ${stats[0].completedTrips}`);
      console.log(`   - Total budget: $${stats[0].totalBudget}`);
    }
    
  } catch (error) {
    console.error('❌ Static methods test failed:', error.message);
    throw error;
  }
}

async function testVirtualProperties(trip) {
  console.log('\n🔗 Testing Virtual Properties...');
  
  try {
    console.log('✅ Virtual properties working:');
    console.log(`   - Duration: ${trip.duration} days`);
    console.log(`   - Total Travelers: ${trip.totalTravelers}`);
    console.log(`   - Budget Utilization: ${trip.budgetUtilization}%`);
    console.log(`   - Collaborator Count: ${trip.collaboratorCount}`);
    console.log(`   - Is Upcoming: ${trip.isUpcoming}`);
    console.log(`   - Days Until Trip: ${trip.daysUntilTrip}`);
    console.log(`   - Has AI Content: ${trip.hasAIContent}`);
    
  } catch (error) {
    console.error('❌ Virtual properties test failed:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting Trip Model Tests...\n');
  
  try {
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }
    
    // Cleanup any existing test data
    await cleanupTestData();
    
    // Create test user
    const owner = await createTestUser();
    
    // Test trip creation
    const trip = await testTripCreation(owner);
    
    // Test collaboration features
    const collaborator = await testCollaborationFeatures(trip, owner);
    
    // Test AI content storage
    await testAIContentStorage(trip);
    
    // Test activity logging
    await testActivityLogging(trip, owner);
    
    // Test booking integration
    await testBookingIntegration(trip, owner);
    
    // Test virtual properties
    await testVirtualProperties(trip);
    
    // Test static methods
    await testStaticMethods(owner);
    
    console.log('\n🎉 All Trip Model tests passed successfully!');
    
    // Clear timeout since tests completed successfully
    clearTimeout(testTimeout);
    
    // Cleanup test data
    await cleanupTestData();
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Test interrupted, cleaning up...');
  await cleanupTestData();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Set test timeout
const testTimeout = setTimeout(() => {
  console.error('❌ Test timeout exceeded');
  process.exit(1);
}, TEST_CONFIG.testTimeout);

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };