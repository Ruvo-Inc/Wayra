// Adventure Types
export const ACTIVITY_TYPES = [
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
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number]['name'];

export interface AdventureCategory {
  name: string;
  displayName: string;
  icon: string;
}

export interface AdventureCoordinates {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface AdventureVisit {
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export interface AdventureImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  filename: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  adventureId: string;
  date: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  adventureId: string;
  filename: string;
  url: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export interface AdventureAttachment {
  url: string;
  name: string;
  type: string;
}

export interface Adventure {
  id: string;
  _id?: string; // MongoDB document ID
  userId: string;
  tripId?: string;
  name: string;
  location?: string;
  activityTypes: string[];
  description?: string;
  rating?: number;
  link?: string;
  coordinates?: AdventureCoordinates;
  latitude?: number;
  longitude?: number;
  category: AdventureCategory;
  isPublic: boolean;
  collections: string[];
  isVisited: boolean;
  visits: AdventureVisit[];
  images: AdventureImage[];
  attachments: AdventureAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  _id: string;
  id?: string; // Optional for backward compatibility
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  startDate?: string | null;
  endDate?: string | null;
  isArchived: boolean;
  link?: string;
  adventures: string[];
  sharedWith: string[];
  tags: string[];
  collaborators: Array<{
    userId: string;
    role: 'viewer' | 'editor';
    addedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdventureFormData {
  name: string;
  location?: string;
  activityTypes: string[];
  description?: string;
  rating?: number;
  link?: string;
  latitude?: number;
  longitude?: number;
  category: {
    name: string;
    displayName: string;
    icon?: string;
  };
  isPublic: boolean;
  isVisited: boolean;
}

export interface CollectionFormData {
  name: string;
  description?: string;
  isPublic: boolean;
  startDate?: string | null;
  endDate?: string | null;
  link?: string;
  tags: string[];
}

export interface AdventureFilters {
  search?: string;
  category?: string;
  isPublic?: boolean;
  isVisited?: boolean;
  rating?: number;
  startDate?: string;
  endDate?: string;
}

export interface CollectionFilters {
  search?: string;
  isPublic?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface AdventureStats {
  totalAdventures: number;
  visitedAdventures: number;
  plannedAdventures: number;
  uniqueCountries: number;
  averageRating: number;
}

export interface CollectionStats {
  totalCollections: number;
  publicCollections: number;
  sharedCollections: number;
  totalAdventures: number;
  averageDuration: number;
}

// Collection Types
export interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car' | 'boat' | 'other';
  name: string;
  description?: string;
  rating?: number;
  link?: string;
  flightNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  originCoordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  destinationCoordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  departureDate?: string;
  arrivalDate?: string;
  startTimezone?: string;
  endTimezone?: string;
  isPublic: boolean;
}

export interface CollectionNote {
  id: string;
  name: string;
  content?: string;
  links: string[];
  date?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface Collaborator {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  addedAt: string;
}

// Geography Types
export interface Country {
  id: string;
  name: string;
  countryCode: string;
  subregion?: string;
  capital?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  flagUrl?: string;
  population?: number;
  area?: number;
  currency?: string;
  languages: string[];
  timezone?: string;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  population?: number;
  area?: number;
}

export interface City {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  population?: number;
  timezone?: string;
  isCapital: boolean;
}

export interface VisitedCountry {
  id: string;
  userId: string;
  country: Country;
  firstVisitDate?: string;
  lastVisitDate?: string;
  visitCount: number;
  adventures: string[];
}

export interface VisitedRegion {
  id: string;
  userId: string;
  region: Region;
  country: Country;
  firstVisitDate?: string;
  lastVisitDate?: string;
  visitCount: number;
  adventures: string[];
}

export interface VisitedCity {
  id: string;
  userId: string;
  city: City;
  region: Region;
  country: Country;
  firstVisitDate?: string;
  lastVisitDate?: string;
  visitCount: number;
  adventures: string[];
}

// User Types
export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  username: string;
  profilePic?: string;
  createdAt: string;
  updatedAt: string;
}

// Statistics Types
export interface AdventureStats {
  totalAdventures: number;
  visitedAdventures: number;
  plannedAdventures: number;
  publicAdventures: number;
  averageRating: number;
  totalImages: number;
  categoriesUsed: string[];
  activityTypesUsed: string[];
}

export interface TravelStats {
  visitedCountries: number;
  visitedRegions: number;
  visitedCities: number;
  totalCountries: number;
  totalRegions: number;
  totalCities: number;
  countryPercentage: string;
  regionPercentage: string;
  cityPercentage: string;
}

export interface ContinentStats {
  name: string;
  countries: number;
  adventures: number;
}

export interface MonthlyStats {
  [month: string]: number;
}

export interface RecentVisit {
  country?: Country;
  region?: Region;
  city?: City;
  visitDate?: string;
  adventureCount: number;
}

export interface GeographicStats extends TravelStats {
  continentStats: ContinentStats[];
  monthlyStats: MonthlyStats;
  recentVisits: {
    countries: RecentVisit[];
    regions: RecentVisit[];
    cities: RecentVisit[];
  };
}

// API Response Types
export interface AdventureListResponse {
  adventures: Adventure[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface CollectionListResponse {
  collections: Collection[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface CountryListResponse {
  countries: (Country & {
    isVisited: boolean;
    visitCount: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    adventureCount: number;
  })[];
  total: number;
}

export interface RegionListResponse {
  country: Country;
  regions: (Region & {
    isVisited: boolean;
    visitCount: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    adventureCount: number;
  })[];
  total: number;
}

export interface CityListResponse {
  region: Region;
  cities: (City & {
    isVisited: boolean;
    visitCount: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    adventureCount: number;
  })[];
  total: number;
}

export interface GeocodeResponse {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  countries: Country[];
  regions: Region[];
  cities: City[];
  primaryCountry?: Country;
  primaryRegion?: Region;
  primaryCity?: City;
}

export interface MapData {
  visitedCountries: Array<{
    country: Country;
    visitCount: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    adventureCount: number;
  }>;
  visitedRegions: Array<{
    region: Region;
    country: Country;
    visitCount: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    adventureCount: number;
  }>;
  visitedCities: Array<{
    city: City;
    region: Region;
    country: Country;
    visitCount: number;
    firstVisitDate?: string;
    lastVisitDate?: string;
    adventureCount: number;
  }>;
  adventures: Adventure[];
}

// Form Types
export interface AdventureFormData {
  name: string;
  location?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  category: {
    name: string;
    displayName: string;
    icon?: string;
  };
  activityTypes: string[];
  rating?: number;
  link?: string;
  isVisited: boolean;
  isPublic: boolean;
  tripId?: string;
}



export interface TransportationFormData {
  type: 'flight' | 'train' | 'bus' | 'car' | 'boat' | 'other';
  name: string;
  description?: string;
  rating?: number;
  link?: string;
  flightNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  departureDate?: string;
  arrivalDate?: string;
  startTimezone?: string;
  endTimezone?: string;
  isPublic: boolean;
}

// Filter Types
export interface AdventureFilters {
  search?: string;
  category?: string;
  activityType?: string;
  isVisited?: boolean;
  isPublic?: boolean;
  tripId?: string;
  sortBy?: 'createdAt' | 'name' | 'rating' | 'visitDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CollectionFilters {
  search?: string;
  isPublic?: boolean;
  isArchived?: boolean;
  tripId?: string;
  sortBy?: 'createdAt' | 'name' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

export interface GeographyFilters {
  search?: string;
  visited?: boolean;
  type?: 'countries' | 'regions' | 'cities';
}

// Additional Constants
export const TRANSPORTATION_TYPES = [
  'flight',
  'train',
  'bus',
  'car',
  'boat',
  'other'
] as const;

export const COLLABORATOR_ROLES = [
  'viewer',
  'editor',
  'admin'
] as const;

export type TransportationType = typeof TRANSPORTATION_TYPES[number];
export type CollaboratorRole = typeof COLLABORATOR_ROLES[number];

