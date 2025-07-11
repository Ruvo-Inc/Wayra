'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Layers } from 'lucide-react';

interface TripLocation {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'activity';
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  date: string;
  price?: number;
}

interface TripMapProps {
  tripId: string;
  locations: TripLocation[];
}

const TripMap: React.FC<TripMapProps> = ({ tripId, locations }) => {
  const [selectedLocation, setSelectedLocation] = useState<TripLocation | null>(null);
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  // Sample locations for demo - in real app, this would come from trip data
  const sampleLocations: TripLocation[] = [
    {
      id: '1',
      name: 'JFK Airport',
      type: 'flight',
      coordinates: { lat: 40.6413, lng: -73.7781 },
      address: 'Queens, NY 11430, USA',
      date: '2024-08-15',
      price: 450
    },
    {
      id: '2',
      name: 'Hotel Manhattan',
      type: 'hotel',
      coordinates: { lat: 40.7580, lng: -73.9855 },
      address: 'Times Square, New York, NY',
      date: '2024-08-15',
      price: 200
    },
    {
      id: '3',
      name: 'Statue of Liberty',
      type: 'activity',
      coordinates: { lat: 40.6892, lng: -74.0445 },
      address: 'Liberty Island, New York, NY',
      date: '2024-08-16',
      price: 75
    },
    {
      id: '4',
      name: 'Central Park',
      type: 'activity',
      coordinates: { lat: 40.7829, lng: -73.9654 },
      address: 'New York, NY',
      date: '2024-08-17'
    }
  ];

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      default: return '📍';
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'flight': return 'bg-blue-500';
      case 'hotel': return 'bg-green-500';
      case 'activity': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate center point of all locations
  const centerLat = sampleLocations.reduce((sum, loc) => sum + loc.coordinates.lat, 0) / sampleLocations.length;
  const centerLng = sampleLocations.reduce((sum, loc) => sum + loc.coordinates.lng, 0) / sampleLocations.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Trip Map</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMapStyle('roadmap')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mapStyle === 'roadmap' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Road
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                mapStyle === 'satellite' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Satellite
            </button>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-96 bg-gray-100">
        {/* Placeholder for Google Maps - would be replaced with actual Google Maps component */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg font-medium text-gray-700 mb-2">Interactive Trip Map</p>
            <p className="text-sm text-gray-500 mb-4">
              Google Maps integration would display here<br />
              Showing {sampleLocations.length} trip locations
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Navigation className="w-4 h-4" />
              <span>Center: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Location Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {sampleLocations.map((location, index) => (
            <div
              key={location.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div
                className={`w-8 h-8 rounded-full ${getLocationColor(location.type)} flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => setSelectedLocation(location)}
              >
                {index + 1}
              </div>
              {selectedLocation?.id === location.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-lg border p-3 z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getLocationIcon(location.type)}</span>
                    <h3 className="font-medium text-gray-900">{location.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{location.address}</p>
                  <p className="text-sm text-gray-500 mb-2">{location.date}</p>
                  {location.price && (
                    <p className="text-sm font-medium text-green-600">${location.price}</p>
                  )}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Location List */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Trip Locations</h3>
        <div className="space-y-2">
          {sampleLocations.map((location, index) => (
            <div
              key={location.id}
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                selectedLocation?.id === location.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedLocation(location)}
            >
              <div className={`w-6 h-6 rounded-full ${getLocationColor(location.type)} flex items-center justify-center text-white text-xs font-bold`}>
                {index + 1}
              </div>
              <span className="text-lg">{getLocationIcon(location.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{location.name}</p>
                <p className="text-sm text-gray-500 truncate">{location.address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{location.date}</p>
                {location.price && (
                  <p className="text-sm font-medium text-green-600">${location.price}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Instructions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Map Integration Ready</p>
            <p>To enable live Google Maps, add your Google Maps API key to the environment variables and install @react-google-maps/api package.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMap;
