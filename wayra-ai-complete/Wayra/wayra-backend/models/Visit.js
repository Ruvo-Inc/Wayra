const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  adventureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false
  },
  timezone: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes
visitSchema.index({ adventureId: 1, startDate: 1 });
visitSchema.index({ userId: 1, startDate: -1 });

// Pre-save validation
visitSchema.pre('save', function(next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    const error = new Error(`End date must be after start date. Start: ${this.startDate}, End: ${this.endDate}`);
    return next(error);
  }
  next();
});

// Instance methods
visitSchema.methods.toJSON = function() {
  const visit = this.toObject();
  return {
    id: visit._id,
    adventureId: visit.adventureId,
    userId: visit.userId,
    startDate: visit.startDate,
    endDate: visit.endDate,
    timezone: visit.timezone,
    notes: visit.notes,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt
  };
};

visitSchema.methods.getDuration = function() {
  if (!this.endDate) return null;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // days
};

// Static methods
visitSchema.statics.findByAdventure = function(adventureId) {
  return this.find({ adventureId }).sort({ startDate: -1 });
};

visitSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ startDate: -1 })
    .limit(limit)
    .populate('adventureId', 'name location');
};

visitSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  const query = { userId };
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }
  return this.find(query).sort({ startDate: -1 });
};

module.exports = mongoose.model('Visit', visitSchema);
