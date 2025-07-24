const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: false,
    trim: true
  },
  links: [{
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link must be a valid URL'
    }
  }],
  date: {
    type: Date,
    required: false
  },
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
noteSchema.index({ collectionId: 1, order: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });

// Pre-save validation
noteSchema.pre('save', async function(next) {
  try {
    // Validate collection relationship and permissions
    if (this.collectionId) {
      const Collection = mongoose.model('Collection');
      const collection = await Collection.findById(this.collectionId);
      
      if (!collection) {
        const error = new Error('Associated collection not found');
        return next(error);
      }
      
      // Check if collection is public but note is not
      if (collection.isPublic && !this.isPublic) {
        const error = new Error(`Note associated with public collection must be public. Collection: ${collection.name}, Note: ${this.name}`);
        return next(error);
      }
      
      // Check if user owns the collection
      if (collection.userId !== this.userId) {
        const error = new Error(`Note must be associated with collections owned by the same user. Collection owner: ${collection.userId}, Note owner: ${this.userId}`);
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
noteSchema.methods.toJSON = function() {
  const note = this.toObject();
  return {
    id: note._id,
    collectionId: note.collectionId,
    userId: note.userId,
    name: note.name,
    content: note.content,
    links: note.links,
    date: note.date,
    isPublic: note.isPublic,
    order: note.order,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
};

noteSchema.methods.getWordCount = function() {
  if (!this.content) return 0;
  return this.content.trim().split(/\s+/).length;
};

noteSchema.methods.getPreview = function(maxLength = 100) {
  if (!this.content) return '';
  return this.content.length > maxLength 
    ? this.content.substring(0, maxLength) + '...'
    : this.content;
};

// Static methods
noteSchema.statics.findByCollection = function(collectionId) {
  return this.find({ collectionId }).sort({ order: 1, createdAt: 1 });
};

noteSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('collectionId', 'name');
};

noteSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  const query = { userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  return this.find(query).sort({ date: -1 });
};

noteSchema.statics.reorderNotes = async function(collectionId, noteIds) {
  const updates = noteIds.map((noteId, index) => ({
    updateOne: {
      filter: { _id: noteId, collectionId },
      update: { order: index }
    }
  }));
  
  return this.bulkWrite(updates);
};

module.exports = mongoose.model('Note', noteSchema);
