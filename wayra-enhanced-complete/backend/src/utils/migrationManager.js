const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

/**
 * Database Migration Manager for Wayra
 * Handles schema migrations, version tracking, and rollback capabilities
 */
class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../migrations');
    this.migrationCollection = 'migrations';
  }

  /**
   * Initialize migration tracking collection
   */
  async initializeMigrationTracking() {
    try {
      const db = mongoose.connection.db;
      
      // Create migrations collection if it doesn't exist
      const collections = await db.listCollections({ name: this.migrationCollection }).toArray();
      if (collections.length === 0) {
        await db.createCollection(this.migrationCollection);
        console.log('✅ Migration tracking collection created');
      }

      // Create index for migration tracking
      await db.collection(this.migrationCollection).createIndex({ version: 1 }, { unique: true });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize migration tracking:', error.message);
      throw error;
    }
  }

  /**
   * Get current database schema version
   */
  async getCurrentVersion() {
    try {
      const db = mongoose.connection.db;
      const latestMigration = await db.collection(this.migrationCollection)
        .findOne({}, { sort: { version: -1 } });
      
      return latestMigration ? latestMigration.version : 0;
    } catch (error) {
      console.error('❌ Failed to get current version:', error.message);
      return 0;
    }
  }

  /**
   * Get list of available migration files
   */
  async getAvailableMigrations() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const match = file.match(/^(\d+)_(.+)\.js$/);
          if (match) {
            return {
              version: parseInt(match[1]),
              name: match[2],
              filename: file,
              path: path.join(this.migrationsPath, file)
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.version - b.version);

      return migrationFiles;
    } catch (error) {
      console.error('❌ Failed to read migration files:', error.message);
      return [];
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    try {
      console.log('🔄 Starting database migrations...');
      
      await this.initializeMigrationTracking();
      const currentVersion = await this.getCurrentVersion();
      const availableMigrations = await this.getAvailableMigrations();
      
      const pendingMigrations = availableMigrations.filter(
        migration => migration.version > currentVersion
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return true;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
        
        try {
          // Load and execute migration
          const migrationModule = require(migration.path);
          
          if (typeof migrationModule.up !== 'function') {
            throw new Error(`Migration ${migration.filename} missing 'up' function`);
          }

          // Execute migration
          await migrationModule.up(mongoose.connection.db);

          // Record successful migration
          await this.recordMigration(migration);
          
          console.log(`✅ Migration ${migration.version} completed successfully`);
        } catch (error) {
          console.error(`❌ Migration ${migration.version} failed:`, error.message);
          throw error;
        }
      }

      console.log('✅ All migrations completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      throw error;
    }
  }

  /**
   * Rollback to specific version
   */
  async rollbackToVersion(targetVersion) {
    try {
      console.log(`🔄 Rolling back to version ${targetVersion}...`);
      
      const currentVersion = await this.getCurrentVersion();
      if (targetVersion >= currentVersion) {
        console.log('✅ Already at or below target version');
        return true;
      }

      const availableMigrations = await this.getAvailableMigrations();
      const migrationsToRollback = availableMigrations
        .filter(migration => migration.version > targetVersion && migration.version <= currentVersion)
        .sort((a, b) => b.version - a.version); // Reverse order for rollback

      for (const migration of migrationsToRollback) {
        console.log(`🔄 Rolling back migration ${migration.version}: ${migration.name}`);
        
        try {
          const migrationModule = require(migration.path);
          
          if (typeof migrationModule.down !== 'function') {
            console.warn(`⚠️ Migration ${migration.filename} missing 'down' function, skipping rollback`);
            continue;
          }

          // Execute rollback
          await migrationModule.down(mongoose.connection.db);

          // Remove migration record
          await this.removeMigrationRecord(migration);
          
          console.log(`✅ Migration ${migration.version} rolled back successfully`);
        } catch (error) {
          console.error(`❌ Rollback of migration ${migration.version} failed:`, error.message);
          throw error;
        }
      }

      console.log(`✅ Rollback to version ${targetVersion} completed`);
      return true;
    } catch (error) {
      console.error('❌ Rollback process failed:', error.message);
      throw error;
    }
  }

  /**
   * Record successful migration
   */
  async recordMigration(migration) {
    const db = mongoose.connection.db;
    await db.collection(this.migrationCollection).insertOne({
      version: migration.version,
      name: migration.name,
      filename: migration.filename,
      appliedAt: new Date(),
      checksum: await this.calculateFileChecksum(migration.path)
    });
  }

  /**
   * Remove migration record
   */
  async removeMigrationRecord(migration) {
    const db = mongoose.connection.db;
    await db.collection(this.migrationCollection).deleteOne({
      version: migration.version
    });
  }

  /**
   * Calculate file checksum for integrity checking
   */
  async calculateFileChecksum(filePath) {
    try {
      const crypto = require('crypto');
      const fileContent = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('md5').update(fileContent).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      const currentVersion = await this.getCurrentVersion();
      const availableMigrations = await this.getAvailableMigrations();
      const db = mongoose.connection.db;
      
      const appliedMigrations = await db.collection(this.migrationCollection)
        .find({})
        .sort({ version: 1 })
        .toArray();

      const pendingMigrations = availableMigrations.filter(
        migration => migration.version > currentVersion
      );

      return {
        currentVersion,
        totalMigrations: availableMigrations.length,
        appliedMigrations: appliedMigrations.length,
        pendingMigrations: pendingMigrations.length,
        appliedList: appliedMigrations.map(m => ({
          version: m.version,
          name: m.name,
          appliedAt: m.appliedAt
        })),
        pendingList: pendingMigrations.map(m => ({
          version: m.version,
          name: m.name
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get migration status:', error.message);
      throw error;
    }
  }

  /**
   * Create new migration file template
   */
  async createMigration(name) {
    try {
      const availableMigrations = await this.getAvailableMigrations();
      const nextVersion = availableMigrations.length > 0 
        ? Math.max(...availableMigrations.map(m => m.version)) + 1 
        : 1;

      const filename = `${nextVersion.toString().padStart(3, '0')}_${name.replace(/\s+/g, '_').toLowerCase()}.js`;
      const filePath = path.join(this.migrationsPath, filename);

      const template = `/**
 * Migration: ${name}
 * Version: ${nextVersion}
 * Created: ${new Date().toISOString()}
 */

/**
 * Apply migration
 * @param {Object} db - MongoDB database connection
 */
async function up(db) {
  console.log('Running migration: ${name}');
  
  // Add your migration logic here
  // Example:
  // await db.collection('users').createIndex({ email: 1 }, { unique: true });
  // await db.collection('trips').updateMany({}, { $set: { version: 2 } });
}

/**
 * Rollback migration
 * @param {Object} db - MongoDB database connection
 */
async function down(db) {
  console.log('Rolling back migration: ${name}');
  
  // Add your rollback logic here
  // Example:
  // await db.collection('users').dropIndex({ email: 1 });
  // await db.collection('trips').updateMany({}, { $unset: { version: 1 } });
}

module.exports = { up, down };
`;

      await fs.writeFile(filePath, template);
      console.log(`✅ Migration file created: ${filename}`);
      
      return {
        version: nextVersion,
        filename,
        path: filePath
      };
    } catch (error) {
      console.error('❌ Failed to create migration file:', error.message);
      throw error;
    }
  }
}

module.exports = MigrationManager;