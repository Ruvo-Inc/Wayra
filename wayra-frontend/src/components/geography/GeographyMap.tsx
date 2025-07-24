'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Layers } from 'lucide-react';

interface GeographyLocation {
  id: string;
  name: string;
  type: 'country' | 'city';
  coordinates: {
    lat: number;
    lng: number;
  };
  adventureCount: number;
  visitCount: number;
}

interface GeographyMapProps {
  countries: Array<{
    name: string;
    code: string;
    adventureCount: number;
    visitCount: number;
  }>;
  cities: Array<{
    name: string;
    country: string;
    adventureCount: number;
    visitCount: number;
  }>;
}

const GeographyMap: React.FC<GeographyMapProps> = ({ countries, cities }) => {
  const [selectedLocation, setSelectedLocation] = useState<GeographyLocation | null>(null);
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isLoading, setIsLoading] = useState(true);

  // Convert countries and cities to map locations
  const mapLocations: GeographyLocation[] = [
    ...countries.map(country => ({
      id: `country-${country.code}`,
      name: country.name,
      type: 'country' as const,
      coordinates: getCountryCoordinates(country.code),
      adventureCount: country.adventureCount,
      visitCount: country.visitCount
    })),
    ...cities.map(city => ({
      id: `city-${city.name}`,
      name: city.name,
      type: 'city' as const,
      coordinates: getCityCoordinates(city.name, city.country),
      adventureCount: city.adventureCount,
      visitCount: city.visitCount
    }))
  ];

  // Simple coordinate mapping for common countries/cities
  function getCountryCoordinates(countryCode: string): { lat: number; lng: number } {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      'US': { lat: 39.8283, lng: -98.5795 },
      'CA': { lat: 56.1304, lng: -106.3468 },
      'GB': { lat: 55.3781, lng: -3.4360 },
      'FR': { lat: 46.6034, lng: 1.8883 },
      'DE': { lat: 51.1657, lng: 10.4515 },
      'IT': { lat: 41.8719, lng: 12.5674 },
      'ES': { lat: 40.4637, lng: -3.7492 },
      'JP': { lat: 36.2048, lng: 138.2529 },
      'AU': { lat: -25.2744, lng: 133.7751 },
      'BR': { lat: -14.2350, lng: -51.9253 },
      'IN': { lat: 20.5937, lng: 78.9629 },
      'CN': { lat: 35.8617, lng: 104.1954 }
    };
    return coordinates[countryCode] || { lat: 0, lng: 0 };
  }

  function getCityCoordinates(cityName: string, country: string): { lat: number; lng: number } {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      'New York': { lat: 40.7128, lng: -74.0060 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'San Francisco': { lat: 37.7749, lng: -122.4194 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
      'Berlin': { lat: 52.5200, lng: 13.4050 },
      'Rome': { lat: 41.9028, lng: 12.4964 },
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Vancouver': { lat: 49.2827, lng: -123.1207 }
    };
    return coordinates[cityName] || getCountryCoordinates(country.substring(0, 2).toUpperCase());
  }

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'country': return '🌍';
      case 'city': return '🏙️';
      default: return '📍';
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'country': return 'bg-blue-500';
      case 'city': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Geography Map</h2>
          </div>
        </div>
        <div className="h-96 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading your geography map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Geography Map</h2>
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
      <div className="relative h-96 bg-gradient-to-br from-blue-50 to-green-50">
        {/* World Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Globe className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Interactive Geography Map
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Showing {countries.length} countries and {cities.length} cities you've visited
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Countries</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Cities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {mapLocations.map((location, index) => (
            <div
              key={location.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${15 + (index * 8) % 70}%`,
                top: `${20 + (index * 12) % 60}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div
                className={`w-8 h-8 rounded-full ${getLocationColor(location.type)} flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => setSelectedLocation(location)}
              >
                {location.type === 'country' ? '🌍' : '🏙️'}
              </div>
              {selectedLocation?.id === location.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-lg border p-3 z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getLocationIcon(location.type)}</span>
                    <h3 className="font-medium text-gray-900">{location.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Adventures</p>
                      <p className="font-medium text-blue-600">{location.adventureCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Visits</p>
                      <p className="font-medium text-green-600">{location.visitCount}</p>
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Location List */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Your Visited Locations</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {mapLocations.map((location) => (
            <div
              key={location.id}
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                selectedLocation?.id === location.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedLocation(location)}
            >
              <div className={`w-6 h-6 rounded-full ${getLocationColor(location.type)} flex items-center justify-center text-white text-xs`}>
                {location.type === 'country' ? '🌍' : '🏙️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{location.name}</p>
                <p className="text-sm text-gray-500 capitalize">{location.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">{location.adventureCount} adventures</p>
                <p className="text-sm text-green-600">{location.visitCount} visits</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Instructions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Interactive Geography Map</p>
            <p>Click on any location marker to see details about your adventures and visits. This map shows all the countries and cities you've explored through your adventures.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographyMap;
