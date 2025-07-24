/**
 * Collaboration Routes
 * Handles real-time collaboration endpoints
 */

const express = require('express');
const router = express.Router();

/**
 * Get collaboration status
 * GET /api/collaboration/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Collaboration service is active',
    features: {
      realtime: 'Socket.io integration',
      presence: 'User presence tracking',
      cursors: 'Real-time cursor sharing',
      comments: 'Collaborative commenting'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check for collaboration service
 * GET /api/collaboration/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    healthy: true,
    message: 'Collaboration service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
