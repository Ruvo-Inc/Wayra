/**
 * Unified Travel Plan Model
 * 
 * This model integrates travel planning data from all three AI repositories
 * into a single, comprehensive data structure that supports:
 * - Multi-agent AI planning
 * - Collaborative editing
 * - Conversational interactions
 * - Budget optimization
 * - Itinerary generation
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UnifiedTravelPlanSchema = new Schema({
  // Basic plan information
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Collaborative information
  collaborators: [{
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    role: { 
      type: String, 
      enum: ['owner', 'editor', 'viewer'], 
      default: 'editor' 
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
    lastActive: { 
      type: Date 
    }
  }],
  
  // Travel details
  destinations: [{
    location: {
      name: { 
        type: String, 
        required: true 
      },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      country: { type: String },
      region: { type: String },
      placeId: { type: String } // Google Places ID
    },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String },
    weather: {
      forecast: [{
        date: { type: Date },
        temperature: {
          min: { type: Number },
          max: { type: Number },
          unit: { type: String, default: 'celsius' }
        },
        conditions: { type: String },
        precipitation: { type: Number },
        humidity: { type: Number },
        windSpeed: { type: Number }
      }],
      lastUpdated: { type: Date }
    },
    travelAdvisories: [{
      source: { type: String },
      level: { type: String },
      description: { type: String },
      lastUpdated: { type: Date }
    }]
  }],
  
  // Budget information
  budget: {
    total: { type: Number },
    currency: { type: String, default: 'USD' },
    categories: [{
      name: { type: String },
      amount: { type: Number },
      notes: { type: String },
      items: [{
        description: { type: String },
        amount: { type: Number },
        date: { type: Date },
        paid: { type: Boolean, default: false },
        category: { type: String }
      }]
    }],
    tracking: {
      spent: { type: Number, default: 0 },
      remaining: { type: Number },
      alerts: [{
        type: { type: String, enum: ['over_budget', 'approaching_limit', 'price_drop'] },
        message: { type: String },
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
      }]
    },
    optimization: {
      suggestions: [{
        type: { type: String, enum: ['flight', 'accommodation', 'activity', 'transportation'] },
        originalPrice: { type: Number },
        suggestedPrice: { type: Number },
        saving: { type: Number },
        description: { type: String },
        link: { type: String },
        expiresAt: { type: Date },
        applied: { type: Boolean, default: false }
      }],
      lastUpdated: { type: Date }
    }
  },
  
  // Itinerary
  itinerary: [{
    day: { type: Number, required: true },
    date: { type: Date },
    location: { type: String },
    activities: [{
      title: { type: String, required: true },
      description: { type: String },
      startTime: { type: String },
      endTime: { type: String },
      location: {
        name: { type: String },
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number }
        },
        placeId: { type: String } // Google Places ID
      },
      cost: { type: Number },
      category: { type: String, enum: ['accommodation', 'transportation', 'food', 'sightseeing', 'entertainment', 'other'] },
      reservationInfo: {
        confirmationNumber: { type: String },
        bookedThrough: { type: String },
        notes: { type: String }
      },
      weather: {
        temperature: { type: Number },
        conditions: { type: String }
      },
      aiGenerated: { type: Boolean, default: false },
      aiRating: { type: Number, min: 0, max: 10 } // AI-generated quality score
    }],
    notes: { type: String },
    accommodation: {
      name: { type: String },
      address: { type: String },
      checkIn: { type: String },
      checkOut: { type: String },
      confirmationNumber: { type: String },
      cost: { type: Number }
    },
    transportation: [{
      type: { type: String, enum: ['flight', 'train', 'bus', 'car', 'ferry', 'other'] },
      departureTime: { type: String },
      arrivalTime: { type: String },
      departureLocation: { type: String },
      arrivalLocation: { type: String },
      provider: { type: String },
      confirmationNumber: { type: String },
      cost: { type: Number }
    }]
  }],
  
  // AI assistance
  aiAssistance: {
    enabled: { type: Boolean, default: true },
    preferences: {
      travelStyle: { type: String, enum: ['luxury', 'budget', 'adventure', 'relaxation', 'cultural', 'family', 'solo'] },
      activityPreferences: [{ type: String }],
      dietaryRestrictions: [{ type: String }],
      accessibility: [{ type: String }]
    },
    conversations: [{
      timestamp: { type: Date, default: Date.now },
      message: { type: String },
      response: { type: String },
      intent: { type: String },
      actions: [{
        type: { type: String, enum: ['add_activity', 'modify_budget', 'update_itinerary', 'add_note', 'search_flights', 'search_accommodations'] },
        status: { type: String, enum: ['pending', 'completed', 'failed'] },
        details: { type: Schema.Types.Mixed }
      }]
    }],
    suggestions: [{
      type: { type: String, enum: ['destination', 'activity', 'accommodation', 'transportation', 'budget_optimization'] },
      content: { type: String },
      context: { type: String },
      accepted: { type: Boolean, default: null },
      createdAt: { type: Date, default: Date.now }
    }],
    agentActions: [{
      agentType: { type: String, enum: ['destination_expert', 'budget_optimizer', 'itinerary_planner', 'local_guide', 'weather_analyst'] },
      action: { type: String },
      result: { type: Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'completed', 'failed'] }
    }]
  },
  
  // Group coordination
  groupCoordination: {
    enabled: { type: Boolean, default: false },
    preferences: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      destinations: [{ type: String }],
      dates: [{
        startDate: { type: Date },
        endDate: { type: Date },
        flexibility: { type: Number } // Days of flexibility
      }],
      budget: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'USD' }
      },
      activities: [{ type: String }],
      mustHaves: [{ type: String }],
      cannotHaves: [{ type: String }]
    }],
    voting: [{
      item: { type: String },
      type: { type: String, enum: ['destination', 'date', 'accommodation', 'activity'] },
      votes: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        vote: { type: Number, min: 1, max: 5 }, // 1-5 rating
        comment: { type: String }
      }],
      status: { type: String, enum: ['open', 'closed'] },
      winner: { type: Boolean, default: false }
    }],
    conflicts: [{
      type: { type: String, enum: ['date', 'budget', 'destination', 'activity'] },
      description: { type: String },
      affectedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      resolutionOptions: [{
        description: { type: String },
        votes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      }],
      resolved: { type: Boolean, default: false },
      resolution: { type: String }
    }]
  },
  
  // Metadata
  metadata: {
    version: { type: Number, default: 1 },
    lastUpdated: { type: Date, default: Date.now },
    status: { type: String, enum: ['draft', 'planning', 'booked', 'in-progress', 'completed', 'archived'], default: 'draft' },
    visibility: { type: String, enum: ['private', 'shared', 'public'], default: 'private' },
    tags: [{ type: String }],
    source: { type: String, enum: ['user', 'ai', 'template'], default: 'user' },
    aiGenerationParams: { type: Schema.Types.Mixed }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
UnifiedTravelPlanSchema.index({ createdBy: 1 });
UnifiedTravelPlanSchema.index({ 'collaborators.userId': 1 });
UnifiedTravelPlanSchema.index({ 'metadata.status': 1 });
UnifiedTravelPlanSchema.index({ 'destinations.location.name': 'text', title: 'text', description: 'text' });

// Virtuals
UnifiedTravelPlanSchema.virtual('duration').get(function() {
  if (!this.itinerary || this.itinerary.length === 0) return 0;
  return this.itinerary.length;
});

UnifiedTravelPlanSchema.virtual('totalCost').get(function() {
  let total = 0;
  
  // Add activity costs
  if (this.itinerary) {
    this.itinerary.forEach(day => {
      if (day.activities) {
        day.activities.forEach(activity => {
          if (activity.cost) total += activity.cost;
        });
      }
      
      // Add accommodation cost
      if (day.accommodation && day.accommodation.cost) {
        total += day.accommodation.cost;
      }
      
      // Add transportation costs
      if (day.transportation) {
        day.transportation.forEach(transport => {
          if (transport.cost) total += transport.cost;
        });
      }
    });
  }
  
  return total;
});

// Methods
UnifiedTravelPlanSchema.methods.addActivity = function(dayIndex, activity) {
  if (!this.itinerary[dayIndex]) {
    throw new Error(`Day ${dayIndex} not found in itinerary`);
  }
  
  this.itinerary[dayIndex].activities.push(activity);
  this.metadata.lastUpdated = new Date();
  this.metadata.version += 1;
  return this.save();
};

UnifiedTravelPlanSchema.methods.updateBudget = function(budgetUpdate) {
  this.budget = { ...this.budget, ...budgetUpdate };
  this.metadata.lastUpdated = new Date();
  this.metadata.version += 1;
  return this.save();
};

UnifiedTravelPlanSchema.methods.addCollaborator = function(userId, role = 'editor') {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  
  if (existingCollaborator) {
    existingCollaborator.role = role;
    existingCollaborator.lastActive = new Date();
  } else {
    this.collaborators.push({
      userId,
      role,
      joinedAt: new Date(),
      lastActive: new Date()
    });
  }
  
  this.metadata.lastUpdated = new Date();
  this.metadata.version += 1;
  return this.save();
};

UnifiedTravelPlanSchema.methods.addAiSuggestion = function(type, content, context) {
  this.aiAssistance.suggestions.push({
    type,
    content,
    context,
    createdAt: new Date()
  });
  
  this.metadata.lastUpdated = new Date();
  this.metadata.version += 1;
  return this.save();
};

// Statics
UnifiedTravelPlanSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { 'collaborators.userId': userId }
    ]
  });
};

UnifiedTravelPlanSchema.statics.findActiveTrips = function(userId) {
  const now = new Date();
  
  return this.find({
    $or: [
      { createdBy: userId },
      { 'collaborators.userId': userId }
    ],
    'metadata.status': { $in: ['planning', 'booked', 'in-progress'] }
  });
};

// Create model
const UnifiedTravelPlan = mongoose.model('UnifiedTravelPlan', UnifiedTravelPlanSchema);

module.exports = UnifiedTravelPlan;

