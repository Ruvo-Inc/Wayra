const mongoose = require('mongoose');

// Valid file extensions from reference implementation
const VALID_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp4', '.mov', '.avi', '.mkv',
  '.mp3', '.wav', '.flac', '.ogg', '.m4a', '.wma', '.aac', '.opus',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.zst', '.lz4', '.lzma', '.lzo', '.z',
  '.tar.gz', '.tar.bz2', '.tar.xz', '.tar.zst', '.tar.lz4', '.tar.lzma', '.tar.lzo', '.tar.z',
  '.gpx', '.md'
];

const attachmentSchema = new mongoose.Schema({
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
  fileUrl: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  originalName: {
    type: String,
    required: false,
    trim: true
  },
  fileSize: {
    type: Number,
    required: false
  },
  mimeType: {
    type: String,
    required: false
  },
  extension: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Compound indexes
attachmentSchema.index({ adventureId: 1, createdAt: -1 });
attachmentSchema.index({ userId: 1, createdAt: -1 });

// Pre-save validation
attachmentSchema.pre('save', function(next) {
  // Validate file extension if provided
  if (this.extension && !VALID_EXTENSIONS.includes(this.extension.toLowerCase())) {
    const error = new Error(`Unsupported file extension: ${this.extension}`);
    return next(error);
  }
  
  // Extract extension from originalName if not provided
  if (!this.extension && this.originalName) {
    const ext = this.originalName.substring(this.originalName.lastIndexOf('.'));
    if (ext) {
      this.extension = ext.toLowerCase();
      // Validate extracted extension
      if (!VALID_EXTENSIONS.includes(this.extension)) {
        const error = new Error(`Unsupported file extension: ${this.extension}`);
        return next(error);
      }
    }
  }
  
  // Set name from originalName if not provided
  if (!this.name && this.originalName) {
    this.name = this.originalName;
  }
  
  next();
});

// Instance methods
attachmentSchema.methods.toJSON = function() {
  const attachment = this.toObject();
  return {
    id: attachment._id,
    adventureId: attachment.adventureId,
    userId: attachment.userId,
    url: attachment.fileUrl,
    name: attachment.name,
    originalName: attachment.originalName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    extension: attachment.extension,
    type: attachment.mimeType || 'application/octet-stream',
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt
  };
};

attachmentSchema.methods.getFileType = function() {
  if (this.mimeType) {
    if (this.mimeType.startsWith('image/')) return 'image';
    if (this.mimeType.startsWith('video/')) return 'video';
    if (this.mimeType.startsWith('audio/')) return 'audio';
    if (this.mimeType === 'application/pdf') return 'pdf';
    if (this.mimeType.includes('document') || this.mimeType.includes('word')) return 'document';
    if (this.mimeType.includes('spreadsheet') || this.mimeType.includes('excel')) return 'spreadsheet';
    if (this.mimeType.includes('presentation') || this.mimeType.includes('powerpoint')) return 'presentation';
    if (this.mimeType.includes('zip') || this.mimeType.includes('archive')) return 'archive';
  }
  
  if (this.extension) {
    const ext = this.extension.toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) return 'image';
    if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) return 'video';
    if (['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.wma', '.aac', '.opus'].includes(ext)) return 'audio';
    if (ext === '.pdf') return 'pdf';
    if (['.doc', '.docx', '.txt', '.md'].includes(ext)) return 'document';
    if (['.xls', '.xlsx'].includes(ext)) return 'spreadsheet';
    if (['.ppt', '.pptx'].includes(ext)) return 'presentation';
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
    if (ext === '.gpx') return 'gps';
  }
  
  return 'file';
};

attachmentSchema.methods.getFormattedSize = function() {
  if (!this.fileSize) return 'Unknown size';
  
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Static methods
attachmentSchema.statics.findByAdventure = function(adventureId) {
  return this.find({ adventureId }).sort({ createdAt: -1 });
};

attachmentSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adventureId', 'name location');
};

attachmentSchema.statics.findByType = function(adventureId, fileType) {
  return this.find({ adventureId }).then(attachments => {
    return attachments.filter(attachment => attachment.getFileType() === fileType);
  });
};

attachmentSchema.statics.getValidExtensions = function() {
  return VALID_EXTENSIONS;
};

module.exports = mongoose.model('Attachment', attachmentSchema);
