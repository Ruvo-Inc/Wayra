#!/bin/bash

# Wayra Enhanced Production - AI Files Migration Script
# This script migrates existing AI components to the new production structure

echo "🤖 Migrating existing AI components to production structure..."

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the wayra-enhanced-complete directory"
    echo "   Make sure you've run create-directory-structure.sh first"
    exit 1
fi

# Create AI service directories
echo "📁 Creating AI service directories..."
mkdir -p backend/src/services/ai/{agents,tools,optimization}
mkdir -p backend/src/controllers/ai
mkdir -p backend/src/routes/ai

# Create frontend AI directories
mkdir -p frontend/src/components/ai/{chat,agents,monitoring}
mkdir -p frontend/src/services/ai
mkdir -p frontend/src/pages/ai

# Copy existing AI backend files
echo "📦 Copying backend AI services..."

# AI Agents Service
cat > backend/src/services/ai/agents/AgentService.js << 'EOF'
/**
 * Wayra AI Agent Service
 * Manages the 4 specialized AI agents for travel planning
 */

const { OpenAIService } = require('../OpenAIService');
const { AgentTools } = require('../tools/AgentTools');
const { BudgetOptimizer } = require('../optimization/BudgetOptimizer');

class AgentService {
  constructor() {
    this.openAI = new OpenAIService();
    this.tools = new AgentTools();
    this.optimizer = new BudgetOptimizer();
  }

  /**
   * Budget Analyst Agent
   * Specializes in budget optimization and cost analysis
   */
  getBudgetAnalystAgent() {
    return {
      name: "Budget Analyst",
      role: "budget_analyst",
      expertise: "Budget optimization, cost analysis, price comparison, financial planning",
      systemPrompt: `You are a Budget Analyst Agent specializing in travel budget optimization.

Your expertise includes:
- Budget breakdown and allocation across travel components
- Cost optimization strategies and money-saving recommendations
- Price comparison and value analysis
- Financial planning for different travel styles and preferences
- Currency conversion and international travel budgeting

Always provide:
1. Detailed budget breakdowns with percentages
2. Specific cost-saving recommendations
3. Alternative options at different price points
4. Clear explanations of budget allocation reasoning
5. Practical tips for staying within budget

Focus on maximizing value while maintaining quality experiences.`,
      tools: [
        this.tools.budgetCalculator,
        this.tools.priceComparison,
        this.tools.currencyConverter,
        this.tools.costOptimizer
      ]
    };
  }

  /**
   * Destination Research Specialist Agent
   * Specializes in destination analysis and cultural insights
   */
  getDestinationResearchAgent() {
    return {
      name: "Destination Research Specialist",
      role: "destination_research",
      expertise: "Destination analysis, cultural insights, seasonal recommendations, local experiences",
      systemPrompt: `You are a Destination Research Specialist Agent with deep knowledge of global destinations.

Your expertise includes:
- Comprehensive destination analysis and recommendations
- Cultural insights and local customs
- Seasonal travel optimization and weather considerations
- Hidden gems and off-the-beaten-path experiences
- Safety considerations and travel advisories
- Local transportation and logistics

Always provide:
1. Detailed destination overview with key highlights
2. Best times to visit with weather and crowd considerations
3. Cultural insights and local customs to be aware of
4. Must-see attractions and hidden gems
5. Local food specialties and dining recommendations
6. Transportation options and logistics tips
7. Safety considerations and travel tips

Focus on authentic, budget-friendly experiences that provide genuine cultural immersion.`,
      tools: [
        this.tools.destinationSearch,
        this.tools.weatherAnalysis,
        this.tools.safetyChecker,
        this.tools.culturalGuide
      ]
    };
  }

  /**
   * Itinerary Planning Specialist Agent
   * Specializes in detailed itinerary creation and optimization
   */
  getItineraryPlanningAgent() {
    return {
      name: "Itinerary Planning Specialist",
      role: "itinerary_planning",
      expertise: "Route optimization, time management, activity scheduling, logistics coordination",
      systemPrompt: `You are an Itinerary Planning Specialist Agent focused on creating detailed, optimized travel itineraries.

Your expertise includes:
- Day-by-day itinerary planning with optimal routing
- Time management and realistic scheduling
- Activity coordination and booking timing
- Transportation logistics between locations
- Contingency planning and flexibility considerations
- Group travel coordination and preferences

Always provide:
1. Detailed daily schedules with specific times and locations
2. Realistic travel times between activities
3. Meal recommendations integrated into the schedule
4. Transportation options and booking information
5. Backup plans for weather or other disruptions
6. Cost estimates for each activity and day
7. Tips for efficient time management

Focus on creating realistic, enjoyable itineraries that maximize experiences while staying within budget and time constraints.

IMPORTANT: Always return your response as valid JSON with this exact structure:
{
  "day1": {
    "date": "YYYY-MM-DD",
    "activities": [
      {
        "time": "HH:MM",
        "activity": "Activity name",
        "location": "Specific location",
        "duration": "X hours",
        "cost": "Estimated cost",
        "description": "Detailed description",
        "tips": "Practical tips"
      }
    ],
    "meals": {
      "breakfast": "Recommendation with location and cost",
      "lunch": "Recommendation with location and cost", 
      "dinner": "Recommendation with location and cost"
    },
    "transportation": "Daily transportation summary",
    "totalCost": "Daily total estimated cost"
  }
}

Generate this structure for ALL days of the trip duration specified.`,
      tools: [
        this.tools.routeOptimizer,
        this.tools.schedulePlanner,
        this.tools.activityFinder,
        this.tools.transportCalculator
      ]
    };
  }

  /**
   * Travel Coordinator Agent
   * Specializes in logistics coordination and booking management
   */
  getTravelCoordinatorAgent() {
    return {
      name: "Travel Coordinator",
      role: "travel_coordinator",
      expertise: "Logistics coordination, booking management, documentation, crisis resolution",
      systemPrompt: `You are a Travel Coordinator Agent specializing in travel logistics and coordination.

Your expertise includes:
- Booking coordination and timing strategies
- Travel documentation and requirements
- Group travel management and coordination
- Crisis management and problem resolution
- Travel insurance and protection recommendations
- Communication and coordination tools

Always provide:
1. Booking timeline and strategy recommendations
2. Required documentation checklist
3. Group coordination suggestions and tools
4. Emergency contact information and procedures
5. Travel insurance recommendations
6. Communication plan for group travel
7. Contingency plans for common issues

Focus on ensuring smooth, well-coordinated travel experiences with proper preparation and risk management.`,
      tools: [
        this.tools.bookingOptimizer,
        this.tools.documentChecker,
        this.tools.crisisManager,
        this.tools.groupCoordinator
      ]
    };
  }

  /**
   * Execute a task with a specific agent
   */
  async executeAgentTask(agentRole, task, context = {}) {
    try {
      const agent = this.getAgentByRole(agentRole);
      if (!agent) {
        throw new Error(`Unknown agent role: ${agentRole}`);
      }

      // Build the prompt with context
      const prompt = this.buildAgentPrompt(agent, task, context);
      
      // Execute with OpenAI
      const response = await this.openAI.generateResponse(prompt, {
        maxTokens: agentRole === 'itinerary_planning' ? 3000 : 2000,
        temperature: 0.7
      });

      // Parse response based on agent type
      return this.parseAgentResponse(agentRole, response);

    } catch (error) {
      console.error(`Error executing ${agentRole} agent task:`, error);
      throw error;
    }
  }

  /**
   * Get agent by role
   */
  getAgentByRole(role) {
    switch (role) {
      case 'budget_analyst':
        return this.getBudgetAnalystAgent();
      case 'destination_research':
        return this.getDestinationResearchAgent();
      case 'itinerary_planning':
        return this.getItineraryPlanningAgent();
      case 'travel_coordinator':
        return this.getTravelCoordinatorAgent();
      default:
        return null;
    }
  }

  /**
   * Build agent prompt with context
   */
  buildAgentPrompt(agent, task, context) {
    const { destination, budget, duration, travelers, interests, dates } = context;
    
    let contextInfo = '';
    if (destination) contextInfo += `Destination: ${destination}\n`;
    if (budget) contextInfo += `Budget: $${budget}\n`;
    if (duration) contextInfo += `Duration: ${duration} days\n`;
    if (travelers) contextInfo += `Travelers: ${travelers}\n`;
    if (interests) contextInfo += `Interests: ${interests.join(', ')}\n`;
    if (dates) contextInfo += `Travel Dates: ${dates.start} to ${dates.end}\n`;

    return `${agent.systemPrompt}

CONTEXT:
${contextInfo}

TASK: ${task}

Please provide a comprehensive response based on your expertise and the given context.`;
  }

  /**
   * Parse agent response based on type
   */
  parseAgentResponse(agentRole, response) {
    try {
      // For itinerary planning, try to parse as JSON
      if (agentRole === 'itinerary_planning') {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: return structured text response
          return {
            error: "JSON parsing failed",
            rawResponse: response,
            fallbackItinerary: this.createFallbackItinerary(response)
          };
        }
      }
      
      // For other agents, return the text response
      return response;
      
    } catch (error) {
      console.error(`Error parsing ${agentRole} response:`, error);
      return {
        error: "Response parsing failed",
        rawResponse: response
      };
    }
  }

  /**
   * Create fallback itinerary when JSON parsing fails
   */
  createFallbackItinerary(response) {
    return {
      day1: {
        date: new Date().toISOString().split('T')[0],
        activities: [
          {
            time: "09:00",
            activity: "Arrival and Check-in",
            location: "Hotel",
            duration: "2 hours",
            cost: "Included",
            description: "Arrive at destination and check into accommodation",
            tips: "Keep important documents handy"
          }
        ],
        meals: {
          breakfast: "Hotel breakfast or local cafe - $15-25",
          lunch: "Local restaurant - $20-30",
          dinner: "Traditional cuisine - $25-40"
        },
        transportation: "Airport transfer and local transport",
        totalCost: "$100-150"
      },
      note: "This is a fallback itinerary. The AI response could not be parsed as JSON.",
      originalResponse: response.substring(0, 500) + "..."
    };
  }

  /**
   * Execute comprehensive multi-agent planning
   */
  async executeComprehensivePlanning(planningRequest) {
    try {
      const { destination, budget, duration, travelers, interests, dates } = planningRequest;
      
      const context = {
        destination,
        budget,
        duration,
        travelers,
        interests,
        dates
      };

      // Execute all agents in parallel for efficiency
      const [budgetAnalysis, destinationInsights, itineraryPlan, travelCoordination] = await Promise.allSettled([
        this.executeAgentTask('budget_analyst', 
          `Analyze and optimize the budget for a ${duration}-day trip to ${destination} for ${travelers} travelers with a total budget of $${budget}. Provide detailed breakdown and cost-saving recommendations.`, 
          context
        ),
        this.executeAgentTask('destination_research', 
          `Provide comprehensive research and insights for ${destination}, including best times to visit, cultural insights, must-see attractions, and local experiences suitable for travelers interested in ${interests?.join(', ')}.`, 
          context
        ),
        this.executeAgentTask('itinerary_planning', 
          `Create a detailed ${duration}-day itinerary for ${destination} for ${travelers} travelers with interests in ${interests?.join(', ')}. Include specific activities, times, locations, and costs for each day.`, 
          context
        ),
        this.executeAgentTask('travel_coordinator', 
          `Provide travel coordination recommendations for a ${duration}-day trip to ${destination} for ${travelers} travelers, including booking strategies, documentation requirements, and logistics coordination.`, 
          context
        )
      ]);

      return {
        budgetAnalysis: budgetAnalysis.status === 'fulfilled' ? budgetAnalysis.value : null,
        destinationInsights: destinationInsights.status === 'fulfilled' ? destinationInsights.value : null,
        itineraryPlan: itineraryPlan.status === 'fulfilled' ? itineraryPlan.value : null,
        travelCoordination: travelCoordination.status === 'fulfilled' ? travelCoordination.value : null,
        errors: {
          budgetAnalysis: budgetAnalysis.status === 'rejected' ? budgetAnalysis.reason : null,
          destinationInsights: destinationInsights.status === 'rejected' ? destinationInsights.reason : null,
          itineraryPlan: itineraryPlan.status === 'rejected' ? itineraryPlan.reason : null,
          travelCoordination: travelCoordination.status === 'rejected' ? travelCoordination.reason : null
        }
      };

    } catch (error) {
      console.error('Error in comprehensive planning:', error);
      throw error;
    }
  }
}

module.exports = { AgentService };
EOF

echo "✅ AI Agent Service migrated successfully!"

# Copy OpenAI Service
cat > backend/src/services/ai/OpenAIService.js << 'EOF'
/**
 * Wayra OpenAI Service
 * Handles all OpenAI API interactions with comprehensive error handling
 */

const OpenAI = require('openai');
const { configLoader } = require('../../config/configLoader');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: configLoader.getOpenAIConfig().apiKey
    });
    this.defaultModel = configLoader.getOpenAIConfig().model || 'gpt-4';
  }

  /**
   * Generate a response using OpenAI
   */
  async generateResponse(prompt, options = {}) {
    try {
      const {
        model = this.defaultModel,
        maxTokens = 2000,
        temperature = 0.7,
        systemMessage = null
      } = options;

      const messages = [];
      
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  /**
   * Generate travel planning response with specialized handling
   */
  async generateTravelPlanningResponse(prompt, agentType, context = {}) {
    try {
      const systemMessage = this.getTravelPlanningSystemMessage(agentType);
      
      const options = {
        systemMessage,
        maxTokens: agentType === 'itinerary_planning' ? 3000 : 2000,
        temperature: 0.7
      };

      return await this.generateResponse(prompt, options);

    } catch (error) {
      console.error(`Travel planning error for ${agentType}:`, error);
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
        return `${baseMessage} You specialize in budget optimization and cost analysis. Always provide specific dollar amounts, percentages, and actionable cost-saving strategies.`;
      
      case 'destination_research':
        return `${baseMessage} You specialize in destination research and cultural insights. Provide comprehensive information about locations, attractions, culture, and practical travel tips.`;
      
      case 'itinerary_planning':
        return `${baseMessage} You specialize in creating detailed day-by-day itineraries. Always respond with valid JSON format containing structured daily plans with specific times, activities, costs, and locations.`;
      
      case 'travel_coordinator':
        return `${baseMessage} You specialize in travel logistics and coordination. Focus on booking strategies, documentation, group coordination, and practical travel management.`;
      
      default:
        return baseMessage;
    }
  }

  /**
   * Health check for OpenAI service
   */
  async healthCheck() {
    try {
      const response = await this.generateResponse("Hello", { maxTokens: 10 });
      return { status: 'healthy', response: response.substring(0, 50) };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = { OpenAIService };
EOF

echo "✅ OpenAI Service migrated successfully!"

# Copy configuration loader
mkdir -p backend/src/config
cat > backend/src/config/configLoader.js << 'EOF'
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
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000
      },
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      },
      database: {
        url: process.env.DATABASE_URL,
        redis: process.env.REDIS_URL || 'redis://localhost:6379'
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
EOF

echo "✅ Configuration loader migrated successfully!"

# Copy AI routes
mkdir -p backend/src/routes/ai
cat > backend/src/routes/ai/agents.js << 'EOF'
/**
 * Wayra AI Agents Routes
 * API endpoints for multi-agent travel planning
 */

const express = require('express');
const router = express.Router();
const { AgentService } = require('../../services/ai/agents/AgentService');
const { authMiddleware } = require('../../middleware/auth');

const agentService = new AgentService();

// Execute comprehensive multi-agent planning
router.post('/comprehensive-planning', authMiddleware, async (req, res) => {
  try {
    const { destination, budget, duration, travelers, interests, dates } = req.body;

    // Validate required fields
    if (!destination || !budget || !duration || !travelers) {
      return res.status(400).json({
        error: 'Missing required fields: destination, budget, duration, travelers'
      });
    }

    const planningRequest = {
      destination,
      budget: parseFloat(budget),
      duration: parseInt(duration),
      travelers: parseInt(travelers),
      interests: interests || [],
      dates: dates || {}
    };

    const result = await agentService.executeComprehensivePlanning(planningRequest);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Comprehensive planning error:', error);
    res.status(500).json({
      error: 'Failed to execute comprehensive planning',
      details: error.message
    });
  }
});

// Execute individual agent task
router.post('/agent/:agentRole', authMiddleware, async (req, res) => {
  try {
    const { agentRole } = req.params;
    const { task, context } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    const result = await agentService.executeAgentTask(agentRole, task, context || {});

    res.json({
      success: true,
      agent: agentRole,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Agent ${req.params.agentRole} error:`, error);
    res.status(500).json({
      error: `Failed to execute ${req.params.agentRole} agent task`,
      details: error.message
    });
  }
});

// Get agent capabilities
router.get('/capabilities', (req, res) => {
  try {
    const capabilities = {
      agents: [
        {
          role: 'budget_analyst',
          name: 'Budget Analyst',
          description: 'Specializes in budget optimization and cost analysis',
          capabilities: ['budget_breakdown', 'cost_optimization', 'price_comparison', 'financial_planning']
        },
        {
          role: 'destination_research',
          name: 'Destination Research Specialist',
          description: 'Provides comprehensive destination insights and recommendations',
          capabilities: ['destination_analysis', 'cultural_insights', 'seasonal_recommendations', 'local_experiences']
        },
        {
          role: 'itinerary_planning',
          name: 'Itinerary Planning Specialist',
          description: 'Creates detailed day-by-day travel itineraries',
          capabilities: ['route_optimization', 'activity_scheduling', 'time_management', 'logistics_coordination']
        },
        {
          role: 'travel_coordinator',
          name: 'Travel Coordinator',
          description: 'Manages travel logistics and coordination',
          capabilities: ['booking_coordination', 'documentation_management', 'group_coordination', 'crisis_management']
        }
      ],
      workflows: [
        {
          name: 'comprehensive_planning',
          description: 'Full multi-agent travel planning workflow',
          agents: ['budget_analyst', 'destination_research', 'itinerary_planning', 'travel_coordinator']
        }
      ]
    };

    res.json(capabilities);

  } catch (error) {
    console.error('Error getting capabilities:', error);
    res.status(500).json({ error: 'Failed to get agent capabilities' });
  }
});

module.exports = router;
EOF

echo "✅ AI routes migrated successfully!"

# Copy frontend AI components
echo "📦 Copying frontend AI components..."

mkdir -p frontend/src/components/ai/agents
cat > frontend/src/components/ai/agents/MultiAgentPlanning.tsx << 'EOF'
/**
 * Wayra Multi-Agent Planning Component
 * Interface for comprehensive AI travel planning
 */

import React, { useState } from 'react';
import { multiAgentApi } from '../../../services/ai/multiAgentApi';

interface PlanningRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  dates: {
    start: string;
    end: string;
  };
}

interface AgentResult {
  budgetAnalysis: any;
  destinationInsights: any;
  itineraryPlan: any;
  travelCoordination: any;
  errors: any;
}

export const MultiAgentPlanning: React.FC = () => {
  const [planningRequest, setPlanningRequest] = useState<PlanningRequest>({
    destination: '',
    budget: 0,
    duration: 0,
    travelers: 1,
    interests: [],
    dates: { start: '', end: '' }
  });

  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await multiAgentApi.executeComprehensivePlanning(planningRequest);
      setResult(response.result);
      setCurrentStep(4);
    } catch (error) {
      console.error('Planning failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
            currentStep >= step ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderTripDetails = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Trip Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <input
            type="text"
            value={planningRequest.destination}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, destination: e.target.value }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g., Paris, France"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Budget ($)
          </label>
          <input
            type="number"
            value={planningRequest.budget}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (days)
          </label>
          <input
            type="number"
            value={planningRequest.duration}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="7"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Travelers
          </label>
          <input
            type="number"
            value={planningRequest.travelers}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!planningRequest.destination || !planningRequest.budget || !planningRequest.duration}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          Next: Preferences
        </button>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Preferences</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Travel Interests
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Museums', 'Food', 'Nightlife', 'Nature', 'Adventure', 'Culture', 'Shopping', 'Photography'].map((interest) => (
            <label key={interest} className="flex items-center">
              <input
                type="checkbox"
                checked={planningRequest.interests.includes(interest)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPlanningRequest(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                  } else {
                    setPlanningRequest(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Next: AI Planning
        </button>
      </div>
    </div>
  );

  const renderAIPlanning = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">AI Planning</h2>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Ready to create your personalized travel plan!</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>🎯 <strong>Destination:</strong> {planningRequest.destination}</p>
          <p>💰 <strong>Budget:</strong> ${planningRequest.budget.toLocaleString()}</p>
          <p>📅 <strong>Duration:</strong> {planningRequest.duration} days</p>
          <p>👥 <strong>Travelers:</strong> {planningRequest.travelers}</p>
          <p>🎨 <strong>Interests:</strong> {planningRequest.interests.join(', ')}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">AI agents are working on your travel plan...</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={loading}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 disabled:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Creating Plan...' : 'Create Travel Plan'}
        </button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Your AI-Generated Travel Plan</h2>
      
      {result && (
        <div className="space-y-6">
          {/* Agent Status Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">🤖 AI Agent Execution Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Budget Analysis', status: result.budgetAnalysis ? 'Complete' : 'Failed', icon: '💰' },
                { name: 'Destination Insights', status: result.destinationInsights ? 'Complete' : 'Failed', icon: '🌍' },
                { name: 'Itinerary Plan', status: result.itineraryPlan ? 'Complete' : 'Failed', icon: '📋' },
                { name: 'Travel Coordination', status: result.travelCoordination ? 'Complete' : 'Failed', icon: '✈️' }
              ].map((agent) => (
                <div key={agent.name} className={`p-3 rounded-md ${agent.status === 'Complete' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="text-lg">{agent.icon}</div>
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className={`text-xs ${agent.status === 'Complete' ? 'text-green-600' : 'text-red-600'}`}>
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Analysis */}
          {result.budgetAnalysis && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Budget Analysis</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {result.budgetAnalysis}
              </div>
            </div>
          )}

          {/* Destination Insights */}
          {result.destinationInsights && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🌍 Destination Insights</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {result.destinationInsights}
              </div>
            </div>
          )}

          {/* Itinerary Plan */}
          {result.itineraryPlan && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Detailed Itinerary</h3>
              {typeof result.itineraryPlan === 'object' ? (
                <div className="space-y-4">
                  {Object.entries(result.itineraryPlan).map(([day, details]: [string, any]) => (
                    <div key={day} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-800">{day.toUpperCase()}</h4>
                      {details.activities && (
                        <div className="mt-2 space-y-2">
                          {details.activities.map((activity: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600">
                              <strong>{activity.time}</strong> - {activity.activity} at {activity.location}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-gray-700">
                  {result.itineraryPlan}
                </div>
              )}
            </div>
          )}

          {/* Travel Coordination */}
          {result.travelCoordination && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">✈️ Travel Coordination</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {result.travelCoordination}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => {
            setResult(null);
            setCurrentStep(1);
          }}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200"
        >
          Plan Another Trip
        </button>
        <button
          onClick={() => console.log('Save plan functionality')}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          Save This Plan
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          AI Multi-Agent Travel Planning
        </h1>
        
        {renderStepIndicator()}
        
        {currentStep === 1 && renderTripDetails()}
        {currentStep === 2 && renderPreferences()}
        {currentStep === 3 && renderAIPlanning()}
        {currentStep === 4 && renderResults()}
      </div>
    </div>
  );
};
EOF

echo "✅ Frontend AI components migrated successfully!"

# Copy API service
mkdir -p frontend/src/services/ai
cat > frontend/src/services/ai/multiAgentApi.ts << 'EOF'
/**
 * Wayra Multi-Agent API Service
 * TypeScript client for AI agent interactions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface PlanningRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  dates?: {
    start: string;
    end: string;
  };
}

interface AgentResponse {
  success: boolean;
  result: any;
  timestamp: string;
}

interface ComprehensivePlanningResponse {
  success: boolean;
  result: {
    budgetAnalysis: any;
    destinationInsights: any;
    itineraryPlan: any;
    travelCoordination: any;
    errors: any;
  };
  timestamp: string;
}

class MultiAgentApi {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/api/ai${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async executeComprehensivePlanning(request: PlanningRequest): Promise<ComprehensivePlanningResponse> {
    return this.makeRequest('/agents/comprehensive-planning', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async executeAgentTask(agentRole: string, task: string, context: any = {}): Promise<AgentResponse> {
    return this.makeRequest(`/agents/agent/${agentRole}`, {
      method: 'POST',
      body: JSON.stringify({ task, context }),
    });
  }

  async getAgentCapabilities() {
    return this.makeRequest('/agents/capabilities');
  }

  async healthCheck() {
    return this.makeRequest('/health');
  }
}

export const multiAgentApi = new MultiAgentApi();
export type { PlanningRequest, AgentResponse, ComprehensivePlanningResponse };
EOF

echo "✅ API services migrated successfully!"

echo ""
echo "🎉 AI Migration Complete!"
echo ""
echo "✅ Migrated components:"
echo "   - AI Agent Service with 4 specialized agents"
echo "   - OpenAI Service with comprehensive error handling"
echo "   - Configuration loader with environment management"
echo "   - AI API routes for multi-agent planning"
echo "   - Frontend multi-agent planning component"
echo "   - TypeScript API service client"
echo ""
echo "🔧 Next steps:"
echo "   1. Install backend dependencies: cd backend && npm install"
echo "   2. Install frontend dependencies: cd frontend && npm install"
echo "   3. Configure environment variables"
echo "   4. Start development servers"
echo ""
echo "🚀 Ready to continue with world-class implementation!"

