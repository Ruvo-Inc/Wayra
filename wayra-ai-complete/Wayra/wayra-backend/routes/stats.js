const express = require('express');
const router = express.Router();
const Adventure = require('../models/Adventure');
const Collection = require('../models/Collection');
const Visit = require('../models/Visit');
const Category = require('../models/Category');
const { verifyToken } = require('../middleware/auth');

// GET /api/stats/overview - Get user's adventure statistics overview
router.get('/overview', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Basic counts
    const totalAdventures = await Adventure.countDocuments({ userId });
    const visitedAdventures = await Adventure.countDocuments({ userId, isVisited: true });
    const totalCollections = await Collection.countDocuments({ userId });
    const totalVisits = await Visit.countDocuments({ userId });

    // Adventures by category
    const adventuresByCategory = await Adventure.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 },
          visited: { $sum: { $cond: ['$isVisited', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Adventures by rating
    const adventuresByRating = await Adventure.aggregate([
      { $match: { userId, rating: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent visits
    const recentVisits = await Visit.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('adventureId', 'name location category')
      .exec();

    // Monthly visit trends (last 12 months)
    const monthlyVisits = await Visit.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Countries visited (from adventure locations)
    const countriesVisited = await Adventure.aggregate([
      { $match: { userId, isVisited: true, 'location.country': { $exists: true } } },
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: {
        totalAdventures,
        visitedAdventures,
        totalCollections,
        totalVisits,
        completionRate: totalAdventures > 0 ? Math.round((visitedAdventures / totalAdventures) * 100) : 0
      },
      adventuresByCategory,
      adventuresByRating,
      recentVisits,
      monthlyVisits,
      countriesVisited
    });
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    res.status(500).json({ error: 'Failed to fetch statistics overview' });
  }
});

// GET /api/stats/adventures - Get detailed adventure statistics
router.get('/adventures', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Adventures by type/category with detailed breakdown
    const categoryStats = await Adventure.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category.name',
          total: { $sum: 1 },
          visited: { $sum: { $cond: ['$isVisited', 1, 0] } },
          avgRating: { $avg: '$rating' },
          highestRated: { $max: '$rating' },
          lowestRated: { $min: '$rating' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$visited', '$total'] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Geographic distribution
    const locationStats = await Adventure.aggregate([
      { $match: { userId, 'location.country': { $exists: true } } },
      {
        $group: {
          _id: {
            country: '$location.country',
            state: '$location.state',
            city: '$location.city'
          },
          total: { $sum: 1 },
          visited: { $sum: { $cond: ['$isVisited', 1, 0] } }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ]);

    // Rating distribution
    const ratingDistribution = await Adventure.aggregate([
      { $match: { userId, rating: { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: '$rating',
          boundaries: [1, 2, 3, 4, 5, 6],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            adventures: { $push: { name: '$name', rating: '$rating' } }
          }
        }
      }
    ]);

    // Top rated adventures
    const topRatedAdventures = await Adventure.find({
      userId,
      rating: { $exists: true, $gte: 4 }
    })
      .sort({ rating: -1, name: 1 })
      .limit(10)
      .select('name location rating category isVisited')
      .exec();

    res.json({
      categoryStats,
      locationStats,
      ratingDistribution,
      topRatedAdventures
    });
  } catch (error) {
    console.error('Error fetching adventure stats:', error);
    res.status(500).json({ error: 'Failed to fetch adventure statistics' });
  }
});

// GET /api/stats/collections - Get collection statistics
router.get('/collections', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Collection overview
    const totalCollections = await Collection.countDocuments({ userId });
    const publicCollections = await Collection.countDocuments({ userId, isPublic: true });
    const sharedCollections = await Collection.countDocuments({ 
      $or: [
        { sharedWith: userId },
        { 'collaborators.userId': userId }
      ]
    });

    // Collections by size (number of adventures)
    const collectionSizes = await Collection.aggregate([
      { $match: { userId } },
      {
        $addFields: {
          adventureCount: { $size: { $ifNull: ['$adventures', []] } }
        }
      },
      {
        $bucket: {
          groupBy: '$adventureCount',
          boundaries: [0, 1, 5, 10, 20, 50],
          default: '50+',
          output: {
            count: { $sum: 1 },
            collections: { $push: { name: '$name', adventureCount: '$adventureCount' } }
          }
        }
      }
    ]);

    // Most popular collections (by adventure count)
    const popularCollections = await Collection.aggregate([
      { $match: { userId } },
      {
        $addFields: {
          adventureCount: { $size: { $ifNull: ['$adventures', []] } }
        }
      },
      { $sort: { adventureCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          description: 1,
          adventureCount: 1,
          isPublic: 1,
          createdAt: 1
        }
      }
    ]);

    // Recent collections
    const recentCollections = await Collection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name description adventures createdAt')
      .populate('adventures', 'name')
      .exec();

    res.json({
      overview: {
        totalCollections,
        publicCollections,
        sharedCollections
      },
      collectionSizes,
      popularCollections,
      recentCollections
    });
  } catch (error) {
    console.error('Error fetching collection stats:', error);
    res.status(500).json({ error: 'Failed to fetch collection statistics' });
  }
});

// GET /api/stats/geography - Get geographic statistics
router.get('/geography', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Countries visited
    const countriesVisited = await Adventure.aggregate([
      { $match: { userId, isVisited: true, 'location.country': { $exists: true } } },
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 },
          adventures: { $push: { name: '$name', city: '$location.city' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // States/provinces visited
    const statesVisited = await Adventure.aggregate([
      { $match: { userId, isVisited: true, 'location.state': { $exists: true } } },
      {
        $group: {
          _id: {
            country: '$location.country',
            state: '$location.state'
          },
          count: { $sum: 1 },
          adventures: { $push: { name: '$name', city: '$location.city' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Cities visited
    const citiesVisited = await Adventure.aggregate([
      { $match: { userId, isVisited: true, 'location.city': { $exists: true } } },
      {
        $group: {
          _id: {
            country: '$location.country',
            state: '$location.state',
            city: '$location.city'
          },
          count: { $sum: 1 },
          adventures: { $push: '$name' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Adventures with coordinates for mapping
    const adventuresWithCoordinates = await Adventure.find({
      userId,
      isVisited: true,
      coordinates: { $exists: true }
    })
      .select('name location coordinates rating category')
      .exec();

    res.json({
      countriesVisited,
      statesVisited,
      citiesVisited,
      adventuresWithCoordinates,
      summary: {
        totalCountries: countriesVisited.length,
        totalStates: statesVisited.length,
        totalCities: citiesVisited.length,
        totalAdventuresWithCoordinates: adventuresWithCoordinates.length
      }
    });
  } catch (error) {
    console.error('Error fetching geography stats:', error);
    res.status(500).json({ error: 'Failed to fetch geography statistics' });
  }
});

// GET /api/stats/timeline - Get timeline statistics
router.get('/timeline', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { year } = req.query;

    let matchQuery = { userId };
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }

    // Visits by month
    const visitsByMonth = await Visit.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          visits: { $push: { date: '$date', adventureId: '$adventureId' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Adventures created by month
    const adventuresByMonth = await Adventure.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent activity timeline
    const recentActivity = await Visit.find({ userId })
      .sort({ date: -1 })
      .limit(20)
      .populate('adventureId', 'name location category')
      .exec();

    res.json({
      visitsByMonth,
      adventuresByMonth,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching timeline stats:', error);
    res.status(500).json({ error: 'Failed to fetch timeline statistics' });
  }
});

module.exports = router;
