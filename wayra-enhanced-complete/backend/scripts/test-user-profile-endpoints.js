#!/usr/bin/env node

/**
 * Test script for User Profile API endpoints
 * Tests the implementation of task 2.4: Create user profile API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/user`;

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Test runner for user profile endpoints
 */
class UserProfileEndpointTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Log test result
   */
  logResult(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    
    this.results.tests.push({
      name: testName,
      passed,
      message
    });
    
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  /**
   * Test GET /api/user/profile endpoint
   */
  async testGetProfile() {
    try {
      const response = await axios.get(`${API_BASE}/profile`, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        
        // Check required fields
        const requiredFields = ['id', 'email', 'profile', 'preferences', 'settings', 'stats'];
        const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
          this.logResult('GET /api/user/profile', true, 'All required fields present');
        } else {
          this.logResult('GET /api/user/profile', false, `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.logResult('GET /api/user/profile', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('GET /api/user/profile', true, 'Correctly requires authentication');
      } else {
        this.logResult('GET /api/user/profile', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test PUT /api/user/profile endpoint
   */
  async testUpdateProfile() {
    try {
      const updateData = {
        profile: {
          displayName: 'Test User Updated',
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const response = await axios.put(`${API_BASE}/profile`, updateData, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        this.logResult('PUT /api/user/profile', true, 'Profile update endpoint works');
      } else {
        this.logResult('PUT /api/user/profile', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('PUT /api/user/profile', true, 'Correctly requires authentication');
      } else {
        this.logResult('PUT /api/user/profile', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test GET /api/user/preferences endpoint
   */
  async testGetPreferences() {
    try {
      const response = await axios.get(`${API_BASE}/preferences`, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        
        // Check for preference fields
        const preferenceFields = ['budgetRange', 'travelStyle', 'interests'];
        const hasPreferences = preferenceFields.some(field => data.hasOwnProperty(field));
        
        if (hasPreferences) {
          this.logResult('GET /api/user/preferences', true, 'Preferences endpoint works');
        } else {
          this.logResult('GET /api/user/preferences', false, 'No preference fields found');
        }
      } else {
        this.logResult('GET /api/user/preferences', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('GET /api/user/preferences', true, 'Correctly requires authentication');
      } else {
        this.logResult('GET /api/user/preferences', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test PUT /api/user/preferences endpoint
   */
  async testUpdatePreferences() {
    try {
      const preferencesData = {
        budgetRange: {
          min: 1000,
          max: 3000,
          currency: 'USD'
        },
        travelStyle: ['adventure', 'budget'],
        interests: ['hiking', 'culture']
      };

      const response = await axios.put(`${API_BASE}/preferences`, preferencesData, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        this.logResult('PUT /api/user/preferences', true, 'Preferences update endpoint works');
      } else {
        this.logResult('PUT /api/user/preferences', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('PUT /api/user/preferences', true, 'Correctly requires authentication');
      } else {
        this.logResult('PUT /api/user/preferences', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test GET /api/user/stats endpoint
   */
  async testGetStats() {
    try {
      const response = await axios.get(`${API_BASE}/stats`, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        
        // Check for stats fields
        const statsFields = ['tripsPlanned', 'tripsCompleted', 'totalBudgetSaved'];
        const hasStats = statsFields.some(field => data.hasOwnProperty(field));
        
        if (hasStats) {
          this.logResult('GET /api/user/stats', true, 'Statistics endpoint works');
        } else {
          this.logResult('GET /api/user/stats', false, 'No statistics fields found');
        }
      } else {
        this.logResult('GET /api/user/stats', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('GET /api/user/stats', true, 'Correctly requires authentication');
      } else {
        this.logResult('GET /api/user/stats', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test GET /api/user/travel-history endpoint (new)
   */
  async testGetTravelHistory() {
    try {
      const response = await axios.get(`${API_BASE}/travel-history`, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        
        // Check for travel history structure
        const requiredFields = ['trips', 'pagination', 'summary'];
        const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
          this.logResult('GET /api/user/travel-history', true, 'Travel history endpoint works');
        } else {
          this.logResult('GET /api/user/travel-history', false, `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.logResult('GET /api/user/travel-history', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('GET /api/user/travel-history', true, 'Correctly requires authentication');
      } else {
        this.logResult('GET /api/user/travel-history', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test GET /api/user/travel-summary endpoint (new)
   */
  async testGetTravelSummary() {
    try {
      const response = await axios.get(`${API_BASE}/travel-summary`, TEST_CONFIG);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        
        // Check for travel summary structure
        const requiredFields = ['statistics', 'recentTrips', 'achievements'];
        const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
          this.logResult('GET /api/user/travel-summary', true, 'Travel summary endpoint works');
        } else {
          this.logResult('GET /api/user/travel-summary', false, `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.logResult('GET /api/user/travel-summary', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('GET /api/user/travel-summary', true, 'Correctly requires authentication');
      } else {
        this.logResult('GET /api/user/travel-summary', false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test endpoint structure and authentication
   */
  async testEndpointStructure() {
    const endpoints = [
      'profile',
      'preferences', 
      'settings',
      'stats',
      'travel-history',
      'travel-summary'
    ];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`${API_BASE}/${endpoint}`, TEST_CONFIG);
        this.logResult(`Endpoint structure: /${endpoint}`, false, 'Should require authentication');
      } catch (error) {
        if (error.response?.status === 401) {
          this.logResult(`Endpoint structure: /${endpoint}`, true, 'Correctly protected');
        } else if (error.code === 'ECONNREFUSED') {
          this.logResult(`Endpoint structure: /${endpoint}`, false, 'Server not running');
        } else {
          this.logResult(`Endpoint structure: /${endpoint}`, false, `Unexpected error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting User Profile API Endpoint Tests...\n');

    // Test endpoint structure and authentication
    await this.testEndpointStructure();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
    }

    console.log('\n🏁 Testing completed!');
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new UserProfileEndpointTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = UserProfileEndpointTester;