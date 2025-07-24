/**
 * AI Conversation Routes for Wayra
 * Provides API endpoints for AI-powered travel planning conversations
 * 
 * Integrates with existing Wayra authentication and database patterns
 */

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const OpenAIService = require('../../services/ai/openAIService');
const AIConfigLoader = require('../../utils/ai/configLoader');

// Initialize AI service
const openAIService = new OpenAIService();

/**
 * POST /api/ai/conversation/start
 * Start a new AI conversation for travel planning
 */
router.post('/start', auth.verifyToken, async (req, res) => {
  try {
    const {
      destination,
      budget,
      duration,
      travelers,
      interests,
      travelDates,
      tripId
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
    
    // Check if AI conversation feature is enabled
    if (!AIConfigLoader.isFeatureEnabled('aiConversation')) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'AI conversation feature is currently disabled',
          type: 'FEATURE_DISABLED'
        }
      });
    }
    
    // Generate initial travel plan
    const planRequest = {
      destination,
      budget: parseFloat(budget),
      duration: parseInt(duration),
      travelers: parseInt(travelers),
      interests: interests || [],
      travelDates,
      budgetPriority: 'high', // Wayra's focus on budget optimization
      userId: req.user.uid
    };
    
    const planResult = await openAIService.generateTravelPlan(planRequest);
    
    if (!planResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate initial travel plan',
          type: 'AI_GENERATION_ERROR',
          details: planResult.error
        }
      });
    }
    
    // Create conversation record in database
    const conversationId = `conv_${Date.now()}_${req.user.uid}`;
    
    // TODO: Save conversation to MongoDB using existing patterns
    // This would integrate with Wayra's existing database models
    
    res.json({
      success: true,
      data: {
        conversationId,
        initialPlan: planResult.data,
        message: `I've created an initial travel plan for your ${duration}-day trip to ${destination} with a budget of $${budget}. Let me know if you'd like to adjust anything or have specific questions!`,
        tripId: tripId || null
      },
      metadata: {
        service: 'ai_conversation',
        timestamp: new Date().toISOString(),
        tokensUsed: planResult.metadata?.tokensUsed || 0,
        cost: planResult.metadata?.cost || 0
      }
    });
    
  } catch (error) {
    console.error('Error starting AI conversation:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error while starting conversation',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/conversation/:conversationId/message
 * Send a message in an existing conversation
 */
router.post('/:conversationId/message', auth.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, context } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message content is required',
          type: 'VALIDATION_ERROR'
        }
      });
    }
    
    // TODO: Retrieve conversation context from database
    // This would use Wayra's existing MongoDB patterns
    const conversationContext = context || {};
    
    // Continue conversation with AI
    const response = await openAIService.continueConversation(
      conversationId,
      message,
      conversationContext
    );
    
    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process conversation message',
          type: 'AI_PROCESSING_ERROR',
          details: response.error
        }
      });
    }
    
    // TODO: Save message and response to database
    // This would update the conversation record in MongoDB
    
    res.json({
      success: true,
      data: {
        conversationId,
        response: response.data.response,
        tripUpdates: response.data.tripUpdates,
        timestamp: response.data.timestamp
      },
      metadata: {
        service: 'ai_conversation',
        tokensUsed: response.metadata?.tokensUsed || 0,
        cost: response.metadata?.cost || 0
      }
    });
    
  } catch (error) {
    console.error('Error processing conversation message:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error while processing message',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/ai/conversation/:conversationId
 * Retrieve conversation history
 */
router.get('/:conversationId', auth.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // TODO: Retrieve conversation from database
    // This would use Wayra's existing MongoDB patterns to fetch conversation history
    
    // Placeholder response - would be replaced with actual database query
    res.json({
      success: true,
      data: {
        conversationId,
        messages: [], // Would contain actual conversation history
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      },
      metadata: {
        service: 'ai_conversation',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error while retrieving conversation',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/ai/conversation/:conversationId/optimize
 * Optimize travel plan within conversation context
 */
router.post('/:conversationId/optimize', auth.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const {
      targetBudget,
      priorities,
      constraints,
      currentPlan
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
    
    // Check if budget optimization feature is enabled
    if (!AIConfigLoader.isFeatureEnabled('budgetOptimization')) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Budget optimization feature is currently disabled',
          type: 'FEATURE_DISABLED'
        }
      });
    }
    
    // Optimize travel plan
    const optimizationResult = await openAIService.optimizeTravelPlan(
      conversationId,
      {
        targetBudget: targetBudget ? parseFloat(targetBudget) : undefined,
        priorities: priorities || ['cost', 'experience'],
        constraints: constraints || [],
        currentPlan
      }
    );
    
    if (!optimizationResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to optimize travel plan',
          type: 'AI_OPTIMIZATION_ERROR',
          details: optimizationResult.error
        }
      });
    }
    
    // TODO: Save optimization results to database
    // This would update the conversation and trip records
    
    res.json({
      success: true,
      data: {
        conversationId,
        optimizations: optimizationResult.data.optimizations,
        savingsAnalysis: optimizationResult.data.savingsAnalysis,
        optimizedAt: optimizationResult.data.optimizedAt
      },
      metadata: {
        service: 'ai_optimization',
        tokensUsed: optimizationResult.metadata?.tokensUsed || 0,
        cost: optimizationResult.metadata?.cost || 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error optimizing travel plan:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error while optimizing plan',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * DELETE /api/ai/conversation/:conversationId
 * End/archive a conversation
 */
router.delete('/:conversationId', auth.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // TODO: Archive conversation in database
    // This would update the conversation status to 'archived'
    
    res.json({
      success: true,
      data: {
        conversationId,
        status: 'archived',
        archivedAt: new Date().toISOString()
      },
      metadata: {
        service: 'ai_conversation',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error archiving conversation:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error while archiving conversation',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/ai/conversation/user/:userId
 * Get all conversations for a user
 */
router.get('/user/:userId', auth.verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access these conversations
    if (req.user.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to user conversations',
          type: 'ACCESS_DENIED'
        }
      });
    }
    
    // TODO: Retrieve user conversations from database
    // This would use Wayra's existing MongoDB patterns
    
    res.json({
      success: true,
      data: {
        conversations: [], // Would contain actual user conversations
        totalCount: 0,
        activeCount: 0
      },
      metadata: {
        service: 'ai_conversation',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error retrieving user conversations:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error while retrieving conversations',
        type: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;

