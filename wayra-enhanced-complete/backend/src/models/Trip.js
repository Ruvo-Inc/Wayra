const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Trip Model for Wayra Travel Planning Platform
 * Supports collaborative trip planning with AI-generated content storage,
 * versioning, activity logging, and booking integration
 */

// Destination sub-schema
const DestinationSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    trim: true,
    maxlength: [200, 'Destination name cannot exceed 200 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  region: {
    type: String,
    trim: true,
    maxlength: [100, 'Region name cannot exceed 100 characters']
  },
  coordinates: {
    lat: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  timezone: {
    type: String,
    trim: true,
    default: 'UTC'
  }
}, { _id: false });

// Trip dates sub-schema
const TripDatesSchema = new Schema({
  start: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Start date cannot be in the past'
    }
  },
  end: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.start;
      },
      message: 'End date must be after start date'
    }
  },
  flexible: {
    type: Boolean,
    default: false
  },
  flexibilityDays: {
    type: Number,
    min: [0, 'Flexibility days cannot be negative'],
    max: [30, 'Flexibility days cannot exceed 30'],
    default: 0
  }
}, { _id: false });

// Budget breakdown sub-schema
const BudgetBreakdownSchema = new Schema({
  accommodation: {
    type: Number,
    min: [0, 'Accommodation budget cannot be negative'],
    default: 0
  },
  transportation: {
    type: Number,
    min: [0, 'Transportation budget cannot be negative'],
    default: 0
  },
  food: {
    type: Number,
    min: [0, 'Food budget cannot be negative'],
    default: 0
  },
  activities: {
    type: Number,
    min: [0, 'Activities budget cannot be negative'],
    default: 0
  },
  shopping: {
    type: Number,
    min: [0, 'Shopping budget cannot be negative'],
    default: 0
  },
  miscellaneous: {
    type: Number,
    min: [0, 'Miscellaneous budget cannot be negative'],
    default: 0
  }
}, { _id: false });

// Budget sub-schema
const BudgetSchema = new Schema({
  total: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Total budget cannot be negative']
  },
  currency: {
    type: String,
    enum: {
      values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN'],
      message: '{VALUE} is not a supported currency'
    },
    default: 'USD'
  },
  breakdown: {
    type: BudgetBreakdownSchema,
    default: () => ({})
  },
  spent: {
    type: BudgetBreakdownSchema,
    default: () => ({})
  },
  remaining: {
    type: Number,
    min: [0, 'Remaining budget cannot be negative'],
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Travelers sub-schema
const TravelersSchema = new Schema({
  adults: {
    type: Number,
    required: [true, 'Number of adults is required'],
    min: [1, 'At least one adult is required'],
    max: [20, 'Cannot exceed 20 adults']
  },
  children: {
    type: Number,
    min: [0, 'Number of children cannot be negative'],
    max: [20, 'Cannot exceed 20 children'],
    default: 0
  },
  infants: {
    type: Number,
    min: [0, 'Number of infants cannot be negative'],
    max: [10, 'Cannot exceed 10 infants'],
    default: 0
  }
}, { _id: false });

// Collaborator sub-schema
const CollaboratorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  role: {
    type: String,
    enum: {
      values: ['owner', 'editor', 'viewer', 'contributor'],
      message: '{VALUE} is not a valid collaborator role'
    },
    required: [true, 'Collaborator role is required']
  },
  permissions: {
    type: [String],
    enum: {
      values: [
        'view_trip', 'edit_trip', 'delete_trip', 'manage_collaborators',
        'edit_budget', 'edit_itinerary', 'book_activities', 'invite_users',
        'export_data', 'manage_bookings'
      ],
      message: '{VALUE} is not a valid permission'
    },
    default: function() {
      switch (this.role) {
        case 'owner':
          return ['view_trip', 'edit_trip', 'delete_trip', 'manage_collaborators', 
                  'edit_budget', 'edit_itinerary', 'book_activities', 'invite_users',
                  'export_data', 'manage_bookings'];
        case 'editor':
          return ['view_trip', 'edit_trip', 'edit_budget', 'edit_itinerary', 
                  'book_activities', 'export_data'];
        case 'contributor':
          return ['view_trip', 'edit_itinerary', 'book_activities'];
        case 'viewer':
        default:
          return ['view_trip'];
      }
    }
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter ID is required']
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'declined', 'removed'],
      message: '{VALUE} is not a valid invitation status'
    },
    default: 'pending'
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// AI Generated Content sub-schema
const AIGeneratedSchema = new Schema({
  itinerary: {
    type: Schema.Types.Mixed,
    default: {}
  },
  budgetAnalysis: {
    type: Schema.Types.Mixed,
    default: {}
  },
  destinationInsights: {
    type: Schema.Types.Mixed,
    default: {}
  },
  travelCoordination: {
    type: Schema.Types.Mixed,
    default: {}
  },
  recommendations: {
    type: Schema.Types.Mixed,
    default: {}
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  agentVersions: {
    budgetAnalyst: String,
    destinationResearcher: String,
    itineraryPlanner: String,
    travelCoordinator: String,
    default: {}
  },
  regenerationCount: {
    type: Number,
    min: [0, 'Regeneration count cannot be negative'],
    default: 0
  },
  userFeedback: {
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    comments: String,
    helpful: Boolean,
    feedbackAt: Date
  }
}, { _id: false });

// User Customizations sub-schema
const CustomizationSchema = new Schema({
  type: {
    type: String,
    enum: {
      values: [
        'itinerary_change', 'budget_adjustment', 'destination_change',
        'date_change', 'traveler_change', 'preference_update', 'booking_update'
      ],
      message: '{VALUE} is not a valid customization type'
    },
    required: [true, 'Customization type is required']
  },
  changes: {
    type: Schema.Types.Mixed,
    required: [true, 'Changes data is required']
  },
  previousValue: {
    type: Schema.Types.Mixed
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  approved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Activity Log sub-schema
const ActivityLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  action: {
    type: String,
    enum: {
      values: [
        'trip_created', 'trip_updated', 'trip_deleted', 'collaborator_invited',
        'collaborator_accepted', 'collaborator_removed', 'collaborator_role_updated',
        'budget_updated', 'itinerary_updated', 'booking_made', 'booking_cancelled', 
        'ai_regenerated', 'customization_made', 'status_changed', 'trip_shared', 
        'trip_exported', 'trip_archived'
      ],
      message: '{VALUE} is not a valid activity action'
    },
    required: [true, 'Activity action is required']
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Booking sub-schema
const BookingSchema = new Schema({
  type: {
    type: String,
    enum: {
      values: ['flight', 'hotel', 'activity', 'transport', 'restaurant', 'tour', 'rental'],
      message: '{VALUE} is not a valid booking type'
    },
    required: [true, 'Booking type is required']
  },
  provider: {
    type: String,
    required: [true, 'Booking provider is required'],
    trim: true,
    maxlength: [100, 'Provider name cannot exceed 100 characters']
  },
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    trim: true,
    maxlength: [100, 'Booking reference cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
      message: '{VALUE} is not a valid booking status'
    },
    default: 'pending'
  },
  cost: {
    amount: {
      type: Number,
      required: [true, 'Booking cost is required'],
      min: [0, 'Booking cost cannot be negative']
    },
    currency: {
      type: String,
      enum: {
        values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN'],
        message: '{VALUE} is not a supported currency'
      },
      default: 'USD'
    }
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  bookedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booked by user ID is required']
  },
  confirmationDate: Date,
  cancellationDate: Date,
  refundAmount: Number
});

// Main Trip Schema
const TripSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    minlength: [3, 'Trip title must be at least 3 characters'],
    maxlength: [200, 'Trip title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Trip description cannot exceed 2000 characters']
  },
  destination: {
    type: DestinationSchema,
    required: [true, 'Destination is required']
  },
  dates: {
    type: TripDatesSchema,
    required: [true, 'Trip dates are required']
  },
  budget: {
    type: BudgetSchema,
    required: [true, 'Budget information is required']
  },
  travelers: {
    type: TravelersSchema,
    required: [true, 'Traveler information is required']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trip owner is required']
  },
  collaborators: {
    type: [CollaboratorSchema],
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'planning', 'booked', 'in_progress', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid trip status'
    },
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: {
      values: ['private', 'shared', 'public'],
      message: '{VALUE} is not a valid visibility setting'
    },
    default: 'private'
  },
  
  // AI Generated Content
  aiGenerated: {
    type: AIGeneratedSchema,
    default: () => ({})
  },
  
  // User Modifications
  customizations: {
    type: [CustomizationSchema],
    default: []
  },
  
  // Collaboration History
  activityLog: {
    type: [ActivityLogSchema],
    default: []
  },
  
  // Booking Information
  bookings: {
    type: [BookingSchema],
    default: []
  },
  
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 20; // Limit to 20 tags
      },
      message: 'Cannot have more than 20 tags'
    },
    default: []
  },
  
  // Trip preferences and settings
  preferences: {
    autoSave: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    aiAssistance: {
      type: Boolean,
      default: true
    }
  },
  
  // Metadata
  version: {
    type: Number,
    default: 1
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  completedAt: Date,
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes for performance optimization
TripSchema.index({ owner: 1, createdAt: -1 });
TripSchema.index({ 'collaborators.userId': 1 });
TripSchema.index({ 'destination.name': 1 });
TripSchema.index({ 'destination.country': 1 });
TripSchema.index({ 'dates.start': 1, 'dates.end': 1 });
TripSchema.index({ status: 1 });
TripSchema.index({ visibility: 1 });
TripSchema.index({ tags: 1 });
TripSchema.index({ createdAt: -1 });
TripSchema.index({ updatedAt: -1 });

// Compound indexes for common queries
TripSchema.index({ owner: 1, status: 1, createdAt: -1 });
TripSchema.index({ 'collaborators.userId': 1, status: 1 });
TripSchema.index({ 'destination.country': 1, 'dates.start': 1 });
TripSchema.index({ status: 1, visibility: 1 });
TripSchema.index({ isArchived: 1, createdAt: -1 });

// Text index for search functionality
TripSchema.index({
  title: 'text',
  description: 'text',
  'destination.name': 'text',
  'destination.country': 'text',
  tags: 'text'
});

// Virtual properties
TripSchema.virtual('duration').get(function() {
  if (!this.dates.start || !this.dates.end) return 0;
  const diffTime = Math.abs(this.dates.end - this.dates.start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

TripSchema.virtual('totalTravelers').get(function() {
  return this.travelers.adults + this.travelers.children + this.travelers.infants;
});

TripSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.total === 0) return 0;
  const totalSpent = (this.budget.spent.accommodation || 0) +
                    (this.budget.spent.transportation || 0) +
                    (this.budget.spent.food || 0) +
                    (this.budget.spent.activities || 0) +
                    (this.budget.spent.shopping || 0) +
                    (this.budget.spent.miscellaneous || 0);
  return Math.round((totalSpent / this.budget.total) * 100);
});

TripSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators.filter(c => c.status === 'accepted').length;
});

TripSchema.virtual('isUpcoming').get(function() {
  return this.dates.start > new Date();
});

TripSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.dates.start <= now && this.dates.end >= now;
});

TripSchema.virtual('isPast').get(function() {
  return this.dates.end < new Date();
});

TripSchema.virtual('daysUntilTrip').get(function() {
  if (!this.isUpcoming) return 0;
  const diffTime = this.dates.start - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

TripSchema.virtual('hasAIContent').get(function() {
  return !!(this.aiGenerated.itinerary || this.aiGenerated.budgetAnalysis || 
           this.aiGenerated.destinationInsights || this.aiGenerated.travelCoordination);
});

TripSchema.virtual('bookingStats').get(function() {
  const bookings = this.bookings;
  return {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalCost: bookings.reduce((sum, b) => sum + (b.cost.amount || 0), 0)
  };
});

// Instance methods
TripSchema.methods.addCollaborator = function(userId, role, invitedBy, permissions = null) {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    throw new Error('User is already a collaborator on this trip');
  }
  
  const collaborator = {
    userId,
    role,
    invitedBy,
    permissions: permissions || undefined, // Let default function handle permissions
    status: 'pending'
  };
  
  this.collaborators.push(collaborator);
  
  // Log activity
  this.logActivity(invitedBy, 'collaborator_invited', {
    invitedUserId: userId,
    role: role
  });
  
  return this.save();
};

TripSchema.methods.acceptInvitation = function(userId) {
  const collaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString() && c.status === 'pending'
  );
  
  if (!collaborator) {
    throw new Error('No pending invitation found for this user');
  }
  
  collaborator.status = 'accepted';
  collaborator.acceptedAt = new Date();
  collaborator.lastActiveAt = new Date();
  
  // Log activity
  this.logActivity(userId, 'collaborator_accepted', {
    role: collaborator.role
  });
  
  return this.save();
};

TripSchema.methods.removeCollaborator = function(userId, removedBy) {
  const collaboratorIndex = this.collaborators.findIndex(c => 
    c.userId.toString() === userId.toString()
  );
  
  if (collaboratorIndex === -1) {
    throw new Error('Collaborator not found');
  }
  
  const collaborator = this.collaborators[collaboratorIndex];
  
  // Cannot remove owner
  if (collaborator.role === 'owner') {
    throw new Error('Cannot remove trip owner');
  }
  
  this.collaborators.splice(collaboratorIndex, 1);
  
  // Log activity
  this.logActivity(removedBy, 'collaborator_removed', {
    removedUserId: userId,
    role: collaborator.role
  });
  
  return this.save();
};

TripSchema.methods.updateCollaboratorRole = function(userId, newRole, updatedBy) {
  const collaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString()
  );
  
  if (!collaborator) {
    throw new Error('Collaborator not found');
  }
  
  // Cannot change owner role
  if (collaborator.role === 'owner' || newRole === 'owner') {
    throw new Error('Cannot change owner role');
  }
  
  const oldRole = collaborator.role;
  collaborator.role = newRole;
  collaborator.lastActiveAt = new Date();
  
  // Update permissions based on new role
  switch (newRole) {
    case 'editor':
      collaborator.permissions = ['view_trip', 'edit_trip', 'edit_budget', 'edit_itinerary', 
                                 'book_activities', 'export_data'];
      break;
    case 'contributor':
      collaborator.permissions = ['view_trip', 'edit_itinerary', 'book_activities'];
      break;
    case 'viewer':
    default:
      collaborator.permissions = ['view_trip'];
      break;
  }
  
  // Log activity
  this.logActivity(updatedBy, 'collaborator_role_updated', {
    userId: userId,
    oldRole: oldRole,
    newRole: newRole
  });
  
  return this.save();
};

TripSchema.methods.hasPermission = function(userId, permission) {
  const collaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString() && c.status === 'accepted'
  );
  
  if (!collaborator) {
    return false;
  }
  
  return collaborator.permissions.includes(permission);
};

TripSchema.methods.logActivity = function(userId, action, details = {}, metadata = {}) {
  this.activityLog.push({
    userId,
    action,
    details,
    metadata,
    timestamp: new Date()
  });
  
  // Keep only last 1000 activity log entries
  if (this.activityLog.length > 1000) {
    this.activityLog = this.activityLog.slice(-1000);
  }
};

TripSchema.methods.addCustomization = function(userId, type, changes, previousValue = null, reason = '') {
  this.customizations.push({
    type,
    changes,
    previousValue,
    userId,
    reason,
    timestamp: new Date()
  });
  
  // Log activity
  this.logActivity(userId, 'customization_made', {
    type: type,
    reason: reason
  });
  
  // Update version
  this.version += 1;
  this.lastModifiedBy = userId;
  
  return this.save();
};

TripSchema.methods.updateAIContent = function(contentType, content, agentVersion = null) {
  this.aiGenerated[contentType] = content;
  this.aiGenerated.generatedAt = new Date();
  
  if (agentVersion) {
    this.aiGenerated.agentVersions[contentType] = agentVersion;
  }
  
  this.aiGenerated.regenerationCount += 1;
  
  // Log activity
  this.logActivity(this.owner, 'ai_regenerated', {
    contentType: contentType,
    regenerationCount: this.aiGenerated.regenerationCount
  });
  
  return this.save();
};

TripSchema.methods.addBooking = function(bookingData, bookedBy) {
  const booking = {
    ...bookingData,
    bookedBy,
    bookedAt: new Date()
  };
  
  this.bookings.push(booking);
  
  // Update budget spent
  const category = this.mapBookingTypeToCategory(bookingData.type);
  if (category && this.budget.spent[category] !== undefined) {
    this.budget.spent[category] += bookingData.cost.amount;
    const totalSpent = (this.budget.spent.accommodation || 0) +
                      (this.budget.spent.transportation || 0) +
                      (this.budget.spent.food || 0) +
                      (this.budget.spent.activities || 0) +
                      (this.budget.spent.shopping || 0) +
                      (this.budget.spent.miscellaneous || 0);
    this.budget.remaining = Math.max(0, this.budget.total - totalSpent);
    this.budget.lastUpdated = new Date();
  }
  
  // Log activity
  this.logActivity(bookedBy, 'booking_made', {
    type: bookingData.type,
    provider: bookingData.provider,
    cost: bookingData.cost.amount,
    currency: bookingData.cost.currency
  });
  
  return this.save();
};

TripSchema.methods.mapBookingTypeToCategory = function(bookingType) {
  const mapping = {
    'hotel': 'accommodation',
    'flight': 'transportation',
    'transport': 'transportation',
    'activity': 'activities',
    'tour': 'activities',
    'restaurant': 'food',
    'rental': 'miscellaneous'
  };
  
  return mapping[bookingType] || 'miscellaneous';
};

TripSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.lastModifiedBy = userId;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  // Log activity
  this.logActivity(userId, 'status_changed', {
    oldStatus: oldStatus,
    newStatus: newStatus
  });
  
  return this.save();
};

TripSchema.methods.archive = function(userId) {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.lastModifiedBy = userId;
  
  // Log activity
  this.logActivity(userId, 'trip_archived', {});
  
  return this.save();
};

TripSchema.methods.getPublicData = function() {
  if (this.visibility === 'private') {
    return null;
  }
  
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    destination: this.destination,
    dates: this.dates,
    duration: this.duration,
    totalTravelers: this.totalTravelers,
    tags: this.tags,
    status: this.status,
    createdAt: this.createdAt,
    owner: this.owner // Will be populated with public profile data
  };
};

TripSchema.methods.getCollaboratorData = function(userId) {
  const collaborator = this.collaborators.find(c => 
    c.userId.toString() === userId.toString() && c.status === 'accepted'
  );
  
  if (!collaborator) {
    return this.getPublicData();
  }
  
  // Return data based on permissions
  const data = this.toObject();
  
  if (!collaborator.permissions.includes('view_budget')) {
    delete data.budget;
  }
  
  if (!collaborator.permissions.includes('view_bookings')) {
    delete data.bookings;
  }
  
  return data;
};

// Static methods
TripSchema.statics.findByOwner = function(ownerId, options = {}) {
  const query = { owner: ownerId, isArchived: false };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .populate('owner', 'profile.displayName profile.photoURL')
    .populate('collaborators.userId', 'profile.displayName profile.photoURL');
};

TripSchema.statics.findByCollaborator = function(userId, options = {}) {
  const query = {
    'collaborators.userId': userId,
    'collaborators.status': 'accepted',
    isArchived: false
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .populate('owner', 'profile.displayName profile.photoURL')
    .populate('collaborators.userId', 'profile.displayName profile.photoURL');
};

TripSchema.statics.searchTrips = function(query, userId, options = {}) {
  const searchQuery = {
    $and: [
      {
        $or: [
          { owner: userId },
          { 'collaborators.userId': userId, 'collaborators.status': 'accepted' }
        ]
      },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'destination.name': { $regex: query, $options: 'i' } },
          { 'destination.country': { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      },
      { isArchived: false }
    ]
  };
  
  return this.find(searchQuery)
    .sort({ updatedAt: -1 })
    .limit(options.limit || 20)
    .populate('owner', 'profile.displayName profile.photoURL');
};

TripSchema.statics.getUpcomingTrips = function(userId, limit = 10) {
  return this.find({
    $or: [
      { owner: userId },
      { 'collaborators.userId': userId, 'collaborators.status': 'accepted' }
    ],
    'dates.start': { $gte: new Date() },
    status: { $in: ['planning', 'booked'] },
    isArchived: false
  })
  .sort({ 'dates.start': 1 })
  .limit(limit)
  .populate('owner', 'profile.displayName profile.photoURL');
};

TripSchema.statics.getTripStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { owner: new mongoose.Types.ObjectId(userId) },
          { 'collaborators.userId': new mongoose.Types.ObjectId(userId), 'collaborators.status': 'accepted' }
        ],
        isArchived: false
      }
    },
    {
      $group: {
        _id: null,
        totalTrips: { $sum: 1 },
        completedTrips: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        upcomingTrips: { $sum: { $cond: [{ $gte: ['$dates.start', new Date()] }, 1, 0] } },
        totalBudget: { $sum: '$budget.total' },
        totalSpent: {
          $sum: {
            $add: [
              '$budget.spent.accommodation',
              '$budget.spent.transportation',
              '$budget.spent.food',
              '$budget.spent.activities',
              '$budget.spent.shopping',
              '$budget.spent.miscellaneous'
            ]
          }
        },
        averageDuration: { $avg: { $divide: [{ $subtract: ['$dates.end', '$dates.start'] }, 86400000] } }
      }
    }
  ]);
};

// Pre-save middleware
TripSchema.pre('save', function(next) {
  // Ensure owner is always in collaborators
  const ownerCollaborator = this.collaborators.find(c => 
    c.userId.toString() === this.owner.toString()
  );
  
  if (!ownerCollaborator) {
    this.collaborators.unshift({
      userId: this.owner,
      role: 'owner',
      invitedBy: this.owner,
      status: 'accepted',
      acceptedAt: new Date()
    });
  }
  
  // Update budget remaining
  const totalSpent = (this.budget.spent.accommodation || 0) +
                    (this.budget.spent.transportation || 0) +
                    (this.budget.spent.food || 0) +
                    (this.budget.spent.activities || 0) +
                    (this.budget.spent.shopping || 0) +
                    (this.budget.spent.miscellaneous || 0);
  this.budget.remaining = Math.max(0, this.budget.total - totalSpent);
  
  // Validate dates
  if (this.dates.end <= this.dates.start) {
    return next(new Error('End date must be after start date'));
  }
  
  // Update last modified
  this.lastModifiedBy = this.lastModifiedBy || this.owner;
  
  next();
});

// Post-save middleware
TripSchema.post('save', function(doc) {
  // Log trip activity for analytics
  console.log(`Trip ${doc.title} (${doc._id}) updated by ${doc.lastModifiedBy}`);
});

// Pre-remove middleware
TripSchema.pre('remove', function(next) {
  // Log trip deletion
  console.log(`Preparing to delete trip: ${this.title} (${this._id})`);
  
  // Here you could add cleanup logic for related data
  // such as removing trip references from user profiles
  
  next();
});

// Create and export the model
const Trip = mongoose.model('Trip', TripSchema);

module.exports = Trip;