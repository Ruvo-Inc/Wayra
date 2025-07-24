const express = require('express');
const router = express.Router();
const Adventure = require('../models/Adventure');
const AdventureImage = require('../models/AdventureImage');
const Attachment = require('../models/Attachment');
const Visit = require('../models/Visit');
const Collection = require('../models/Collection');
const { Country, Region, City, VisitedCountry, VisitedRegion, VisitedCity } = require('../models/Geography');
const { verifyToken, optionalAuth } = require('../middleware/auth');
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

// Import Firebase authentication middleware
// Firebase authentication middleware imported above

// FIXED: Put specific routes BEFORE parameterized routes to avoid conflicts

// GET /// Get public adventures (no authentication required)
router.get('/public', optionalAuth, async (req, res) => {
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
router.get('/nearby', verifyToken, async (req, res) => {
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
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('📊 Stats endpoint called for user:', userId);

    // Try adventure stats first
    console.log('📊 Fetching adventure stats...');
    let adventureStats;
    try {
      adventureStats = await Adventure.getUserStats(userId);
      console.log('📊 Adventure stats result:', adventureStats);
    } catch (adventureError) {
      console.error('❌ Adventure stats error:', adventureError);
      throw new Error(`Adventure stats failed: ${adventureError.message}`);
    }

    // Try collection stats
    console.log('📊 Fetching collection stats...');
    let collectionStats;
    try {
      const Collection = require('../models/Collection');
      collectionStats = await Collection.getUserStats(userId);
      console.log('📊 Collection stats result:', collectionStats);
    } catch (collectionError) {
      console.error('❌ Collection stats error:', collectionError);
      throw new Error(`Collection stats failed: ${collectionError.message}`);
    }

    // Try geography stats
    console.log('📊 Fetching geography stats...');
    let geoStats;
    try {
      geoStats = await VisitedCountry.getUserTravelStats(userId);
      console.log('📊 Geography stats result:', geoStats);
    } catch (geoError) {
      console.error('❌ Geography stats error:', geoError);
      throw new Error(`Geography stats failed: ${geoError.message}`);
    }

    const response = {
      success: true,
      data: {
        adventures: adventureStats,
        collections: collectionStats,
        geography: geoStats
      }
    };

    console.log('📊 Final stats response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching adventure stats:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch adventure statistics' });
  }
});

// GET /api/adventures - Get current user's adventures with filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, category, isPublic, isVisited, rating, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const query = { userId: req.user.uid };

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query['category.name'] = category;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    if (isVisited !== undefined) {
      query.isVisited = isVisited === 'true';
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const adventures = await Adventure.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Adventure.countDocuments(query);

    res.json({
      adventures,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching adventures:', error);
    res.status(500).json({ error: 'Failed to fetch adventures' });
  }
});

// Get public adventures
router.get('/public', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      rating, 
      startDate, 
      endDate, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const query = { isPublic: true };

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query['category.name'] = category;
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const adventures = await Adventure.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Adventure.countDocuments(query);

    res.json({
      adventures,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching public adventures:', error);
    res.status(500).json({ error: 'Failed to fetch public adventures' });
  }
});



// Get nearby adventures
router.get('/nearby/:lat/:lng', verifyToken, async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { maxDistance = 10000, limit = 20 } = req.query;

    const adventures = await Adventure.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(maxDistance),
      parseInt(limit)
    );

    res.json(adventures);
  } catch (error) {
    console.error('Error fetching nearby adventures:', error);
    res.status(500).json({ error: 'Failed to fetch nearby adventures' });
  }
});

// Get single adventure
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Handle 'new' ID case for creating new adventures
    if (req.params.id === 'new') {
      return res.status(400).json({ error: 'Cannot load adventure with ID "new". Use POST to create new adventures.' });
    }

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid adventure ID format' });
    }

    const adventure = await Adventure.findById(req.params.id).populate('collections', '_id name');
    
    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    // Check if user can access this adventure
    if (!adventure.isPublic && adventure.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get related data
    const [images, attachments, visits] = await Promise.all([
      AdventureImage.findByAdventure(req.params.id),
      Attachment.findByAdventure(req.params.id),
      Visit.findByAdventure(req.params.id)
    ]);

    const adventureData = adventure.toJSON();
    adventureData.images = images;
    adventureData.attachments = attachments;
    adventureData.visits = visits;
    
    // Convert populated collections to array of IDs for frontend compatibility
    adventureData.collections = adventure.collections.map(collection => 
      collection._id ? collection._id.toString() : collection.toString()
    );

    res.json(adventureData);
  } catch (error) {
    console.error('Error fetching adventure:', error);
    res.status(500).json({ error: 'Failed to fetch adventure' });
  }
});

// Create new adventure
router.post('/', verifyToken, async (req, res) => {
  try {
    const adventureData = {
      ...req.body,
      userId: req.user.uid
    };

    const adventure = new Adventure(adventureData);
    await adventure.save();

    res.status(201).json(adventure);
  } catch (error) {
    console.error('Error creating adventure:', error);
    res.status(500).json({ error: 'Failed to create adventure' });
  }
});

// Update adventure
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);
    
    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (adventure.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(adventure, req.body);
    await adventure.save();

    res.json(adventure);
  } catch (error) {
    console.error('Error updating adventure:', error);
    res.status(500).json({ error: 'Failed to update adventure' });
  }
});

// Delete adventure
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/adventures/:id called with ID:', req.params.id);
    console.log('🔐 User UID:', req.user.uid);
    
    const adventure = await Adventure.findById(req.params.id);
    console.log('🎯 Adventure found:', !!adventure);
    
    if (!adventure) {
      console.log('❌ Adventure not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Adventure not found' });
    }

    console.log('🔐 Adventure userId:', adventure.userId);
    console.log('🔐 Request user uid:', req.user.uid);
    console.log('🔐 User match:', adventure.userId === req.user.uid);

    if (adventure.userId !== req.user.uid) {
      console.log('❌ Access denied - user mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete related data
    await Promise.all([
      AdventureImage.deleteMany({ adventureId: req.params.id }),
      Attachment.deleteMany({ adventureId: req.params.id }),
      Visit.deleteMany({ adventureId: req.params.id })
    ]);

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

    console.log('🗑️ Deleting adventure from database...');
    await Adventure.findByIdAndDelete(req.params.id);
    console.log('✅ Adventure deleted successfully from database');

    res.json({ message: 'Adventure deleted successfully' });
    console.log('✅ Delete response sent to client');
  } catch (error) {
    console.error('❌ Error deleting adventure:', error);
    res.status(500).json({ error: 'Failed to delete adventure' });
  }
});

// POST /api/adventures/:id/images - Upload adventure images
router.post('/:id/images', verifyToken, upload.array('images', 10), async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (adventure.userId !== req.user.uid) {
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
router.post('/:id/attachments', verifyToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (adventure.userId !== req.user.uid) {
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
router.post('/:id/visits', verifyToken, async (req, res) => {
  try {
    const adventure = await Adventure.findById(req.params.id);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    if (adventure.userId !== req.user.uid) {
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

