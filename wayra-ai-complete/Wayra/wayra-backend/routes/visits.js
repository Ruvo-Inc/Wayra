const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Adventure = require('../models/Adventure');
const { verifyToken } = require('../middleware/auth');

// GET /api/visits - Get all visits for authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      adventureId,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user.uid };

    // Filter by adventure
    if (adventureId) {
      query.adventureId = adventureId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const visits = await Visit.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('adventureId', 'name location category')
      .exec();

    const total = await Visit.countDocuments(query);

    res.json({
      visits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// GET /api/visits/:id - Get single visit
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('adventureId', 'name location category');

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
});

// POST /api/visits - Create new visit
router.post('/', verifyToken, async (req, res) => {
  try {
    const visitData = {
      ...req.body,
      userId: req.user.uid
    };

    // Verify adventure exists and user has access
    const adventure = await Adventure.findById(visitData.adventureId);
    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (adventure.userId !== req.user.uid && !adventure.isPublic) {
      return res.status(403).json({ error: 'Access denied to adventure' });
    }

    const visit = new Visit(visitData);
    await visit.save();

    // Update adventure's isVisited status
    if (!adventure.isVisited) {
      adventure.isVisited = true;
      await adventure.save();
    }

    await visit.populate('adventureId', 'name location category');
    res.status(201).json(visit);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/visits/:id - Update visit
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(visit, req.body);
    await visit.save();

    await visit.populate('adventureId', 'name location category');
    res.json(visit);
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/visits/:id - Delete visit
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Visit.findByIdAndDelete(req.params.id);

    // Check if adventure should be marked as not visited
    const adventure = await Adventure.findById(visit.adventureId);
    if (adventure) {
      const remainingVisits = await Visit.countDocuments({
        adventureId: visit.adventureId,
        userId: req.user.uid
      });

      if (remainingVisits === 0) {
        adventure.isVisited = false;
        await adventure.save();
      }
    }

    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

// GET /api/visits/stats/summary - Get visit statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const totalVisits = await Visit.countDocuments({ userId: req.user.uid });
    
    const visitsByMonth = await Visit.aggregate([
      { $match: { userId: req.user.uid } },
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

    const visitedAdventures = await Visit.distinct('adventureId', { userId: req.user.uid });
    const totalAdventures = await Adventure.countDocuments({ userId: req.user.uid });

    res.json({
      totalVisits,
      visitedAdventures: visitedAdventures.length,
      totalAdventures,
      visitsByMonth
    });
  } catch (error) {
    console.error('Error fetching visit stats:', error);
    res.status(500).json({ error: 'Failed to fetch visit statistics' });
  }
});

module.exports = router;
