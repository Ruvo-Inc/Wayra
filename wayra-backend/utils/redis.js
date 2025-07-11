const { createClient } = require('redis');

/**
 * Redis utility functions for Wayra backend
 * Handles caching, session management, and real-time collaboration
 */

class RedisUtils {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async initialize(redisUrl) {
    try {
      if (redisUrl) {
        const url = new URL(redisUrl);
        this.client = createClient({
          username: url.username || 'default',
          password: url.password,
          socket: {
            host: url.hostname,
            port: parseInt(url.port)
          }
        });

        this.client.on('error', (err) => {
          console.error('❌ Redis Client Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Connected to Redis Cloud');
          this.isConnected = true;
        });

        this.client.on('disconnect', () => {
          console.log('⚠️ Disconnected from Redis Cloud');
          this.isConnected = false;
        });

        await this.client.connect();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Redis initialization error:', error);
      return false;
    }
  }

  /**
   * Cache Management
   */
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) return false;
      
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * User Session Management
   */
  async setUserSession(userId, sessionData, ttl = 86400) { // 24 hours
    const key = `session:${userId}`;
    return await this.set(key, sessionData, ttl);
  }

  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async deleteUserSession(userId) {
    const key = `session:${userId}`;
    return await this.del(key);
  }

  /**
   * Trip Caching
   */
  async cacheTrip(tripId, tripData, ttl = 1800) { // 30 minutes
    const key = `trip:${tripId}`;
    return await this.set(key, tripData, ttl);
  }

  async getCachedTrip(tripId) {
    const key = `trip:${tripId}`;
    return await this.get(key);
  }

  async invalidateTripCache(tripId) {
    const key = `trip:${tripId}`;
    return await this.del(key);
  }

  async cacheUserTrips(userId, trips, ttl = 900) { // 15 minutes
    const key = `user:${userId}:trips`;
    return await this.set(key, trips, ttl);
  }

  async getCachedUserTrips(userId) {
    const key = `user:${userId}:trips`;
    return await this.get(key);
  }

  /**
   * Real-time Collaboration
   */
  async setUserPresence(tripId, userId, userData) {
    const key = `presence:${tripId}:${userId}`;
    const presenceData = {
      ...userData,
      lastSeen: new Date().toISOString(),
      isOnline: true
    };
    return await this.set(key, presenceData, 300); // 5 minutes
  }

  async getUserPresence(tripId, userId) {
    const key = `presence:${tripId}:${userId}`;
    return await this.get(key);
  }

  async getTripPresence(tripId) {
    try {
      if (!this.isConnected) return [];
      
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
      console.error('Redis get trip presence error:', error);
      return [];
    }
  }

  async removeUserPresence(tripId, userId) {
    const key = `presence:${tripId}:${userId}`;
    return await this.del(key);
  }

  /**
   * Activity Tracking
   */
  async logActivity(tripId, userId, activity) {
    const key = `activity:${tripId}`;
    const activityData = {
      userId,
      activity,
      timestamp: new Date().toISOString()
    };
    
    try {
      if (!this.isConnected) return false;
      
      // Add to activity list (keep last 50 activities)
      await this.client.lPush(key, JSON.stringify(activityData));
      await this.client.lTrim(key, 0, 49);
      await this.client.expire(key, 86400); // 24 hours
      
      return true;
    } catch (error) {
      console.error('Redis log activity error:', error);
      return false;
    }
  }

  async getTripActivity(tripId, limit = 20) {
    try {
      if (!this.isConnected) return [];
      
      const key = `activity:${tripId}`;
      const activities = await this.client.lRange(key, 0, limit - 1);
      
      return activities.map(activity => JSON.parse(activity));
    } catch (error) {
      console.error('Redis get trip activity error:', error);
      return [];
    }
  }

  /**
   * Rate Limiting
   */
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    try {
      if (!this.isConnected) return { allowed: true, remaining: limit };
      
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
      console.error('Redis rate limit error:', error);
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * Pub/Sub for Real-time Updates
   */
  async publishTripUpdate(tripId, updateData) {
    try {
      if (!this.isConnected) return false;
      
      const channel = `trip:${tripId}:updates`;
      const message = JSON.stringify({
        ...updateData,
        timestamp: new Date().toISOString()
      });
      
      await this.client.publish(channel, message);
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }

  async subscribeTripUpdates(tripId, callback) {
    try {
      if (!this.isConnected) return false;
      
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      
      const channel = `trip:${tripId}:updates`;
      await subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error('Redis message parse error:', error);
        }
      });
      
      return subscriber;
    } catch (error) {
      console.error('Redis subscribe error:', error);
      return false;
    }
  }

  /**
   * Health Check
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          connected: false
        };
      }
      
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      
      return {
        status: 'connected',
        connected: true,
        latency: `${latency}ms`,
        memory
      };
    } catch (error) {
      console.error('Redis health check error:', error);
      return {
        status: 'error',
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
  }
}

// Export singleton instance
const redisUtils = new RedisUtils();
module.exports = redisUtils;
