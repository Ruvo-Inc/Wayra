const mongoose = require('mongoose');

// Collection schema based on reference AdventureLog Django model
const collectionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    maxlength: 2083,
    default: ''
  },
  // Many-to-many relationship with adventures (referenced in Adventure model)
  adventures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure'
  }],
  // Shared with other users (Firebase UIDs)
  sharedWith: [{
    type: String
  }],
  // Tags for categorization
  tags: [{
    type: String,
    maxlength: 50
  }],
  // Collaboration settings
  collaborators: [{
    userId: String,
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
collectionSchema.index({ userId: 1, createdAt: -1 });
collectionSchema.index({ isPublic: 1, createdAt: -1 });
collectionSchema.index({ sharedWith: 1 });
collectionSchema.index({ tags: 1 });

// Virtual for duration in days
collectionSchema.virtual('durationDays').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Method to check if user has access to collection
collectionSchema.methods.hasAccess = function(userId) {
  return this.userId === userId || 
         this.sharedWith.includes(userId) ||
         this.collaborators.some(collab => collab.userId === userId);
};

// Method to get user's role in collection
collectionSchema.methods.getUserRole = function(userId) {
  if (this.userId === userId) return 'owner';
  
  const collaborator = this.collaborators.find(collab => collab.userId === userId);
  return collaborator ? collaborator.role : 'viewer';
};

// Method to check if user can edit collection
collectionSchema.methods.canEdit = function(userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'editor';
};

// Method to get collection statistics
collectionSchema.methods.getStats = function() {
  return {
    adventureCount: this.adventures ? this.adventures.length : 0,
    durationDays: this.durationDays,
    isPublic: this.isPublic,
    isArchived: this.isArchived,
    collaboratorCount: this.collaborators ? this.collaborators.length : 0,
    sharedWithCount: this.sharedWith ? this.sharedWith.length : 0
  };
};

// Pre-save validation matching reference AdventureLog
collectionSchema.pre('save', function(next) {
  // Validate date range
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('Start date must be before end date'));
  }
  
  // Validate public collection constraints
  if (this.isPublic && this.isModified('isPublic')) {
    // Note: Adventure validation for public collections is handled in Adventure model
    // This matches the reference AdventureLog pattern
  }
  
  next();
});

// Static method to find collections user has access to
collectionSchema.statics.findUserCollections = function(userId) {
  return this.find({
    $or: [
      { userId: userId },
      { sharedWith: userId },
      { 'collaborators.userId': userId }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to find public collections
collectionSchema.statics.findPublicCollections = function(limit = 20) {
  return this.find({ isPublic: true, isArchived: false })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get user's collection statistics
collectionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        publicCollections: {
          $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] }
        },
        privateCollections: {
          $sum: { $cond: [{ $eq: ['$isPublic', false] }, 1, 0] }
        },
        archivedCollections: {
          $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] }
        },
        totalAdventures: { $sum: { $size: '$adventures' } },
        averageAdventuresPerCollection: { $avg: { $size: '$adventures' } }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        publicCollections: 1,
        privateCollections: 1,
        archivedCollections: 1,
        activeCollections: { $subtract: ['$total', '$archivedCollections'] },
        totalAdventures: 1,
        averageAdventuresPerCollection: { $round: ['$averageAdventuresPerCollection', 1] }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    publicCollections: 0,
    privateCollections: 0,
    archivedCollections: 0,
    activeCollections: 0,
    totalAdventures: 0,
    averageAdventuresPerCollection: 0
  };
};

module.exports = mongoose.model('Collection', collectionSchema);

