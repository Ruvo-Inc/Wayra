const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Adventure = require('../models/Adventure');
const Trip = require('../models/Trip');

// Import Firebase authentication middleware
const { authenticateUser } = require('../middleware/auth');

// GET /api/collections - List user's collections
router.get('/', authenticateUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isPublic,
      isArchived,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tripId
    } = req.query;

    const query = {
      $or: [
        { userId: req.user._id },
        { sharedWith: req.user._id },
        { 'collaborators.userId': req.user._id }
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

    if (tripId) {
      query.tripId = tripId;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const collections = await Collection.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username profilePic')
      .populate('sharedWith', 'username profilePic')
      .populate('adventures', 'name location rating isVisited')
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
      .populate('userId', 'username profilePic')
      .populate('adventures', 'name location rating isPublic')
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
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('userId', 'username profilePic')
      .populate('sharedWith', 'username profilePic')
      .populate('collaborators.userId', 'username profilePic')
      .populate('adventures')
      .populate('tripId', 'title description');

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if user has access
    if (!collection.hasAccess(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add user's role to response
    const userRole = collection.getUserRole(req.user._id);
    const collectionData = collection.toObject();
    collectionData.userRole = userRole;
    collectionData.canEdit = collection.canEdit(req.user._id);
    collectionData.stats = collection.getStats();

    res.json(collectionData);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// POST /api/collections - Create new collection
router.post('/', authenticateUser, async (req, res) => {
  try {
    const collectionData = {
      ...req.body,
      userId: req.user._id
    };

    const collection = new Collection(collectionData);
    await collection.save();

    // If tripId is provided, associate with trip
    if (req.body.tripId) {
      const trip = await Trip.findById(req.body.tripId);
      if (trip && (trip.owner.equals(req.user._id) || trip.collaborators.some(c => c.user.equals(req.user._id)))) {
        // Add collection to trip if user has access
        if (trip.collections) {
          trip.collections.push(collection._id);
        } else {
          trip.collections = [collection._id];
        }
        await trip.save();
      }
    }

    await collection.populate('userId', 'username profilePic');
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id - Update collection
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(collection, req.body);
    await collection.save();

    await collection.populate('userId', 'username profilePic');
    await collection.populate('adventures');

    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Only owner can delete collection
    if (!collection.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only collection owner can delete' });
    }

    // Remove collection reference from adventures
    await Adventure.updateMany(
      { collections: collection._id },
      { $pull: { collections: collection._id } }
    );

    // Remove collection reference from trips
    await Trip.updateMany(
      { collections: collection._id },
      { $pull: { collections: collection._id } }
    );

    await Collection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// POST /api/collections/:id/adventures - Add adventure to collection
router.post('/:id/adventures', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { adventureId } = req.body;
    const adventure = await Adventure.findById(adventureId);

    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    // Check if user has access to the adventure
    if (!adventure.userId.equals(req.user._id) && !adventure.isPublic) {
      return res.status(403).json({ error: 'Access denied to adventure' });
    }

    // Add adventure to collection
    if (!collection.adventures.includes(adventureId)) {
      collection.adventures.push(adventureId);
      await collection.save();
    }

    // Add collection to adventure
    if (!adventure.collections.includes(collection._id)) {
      adventure.collections.push(collection._id);
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
router.delete('/:id/adventures/:adventureId', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const adventureId = req.params.adventureId;

    // Remove adventure from collection
    collection.adventures = collection.adventures.filter(id => !id.equals(adventureId));
    await collection.save();

    // Remove collection from adventure
    await Adventure.findByIdAndUpdate(
      adventureId,
      { $pull: { collections: collection._id } }
    );

    await collection.populate('adventures');
    res.json(collection);
  } catch (error) {
    console.error('Error removing adventure from collection:', error);
    res.status(500).json({ error: 'Failed to remove adventure from collection' });
  }
});

// POST /api/collections/:id/share - Share collection with users
router.post('/:id/share', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userIds, role = 'viewer' } = req.body;

    for (const userId of userIds) {
      await collection.addCollaborator(userId, role);
    }

    await collection.populate('collaborators.userId', 'username profilePic');
    res.json(collection);
  } catch (error) {
    console.error('Error sharing collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/share/:userId - Remove user from collection sharing
router.delete('/:id/share/:userId', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Only owner can remove collaborators
    if (!collection.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only collection owner can remove collaborators' });
    }

    await collection.removeCollaborator(req.params.userId);

    await collection.populate('collaborators.userId', 'username profilePic');
    res.json(collection);
  } catch (error) {
    console.error('Error removing collection collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// POST /api/collections/:id/transportation - Add transportation to collection
router.post('/:id/transportation', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transportation = req.body;

    // Handle coordinates
    if (transportation.originLatitude && transportation.originLongitude) {
      transportation.originCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(transportation.originLongitude), parseFloat(transportation.originLatitude)]
      };
    }

    if (transportation.destinationLatitude && transportation.destinationLongitude) {
      transportation.destinationCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(transportation.destinationLongitude), parseFloat(transportation.destinationLatitude)]
      };
    }

    collection.transportation.push(transportation);
    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error adding transportation:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id/transportation/:transportId - Update transportation
router.put('/:id/transportation/:transportId', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transport = collection.transportation.id(req.params.transportId);
    if (!transport) {
      return res.status(404).json({ error: 'Transportation not found' });
    }

    Object.assign(transport, req.body);
    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error updating transportation:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/collections/:id/transportation/:transportId - Delete transportation
router.delete('/:id/transportation/:transportId', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    collection.transportation.id(req.params.transportId).remove();
    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error deleting transportation:', error);
    res.status(500).json({ error: 'Failed to delete transportation' });
  }
});

// POST /api/collections/:id/notes - Add note to collection
router.post('/:id/notes', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    collection.notes.push(req.body);
    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/collections/:id/checklists - Add checklist to collection
router.post('/:id/checklists', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    collection.checklists.push(req.body);
    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error adding checklist:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/collections/:id/checklists/:checklistId/items/:itemId/complete - Complete checklist item
router.put('/:id/checklists/:checklistId/items/:itemId/complete', authenticateUser, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.canEdit(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklist = collection.checklists.id(req.params.checklistId);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const item = checklist.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;

    await collection.save();

    res.json(collection);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

module.exports = router;

