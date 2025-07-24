const express = require('express');
const router = express.Router();
const Adventure = require('../models/Adventure');
const Collection = require('../models/Collection');
const { Country, Region, City, VisitedCountry, VisitedRegion, VisitedCity } = require('../models/Geography');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/adventures');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware to verify user authentication
const authenticateUser = (req, res, next) => {
  // This should integrate with your existing Firebase auth middleware
  // For now, assuming user is attached to req.user
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// FIXED: Put specific routes BEFORE parameterized routes to avoid conflicts

// GET /api/adventures/public - Get public adventures feed
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, country, activityType } = req.query;

    const query = { isPublic: true };

    if (country) {
      query['geographic.countryCode'] = country;
    }

    if (activityType) {
      query.activityTypes = activityType;
    }

    const adventures = await Adventure.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username profilePic')
      .select('-collections') // Don't include private collection info
      .exec();

    const total = await Adventure.countDocuments(query);

    res.json({
      adventures,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching public adventures:', error);
    res.status(500).json({ error: 'Failed to fetch public adventures' });
  }
});

// GET /api/adventures/nearby - Find adventures near a location
router.get('/nearby', authenticateUser, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000, limit = 20 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const adventures = await Adventure.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    )
    .limit(parseInt(limit))
    .populate('userId', 'username profilePic');

    res.json(adventures);
  } catch (error) {
    console.error('Error finding nearby adventures:', error);
    res.status(500).json({ error: 'Failed to find nearby adventures' });
  }
});

// GET /api/adventures/stats - Get current user's adventure statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const [adventureStats, geoStats] = await Promise.all([
      Adventure.getUserStats(userId),
      VisitedCountry.getUserTravelStats(userId)
    ]);

    res.json({
      ...adventureStats,
      ...geoStats
    });
  } catch (error) {
    console.error('Error fetching adventure stats:', error);
    res.status(500).json({ error: 'Failed to fetch adventure statistics' });
  }
});

// GET /api/adventures - List user's adventures
router.get('/', authenticateUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      activityType,
      isVisited,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tripId
    } = req.query;

    const query = { userId: req.user._id };

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query['category.name'] = category;
    }

    if (activityType) {
      query.activityTypes = activityType;
    }

    if (isVisited !== undefined) {
      query.isVisited = isVisited === 'true';
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    if (tripId) {
      query.tripId = tripId;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const adventures = await Adventure.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('collections', 'name description')
      .exec();

    const total = await Adventure.countDocuments(query);

    res.json({
      adventures,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching adventures:', error);
    res.status(500).json({ error: 'Failed to fetch adventures' });
  }
});

// GET /api/adventures/:id - Get adventure details
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id)
      .populate('collections', 'name description isPublic')
      .populate('userId', 'username profilePic');

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    // Check if user has access to this adventure
    const hasAccess = adventure.userId._id.equals(req.user._id) || 
                     adventure.isPublic ||
                     adventure.collections.some(collection => 
                       collection.sharedWith && collection.sharedWith.includes(req.user._id)
                     );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(adventure);
  } catch (error) {
    console.error('Error fetching adventure:', error);
    res.status(500).json({ error: 'Failed to fetch adventure' });
  }
});

// POST /api/adventures - Create new adventure
router.post('/', authenticateUser, async (req, res) => {
  try {
    const adventureData = {
      ...req.body,
      userId: req.user._id
    };

    // Handle coordinates
    if (req.body.latitude && req.body.longitude) {
      adventureData.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    const adventure = new Adventure(adventureData);
    await adventure.save();

    // If coordinates provided, perform reverse geocoding and update geographic data
    if (adventure.coordinates) {
      await updateAdventureGeography(adventure);
    }

    // If adventure is visited, record geographic visits
    if (adventure.isVisited && adventure.geographic) {
      await recordGeographicVisits(adventure);
    }

    res.status(201).json(adventure);
  } catch (error) {
    console.error('Error creating adventure:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/adventures/:id - Update adventure
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (!adventure.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle coordinates update
    if (req.body.latitude && req.body.longitude) {
      req.body.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    Object.assign(adventure, req.body);
    await adventure.save();

    // Update geographic data if coordinates changed
    if (req.body.latitude || req.body.longitude) {
      await updateAdventureGeography(adventure);
    }

    // Update geographic visits if visit status changed
    if (adventure.isVisited && adventure.geographic) {
      await recordGeographicVisits(adventure);
    }

    res.json(adventure);
  } catch (error) {
    console.error('Error updating adventure:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/adventures/:id - Delete adventure
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (!adventure.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove adventure from collections
    await Collection.updateMany(
      { adventures: adventure._id },
      { $pull: { adventures: adventure._id } }
    );

    // Delete associated files
    for (const image of adventure.images) {
      try {
        const imagePath = path.join(__dirname, '../uploads/adventures', path.basename(image.url));
        await fs.unlink(imagePath);
      } catch (err) {
        console.warn('Failed to delete image file:', err.message);
      }
    }

    for (const attachment of adventure.attachments) {
      try {
        const attachmentPath = path.join(__dirname, '../uploads/adventures', path.basename(attachment.url));
        await fs.unlink(attachmentPath);
      } catch (err) {
        console.warn('Failed to delete attachment file:', err.message);
      }
    }

    await Adventure.findByIdAndDelete(req.params.id);

    res.json({ message: 'Adventure deleted successfully' });
  } catch (error) {
    console.error('Error deleting adventure:', error);
    res.status(500).json({ error: 'Failed to delete adventure' });
  }
});

// POST /api/adventures/:id/images - Upload adventure images
router.post('/:id/images', authenticateUser, upload.array('images', 10), async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (!adventure.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newImages = req.files.map((file, index) => ({
      url: `/uploads/adventures/${file.filename}`,
      isPrimary: adventure.images.length === 0 && index === 0 // First image is primary if no images exist
    }));

    adventure.images.push(...newImages);
    await adventure.save();

    res.json({ images: newImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// POST /api/adventures/:id/attachments - Upload adventure attachments
router.post('/:id/attachments', authenticateUser, upload.array('attachments', 5), async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (!adventure.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newAttachments = req.files.map(file => ({
      filename: file.originalname,
      url: `/uploads/adventures/${file.filename}`,
      type: file.mimetype
    }));

    adventure.attachments.push(...newAttachments);
    await adventure.save();

    res.json({ attachments: newAttachments });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// POST /api/adventures/:id/visits - Add visit to adventure
router.post('/:id/visits', authenticateUser, async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (!adventure.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const visit = {
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      timezone: req.body.timezone,
      notes: req.body.notes || ''
    };

    adventure.visits.push(visit);
    await adventure.save();

    // Record geographic visits
    if (adventure.geographic) {
      await recordGeographicVisits(adventure, visit.startDate);
    }

    res.json(adventure);
  } catch (error) {
    console.error('Error adding visit:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper function to update adventure geography using reverse geocoding
async function updateAdventureGeography(adventure) {
  try {
    if (!adventure.coordinates || !adventure.coordinates.coordinates) return;

    const [longitude, latitude] = adventure.coordinates.coordinates;

    // Find nearest geographic entities
    const [nearestCountry, nearestRegion, nearestCity] = await Promise.all([
      Country.findNearby(longitude, latitude, 100000).limit(1),
      Region.findNearby(longitude, latitude, 50000).limit(1),
      City.findNearby(longitude, latitude, 25000).limit(1)
    ]);

    const geographic = {};

    if (nearestCountry.length > 0) {
      geographic.country = nearestCountry[0].name;
      geographic.countryCode = nearestCountry[0].countryCode;
    }

    if (nearestRegion.length > 0) {
      geographic.region = nearestRegion[0].name;
    }

    if (nearestCity.length > 0) {
      geographic.city = nearestCity[0].name;
    }

    adventure.geographic = geographic;
    await adventure.save();
  } catch (error) {
    console.error('Error updating adventure geography:', error);
  }
}

// Helper function to record geographic visits
async function recordGeographicVisits(adventure, visitDate = new Date()) {
  try {
    if (!adventure.geographic) return;

    const userId = adventure.userId;

    // Find geographic entities
    const country = await Country.findOne({ countryCode: adventure.geographic.countryCode });
    if (country) {
      await VisitedCountry.recordVisit(userId, country._id, adventure._id, visitDate);
    }

    if (adventure.geographic.region) {
      const region = await Region.findOne({ 
        name: adventure.geographic.region,
        country: country._id 
      });
      if (region) {
        await VisitedRegion.recordVisit(userId, region._id, country._id, adventure._id, visitDate);
      }
    }

    if (adventure.geographic.city) {
      const city = await City.findOne({ 
        name: adventure.geographic.city 
      });
      if (city) {
        await VisitedCity.recordVisit(userId, city._id, city.region, country._id, adventure._id, visitDate);
      }
    }
  } catch (error) {
    console.error('Error recording geographic visits:', error);
  }
}

module.exports = router;

