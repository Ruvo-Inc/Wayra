const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const checklistSchema = new mongoose.Schema({
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
  items: [checklistItemSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes
checklistSchema.index({ collectionId: 1, order: 1 });
checklistSchema.index({ userId: 1, createdAt: -1 });

// Pre-save validation
checklistSchema.pre('save', async function(next) {
  try {
    // Validate collection relationship and permissions
    if (this.collectionId) {
      const Collection = mongoose.model('Collection');
      const collection = await Collection.findById(this.collectionId);
      
      if (!collection) {
        const error = new Error('Associated collection not found');
        return next(error);
      }
      
      // Check if collection is public but checklist is not
      if (collection.isPublic && !this.isPublic) {
        const error = new Error(`Checklist associated with public collection must be public. Collection: ${collection.name}, Checklist: ${this.name}`);
        return next(error);
      }
      
      // Check if user owns the collection
      if (collection.userId !== this.userId) {
        const error = new Error(`Checklist must be associated with collections owned by the same user. Collection owner: ${collection.userId}, Checklist owner: ${this.userId}`);
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
checklistSchema.methods.toJSON = function() {
  const checklist = this.toObject();
  return {
    id: checklist._id,
    collectionId: checklist.collectionId,
    userId: checklist.userId,
    name: checklist.name,
    description: checklist.description,
    items: checklist.items.map(item => ({
      id: item._id,
      text: item.text,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt,
      order: item.order,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    isPublic: checklist.isPublic,
    order: checklist.order,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt
  };
};

checklistSchema.methods.getCompletionStats = function() {
  const totalItems = this.items.length;
  const completedItems = this.items.filter(item => item.isCompleted).length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  return {
    totalItems,
    completedItems,
    remainingItems: totalItems - completedItems,
    completionPercentage,
    isFullyCompleted: completedItems === totalItems && totalItems > 0
  };
};

checklistSchema.methods.addItem = function(text, order) {
  const newItem = {
    text: text.trim(),
    isCompleted: false,
    order: order !== undefined ? order : this.items.length
  };
  
  this.items.push(newItem);
  return this.save();
};

checklistSchema.methods.toggleItem = function(itemId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Checklist item not found');
  }
  
  item.isCompleted = !item.isCompleted;
  item.completedAt = item.isCompleted ? new Date() : null;
  
  return this.save();
};

checklistSchema.methods.updateItem = function(itemId, updates) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Checklist item not found');
  }
  
  Object.assign(item, updates);
  return this.save();
};

checklistSchema.methods.removeItem = function(itemId) {
  this.items.id(itemId).remove();
  return this.save();
};

checklistSchema.methods.reorderItems = function(itemIds) {
  itemIds.forEach((itemId, index) => {
    const item = this.items.id(itemId);
    if (item) {
      item.order = index;
    }
  });
  
  // Sort items by order
  this.items.sort((a, b) => a.order - b.order);
  return this.save();
};

// Static methods
checklistSchema.statics.findByCollection = function(collectionId) {
  return this.find({ collectionId }).sort({ order: 1, createdAt: 1 });
};

checklistSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('collectionId', 'name');
};

checklistSchema.statics.getCompletionStatsForCollection = async function(collectionId) {
  const checklists = await this.find({ collectionId });
  
  let totalItems = 0;
  let completedItems = 0;
  
  checklists.forEach(checklist => {
    totalItems += checklist.items.length;
    completedItems += checklist.items.filter(item => item.isCompleted).length;
  });
  
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  return {
    totalChecklists: checklists.length,
    totalItems,
    completedItems,
    remainingItems: totalItems - completedItems,
    completionPercentage,
    isFullyCompleted: completedItems === totalItems && totalItems > 0
  };
};

checklistSchema.statics.reorderChecklists = async function(collectionId, checklistIds) {
  const updates = checklistIds.map((checklistId, index) => ({
    updateOne: {
      filter: { _id: checklistId, collectionId },
      update: { order: index }
    }
  }));
  
  return this.bulkWrite(updates);
};

module.exports = mongoose.model('Checklist', checklistSchema);
