const mongoose = require('mongoose');

const adventureImageSchema = new mongoose.Schema({
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
  imageUrl: {
    type: String,
    required: false
  },
  immichId: {
    type: String,
    required: false,
    trim: true
  },
  caption: {
    type: String,
    required: false,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  filename: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  mimeType: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Compound indexes
adventureImageSchema.index({ adventureId: 1, isPrimary: 1 });
adventureImageSchema.index({ userId: 1, createdAt: -1 });

// Pre-save validation
adventureImageSchema.pre('save', function(next) {
  // Ensure we have either imageUrl or immichId
  if (!this.imageUrl && !this.immichId) {
    const error = new Error('Either imageUrl or immichId must be provided');
    return next(error);
  }
  
  // Clean empty strings to null
  if (this.imageUrl && !this.imageUrl.trim()) {
    this.imageUrl = null;
  }
  if (this.immichId && !this.immichId.trim()) {
    this.immichId = null;
  }
  
  next();
});

// Pre-save middleware to ensure only one primary image per adventure
adventureImageSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary flag from other images for this adventure
    await this.constructor.updateMany(
      { 
        adventureId: this.adventureId, 
        _id: { $ne: this._id } 
      },
      { isPrimary: false }
    );
  }
  next();
});

// Instance methods
adventureImageSchema.methods.toJSON = function() {
  const image = this.toObject();
  return {
    id: image._id,
    adventureId: image.adventureId,
    userId: image.userId,
    url: image.imageUrl,
    immichId: image.immichId,
    caption: image.caption,
    isPrimary: image.isPrimary,
    filename: image.filename,
    fileSize: image.fileSize,
    mimeType: image.mimeType,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt
  };
};

adventureImageSchema.methods.getDisplayUrl = function() {
  return this.imageUrl || (this.immichId ? `/api/immich/${this.immichId}` : null);
};

// Static methods
adventureImageSchema.statics.findByAdventure = function(adventureId) {
  return this.find({ adventureId }).sort({ isPrimary: -1, createdAt: -1 });
};

adventureImageSchema.statics.findPrimaryByAdventure = function(adventureId) {
  return this.findOne({ adventureId, isPrimary: true });
};

adventureImageSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adventureId', 'name location');
};

adventureImageSchema.statics.setPrimary = async function(imageId, adventureId) {
  // Remove primary flag from all images for this adventure
  await this.updateMany(
    { adventureId },
    { isPrimary: false }
  );
  
  // Set this image as primary
  return this.findByIdAndUpdate(
    imageId,
    { isPrimary: true },
    { new: true }
  );
};

module.exports = mongoose.model('AdventureImage', adventureImageSchema);
