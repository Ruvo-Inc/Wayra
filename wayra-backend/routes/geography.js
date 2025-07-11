const express = require('express');
const router = express.Router();
const { Country, Region, City, VisitedCountry, VisitedRegion, VisitedCity } = require('../models/Geography');
const Adventure = require('../models/Adventure');

// Middleware to verify user authentication
const authenticateUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GET /api/geography - Geography API information
router.get('/', (req, res) => {
  res.json({
    message: 'Wayra Geography API',
    version: '1.0.0',
    status: 'operational',
    description: 'AdventureLog geographic tracking and management',
    endpoints: {
      countries: 'GET /api/geography/countries - List all countries with visit statistics',
      regions: 'GET /api/geography/countries/:countryCode/regions - List regions for a country',
      cities: 'GET /api/geography/regions/:regionId/cities - List cities for a region',
      geocode: 'POST /api/geography/geocode - Reverse geocode coordinates',
      stats: 'GET /api/geography/stats - Get user travel statistics',
      search: 'GET /api/geography/search - Search geographic locations',
      nearby: 'GET /api/geography/nearby - Find locations near coordinates',
      mapData: 'GET /api/geography/map-data - Get data for map visualization'
    },
    authentication: 'Required for all endpoints except root',
    timestamp: new Date().toISOString()
  });
});

// GET /api/geography/countries - List all countries with visit statistics
router.get('/countries', authenticateUser, async (req, res) => {
  try {
    const { visited, search, limit = 50 } = req.query;
    const userId = req.user._id;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const countries = await Country.find(query)
      .sort({ name: 1 })
      .limit(parseInt(limit));

    // Get visit information for the user
    const visitedCountries = await VisitedCountry.find({ userId })
      .populate('country');

    const visitedCountryIds = new Set(visitedCountries.map(vc => vc.country._id.toString()));

    // Enhance countries with visit information
    const enhancedCountries = countries.map(country => {
      const isVisited = visitedCountryIds.has(country._id.toString());
      const visitInfo = visitedCountries.find(vc => vc.country._id.toString() === country._id.toString());

      return {
        ...country.toObject(),
        isVisited,
        visitCount: visitInfo ? visitInfo.visitCount : 0,
        firstVisitDate: visitInfo ? visitInfo.firstVisitDate : null,
        lastVisitDate: visitInfo ? visitInfo.lastVisitDate : null,
        adventureCount: visitInfo ? visitInfo.adventures.length : 0
      };
    });

    // Filter by visited status if requested
    let filteredCountries = enhancedCountries;
    if (visited !== undefined) {
      const isVisitedFilter = visited === 'true';
      filteredCountries = enhancedCountries.filter(country => country.isVisited === isVisitedFilter);
    }

    res.json({
      countries: filteredCountries,
      total: filteredCountries.length
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/geography/countries/:countryCode/regions - List regions for a country
router.get('/countries/:countryCode/regions', authenticateUser, async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { visited, search } = req.query;
    const userId = req.user._id;

    const country = await Country.findOne({ countryCode: countryCode.toUpperCase() });
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    let query = { country: country._id };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const regions = await Region.find(query).sort({ name: 1 });

    // Get visit information for the user
    const visitedRegions = await VisitedRegion.find({ 
      userId,
      country: country._id 
    }).populate('region');

    const visitedRegionIds = new Set(visitedRegions.map(vr => vr.region._id.toString()));

    // Enhance regions with visit information
    const enhancedRegions = regions.map(region => {
      const isVisited = visitedRegionIds.has(region._id.toString());
      const visitInfo = visitedRegions.find(vr => vr.region._id.toString() === region._id.toString());

      return {
        ...region.toObject(),
        isVisited,
        visitCount: visitInfo ? visitInfo.visitCount : 0,
        firstVisitDate: visitInfo ? visitInfo.firstVisitDate : null,
        lastVisitDate: visitInfo ? visitInfo.lastVisitDate : null,
        adventureCount: visitInfo ? visitInfo.adventures.length : 0
      };
    });

    // Filter by visited status if requested
    let filteredRegions = enhancedRegions;
    if (visited !== undefined) {
      const isVisitedFilter = visited === 'true';
      filteredRegions = enhancedRegions.filter(region => region.isVisited === isVisitedFilter);
    }

    res.json({
      country: country,
      regions: filteredRegions,
      total: filteredRegions.length
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// GET /api/geography/regions/:regionId/cities - List cities for a region
router.get('/regions/:regionId/cities', authenticateUser, async (req, res) => {
  try {
    const { regionId } = req.params;
    const { visited, search } = req.query;
    const userId = req.user._id;

    const region = await Region.findById(regionId).populate('country');
    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }

    let query = { region: region._id };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const cities = await City.find(query).sort({ name: 1 });

    // Get visit information for the user
    const visitedCities = await VisitedCity.find({ 
      userId,
      region: region._id 
    }).populate('city');

    const visitedCityIds = new Set(visitedCities.map(vc => vc.city._id.toString()));

    // Enhance cities with visit information
    const enhancedCities = cities.map(city => {
      const isVisited = visitedCityIds.has(city._id.toString());
      const visitInfo = visitedCities.find(vc => vc.city._id.toString() === city._id.toString());

      return {
        ...city.toObject(),
        isVisited,
        visitCount: visitInfo ? visitInfo.visitCount : 0,
        firstVisitDate: visitInfo ? visitInfo.firstVisitDate : null,
        lastVisitDate: visitInfo ? visitInfo.lastVisitDate : null,
        adventureCount: visitInfo ? visitInfo.adventures.length : 0
      };
    });

    // Filter by visited status if requested
    let filteredCities = enhancedCities;
    if (visited !== undefined) {
      const isVisitedFilter = visited === 'true';
      filteredCities = enhancedCities.filter(city => city.isVisited === isVisitedFilter);
    }

    res.json({
      region: region,
      cities: filteredCities,
      total: filteredCities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// POST /api/geography/geocode - Reverse geocode coordinates
router.post('/geocode', authenticateUser, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Find nearest geographic entities
    const [nearestCountries, nearestRegions, nearestCities] = await Promise.all([
      Country.findNearby(lng, lat, 100000).limit(3),
      Region.findNearby(lng, lat, 50000).limit(3),
      City.findNearby(lng, lat, 25000).limit(3)
    ]);

    const result = {
      coordinates: { latitude: lat, longitude: lng },
      countries: nearestCountries,
      regions: nearestRegions,
      cities: nearestCities
    };

    // Add primary location if found
    if (nearestCountries.length > 0) {
      result.primaryCountry = nearestCountries[0];
    }
    if (nearestRegions.length > 0) {
      result.primaryRegion = nearestRegions[0];
    }
    if (nearestCities.length > 0) {
      result.primaryCity = nearestCities[0];
    }

    res.json(result);
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Failed to geocode coordinates' });
  }
});

// GET /api/geography/stats - Get user's travel statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      adventureStats,
      geoStats,
      visitedCountries,
      visitedRegions,
      visitedCities
    ] = await Promise.all([
      Adventure.getUserStats(userId),
      VisitedCountry.getUserTravelStats(userId),
      VisitedCountry.find({ userId }).populate('country'),
      VisitedRegion.find({ userId }).populate('region country'),
      VisitedCity.find({ userId }).populate('city region country')
    ]);

    // Calculate additional statistics
    const continentStats = {};
    visitedCountries.forEach(vc => {
      const continent = vc.country.subregion || 'Unknown';
      if (!continentStats[continent]) {
        continentStats[continent] = {
          name: continent,
          countries: 0,
          adventures: 0
        };
      }
      continentStats[continent].countries++;
      continentStats[continent].adventures += vc.adventures.length;
    });

    const monthlyStats = {};
    visitedCountries.forEach(vc => {
      if (vc.firstVisitDate) {
        const month = vc.firstVisitDate.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyStats[month]) {
          monthlyStats[month] = 0;
        }
        monthlyStats[month]++;
      }
    });

    res.json({
      ...adventureStats,
      ...geoStats,
      continentStats: Object.values(continentStats),
      monthlyStats,
      recentVisits: {
        countries: visitedCountries.slice(-5).map(vc => ({
          country: vc.country,
          visitDate: vc.lastVisitDate,
          adventureCount: vc.adventures.length
        })),
        regions: visitedRegions.slice(-5).map(vr => ({
          region: vr.region,
          country: vr.country,
          visitDate: vr.lastVisitDate,
          adventureCount: vr.adventures.length
        })),
        cities: visitedCities.slice(-5).map(vc => ({
          city: vc.city,
          region: vc.region,
          country: vc.country,
          visitDate: vc.lastVisitDate,
          adventureCount: vc.adventures.length
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching travel stats:', error);
    res.status(500).json({ error: 'Failed to fetch travel statistics' });
  }
});

// GET /api/geography/search - Search geographic locations
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchRegex = { $regex: q, $options: 'i' };
    const limitNum = parseInt(limit);

    let results = {};

    if (type === 'all' || type === 'countries') {
      results.countries = await Country.find({ name: searchRegex })
        .limit(limitNum)
        .sort({ name: 1 });
    }

    if (type === 'all' || type === 'regions') {
      results.regions = await Region.find({ name: searchRegex })
        .populate('country', 'name countryCode')
        .limit(limitNum)
        .sort({ name: 1 });
    }

    if (type === 'all' || type === 'cities') {
      results.cities = await City.find({ name: searchRegex })
        .populate('region', 'name')
        .populate('country', 'name countryCode')
        .limit(limitNum)
        .sort({ name: 1 });
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching geography:', error);
    res.status(500).json({ error: 'Failed to search geographic locations' });
  }
});

// GET /api/geography/nearby - Find geographic locations near coordinates
router.get('/nearby', authenticateUser, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000, type = 'all' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = parseInt(maxDistance);

    let results = {};

    if (type === 'all' || type === 'countries') {
      results.countries = await Country.findNearby(lng, lat, distance).limit(5);
    }

    if (type === 'all' || type === 'regions') {
      results.regions = await Region.findNearby(lng, lat, distance)
        .populate('country', 'name countryCode')
        .limit(10);
    }

    if (type === 'all' || type === 'cities') {
      results.cities = await City.findNearby(lng, lat, distance)
        .populate('region', 'name')
        .populate('country', 'name countryCode')
        .limit(15);
    }

    res.json(results);
  } catch (error) {
    console.error('Error finding nearby locations:', error);
    res.status(500).json({ error: 'Failed to find nearby locations' });
  }
});

// GET /api/geography/map-data - Get geographic data for map visualization
router.get('/map-data', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { includeAdventures = 'true' } = req.query;

    // Get visited countries with coordinates
    const visitedCountries = await VisitedCountry.find({ userId })
      .populate('country')
      .populate('adventures', 'name coordinates rating');

    // Get visited regions with coordinates
    const visitedRegions = await VisitedRegion.find({ userId })
      .populate('region')
      .populate('country')
      .populate('adventures', 'name coordinates rating');

    // Get visited cities with coordinates
    const visitedCities = await VisitedCity.find({ userId })
      .populate('city')
      .populate('region')
      .populate('country')
      .populate('adventures', 'name coordinates rating');

    let adventures = [];
    if (includeAdventures === 'true') {
      adventures = await Adventure.find({ 
        userId,
        coordinates: { $exists: true }
      }).select('name coordinates rating isVisited geographic');
    }

    const mapData = {
      visitedCountries: visitedCountries.map(vc => ({
        country: vc.country,
        visitCount: vc.visitCount,
        firstVisitDate: vc.firstVisitDate,
        lastVisitDate: vc.lastVisitDate,
        adventureCount: vc.adventures.length
      })),
      visitedRegions: visitedRegions.map(vr => ({
        region: vr.region,
        country: vr.country,
        visitCount: vr.visitCount,
        firstVisitDate: vr.firstVisitDate,
        lastVisitDate: vr.lastVisitDate,
        adventureCount: vr.adventures.length
      })),
      visitedCities: visitedCities.map(vc => ({
        city: vc.city,
        region: vc.region,
        country: vc.country,
        visitCount: vc.visitCount,
        firstVisitDate: vc.firstVisitDate,
        lastVisitDate: vc.lastVisitDate,
        adventureCount: vc.adventures.length
      })),
      adventures
    };

    res.json(mapData);
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

module.exports = router;

