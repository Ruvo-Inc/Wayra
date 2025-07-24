const express = require('express');
const router = express.Router();
const DatabaseUtils = require('../utils/database');
const redisUtils = require('../utils/redis');

/**
 * Trip Management API Routes
 * Handles trip creation, retrieval, updates, and collaboration
 */

// Import Firebase authentication middleware
const { verifyToken } = require('../middleware/auth');

// Rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
  const identifier = req.ip + ':' + (req.user?.uid || 'anonymous');
  const rateLimit = await redisUtils.checkRateLimit(identifier, 100, 3600);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      resetTime: rateLimit.resetTime
    });
  }
  
  res.set('X-RateLimit-Remaining', rateLimit.remaining);
  next();
};

/**
 * GET /api/trips
 * Get all trips for the authenticated user
 */
router.get('/', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt' } = req.query;
    
    // Check cache first
    const cacheKey = `user:${req.user.uid}:trips:${page}:${limit}:${status}:${sortBy}`;
    const cachedTrips = await redisUtils.get(cacheKey);
    
    if (cachedTrips) {
      return res.json({
        success: true,
        trips: cachedTrips.trips,
        pagination: cachedTrips.pagination,
        cached: true
      });
    }
    
    const result = await DatabaseUtils.getUserTrips(req.user.uid);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch trips',
        message: result.error
      });
    }
    
    let trips = result.trips;
    
    // Filter by status if provided
    if (status) {
      trips = trips.filter(trip => trip.status === status);
    }
    
    // Sort trips
    trips.sort((a, b) => {
      if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'startDate') return new Date(a.startDate) - new Date(b.startDate);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTrips = trips.slice(startIndex, endIndex);
    
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(trips.length / limit),
      totalTrips: trips.length,
      hasNext: endIndex < trips.length,
      hasPrev: startIndex > 0
    };
    
    // Cache the result
    await redisUtils.set(cacheKey, { trips: paginatedTrips, pagination }, 900);
    
    res.json({
      success: true,
      trips: paginatedTrips,
      pagination
    });
    
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/trips
 * Create a new trip
 */
router.post('/', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      destinations,
      budget
    } = req.body;
    
    // Validation
    if (!title || !startDate || !endDate || !budget?.total) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'startDate', 'endDate', 'budget.total']
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'End date must be after start date'
      });
    }
    
    if (start < new Date()) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'Start date cannot be in the past'
      });
    }
    
    const tripData = {
      title: title.trim(),
      description: description?.trim() || '',
      startDate: start,
      endDate: end,
      destinations: destinations || [],
      budget: {
        total: parseFloat(budget.total),
        currency: budget.currency || 'USD',
        categories: budget.categories || {},
        spent: {
          accommodation: 0,
          transportation: 0,
          food: 0,
          activities: 0,
          shopping: 0,
          other: 0
        }
      },
      itinerary: [],
      collaborators: [],
      status: 'planning'
    };
    
    const result = await DatabaseUtils.createTrip(req.user.uid, tripData);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to create trip',
        message: result.error
      });
    }
    
    // Invalidate user trips cache
    const cachePattern = `user:${req.user.uid}:trips:*`;
    // Note: In production, implement proper cache invalidation
    
    // Log activity
    await redisUtils.logActivity(result.trip._id, req.user.uid, 'created trip');
    
    res.status(201).json({
      success: true,
      trip: result.trip,
      message: 'Trip created successfully'
    });
    
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/trips/:id
 * Get a specific trip by ID
 */
router.get('/:id', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check cache first
    const cachedTrip = await redisUtils.getCachedTrip(id);
    if (cachedTrip) {
      return res.json({
        success: true,
        trip: cachedTrip,
        cached: true
      });
    }
    
    const result = await DatabaseUtils.getTripById(id, req.user.uid);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch trip',
        message: result.error
      });
    }
    
    if (!result.trip) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip does not exist or you do not have access'
      });
    }
    
    // Cache the trip
    await redisUtils.cacheTrip(id, result.trip);
    
    // Update user presence
    await redisUtils.setUserPresence(id, req.user.uid, {
      displayName: req.user.name || req.user.email || 'Anonymous',
      lastAction: 'viewing trip'
    });
    
    res.json({
      success: true,
      trip: result.trip
    });
    
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/trips/:id
 * Update a trip
 */
router.put('/:id', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.owner;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const result = await DatabaseUtils.updateTrip(id, req.user.uid, updateData);
    
    if (!result.success) {
      if (result.error.includes('not found') || result.error.includes('permissions')) {
        return res.status(404).json({
          error: 'Trip not found',
          message: result.error
        });
      }
      
      return res.status(500).json({
        error: 'Failed to update trip',
        message: result.error
      });
    }
    
    // Invalidate cache
    await redisUtils.invalidateTripCache(id);
    
    // Log activity
    await redisUtils.logActivity(id, req.user.uid, 'updated trip');
    
    // Publish real-time update
    await redisUtils.publishTripUpdate(id, {
      type: 'trip_updated',
      userId: req.user.uid,
      changes: Object.keys(updateData)
    });
    
    res.json({
      success: true,
      trip: result.trip,
      message: 'Trip updated successfully'
    });
    
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/trips/:id
 * Delete a trip
 */
router.delete('/:id', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await DatabaseUtils.deleteTrip(id, req.user.uid);
    
    if (!result.success) {
      if (result.error.includes('not found') || result.error.includes('permissions')) {
        return res.status(404).json({
          error: 'Trip not found',
          message: result.error
        });
      }
      
      return res.status(500).json({
        error: 'Failed to delete trip',
        message: result.error
      });
    }
    
    // Invalidate cache
    await redisUtils.invalidateTripCache(id);
    
    // Log activity
    await redisUtils.logActivity(id, req.user.uid, 'deleted trip');
    
    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/trips/:id/collaborators
 * Add a collaborator to a trip
 */
router.post('/:id/collaborators', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'viewer' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Email is required'
      });
    }
    
    const result = await DatabaseUtils.addCollaborator(id, req.user.uid, email, role);
    
    if (!result.success) {
      if (result.error.includes('not found')) {
        return res.status(404).json({
          error: 'User or trip not found',
          message: result.error
        });
      }
      
      return res.status(500).json({
        error: 'Failed to add collaborator',
        message: result.error
      });
    }
    
    // Invalidate cache
    await redisUtils.invalidateTripCache(id);
    
    // Log activity
    await redisUtils.logActivity(id, req.user.uid, `added collaborator: ${email}`);
    
    // Publish real-time update
    await redisUtils.publishTripUpdate(id, {
      type: 'collaborator_added',
      userId: req.user.uid,
      collaborator: result.collaborator
    });
    
    res.json({
      success: true,
      trip: result.trip,
      collaborator: result.collaborator,
      message: 'Collaborator added successfully'
    });
    
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/trips/:id/activity
 * Get trip activity log
 */
router.get('/:id/activity', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    
    // Verify user has access to trip
    const tripResult = await DatabaseUtils.getTripById(id, req.user.id);
    if (!tripResult.success || !tripResult.trip) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip does not exist or you do not have access'
      });
    }
    
    const activities = await redisUtils.getTripActivity(id, parseInt(limit));
    
    res.json({
      success: true,
      activities
    });
    
  } catch (error) {
    console.error('Get trip activity error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/trips/:id/presence
 * Get current users viewing the trip
 */
router.get('/:id/presence', verifyToken, rateLimitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user has access to trip
    const tripResult = await DatabaseUtils.getTripById(id, req.user.id);
    if (!tripResult.success || !tripResult.trip) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip does not exist or you do not have access'
      });
    }
    
    const presence = await redisUtils.getTripPresence(id);
    
    res.json({
      success: true,
      presence
    });
    
  } catch (error) {
    console.error('Get trip presence error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
