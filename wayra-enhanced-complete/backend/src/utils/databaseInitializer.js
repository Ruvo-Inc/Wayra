const DatabaseUtils = require('./database');
const MigrationManager = require('./migrationManager');
const SeedManager = require('./seedManager');
const IndexManager = require('./indexManager');
const BackupManager = require('./backupManager');

/**
 * Database Initialization System for Wayra
 * Orchestrates database setup, migrations, seeding, and maintenance
 */
class DatabaseInitializer {
  constructor() {
    this.migrationManager = new MigrationManager();
    this.seedManager = new SeedManager();
    this.indexManager = new IndexManager();
    this.backupManager = new BackupManager();
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Full database initialization
   */
  async initialize(options = {}) {
    try {
      console.log('🚀 Starting database initialization...');
      console.log(`📊 Environment: ${this.environment}`);
      
      const results = {
        connection: false,
        migrations: false,
        indexes: false,
        seeds: false,
        backup: false,
        errors: []
      };

      // 1. Establish database connection
      try {
        console.log('🔄 Step 1: Establishing database connection...');
        await DatabaseUtils.connect();
        results.connection = true;
        console.log('✅ Database connection established');
      } catch (error) {
        results.errors.push({ step: 'connection', error: error.message });
        throw error;
      }

      // 2. Run database migrations
      try {
        console.log('🔄 Step 2: Running database migrations...');
        await this.migrationManager.runMigrations();
        results.migrations = true;
        console.log('✅ Database migrations completed');
      } catch (error) {
        results.errors.push({ step: 'migrations', error: error.message });
        if (!options.continueOnError) throw error;
        console.warn('⚠️ Migration errors occurred, continuing...');
      }

      // 3. Create database indexes
      try {
        console.log('🔄 Step 3: Creating database indexes...');
        await this.indexManager.createAllIndexes();
        results.indexes = true;
        console.log('✅ Database indexes created');
      } catch (error) {
        results.errors.push({ step: 'indexes', error: error.message });
        if (!options.continueOnError) throw error;
        console.warn('⚠️ Index creation errors occurred, continuing...');
      }

      // 4. Initialize backup system
      try {
        console.log('🔄 Step 4: Initializing backup system...');
        await this.backupManager.initialize();
        results.backup = true;
        console.log('✅ Backup system initialized');
      } catch (error) {
        results.errors.push({ step: 'backup', error: error.message });
        if (!options.continueOnError) throw error;
        console.warn('⚠️ Backup initialization errors occurred, continuing...');
      }

      // 5. Run database seeds (development only)
      if (this.environment === 'development' && options.runSeeds !== false) {
        try {
          console.log('🔄 Step 5: Running database seeds...');
          await this.seedManager.initialize();
          await this.seedManager.runSeeds();
          results.seeds = true;
          console.log('✅ Database seeds completed');
        } catch (error) {
          results.errors.push({ step: 'seeds', error: error.message });
          if (!options.continueOnError) throw error;
          console.warn('⚠️ Seeding errors occurred, continuing...');
        }
      } else {
        console.log('⏭️ Skipping database seeds (not development environment)');
        results.seeds = true;
      }

      // Summary
      const successCount = Object.values(results).filter(v => v === true).length;
      const totalSteps = Object.keys(results).filter(k => k !== 'errors').length;
      
      console.log('🎉 Database initialization completed!');
      console.log(`📊 Success: ${successCount}/${totalSteps} steps`);
      
      if (results.errors.length > 0) {
        console.log(`⚠️ Errors: ${results.errors.length}`);
        results.errors.forEach(err => {
          console.log(`   - ${err.step}: ${err.error}`);
        });
      }

      return results;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Quick setup for development
   */
  async quickSetup() {
    try {
      console.log('⚡ Running quick development setup...');
      
      // Connect to database
      await DatabaseUtils.connect();
      
      // Create essential indexes only
      await this.indexManager.createAllIndexes();
      
      // Run migrations
      await this.migrationManager.runMigrations();
      
      console.log('✅ Quick setup completed');
      return true;
    } catch (error) {
      console.error('❌ Quick setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Reset database (development only)
   */
  async resetDatabase(options = {}) {
    try {
      if (this.environment === 'production') {
        throw new Error('Database reset is not allowed in production');
      }

      console.log('🔄 Resetting database...');
      
      // Create backup before reset if requested
      if (options.createBackup) {
        console.log('💾 Creating backup before reset...');
        await this.backupManager.createBackup({
          name: `pre_reset_${new Date().toISOString().replace(/[:.]/g, '-')}`
        });
      }

      // Clear all data
      await this.seedManager.clearDatabase();
      
      // Recreate indexes
      await this.indexManager.createAllIndexes();
      
      // Run migrations
      await this.migrationManager.runMigrations();
      
      // Reseed if requested
      if (options.reseed !== false) {
        await this.seedManager.runSeeds();
      }

      console.log('✅ Database reset completed');
      return true;
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getStatus() {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        environment: this.environment,
        database: {
          connected: false,
          health: null
        },
        migrations: {
          current: 0,
          available: 0,
          pending: 0
        },
        indexes: {},
        backups: []
      };

      // Database connection status
      try {
        status.database.health = await DatabaseUtils.healthCheck();
        status.database.connected = status.database.health.connected;
      } catch (error) {
        status.database.error = error.message;
      }

      // Migration status
      try {
        const migrationStatus = await this.migrationManager.getMigrationStatus();
        status.migrations = migrationStatus;
      } catch (error) {
        status.migrations.error = error.message;
      }

      // Index status
      try {
        status.indexes = await this.indexManager.getIndexStats();
      } catch (error) {
        status.indexes.error = error.message;
      }

      // Backup status
      try {
        status.backups = await this.backupManager.listBackups();
      } catch (error) {
        status.backups = { error: error.message };
      }

      return status;
    } catch (error) {
      console.error('❌ Failed to get system status:', error.message);
      throw error;
    }
  }

  /**
   * Maintenance operations
   */
  async runMaintenance() {
    try {
      console.log('🔧 Running database maintenance...');
      
      const results = {
        indexOptimization: false,
        backupCleanup: false,
        healthCheck: false
      };

      // Index optimization
      try {
        console.log('🔄 Optimizing indexes...');
        const indexStats = await this.indexManager.getIndexUsageStats();
        
        // Log unused indexes
        for (const [collection, stats] of Object.entries(indexStats)) {
          const unusedIndexes = stats.filter(stat => stat.accesses === 0);
          if (unusedIndexes.length > 0) {
            console.log(`⚠️ Unused indexes in ${collection}:`, unusedIndexes.map(i => i.name));
          }
        }
        
        results.indexOptimization = true;
      } catch (error) {
        console.error('❌ Index optimization failed:', error.message);
      }

      // Backup cleanup (keep last 10 backups in development)
      if (this.environment === 'development') {
        try {
          console.log('🔄 Cleaning up old backups...');
          const backups = await this.backupManager.listBackups();
          
          if (backups.length > 10) {
            const oldBackups = backups.slice(10);
            for (const backup of oldBackups) {
              await this.backupManager.deleteBackup(backup.name);
              console.log(`🗑️ Deleted old backup: ${backup.name}`);
            }
          }
          
          results.backupCleanup = true;
        } catch (error) {
          console.error('❌ Backup cleanup failed:', error.message);
        }
      }

      // Health check
      try {
        console.log('🔄 Running health check...');
        const health = await DatabaseUtils.healthCheck();
        console.log(`💚 Database health: ${health.status}`);
        results.healthCheck = true;
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }

      console.log('✅ Maintenance completed');
      return results;
    } catch (error) {
      console.error('❌ Maintenance failed:', error.message);
      throw error;
    }
  }
}

module.exports = DatabaseInitializer;