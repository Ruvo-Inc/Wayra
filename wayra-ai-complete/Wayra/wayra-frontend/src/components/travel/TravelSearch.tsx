'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search, Plane, Hotel, Clock, Star } from 'lucide-react';
import { travelApiService, FlightSearchParams, HotelSearchParams } from '@/services/travelApi';
import AirportAutocomplete from './AirportAutocomplete';
import CityAutocomplete from './CityAutocomplete';

interface TravelSearchProps {
  tripId?: string;
  onResultsFound?: (results: any) => void;
}

const TravelSearch: React.FC<TravelSearchProps> = ({ tripId, onResultsFound }) => {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  
  // Flight search state
  const [flightParams, setFlightParams] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    max: 10
  });
  
  // Hotel search state
  const [hotelParams, setHotelParams] = useState<HotelSearchParams>({
    cityCode: '',
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    max: 10
  });
  
  // Results state
  const [flightResults, setFlightResults] = useState<any>(null);
  const [hotelResults, setHotelResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await travelApiService.getApiStatus();
        console.log('API Status Response:', status);
        console.log('API Status Data:', status.data);
        console.log('Amadeus Status:', status.data?.amadeus);
        setApiStatus(status.data);
      } catch (error) {
        console.error('Failed to check API status:', error);
      }
    };

    checkApiStatus();
  }, []);

  // Handle flight search
  const handleFlightSearch = async () => {
    if (!flightParams.origin || !flightParams.destination || !flightParams.departureDate) {
      setError('Please fill in all required flight search fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const results = await travelApiService.searchFlights(flightParams);
      
      console.log('Flight search results:', results);
      console.log('Flight results data:', results.data);
      console.log('Amadeus object:', results.data?.amadeus);
      console.log('Amadeus data array:', results.data?.amadeus?.data);
      console.log('Amadeus data length:', results.data?.amadeus?.data?.length);
      
      // Debug: Log Amadeus errors if present
      if (results.data?.amadeus?.error) {
        console.log('Amadeus API Error:', results.data.amadeus.error);
      }
      
      if (results.success) {
        setFlightResults(results.data);
        onResultsFound?.(results.data);
      } else {
        setError(results.error || 'Flight search failed');
      }
    } catch (error) {
      setError('An error occurred during flight search');
      console.error('Flight search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle hotel search
  const handleHotelSearch = async () => {
    if (!hotelParams.cityCode && !hotelParams.checkInDate || !hotelParams.checkOutDate) {
      setError('Please fill in all required hotel search fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const results = await travelApiService.searchHotels(hotelParams);
      
      if (results.success) {
        setHotelResults(results.data);
        onResultsFound?.(results.data);
      } else {
        setError(results.error || 'Hotel search failed');
      }
    } catch (error) {
      setError('An error occurred during hotel search');
      console.error('Hotel search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Travel Options</h2>
        <p className="text-gray-600">Find the best flights and hotels for your trip</p>
      </div>

      {/* API Status Indicator */}
      {apiStatus && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700">
              Travel APIs: {Object.values(apiStatus).some((api: any) => api.configured) ? 'Ready' : 'Not Configured'}
            </span>
          </div>
          {!Object.values(apiStatus).some((api: any) => api.configured) && (
            <p className="text-xs text-blue-600 mt-1">
              API keys needed for live search. Demo mode available.
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'flights'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Flights</span>
        </button>
        <button
          onClick={() => setActiveTab('hotels')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'hotels'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Hotel className="w-4 h-4" />
          <span>Hotels</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Flight Search Form */}
      {activeTab === 'flights' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origin */}
            <div>
              <AirportAutocomplete
                label="From"
                placeholder="Enter departure city or airport"
                value={flightParams.origin}
                onChange={(value, airport) => {
                  setFlightParams(prev => ({ ...prev, origin: airport?.iataCode || value }));
                }}
              />
            </div>

            {/* Destination */}
            <div>
              <AirportAutocomplete
                label="To"
                placeholder="Enter destination city or airport"
                value={flightParams.destination}
                onChange={(value, airport) => {
                  setFlightParams(prev => ({ ...prev, destination: airport?.iataCode || value }));
                }}
              />
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  min={today}
                  value={flightParams.departureDate}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  min={flightParams.departureDate || today}
                  value={flightParams.returnDate}
                  onChange={(e) => setFlightParams(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Adults and Search Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adults
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    value={flightParams.adults}
                    onChange={(e) => setFlightParams(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleFlightSearch}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Search Flights'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hotel Search Form */}
      {activeTab === 'hotels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City Selection */}
            <div>
              <CityAutocomplete
                value={hotelParams.cityCode}
                onChange={(value) => {
                  setHotelParams(prev => ({ ...prev, cityCode: value }));
                }}
                placeholder="Enter city or destination"
                label="Destination City"
              />
            </div>

            {/* Check-in Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  min={today}
                  value={hotelParams.checkInDate}
                  onChange={(e) => setHotelParams(prev => ({ ...prev, checkInDate: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Check-out Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  min={hotelParams.checkInDate || today}
                  value={hotelParams.checkOutDate}
                  onChange={(e) => setHotelParams(prev => ({ ...prev, checkOutDate: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Adults */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adults
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <select
                  value={hotelParams.adults}
                  onChange={(e) => setHotelParams(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-end">
            <button
              onClick={handleHotelSearch}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Search Hotels'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {(flightResults || hotelResults) && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {activeTab === 'flights' ? 'Flight Results' : 'Hotel Results'}
          </h3>
          
          {/* Flight Results */}
          {activeTab === 'flights' && flightResults && (
            <div className="space-y-4">
              {flightResults.amadeus?.data?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Amadeus Results</h4>
                  <div className="grid gap-4">
                    {flightResults.amadeus.data.slice(0, 3).map((flight: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <Plane className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">
                                  {flight.itineraries[0]?.segments[0]?.departure?.iataCode} → {flight.itineraries[0]?.segments[0]?.arrival?.iataCode}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                  {travelApiService.formatDuration(flight.itineraries[0]?.duration || '')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              Carrier: {flight.itineraries[0]?.segments[0]?.carrierCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {travelApiService.formatPrice(flight.price)}
                            </p>
                            <p className="text-xs text-gray-500">per person</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {flightResults.skyscanner?.success && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skyscanner Results</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Skyscanner data available</p>
                  </div>
                </div>
              )}
              
              {(!flightResults.amadeus?.data?.length) && !flightResults.skyscanner?.data?.length && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700">No flight results found. Please check your search parameters or API configuration.</p>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>Debug info:</p>
                    <p>Amadeus configured: {apiStatus?.amadeus?.configured ? 'Yes' : 'No'}</p>
                    <p>Amadeus data count: {flightResults.amadeus?.data?.length || 0}</p>
                    <p>Skyscanner configured: {apiStatus?.skyscanner?.configured ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hotel Results */}
          {activeTab === 'hotels' && hotelResults && (
            <div className="space-y-4">
              {hotelResults.amadeus?.success && hotelResults.amadeus.data?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Amadeus Hotel Results</h4>
                  <div className="grid gap-4">
                    {hotelResults.amadeus.data.slice(0, 3).map((hotel: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Hotel className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{hotel.hotel?.name || 'Hotel'}</span>
                              {hotel.hotel?.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm">{hotel.hotel.rating}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {hotel.hotel?.address?.cityName || 'Location not specified'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {hotel.offers?.[0]?.price ? travelApiService.formatPrice(hotel.offers[0].price) : 'Price unavailable'}
                            </p>
                            <p className="text-xs text-gray-500">per night</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {hotelResults.booking?.success && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Booking.com Results</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Booking.com data available</p>
                  </div>
                </div>
              )}
              
              {!hotelResults.amadeus?.success && !hotelResults.booking?.success && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700">No hotel results found. Please check your search parameters or API configuration.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelSearch;
