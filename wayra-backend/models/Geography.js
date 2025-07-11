const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  countryCode: {
    type: String,
    required: true,
    unique: true,
    length: 2,
    uppercase: true
  },
  subregion: String,
  capital: String,
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  flagUrl: String,
  population: Number,
  area: Number, // in square kilometers
  currency: String,
  languages: [String],
  timezone: String
}, {
  timestamps: true
});

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  countryCode: {
    type: String,
    required: true,
    length: 2,
    uppercase: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  population: Number,
  area: Number
}, {
  timestamps: true
});

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  population: Number,
  timezone: String,
  isCapital: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const visitedCountrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  firstVisitDate: Date,
  lastVisitDate: Date,
  visitCount: {
    type: Number,
    default: 1
  },
  adventures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure'
  }]
}, {
  timestamps: true
});

const visitedRegionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  firstVisitDate: Date,
  lastVisitDate: Date,
  visitCount: {
    type: Number,
    default: 1
  },
  adventures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure'
  }]
}, {
  timestamps: true
});

const visitedCitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  firstVisitDate: Date,
  lastVisitDate: Date,
  visitCount: {
    type: Number,
    default: 1
  },
  adventures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adventure'
  }]
}, {
  timestamps: true
});

// Indexes for geographic data
countrySchema.index({ coordinates: '2dsphere' });
countrySchema.index({ countryCode: 1 });
countrySchema.index({ name: 1 });

regionSchema.index({ coordinates: '2dsphere' });
regionSchema.index({ country: 1 });
regionSchema.index({ countryCode: 1 });

citySchema.index({ coordinates: '2dsphere' });
citySchema.index({ region: 1 });
citySchema.index({ country: 1 });

// Indexes for visited data
visitedCountrySchema.index({ userId: 1, country: 1 }, { unique: true });
visitedRegionSchema.index({ userId: 1, region: 1 }, { unique: true });
visitedCitySchema.index({ userId: 1, city: 1 }, { unique: true });

// Virtual for getting latitude/longitude
countrySchema.virtual('latitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[1] : null;
});

countrySchema.virtual('longitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[0] : null;
});

regionSchema.virtual('latitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[1] : null;
});

regionSchema.virtual('longitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[0] : null;
});

citySchema.virtual('latitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[1] : null;
});

citySchema.virtual('longitude').get(function() {
  return this.coordinates && this.coordinates.coordinates ? this.coordinates.coordinates[0] : null;
});

// Static methods for geographic queries
countrySchema.statics.findNearby = function(longitude, latitude, maxDistance = 100000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

regionSchema.statics.findNearby = function(longitude, latitude, maxDistance = 50000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

citySchema.statics.findNearby = function(longitude, latitude, maxDistance = 25000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Static method to get user's travel statistics
visitedCountrySchema.statics.getUserTravelStats = async function(userId) {
  const [countryStats, regionStats, cityStats] = await Promise.all([
    this.countDocuments({ userId }),
    mongoose.model('VisitedRegion').countDocuments({ userId }),
    mongoose.model('VisitedCity').countDocuments({ userId })
  ]);

  const totalCountries = await mongoose.model('Country').countDocuments();
  const totalRegions = await mongoose.model('Region').countDocuments();
  const totalCities = await mongoose.model('City').countDocuments();

  return {
    visitedCountries: countryStats,
    visitedRegions: regionStats,
    visitedCities: cityStats,
    totalCountries,
    totalRegions,
    totalCities,
    countryPercentage: totalCountries > 0 ? (countryStats / totalCountries * 100).toFixed(2) : 0,
    regionPercentage: totalRegions > 0 ? (regionStats / totalRegions * 100).toFixed(2) : 0,
    cityPercentage: totalCities > 0 ? (cityStats / totalCities * 100).toFixed(2) : 0
  };
};

// Method to record visit
visitedCountrySchema.statics.recordVisit = async function(userId, countryId, adventureId, visitDate = new Date()) {
  const visited = await this.findOneAndUpdate(
    { userId, country: countryId },
    {
      $inc: { visitCount: 1 },
      $addToSet: { adventures: adventureId },
      $min: { firstVisitDate: visitDate },
      $max: { lastVisitDate: visitDate }
    },
    { upsert: true, new: true }
  );
  return visited;
};

visitedRegionSchema.statics.recordVisit = async function(userId, regionId, countryId, adventureId, visitDate = new Date()) {
  const visited = await this.findOneAndUpdate(
    { userId, region: regionId },
    {
      $inc: { visitCount: 1 },
      $addToSet: { adventures: adventureId },
      $min: { firstVisitDate: visitDate },
      $max: { lastVisitDate: visitDate },
      $setOnInsert: { country: countryId }
    },
    { upsert: true, new: true }
  );
  return visited;
};

visitedCitySchema.statics.recordVisit = async function(userId, cityId, regionId, countryId, adventureId, visitDate = new Date()) {
  const visited = await this.findOneAndUpdate(
    { userId, city: cityId },
    {
      $inc: { visitCount: 1 },
      $addToSet: { adventures: adventureId },
      $min: { firstVisitDate: visitDate },
      $max: { lastVisitDate: visitDate },
      $setOnInsert: { region: regionId, country: countryId }
    },
    { upsert: true, new: true }
  );
  return visited;
};

const Country = mongoose.model('Country', countrySchema);
const Region = mongoose.model('Region', regionSchema);
const City = mongoose.model('City', citySchema);
const VisitedCountry = mongoose.model('VisitedCountry', visitedCountrySchema);
const VisitedRegion = mongoose.model('VisitedRegion', visitedRegionSchema);
const VisitedCity = mongoose.model('VisitedCity', visitedCitySchema);

module.exports = {
  Country,
  Region,
  City,
  VisitedCountry,
  VisitedRegion,
  VisitedCity
};

