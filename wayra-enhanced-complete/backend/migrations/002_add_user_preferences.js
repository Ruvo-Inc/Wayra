/**
 * Migration: Add User Preferences Schema
 * Version: 2
 * Created: 2025-01-23T00:00:00.000Z
 */

/**
 * Apply migration - Add user preferences and settings
 * @param {Object} db - MongoDB database connection
 */
async function up(db) {
  console.log('Running migration: Add User Preferences Schema');
  
  try {
    // Update existing users to have default preferences
    const defaultPreferences = {
      budgetRange: {
        min: 500,
        max: 2000,
        currency: 'USD'
      },
      travelStyle: ['budget'],
      interests: [],
      accommodationPreferences: [],
      transportationPreferences: [],
      dietaryRestrictions: [],
      accessibility: []
    };

    const defaultSettings = {
      notifications: {
        email: true,
        push: true,
        tripUpdates: true,
        priceAlerts: false
      },
      privacy: {
        profileVisibility: 'public',
        tripVisibility: 'private',
        allowInvitations: true
      },
      ai: {
        personalizationEnabled: true,
        dataUsageConsent: false,
        learningFromHistory: true
      }
    };

    const defaultStats = {
      tripsPlanned: 0,
      tripsCompleted: 0,
      totalBudgetSaved: 0,
      favoriteDestinations: [],
      averageTripDuration: 7
    };

    // Update all existing users
    const result = await db.collection('users').updateMany(
      { preferences: { $exists: false } },
      {
        $set: {
          preferences: defaultPreferences,
          settings: defaultSettings,
          stats: defaultStats,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with default preferences`);

    // Add indexes for preferences
    await db.collection('users').createIndex({ 'preferences.budgetRange.currency': 1 });
    await db.collection('users').createIndex({ 'preferences.travelStyle': 1 });
    
    console.log('✅ Added preference indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Rollback migration - Remove preferences from users
 * @param {Object} db - MongoDB database connection
 */
async function down(db) {
  console.log('Rolling back migration: Add User Preferences Schema');
  
  try {
    // Remove preferences, settings, and stats fields
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          preferences: 1,
          settings: 1,
          stats: 1
        }
      }
    );

    // Drop preference indexes
    await db.collection('users').dropIndex({ 'preferences.budgetRange.currency': 1 }).catch(() => {});
    await db.collection('users').dropIndex({ 'preferences.travelStyle': 1 }).catch(() => {});
    
    console.log('✅ Removed user preferences and indexes');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

module.exports = { up, down };