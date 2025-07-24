const { createClient } = require('redis');
const { configLoader } = require('../config/configLoader');

/**
 * Enhanced Redis utility functions for Wayra backend
 * Provides comprehensive caching, session management, and real-time collaboration support
 * with health monitoring, connection pooling, and cache invalidation strategies
 */

class RedisUtils {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    this.healthCheckInterval = null;
    this.connectionOptions = null;
  }

  /**
   * Get Redis connection configuration from environment variables
   * Uses existing environment variables as specified in task requirements
   * @returns {Object} Redis connection options
   */
  getConnectionOptions() {
    if (this.connectionOptions) {
      return this.connectionOptions;
    }

    const config = configLoader.getRedisConfig();
    
    // Support both REDIS_URL and individual components
    if (process.env.REDIS_URL) {
      const url = new URL(process.env.REDIS_URL);
      this.connectionOptions = {
        username: url.username || 'default',
        password: url.password,
        socket: {
          host: url.hostname,
          port: parseInt(url.port),
          connectTimeout: config.connectTimeoutMS || 10000,
          commandTimeout: config.commandTimeoutMS || 5000,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              return new Error('Max retry attempts reached');
            }
            return Math.min(retries * 1000, 3000);
          }
        }
      };
    } else {
      // Use individual environment variables from existing configuration
      this.connectionOptions = {
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          connectTimeout: config.connectTimeoutMS || 10000,
          commandTimeout: config.commandTimeoutMS || 5000,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              return new Error('Max retry attempts reached');
            }
            return Math.min(retries * 1000, 3000);
          }
        }
      };
    }

    console.log(`🔧 Redis Configuration: ${this.connectionOptions.socket.host}:${this.connectionOptions.socket.port}`);
    return this.connectionOptions;
  }

  /**
   * Initialize Redis connection with retry mechanism and health monitoring
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      const options = this.getConnectionOptions();
      
      console.log('🔄 Connecting to Redis...');
      console.log(`📍 Host: ${options.socket.host}:${options.socket.port}`);

      // Create main client
      this.client = createClient(options);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Connect to Redis
      await this.client.connect();
      
      this.isConnected = true;
      this.connectionState = 'connected';
      this.retryCount = 0;
      
      console.log('✅ Redis connected successfully');
      
      // Create separate clients for pub/sub
      await this.initializePubSub();
      
      // Start health check monitoring
      this.startHealthCheckMonitoring();
      
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.connectionState = 'error';
      this.isConnected = false;
      
      // Implement retry mechanism
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying Redis connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay/1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.initialize();
      } else {
        console.error('❌ Max Redis retry attempts reached. Continuing without Redis...');
        return false;
      }
    }
  }

  /**
   * Initialize separate clients for pub/sub operations
   */
  async initializePubSub() {
    try {
      const options = this.getConnectionOptions();
      
      // Create publisher client
      this.publisher = createClient(options);
      await this.publisher.connect();
      
      // Create subscriber client
      this.subscriber = createClient(options);
      await this.subscriber.connect();
      
      console.log('✅ Redis pub/sub clients initialized');
    } catch (error) {
      console.warn('⚠️ Redis pub/sub initialization failed:', error.message);
    }
  }

  /**
   * Set up Redis connection event listeners
   */
  setupEventListeners() {
    // Connection events
    this.client.on('connect', () => {
      console.log('✅ Redis client connected');
      this.isConnected = true;
      this.connectionState = 'connected';
    });

    this.client.on('ready', () => {
      console.log('✅ Redis client ready');
      this.connectionState = 'ready';
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis client error:', error.message);
      this.isConnected = false;
      this.connectionState = 'error';
    });

    this.client.on('end', () => {
      console.log('⚠️ Redis client connection ended');
      this.isConnected = false;
      this.connectionState = 'disconnected';
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
      this.connectionState = 'reconnecting';
    });

    // Process termination handlers
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Start health check monitoring
   */
  startHealthCheckMonitoring() {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Get health check interval from configuration
    const config = configLoader.getRedisConfig();
    const healthCheckInterval = config.healthCheckIntervalMS || 30000;

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.warn('⚠️ Redis health check failed:', error.message);
      }
    }, healthCheckInterval);
    
    console.log(`✅ Redis health check monitoring started (interval: ${healthCheckInterval/1000}s)`);
  }

  /**
   * Perform Redis health check
   * @returns {Promise<Object>} Health check results
   */
  async performHealthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          connected: false,
          timestamp: new Date().toISOString()
        };
      }
      
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      // Get Redis info
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      
      const serverInfo = await this.client.info('server');
      const versionMatch = serverInfo.match(/redis_version:(.+)/);
      const version = versionMatch ? versionMatch[1].trim() : 'unknown';
      
      return {
        status: 'connected',
        connected: true,
        latency: `${latency}ms`,
        memory,
        version,
        connectionState: this.connectionState,
        retryCount: this.retryCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Redis health check error:', error.message);
      return {
        status: 'error',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Public health check method for API endpoints
   * @returns {Promise<Object>} Comprehensive health check results
   */
  async healthCheck() {
    try {
      const healthData = await this.performHealthCheck();
      
      return {
        ...healthData,
        features: {
          caching: true,
          sessionManagement: true,
          pubSub: this.publisher && this.subscriber,
          healthMonitoring: this.healthCheckInterval !== null,
          retryMechanism: true,
          gracefulShutdown: true
        }
      };
    } catch (error) {
      console.error('❌ Redis public health check error:', error.message);
      return {
        status: 'error',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        features: {
          caching: false,
          sessionManagement: false,
          pubSub: false,
          healthMonitoring: false,
          retryMechanism: false,
          gracefulShutdown: false
        }
      };
    }
  }

  // ==================== CORE CACHING OPERATIONS ====================

  /**
   * Set a value in Redis with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ Redis not connected, skipping cache set');
        return false;
      }
      
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('❌ Redis set error:', error.message);
      return false;
    }
  }

  /**
   * Get a value from Redis
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or null
   */
  async get(key) {
    try {
      if (!this.isConnected) {
        return null;
      }
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Redis get error:', error.message);
      return null;
    }
  }

  /**
   * Delete a key from Redis
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis delete error:', error.message);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis exists error:', error.message);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async expire(key, ttl) {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('❌ Redis expire error:', error.message);
      return false;
    }
  }

  // ==================== USER SESSION MANAGEMENT ====================

  /**
   * Set user session data
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @param {number} ttl - Time to live in seconds (default: 24 hours)
   * @returns {Promise<boolean>} Success status
   */
  async setUserSession(userId, sessionData, ttl = 86400) {
    const key = `session:user:${userId}`;
    const data = {
      ...sessionData,
      userId,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };
    return await this.set(key, data, ttl);
  }

  /**
   * Get user session data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Session data or null
   */
  async getUserSession(userId) {
    const key = `session:user:${userId}`;
    const session = await this.get(key);
    
    if (session) {
      // Update last accessed time
      session.lastAccessedAt = new Date().toISOString();
      await this.set(key, session, 86400); // Refresh TTL
    }
    
    return session;
  }

  /**
   * Delete user session
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUserSession(userId) {
    const key = `session:user:${userId}`;
    return await this.del(key);
  }

  /**
   * Update user session data
   * @param {string} userId - User ID
   * @param {Object} updates - Session updates
   * @returns {Promise<boolean>} Success status
   */
  async updateUserSession(userId, updates) {
    const session = await this.getUserSession(userId);
    if (!session) {
      return false;
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      lastAccessedAt: new Date().toISOString()
    };
    
    return await this.setUserSession(userId, updatedSession);
  }

  // ==================== USER DATA CACHING ====================

  /**
   * Cache user profile data
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {number} ttl - Time to live in seconds (default: 30 minutes)
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserProfile(userId, userData, ttl = 1800) {
    const key = `user:profile:${userId}`;
    return await this.set(key, userData, ttl);
  }

  /**
   * Get cached user profile data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getCachedUserProfile(userId) {
    const key = `user:profile:${userId}`;
    return await this.get(key);
  }

  /**
   * Cache user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserPreferences(userId, preferences, ttl = 3600) {
    const key = `user:preferences:${userId}`;
    return await this.set(key, preferences, ttl);
  }

  /**
   * Get cached user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User preferences or null
   */
  async getCachedUserPreferences(userId) {
    const key = `user:preferences:${userId}`;
    return await this.get(key);
  }

  /**
   * Cache user trips list
   * @param {string} userId - User ID
   * @param {Array} trips - User trips
   * @param {number} ttl - Time to live in seconds (default: 15 minutes)
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserTrips(userId, trips, ttl = 900) {
    const key = `user:trips:${userId}`;
    return await this.set(key, trips, ttl);
  }

  /**
   * Get cached user trips
   * @param {string} userId - User ID
   * @returns {Promise<Array|null>} User trips or null
   */
  async getCachedUserTrips(userId) {
    const key = `user:trips:${userId}`;
    return await this.get(key);
  }

  // ==================== TRIP DATA CACHING ====================

  /**
   * Cache trip data
   * @param {string} tripId - Trip ID
   * @param {Object} tripData - Trip data
   * @param {number} ttl - Time to live in seconds (default: 30 minutes)
   * @returns {Promise<boolean>} Success status
   */
  async cacheTrip(tripId, tripData, ttl = 1800) {
    const key = `trip:${tripId}`;
    return await this.set(key, tripData, ttl);
  }

  /**
   * Get cached trip data
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object|null>} Trip data or null
   */
  async getCachedTrip(tripId) {
    const key = `trip:${tripId}`;
    return await this.get(key);
  }

  /**
   * Cache trip collaborators
   * @param {string} tripId - Trip ID
   * @param {Array} collaborators - Trip collaborators
   * @param {number} ttl - Time to live in seconds (default: 10 minutes)
   * @returns {Promise<boolean>} Success status
   */
  async cacheTripCollaborators(tripId, collaborators, ttl = 600) {
    const key = `trip:collaborators:${tripId}`;
    return await this.set(key, collaborators, ttl);
  }

  /**
   * Get cached trip collaborators
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array|null>} Trip collaborators or null
   */
  async getCachedTripCollaborators(tripId) {
    const key = `trip:collaborators:${tripId}`;
    return await this.get(key);
  }

  // ==================== CACHE INVALIDATION STRATEGIES ====================

  /**
   * Invalidate user-related cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateUserCache(userId) {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      const patterns = [
        `user:profile:${userId}`,
        `user:preferences:${userId}`,
        `user:trips:${userId}`,
        `session:user:${userId}`
      ];
      
      const deletePromises = patterns.map(key => this.del(key));
      await Promise.all(deletePromises);
      
      console.log(`✅ User cache invalidated for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ User cache invalidation error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate trip-related cache
   * @param {string} tripId - Trip ID
   * @param {Array} collaboratorIds - Optional collaborator IDs to invalidate their trip lists
   * @returns {Promise<boolean>} Success status
   */
  async invalidateTripCache(tripId, collaboratorIds = []) {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      const patterns = [
        `trip:${tripId}`,
        `trip:collaborators:${tripId}`,
        `activity:${tripId}`,
        `presence:${tripId}:*`
      ];
      
      // Delete trip-specific cache
      const deletePromises = patterns.map(pattern => {
        if (pattern.includes('*')) {
          return this.deleteByPattern(pattern);
        }
        return this.del(pattern);
      });
      
      // Invalidate collaborators' trip lists
      collaboratorIds.forEach(userId => {
        deletePromises.push(this.del(`user:trips:${userId}`));
      });
      
      await Promise.all(deletePromises);
      
      console.log(`✅ Trip cache invalidated for trip: ${tripId}`);
      return true;
    } catch (error) {
      console.error('❌ Trip cache invalidation error:', error.message);
      return false;
    }
  }

  /**
   * Delete keys by pattern
   * @param {string} pattern - Redis key pattern
   * @returns {Promise<boolean>} Success status
   */
  async deleteByPattern(pattern) {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Delete by pattern error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate all cache (use with caution)
   * @returns {Promise<boolean>} Success status
   */
  async invalidateAllCache() {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await this.client.flushDb();
      console.log('✅ All cache invalidated');
      return true;
    } catch (error) {
      console.error('❌ Cache flush error:', error.message);
      return false;
    }
  }

  // ==================== REAL-TIME COLLABORATION ====================

  /**
   * Set user presence for a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @param {Object} userData - User presence data
   * @returns {Promise<boolean>} Success status
   */
  async setUserPresence(tripId, userId, userData) {
    const key = `presence:${tripId}:${userId}`;
    const presenceData = {
      ...userData,
      userId,
      tripId,
      lastSeen: new Date().toISOString(),
      isOnline: true
    };
    return await this.set(key, presenceData, 300); // 5 minutes TTL
  }

  /**
   * Get user presence for a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User presence data or null
   */
  async getUserPresence(tripId, userId) {
    const key = `presence:${tripId}:${userId}`;
    return await this.get(key);
  }

  /**
   * Get all users' presence for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array>} Array of user presence data
   */
  async getTripPresence(tripId) {
    try {
      if (!this.isConnected) {
        return [];
      }
      
      const pattern = `presence:${tripId}:*`;
      const keys = await this.client.keys(pattern);
      
      const presence = [];
      for (const key of keys) {
        const userData = await this.get(key);
        if (userData) {
          presence.push(userData);
        }
      }
      
      return presence;
    } catch (error) {
      console.error('❌ Get trip presence error:', error.message);
      return [];
    }
  }

  /**
   * Remove user presence
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async removeUserPresence(tripId, userId) {
    const key = `presence:${tripId}:${userId}`;
    return await this.del(key);
  }

  // ==================== ACTIVITY LOGGING ====================

  /**
   * Log activity for a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @param {Object} activity - Activity data
   * @returns {Promise<boolean>} Success status
   */
  async logActivity(tripId, userId, activity) {
    const key = `activity:${tripId}`;
    const activityData = {
      userId,
      activity,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    try {
      if (!this.isConnected) {
        return false;
      }
      
      // Add to activity list (keep last 100 activities)
      await this.client.lPush(key, JSON.stringify(activityData));
      await this.client.lTrim(key, 0, 99);
      await this.client.expire(key, 86400); // 24 hours
      
      return true;
    } catch (error) {
      console.error('❌ Log activity error:', error.message);
      return false;
    }
  }

  /**
   * Get trip activity log
   * @param {string} tripId - Trip ID
   * @param {number} limit - Number of activities to retrieve (default: 20)
   * @returns {Promise<Array>} Array of activity data
   */
  async getTripActivity(tripId, limit = 20) {
    try {
      if (!this.isConnected) {
        return [];
      }
      
      const key = `activity:${tripId}`;
      const activities = await this.client.lRange(key, 0, limit - 1);
      
      return activities.map(activity => JSON.parse(activity));
    } catch (error) {
      console.error('❌ Get trip activity error:', error.message);
      return [];
    }
  }

  // ==================== PUB/SUB FOR REAL-TIME UPDATES ====================

  /**
   * Publish trip update
   * @param {string} tripId - Trip ID
   * @param {Object} updateData - Update data
   * @returns {Promise<boolean>} Success status
   */
  async publishTripUpdate(tripId, updateData) {
    try {
      if (!this.publisher) {
        return false;
      }
      
      const channel = `trip:${tripId}:updates`;
      const message = JSON.stringify({
        ...updateData,
        timestamp: new Date().toISOString()
      });
      
      await this.publisher.publish(channel, message);
      return true;
    } catch (error) {
      console.error('❌ Publish trip update error:', error.message);
      return false;
    }
  }

  /**
   * Subscribe to trip updates
   * @param {string} tripId - Trip ID
   * @param {Function} callback - Callback function for updates
   * @returns {Promise<Object|boolean>} Subscriber client or false
   */
  async subscribeTripUpdates(tripId, callback) {
    try {
      if (!this.subscriber) {
        return false;
      }
      
      const channel = `trip:${tripId}:updates`;
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error('❌ Message parse error:', error.message);
        }
      });
      
      return this.subscriber;
    } catch (error) {
      console.error('❌ Subscribe trip updates error:', error.message);
      return false;
    }
  }

  // ==================== RATE LIMITING ====================

  /**
   * Check rate limit for an identifier
   * @param {string} identifier - Rate limit identifier
   * @param {number} limit - Request limit (default: 100)
   * @param {number} window - Time window in seconds (default: 1 hour)
   * @returns {Promise<Object>} Rate limit status
   */
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    try {
      if (!this.isConnected) {
        return { allowed: true, remaining: limit };
      }
      
      const key = `rate_limit:${identifier}`;
      const current = await this.client.get(key);
      
      if (!current) {
        await this.client.setEx(key, window, '1');
        return { allowed: true, remaining: limit - 1 };
      }
      
      const count = parseInt(current);
      if (count >= limit) {
        const ttl = await this.client.ttl(key);
        return { 
          allowed: false, 
          remaining: 0, 
          resetTime: Date.now() + (ttl * 1000) 
        };
      }
      
      await this.client.incr(key);
      return { allowed: true, remaining: limit - count - 1 };
    } catch (error) {
      console.error('❌ Rate limit check error:', error.message);
      return { allowed: true, remaining: limit };
    }
  }

  // ==================== CLEANUP AND SHUTDOWN ====================

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown() {
    console.log('🔄 Shutting down Redis connections...');
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    try {
      // Close all clients
      const closePromises = [];
      
      if (this.client && this.isConnected) {
        closePromises.push(this.client.disconnect());
      }
      
      if (this.publisher) {
        closePromises.push(this.publisher.disconnect());
      }
      
      if (this.subscriber) {
        closePromises.push(this.subscriber.disconnect());
      }
      
      await Promise.all(closePromises);
      
      this.isConnected = false;
      this.connectionState = 'disconnected';
      
      console.log('✅ Redis connections closed successfully');
    } catch (error) {
      console.error('❌ Error during Redis shutdown:', error.message);
    }
  }

  /**
   * Disconnect from Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    await this.gracefulShutdown();
  }
}

// Export singleton instance
const redisUtils = new RedisUtils();
module.exports = redisUtils;