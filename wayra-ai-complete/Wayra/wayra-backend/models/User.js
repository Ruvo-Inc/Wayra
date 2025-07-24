const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Firebase Auth Integration
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  
  // Basic User Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  photoURL: {
    type: String,
    default: null
  },
  
  // User Preferences
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      tripUpdates: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true }
    }
  },
  
  // Trip Management
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  
  // Collaboration
  collaborations: [{
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    }
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (email and firebaseUid already have unique indexes)
userSchema.index({ 'collaborations.tripId': 1 });

// Virtual for trip count
userSchema.virtual('tripCount').get(function() {
  return this.trips.length;
});

// Methods
userSchema.methods.addTrip = function(tripId) {
  if (!this.trips.includes(tripId)) {
    this.trips.push(tripId);
  }
  return this.save();
};

userSchema.methods.removeTrip = function(tripId) {
  this.trips = this.trips.filter(id => !id.equals(tripId));
  return this.save();
};

userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
