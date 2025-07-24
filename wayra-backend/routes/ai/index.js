/**
 * AI Routes Index
 * Main router for all AI-related endpoints
 */

const express = require('express');
const router = express.Router();

// Import AI route modules
const conversationRoutes = require('./conversation');

// Mount conversation routes
router.use('/conversation', conversationRoutes);

// Health check endpoint for AI services
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'ai_routes',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      conversation: true,
      optimization: true,
      planning: true
    }
  });
});

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Wayra AI Services API',
    version: '1.0.0',
    endpoints: {
      conversation: '/api/ai/conversation',
      health: '/api/ai/health'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
