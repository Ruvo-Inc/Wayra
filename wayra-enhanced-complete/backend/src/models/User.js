const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User Model for Wayra Travel Planning Platform
 * Integrates with Firebase Authentication and provides comprehensive user profile management
 */

// Location sub-schema
const LocationSchema = new Schema({
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  timezone: {
    type: String,
    trim: true,
    default: 'UTC',
    validate: {
      validator: function(v) {
        // Basic timezone validation
        return /^[A-Za-z_]+\/[A-Za-z_]+$/.test(v) || v === 'UTC';
      },
      message: 'Invalid timezone format'
    }
  }
}, { _id: false });

// Budget range sub-schema
const BudgetRangeSchema = new Schema({
  min: {
    type: Number,
    min: [0, 'Minimum budget cannot be negative'],
    default: 500
  },
  max: {
    type: Number,
    min: [0, 'Maximum budget cannot be negative'],
    default: 2000,
    validate: {
      validator: function(value) {
        return value >= this.min;
      },
      message: 'Maximum budget must be greater than or equal to minimum budget'
    }
  },
  currency: {
    type: String,
    enum: {
      values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN'],
      message: '{VALUE} is not a supported currency'
    },
    default: 'USD'
  }
}, { _id: false });

// User profile sub-schema
const UserProfileSchema = new Schema({
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters'],
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [30, 'First name cannot exceed 30 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [30, 'Last name cannot exceed 30 characters']
  },
  photoURL: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Photo URL must be a valid image URL'
    }
  },
  phoneNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^\+?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        const age = (new Date() - v) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 13 && age <= 120; // Reasonable age range
      },
      message: 'Invalid date of birth'
    }
  },
  location: {
    type: LocationSchema,
    default: () => ({})
  }
}, { _id: false });

// User preferences sub-schema
const UserPreferencesSchema = new Schema({
  budgetRange: {
    type: BudgetRangeSchema,
    default: () => ({})
  },
  travelStyle: {
    type: [String],
    enum: {
      values: ['budget', 'luxury', 'adventure', 'cultural', 'relaxation', 'business', 'family', 'solo', 'group'],
      message: '{VALUE} is not a valid travel style'
    },
    default: ['budget']
  },
  interests: {
    type: [String],
    enum: {
      values: [
        'food', 'culture', 'nature', 'adventure', 'relaxation', 'nightlife', 
        'shopping', 'history', 'art', 'music', 'sports', 'photography',
        'architecture', 'beaches', 'mountains', 'cities', 'countryside'
      ],
      message: '{VALUE} is not a valid interest'
    },
    default: []
  },
  accommodationPreferences: {
    type: [String],
    enum: {
      values: ['hotel', 'hostel', 'airbnb', 'resort', 'apartment', 'guesthouse', 'camping', 'luxury'],
      message: '{VALUE} is not a valid accommodation preference'
    },
    default: ['hotel']
  },
  transportationPreferences: {
    type: [String],
    enum: {
      values: ['flight', 'train', 'bus', 'car', 'bike', 'walking', 'boat', 'metro'],
      message: '{VALUE} is not a valid transportation preference'
    },
    default: ['flight']
  },
  dietaryRestrictions: {
    type: [String],
    enum: {
      values: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher', 'low-carb'],
      message: '{VALUE} is not a valid dietary restriction'
    },
    default: []
  },
  accessibility: {
    type: [String],
    enum: {
      values: ['wheelchair', 'mobility-aid', 'visual-impairment', 'hearing-impairment', 'cognitive-support'],
      message: '{VALUE} is not a valid accessibility requirement'
    },
    default: []
  }
}, { _id: false });

// Notification settings sub-schema
const NotificationSettingsSchema = new Schema({
  email: {
    type: Boolean,
    default: true
  },
  push: {
    type: Boolean,
    default: true
  },
  tripUpdates: {
    type: Boolean,
    default: true
  },
  priceAlerts: {
    type: Boolean,
    default: false
  },
  collaborationInvites: {
    type: Boolean,
    default: true
  },
  aiRecommendations: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Privacy settings sub-schema
const PrivacySettingsSchema = new Schema({
  profileVisibility: {
    type: String,
    enum: {
      values: ['public', 'friends', 'private'],
      message: '{VALUE} is not a valid profile visibility setting'
    },
    default: 'public'
  },
  tripVisibility: {
    type: String,
    enum: {
      values: ['public', 'friends', 'private'],
      message: '{VALUE} is not a valid trip visibility setting'
    },
    default: 'private'
  },
  allowInvitations: {
    type: Boolean,
    default: true
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  },
  allowDataExport: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// AI settings sub-schema
const AISettingsSchema = new Schema({
  personalizationEnabled: {
    type: Boolean,
    default: true
  },
  dataUsageConsent: {
    type: Boolean,
    default: false,
    required: [true, 'Data usage consent must be explicitly set']
  },
  learningFromHistory: {
    type: Boolean,
    default: true
  },
  communicationStyle: {
    type: String,
    enum: {
      values: ['formal', 'casual', 'enthusiastic', 'concise'],
      message: '{VALUE} is not a valid communication style'
    },
    default: 'casual'
  },
  detailLevel: {
    type: String,
    enum: {
      values: ['brief', 'moderate', 'comprehensive'],
      message: '{VALUE} is not a valid detail level'
    },
    default: 'moderate'
  },
  riskTolerance: {
    type: String,
    enum: {
      values: ['conservative', 'moderate', 'adventurous'],
      message: '{VALUE} is not a valid risk tolerance level'
    },
    default: 'moderate'
  }
}, { _id: false });

// User settings sub-schema
const UserSettingsSchema = new Schema({
  notifications: {
    type: NotificationSettingsSchema,
    default: () => ({})
  },
  privacy: {
    type: PrivacySettingsSchema,
    default: () => ({})
  },
  ai: {
    type: AISettingsSchema,
    default: () => ({ dataUsageConsent: false })
  },
  language: {
    type: String,
    enum: {
      values: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
      message: '{VALUE} is not a supported language'
    },
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, { _id: false });

// User statistics sub-schema
const UserStatsSchema = new Schema({
  tripsPlanned: {
    type: Number,
    min: [0, 'Trips planned cannot be negative'],
    default: 0
  },
  tripsCompleted: {
    type: Number,
    min: [0, 'Trips completed cannot be negative'],
    default: 0
  },
  totalBudgetSaved: {
    type: Number,
    min: [0, 'Total budget saved cannot be negative'],
    default: 0
  },
  favoriteDestinations: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10; // Limit to 10 favorite destinations
      },
      message: 'Cannot have more than 10 favorite destinations'
    }
  },
  averageTripDuration: {
    type: Number,
    min: [1, 'Average trip duration must be at least 1 day'],
    max: [365, 'Average trip duration cannot exceed 365 days'],
    default: 7
  },
  totalTripsCollaborated: {
    type: Number,
    min: [0, 'Total trips collaborated cannot be negative'],
    default: 0
  },
  aiInteractionsCount: {
    type: Number,
    min: [0, 'AI interactions count cannot be negative'],
    default: 0
  }
}, { _id: false });

// Main User Schema
const UserSchema = new Schema({
  firebaseUid: {
    type: String,
    required: [true, 'Firebase UID is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  profile: {
    type: UserProfileSchema,
    required: [true, 'User profile is required']
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  },
  settings: {
    type: UserSettingsSchema,
    default: () => ({})
  },
  stats: {
    type: UserStatsSchema,
    default: () => ({})
  },
  trips: [{
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  collaboratedTrips: [{
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  accountCreatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance optimization (unique indexes are automatically created)
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'profile.location.country': 1 });
UserSchema.index({ 'preferences.budgetRange.currency': 1 });
UserSchema.index({ 'preferences.travelStyle': 1 });

// Compound indexes for common queries
UserSchema.index({ isActive: 1, lastLoginAt: -1 });
UserSchema.index({ 'preferences.travelStyle': 1, 'profile.location.country': 1 });

// Virtual properties
UserSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.displayName;
});

UserSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

UserSchema.virtual('completionRate').get(function() {
  if (this.stats.tripsPlanned === 0) return 0;
  return Math.round((this.stats.tripsCompleted / this.stats.tripsPlanned) * 100);
});

UserSchema.virtual('isNewUser').get(function() {
  const daysSinceCreation = (new Date() - this.accountCreatedAt) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 7; // New user if account is less than 7 days old
});

// Instance methods
UserSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  this.lastActivityAt = new Date();
  return this.save();
};

UserSchema.methods.updateActivity = function() {
  this.lastActivityAt = new Date();
  return this.save();
};

UserSchema.methods.incrementTripStats = function(type) {
  if (type === 'planned') {
    this.stats.tripsPlanned += 1;
  } else if (type === 'completed') {
    this.stats.tripsCompleted += 1;
  } else if (type === 'collaborated') {
    this.stats.totalTripsCollaborated += 1;
  }
  return this.save();
};

UserSchema.methods.addFavoriteDestination = function(destination) {
  if (!this.stats.favoriteDestinations.includes(destination)) {
    this.stats.favoriteDestinations.push(destination);
    // Keep only top 10 favorites
    if (this.stats.favoriteDestinations.length > 10) {
      this.stats.favoriteDestinations = this.stats.favoriteDestinations.slice(-10);
    }
  }
  return this.save();
};

UserSchema.methods.updateBudgetSaved = function(amount) {
  this.stats.totalBudgetSaved += amount;
  return this.save();
};

UserSchema.methods.getPublicProfile = function() {
  const publicData = {
    _id: this._id,
    displayName: this.profile.displayName,
    photoURL: this.profile.photoURL,
    location: this.profile.location,
    stats: {
      tripsCompleted: this.stats.tripsCompleted,
      favoriteDestinations: this.stats.favoriteDestinations
    },
    isActive: this.isActive,
    createdAt: this.createdAt
  };

  // Include additional fields based on privacy settings
  if (this.settings.privacy.profileVisibility === 'public') {
    publicData.interests = this.preferences.interests;
    publicData.travelStyle = this.preferences.travelStyle;
  }

  return publicData;
};

UserSchema.methods.canBeInvitedBy = function(inviterUser) {
  // Check if user allows invitations
  if (!this.settings.privacy.allowInvitations) {
    return false;
  }

  // Check if user is active
  if (!this.isActive) {
    return false;
  }

  // Additional logic can be added here (e.g., blocking, friendship status)
  return true;
};

// Static methods
UserSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid, isActive: true });
};

UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

UserSchema.statics.findActiveUsers = function(limit = 50) {
  return this.find({ isActive: true })
    .sort({ lastLoginAt: -1 })
    .limit(limit)
    .select('profile.displayName profile.photoURL stats.tripsCompleted createdAt');
};

UserSchema.statics.getUsersByTravelStyle = function(travelStyle, limit = 20) {
  return this.find({ 
    'preferences.travelStyle': travelStyle,
    isActive: true,
    'settings.privacy.profileVisibility': { $in: ['public', 'friends'] }
  })
  .sort({ 'stats.tripsCompleted': -1 })
  .limit(limit)
  .select('profile.displayName profile.photoURL stats preferences.travelStyle');
};

UserSchema.statics.searchUsers = function(query, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  const filter = {
    isActive: true,
    $or: [
      { 'profile.displayName': searchRegex },
      { 'profile.firstName': searchRegex },
      { 'profile.lastName': searchRegex },
      { email: searchRegex }
    ]
  };

  // Respect privacy settings
  if (!options.includePrivate) {
    filter['settings.privacy.profileVisibility'] = { $in: ['public', 'friends'] };
  }

  return this.find(filter)
    .sort({ 'stats.tripsCompleted': -1 })
    .limit(options.limit || 20)
    .select('profile.displayName profile.photoURL stats.tripsCompleted');
};

// Pre-save middleware
UserSchema.pre('save', function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Validate budget range
  if (this.preferences.budgetRange.max < this.preferences.budgetRange.min) {
    return next(new Error('Maximum budget must be greater than or equal to minimum budget'));
  }
  
  // Set default display name if not provided
  if (!this.profile.displayName && this.profile.firstName) {
    this.profile.displayName = this.profile.firstName;
  }
  
  next();
});

// Post-save middleware
UserSchema.post('save', function(doc) {
  // Log user activity for analytics (could be sent to external service)
  console.log(`User ${doc.profile.displayName} (${doc.email}) profile updated`);
});

// Pre-remove middleware
UserSchema.pre('remove', function(next) {
  // Clean up related data when user is deleted
  // This would typically involve removing user from trips, etc.
  console.log(`Preparing to delete user: ${this.email}`);
  next();
});

// Create and export the model
const User = mongoose.model('User', UserSchema);

module.exports = User;