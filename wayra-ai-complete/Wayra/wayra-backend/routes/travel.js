/**
 * Travel API Routes
 * Handles flight and hotel search endpoints
 */

const express = require('express');
const TravelApiService = require('../services/travelApis');
const router = express.Router();

// Initialize travel API service
const travelService = new TravelApiService();

// ==================== LOCATION SEARCH ROUTES ====================

/**
 * Search airports and cities for autocomplete
 * GET /api/travel/locations/search
 */
router.get('/locations/search', async (req, res) => {
  try {
    const { query, subType } = req.query;

    // Validate required parameters
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required and must be at least 2 characters'
      });
    }

    // Search locations using Amadeus API
    const results = await travelService.searchLocations(query, subType);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during location search',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Search airports for autocomplete (alias for locations/search)
 * GET /api/travel/airports/search
 */
router.get('/airports/search', async (req, res) => {
  try {
    const { query, subType } = req.query;

    // Validate required parameters
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required and must be at least 2 characters'
      });
    }

    // Search locations using Amadeus API (airports only)
    const results = await travelService.searchLocations(query, 'AIRPORT');

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during airport search',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== FLIGHT SEARCH ROUTES ====================

/**
 * Search flights across multiple APIs
 * POST /api/travel/flights/search
 */
router.post('/flights/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      max
    } = req.body;

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: origin, destination, departureDate'
      });
    }

    // Search flights across all available APIs
    const results = await travelService.searchAllFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: parseInt(adults) || 1,
      max: parseInt(max) || 10
    });

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during flight search'
    });
  }
});

/**
 * Search flights using Amadeus API only
 * POST /api/travel/flights/amadeus
 */
router.post('/flights/amadeus', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      max
    } = req.body;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: origin, destination, departureDate'
      });
    }

    const result = await travelService.searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: parseInt(adults) || 1,
      max: parseInt(max) || 10
    });

    res.json(result);

  } catch (error) {
    console.error('Amadeus flight search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during Amadeus flight search'
    });
  }
});

/**
 * Search flights using Skyscanner API only
 * POST /api/travel/flights/skyscanner
 */
router.post('/flights/skyscanner', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      country,
      currency,
      locale
    } = req.body;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: origin, destination, departureDate'
      });
    }

    const result = await travelService.searchSkyscannerFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: parseInt(adults) || 1,
      country: country || 'US',
      currency: currency || 'USD',
      locale: locale || 'en-US'
    });

    res.json(result);

  } catch (error) {
    console.error('Skyscanner flight search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during Skyscanner flight search'
    });
  }
});

// ==================== HOTEL SEARCH ROUTES ====================

/**
 * Search hotels across multiple APIs
 * POST /api/travel/hotels/search
 */
router.post('/hotels/search', async (req, res) => {
  try {
    const {
      cityCode,
      destId,
      checkInDate,
      checkOutDate,
      adults,
      max
    } = req.body;

    // Validate required parameters
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: checkInDate, checkOutDate'
      });
    }

    if (!cityCode && !destId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: cityCode (for Amadeus) or destId (for Booking.com)'
      });
    }

    // Search hotels across all available APIs
    const results = await travelService.searchAllHotels({
      cityCode,
      destId,
      checkInDate,
      checkOutDate,
      adults: parseInt(adults) || 1,
      max: parseInt(max) || 10
    });

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during hotel search'
    });
  }
});

/**
 * Search hotels using Amadeus API only
 * POST /api/travel/hotels/amadeus
 */
router.post('/hotels/amadeus', async (req, res) => {
  try {
    const {
      cityCode,
      checkInDate,
      checkOutDate,
      adults,
      max
    } = req.body;

    if (!cityCode || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: cityCode, checkInDate, checkOutDate'
      });
    }

    const result = await travelService.searchHotels({
      cityCode,
      checkInDate,
      checkOutDate,
      adults: parseInt(adults) || 1,
      max: parseInt(max) || 10
    });

    res.json(result);

  } catch (error) {
    console.error('Amadeus hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during Amadeus hotel search'
    });
  }
});

/**
 * Search hotels using Booking.com API only
 * POST /api/travel/hotels/booking
 */
router.post('/hotels/booking', async (req, res) => {
  try {
    const {
      destId,
      destType,
      checkInDate,
      checkOutDate,
      adults,
      max
    } = req.body;

    if (!destId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: destId, checkInDate, checkOutDate'
      });
    }

    const result = await travelService.searchBookingHotels({
      destId,
      destType: destType || 'city',
      checkInDate,
      checkOutDate,
      adults: parseInt(adults) || 1,
      max: parseInt(max) || 10
    });

    res.json(result);

  } catch (error) {
    console.error('Booking.com hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during Booking.com hotel search'
    });
  }
});

// ==================== UTILITY ROUTES ====================

/**
 * Get travel API status and configuration
 * GET /api/travel/status
 */
router.get('/status', (req, res) => {
  try {
    const status = travelService.getApiStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Travel API status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error getting API status'
    });
  }
});

/**
 * Health check for travel APIs
 * GET /api/travel/health
 */
router.get('/health', async (req, res) => {
  try {
    const status = travelService.getApiStatus();
    
    // Check if at least one API is configured
    const hasConfiguredApi = Object.values(status).some(api => api.configured);
    
    res.json({
      success: true,
      healthy: hasConfiguredApi,
      apis: status,
      message: hasConfiguredApi ? 'Travel APIs available' : 'No travel APIs configured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Travel API health check error:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Internal server error during health check'
    });
  }
});

module.exports = router;
