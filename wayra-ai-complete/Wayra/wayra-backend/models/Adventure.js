const mongoose = require('mongoose');

// Adventure types matching reference AdventureLog
const ADVENTURE_TYPES = [
  { name: 'general', displayName: 'General 🌍' },
  { name: 'outdoor', displayName: 'Outdoor 🏞️' },
  { name: 'lodging', displayName: 'Lodging 🛌' },
  { name: 'dining', displayName: 'Dining 🍽️' },
  { name: 'activity', displayName: 'Activity 🏄' },
  { name: 'attraction', displayName: 'Attraction 🎢' },
  { name: 'shopping', displayName: 'Shopping 🛍️' },
  { name: 'nightlife', displayName: 'Nightlife 🌃' },
  { name: 'event', displayName: 'Event 🎉' },
  { name: 'transportation', displayName: 'Transportation 🚗' },
  { name: 'culture', displayName: 'Culture 🎭' },
  { name: 'water_sports', displayName: 'Water Sports 🚤' },
  { name: 'hiking', displayName: 'Hiking 🥾' },
  { name: 'wildlife', displayName: 'Wildlife 🦒' },
  { name: 'historical_sites', displayName: 'Historical Sites 🏛️' },
  { name: 'music_concerts', displayName: 'Music & Concerts 🎶' },
  { name: 'fitness', displayName: 'Fitness 🏋️' },
  { name: 'art_museums', displayName: 'Art & Museums 🎨' },
  { name: 'festivals', displayName: 'Festivals 🎪' },
  { name: 'spiritual_journeys', displayName: 'Spiritual Journeys 🧘‍♀️' },
  { name: 'volunteer_work', displayName: 'Volunteer Work 🤝' },
  { name: 'other', displayName: 'Other' }
];

const adventureSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
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
    maxlength: 100
  }],
  description: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  link: {
    type: String,
    maxlength: 2083
  },
  // Proper GeoJSON Point structure for MongoDB
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  },
  // Separate latitude/longitude fields for easier access
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  category: {
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    displayName: {
      type: String,
      required: true,
      maxlength: 200
    },
    icon: {
      type: String,
      default: '🌍'
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
  },
  visits: [{
    startDate: Date,
    endDate: Date,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    url: String,
    name: String,
    type: String
  }]
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries (only if coordinates exist)
adventureSchema.index({ coordinates: '2dsphere' }, { sparse: true });

// Index for user queries
adventureSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to ensure proper data structure
adventureSchema.pre('save', function(next) {
  // Sync coordinates with latitude/longitude
  if (this.latitude !== undefined && this.longitude !== undefined) {
    this.coordinates = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude] // GeoJSON format: [lng, lat]
    };
  } else if (this.coordinates && this.coordinates.coordinates && this.coordinates.coordinates.length === 2) {
    // Sync from coordinates to lat/lng
    this.longitude = this.coordinates.coordinates[0];
    this.latitude = this.coordinates.coordinates[1];
  }
  
  // Ensure category has required fields with proper defaults
  if (!this.category || !this.category.name || !this.category.displayName) {
    const defaultCategory = ADVENTURE_TYPES.find(t => t.name === 'general') || ADVENTURE_TYPES[0];
    this.category = {
      name: defaultCategory.name,
      displayName: defaultCategory.displayName,
      icon: '🌍'
    };
  }
  
  // Normalize category name to lowercase
  if (this.category && this.category.name) {
    this.category.name = this.category.name.toLowerCase().trim();
  }
  
  next();
});

// Static method to get available adventure types
adventureSchema.statics.getAdventureTypes = function() {
  return ADVENTURE_TYPES;
};

// Instance method to check if visited
adventureSchema.methods.isVisitedStatus = function() {
  const currentDate = new Date();
  return this.visits.some(visit => {
    if (visit.startDate && visit.endDate) {
      return visit.startDate <= currentDate;
    } else if (visit.startDate && !visit.endDate) {
      return visit.startDate <= currentDate;
    }
    return false;
  });
};

// Method to get primary image
adventureSchema.methods.getPrimaryImage = function() {
  return this.images.find(img => img.isPrimary) || this.images[0] || null;
};

// Pre-save middleware to update isVisited status
adventureSchema.pre('save', function(next) {
  const now = new Date();
  this.isVisited = this.visits.some(visit => {
    return visit.startDate <= now && (!visit.endDate || visit.endDate >= now);
  });
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
    { $match: { userId: userId } },
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

