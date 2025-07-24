/**
 * Feature Flag System for Wayra AI Integration
 * 
 * This module provides a feature flag system for gradually rolling out AI features.
 * It loads flags from environment variables and Redis, with fallback to defaults.
 * 
 * Usage:
 * const featureFlags = require('./utils/featureFlags');
 * 
 * // Check if a feature is enabled
 * if (featureFlags.isEnabled('ai.agents.enabled')) {
 *   // Use AI agents
 * }
 */

const redis = require('./redis');

class FeatureFlags {
  constructor() {
    this.cache = {};
    this.defaultFlags = {
      'ai.agents.enabled': true,
      'ai.conversation.enabled': true,
      'ai.collaboration.enabled': true,
      'ai.budgetOptimization.enabled': true,
      'ai.groupCoordination.enabled': false,
      'ai.itineraryGeneration.enabled': true,
      'ai.weatherAnalysis.enabled': true,
      'ai.destinationRecommendation.enabled': true
    };
  }
  
  async initialize() {
    // Load flags from environment
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('FEATURE_')) {
        const flagName = key.replace('FEATURE_', '').toLowerCase().replace(/_/g, '.');
        this.cache[flagName] = process.env[key] === 'true';
      }
    });
    
    // Load flags from Redis if available
    try {
      const redisFlags = await redis.hgetall('feature_flags');
      if (redisFlags) {
        Object.keys(redisFlags).forEach(key => {
          this.cache[key] = redisFlags[key] === 'true';
        });
      }
    } catch (error) {
      console.warn('Failed to load feature flags from Redis:', error);
    }
    
    // Apply defaults for missing flags
    Object.keys(this.defaultFlags).forEach(key => {
      if (this.cache[key] === undefined) {
        this.cache[key] = this.defaultFlags[key];
      }
    });
    
    console.log('Feature flags initialized:', this.cache);
  }
  
  isEnabled(flagName) {
    return this.cache[flagName] === true;
  }
  
  async setFlag(flagName, value) {
    this.cache[flagName] = value;
    
    // Save to Redis if available
    try {
      await redis.hset('feature_flags', flagName, value.toString());
    } catch (error) {
      console.warn('Failed to save feature flag to Redis:', error);
    }
  }
  
  getAll() {
    return { ...this.cache };
  }
}

// Create singleton instance
const featureFlags = new FeatureFlags();

module.exports = featureFlags;

