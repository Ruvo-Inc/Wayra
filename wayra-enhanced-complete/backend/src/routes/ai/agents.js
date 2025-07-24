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
