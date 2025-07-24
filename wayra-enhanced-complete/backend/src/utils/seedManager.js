const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

/**
 * Database Seeding Manager for Wayra
 * Handles development data seeding, test data generation, and environment setup
 */
class SeedManager {
  constructor() {
    this.seedsPath = path.join(__dirname, '../../scripts/seeds');
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize seeding system
   */
  async initialize() {
    try {
      // Ensure seeds directory exists
      await fs.mkdir(this.seedsPath, { recursive: true });
      console.log('✅ Seed manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize seed manager:', error.message);
      throw error;
    }
  }

  /**
   * Run all seeds for current environment
   */
  async runSeeds(environment = this.environment) {
    try {
      console.log(`🌱 Starting database seeding for ${environment} environment...`);
      
      if (environment === 'production') {
        console.warn('⚠️ Seeding is not allowed in production environment');
        return false;
      }

      const seedFiles = await this.getSeedFiles(environment);
      
      if (seedFiles.length === 0) {
        console.log('📋 No seed files found for current environment');
        return true;
      }

      console.log(`📋 Found ${seedFiles.length} seed files`);

      for (const seedFile of seedFiles) {
        console.log(`🌱 Running seed: ${seedFile.name}`);
        
        try {
          const seedModule = require(seedFile.path);
          
          if (typeof seedModule.seed !== 'function') {
            console.warn(`⚠️ Seed file ${seedFile.filename} missing 'seed' function, skipping`);
            continue;
          }

          // Execute seed
          await seedModule.seed(mongoose.connection.db);
          console.log(`✅ Seed ${seedFile.name} completed successfully`);
        } catch (error) {
          console.error(`❌ Seed ${seedFile.name} failed:`, error.message);
          if (seedFile.required) {
            throw error;
          }
        }
      }

      console.log('✅ All seeds completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Seeding process failed:', error.message);
      throw error;
    }
  }

  /**
   * Get available seed files for environment
   */
  async getSeedFiles(environment) {
    try {
      const files = await fs.readdir(this.seedsPath);
      const seedFiles = [];

      for (const file of files) {
        if (!file.endsWith('.js')) continue;

        const filePath = path.join(this.seedsPath, file);
        const seedModule = require(filePath);
        
        // Check if seed should run in current environment
        const environments = seedModule.environments || ['development'];
        if (!environments.includes(environment)) continue;

        const match = file.match(/^(\d+)_(.+)\.js$/);
        seedFiles.push({
          order: match ? parseInt(match[1]) : 999,
          name: match ? match[2].replace(/_/g, ' ') : file.replace('.js', ''),
          filename: file,
          path: filePath,
          required: seedModule.required || false,
          description: seedModule.description || ''
        });
      }

      return seedFiles.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('❌ Failed to read seed files:', error.message);
      return [];
    }
  }

  /**
   * Clear all data (for testing/development)
   */
  async clearDatabase() {
    try {
      if (this.environment === 'production') {
        throw new Error('Database clearing is not allowed in production');
      }

      console.log('🧹 Clearing database...');
      const db = mongoose.connection.db;
      
      // Get all collections
      const collections = await db.listCollections().toArray();
      
      // Drop all collections except system collections and migrations
      for (const collection of collections) {
        const collectionName = collection.name;
        
        // Skip system collections and migration tracking
        if (collectionName.startsWith('system.') || collectionName === 'migrations') {
          continue;
        }
        
        await db.collection(collectionName).deleteMany({});
        console.log(`🗑️ Cleared collection: ${collectionName}`);
      }

      console.log('✅ Database cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear database:', error.message);
      throw error;
    }
  }

  /**
   * Generate test users
   */
  async generateTestUsers(count = 10) {
    try {
      console.log(`👥 Generating ${count} test users...`);
      
      const users = [];
      for (let i = 1; i <= count; i++) {
        users.push({
          firebaseUid: `test-user-${i}`,
          email: `testuser${i}@wayra.dev`,
          profile: {
            displayName: `Test User ${i}`,
            firstName: `Test${i}`,
            lastName: 'User',
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=test${i}`,
            location: {
              country: ['USA', 'Canada', 'UK', 'Germany', 'France'][i % 5],
              city: ['New York', 'Toronto', 'London', 'Berlin', 'Paris'][i % 5],
              timezone: 'UTC'
            }
          },
          preferences: {
            budgetRange: {
              min: 500 + (i * 100),
              max: 2000 + (i * 200),
              currency: 'USD'
            },
            travelStyle: ['budget', 'luxury', 'adventure', 'cultural'][i % 4],
            interests: ['food', 'culture', 'nature', 'adventure', 'relaxation'].slice(0, (i % 3) + 2)
          },
          settings: {
            notifications: {
              email: true,
              push: i % 2 === 0,
              tripUpdates: true,
              priceAlerts: i % 3 === 0
            },
            privacy: {
              profileVisibility: 'public',
              tripVisibility: 'friends',
              allowInvitations: true
            },
            ai: {
              personalizationEnabled: true,
              dataUsageConsent: true,
              learningFromHistory: true
            }
          },
          stats: {
            tripsPlanned: Math.floor(Math.random() * 10),
            tripsCompleted: Math.floor(Math.random() * 5),
            totalBudgetSaved: Math.floor(Math.random() * 1000),
            favoriteDestinations: [],
            averageTripDuration: 7
          },
          createdAt: new Date(Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(),
          lastLoginAt: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
          isActive: true
        });
      }

      return users;
    } catch (error) {
      console.error('❌ Failed to generate test users:', error.message);
      throw error;
    }
  }

  /**
   * Generate test trips
   */
  async generateTestTrips(userIds, count = 20) {
    try {
      console.log(`🧳 Generating ${count} test trips...`);
      
      const destinations = [
        { name: 'Paris, France', country: 'France', coordinates: { lat: 48.8566, lng: 2.3522 } },
        { name: 'Tokyo, Japan', country: 'Japan', coordinates: { lat: 35.6762, lng: 139.6503 } },
        { name: 'New York, USA', country: 'USA', coordinates: { lat: 40.7128, lng: -74.0060 } },
        { name: 'London, UK', country: 'UK', coordinates: { lat: 51.5074, lng: -0.1278 } },
        { name: 'Barcelona, Spain', country: 'Spain', coordinates: { lat: 41.3851, lng: 2.1734 } },
        { name: 'Rome, Italy', country: 'Italy', coordinates: { lat: 41.9028, lng: 12.4964 } },
        { name: 'Bangkok, Thailand', country: 'Thailand', coordinates: { lat: 13.7563, lng: 100.5018 } },
        { name: 'Sydney, Australia', country: 'Australia', coordinates: { lat: -33.8688, lng: 151.2093 } }
      ];

      const trips = [];
      for (let i = 1; i <= count; i++) {
        const destination = destinations[i % destinations.length];
        const startDate = new Date(Date.now() + (Math.random() * 365 * 24 * 60 * 60 * 1000));
        const duration = Math.floor(Math.random() * 14) + 3; // 3-16 days
        const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
        const budget = Math.floor(Math.random() * 5000) + 1000;

        trips.push({
          title: `Trip to ${destination.name} ${i}`,
          description: `Exploring the beautiful city of ${destination.name}`,
          destination,
          dates: {
            start: startDate,
            end: endDate,
            flexible: Math.random() > 0.7
          },
          budget: {
            total: budget,
            currency: 'USD',
            breakdown: {
              accommodation: Math.floor(budget * 0.4),
              transportation: Math.floor(budget * 0.3),
              food: Math.floor(budget * 0.2),
              activities: Math.floor(budget * 0.1),
              miscellaneous: 0
            },
            spent: 0,
            remaining: budget
          },
          travelers: {
            adults: Math.floor(Math.random() * 4) + 1,
            children: Math.floor(Math.random() * 3),
            infants: 0
          },
          owner: userIds[i % userIds.length],
          collaborators: [],
          status: ['planning', 'booked', 'completed'][Math.floor(Math.random() * 3)],
          visibility: 'private',
          aiGenerated: {
            itinerary: {},
            budgetAnalysis: {},
            destinationInsights: {},
            travelCoordination: {},
            generatedAt: new Date(),
            agentVersions: {}
          },
          customizations: [],
          activityLog: [],
          bookings: [],
          tags: ['vacation', 'travel', destination.country.toLowerCase()],
          createdAt: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000)),
          updatedAt: new Date()
        });
      }

      return trips;
    } catch (error) {
      console.error('❌ Failed to generate test trips:', error.message);
      throw error;
    }
  }

  /**
   * Create seed file template
   */
  async createSeedFile(name, order = 1) {
    try {
      const filename = `${order.toString().padStart(3, '0')}_${name.replace(/\s+/g, '_').toLowerCase()}.js`;
      const filePath = path.join(this.seedsPath, filename);

      const template = `/**
 * Seed: ${name}
 * Order: ${order}
 * Created: ${new Date().toISOString()}
 */

// Environments where this seed should run
const environments = ['development', 'test'];

// Whether this seed is required (will stop seeding if it fails)
const required = false;

// Description of what this seed does
const description = '${name} seed data';

/**
 * Execute seed
 * @param {Object} db - MongoDB database connection
 */
async function seed(db) {
  console.log('Running seed: ${name}');
  
  // Add your seeding logic here
  // Example:
  // const users = [
  //   { name: 'John Doe', email: 'john@example.com' },
  //   { name: 'Jane Smith', email: 'jane@example.com' }
  // ];
  // 
  // await db.collection('users').insertMany(users);
  // console.log(\`Inserted \${users.length} users\`);
}

module.exports = {
  seed,
  environments,
  required,
  description
};
`;

      await fs.writeFile(filePath, template);
      console.log(`✅ Seed file created: ${filename}`);
      
      return {
        order,
        filename,
        path: filePath
      };
    } catch (error) {
      console.error('❌ Failed to create seed file:', error.message);
      throw error;
    }
  }
}

module.exports = SeedManager;