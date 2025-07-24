const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  // Basic Trip Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Trip Dates
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  // Destinations
  destinations: [{
    name: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    arrivalDate: Date,
    departureDate: Date,
    accommodation: {
      name: String,
      address: String,
      checkIn: Date,
      checkOut: Date,
      bookingReference: String
    }
  }],
  
  // Budget Management
  budget: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    categories: {
      accommodation: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      shopping: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    spent: {
      accommodation: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      shopping: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  
  // Itinerary
  itinerary: [{
    day: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    activities: [{
      time: String,
      title: {
        type: String,
        required: true
      },
      description: String,
      location: {
        name: String,
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      duration: Number, // in minutes
      cost: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
      },
      category: {
        type: String,
        enum: ['accommodation', 'transportation', 'food', 'activities', 'shopping', 'other'],
        default: 'activities'
      },
      bookingReference: String,
      notes: String
    }]
  }],
  
  // Collaboration
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Trip Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  
  // AI-Generated Content
  aiRecommendations: [{
    type: {
      type: String,
      enum: ['activity', 'restaurant', 'attraction', 'accommodation']
    },
    title: String,
    description: String,
    location: String,
    rating: Number,
    priceRange: String,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Real-time Collaboration
  lastActivity: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
tripSchema.index({ owner: 1 });
tripSchema.index({ 'collaborators.user': 1 });
tripSchema.index({ startDate: 1, endDate: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdAt: -1 });

// Virtual for trip duration
tripSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for total spent
tripSchema.virtual('totalSpent').get(function() {
  const spent = this.budget.spent;
  return spent.accommodation + spent.transportation + spent.food + 
         spent.activities + spent.shopping + spent.other;
});

// Virtual for remaining budget
tripSchema.virtual('remainingBudget').get(function() {
  return this.budget.total - this.totalSpent;
});

// Methods
tripSchema.methods.addCollaborator = function(userId, role = 'viewer', invitedBy) {
  const existingCollaborator = this.collaborators.find(c => c.user.equals(userId));
  if (!existingCollaborator) {
    this.collaborators.push({
      user: userId,
      role,
      invitedBy
    });
  }
  return this.save();
};

tripSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(c => !c.user.equals(userId));
  return this.save();
};

tripSchema.methods.updateBudgetSpent = function(category, amount) {
  if (this.budget.spent[category] !== undefined) {
    this.budget.spent[category] += amount;
  }
  return this.save();
};

tripSchema.methods.addActivity = function(day, activity) {
  const dayItinerary = this.itinerary.find(i => i.day === day);
  if (dayItinerary) {
    dayItinerary.activities.push(activity);
  } else {
    this.itinerary.push({
      day,
      date: new Date(this.startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000),
      activities: [activity]
    });
  }
  return this.save();
};

// Static methods
tripSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId }).populate('owner collaborators.user');
};

tripSchema.statics.findByCollaborator = function(userId) {
  return this.find({ 'collaborators.user': userId }).populate('owner collaborators.user');
};

tripSchema.statics.findUserTrips = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId }
    ]
  }).populate('owner collaborators.user');
};

module.exports = mongoose.model('Trip', tripSchema);
