/**
 * Seed: Development Users
 * Order: 1
 * Created: 2025-01-23T00:00:00.000Z
 */

// Environments where this seed should run
const environments = ['development', 'test'];

// Whether this seed is required (will stop seeding if it fails)
const required = true;

// Description of what this seed does
const description = 'Creates development test users for local testing';

/**
 * Execute seed - Create development users
 * @param {Object} db - MongoDB database connection
 */
async function seed(db) {
  console.log('Running seed: Development Users');
  
  try {
    // Check if users already exist
    const existingUsers = await db.collection('users').countDocuments();
    if (existingUsers > 0) {
      console.log(`⏭️ Skipping user creation - ${existingUsers} users already exist`);
      return;
    }

    const users = [
      {
        firebaseUid: 'dev-user-1',
        email: 'john.doe@wayra.dev',
        profile: {
          displayName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
          phoneNumber: '+1-555-0101',
          location: {
            country: 'USA',
            city: 'San Francisco',
            timezone: 'America/Los_Angeles'
          }
        },
        preferences: {
          budgetRange: {
            min: 1000,
            max: 3000,
            currency: 'USD'
          },
          travelStyle: ['adventure', 'cultural'],
          interests: ['food', 'culture', 'nature', 'adventure'],
          accommodationPreferences: ['hotel', 'airbnb'],
          transportationPreferences: ['flight', 'train'],
          dietaryRestrictions: [],
          accessibility: []
        },
        settings: {
          notifications: {
            email: true,
            push: true,
            tripUpdates: true,
            priceAlerts: true
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
          tripsPlanned: 5,
          tripsCompleted: 3,
          totalBudgetSaved: 1200,
          favoriteDestinations: ['Paris', 'Tokyo'],
          averageTripDuration: 8
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      },
      {
        firebaseUid: 'dev-user-2',
        email: 'jane.smith@wayra.dev',
        profile: {
          displayName: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
          phoneNumber: '+1-555-0102',
          location: {
            country: 'Canada',
            city: 'Toronto',
            timezone: 'America/Toronto'
          }
        },
        preferences: {
          budgetRange: {
            min: 800,
            max: 2500,
            currency: 'CAD'
          },
          travelStyle: ['luxury', 'relaxation'],
          interests: ['food', 'relaxation', 'culture'],
          accommodationPreferences: ['hotel', 'resort'],
          transportationPreferences: ['flight'],
          dietaryRestrictions: ['vegetarian'],
          accessibility: []
        },
        settings: {
          notifications: {
            email: true,
            push: false,
            tripUpdates: true,
            priceAlerts: false
          },
          privacy: {
            profileVisibility: 'friends',
            tripVisibility: 'private',
            allowInvitations: true
          },
          ai: {
            personalizationEnabled: true,
            dataUsageConsent: true,
            learningFromHistory: true
          }
        },
        stats: {
          tripsPlanned: 3,
          tripsCompleted: 2,
          totalBudgetSaved: 800,
          favoriteDestinations: ['Bali', 'Maldives'],
          averageTripDuration: 10
        },
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date(),
        lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        isActive: true
      },
      {
        firebaseUid: 'dev-user-3',
        email: 'alex.wilson@wayra.dev',
        profile: {
          displayName: 'Alex Wilson',
          firstName: 'Alex',
          lastName: 'Wilson',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
          phoneNumber: '+44-20-7946-0958',
          location: {
            country: 'UK',
            city: 'London',
            timezone: 'Europe/London'
          }
        },
        preferences: {
          budgetRange: {
            min: 600,
            max: 1800,
            currency: 'GBP'
          },
          travelStyle: ['budget', 'adventure'],
          interests: ['adventure', 'nature', 'culture'],
          accommodationPreferences: ['hostel', 'airbnb'],
          transportationPreferences: ['train', 'bus'],
          dietaryRestrictions: [],
          accessibility: []
        },
        settings: {
          notifications: {
            email: true,
            push: true,
            tripUpdates: true,
            priceAlerts: true
          },
          privacy: {
            profileVisibility: 'public',
            tripVisibility: 'public',
            allowInvitations: true
          },
          ai: {
            personalizationEnabled: true,
            dataUsageConsent: true,
            learningFromHistory: true
          }
        },
        stats: {
          tripsPlanned: 8,
          tripsCompleted: 6,
          totalBudgetSaved: 2100,
          favoriteDestinations: ['Barcelona', 'Prague', 'Budapest'],
          averageTripDuration: 5
        },
        createdAt: new Date('2023-11-10'),
        updatedAt: new Date(),
        lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        isActive: true
      }
    ];

    const result = await db.collection('users').insertMany(users);
    console.log(`✅ Inserted ${result.insertedCount} development users`);
    
    // Log created users for reference
    users.forEach(user => {
      console.log(`   - ${user.profile.displayName} (${user.email})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to create development users:', error.message);
    throw error;
  }
}

module.exports = {
  seed,
  environments,
  required,
  description
};