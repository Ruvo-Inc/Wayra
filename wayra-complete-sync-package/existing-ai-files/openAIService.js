/**
 * OpenAI Service for Wayra
 * Adapted from travel-planner-ai/lib/openai/index.ts
 * 
 * Provides AI-powered travel planning and conversation capabilities
 * while integrating with Wayra's existing infrastructure
 */

const OpenAI = require('openai');
const AIConfigLoader = require('../../utils/ai/configLoader');
const MathUtils = require('../../utils/ai/mathUtils');

class OpenAIService {
  constructor() {
    const config = AIConfigLoader.getServiceConfig('openai');
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000
    });
    
    this.config = config;
  }
  
  /**
   * Generate travel plan based on user requirements
   * ADAPTED from travel-planner-ai with Wayra-specific enhancements
   */
  async generateTravelPlan(request) {
    try {
      const {
        destination,
        budget,
        duration,
        travelers,
        interests = [],
        travelDates,
        budgetPriority = 'high', // Wayra-specific: emphasize budget optimization
        userId
      } = request;
      
      // Validate input
      this._validateTravelPlanRequest(request);
      
      // Build system prompt with Wayra's budget-focused approach
      const systemPrompt = this._buildSystemPrompt(budgetPriority);
      
      // Build user prompt with comprehensive details
      const userPrompt = this._buildUserPrompt({
        destination,
        budget,
        duration,
        travelers,
        interests,
        travelDates
      });
      
      // Generate travel plan using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      });
      
      const response = completion.choices[0].message.content;
      const parsedPlan = JSON.parse(response);
      
      // Enhance with Wayra-specific budget analysis
      const enhancedPlan = await this._enhancePlanWithBudgetAnalysis(parsedPlan, budget);
      
      return {
        success: true,
        data: enhancedPlan,
        metadata: {
          model: this.config.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this._calculateCost(completion.usage?.total_tokens || 0),
          generatedAt: new Date().toISOString(),
          userId: userId
        }
      };
      
    } catch (error) {
      console.error('Error generating travel plan:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          type: 'GENERATION_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Continue conversation with context awareness
   * ENHANCED for Wayra's conversational travel planning
   */
  async continueConversation(conversationId, message, context = {}) {
    try {
      const {
        tripId,
        currentPlan,
        userPreferences,
        conversationHistory = []
      } = context;
      
      // Build conversation context
      const messages = this._buildConversationMessages(
        conversationHistory,
        message,
        currentPlan,
        userPreferences
      );
      
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });
      
      const response = completion.choices[0].message.content;
      
      // Extract any trip updates from the response
      const tripUpdates = await this._extractTripUpdates(response, currentPlan);
      
      return {
        success: true,
        data: {
          response: response,
          tripUpdates: tripUpdates,
          conversationId: conversationId,
          timestamp: new Date().toISOString()
        },
        metadata: {
          model: this.config.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this._calculateCost(completion.usage?.total_tokens || 0)
        }
      };
      
    } catch (error) {
      console.error('Error in conversation:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          type: 'CONVERSATION_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Optimize existing travel plan for budget efficiency
   * WAYRA-SPECIFIC: Core budget optimization functionality
   */
  async optimizeTravelPlan(planId, optimizationGoals = {}) {
    try {
      const {
        targetBudget,
        priorities = ['cost', 'experience'],
        constraints = [],
        currentPlan
      } = optimizationGoals;
      
      if (!currentPlan) {
        throw new Error('Current plan is required for optimization');
      }
      
      // Build optimization prompt
      const optimizationPrompt = this._buildOptimizationPrompt(
        currentPlan,
        targetBudget,
        priorities,
        constraints
      );
      
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert travel budget optimizer. Analyze the provided travel plan and suggest specific optimizations to reduce costs while maintaining or improving the travel experience. Provide detailed reasoning for each suggestion.'
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent optimization
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      });
      
      const response = completion.choices[0].message.content;
      const optimizations = JSON.parse(response);
      
      // Calculate potential savings
      const savingsAnalysis = this._calculateOptimizationSavings(
        currentPlan,
        optimizations
      );
      
      return {
        success: true,
        data: {
          optimizations: optimizations,
          savingsAnalysis: savingsAnalysis,
          planId: planId,
          optimizedAt: new Date().toISOString()
        },
        metadata: {
          model: this.config.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this._calculateCost(completion.usage?.total_tokens || 0)
        }
      };
      
    } catch (error) {
      console.error('Error optimizing travel plan:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          type: 'OPTIMIZATION_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Private helper methods
   */
  
  _validateTravelPlanRequest(request) {
    const required = ['destination', 'budget', 'duration', 'travelers'];
    const missing = required.filter(field => !request[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (request.budget <= 0) {
      throw new Error('Budget must be greater than zero');
    }
    
    if (request.duration <= 0) {
      throw new Error('Duration must be greater than zero');
    }
    
    if (request.travelers <= 0) {
      throw new Error('Number of travelers must be greater than zero');
    }
  }
  
  _buildSystemPrompt(budgetPriority = 'high') {
    const basePriority = budgetPriority === 'high' ? 
      'Budget optimization is your PRIMARY concern. Always prioritize cost-effective solutions.' :
      'Balance budget considerations with experience quality.';
    
    return `You are an expert travel planner specializing in budget-conscious travel planning for Wayra.
    
    ${basePriority}
    
    Your expertise includes:
    - Creating detailed, practical itineraries that maximize value
    - Finding cost-effective accommodations, transportation, and activities
    - Optimizing travel timing for better prices
    - Identifying local experiences that provide authentic value
    - Providing specific cost estimates and budget breakdowns
    - Suggesting money-saving tips and alternatives
    
    Always respond with a valid JSON object containing:
    {
      "itinerary": {
        "days": [
          {
            "day": 1,
            "date": "YYYY-MM-DD",
            "activities": [
              {
                "time": "09:00",
                "activity": "Activity name",
                "description": "Detailed description",
                "cost": 0,
                "duration": "2 hours",
                "location": "Specific location",
                "tips": "Money-saving tips"
              }
            ],
            "dailyBudget": 0,
            "meals": [],
            "transportation": []
          }
        ]
      },
      "budgetBreakdown": {
        "accommodation": 0,
        "transportation": 0,
        "food": 0,
        "activities": 0,
        "miscellaneous": 0,
        "total": 0
      },
      "moneySavingTips": [],
      "alternativeOptions": [],
      "bestTimeToBook": "Specific timing recommendations"
    }`;
  }
  
  _buildUserPrompt(request) {
    const {
      destination,
      budget,
      duration,
      travelers,
      interests,
      travelDates
    } = request;
    
    const datesText = travelDates ? 
      `Travel Dates: ${travelDates.start} to ${travelDates.end}` :
      'Travel dates are flexible';
    
    return `Create a comprehensive, budget-optimized travel plan for:
    
    Destination: ${destination}
    Total Budget: $${budget}
    Duration: ${duration} days
    Number of Travelers: ${travelers}
    Interests: ${interests.join(', ') || 'General sightseeing'}
    ${datesText}
    
    Requirements:
    1. Stay within the $${budget} budget
    2. Provide daily itineraries with specific activities and costs
    3. Include accommodation recommendations with price ranges
    4. Suggest transportation options and costs
    5. Recommend local dining options for different budget levels
    6. Identify free or low-cost activities
    7. Provide money-saving tips specific to ${destination}
    8. Suggest alternative options for different budget scenarios
    9. Include best timing for bookings to get better prices
    
    Focus on practical, actionable recommendations that maximize value for money.`;
  }
  
  _buildConversationMessages(history, newMessage, currentPlan, preferences) {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful travel planning assistant for Wayra. You help users refine their travel plans with a focus on budget optimization and practical advice. 
        
        Current trip context: ${currentPlan ? JSON.stringify(currentPlan) : 'No current plan'}
        User preferences: ${preferences ? JSON.stringify(preferences) : 'No specific preferences'}
        
        Provide helpful, specific advice while maintaining focus on budget-conscious travel planning.`
      }
    ];
    
    // Add conversation history (limit to last 10 messages for context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
    
    // Add new message
    messages.push({
      role: 'user',
      content: newMessage
    });
    
    return messages;
  }
  
  _buildOptimizationPrompt(currentPlan, targetBudget, priorities, constraints) {
    return `Analyze and optimize this travel plan:
    
    Current Plan: ${JSON.stringify(currentPlan)}
    Target Budget: $${targetBudget}
    Optimization Priorities: ${priorities.join(', ')}
    Constraints: ${constraints.join(', ') || 'None specified'}
    
    Provide specific optimization suggestions in JSON format:
    {
      "accommodationOptimizations": [],
      "transportationOptimizations": [],
      "activityOptimizations": [],
      "foodOptimizations": [],
      "timingOptimizations": [],
      "alternativeDestinations": [],
      "estimatedSavings": 0,
      "riskAssessment": "Low/Medium/High",
      "implementationDifficulty": "Easy/Moderate/Difficult"
    }`;
  }
  
  async _enhancePlanWithBudgetAnalysis(plan, budget) {
    // Add budget analysis using MathUtils
    if (plan.budgetBreakdown) {
      const totalPlanned = plan.budgetBreakdown.total || 0;
      const savings = MathUtils.calculateSavings(budget, totalPlanned);
      
      plan.budgetAnalysis = {
        originalBudget: budget,
        plannedSpending: totalPlanned,
        savings: savings,
        utilizationPercentage: MathUtils.calculatePercentage(totalPlanned, budget),
        dailyBudget: MathUtils.budgetPerDay(totalPlanned, plan.itinerary?.days?.length || 1)
      };
    }
    
    return plan;
  }
  
  async _extractTripUpdates(response, currentPlan) {
    // Simple extraction logic - can be enhanced with more sophisticated parsing
    const updates = {};
    
    // Look for budget mentions
    const budgetMatch = response.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (budgetMatch) {
      updates.suggestedBudgetChanges = budgetMatch.map(match => 
        parseFloat(match.replace('$', '').replace(',', ''))
      );
    }
    
    // Look for date mentions
    const dateMatch = response.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatch) {
      updates.suggestedDateChanges = dateMatch;
    }
    
    return updates;
  }
  
  _calculateOptimizationSavings(currentPlan, optimizations) {
    // Calculate potential savings from optimizations
    let totalSavings = 0;
    
    if (optimizations.estimatedSavings) {
      totalSavings = parseFloat(optimizations.estimatedSavings);
    }
    
    const currentTotal = currentPlan.budgetBreakdown?.total || 0;
    const optimizedTotal = currentTotal - totalSavings;
    
    return MathUtils.calculateSavings(currentTotal, optimizedTotal);
  }
  
  _calculateCost(tokens) {
    // OpenAI GPT-4 pricing (approximate)
    const costPerToken = 0.00003; // $0.03 per 1K tokens
    return tokens * costPerToken;
  }
}

module.exports = OpenAIService;

