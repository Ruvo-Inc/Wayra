'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdventureApi } from '@/services/adventureApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { 
  GlobeAltIcon,
  MapPinIcon,
  EyeIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import GeographyMap from '../../components/geography/GeographyMap';

interface GeographyData {
  visitedCountries: Array<{
    country: string;
    countryCode: string;
    adventureCount: number;
    visitCount: number;
    cities: Array<{
      city: string;
      adventureCount: number;
      visitCount: number;
    }>;
  }>;
  visitedCities: Array<{
    city: string;
    country: string;
    adventureCount: number;
    visitCount: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  nearbyAdventures: Array<{
    id: string;
    name: string;
    location: string;
    distance: number;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  stats: {
    totalCountries: number;
    totalCities: number;
    totalContinents: number;
    mostVisitedCountry: string;
    mostVisitedCity: string;
  };
}

export default function GeographyPage() {
  const { user } = useAuth();
  const [geographyData, setGeographyData] = useState<GeographyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const adventureApi = new AdventureApi();

  useEffect(() => {
    if (user) {
      loadGeographyData();
      getUserLocation();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadGeographyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adventureApi.getGeographyData();
      setGeographyData(data);
    } catch (err) {
      console.error('Error loading geography data:', err);
      setError('Failed to load geography data');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          loadNearbyAdventures(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  };

  const loadNearbyAdventures = async (lat: number, lng: number) => {
    try {
      const nearbyData = await adventureApi.getNearbyAdventures(lat, lng, 50); // 50km radius
      if (geographyData) {
        setGeographyData({
          ...geographyData,
          nearbyAdventures: nearbyData
        });
      }
    } catch (err) {
      console.error('Error loading nearby adventures:', err);
    }
  };

  const filteredCountries = geographyData?.visitedCountries.filter(country =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCities = geographyData?.visitedCities.filter(city =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your geography data.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={loadGeographyData} />
      </div>
    );
  }

  if (!geographyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No geography data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Geography</h1>
              <p className="text-sm text-gray-600">Explore your travel footprint around the world</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search countries or cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-2 ${viewMode === 'map' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'} hover:bg-blue-50 transition-colors`}
                >
                  <GlobeAltIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'} hover:bg-blue-50 transition-colors`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Countries</p>
                <p className="text-2xl font-semibold text-gray-900">{geographyData.stats.totalCountries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cities</p>
                <p className="text-2xl font-semibold text-gray-900">{geographyData.stats.totalCities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Most Visited</p>
                <p className="text-lg font-semibold text-gray-900">{geographyData.stats.mostVisitedCountry}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Continents</p>
                <p className="text-2xl font-semibold text-gray-900">{geographyData.stats.totalContinents}</p>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'map' ? (
          /* Map View */
          <div className="mb-8">
            <GeographyMap 
              countries={(geographyData?.visitedCountries || []).map(country => ({
                name: country.country,
                code: country.countryCode,
                adventureCount: country.adventureCount,
                visitCount: country.visitCount
              }))}
              cities={(geographyData?.visitedCities || []).map(city => ({
                name: city.city,
                country: city.country,
                adventureCount: city.adventureCount,
                visitCount: city.visitCount
              }))}
            />
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Countries */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Visited Countries</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {filteredCountries.map((country) => (
                    <div
                      key={country.country}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedCountry(
                        selectedCountry === country.country ? null : country.country
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{country.country}</h4>
                          <p className="text-sm text-gray-600">
                            {country.adventureCount} adventures • {country.visitCount} visits
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl">{country.countryCode}</span>
                        </div>
                      </div>
                      
                      {selectedCountry === country.country && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Cities:</h5>
                          <div className="space-y-2">
                            {country.cities.map((city) => (
                              <div key={city.city} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{city.city}</span>
                                <span className="text-gray-500">
                                  {city.adventureCount} adventures • {city.visitCount} visits
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cities */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Visited Cities</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {filteredCities.map((city) => (
                    <div
                      key={`${city.city}-${city.country}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{city.city}</h4>
                          <p className="text-sm text-gray-600">{city.country}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {city.adventureCount} adventures
                          </p>
                          <p className="text-sm text-gray-600">
                            {city.visitCount} visits
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Adventures */}
        {geographyData.nearbyAdventures.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Nearby Adventures</h3>
              <p className="text-sm text-gray-600">Adventures within 50km of your current location</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {geographyData.nearbyAdventures.map((adventure) => (
                  <div
                    key={adventure.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{adventure.name}</h4>
                        <p className="text-sm text-gray-600">{adventure.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {adventure.distance.toFixed(1)} km away
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
