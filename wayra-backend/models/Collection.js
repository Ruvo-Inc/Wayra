const mongoose = require('mongoose');

const transportationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['flight', 'train', 'bus', 'car', 'boat', 'other'],
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: String,
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  link: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link must be a valid URL'
    }
  },
  flightNumber: String,
  fromLocation: {
    type: String,
    maxlength: 200
  },
  toLocation: {
    type: String,
    maxlength: 200
  },
  originCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  destinationCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  departureDate: Date,
  arrivalDate: Date,
  startTimezone: String,
  endTimezone: String,
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const noteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: String,
  links: [String],
  date: Date,
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

const checklistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  items: [checklistItemSchema]
}, {
  timestamps: true
});

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: String,
  startDate: Date,
  endDate: Date,
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link must be a valid URL'
    }
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  adventures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure'
  }],
  transportation: [transportationSchema],
  notes: [noteSchema],
  checklists: [checklistSchema],
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
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

// Indexes
collectionSchema.index({ userId: 1, createdAt: -1 });
collectionSchema.index({ isPublic: 1, createdAt: -1 });
collectionSchema.index({ sharedWith: 1 });
collectionSchema.index({ startDate: 1, endDate: 1 });

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
  return this.userId.equals(userId) || 
         this.sharedWith.some(id => id.equals(userId)) ||
         this.collaborators.some(collab => collab.userId.equals(userId));
};

// Method to get user's role in collection
collectionSchema.methods.getUserRole = function(userId) {
  if (this.userId.equals(userId)) return 'owner';
  
  const collaborator = this.collaborators.find(collab => collab.userId.equals(userId));
  return collaborator ? collaborator.role : null;
};

// Method to check if user can edit collection
collectionSchema.methods.canEdit = function(userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'admin' || role === 'editor';
};

// Method to add collaborator
collectionSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  const existingCollab = this.collaborators.find(collab => collab.userId.equals(userId));
  if (existingCollab) {
    existingCollab.role = role;
  } else {
    this.collaborators.push({ userId, role });
    if (!this.sharedWith.includes(userId)) {
      this.sharedWith.push(userId);
    }
  }
  return this.save();
};

// Method to remove collaborator
collectionSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(collab => !collab.userId.equals(userId));
  this.sharedWith = this.sharedWith.filter(id => !id.equals(userId));
  return this.save();
};

// Method to get collection statistics
collectionSchema.methods.getStats = function() {
  return {
    totalAdventures: this.adventures.length,
    totalTransportation: this.transportation.length,
    totalNotes: this.notes.length,
    totalChecklists: this.checklists.length,
    totalChecklistItems: this.checklists.reduce((sum, checklist) => sum + checklist.items.length, 0),
    completedChecklistItems: this.checklists.reduce((sum, checklist) => 
      sum + checklist.items.filter(item => item.completed).length, 0
    ),
    durationDays: this.durationDays,
    collaboratorCount: this.collaborators.length
  };
};

// Pre-save validation
collectionSchema.pre('save', function(next) {
  // Validate date range
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('Start date must be before end date'));
  }
  
  // Validate transportation dates are within collection date range
  if (this.startDate && this.endDate) {
    for (const transport of this.transportation) {
      if (transport.departureDate && transport.departureDate < this.startDate) {
        return next(new Error('Transportation departure date must be within collection date range'));
      }
      if (transport.arrivalDate && transport.arrivalDate > this.endDate) {
        return next(new Error('Transportation arrival date must be within collection date range'));
      }
    }
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
  return this.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username profilePic');
};

module.exports = mongoose.model('Collection', collectionSchema);

