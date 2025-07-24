const mongoose = require('mongoose');

/**
 * Database Index Manager for Wayra
 * Handles index creation, optimization, and performance monitoring
 */
class IndexManager {
  constructor() {
    this.indexes = new Map();
    this.loadIndexDefinitions();
  }

  /**
   * Load index definitions for all collections
   */
  loadIndexDefinitions() {
    // User collection indexes
    this.indexes.set('users', [
      {
        fields: { firebaseUid: 1 },
        options: { unique: true, name: 'firebaseUid_unique' }
      },
      {
        fields: { email: 1 },
        options: { unique: true, name: 'email_unique' }
      },
      {
        fields: { createdAt: -1 },
        options: { name: 'createdAt_desc' }
      },
      {
        fields: { lastLoginAt: -1 },
        options: { name: 'lastLoginAt_desc' }
      },
      {
        fields: { isActive: 1 },
        options: { name: 'isActive_asc' }
      },
      {
        fields: { 'profile.location.country': 1 },
        options: { name: 'location_country' }
      },
      {
        fields: { 'preferences.budgetRange.currency': 1 },
        options: { name: 'budget_currency' }
      }
    ]);

    // Trip collection indexes
    this.indexes.set('trips', [
      {
        fields: { owner: 1, createdAt: -1 },
        options: { name: 'owner_createdAt' }
      },
      {
        fields: { 'collaborators.userId': 1 },
        options: { name: 'collaborators_userId' }
      },
      {
        fields: { 'destination.name': 1 },
        options: { name: 'destination_name' }
      },
      {
        fields: { 'destination.country': 1 },
        options: { name: 'destination_country' }
      },
      {
        fields: { 'dates.start': 1, 'dates.end': 1 },
        options: { name: 'dates_range' }
      },
      {
        fields: { status: 1 },
        options: { name: 'status' }
      },
      {
        fields: { tags: 1 },
        options: { name: 'tags' }
      },
      {
        fields: { visibility: 1 },
        options: { name: 'visibility' }
      },
      {
        fields: { owner: 1, status: 1, createdAt: -1 },
        options: { name: 'owner_status_createdAt' }
      },
      {
        fields: { 'collaborators.userId': 1, status: 1 },
        options: { name: 'collaborators_status' }
      },
      {
        fields: { 'budget.total': 1 },
        options: { name: 'budget_total' }
      },
      {
        fields: { 'budget.currency': 1 },
        options: { name: 'budget_currency' }
      },
      {
        fields: { updatedAt: -1 },
        options: { name: 'updatedAt_desc' }
      }
    ]);

    // AI Interactions collection indexes (for future use)
    this.indexes.set('aiinteractions', [
      {
        fields: { userId: 1, createdAt: -1 },
        options: { name: 'userId_createdAt' }
      },
      {
        fields: { agentRole: 1 },
        options: { name: 'agentRole' }
      },
      {
        fields: { tripId: 1 },
        options: { name: 'tripId' }
      },
      {
        fields: { createdAt: -1 },
        options: { name: 'createdAt_desc' }
      }
    ]);

    // Migration tracking collection indexes
    this.indexes.set('migrations', [
      {
        fields: { version: 1 },
        options: { unique: true, name: 'version_unique' }
      },
      {
        fields: { appliedAt: -1 },
        options: { name: 'appliedAt_desc' }
      }
    ]);

    console.log(`📋 Loaded index definitions for ${this.indexes.size} collections`);
  }

  /**
   * Create all indexes for all collections
   */
  async createAllIndexes() {
    try {
      console.log('🔄 Creating database indexes...');
      const db = mongoose.connection.db;
      const results = [];

      for (const [collectionName, indexes] of this.indexes) {
        console.log(`📋 Creating indexes for collection: ${collectionName}`);
        
        try {
          const collection = db.collection(collectionName);
          const indexResults = await this.createCollectionIndexes(collection, indexes);
          results.push({
            collection: collectionName,
            success: true,
            indexes: indexResults
          });
          
          console.log(`✅ Created ${indexResults.length} indexes for ${collectionName}`);
        } catch (error) {
          console.error(`❌ Failed to create indexes for ${collectionName}:`, error.message);
          results.push({
            collection: collectionName,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Index creation completed: ${successCount}/${results.length} collections successful`);
      
      return results;
    } catch (error) {
      console.error('❌ Failed to create indexes:', error.message);
      throw error;
    }
  }

  /**
   * Create indexes for a specific collection
   */
  async createCollectionIndexes(collection, indexes) {
    const results = [];
    
    for (const indexDef of indexes) {
      try {
        const result = await collection.createIndex(indexDef.fields, indexDef.options);
        results.push({
          name: indexDef.options.name,
          fields: indexDef.fields,
          success: true,
          result
        });
      } catch (error) {
        // Skip if index already exists
        if (error.code === 85 || error.message.includes('already exists')) {
          results.push({
            name: indexDef.options.name,
            fields: indexDef.fields,
            success: true,
            result: 'already_exists'
          });
        } else {
          console.error(`❌ Failed to create index ${indexDef.options.name}:`, error.message);
          results.push({
            name: indexDef.options.name,
            fields: indexDef.fields,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Drop all indexes for a collection (except _id)
   */
  async dropCollectionIndexes(collectionName) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);
      
      // Get existing indexes
      const existingIndexes = await collection.listIndexes().toArray();
      const indexesToDrop = existingIndexes.filter(index => index.name !== '_id_');
      
      console.log(`🗑️ Dropping ${indexesToDrop.length} indexes from ${collectionName}`);
      
      for (const index of indexesToDrop) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (error) {
          console.error(`❌ Failed to drop index ${index.name}:`, error.message);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to drop indexes for ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get index statistics for all collections
   */
  async getIndexStats() {
    try {
      const db = mongoose.connection.db;
      const stats = {};

      for (const collectionName of this.indexes.keys()) {
        try {
          const collection = db.collection(collectionName);
          
          // Check if collection exists
          const collections = await db.listCollections({ name: collectionName }).toArray();
          if (collections.length === 0) {
            stats[collectionName] = {
              exists: false,
              indexes: []
            };
            continue;
          }

          // Get index information
          const indexes = await collection.listIndexes().toArray();
          const indexStats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          stats[collectionName] = {
            exists: true,
            totalIndexes: indexes.length,
            indexes: indexes.map(index => ({
              name: index.name,
              keys: index.key,
              unique: index.unique || false,
              sparse: index.sparse || false,
              size: indexStats.find(stat => stat.name === index.name)?.accesses?.ops || 0
            }))
          };
        } catch (error) {
          stats[collectionName] = {
            exists: false,
            error: error.message
          };
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get index stats:', error.message);
      throw error;
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQueryPerformance(collectionName, query, options = {}) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);

      // Explain the query
      const explanation = await collection.find(query, options).explain('executionStats');
      
      const analysis = {
        collection: collectionName,
        query,
        executionStats: explanation.executionStats,
        indexUsed: explanation.executionStats.executionStages?.indexName || 'COLLSCAN',
        documentsExamined: explanation.executionStats.totalDocsExamined,
        documentsReturned: explanation.executionStats.totalDocsReturned,
        executionTimeMs: explanation.executionStats.executionTimeMillis,
        isOptimal: explanation.executionStats.totalDocsExamined === explanation.executionStats.totalDocsReturned,
        suggestions: []
      };

      // Generate optimization suggestions
      if (analysis.indexUsed === 'COLLSCAN') {
        analysis.suggestions.push('Consider adding an index for this query pattern');
      }

      if (analysis.documentsExamined > analysis.documentsReturned * 10) {
        analysis.suggestions.push('Query examines too many documents, consider more selective indexes');
      }

      if (analysis.executionTimeMs > 100) {
        analysis.suggestions.push('Query execution time is high, consider index optimization');
      }

      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze query performance:', error.message);
      throw error;
    }
  }

  /**
   * Rebuild indexes for a collection
   */
  async rebuildCollectionIndexes(collectionName) {
    try {
      console.log(`🔄 Rebuilding indexes for ${collectionName}...`);
      
      // Drop existing indexes
      await this.dropCollectionIndexes(collectionName);
      
      // Recreate indexes
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);
      const indexes = this.indexes.get(collectionName) || [];
      
      const results = await this.createCollectionIndexes(collection, indexes);
      
      console.log(`✅ Rebuilt ${results.length} indexes for ${collectionName}`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to rebuild indexes for ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats() {
    try {
      const db = mongoose.connection.db;
      const usageStats = {};

      for (const collectionName of this.indexes.keys()) {
        try {
          const collection = db.collection(collectionName);
          
          // Check if collection exists
          const collections = await db.listCollections({ name: collectionName }).toArray();
          if (collections.length === 0) continue;

          const stats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          usageStats[collectionName] = stats.map(stat => ({
            name: stat.name,
            accesses: stat.accesses.ops,
            since: stat.accesses.since
          }));
        } catch (error) {
          console.warn(`⚠️ Could not get usage stats for ${collectionName}:`, error.message);
        }
      }

      return usageStats;
    } catch (error) {
      console.error('❌ Failed to get index usage stats:', error.message);
      throw error;
    }
  }
}

module.exports = IndexManager;