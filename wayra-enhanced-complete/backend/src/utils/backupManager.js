const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * Database Backup and Restore Manager for Wayra
 * Handles database backups, restores, and data export/import for development
 */
class BackupManager {
  constructor() {
    this.backupPath = path.join(__dirname, '../../backups');
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupPath, { recursive: true });
      console.log('✅ Backup manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize backup manager:', error.message);
      throw error;
    }
  }

  /**
   * Create full database backup using mongodump
   */
  async createBackup(options = {}) {
    try {
      if (this.environment === 'production' && !options.allowProduction) {
        throw new Error('Production backups require explicit allowProduction flag');
      }

      console.log('🔄 Creating database backup...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = options.name || `backup_${timestamp}`;
      const backupDir = path.join(this.backupPath, backupName);
      
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      // Get MongoDB connection details
      const mongoUri = mongoose.connection.client.s.url;
      const dbName = mongoose.connection.db.databaseName;

      // Create backup using mongodump
      const dumpResult = await this.executeMongoDump(mongoUri, dbName, backupDir);
      
      // Create metadata file
      const metadata = {
        name: backupName,
        timestamp: new Date().toISOString(),
        environment: this.environment,
        database: dbName,
        collections: await this.getCollectionStats(),
        size: await this.getDirectorySize(backupDir),
        mongoUri: mongoUri.replace(/\/\/[^@]+@/, '//***:***@'), // Hide credentials
        version: await this.getDatabaseVersion()
      };

      await fs.writeFile(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Backup created successfully: ${backupName}`);
      console.log(`📁 Location: ${backupDir}`);
      console.log(`📊 Size: ${this.formatBytes(metadata.size)}`);
      
      return {
        success: true,
        name: backupName,
        path: backupDir,
        metadata
      };
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Restore database from backup using mongorestore
   */
  async restoreBackup(backupName, options = {}) {
    try {
      if (this.environment === 'production' && !options.allowProduction) {
        throw new Error('Production restores require explicit allowProduction flag');
      }

      console.log(`🔄 Restoring database from backup: ${backupName}`);
      
      const backupDir = path.join(this.backupPath, backupName);
      
      // Check if backup exists
      try {
        await fs.access(backupDir);
      } catch (error) {
        throw new Error(`Backup not found: ${backupName}`);
      }

      // Load backup metadata
      const metadataPath = path.join(backupDir, 'metadata.json');
      let metadata = {};
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataContent);
      } catch (error) {
        console.warn('⚠️ Could not load backup metadata');
      }

      // Get MongoDB connection details
      const mongoUri = mongoose.connection.client.s.url;
      const dbName = mongoose.connection.db.databaseName;

      // Drop existing database if requested
      if (options.dropExisting) {
        console.log('🗑️ Dropping existing database...');
        await mongoose.connection.db.dropDatabase();
      }

      // Restore using mongorestore
      const restoreResult = await this.executeMongoRestore(mongoUri, dbName, backupDir);
      
      console.log(`✅ Database restored successfully from: ${backupName}`);
      console.log(`📊 Restored ${metadata.collections?.length || 'unknown'} collections`);
      
      return {
        success: true,
        backupName,
        metadata,
        restoreResult
      };
    } catch (error) {
      console.error('❌ Database restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Export collection data to JSON
   */
  async exportCollection(collectionName, options = {}) {
    try {
      console.log(`📤 Exporting collection: ${collectionName}`);
      
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);
      
      // Build query
      const query = options.query || {};
      const projection = options.projection || {};
      const limit = options.limit || 0;
      
      // Get data
      let cursor = collection.find(query, { projection });
      if (limit > 0) {
        cursor = cursor.limit(limit);
      }
      
      const documents = await cursor.toArray();
      
      // Create export file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${collectionName}_export_${timestamp}.json`;
      const filePath = path.join(this.backupPath, filename);
      
      const exportData = {
        collection: collectionName,
        exportedAt: new Date().toISOString(),
        query,
        projection,
        count: documents.length,
        documents
      };
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
      
      console.log(`✅ Collection exported: ${filename}`);
      console.log(`📊 Documents: ${documents.length}`);
      console.log(`📁 File: ${filePath}`);
      
      return {
        success: true,
        filename,
        path: filePath,
        count: documents.length
      };
    } catch (error) {
      console.error(`❌ Collection export failed for ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Import collection data from JSON
   */
  async importCollection(filePath, options = {}) {
    try {
      console.log(`📥 Importing collection from: ${filePath}`);
      
      // Read import file
      const fileContent = await fs.readFile(filePath, 'utf8');
      const importData = JSON.parse(fileContent);
      
      if (!importData.collection || !importData.documents) {
        throw new Error('Invalid import file format');
      }
      
      const db = mongoose.connection.db;
      const collection = db.collection(importData.collection);
      
      // Clear existing data if requested
      if (options.clearExisting) {
        console.log(`🗑️ Clearing existing data in ${importData.collection}`);
        await collection.deleteMany({});
      }
      
      // Insert documents
      if (importData.documents.length > 0) {
        const result = await collection.insertMany(importData.documents, {
          ordered: false // Continue on duplicate key errors
        });
        
        console.log(`✅ Collection imported: ${importData.collection}`);
        console.log(`📊 Documents inserted: ${result.insertedCount}`);
        
        return {
          success: true,
          collection: importData.collection,
          inserted: result.insertedCount,
          total: importData.documents.length
        };
      } else {
        console.log(`⚠️ No documents to import for ${importData.collection}`);
        return {
          success: true,
          collection: importData.collection,
          inserted: 0,
          total: 0
        };
      }
    } catch (error) {
      console.error('❌ Collection import failed:', error.message);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backups = [];
      const entries = await fs.readdir(this.backupPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const backupDir = path.join(this.backupPath, entry.name);
          const metadataPath = path.join(backupDir, 'metadata.json');
          
          let metadata = {
            name: entry.name,
            timestamp: null,
            size: 0,
            collections: []
          };
          
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            metadata = { ...metadata, ...JSON.parse(metadataContent) };
          } catch (error) {
            // Use directory stats if metadata not available
            const stats = await fs.stat(backupDir);
            metadata.timestamp = stats.mtime.toISOString();
            metadata.size = await this.getDirectorySize(backupDir);
          }
          
          backups.push(metadata);
        }
      }
      
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      return [];
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupName) {
    try {
      if (this.environment === 'production') {
        throw new Error('Backup deletion not allowed in production');
      }

      const backupDir = path.join(this.backupPath, backupName);
      
      // Check if backup exists
      try {
        await fs.access(backupDir);
      } catch (error) {
        throw new Error(`Backup not found: ${backupName}`);
      }

      // Remove backup directory
      await fs.rm(backupDir, { recursive: true, force: true });
      
      console.log(`✅ Backup deleted: ${backupName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete backup ${backupName}:`, error.message);
      throw error;
    }
  }

  /**
   * Execute mongodump command
   */
  async executeMongoDump(mongoUri, dbName, outputDir) {
    return new Promise((resolve, reject) => {
      const args = [
        '--uri', mongoUri,
        '--db', dbName,
        '--out', outputDir
      ];

      const mongodump = spawn('mongodump', args);
      let output = '';
      let error = '';

      mongodump.stdout.on('data', (data) => {
        output += data.toString();
      });

      mongodump.stderr.on('data', (data) => {
        error += data.toString();
      });

      mongodump.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`mongodump failed with code ${code}: ${error}`));
        }
      });

      mongodump.on('error', (err) => {
        reject(new Error(`Failed to start mongodump: ${err.message}`));
      });
    });
  }

  /**
   * Execute mongorestore command
   */
  async executeMongoRestore(mongoUri, dbName, inputDir) {
    return new Promise((resolve, reject) => {
      const args = [
        '--uri', mongoUri,
        '--db', dbName,
        '--drop', // Drop collections before restoring
        path.join(inputDir, dbName)
      ];

      const mongorestore = spawn('mongorestore', args);
      let output = '';
      let error = '';

      mongorestore.stdout.on('data', (data) => {
        output += data.toString();
      });

      mongorestore.stderr.on('data', (data) => {
        error += data.toString();
      });

      mongorestore.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`mongorestore failed with code ${code}: ${error}`));
        }
      });

      mongorestore.on('error', (err) => {
        reject(new Error(`Failed to start mongorestore: ${err.message}`));
      });
    });
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const stats = [];

      for (const collection of collections) {
        try {
          const collStats = await db.collection(collection.name).stats();
          stats.push({
            name: collection.name,
            count: collStats.count,
            size: collStats.size,
            avgObjSize: collStats.avgObjSize
          });
        } catch (error) {
          stats.push({
            name: collection.name,
            error: error.message
          });
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get collection stats:', error.message);
      return [];
    }
  }

  /**
   * Get database version
   */
  async getDatabaseVersion() {
    try {
      const db = mongoose.connection.db;
      const buildInfo = await db.admin().buildInfo();
      return buildInfo.version;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get directory size
   */
  async getDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = BackupManager;