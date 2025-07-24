const express = require('express');
const router = express.Router();
const Adventure = require('../models/Adventure');
const Collection = require('../models/Collection');
const Visit = require('../models/Visit');
const { verifyToken } = require('../middleware/auth');

// GET /api/geography - Geography API information
router.get('/', (req, res) => {
  res.json({
    message: 'Wayra Geography API',
    version: '1.0.0',
    status: 'operational',
    description: 'AdventureLog geographic tracking and management',
    endpoints: {
      countries: 'GET /api/geography/countries - List visited countries',
      cities: 'GET /api/geography/cities - List visited cities',
      stats: 'GET /api/geography/stats - Get user travel statistics',
      mapData: 'GET /api/geography/map-data - Get data for map visualization',
      nearby: 'GET /api/geography/nearby - Find adventures near coordinates'
    },
    authentication: 'Required for all endpoints except root',
    timestamp: new Date().toISOString()
  });
});

// GET /api/geography/countries - List visited countries
router.get('/countries', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all visited adventures with location data
    const visitedAdventures = await Adventure.find({
      userId,
      isVisited: true,
      location: { $exists: true, $ne: null, $ne: '' }
    }).select('name location coordinates rating category createdAt');

    // Helper function to parse location string
    const parseLocation = (locationStr) => {
      if (!locationStr) return { city: null, country: null };
      
      // Common location formats: "City, Country" or "City, State, Country"
      const parts = locationStr.split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        const country = parts[parts.length - 1]; // Last part is usually country
        const city = parts[0]; // First part is usually city
        return { city, country };
      }
      
      // If only one part, assume it's the country
      return { city: null, country: parts[0] };
    };

    // Group by country
    const countryStats = {};
    visitedAdventures.forEach(adventure => {
      const { city, country } = parseLocation(adventure.location);
      
      if (!country) return; // Skip if no country can be determined
      
      if (!countryStats[country]) {
        countryStats[country] = {
          country,
          adventureCount: 0,
          adventures: [],
          cities: new Set(),
          firstVisit: null,
          lastVisit: null,
          avgRating: 0,
          totalRating: 0,
          ratedCount: 0
        };
      }

      const stats = countryStats[country];
      stats.adventureCount++;
      stats.adventures.push({
        name: adventure.name,
        location: adventure.location,
        rating: adventure.rating,
        visitDate: adventure.createdAt
      });

      if (city) {
        stats.cities.add(city);
      }

      // Track visit dates
      const visitDate = adventure.createdAt;
      if (!stats.firstVisit || visitDate < stats.firstVisit) {
        stats.firstVisit = visitDate;
      }
      if (!stats.lastVisit || visitDate > stats.lastVisit) {
        stats.lastVisit = visitDate;
      }

      // Calculate ratings
      if (adventure.rating) {
        stats.totalRating += adventure.rating;
        stats.ratedCount++;
        stats.avgRating = stats.totalRating / stats.ratedCount;
      }
    });

    // Convert to array and format
    const countries = Object.values(countryStats).map(stats => ({
      country: stats.country,
      adventureCount: stats.adventureCount,
      cityCount: stats.cities.size,
      firstVisit: stats.firstVisit,
      lastVisit: stats.lastVisit,
      avgRating: Math.round(stats.avgRating * 10) / 10,
      adventures: stats.adventures
    })).sort((a, b) => b.adventureCount - a.adventureCount);

    res.json({
      countries,
      total: countries.length,
      totalAdventures: visitedAdventures.length
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/geography/cities - List visited cities
router.get('/cities', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all visited adventures with location data
    const visitedAdventures = await Adventure.find({
      userId,
      isVisited: true,
      location: { $exists: true, $ne: null, $ne: '' }
    }).select('name location coordinates rating category createdAt');

    // Helper function to parse location string (same as countries endpoint)
    const parseLocation = (locationStr) => {
      if (!locationStr) return { city: null, country: null };
      
      // Common location formats: "City, Country" or "City, State, Country"
      const parts = locationStr.split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        const country = parts[parts.length - 1]; // Last part is usually country
        const city = parts[0]; // First part is usually city
        return { city, country };
      }
      
      // If only one part, assume it's the country
      return { city: null, country: parts[0] };
    };

    // Group by city
    const cityStats = {};
    visitedAdventures.forEach(adventure => {
      const { city, country } = parseLocation(adventure.location);
      
      if (!city) return; // Skip if no city can be determined
      
      const cityKey = `${city}, ${country}`;
      if (!cityStats[cityKey]) {
        cityStats[cityKey] = {
          city,
          country,
          adventureCount: 0,
          adventures: [],
          firstVisit: null,
          lastVisit: null,
          avgRating: 0,
          totalRating: 0,
          ratedCount: 0,
          coordinates: null
        };
      }

      const stats = cityStats[cityKey];
      stats.adventureCount++;
      stats.adventures.push({
        name: adventure.name,
        location: adventure.location,
        rating: adventure.rating,
        visitDate: adventure.createdAt
      });

      // Track visit dates
      const visitDate = adventure.createdAt;
      if (!stats.firstVisit || visitDate < stats.firstVisit) {
        stats.firstVisit = visitDate;
      }
      if (!stats.lastVisit || visitDate > stats.lastVisit) {
        stats.lastVisit = visitDate;
      }

      // Calculate ratings
      if (adventure.rating) {
        stats.totalRating += adventure.rating;
        stats.ratedCount++;
        stats.avgRating = stats.totalRating / stats.ratedCount;
      }

      // Use coordinates if available
      if (adventure.coordinates && !stats.coordinates) {
        stats.coordinates = adventure.coordinates;
      }
    });

    // Convert to array and format
    const cities = Object.values(cityStats).map(stats => ({
      city: stats.city,
      country: stats.country,
      adventureCount: stats.adventureCount,
      firstVisit: stats.firstVisit,
      lastVisit: stats.lastVisit,
      avgRating: Math.round(stats.avgRating * 10) / 10,
      coordinates: stats.coordinates,
      adventures: stats.adventures
    })).sort((a, b) => b.adventureCount - a.adventureCount);

    res.json({
      cities,
      total: cities.length,
      totalAdventures: visitedAdventures.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET /api/geography/stats - Get user travel statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all adventures with location data
    const adventures = await Adventure.find({
      userId,
      location: { $exists: true, $ne: null, $ne: '' }
    }).select('name location coordinates rating category isVisited createdAt');

    const visitedAdventures = adventures.filter(a => a.isVisited);

    // Helper function to parse location string (same as other endpoints)
    const parseLocation = (locationStr) => {
      if (!locationStr) return { city: null, country: null };
      
      // Common location formats: "City, Country" or "City, State, Country"
      const parts = locationStr.split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        const country = parts[parts.length - 1]; // Last part is usually country
        const city = parts[0]; // First part is usually city
        return { city, country };
      }
      
      // If only one part, assume it's the country
      return { city: null, country: parts[0] };
    };

    // Calculate statistics
    const stats = {
      totalAdventures: adventures.length,
      visitedAdventures: visitedAdventures.length,
      countries: new Set(),
      visitedCountries: new Set(),
      cities: new Set(),
      visitedCities: new Set()
    };

    adventures.forEach(adventure => {
      const { city, country } = parseLocation(adventure.location);
      
      if (country) {
        stats.countries.add(country);
        if (adventure.isVisited) {
          stats.visitedCountries.add(country);
        }
      }

      if (city) {
        const cityKey = `${city}, ${country}`;
        stats.cities.add(cityKey);
        if (adventure.isVisited) {
          stats.visitedCities.add(cityKey);
        }
      }
    });

    // Get recent visits
    const recentVisits = await Visit.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .populate('adventureId', 'name location')
      .exec();

    res.json({
      overview: {
        totalAdventures: stats.totalAdventures,
        visitedAdventures: stats.visitedAdventures,
        completionRate: stats.totalAdventures > 0 ? Math.round((stats.visitedAdventures / stats.totalAdventures) * 100) : 0
      },
      geographic: {
        countries: {
          total: stats.countries.size,
          visited: stats.visitedCountries.size
        },
        cities: {
          total: stats.cities.size,
          visited: stats.visitedCities.size
        }
      },
      recentVisits: recentVisits.map(visit => ({
        date: visit.date,
        adventure: visit.adventureId ? {
          name: visit.adventureId.name,
          location: visit.adventureId.location
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching geography stats:', error);
    res.status(500).json({ error: 'Failed to fetch geography statistics' });
  }
});

// GET /api/geography/map-data - Get data for map visualization
router.get('/map-data', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all adventures with coordinates
    const adventures = await Adventure.find({
      userId,
      coordinates: { $exists: true }
    }).select('name location coordinates rating category isVisited visitDate');

    // Separate visited and unvisited
    const visitedAdventures = adventures.filter(a => a.isVisited);
    const plannedAdventures = adventures.filter(a => !a.isVisited);

    // Get collections with adventures for grouping
    const collections = await Collection.find({ userId })
      .populate('adventures', 'name coordinates location rating isVisited')
      .select('name description adventures');

    res.json({
      adventures: {
        visited: visitedAdventures.map(a => ({
          id: a._id,
          name: a.name,
          location: a.location,
          coordinates: a.coordinates,
          rating: a.rating,
          category: a.category,
          visitDate: a.visitDate
        })),
        planned: plannedAdventures.map(a => ({
          id: a._id,
          name: a.name,
          location: a.location,
          coordinates: a.coordinates,
          rating: a.rating,
          category: a.category
        }))
      },
      collections: collections.map(c => ({
        id: c._id,
        name: c.name,
        description: c.description,
        adventures: c.adventures.filter(a => a.coordinates).map(a => ({
          id: a._id,
          name: a.name,
          coordinates: a.coordinates,
          isVisited: a.isVisited
        }))
      })),
      summary: {
        totalAdventures: adventures.length,
        visitedAdventures: visitedAdventures.length,
        plannedAdventures: plannedAdventures.length,
        collections: collections.length
      }
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

// GET /api/geography/nearby - Find adventures near coordinates
router.get('/nearby', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = parseInt(maxDistance);

    // Find adventures near the coordinates
    const nearbyAdventures = await Adventure.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: distance
        }
      }
    }).select('name location coordinates rating category isVisited userId');

    // Filter by user's adventures and public adventures
    const accessibleAdventures = nearbyAdventures.filter(adventure => 
      adventure.userId === req.user.uid || adventure.isPublic
    );

    res.json({
      adventures: accessibleAdventures.map(a => ({
        id: a._id,
        name: a.name,
        location: a.location,
        coordinates: a.coordinates,
        rating: a.rating,
        category: a.category,
        isVisited: a.isVisited,
        isOwn: a.userId === req.user.uid
      })),
      searchCenter: {
        latitude: lat,
        longitude: lng
      },
      maxDistance: distance,
      total: accessibleAdventures.length
    });
  } catch (error) {
    console.error('Error finding nearby adventures:', error);
    res.status(500).json({ error: 'Failed to find nearby adventures' });
  }
});

module.exports = router;
