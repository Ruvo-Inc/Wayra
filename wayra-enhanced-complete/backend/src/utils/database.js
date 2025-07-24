const mongoose = require('mongoose');
const { configLoader } = require('../config/configLoader');

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
   * Configure MongoDB connection with simplified, compatible settings
   * @returns {Object} Mongoose connection options
   */
  static getConnectionOptions() {
    return {
      // Basic connection settings that are guaranteed to work with Mongoose 8.x
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    };
  }

  /**
   * Initialize MongoDB connection with retry mechanism
   * @returns {Promise<boolean>} Success status
   */
  static async connect() {
    try {
      const config = configLoader.getDatabaseConfig();
      const mongoUri = config.mongoUri || process.env.MONGODB_URI;
      
      // Load configuration values if not already loaded
      if (this.maxRetries === null) {
        this.maxRetries = config.maxRetries || 5;
      }
      if (this.retryDelay === null) {
        this.retryDelay = config.retryDelayMS || 5000;
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
    const config = configLoader.getDatabaseConfig();
    const healthCheckInterval = config.healthCheckIntervalMS || 30000;

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
      try {
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
      } catch (modelError) {
        console.warn('⚠️ Models not found, continuing without index creation:', modelError.message);
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Database initialization warning:', error.message);
      // Don't fail startup for database connection issues
      return false;
    }
  }

  /**
   * User Management Functions (will be implemented when User model exists)
   */
  static async createOrUpdateUser(firebaseUid, userData) {
    try {
      if (!User) {
        throw new Error('User model not loaded');
      }
      
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
      if (!User) {
        throw new Error('User model not loaded');
      }
      
      const user = await User.findOne({ firebaseUid })
        .populate('trips', 'title startDate endDate status')
        .lean();
      
      return { success: true, user };
    } catch (error) {
      console.error('Database error fetching user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trip Management Functions (will be implemented when Trip model exists)
   */
  static async createTrip(ownerId, tripData) {
    try {
      if (!Trip) {
        throw new Error('Trip model not loaded');
      }
      
      const trip = new Trip({
        ...tripData,
        owner: ownerId
      });
      
      await trip.save();
      
      return { success: true, trip };
    } catch (error) {
      console.error('Database error creating trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analytics and Statistics
   */
  static async getUserStats(userId) {
    try {
      if (!Trip) {
        throw new Error('Trip model not loaded');
      }
      
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