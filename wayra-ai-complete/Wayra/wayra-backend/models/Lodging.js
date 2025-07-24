const mongoose = require('mongoose');

const LODGING_TYPES = [
  'hotel',
  'hostel',
  'resort',
  'bnb',
  'campground',
  'cabin',
  'apartment',
  'house',
  'other'
];

const TIMEZONES = [
  "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmera",
  "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Vancouver", "America/Mexico_City", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid",
  "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna", "Europe/Prague", "Europe/Warsaw",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Bangkok",
  "Asia/Mumbai", "Asia/Dubai", "Asia/Seoul", "Asia/Manila", "Asia/Jakarta",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Perth", "Australia/Brisbane",
  "Pacific/Auckland", "Pacific/Honolulu", "Pacific/Fiji", "UTC"
];

const lodgingSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: false,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: LODGING_TYPES,
    default: 'other'
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  rating: {
    type: Number,
    required: false,
    min: 0,
    max: 5
  },
  link: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link must be a valid URL'
    }
  },
  checkIn: {
    type: Date,
    required: false
  },
  checkOut: {
    type: Date,
    required: false
  },
  timezone: {
    type: String,
    enum: TIMEZONES,
    required: false
  },
  reservationNumber: {
    type: String,
    required: false,
    trim: true
  },
  price: {
    type: Number,
    required: false,
    min: 0
  },
  currency: {
    type: String,
    required: false,
    default: 'USD',
    maxlength: 3
  },
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  location: {
    type: String,
    required: false,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes
lodgingSchema.index({ collectionId: 1, checkIn: 1 });
lodgingSchema.index({ userId: 1, checkIn: -1 });
lodgingSchema.index({ type: 1, checkIn: -1 });
lodgingSchema.index({ latitude: 1, longitude: 1 });

// Pre-save validation
lodgingSchema.pre('save', async function(next) {
  try {
    // Validate date logic
    if (this.checkIn && this.checkOut && this.checkIn > this.checkOut) {
      const error = new Error(`Check-in date must be before check-out date. Check-in: ${this.checkIn}, Check-out: ${this.checkOut}`);
      return next(error);
    }
    
    // Validate collection relationship and permissions
    if (this.collectionId) {
      const Collection = mongoose.model('Collection');
      const collection = await Collection.findById(this.collectionId);
      
      if (!collection) {
        const error = new Error('Associated collection not found');
        return next(error);
      }
      
      // Check if collection is public but lodging is not
      if (collection.isPublic && !this.isPublic) {
        const error = new Error(`Lodging associated with public collection must be public. Collection: ${collection.name}, Lodging: ${this.name}`);
        return next(error);
      }
      
      // Check if user owns the collection
      if (collection.userId !== this.userId) {
        const error = new Error(`Lodging must be associated with collections owned by the same user. Collection owner: ${collection.userId}, Lodging owner: ${this.userId}`);
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
lodgingSchema.methods.toJSON = function() {
  const lodging = this.toObject();
  return {
    id: lodging._id,
    collectionId: lodging.collectionId,
    userId: lodging.userId,
    name: lodging.name,
    type: lodging.type,
    description: lodging.description,
    rating: lodging.rating,
    link: lodging.link,
    checkIn: lodging.checkIn,
    checkOut: lodging.checkOut,
    timezone: lodging.timezone,
    reservationNumber: lodging.reservationNumber,
    price: lodging.price,
    currency: lodging.currency,
    latitude: lodging.latitude,
    longitude: lodging.longitude,
    location: lodging.location,
    isPublic: lodging.isPublic,
    createdAt: lodging.createdAt,
    updatedAt: lodging.updatedAt
  };
};

lodgingSchema.methods.getDuration = function() {
  if (!this.checkIn || !this.checkOut) return null;
  return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24)); // days
};

lodgingSchema.methods.getFormattedPrice = function() {
  if (!this.price) return null;
  return `${this.currency || 'USD'} ${this.price.toFixed(2)}`;
};

lodgingSchema.methods.getTotalCost = function() {
  if (!this.price) return null;
  const duration = this.getDuration();
  return duration ? this.price * duration : this.price;
};

// Static methods
lodgingSchema.statics.findByCollection = function(collectionId) {
  return this.find({ collectionId }).sort({ checkIn: 1 });
};

lodgingSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ checkIn: -1 })
    .limit(limit)
    .populate('collectionId', 'name');
};

lodgingSchema.statics.findByType = function(type, userId) {
  return this.find({ type, userId }).sort({ checkIn: -1 });
};

lodgingSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  const query = { userId };
  if (startDate || endDate) {
    query.checkIn = {};
    if (startDate) query.checkIn.$gte = new Date(startDate);
    if (endDate) query.checkIn.$lte = new Date(endDate);
  }
  return this.find(query).sort({ checkIn: 1 });
};

lodgingSchema.statics.findNearby = function(latitude, longitude, maxDistance = 10000) {
  return this.find({
    latitude: { $exists: true },
    longitude: { $exists: true },
    $expr: {
      $lte: [
        {
          $multiply: [
            6371000, // Earth's radius in meters
            {
              $acos: {
                $add: [
                  {
                    $multiply: [
                      { $sin: { $degreesToRadians: latitude } },
                      { $sin: { $degreesToRadians: '$latitude' } }
                    ]
                  },
                  {
                    $multiply: [
                      { $cos: { $degreesToRadians: latitude } },
                      { $cos: { $degreesToRadians: '$latitude' } },
                      { $cos: { $degreesToRadians: { $subtract: [longitude, '$longitude'] } } }
                    ]
                  }
                ]
              }
            }
          ]
        },
        maxDistance
      ]
    }
  });
};

lodgingSchema.statics.getTypes = function() {
  return LODGING_TYPES;
};

lodgingSchema.statics.getTimezones = function() {
  return TIMEZONES;
};

module.exports = mongoose.model('Lodging', lodgingSchema);
