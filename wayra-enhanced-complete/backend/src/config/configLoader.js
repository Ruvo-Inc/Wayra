/**
 * Wayra Configuration Loader
 * Centralized configuration management with environment-specific settings
 */

require('dotenv').config();

class ConfigLoader {
  constructor() {
    this.config = this.loadConfiguration();
  }

  loadConfiguration() {
    return {
      app: {
        name: 'Wayra Enhanced',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT) || 5000,
        apiVersion: process.env.API_VERSION || 'v1'
      },
      openai: {
        // Basic configuration (your existing settings preserved)
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        fallbackModel: process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo',
        
        // Enhanced reliability features
        timeout: parseInt(process.env.OPENAI_TIMEOUT) || 60000,
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY) || 1000,
        
        // Performance optimization
        enableCaching: process.env.OPENAI_ENABLE_CACHING !== 'false',
        enableMetrics: process.env.OPENAI_ENABLE_METRICS !== 'false',
        requestsPerMinute: parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE) || 60,
        tokensPerMinute: parseInt(process.env.OPENAI_TOKENS_PER_MINUTE) || 90000,
        
        // Agent-specific configurations for optimal performance
        agentConfigs: {
          itinerary_planning: { model: 'gpt-4', maxTokens: 4000, temperature: 0.3 },
          budget_analyst: { model: 'gpt-4', maxTokens: 2500, temperature: 0.4 },
          destination_research: { maxTokens: 3000, temperature: 0.7 },
          travel_coordinator: { maxTokens: 2000, temperature: 0.5 }
        }
      },
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      },
      database: {
        // MongoDB configuration
        mongoUri: process.env.MONGODB_URI,
        dbName: process.env.DB_NAME || 'wayra',
        
        // Connection pool settings
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2'),
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS || '30000'),
        
        // Timeout settings
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '10000'),
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS || '45000'),
        connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000'),
        
        // Retry and reliability settings
        retryWrites: process.env.DB_RETRY_WRITES !== 'false',
        retryReads: process.env.DB_RETRY_READS !== 'false',
        maxRetries: parseInt(process.env.DB_MAX_RETRIES || '5'),
        retryDelayMS: parseInt(process.env.DB_RETRY_DELAY_MS || '5000'),
        
        // Health check settings
        healthCheckIntervalMS: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL_MS || '30000'),
        
        // Redis configuration
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
          retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILOVER || '100')
        }
      },
      security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY
      },
      externalApis: {
        amadeus: {
          apiKey: process.env.AMADEUS_API_KEY,
          apiSecret: process.env.AMADEUS_API_SECRET
        },
        booking: {
          apiKey: process.env.BOOKING_API_KEY
        },
        stripe: {
          secretKey: process.env.STRIPE_SECRET_KEY
        }
      },
      monitoring: {
        logLevel: process.env.LOG_LEVEL || 'info',
        enableMetrics: process.env.ENABLE_METRICS === 'true'
      }
    };
  }

  getAppConfig() {
    return this.config.app;
  }

  getOpenAIConfig() {
    return this.config.openai;
  }

  getFirebaseConfig() {
    return this.config.firebase;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getRedisConfig() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME || 'default',
      url: process.env.REDIS_URL,
      
      // Connection settings
      connectTimeoutMS: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '10000'),
      commandTimeoutMS: parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || '5000'),
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '5'),
      retryDelayMS: parseInt(process.env.REDIS_RETRY_DELAY_MS || '1000'),
      
      // Health check settings
      healthCheckIntervalMS: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL_MS || '30000'),
      
      // Cache TTL defaults
      defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'),
      sessionTTL: parseInt(process.env.REDIS_SESSION_TTL || '86400'),
      userCacheTTL: parseInt(process.env.REDIS_USER_CACHE_TTL || '1800'),
      tripCacheTTL: parseInt(process.env.REDIS_TRIP_CACHE_TTL || '1800')
    };
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getExternalApisConfig() {
    return this.config.externalApis;
  }

  getMonitoringConfig() {
    return this.config.monitoring;
  }

  validateConfiguration() {
    const required = [
      'OPENAI_API_KEY',
      'FIREBASE_PROJECT_ID'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  }
}

const configLoader = new ConfigLoader();

module.exports = { configLoader, ConfigLoader };
