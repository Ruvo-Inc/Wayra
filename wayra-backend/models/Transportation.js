const mongoose = require('mongoose');

const TRANSPORTATION_TYPES = [
  'flight',
  'train',
  'bus',
  'boat',
  'bike',
  'walking',
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

const transportationSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: TRANSPORTATION_TYPES,
    default: 'other'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  startLocation: {
    type: String,
    required: false,
    trim: true
  },
  endLocation: {
    type: String,
    required: false,
    trim: true
  },
  startLatitude: {
    type: Number,
    required: false
  },
  startLongitude: {
    type: Number,
    required: false
  },
  endLatitude: {
    type: Number,
    required: false
  },
  endLongitude: {
    type: Number,
    required: false
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  startTimezone: {
    type: String,
    enum: TIMEZONES,
    required: false
  },
  endTimezone: {
    type: String,
    enum: TIMEZONES,
    required: false
  },
  confirmationNumber: {
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
  notes: {
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
transportationSchema.index({ collectionId: 1, startDate: 1 });
transportationSchema.index({ userId: 1, startDate: -1 });
transportationSchema.index({ type: 1, startDate: -1 });

// Pre-save validation
transportationSchema.pre('save', async function(next) {
  try {
    // Validate date logic
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      const error = new Error(`Start date must be before end date. Start: ${this.startDate}, End: ${this.endDate}`);
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
      
      // Check if collection is public but transportation is not
      if (collection.isPublic && !this.isPublic) {
        const error = new Error(`Transportation associated with public collection must be public. Collection: ${collection.name}, Transportation: ${this.name}`);
        return next(error);
      }
      
      // Check if user owns the collection
      if (collection.userId !== this.userId) {
        const error = new Error(`Transportation must be associated with collections owned by the same user. Collection owner: ${collection.userId}, Transportation owner: ${this.userId}`);
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
transportationSchema.methods.toJSON = function() {
  const transportation = this.toObject();
  return {
    id: transportation._id,
    collectionId: transportation.collectionId,
    userId: transportation.userId,
    type: transportation.type,
    name: transportation.name,
    description: transportation.description,
    startLocation: transportation.startLocation,
    endLocation: transportation.endLocation,
    startLatitude: transportation.startLatitude,
    startLongitude: transportation.startLongitude,
    endLatitude: transportation.endLatitude,
    endLongitude: transportation.endLongitude,
    startDate: transportation.startDate,
    endDate: transportation.endDate,
    startTimezone: transportation.startTimezone,
    endTimezone: transportation.endTimezone,
    confirmationNumber: transportation.confirmationNumber,
    price: transportation.price,
    currency: transportation.currency,
    link: transportation.link,
    notes: transportation.notes,
    isPublic: transportation.isPublic,
    createdAt: transportation.createdAt,
    updatedAt: transportation.updatedAt
  };
};

transportationSchema.methods.getDuration = function() {
  if (!this.startDate || !this.endDate) return null;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60)); // hours
};

transportationSchema.methods.getFormattedPrice = function() {
  if (!this.price) return null;
  return `${this.currency || 'USD'} ${this.price.toFixed(2)}`;
};

// Static methods
transportationSchema.statics.findByCollection = function(collectionId) {
  return this.find({ collectionId }).sort({ startDate: 1 });
};

transportationSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ startDate: -1 })
    .limit(limit)
    .populate('collectionId', 'name');
};

transportationSchema.statics.findByType = function(type, userId) {
  return this.find({ type, userId }).sort({ startDate: -1 });
};

transportationSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  const query = { userId };
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }
  return this.find(query).sort({ startDate: 1 });
};

transportationSchema.statics.getTypes = function() {
  return TRANSPORTATION_TYPES;
};

transportationSchema.statics.getTimezones = function() {
  return TIMEZONES;
};

module.exports = mongoose.model('Transportation', transportationSchema);
