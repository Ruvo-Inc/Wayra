const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: '🌍'
  }
}, {
  timestamps: true
});

// Compound index for uniqueness per user
categorySchema.index({ name: 1, userId: 1 }, { unique: true });

// Pre-save middleware to normalize name
categorySchema.pre('save', function(next) {
  if (this.name) {
    this.name = this.name.toLowerCase().trim();
  }
  next();
});

// Instance methods
categorySchema.methods.toJSON = function() {
  const category = this.toObject();
  return {
    id: category._id,
    userId: category.userId,
    name: category.name,
    displayName: category.displayName,
    icon: category.icon,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
};

// Static methods
categorySchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ displayName: 1 });
};

categorySchema.statics.findByNameAndUser = function(name, userId) {
  return this.findOne({ name: name.toLowerCase().trim(), userId });
};

categorySchema.statics.createDefault = async function(userId) {
  const defaultCategories = [
    { name: 'general', displayName: 'General 🌍', icon: '🌍' },
    { name: 'outdoor', displayName: 'Outdoor 🏞️', icon: '🏞️' },
    { name: 'lodging', displayName: 'Lodging 🛌', icon: '🛌' },
    { name: 'dining', displayName: 'Dining 🍽️', icon: '🍽️' },
    { name: 'activity', displayName: 'Activity 🏄', icon: '🏄' },
    { name: 'attraction', displayName: 'Attraction 🎢', icon: '🎢' },
    { name: 'shopping', displayName: 'Shopping 🛍️', icon: '🛍️' },
    { name: 'nightlife', displayName: 'Nightlife 🌃', icon: '🌃' },
    { name: 'event', displayName: 'Event 🎉', icon: '🎉' },
    { name: 'transportation', displayName: 'Transportation 🚗', icon: '🚗' },
    { name: 'culture', displayName: 'Culture 🎭', icon: '🎭' },
    { name: 'water_sports', displayName: 'Water Sports 🚤', icon: '🚤' },
    { name: 'hiking', displayName: 'Hiking 🥾', icon: '🥾' },
    { name: 'wildlife', displayName: 'Wildlife 🦒', icon: '🦒' },
    { name: 'historical_sites', displayName: 'Historical Sites 🏛️', icon: '🏛️' },
    { name: 'music_concerts', displayName: 'Music & Concerts 🎶', icon: '🎶' },
    { name: 'fitness', displayName: 'Fitness 🏋️', icon: '🏋️' },
    { name: 'art_museums', displayName: 'Art & Museums 🎨', icon: '🎨' },
    { name: 'festivals', displayName: 'Festivals 🎪', icon: '🎪' },
    { name: 'spiritual_journeys', displayName: 'Spiritual Journeys 🧘‍♀️', icon: '🧘‍♀️' },
    { name: 'volunteer_work', displayName: 'Volunteer Work 🤝', icon: '🤝' },
    { name: 'other', displayName: 'Other', icon: '📝' }
  ];

  const categories = [];
  for (const categoryData of defaultCategories) {
    try {
      const category = new this({
        userId,
        ...categoryData
      });
      await category.save();
      categories.push(category);
    } catch (error) {
      // Skip if category already exists
      if (error.code !== 11000) {
        throw error;
      }
    }
  }
  return categories;
};

module.exports = mongoose.model('Category', categorySchema);
