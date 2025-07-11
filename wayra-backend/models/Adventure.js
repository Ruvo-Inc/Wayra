const mongoose = require('mongoose');

const adventureImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  immichId: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const adventureVisitSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
});

const adventureAttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const adventureCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🌍'
  }
});

const adventureSchema = new mongoose.Schema({
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
  location: {
    type: String,
    maxlength: 200
  },
  activityTypes: [{
    type: String,
    enum: [
      'general', 'outdoor', 'lodging', 'dining', 'activity', 'attraction',
      'shopping', 'nightlife', 'event', 'transportation', 'culture',
      'water_sports', 'hiking', 'wildlife', 'historical_sites',
      'music_concerts', 'fitness', 'art_museums', 'festivals',
      'spiritual_journeys', 'volunteer_work', 'other'
    ]
  }],
  description: {
    type: String
  },
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
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  },
  geographic: {
    city: String,
    region: String,
    country: String,
    countryCode: String
  },
  visits: [adventureVisitSchema],
  images: [adventureImageSchema],
  attachments: [adventureAttachmentSchema],
  category: {
    type: adventureCategorySchema,
    default: {
      name: 'general',
      displayName: 'General',
      icon: '🌍'
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  isVisited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
adventureSchema.index({ coordinates: '2dsphere' });

// Index for user queries
adventureSchema.index({ userId: 1, createdAt: -1 });

// Index for public adventures
adventureSchema.index({ isPublic: 1, createdAt: -1 });

// Index for trip-based queries
adventureSchema.index({ tripId: 1, createdAt: -1 });

// Virtual for getting latitude/longitude separately
adventureSchema.virtual('latitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[1] : null;
});

adventureSchema.virtual('longitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[0] : null;
});

// Method to check if adventure is currently being visited
adventureSchema.methods.isCurrentlyVisited = function() {
  const now = new Date();
  return this.visits.some(visit => {
    return visit.startDate <= now && visit.endDate >= now;
  });
};

// Method to get primary image
adventureSchema.methods.getPrimaryImage = function() {
  return this.images.find(img => img.isPrimary) || this.images[0] || null;
};

// Pre-save middleware to update isVisited status
adventureSchema.pre('save', function(next) {
  const now = new Date();
  this.isVisited = this.visits.some(visit => visit.startDate <= now);
  next();
});

// Static method to find adventures near a location
adventureSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Static method to get user's travel statistics
adventureSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAdventures: { $sum: 1 },
        visitedAdventures: {
          $sum: { $cond: [{ $eq: ['$isVisited', true] }, 1, 0] }
        },
        countries: { $addToSet: '$geographic.countryCode' },
        averageRating: { $avg: '$rating' }
      }
    },
    {
      $project: {
        _id: 0,
        totalAdventures: 1,
        visitedAdventures: 1,
        plannedAdventures: { $subtract: ['$totalAdventures', '$visitedAdventures'] },
        uniqueCountries: { $size: { $filter: { input: '$countries', cond: { $ne: ['$$this', null] } } } },
        averageRating: { $round: ['$averageRating', 2] }
      }
    }
  ]);
  
  return stats[0] || {
    totalAdventures: 0,
    visitedAdventures: 0,
    plannedAdventures: 0,
    uniqueCountries: 0,
    averageRating: 0
  };
};

module.exports = mongoose.model('Adventure', adventureSchema);

