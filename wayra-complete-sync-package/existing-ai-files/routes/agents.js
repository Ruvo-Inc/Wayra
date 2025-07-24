/**
 * Multi-Agent API Routes for Wayra
 * Provides endpoints for specialized AI agent interactions
 * 
 * Integrates the multi-agent system with Wayra's existing API patterns
 */

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const AgentSystem = require('../../services/ai/agents');
const AgentTools = require('../../services/ai/agentTools');
const AIConfigLoader = require('../../utils/ai/configLoader');

// Initialize agent system and tools
const agentSystem = new AgentSystem();
const agentTools = new AgentTools();

/**
 * POST /api/ai/agents/analyze-budget
 * Budget Analyst Agent - Comprehensive budget analysis and optimization
 */
router.post('/analyze-budget', auth.verifyToken, async (req, res) => {
  try {
    const {
      totalBudget,
      duration,
      destination,
      travelers,
      categories,
      priorities,
      currentPlan
    } = req.body;

    // Validate required fields
    if (!totalBudget || !duration || !destination) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: totalBudget, duration, destination',
          type: 'VALIDATION_ERROR'
        }
      });
    }

    // Check if multi-agent feature is enabled
    if (!AIConfigLoader.isFeatureEnabled('multiAgents')) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Multi-agent feature is currently disabled',
          type: 'FEATURE_DISABLED'
        }
      });
    }

    // Prepare task context for Budget Analyst Agent
    const taskContext = {
      totalBudget: parseFloat(totalBudget),
      duration: parseInt(duration),
      destination,
      travelers: parseInt(travelers) || 1,
      categories: categories || {},
      priorities: priorities || {},
      currentPlan: currentPlan || null,
      userId: req.user.uid
    };

    // Execute Budget Analyst Agent task
    const analysisResult = await agentSystem.executeAgentTask(
      'budget_analyst',
      'Analyze the provided budget and create an optimized allocation strategy with detailed cost breakdown and money-saving recommendations',
      taskContext
    );

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Budget analysis failed',
          type: 'AGENT_EXECUTION_ERROR',
          details: analysisResult.error
        }
      });
    }

    // Enhance with tool-based calculations
    const budgetCalculations = await agentTools.budgetCalculator('optimize_allocation', {
      totalBudget: taskContext.totalBudget,
      categories: taskContext.categories,
      priorities: taskContext.priorities
    });

    res.json({
      success: true,
      data: {
        analysis: analysisResult.data.result,
        calculations: budgetCalculations.data,
        agent: 'Budget Analyst',
        context: taskContext
      },
      metadata: {
        service: 'multi_agent_budget_analysis',
        timestamp: new Date().toISOString(),
        tokensUsed: analysisResult.metadata?.tokensUsed || 0,
        cost: analysisResult.metadata?.cost || 0
      }
    });

  } catch (error) {
    console.error('Error in budget analysis:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during budget analysis',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/agents/research-destination
 * Destination Research Agent - Comprehensive destination analysis
 */
router.post('/research-destination', auth.verifyToken, async (req, res) => {
  try {
    const {
      destination,
      budget,
      interests,
      travelDates,
      travelers,
      preferences
    } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Destination is required',
          type: 'VALIDATION_ERROR'
        }
      });
    }

    // Prepare task context for Destination Research Agent
    const taskContext = {
      destination,
      budget: budget ? parseFloat(budget) : null,
      interests: interests || [],
      travelDates: travelDates || null,
      travelers: parseInt(travelers) || 1,
      preferences: preferences || {},
      userId: req.user.uid
    };

    // Execute Destination Research Agent task
    const researchResult = await agentSystem.executeAgentTask(
      'destination_research',
      'Research the destination and provide comprehensive insights including budget-friendly attractions, cultural information, seasonal considerations, and personalized recommendations',
      taskContext
    );

    if (!researchResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Destination research failed',
          type: 'AGENT_EXECUTION_ERROR',
          details: researchResult.error
        }
      });
    }

    // Enhance with tool-based research
    const destinationData = await agentTools.destinationSearch(destination, {
      budget: taskContext.budget,
      interests: taskContext.interests,
      season: taskContext.travelDates ? this.getSeasonFromDates(taskContext.travelDates) : null
    });

    const weatherAnalysis = await agentTools.weatherAnalysis(destination, taskContext.travelDates);

    res.json({
      success: true,
      data: {
        research: researchResult.data.result,
        destinationData: destinationData.data,
        weatherAnalysis: weatherAnalysis.data,
        agent: 'Destination Research Specialist',
        context: taskContext
      },
      metadata: {
        service: 'multi_agent_destination_research',
        timestamp: new Date().toISOString(),
        tokensUsed: researchResult.metadata?.tokensUsed || 0,
        cost: researchResult.metadata?.cost || 0
      }
    });

  } catch (error) {
    console.error('Error in destination research:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during destination research',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/agents/plan-itinerary
 * Itinerary Planning Agent - Detailed itinerary creation and optimization
 */
router.post('/plan-itinerary', auth.verifyToken, async (req, res) => {
  try {
    const {
      destination,
      duration,
      budget,
      travelers,
      interests,
      travelDates,
      preferences,
      destinationResearch,
      budgetAnalysis
    } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Destination and duration are required',
          type: 'VALIDATION_ERROR'
        }
      });
    }

    // Prepare task context for Itinerary Planning Agent
    const taskContext = {
      destination,
      duration: parseInt(duration),
      budget: budget ? parseFloat(budget) : null,
      travelers: parseInt(travelers) || 1,
      interests: interests || [],
      travelDates: travelDates || null,
      preferences: preferences || {},
      destinationResearch: destinationResearch || null,
      budgetAnalysis: budgetAnalysis || null,
      userId: req.user.uid
    };

    // Execute Itinerary Planning Agent task
    const itineraryResult = await agentSystem.executeAgentTask(
      'itinerary_planning',
      'Create a detailed, optimized itinerary that maximizes experiences within budget constraints, including daily schedules, transportation, and activity recommendations',
      taskContext
    );

    if (!itineraryResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Itinerary planning failed',
          type: 'AGENT_EXECUTION_ERROR',
          details: itineraryResult.error
        }
      });
    }

    // Enhance with tool-based planning
    const activityRecommendations = await agentTools.activityFinder(destination, {
      budget_range: this.getBudgetRange(taskContext.budget),
      interests: taskContext.interests,
      duration: taskContext.duration,
      group_size: taskContext.travelers
    });

    res.json({
      success: true,
      data: {
        itinerary: itineraryResult.data.result,
        activityRecommendations: activityRecommendations.data,
        agent: 'Itinerary Planning Specialist',
        context: taskContext
      },
      metadata: {
        service: 'multi_agent_itinerary_planning',
        timestamp: new Date().toISOString(),
        tokensUsed: itineraryResult.metadata?.tokensUsed || 0,
        cost: itineraryResult.metadata?.cost || 0
      }
    });

  } catch (error) {
    console.error('Error in itinerary planning:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during itinerary planning',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/agents/coordinate-travel
 * Travel Coordinator Agent - Logistics coordination and booking optimization
 */
router.post('/coordinate-travel', auth.verifyToken, async (req, res) => {
  try {
    const {
      itinerary,
      budget,
      travelers,
      preferences,
      bookingRequirements,
      flexibility
    } = req.body;

    if (!itinerary) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Itinerary is required for travel coordination',
          type: 'VALIDATION_ERROR'
        }
      });
    }

    // Prepare task context for Travel Coordinator Agent
    const taskContext = {
      itinerary,
      budget: budget ? parseFloat(budget) : null,
      travelers: parseInt(travelers) || 1,
      preferences: preferences || {},
      bookingRequirements: bookingRequirements || {},
      flexibility: flexibility || 'medium',
      userId: req.user.uid
    };

    // Execute Travel Coordinator Agent task
    const coordinationResult = await agentSystem.executeAgentTask(
      'travel_coordinator',
      'Coordinate all travel logistics, optimize booking strategies, and provide comprehensive travel preparation guidance',
      taskContext
    );

    if (!coordinationResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Travel coordination failed',
          type: 'AGENT_EXECUTION_ERROR',
          details: coordinationResult.error
        }
      });
    }

    // Enhance with tool-based coordination
    const bookingOptimization = await agentTools.bookingOptimizer('comprehensive', taskContext.itinerary, {
      budget: taskContext.budget,
      flexibility: taskContext.flexibility,
      priority: 'cost'
    });

    res.json({
      success: true,
      data: {
        coordination: coordinationResult.data.result,
        bookingOptimization: bookingOptimization.data,
        agent: 'Travel Coordinator',
        context: taskContext
      },
      metadata: {
        service: 'multi_agent_travel_coordination',
        timestamp: new Date().toISOString(),
        tokensUsed: coordinationResult.metadata?.tokensUsed || 0,
        cost: coordinationResult.metadata?.cost || 0
      }
    });

  } catch (error) {
    console.error('Error in travel coordination:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during travel coordination',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/agents/comprehensive-planning
 * Multi-Agent Coordination - Full travel planning workflow
 */
router.post('/comprehensive-planning', auth.verifyToken, async (req, res) => {
  try {
    const {
      destination,
      budget,
      duration,
      travelers,
      interests,
      travelDates,
      preferences
    } = req.body;

    // Validate required fields
    if (!destination || !budget || !duration || !travelers) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: destination, budget, duration, travelers',
          type: 'VALIDATION_ERROR'
        }
      });
    }

    // Prepare comprehensive planning context
    const planningContext = {
      destination,
      budget: parseFloat(budget),
      duration: parseInt(duration),
      travelers: parseInt(travelers),
      interests: interests || [],
      travelDates: travelDates || null,
      preferences: preferences || {},
      userId: req.user.uid
    };

    // Execute comprehensive planning workflow using agent coordination
    const planningResult = await agentSystem.coordinateAgents('comprehensive_planning', planningContext);

    if (!planningResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Comprehensive planning failed',
          type: 'AGENT_COORDINATION_ERROR',
          details: planningResult.error
        }
      });
    }

    // Extract results from each agent
    const {
      budget_analyst,
      destination_research,
      itinerary_planning,
      travel_coordinator
    } = planningResult.data.results;

    res.json({
      success: true,
      data: {
        budgetAnalysis: budget_analyst?.data?.result || null,
        destinationResearch: destination_research?.data?.result || null,
        itineraryPlan: itinerary_planning?.data?.result || null,
        travelCoordination: travel_coordinator?.data?.result || null,
        workflow: planningResult.data.workflow,
        context: planningContext
      },
      metadata: {
        service: 'multi_agent_comprehensive_planning',
        timestamp: new Date().toISOString(),
        totalAgents: planningResult.metadata?.totalAgents || 0,
        totalTokens: planningResult.metadata?.totalTokens || 0,
        totalCost: planningResult.metadata?.totalCost || 0
      }
    });

  } catch (error) {
    console.error('Error in comprehensive planning:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during comprehensive planning',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/agents/optimize-existing-plan
 * Multi-Agent Budget Optimization - Optimize existing travel plans
 */
router.post('/optimize-existing-plan', auth.verifyToken, async (req, res) => {
  try {
    const {
      currentPlan,
      targetBudget,
      priorities,
      constraints
    } = req.body;

    if (!currentPlan) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current plan is required for optimization',
          type: 'VALIDATION_ERROR'
        }
      });
    }

    // Prepare optimization context
    const optimizationContext = {
      currentPlan,
      targetBudget: targetBudget ? parseFloat(targetBudget) : null,
      priorities: priorities || ['cost', 'experience'],
      constraints: constraints || [],
      userId: req.user.uid
    };

    // Execute budget optimization workflow
    const optimizationResult = await agentSystem.coordinateAgents('budget_optimization', optimizationContext);

    if (!optimizationResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Plan optimization failed',
          type: 'AGENT_COORDINATION_ERROR',
          details: optimizationResult.error
        }
      });
    }

    res.json({
      success: true,
      data: {
        optimization: optimizationResult.data.results,
        workflow: optimizationResult.data.workflow,
        context: optimizationContext
      },
      metadata: {
        service: 'multi_agent_plan_optimization',
        timestamp: new Date().toISOString(),
        totalAgents: optimizationResult.metadata?.totalAgents || 0,
        totalTokens: optimizationResult.metadata?.totalTokens || 0,
        totalCost: optimizationResult.metadata?.totalCost || 0
      }
    });

  } catch (error) {
    console.error('Error in plan optimization:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during plan optimization',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/ai/agents/capabilities
 * Get available agent capabilities and status
 */
router.get('/capabilities', auth.verifyToken, async (req, res) => {
  try {
    const capabilities = {
      agents: {
        budget_analyst: {
          available: true,
          capabilities: ['budget_optimization', 'cost_analysis', 'price_comparison'],
          description: 'Specializes in budget optimization and financial analysis'
        },
        destination_research: {
          available: true,
          capabilities: ['destination_analysis', 'cultural_insights', 'seasonal_recommendations'],
          description: 'Provides comprehensive destination insights and recommendations'
        },
        itinerary_planning: {
          available: true,
          capabilities: ['itinerary_optimization', 'route_planning', 'activity_scheduling'],
          description: 'Creates detailed, optimized itineraries'
        },
        travel_coordinator: {
          available: true,
          capabilities: ['logistics_coordination', 'booking_management', 'crisis_management'],
          description: 'Coordinates travel logistics and booking optimization'
        }
      },
      workflows: {
        comprehensive_planning: {
          available: true,
          description: 'Full travel planning using all agents',
          estimated_time: '2-3 minutes'
        },
        budget_optimization: {
          available: true,
          description: 'Focused budget optimization workflow',
          estimated_time: '1-2 minutes'
        }
      },
      features: {
        multi_agent_coordination: AIConfigLoader.isFeatureEnabled('multiAgents'),
        budget_optimization: AIConfigLoader.isFeatureEnabled('budgetOptimization'),
        weather_integration: AIConfigLoader.isFeatureEnabled('weatherIntegration')
      }
    };

    res.json({
      success: true,
      data: capabilities,
      metadata: {
        service: 'multi_agent_capabilities',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting agent capabilities:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error getting capabilities',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Helper methods
 */
function getSeasonFromDates(travelDates) {
  if (!travelDates || !travelDates.start) return null;
  
  const startDate = new Date(travelDates.start);
  const month = startDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

function getBudgetRange(budget) {
  if (!budget) return 'medium';
  if (budget < 1000) return 'low';
  if (budget < 3000) return 'medium';
  return 'high';
}

module.exports = router;

