const mongoose = require('mongoose');
const AIConfigLoader = require('./ai/configLoader');

// Import models (will be loaded after connection is established)
let User, Trip;

/**
 * Enhanced Database utility functions for Wayra backend
 * Provides MongoDB connection management with Mongoose, connection pooling,
 * error handling, health checks, and retry mechanisms
 */

class DatabaseUtils {
  static connection = null;
  static connectionState = 'disconnected';
  static retryCount = 0;
  static maxRetries = null; // Will be loaded from config
  static retryDelay = null; // Will be loaded from config
  static healthCheckInterval = null;

  /**
   * Configure MongoDB connection with optimized settings from ConfigLoader
   * @returns {Object} Mongoose connection options
   */
  static getConnectionOptions() {
    const config = AIConfigLoader.loadConfig();
    const dbConfig = config.database;
    
    return {
      // Connection pooling settings
      maxPoolSize: dbConfig.maxPoolSize, // Maximum number of connections in the pool
      minPoolSize: dbConfig.minPoolSize,  // Minimum number of connections in the pool
      maxIdleTimeMS: dbConfig.maxIdleTimeMS, // Close connections after inactivity
      
      // Timeout settings
      serverSelectionTimeoutMS: dbConfig.serverSelectionTimeoutMS, // How long to try selecting a server
      socketTimeoutMS: dbConfig.socketTimeoutMS, // How long a send or receive on a socket can take
      connectTimeoutMS: dbConfig.connectTimeoutMS, // How long to wait for initial connection
      
      // Buffering settings
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      
      // Heartbeat settings
      heartbeatFrequencyMS: 10000, // Heartbeat frequency
      
      // Retry settings
      retryWrites: dbConfig.retryWrites,
      retryReads: dbConfig.retryReads,
      
      // Write concern
      w: 'majority',
      
      // Read preference
      readPreference: 'primary',
      
      // Application name for monitoring
      appName: 'wayra-backend'
    };
  }

  /**
   * Initialize MongoDB connection with retry mechanism
   * @returns {Promise<boolean>} Success status
   */
  static async connect() {
    try {
      const config = AIConfigLoader.loadConfig();
      const dbConfig = config.database;
      const mongoUri = dbConfig.mongoUri;
      
      // Load configuration values if not already loaded
      if (this.maxRetries === null) {
        this.maxRetries = dbConfig.maxRetries;
      }
      if (this.retryDelay === null) {
        this.retryDelay = dbConfig.retryDelayMS;
      }
      
      if (!mongoUri) {
        throw new Error('MongoDB URI not found in configuration');
      }

      console.log('🔄 Connecting to MongoDB...');
      
      // Set up connection event listeners
      this.setupConnectionEventListeners();
      
      // Connect with optimized options
      await mongoose.connect(mongoUri, this.getConnectionOptions());
      
      this.connection = mongoose.connection;
      this.connectionState = 'connected';
      this.retryCount = 0;
      
      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${this.connection.db.databaseName}`);
      console.log(`🔗 Host: ${this.connection.host}:${this.connection.port}`);
      
      // Start health check monitoring
      this.startHealthCheckMonitoring();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.connectionState = 'error';
      
      // Implement retry mechanism
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay/1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        console.error('❌ Max retry attempts reached. Database connection failed.');
        throw error;
      }
    }
  }

  /**
   * Set up MongoDB connection event listeners
   */
  static setupConnectionEventListeners() {
    // Connection opened
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
      this.connectionState = 'connected';
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error.message);
      this.connectionState = 'error';
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected from MongoDB');
      this.connectionState = 'disconnected';
      
      // Attempt to reconnect
      this.handleDisconnection();
    });

    // Connection reconnected
    mongoose.connection.on('reconnected', () => {
      console.log('✅ Mongoose reconnected to MongoDB');
      this.connectionState = 'connected';
      this.retryCount = 0;
    });

    // Process termination handlers
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Handle connection disconnection with retry logic
   */
  static async handleDisconnection() {
    if (this.connectionState === 'disconnected' && this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Attempting to reconnect (${this.retryCount}/${this.maxRetries})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ Reconnection failed:', error.message);
        });
      }, this.retryDelay * this.retryCount); // Exponential backoff
    }
  }

  /**
   * Start health check monitoring
   */
  static startHealthCheckMonitoring() {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Get health check interval from configuration
    const config = AIConfigLoader.loadConfig();
    const healthCheckInterval = config.database.healthCheckIntervalMS;

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.warn('⚠️ Health check failed:', error.message);
      }
    }, healthCheckInterval);
    
    console.log(`✅ Health check monitoring started (interval: ${healthCheckInterval/1000}s)`);
  }

  /**
   * Perform database health check
   * @returns {Promise<Object>} Health check results
   */
  static async performHealthCheck() {
    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      // Test database connectivity with a simple operation
      await mongoose.connection.db.admin().ping();
      
      // Get connection stats
      const stats = await mongoose.connection.db.stats();
      
      return {
        status: states[dbState],
        connected: dbState === 1,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        connectionPool: {
          current: mongoose.connection.db.serverConfig?.s?.pool?.totalConnectionCount || 0,
          available: mongoose.connection.db.serverConfig?.s?.pool?.availableConnectionCount || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Database health check error:', error.message);
      return {
        status: 'error',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown handler
   */
  static async gracefulShutdown() {
    console.log('🔄 Shutting down database connections...');
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    try {
      await mongoose.connection.close();
      console.log('✅ Database connections closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during database shutdown:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get current connection status
   * @returns {Object} Connection status information
   */
  static getConnectionStatus() {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      state: states[dbState],
      connected: dbState === 1,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.db?.databaseName,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }

  /**
   * Public health check method for API endpoints
   * @returns {Promise<Object>} Comprehensive health check results
   */
  static async healthCheck() {
    try {
      const healthData = await this.performHealthCheck();
      const connectionStatus = this.getConnectionStatus();
      
      return {
        ...healthData,
        connectionInfo: connectionStatus,
        features: {
          connectionPooling: true,
          healthMonitoring: this.healthCheckInterval !== null,
          retryMechanism: true,
          gracefulShutdown: true
        }
      };
    } catch (error) {
      console.error('❌ Public health check error:', error.message);
      return {
        status: 'error',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        connectionInfo: this.getConnectionStatus(),
        features: {
          connectionPooling: false,
          healthMonitoring: false,
          retryMechanism: false,
          gracefulShutdown: false
        }
      };
    }
  }
  /**
   * Initialize database connection and setup
   */
  static async initialize() {
    try {
      // First establish connection
      await this.connect();
      
      // Load models after connection is established
      User = require('../models/User');
      Trip = require('../models/Trip');
      
      // Create indexes asynchronously with timeout handling
      const indexPromises = [
        User.createIndexes().catch(err => console.warn('User indexes:', err.message)),
        Trip.createIndexes().catch(err => console.warn('Trip indexes:', err.message))
      ];
      
      // Wait for critical indexes with timeout
      await Promise.allSettled(indexPromises);
      
      console.log('✅ Database indexes initialization completed');
      return true;
    } catch (error) {
      console.warn('⚠️ Database initialization warning:', error.message);
      // Don't fail startup for index creation issues
      return true;
    }
  }

  /**
   * User Management Functions
   */
  static async createOrUpdateUser(firebaseUid, userData) {
    try {
      const user = await User.findOneAndUpdate(
        { firebaseUid },
        {
          ...userData,
          lastLoginAt: new Date()
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error creating/updating user:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserByFirebaseUid(firebaseUid) {
    try {
      const user = await User.findByFirebaseUid(firebaseUid)
        .populate('trips', 'title startDate endDate status')
        .lean();
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error fetching user:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUserPreferences(firebaseUid, preferences) {
    try {
      const user = await User.findOneAndUpdate(
        { firebaseUid },
        { $set: { preferences } },
        { new: true, runValidators: true }
      );
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error updating preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trip Management Functions
   */
  static async createTrip(ownerId, tripData) {
    try {
      const trip = new Trip({
        ...tripData,
        owner: ownerId
      });
      
      await trip.save();
      
      // Add trip to user's trips array
      await User.findByIdAndUpdate(
        ownerId,
        { $push: { trips: trip._id } }
      );
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error creating trip:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserTrips(userId) {
    try {
      const trips = await Trip.findUserTrips(userId)
        .sort({ createdAt: -1 })
        .lean();
      
      return { success: true, trips };
    } catch (error) {
      console.error('Database error fetching user trips:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTripById(tripId, userId) {
    try {
      const trip = await Trip.findOne({
        _id: tripId,
        $or: [
          { owner: userId },
          { 'collaborators.user': userId }
        ]
      })
      .populate('owner', 'displayName email photoURL')
      .populate('collaborators.user', 'displayName email photoURL')
      .lean();
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error fetching trip:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateTrip(tripId, userId, updateData) {
    try {
      const trip = await Trip.findOneAndUpdate(
        {
          _id: tripId,
          $or: [
            { owner: userId },
            { 'collaborators.user': userId, 'collaborators.role': 'editor' }
          ]
        },
        { 
          $set: updateData,
          'lastActivity.user': userId,
          'lastActivity.action': 'updated',
          'lastActivity.timestamp': new Date()
        },
        { new: true, runValidators: true }
      );
      
      if (!trip) {
        return { success: false, error: 'Trip not found or insufficient permissions' };
      }
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error updating trip:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteTrip(tripId, userId) {
    try {
      const trip = await Trip.findOneAndDelete({
        _id: tripId,
        owner: userId
      });
      
      if (!trip) {
        return { success: false, error: 'Trip not found or insufficient permissions' };
      }
      
      // Remove trip from user's trips array
      await User.findByIdAndUpdate(
        userId,
        { $pull: { trips: tripId } }
      );
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error deleting trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Collaboration Functions
   */
  static async addCollaborator(tripId, ownerId, collaboratorEmail, role = 'viewer') {
    try {
      const collaborator = await User.findByEmail(collaboratorEmail);
      if (!collaborator) {
        return { success: false, error: 'User not found' };
      }
      
      const trip = await Trip.findOneAndUpdate(
        { _id: tripId, owner: ownerId },
        {
          $addToSet: {
            collaborators: {
              user: collaborator._id,
              role,
              invitedBy: ownerId
            }
          }
        },
        { new: true }
      );
      
      if (!trip) {
        return { success: false, error: 'Trip not found or insufficient permissions' };
      }
      
      return { success: true, trip, collaborator };
    } catch (error) {
      console.error('Database error adding collaborator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analytics and Statistics
   */
  static async getUserStats(userId) {
    try {
      const stats = await Trip.aggregate([
        {
          $match: {
            $or: [
              { owner: mongoose.Types.ObjectId(userId) },
              { 'collaborators.user': mongoose.Types.ObjectId(userId) }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalBudget: { $sum: '$budget.total' },
            totalSpent: {
              $sum: {
                $add: [
                  '$budget.spent.accommodation',
                  '$budget.spent.transportation',
                  '$budget.spent.food',
                  '$budget.spent.activities',
                  '$budget.spent.shopping',
                  '$budget.spent.other'
                ]
              }
            }
          }
        }
      ]);
      
      return { 
        success: true, 
        stats: stats[0] || {
          totalTrips: 0,
          completedTrips: 0,
          totalBudget: 0,
          totalSpent: 0
        }
      };
    } catch (error) {
      console.error('Database error fetching user stats:', error);
      return { success: false, error: error.message };
    }
  }


}

module.exports = DatabaseUtils;
