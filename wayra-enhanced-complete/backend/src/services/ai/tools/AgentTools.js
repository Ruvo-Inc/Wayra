/**
 * Wayra AI Agent Tools
 * Utility functions and tools for AI agents
 */

class AgentTools {
  constructor() {
    this.apiKeys = {
      amadeus: process.env.AMADEUS_API_KEY,
      booking: process.env.BOOKING_API_KEY,
      duffel: process.env.DUFFEL_API_TOKEN
    };
  }

  /**
   * Format currency values consistently
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Calculate budget breakdown percentages
   */
  calculateBudgetBreakdown(totalBudget) {
    return {
      accommodation: Math.round(totalBudget * 0.35), // 35%
      transportation: Math.round(totalBudget * 0.25), // 25%
      food: Math.round(totalBudget * 0.20), // 20%
      activities: Math.round(totalBudget * 0.15), // 15%
      miscellaneous: Math.round(totalBudget * 0.05) // 5%
    };
  }

  /**
   * Validate travel dates
   */
  validateTravelDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      throw new Error('Start date cannot be in the past');
    }

    if (end <= start) {
      throw new Error('End date must be after start date');
    }

    return {
      startDate: start,
      endDate: end,
      duration: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Generate travel recommendations based on interests
   */
  generateRecommendations(interests, destination) {
    const recommendations = {
      cultural: ['museums', 'historical sites', 'art galleries', 'local festivals'],
      adventure: ['hiking', 'water sports', 'extreme sports', 'outdoor activities'],
      food: ['local restaurants', 'food tours', 'cooking classes', 'markets'],
      relaxation: ['spas', 'beaches', 'parks', 'wellness centers'],
      nightlife: ['bars', 'clubs', 'live music', 'entertainment districts']
    };

    return interests.map(interest => {
      const category = interest.toLowerCase();
      return {
        category: interest,
        suggestions: recommendations[category] || ['general sightseeing']
      };
    });
  }

  /**
   * Calculate travel duration in days
   */
  calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  /**
   * Format travel dates for display
   */
  formatTravelDates(startDate, endDate) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const start = new Date(startDate).toLocaleDateString('en-US', options);
    const end = new Date(endDate).toLocaleDateString('en-US', options);
    
    return {
      start,
      end,
      formatted: `${start} - ${end}`
    };
  }

  /**
   * Generate unique planning session ID
   */
  generateSessionId() {
    return `planning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate planning request data
   */
  validatePlanningRequest(request) {
    const required = ['destination', 'budget', 'duration', 'travelers'];
    const missing = required.filter(field => !request[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (request.budget <= 0) {
      throw new Error('Budget must be greater than 0');
    }

    if (request.duration <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    if (request.travelers <= 0) {
      throw new Error('Number of travelers must be greater than 0');
    }

    return true;
  }

  /**
   * Log agent activity for debugging
   */
  logAgentActivity(agentName, action, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${agentName}: ${action}`, data);
  }

  /**
   * Handle API errors gracefully
   */
  handleApiError(error, context = 'API call') {
    console.error(`Error in ${context}:`, error);
    
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      context,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { AgentTools };
