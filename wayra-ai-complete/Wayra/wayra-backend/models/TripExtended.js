const mongoose = require('mongoose');

// Import the existing Trip schema
const Trip = require('./Trip');

// Extend the existing Trip schema with AdventureLog features
const tripExtensionSchema = new mongoose.Schema({
  // Adventure Integration
  adventures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure'
  }],
  
  // Collection/Itinerary Features from AdventureLog
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  
  // Enhanced Transportation (from AdventureLog)
  transportation: [{
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
    link: String,
    flightNumber: String,
    fromLocation: String,
    toLocation: String,
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
    cost: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' }
    },
    bookingReference: String,
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  
  // Enhanced Notes (from AdventureLog)
  notes: [{
    name: {
      type: String,
      required: true,
      maxlength: 200
    },
    content: String,
    links: [String],
    date: Date,
    attachments: [{
      filename: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Checklists (from AdventureLog)
  checklists: [{
    name: {
      type: String,
      required: true,
      maxlength: 200
    },
    items: [{
      text: {
        type: String,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Geographic Tracking
  visitedCountries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country'
  }],
  
  visitedRegions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  }],
  
  visitedCities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],
  
  // Social Features
  isPublic: {
    type: Boolean,
    default: false
  },
  
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Adventure-specific settings
  adventureSettings: {
    autoCreateAdventures: {
      type: Boolean,
      default: true
    },
    defaultAdventureVisibility: {
      type: Boolean,
      default: false
    },
    enableGeographicTracking: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  stats: {
    totalAdventures: {
      type: Number,
      default: 0
    },
    visitedAdventures: {
      type: Number,
      default: 0
    },
    plannedAdventures: {
      type: Number,
      default: 0
    },
    uniqueCountries: {
      type: Number,
      default: 0
    },
    averageAdventureRating: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Add indexes for adventure integration
tripExtensionSchema.index({ adventures: 1 });
tripExtensionSchema.index({ collections: 1 });
tripExtensionSchema.index({ visitedCountries: 1 });
tripExtensionSchema.index({ isPublic: 1 });

// Methods for adventure integration
tripExtensionSchema.methods.addAdventure = async function(adventureId) {
  if (!this.adventures.includes(adventureId)) {
    this.adventures.push(adventureId);
    await this.updateStats();
    return this.save();
  }
  return this;
};

tripExtensionSchema.methods.removeAdventure = async function(adventureId) {
  this.adventures = this.adventures.filter(id => !id.equals(adventureId));
  await this.updateStats();
  return this.save();
};

tripExtensionSchema.methods.updateStats = async function() {
  const Adventure = mongoose.model('Adventure');
  const adventures = await Adventure.find({ _id: { $in: this.adventures } });
  
  this.stats.totalAdventures = adventures.length;
  this.stats.visitedAdventures = adventures.filter(adv => adv.isVisited).length;
  this.stats.plannedAdventures = this.stats.totalAdventures - this.stats.visitedAdventures;
  
  const countries = new Set();
  let totalRating = 0;
  let ratedAdventures = 0;
  
  adventures.forEach(adventure => {
    if (adventure.geographic && adventure.geographic.countryCode) {
      countries.add(adventure.geographic.countryCode);
    }
    if (adventure.rating) {
      totalRating += adventure.rating;
      ratedAdventures++;
    }
  });
  
  this.stats.uniqueCountries = countries.size;
  this.stats.averageAdventureRating = ratedAdventures > 0 ? totalRating / ratedAdventures : 0;
};

// Method to check if user has access to trip
tripExtensionSchema.methods.hasAccess = function(userId) {
  return this.owner.equals(userId) || 
         this.collaborators.some(collab => collab.user.equals(userId)) ||
         this.sharedWith.some(shared => shared.user.equals(userId));
};

// Method to get user's role in trip
tripExtensionSchema.methods.getUserRole = function(userId) {
  if (this.owner.equals(userId)) return 'owner';
  
  const collaborator = this.collaborators.find(collab => collab.user.equals(userId));
  if (collaborator) return collaborator.role;
  
  const shared = this.sharedWith.find(shared => shared.user.equals(userId));
  return shared ? shared.role : null;
};

// Method to check if user can edit trip
tripExtensionSchema.methods.canEdit = function(userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'admin' || role === 'editor';
};

// Method to add checklist item
tripExtensionSchema.methods.addChecklistItem = function(checklistIndex, itemText, assignedTo = null) {
  if (this.checklists[checklistIndex]) {
    this.checklists[checklistIndex].items.push({
      text: itemText,
      assignedTo: assignedTo
    });
    return this.save();
  }
  throw new Error('Checklist not found');
};

// Method to complete checklist item
tripExtensionSchema.methods.completeChecklistItem = function(checklistIndex, itemIndex) {
  if (this.checklists[checklistIndex] && this.checklists[checklistIndex].items[itemIndex]) {
    const item = this.checklists[checklistIndex].items[itemIndex];
    item.completed = true;
    item.completedAt = new Date();
    return this.save();
  }
  throw new Error('Checklist item not found');
};

// Method to get trip progress
tripExtensionSchema.methods.getProgress = function() {
  const totalChecklistItems = this.checklists.reduce((sum, checklist) => 
    sum + checklist.items.length, 0
  );
  const completedChecklistItems = this.checklists.reduce((sum, checklist) => 
    sum + checklist.items.filter(item => item.completed).length, 0
  );
  
  const now = new Date();
  const totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil((now - this.startDate) / (1000 * 60 * 60 * 24)));
  
  return {
    checklistProgress: totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems * 100) : 0,
    timeProgress: totalDays > 0 ? Math.min(100, (daysElapsed / totalDays * 100)) : 0,
    adventureProgress: this.stats.totalAdventures > 0 ? (this.stats.visitedAdventures / this.stats.totalAdventures * 100) : 0,
    budgetProgress: this.budget && this.budget.total > 0 ? (this.getTotalSpent() / this.budget.total * 100) : 0
  };
};

// Method to get total spent (from existing Trip model)
tripExtensionSchema.methods.getTotalSpent = function() {
  if (!this.budget || !this.budget.spent) return 0;
  
  return Object.values(this.budget.spent).reduce((total, amount) => total + (amount || 0), 0);
};

// Static method to find trips with adventures
tripExtensionSchema.statics.findTripsWithAdventures = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
      { 'sharedWith.user': userId }
    ],
    adventures: { $exists: true, $not: { $size: 0 } }
  }).populate('adventures').sort({ createdAt: -1 });
};

// Pre-save middleware to update stats
tripExtensionSchema.pre('save', async function(next) {
  if (this.isModified('adventures')) {
    await this.updateStats();
  }
  next();
});

module.exports = tripExtensionSchema;

