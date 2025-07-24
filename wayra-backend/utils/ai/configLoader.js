/**
 * AI Configuration Loader for Wayra
 * Adapted from Travel_Agent_LangChain/src/utils/utils_main.py
 * 
 * Preserves Wayra's existing environment variable patterns while adding AI service configuration
 */

class AIConfigLoader {
  /**
   * Load AI service configuration using Wayra's existing environment patterns
   * @returns {Object} Complete AI configuration object
   */
  static loadConfig() {
    // PRESERVE: Use Wayra's existing environment variable patterns
    const config = {
      // AI Service Configuration
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
      },
      
      groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '4000')
      },
      
      // REUSE: Wayra's existing Google Maps API key
      google: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY, // Already exists in Wayra
        placesApiKey: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
        geocodingApiKey: process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY
      },
      
      // External API Configuration
      weather: {
        apiKey: process.env.OPENWEATHER_API_KEY,
        baseUrl: process.env.OPENWEATHER_BASE_URL || 'http://api.openweathermap.org/data/2.5',
        units: process.env.OPENWEATHER_UNITS || 'metric'
      },
      
      tavily: {
        apiKey: process.env.TAVILY_API_KEY,
        baseUrl: process.env.TAVILY_BASE_URL || 'https://api.tavily.com'
      },
      
      // Enhanced database configuration with MongoDB Atlas optimizations
      database: {
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
          url: process.env.REDIS_URL,
          maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
          retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILOVER || '100')
        }
      },
      
      // PRESERVE: Wayra's existing authentication
      auth: {
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
        firebaseApiKey: process.env.FIREBASE_API_KEY
      },
      
      // AI Service Configuration
      services: {
        conversationService: {
          url: process.env.CONVERSATION_SERVICE_URL || 'http://localhost:8001',
          timeout: parseInt(process.env.CONVERSATION_SERVICE_TIMEOUT || '60000')
        },
        agentsService: {
          url: process.env.AGENTS_SERVICE_URL || 'http://localhost:8002',
          timeout: parseInt(process.env.AGENTS_SERVICE_TIMEOUT || '120000')
        }
      },
      
      // Feature Flags
      features: {
        aiConversation: process.env.ENABLE_AI_CONVERSATION === 'true',
        multiAgents: process.env.ENABLE_MULTI_AGENTS === 'true',
        budgetOptimization: process.env.ENABLE_BUDGET_OPTIMIZATION === 'true',
        weatherIntegration: process.env.ENABLE_WEATHER_INTEGRATION === 'true',
        placesIntegration: process.env.ENABLE_PLACES_INTEGRATION === 'true'
      },
      
      // Rate Limiting and Usage Configuration
      limits: {
        conversationsPerUser: parseInt(process.env.MAX_CONVERSATIONS_PER_USER || '10'),
        messagesPerConversation: parseInt(process.env.MAX_MESSAGES_PER_CONVERSATION || '100'),
        agentTasksPerUser: parseInt(process.env.MAX_AGENT_TASKS_PER_USER || '5'),
        dailyApiCalls: parseInt(process.env.MAX_DAILY_API_CALLS || '1000')
      }
    };
    
    return config;
  }
  
  /**
   * Validate AI configuration
   * @param {Object} config - Configuration object to validate
   * @returns {boolean} True if configuration is valid
   * @throws {Error} If required configuration is missing
   */
  static validateConfig(config) {
    // Required configuration paths
    const required = [
      'database.mongoUri',
      'auth.firebaseProjectId'
    ];
    
    // Optional but recommended for full functionality
    const recommended = [
      'openai.apiKey',
      'google.apiKey',
      'weather.apiKey'
    ];
    
    // Check required configuration
    const missing = required.filter(key => !this.getNestedValue(config, key));
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    
    // Warn about missing recommended configuration
    const missingRecommended = recommended.filter(key => !this.getNestedValue(config, key));
    
    if (missingRecommended.length > 0) {
      console.warn(`Missing recommended configuration (some AI features may be limited): ${missingRecommended.join(', ')}`);
    }
    
    return true;
  }
  
  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path (e.g., 'openai.apiKey')
   * @returns {*} Value at path or undefined
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Get configuration for specific AI service
   * @param {string} serviceName - Name of the service (openai, groq, etc.)
   * @returns {Object} Service-specific configuration
   */
  static getServiceConfig(serviceName) {
    const config = this.loadConfig();
    return config[serviceName] || {};
  }
  
  /**
   * Check if a specific feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} True if feature is enabled
   */
  static isFeatureEnabled(featureName) {
    const config = this.loadConfig();
    return config.features[featureName] || false;
  }
  
  /**
   * Get rate limit for specific operation
   * @param {string} limitName - Name of the limit
   * @returns {number} Limit value
   */
  static getLimit(limitName) {
    const config = this.loadConfig();
    return config.limits[limitName] || 0;
  }
}

module.exports = AIConfigLoader;

