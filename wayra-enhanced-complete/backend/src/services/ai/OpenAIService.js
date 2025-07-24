/**
 * Enhanced Wayra OpenAI Service - World-Class Implementation
 * 
 * This enhanced version provides enterprise-grade OpenAI integration with:
 * - Advanced error handling and retry mechanisms
 * - Rate limiting and quota management
 * - Performance monitoring and metrics
 * - Request caching for efficiency
 * - Multiple model support with fallbacks
 * - Comprehensive logging and debugging
 * 
 * @author Wayra Development Team
 * @version 2.0.0 (Enhanced)
 */

const OpenAI = require('openai');
const { configLoader } = require('../../config/configLoader');

class OpenAIService {
  constructor() {
    this.config = configLoader.getOpenAIConfig();
    
    // Initialize OpenAI client with enhanced configuration
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout || 60000, // 60 seconds default
      maxRetries: 0 // We handle retries manually for better control
    });
    
    // Enhanced configuration
    this.settings = {
      defaultModel: this.config.model || 'gpt-4',
      fallbackModel: this.config.fallbackModel || 'gpt-3.5-turbo',
      maxRetries: this.config.maxRetries || 3,
      retryDelay: this.config.retryDelay || 1000,
      enableCaching: this.config.enableCaching !== false,
      enableMetrics: this.config.enableMetrics !== false,
      enableDetailedLogging: this.config.enableDetailedLogging !== false
    };
    
    // Rate limiting configuration
    this.rateLimiting = {
      requestsPerMinute: this.config.requestsPerMinute || 60,
      tokensPerMinute: this.config.tokensPerMinute || 90000,
      requestQueue: [],
      tokenUsage: []
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retryAttempts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      costEstimate: 0
    };
    
    // Simple in-memory cache (in production, use Redis)
    this.cache = new Map();
    this.cacheMaxSize = this.config.cacheMaxSize || 1000;
    this.cacheTTL = this.config.cacheTTL || 3600000; // 1 hour default
    
    // Initialize rate limiting cleanup
    this.initializeRateLimiting();
    
    if (this.settings.enableDetailedLogging) {
      console.log('🤖 Enhanced OpenAI Service initialized with advanced features');
    }
  }

  /**
   * Enhanced generate response with comprehensive error handling
   */
  async generateResponse(prompt, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Validate inputs
      this.validateInputs(prompt, options);
      
      // Check rate limits
      await this.checkRateLimits(options);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(prompt, options);
      if (this.settings.enableCaching) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          if (this.settings.enableDetailedLogging) {
            console.log(`💾 Cache hit for request (${Date.now() - startTime}ms)`);
          }
          return cached;
        }
        this.metrics.cacheMisses++;
      }
      
      // Execute request with retry mechanism
      const response = await this.executeWithRetry(prompt, options);
      
      // Cache the response
      if (this.settings.enableCaching && response) {
        this.setCache(cacheKey, response);
      }
      
      // Update metrics
      this.updateMetrics(startTime, options, response);
      this.metrics.successfulRequests++;
      
      if (this.settings.enableDetailedLogging) {
        console.log(`✅ OpenAI request completed successfully (${Date.now() - startTime}ms)`);
      }
      
      return response;

    } catch (error) {
      this.metrics.failedRequests++;
      this.logError('OpenAI request failed', error, { prompt: prompt.substring(0, 100), options });
      throw this.enhanceError(error);
    }
  }

  /**
   * Execute request with advanced retry mechanism
   */
  async executeWithRetry(prompt, options, attempt = 1) {
    try {
      const {
        model = this.settings.defaultModel,
        maxTokens = 2000,
        temperature = 0.7,
        systemMessage = null,
        timeout = 60000
      } = options;

      const messages = [];
      
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      
      messages.push({ role: 'user', content: prompt });

      // Create request with timeout
      const requestPromise = this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      // Track token usage
      if (response.usage) {
        this.trackTokenUsage(response.usage);
      }

      return response.choices[0].message.content;

    } catch (error) {
      this.metrics.retryAttempts++;
      
      if (this.settings.enableDetailedLogging) {
        console.warn(`⚠️ Attempt ${attempt}/${this.settings.maxRetries} failed:`, error.message);
      }

      // Determine if we should retry
      if (attempt < this.settings.maxRetries && this.shouldRetry(error)) {
        // Try fallback model on final attempt
        if (attempt === this.settings.maxRetries - 1 && options.model !== this.settings.fallbackModel) {
          if (this.settings.enableDetailedLogging) {
            console.log(`🔄 Switching to fallback model: ${this.settings.fallbackModel}`);
          }
          options.model = this.settings.fallbackModel;
        }
        
        // Exponential backoff with jitter
        const delay = this.settings.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await this.sleep(delay);
        
        return this.executeWithRetry(prompt, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Enhanced travel planning response with specialized handling
   */
  async generateTravelPlanningResponse(prompt, agentType, context = {}) {
    try {
      const systemMessage = this.getTravelPlanningSystemMessage(agentType);
      
      // Specialized options for different agent types
      const options = {
        systemMessage,
        maxTokens: this.getMaxTokensForAgent(agentType),
        temperature: this.getTemperatureForAgent(agentType),
        model: this.getModelForAgent(agentType),
        timeout: this.getTimeoutForAgent(agentType)
      };

      return await this.generateResponse(prompt, options);

    } catch (error) {
      this.logError(`Travel planning error for ${agentType}`, error, { agentType, context });
      throw error;
    }
  }

  /**
   * Get specialized system message for travel planning agents
   */
  getTravelPlanningSystemMessage(agentType) {
    const baseMessage = "You are a professional travel planning assistant focused on providing detailed, practical, and budget-conscious recommendations.";
    
    switch (agentType) {
      case 'budget_analyst':
        return `${baseMessage} You specialize in budget optimization and cost analysis. Always provide specific dollar amounts, percentages, and actionable cost-saving strategies. Format your response clearly with structured information.`;
      
      case 'destination_research':
        return `${baseMessage} You specialize in destination research and cultural insights. Provide comprehensive information about locations, attractions, culture, and practical travel tips. Include specific recommendations and insider knowledge.`;
      
      case 'itinerary_planning':
        return `${baseMessage} You specialize in creating detailed day-by-day itineraries. CRITICAL: You must respond with ONLY valid JSON format containing structured daily plans with specific times, activities, costs, and locations. No additional text or explanations outside the JSON structure.`;
      
      case 'travel_coordinator':
        return `${baseMessage} You specialize in travel logistics and coordination. Focus on booking strategies, documentation, group coordination, and practical travel management. Provide actionable checklists and timelines.`;
      
      default:
        return baseMessage;
    }
  }

  /**
   * Get specialized configuration for different agent types
   */
  getMaxTokensForAgent(agentType) {
    switch (agentType) {
      case 'itinerary_planning': return 4000; // Needs more tokens for detailed JSON
      case 'destination_research': return 3000; // Comprehensive destination info
      case 'budget_analyst': return 2500; // Detailed budget breakdowns
      case 'travel_coordinator': return 2000; // Logistics information
      default: return 2000;
    }
  }

  getTemperatureForAgent(agentType) {
    switch (agentType) {
      case 'itinerary_planning': return 0.3; // Lower for consistent JSON structure
      case 'budget_analyst': return 0.4; // Lower for accurate calculations
      case 'destination_research': return 0.7; // Higher for creative recommendations
      case 'travel_coordinator': return 0.5; // Balanced for practical advice
      default: return 0.7;
    }
  }

  getModelForAgent(agentType) {
    switch (agentType) {
      case 'itinerary_planning': return 'gpt-4'; // Best model for complex JSON generation
      case 'budget_analyst': return 'gpt-4'; // Best for accurate calculations
      default: return this.settings.defaultModel;
    }
  }

  getTimeoutForAgent(agentType) {
    switch (agentType) {
      case 'itinerary_planning': return 90000; // 90 seconds for complex itineraries
      case 'destination_research': return 60000; // 60 seconds for research
      default: return 45000; // 45 seconds default
    }
  }

  /**
   * Validate inputs
   */
  validateInputs(prompt, options) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt: must be a non-empty string');
    }
    
    if (prompt.length > 50000) {
      throw new Error('Prompt too long: maximum 50,000 characters');
    }
    
    if (options.maxTokens && (options.maxTokens < 1 || options.maxTokens > 8000)) {
      throw new Error('Invalid maxTokens: must be between 1 and 8000');
    }
    
    if (options.temperature && (options.temperature < 0 || options.temperature > 2)) {
      throw new Error('Invalid temperature: must be between 0 and 2');
    }
  }

  /**
   * Rate limiting management
   */
  async checkRateLimits(options) {
    const now = Date.now();
    const estimatedTokens = this.estimateTokens(options);
    
    // Clean old entries
    this.rateLimiting.requestQueue = this.rateLimiting.requestQueue.filter(
      timestamp => now - timestamp < 60000
    );
    this.rateLimiting.tokenUsage = this.rateLimiting.tokenUsage.filter(
      entry => now - entry.timestamp < 60000
    );
    
    // Check request rate limit
    if (this.rateLimiting.requestQueue.length >= this.rateLimiting.requestsPerMinute) {
      const waitTime = 60000 - (now - this.rateLimiting.requestQueue[0]);
      if (waitTime > 0) {
        if (this.settings.enableDetailedLogging) {
          console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
        }
        await this.sleep(waitTime);
      }
    }
    
    // Check token rate limit
    const currentTokenUsage = this.rateLimiting.tokenUsage.reduce((sum, entry) => sum + entry.tokens, 0);
    if (currentTokenUsage + estimatedTokens > this.rateLimiting.tokensPerMinute) {
      const oldestEntry = this.rateLimiting.tokenUsage[0];
      if (oldestEntry) {
        const waitTime = 60000 - (now - oldestEntry.timestamp);
        if (waitTime > 0) {
          if (this.settings.enableDetailedLogging) {
            console.log(`⏳ Token rate limit reached, waiting ${waitTime}ms`);
          }
          await this.sleep(waitTime);
        }
      }
    }
    
    // Record this request
    this.rateLimiting.requestQueue.push(now);
    this.rateLimiting.tokenUsage.push({ timestamp: now, tokens: estimatedTokens });
  }

  /**
   * Initialize rate limiting cleanup
   */
  initializeRateLimiting() {
    // Clean up old entries every minute
    setInterval(() => {
      const now = Date.now();
      this.rateLimiting.requestQueue = this.rateLimiting.requestQueue.filter(
        timestamp => now - timestamp < 60000
      );
      this.rateLimiting.tokenUsage = this.rateLimiting.tokenUsage.filter(
        entry => now - entry.timestamp < 60000
      );
    }, 60000);
  }

  /**
   * Estimate token usage for rate limiting
   */
  estimateTokens(options) {
    // Rough estimation: 1 token ≈ 4 characters
    const promptTokens = Math.ceil((options.prompt?.length || 0) / 4);
    const maxTokens = options.maxTokens || 2000;
    return promptTokens + maxTokens;
  }

  /**
   * Track actual token usage
   */
  trackTokenUsage(usage) {
    this.metrics.totalTokensUsed += usage.total_tokens;
    
    // Estimate cost (approximate pricing for GPT-4)
    const inputCost = (usage.prompt_tokens / 1000) * 0.03; // $0.03 per 1K input tokens
    const outputCost = (usage.completion_tokens / 1000) * 0.06; // $0.06 per 1K output tokens
    this.metrics.costEstimate += inputCost + outputCost;
  }

  /**
   * Cache management
   */
  generateCacheKey(prompt, options) {
    const keyData = {
      prompt: prompt.substring(0, 500), // First 500 chars for key
      model: options.model || this.settings.defaultModel,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      systemMessage: options.systemMessage?.substring(0, 100) || ''
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setCache(key, data) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Error handling and enhancement
   */
  shouldRetry(error) {
    // Retry on specific error types
    const retryableErrors = [
      'timeout',
      'rate_limit_exceeded',
      'server_error',
      'service_unavailable',
      'connection_error'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  enhanceError(error) {
    // Add more context to errors
    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.service = 'OpenAI';
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.metrics = this.getMetrics();
    
    return enhancedError;
  }

  logError(message, error, context = {}) {
    const errorLog = {
      message,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics()
    };
    
    console.error('🚨 OpenAI Service Error:', errorLog);
  }

  /**
   * Update performance metrics
   */
  updateMetrics(startTime, options, response) {
    const responseTime = Date.now() - startTime;
    
    // Update average response time
    const totalRequests = this.metrics.successfulRequests + 1;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const totalRequests = this.metrics.totalRequests;
    
    return {
      ...this.metrics,
      successRate: totalRequests > 0 
        ? ((this.metrics.successfulRequests / totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      failureRate: totalRequests > 0
        ? ((this.metrics.failedRequests / totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2) + '%'
        : '0%',
      averageResponseTimeMs: Math.round(this.metrics.averageResponseTime),
      estimatedCostUSD: this.metrics.costEstimate.toFixed(4),
      currentCacheSize: this.cache.size,
      rateLimitStatus: {
        requestsInLastMinute: this.rateLimiting.requestQueue.length,
        tokensInLastMinute: this.rateLimiting.tokenUsage.reduce((sum, entry) => sum + entry.tokens, 0)
      }
    };
  }

  /**
   * Health check with comprehensive diagnostics
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test basic functionality
      const testResponse = await this.generateResponse("Hello", { 
        maxTokens: 10,
        timeout: 10000 
      });
      
      const responseTime = Date.now() - startTime;
      
      // Check API key validity
      const apiKeyValid = !!testResponse && testResponse.length > 0;
      
      // Check rate limiting status
      const rateLimitStatus = this.getRateLimitStatus();
      
      return {
        status: 'healthy',
        responseTime: responseTime + 'ms',
        apiKeyValid,
        rateLimitStatus,
        metrics: this.getMetrics(),
        cacheStatus: {
          size: this.cache.size,
          maxSize: this.cacheMaxSize,
          utilizationPercent: ((this.cache.size / this.cacheMaxSize) * 100).toFixed(1) + '%'
        },
        lastCheck: new Date().toISOString(),
        testResponse: testResponse?.substring(0, 50) + '...'
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        metrics: this.getMetrics(),
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    const now = Date.now();
    const requestsInLastMinute = this.rateLimiting.requestQueue.filter(
      timestamp => now - timestamp < 60000
    ).length;
    
    const tokensInLastMinute = this.rateLimiting.tokenUsage
      .filter(entry => now - entry.timestamp < 60000)
      .reduce((sum, entry) => sum + entry.tokens, 0);
    
    return {
      requestsUsed: requestsInLastMinute,
      requestsLimit: this.rateLimiting.requestsPerMinute,
      requestsRemaining: Math.max(0, this.rateLimiting.requestsPerMinute - requestsInLastMinute),
      tokensUsed: tokensInLastMinute,
      tokensLimit: this.rateLimiting.tokensPerMinute,
      tokensRemaining: Math.max(0, this.rateLimiting.tokensPerMinute - tokensInLastMinute)
    };
  }

  /**
   * Clear cache manually
   */
  clearCache() {
    const previousSize = this.cache.size;
    this.cache.clear();
    
    if (this.settings.enableDetailedLogging) {
      console.log(`🗑️ Cache cleared: ${previousSize} entries removed`);
    }
    
    return { previousSize, currentSize: 0 };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    const previousMetrics = { ...this.metrics };
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retryAttempts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      costEstimate: 0
    };
    
    if (this.settings.enableDetailedLogging) {
      console.log('📊 Metrics reset');
    }
    
    return previousMetrics;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.settings.enableDetailedLogging) {
      console.log('🔄 OpenAI Service shutting down gracefully...');
      console.log('📊 Final metrics:', this.getMetrics());
    }
    
    // Clear cache
    this.clearCache();
    
    // Clear intervals
    clearInterval(this.rateLimitingCleanup);
    
    if (this.settings.enableDetailedLogging) {
      console.log('✅ OpenAI Service shutdown complete');
    }
  }
}

module.exports = { OpenAIService };

