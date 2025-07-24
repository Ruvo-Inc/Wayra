#!/usr/bin/env node

/**
 * Test script for TripService functionality
 * Tests CRUD operations, collaboration features, and permission checking
 */

const mongoose = require('mongoose');
const TripService = require('../src/services/TripService');
const UserService = require('../src/services/UserService');
const DatabaseUtils = require('../src/utils/database');
const redisUtils = require('../src/utils/redis');

// Test configuration
const TEST_CONFIG = {
  testUsers: [
    {
      firebaseUid: 'test-owner-uid',
      email: 'owner@test.com',
      profile: { displayName: 'Trip Owner', firstName: 'Owner', lastName: 'User' }
    },
    {
      firebaseUid: 'test-collaborator-uid',
      email: 'collaborator@test.com',
      profile: { displayName: 'Collaborator', firstName: 'Collaborator', lastName: 'User' }
    }
  ],
  testTrip: {
    title: 'Test Trip to Paris',
    description: 'A wonderful test trip to the City of Light',
    destination: {
      name: 'Paris, France',
      country: 'France',
      city: 'Paris',
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    dates: {
      start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      end: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),   // 37 days from now
      flexible: false
    },
    budget: {
      total: 2000,
      currency: 'USD',
      breakdown: {
        accommodation: 800,
        transportation: 600,
        food: 400,
        activities: 200
      }
    },
    travelers: {
      adults: 2,
      children: 0,
      infants: 0
    },
    tags: ['romantic', 'cultural', 'city-break']
  }
};

class TripServiceTester {
  constructor() {
    this.tripService = new TripService();
    this.userService = new UserService();
    this.testUsers = [];
    this.testTrip = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Run a test and record results
   */
  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
      this.testResults.passed++;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
    } catch (error) {
      console.error(`❌ FAILED: ${testName} - ${error.message}`);
      this.testResults.failed++;
      this.testResults.tests.push({
        name: testName,
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
    }
  }

  /**
   * Assert helper function
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Setup test environment
   */
  async setup() {
    console.log('🔧 Setting up test environment...');
    
    try {
      // Initialize database connection
      await DatabaseUtils.initialize();
      console.log('✅ Database connected');
      
      // Initialize Redis (optional)
      try {
        await redisUtils.initialize();
        console.log('✅ Redis connected');
      } catch (error) {
        console.warn('⚠️ Redis connection failed, continuing without cache:', error.message);
      }
      
      // Create test users
      for (const userData of TEST_CONFIG.testUsers) {
        const result = await this.userService.createUser(
          userData.firebaseUid,
          userData.email,
          userData.profile
        );
        
        if (result.success) {
          this.testUsers.push(result.user);
          console.log(`✅ Test user created: ${userData.email}`);
        } else {
          // User might already exist, try to get it
          const existingResult = await this.userService.getUserByEmail(userData.email);
          if (existingResult.success) {
            this.testUsers.push(existingResult.user);
            console.log(`✅ Test user found: ${userData.email}`);
          } else {
            throw new Error(`Failed to create or find test user: ${userData.email}`);
          }
        }
      }
      
      console.log('✅ Test environment setup complete');
      
    } catch (error) {
      console.error('❌ Test setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Test trip creation
   */
  async testTripCreation() {
    const ownerUser = this.testUsers[0];
    
    const result = await this.tripService.createTrip(
      ownerUser._id.toString(),
      TEST_CONFIG.testTrip
    );
    
    this.assert(result.success, 'Trip creation should succeed');
    this.assert(result.trip, 'Trip object should be returned');
    this.assert(result.trip.title === TEST_CONFIG.testTrip.title, 'Trip title should match');
    this.assert(result.trip.owner.toString() === ownerUser._id.toString(), 'Owner should be set correctly');
    this.assert(result.trip.collaborators.length === 1, 'Owner should be added as collaborator');
    this.assert(result.trip.collaborators[0].role === 'owner', 'Owner should have owner role');
    this.assert(result.trip.collaborators[0].status === 'accepted', 'Owner should have accepted status');
    
    this.testTrip = result.trip;
    console.log(`   Trip created with ID: ${this.testTrip._id}`);
  }

  /**
   * Test trip retrieval
   */
  async testTripRetrieval() {
    const ownerUser = this.testUsers[0];
    
    const result = await this.tripService.getTripById(
      this.testTrip._id.toString(),
      ownerUser._id.toString(),
      { includeCollaborators: true, includeOwner: true }
    );
    
    this.assert(result.success, 'Trip retrieval should succeed');
    this.assert(result.trip, 'Trip object should be returned');
    this.assert(result.trip._id.toString() === this.testTrip._id.toString(), 'Trip ID should match');
    this.assert(result.trip.title === TEST_CONFIG.testTrip.title, 'Trip title should match');
    
    console.log(`   Trip retrieved: ${result.trip.title}`);
  }

  /**
   * Test trip update
   */
  async testTripUpdate() {
    const ownerUser = this.testUsers[0];
    const updates = {
      title: 'Updated Test Trip to Paris',
      description: 'An updated wonderful test trip to the City of Light',
      budget: {
        ...TEST_CONFIG.testTrip.budget,
        total: 2500
      }
    };
    
    const result = await this.tripService.updateTrip(
      this.testTrip._id.toString(),
      ownerUser._id.toString(),
      updates
    );
    
    this.assert(result.success, 'Trip update should succeed');
    this.assert(result.trip.title === updates.title, 'Trip title should be updated');
    this.assert(result.trip.budget.total === updates.budget.total, 'Trip budget should be updated');
    
    console.log(`   Trip updated: ${result.trip.title}`);
  }

  /**
   * Test collaboration invitation
   */
  async testCollaborationInvitation() {
    const ownerUser = this.testUsers[0];
    const collaboratorUser = this.testUsers[1];
    
    const result = await this.tripService.inviteCollaborator(
      this.testTrip._id.toString(),
      ownerUser._id.toString(),
      collaboratorUser.email,
      'editor'
    );
    
    this.assert(result.success, 'Collaboration invitation should succeed');
    this.assert(result.invitation, 'Invitation object should be returned');
    this.assert(result.invitation.inviteeEmail === collaboratorUser.email, 'Invitee email should match');
    this.assert(result.invitation.role === 'editor', 'Role should be set correctly');
    this.assert(result.invitation.status === 'pending', 'Status should be pending');
    
    console.log(`   Invitation sent to: ${collaboratorUser.email}`);
  }

  /**
   * Test invitation acceptance
   */
  async testInvitationAcceptance() {
    const collaboratorUser = this.testUsers[1];
    
    const result = await this.tripService.acceptInvitation(
      this.testTrip._id.toString(),
      collaboratorUser._id.toString()
    );
    
    this.assert(result.success, 'Invitation acceptance should succeed');
    this.assert(result.collaboration, 'Collaboration object should be returned');
    this.assert(result.collaboration.status === 'accepted', 'Status should be accepted');
    this.assert(result.collaboration.role === 'editor', 'Role should be preserved');
    
    console.log(`   Invitation accepted by: ${collaboratorUser.email}`);
  }

  /**
   * Test permission checking
   */
  async testPermissionChecking() {
    const ownerUser = this.testUsers[0];
    const collaboratorUser = this.testUsers[1];
    
    // Test owner permissions
    const ownerPermResult = await this.tripService.checkTripPermission(
      this.testTrip._id.toString(),
      ownerUser._id.toString(),
      'delete_trip'
    );
    
    this.assert(ownerPermResult.success, 'Owner permission check should succeed');
    this.assert(ownerPermResult.hasPermission, 'Owner should have delete permission');
    this.assert(ownerPermResult.role === 'owner', 'Owner role should be correct');
    
    // Test collaborator permissions
    const collabPermResult = await this.tripService.checkTripPermission(
      this.testTrip._id.toString(),
      collaboratorUser._id.toString(),
      'edit_trip'
    );
    
    this.assert(collabPermResult.success, 'Collaborator permission check should succeed');
    this.assert(collabPermResult.hasPermission, 'Editor should have edit permission');
    this.assert(collabPermResult.role === 'editor', 'Editor role should be correct');
    
    // Test denied permission
    const deniedPermResult = await this.tripService.checkTripPermission(
      this.testTrip._id.toString(),
      collaboratorUser._id.toString(),
      'delete_trip'
    );
    
    this.assert(deniedPermResult.success, 'Permission check should succeed');
    this.assert(!deniedPermResult.hasPermission, 'Editor should not have delete permission');
    
    console.log('   Permission checks completed successfully');
  }

  /**
   * Test trip search
   */
  async testTripSearch() {
    const ownerUser = this.testUsers[0];
    
    const result = await this.tripService.searchTrips(
      'Paris',
      ownerUser._id.toString(),
      {},
      { limit: 10 }
    );
    
    this.assert(result.success, 'Trip search should succeed');
    this.assert(Array.isArray(result.trips), 'Trips should be an array');
    this.assert(result.trips.length > 0, 'Should find at least one trip');
    
    const foundTrip = result.trips.find(trip => 
      trip._id.toString() === this.testTrip._id.toString()
    );
    this.assert(foundTrip, 'Should find the test trip');
    
    console.log(`   Found ${result.trips.length} trips matching 'Paris'`);
  }

  /**
   * Test user trips retrieval
   */
  async testUserTripsRetrieval() {
    const ownerUser = this.testUsers[0];
    
    const result = await this.tripService.getUserTrips(
      ownerUser._id.toString(),
      {},
      { limit: 10 }
    );
    
    this.assert(result.success, 'User trips retrieval should succeed');
    this.assert(Array.isArray(result.trips), 'Trips should be an array');
    this.assert(result.trips.length > 0, 'Should find at least one trip');
    this.assert(result.pagination, 'Pagination info should be provided');
    
    const foundTrip = result.trips.find(trip => 
      trip._id.toString() === this.testTrip._id.toString()
    );
    this.assert(foundTrip, 'Should find the test trip');
    
    console.log(`   Found ${result.trips.length} trips for user`);
  }

  /**
   * Test collaborator role update
   */
  async testCollaboratorRoleUpdate() {
    const ownerUser = this.testUsers[0];
    const collaboratorUser = this.testUsers[1];
    
    const result = await this.tripService.updateCollaboratorRole(
      this.testTrip._id.toString(),
      collaboratorUser._id.toString(),
      'contributor',
      ownerUser._id.toString()
    );
    
    this.assert(result.success, 'Role update should succeed');
    this.assert(result.collaboration.role === 'contributor', 'Role should be updated to contributor');
    
    console.log(`   Collaborator role updated to: contributor`);
  }

  /**
   * Test service health status
   */
  async testServiceHealth() {
    const result = await this.tripService.getHealthStatus();
    
    this.assert(result.status === 'healthy', 'Service should be healthy');
    this.assert(result.database, 'Database health should be reported');
    this.assert(result.features, 'Features should be reported');
    this.assert(result.features.tripCreation, 'Trip creation feature should be available');
    this.assert(result.features.collaboration, 'Collaboration feature should be available');
    
    console.log('   Service health check passed');
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete test trip
      if (this.testTrip) {
        const ownerUser = this.testUsers[0];
        await this.tripService.deleteTrip(
          this.testTrip._id.toString(),
          ownerUser._id.toString()
        );
        console.log('✅ Test trip deleted');
      }
      
      // Delete test users
      for (const user of this.testUsers) {
        await this.userService.deactivateUser(user._id.toString(), 'test_cleanup');
      }
      console.log('✅ Test users deactivated');
      
      // Close connections
      if (redisUtils.isConnected) {
        await redisUtils.disconnect();
        console.log('✅ Redis disconnected');
      }
      
      await mongoose.connection.close();
      console.log('✅ Database disconnected');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n✅ Test execution completed');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting TripService Tests');
    console.log('==============================');
    
    try {
      await this.setup();
      
      // Run tests in sequence
      await this.runTest('Trip Creation', () => this.testTripCreation());
      await this.runTest('Trip Retrieval', () => this.testTripRetrieval());
      await this.runTest('Trip Update', () => this.testTripUpdate());
      await this.runTest('Collaboration Invitation', () => this.testCollaborationInvitation());
      await this.runTest('Invitation Acceptance', () => this.testInvitationAcceptance());
      await this.runTest('Permission Checking', () => this.testPermissionChecking());
      await this.runTest('Trip Search', () => this.testTripSearch());
      await this.runTest('User Trips Retrieval', () => this.testUserTripsRetrieval());
      await this.runTest('Collaborator Role Update', () => this.testCollaboratorRoleUpdate());
      await this.runTest('Service Health', () => this.testServiceHealth());
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
    } finally {
      await this.cleanup();
      this.printResults();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new TripServiceTester();
  tester.runAllTests()
    .then(() => {
      process.exit(tester.testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = TripServiceTester;