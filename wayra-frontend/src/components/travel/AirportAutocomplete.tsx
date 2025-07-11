import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  subType: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string, airport?: Airport) => void;
  placeholder?: string;
  label?: string;
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Popular airports for quick access when no search is performed
const POPULAR_AIRPORTS: Airport[] = [
  { iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'ORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', subType: 'AIRPORT' },
  { iataCode: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', subType: 'AIRPORT' },
];

const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter city or airport",
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search airports using live Amadeus API
  const searchAirports = async (query: string) => {
    if (query.length < 2) {
      setFilteredAirports(POPULAR_AIRPORTS.slice(0, 8));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/travel/locations/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.data.success && data.data.data) {
        const airports: Airport[] = data.data.data.map((location: any) => ({
          iataCode: location.iataCode,
          name: location.name,
          city: location.address?.cityName || location.name,
          country: location.address?.countryName || '',
          subType: location.subType
        })).filter((airport: Airport) => airport.iataCode); // Only include locations with IATA codes
        
        setFilteredAirports(airports.slice(0, 8));
      } else {
        console.error('Airport search failed:', data);
        setFilteredAirports([]);
      }
    } catch (error) {
      console.error('Airport search error:', error);
      setFilteredAirports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAirports(searchTerm);
    }, 300); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSelectedAirport(null);
    setIsOpen(true);
    onChange(newValue);
  };

  const handleAirportSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    setSearchTerm(`${airport.city} (${airport.iataCode})`);
    setIsOpen(false);
    onChange(airport.iataCode, airport);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.length < 2) {
      // Show popular airports when focused with no search term
      setFilteredAirports(POPULAR_AIRPORTS.slice(0, 8));
    }
  };

  const displayValue = selectedAirport 
    ? `${selectedAirport.city} (${selectedAirport.iataCode})`
    : searchTerm;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        <ChevronDownIcon 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Searching airports...
            </div>
          ) : filteredAirports.length > 0 ? (
            <>
              {searchTerm.length < 2 && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                  Popular Destinations
                </div>
              )}
              {searchTerm.length >= 2 && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                  Search Results
                </div>
              )}
              {filteredAirports.map((airport) => (
                <div
                  key={airport.iataCode}
                  onClick={() => handleAirportSelect(airport)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {airport.city}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {airport.name}
                      </div>
                      {airport.country && (
                        <div className="text-xs text-gray-400">
                          {airport.country}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-blue-600 ml-2">
                      {airport.iataCode}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No airports found for &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;
