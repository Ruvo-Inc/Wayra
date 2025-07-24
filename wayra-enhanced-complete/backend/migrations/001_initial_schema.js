/**
 * Migration: Initial Schema Setup
 * Version: 1
 * Created: 2025-01-23T00:00:00.000Z
 */

/**
 * Apply migration - Create initial collections and indexes
 * @param {Object} db - MongoDB database connection
 */
async function up(db) {
  console.log('Running migration: Initial Schema Setup');
  
  try {
    // Create users collection with validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['firebaseUid', 'email'],
          properties: {
            firebaseUid: {
              bsonType: 'string',
              description: 'Firebase UID is required'
            },
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: 'Valid email is required'
            },
            profile: {
              bsonType: 'object',
              properties: {
                displayName: { bsonType: 'string' },
                firstName: { bsonType: 'string' },
                lastName: { bsonType: 'string' },
                photoURL: { bsonType: 'string' }
              }
            },
            isActive: {
              bsonType: 'bool',
              description: 'User active status'
            }
          }
        }
      }
    });
    console.log('✅ Created users collection with validation');

    // Create trips collection with validation
    await db.createCollection('trips', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'owner'],
          properties: {
            title: {
              bsonType: 'string',
              minLength: 1,
              description: 'Trip title is required'
            },
            owner: {
              bsonType: 'objectId',
              description: 'Trip owner is required'
            },
            status: {
              bsonType: 'string',
              enum: ['planning', 'booked', 'completed', 'cancelled'],
              description: 'Trip status must be valid'
            },
            visibility: {
              bsonType: 'string',
              enum: ['private', 'shared', 'public'],
              description: 'Trip visibility must be valid'
            }
          }
        }
      }
    });
    console.log('✅ Created trips collection with validation');

    // Create basic indexes
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('trips').createIndex({ owner: 1, createdAt: -1 });
    
    console.log('✅ Created basic indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Rollback migration - Remove collections and indexes
 * @param {Object} db - MongoDB database connection
 */
async function down(db) {
  console.log('Rolling back migration: Initial Schema Setup');
  
  try {
    // Drop collections
    await db.collection('users').drop().catch(() => {});
    await db.collection('trips').drop().catch(() => {});
    
    console.log('✅ Dropped collections');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

module.exports = { up, down };