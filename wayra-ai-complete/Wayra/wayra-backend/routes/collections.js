const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Adventure = require('../models/Adventure');
const Transportation = require('../models/Transportation');
const Lodging = require('../models/Lodging');
const Note = require('../models/Note');
const Checklist = require('../models/Checklist');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// GET /api/collections - List user's collections
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isPublic,
      isArchived,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      $or: [
        { userId: req.user.uid },
        { sharedWith: req.user.uid },
        { 'collaborators.userId': req.user.uid }
      ]
    };

    // Add filters
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const collections = await Collection.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('adventures')
      .exec();

    const total = await Collection.countDocuments(query);

    res.json({
      collections,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/collections/public - Get public collections
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { isPublic: true, isArchived: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('adventures')
      .select('-sharedWith -collaborators') // Don't expose private sharing info
      .exec();

    const total = await Collection.countDocuments(query);

    res.json({
      collections,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching public collections:', error);
    res.status(500).json({ error: 'Failed to fetch public collections' });
  }
});

// GET /api/collections/:id - Get collection details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id || req.params.id === 'undefined' || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid collection ID format' });
    }

    const collection = await Collection.findById(req.params.id)
      .populate('adventures');

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if user has access
    if (!collection.hasAccess(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add user's role to response
    const userRole = collection.getUserRole(req.user.uid);
    const collectionData = collection.toObject();
    collectionData.userRole = userRole;
    collectionData.canEdit = collection.canEdit(req.user.uid);
    collectionData.stats = collection.getStats();

    res.json(collectionData);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// POST /api/collections - Create new collection
router.post('/', verifyToken, async (req, res) => {
  try {
    const collectionData = {
      ...req.body,
      userId: req.user.uid
    };

    // Handle date fields to prevent timezone issues
    if (collectionData.startDate && collectionData.startDate !== null) {
      // Parse date string as local date (YYYY-MM-DD)
      const [year, month, day] = collectionData.startDate.split('-');
      collectionData.startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    if (collectionData.endDate && collectionData.endDate !== null) {
      // Parse date string as local date (YYYY-MM-DD)
      const [year, month, day] = collectionData.endDate.split('-');
      collectionData.endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const collection = new Collection(collectionData);
    await collection.save();

    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id - Update collection
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { ...req.body };

    // Handle date fields to prevent timezone issues
    if (updateData.startDate && updateData.startDate !== null) {
      // Parse date string as local date (YYYY-MM-DD)
      const [year, month, day] = updateData.startDate.split('-');
      updateData.startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    if (updateData.endDate && updateData.endDate !== null) {
      // Parse date string as local date (YYYY-MM-DD)
      const [year, month, day] = updateData.endDate.split('-');
      updateData.endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    Object.assign(collection, updateData);
    await collection.save();

    await collection.populate('adventures');

    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Only owner can delete collection
    if (collection.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Only collection owner can delete' });
    }

    // Clean up related data
    await Transportation.deleteMany({ collectionId: req.params.id });
    await Lodging.deleteMany({ collectionId: req.params.id });
    await Note.deleteMany({ collectionId: req.params.id });
    await Checklist.deleteMany({ collectionId: req.params.id });

    await Collection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// POST /api/collections/:id/adventures - Add adventure to collection
router.post('/:id/adventures', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { adventureId } = req.body;
    const adventure = await Adventure.findById(adventureId);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    // Check if user has access to the adventure
    if (adventure.userId !== req.user.uid && !adventure.isPublic) {
      return res.status(403).json({ error: 'Access denied to adventure' });
    }

    // Add adventure to collection
    if (!collection.adventures.includes(adventureId)) {
      collection.adventures.push(adventureId);
      await collection.save();
    }

    // Also add collection to adventure's collections array
    if (!adventure.collections.includes(req.params.id)) {
      adventure.collections.push(req.params.id);
      await adventure.save();
    }

    await collection.populate('adventures');
    res.json(collection);
  } catch (error) {
    console.error('Error adding adventure to collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/adventures/:adventureId - Remove adventure from collection
router.delete('/:id/adventures/:adventureId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const adventureId = req.params.adventureId;
    const adventure = await Adventure.findById(adventureId);

    // Remove adventure from collection
    collection.adventures = collection.adventures.filter(id => !id.equals(adventureId));
    await collection.save();

    // Also remove collection from adventure's collections array
    if (adventure && adventure.collections.includes(req.params.id)) {
      adventure.collections = adventure.collections.filter(id => id.toString() !== req.params.id);
      await adventure.save();
    }

    await collection.populate('adventures');
    res.json(collection);
  } catch (error) {
    console.error('Error removing adventure from collection:', error);
    res.status(500).json({ error: 'Failed to remove adventure from collection' });
  }
});

// POST /api/collections/:id/share - Share collection with users
router.post('/:id/share', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userIds, role = 'viewer' } = req.body;

    for (const userId of userIds) {
      await collection.addCollaborator(userId, role);
    }

    res.json(collection);
  } catch (error) {
    console.error('Error sharing collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/share/:userId - Remove user from collection sharing
router.delete('/:id/share/:userId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Only owner can remove collaborators
    if (collection.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Only collection owner can remove collaborators' });
    }

    await collection.removeCollaborator(req.params.userId);

    res.json(collection);
  } catch (error) {
    console.error('Error removing collection collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// === TRANSPORTATION ROUTES ===

// GET /api/collections/:id/transportation - Get transportation for collection
router.get('/:id/transportation', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.hasAccess(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transportation = await Transportation.find({ collectionId: req.params.id })
      .sort({ departureDate: 1 });

    res.json(transportation);
  } catch (error) {
    console.error('Error fetching transportation:', error);
    res.status(500).json({ error: 'Failed to fetch transportation' });
  }
});

// POST /api/collections/:id/transportation - Add transportation to collection
router.post('/:id/transportation', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transportationData = {
      ...req.body,
      collectionId: req.params.id,
      userId: req.user.uid
    };

    // Handle coordinates
    if (transportationData.originLatitude && transportationData.originLongitude) {
      transportationData.originCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(transportationData.originLongitude), parseFloat(transportationData.originLatitude)]
      };
    }

    if (transportationData.destinationLatitude && transportationData.destinationLongitude) {
      transportationData.destinationCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(transportationData.destinationLongitude), parseFloat(transportationData.destinationLatitude)]
      };
    }

    const transportation = new Transportation(transportationData);
    await transportation.save();

    res.status(201).json(transportation);
  } catch (error) {
    console.error('Error creating transportation:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id/transportation/:transportationId - Update transportation
router.put('/:id/transportation/:transportationId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transportation = await Transportation.findById(req.params.transportationId);

    if (!transportation) {
      return res.status(404).json({ error: 'Transportation not found' });
    }

    if (transportation.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Transportation does not belong to this collection' });
    }

    Object.assign(transportation, req.body);

    // Handle coordinates
    if (req.body.originLatitude && req.body.originLongitude) {
      transportation.originCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.originLongitude), parseFloat(req.body.originLatitude)]
      };
    }

    if (req.body.destinationLatitude && req.body.destinationLongitude) {
      transportation.destinationCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.destinationLongitude), parseFloat(req.body.destinationLatitude)]
      };
    }

    await transportation.save();

    res.json(transportation);
  } catch (error) {
    console.error('Error updating transportation:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/transportation/:transportationId - Delete transportation
router.delete('/:id/transportation/:transportationId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transportation = await Transportation.findById(req.params.transportationId);

    if (!transportation) {
      return res.status(404).json({ error: 'Transportation not found' });
    }

    if (transportation.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Transportation does not belong to this collection' });
    }

    await Transportation.findByIdAndDelete(req.params.transportationId);

    res.json({ message: 'Transportation deleted successfully' });
  } catch (error) {
    console.error('Error deleting transportation:', error);
    res.status(500).json({ error: 'Failed to delete transportation' });
  }
});

// === LODGING ROUTES ===

// GET /api/collections/:id/lodging - Get lodging for collection
router.get('/:id/lodging', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.hasAccess(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lodging = await Lodging.find({ collectionId: req.params.id })
      .sort({ checkInDate: 1 });

    res.json(lodging);
  } catch (error) {
    console.error('Error fetching lodging:', error);
    res.status(500).json({ error: 'Failed to fetch lodging' });
  }
});

// POST /api/collections/:id/lodging - Add lodging to collection
router.post('/:id/lodging', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lodgingData = {
      ...req.body,
      collectionId: req.params.id,
      userId: req.user.uid
    };

    // Handle coordinates
    if (lodgingData.latitude && lodgingData.longitude) {
      lodgingData.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(lodgingData.longitude), parseFloat(lodgingData.latitude)]
      };
    }

    const lodging = new Lodging(lodgingData);
    await lodging.save();

    res.status(201).json(lodging);
  } catch (error) {
    console.error('Error creating lodging:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id/lodging/:lodgingId - Update lodging
router.put('/:id/lodging/:lodgingId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lodging = await Lodging.findById(req.params.lodgingId);

    if (!lodging) {
      return res.status(404).json({ error: 'Lodging not found' });
    }

    if (lodging.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Lodging does not belong to this collection' });
    }

    Object.assign(lodging, req.body);

    // Handle coordinates
    if (req.body.latitude && req.body.longitude) {
      lodging.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    await lodging.save();

    res.json(lodging);
  } catch (error) {
    console.error('Error updating lodging:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/lodging/:lodgingId - Delete lodging
router.delete('/:id/lodging/:lodgingId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lodging = await Lodging.findById(req.params.lodgingId);

    if (!lodging) {
      return res.status(404).json({ error: 'Lodging not found' });
    }

    if (lodging.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Lodging does not belong to this collection' });
    }

    await Lodging.findByIdAndDelete(req.params.lodgingId);

    res.json({ message: 'Lodging deleted successfully' });
  } catch (error) {
    console.error('Error deleting lodging:', error);
    res.status(500).json({ error: 'Failed to delete lodging' });
  }
});

// === NOTES ROUTES ===

// GET /api/collections/:id/notes - Get notes for collection
router.get('/:id/notes', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.hasAccess(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const notes = await Note.find({ collectionId: req.params.id })
      .sort({ order: 1, createdAt: 1 });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/collections/:id/notes - Add note to collection
router.post('/:id/notes', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const noteData = {
      ...req.body,
      collectionId: req.params.id,
      userId: req.user.uid
    };

    const note = new Note(noteData);
    await note.save();

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id/notes/:noteId - Update note
router.put('/:id/notes/:noteId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Note does not belong to this collection' });
    }

    Object.assign(note, req.body);
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/notes/:noteId - Delete note
router.delete('/:id/notes/:noteId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Note does not belong to this collection' });
    }

    await Note.findByIdAndDelete(req.params.noteId);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// === CHECKLISTS ROUTES ===

// GET /api/collections/:id/checklists - Get checklists for collection
router.get('/:id/checklists', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.hasAccess(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklists = await Checklist.find({ collectionId: req.params.id })
      .sort({ order: 1, createdAt: 1 });

    res.json(checklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

// POST /api/collections/:id/checklists - Add checklist to collection
router.post('/:id/checklists', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklistData = {
      ...req.body,
      collectionId: req.params.id,
      userId: req.user.uid
    };

    const checklist = new Checklist(checklistData);
    await checklist.save();

    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id/checklists/:checklistId - Update checklist
router.put('/:id/checklists/:checklistId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklist = await Checklist.findById(req.params.checklistId);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    if (checklist.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Checklist does not belong to this collection' });
    }

    Object.assign(checklist, req.body);
    await checklist.save();

    res.json(checklist);
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/checklists/:checklistId - Delete checklist
router.delete('/:id/checklists/:checklistId', verifyToken, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklist = await Checklist.findById(req.params.checklistId);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    if (checklist.collectionId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Checklist does not belong to this collection' });
    }

    await Checklist.findByIdAndDelete(req.params.checklistId);

    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
});

module.exports = router;
