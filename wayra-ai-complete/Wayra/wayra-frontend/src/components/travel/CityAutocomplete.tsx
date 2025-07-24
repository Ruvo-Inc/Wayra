import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface City {
  iataCode?: string;
  name: string;
  city: string;
  country: string;
  subType: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, city?: City) => void;
  placeholder?: string;
  label?: string;
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Popular cities for quick access when no search is performed
const POPULAR_CITIES: City[] = [
  { name: 'New York', city: 'New York', country: 'United States', subType: 'CITY' },
  { name: 'London', city: 'London', country: 'United Kingdom', subType: 'CITY' },
  { name: 'Paris', city: 'Paris', country: 'France', subType: 'CITY' },
  { name: 'Tokyo', city: 'Tokyo', country: 'Japan', subType: 'CITY' },
  { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', subType: 'CITY' },
  { name: 'Singapore', city: 'Singapore', country: 'Singapore', subType: 'CITY' },
  { name: 'Los Angeles', city: 'Los Angeles', country: 'United States', subType: 'CITY' },
  { name: 'Barcelona', city: 'Barcelona', country: 'Spain', subType: 'CITY' },
];

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter city or destination",
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search cities using live Amadeus API
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setFilteredCities(POPULAR_CITIES.slice(0, 8));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/travel/locations/search?query=${encodeURIComponent(query)}&subType=CITY`);
      const data = await response.json();
      
      if (data.success && data.data.success && data.data.data) {
        const cities: City[] = data.data.data.map((location: any) => ({
          iataCode: location.iataCode,
          name: location.name,
          city: location.address?.cityName || location.name,
          country: location.address?.countryName || '',
          subType: location.subType
        }));
        
        setFilteredCities(cities.slice(0, 8));
      } else {
        console.error('City search failed:', data);
        setFilteredCities([]);
      }
    } catch (error) {
      console.error('City search error:', error);
      setFilteredCities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCities(searchTerm);
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
    setSelectedCity(null);
    setIsOpen(true);
    onChange(newValue);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSearchTerm(city.city);
    setIsOpen(false);
    onChange(city.iataCode || city.city, city);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.length < 2) {
      // Show popular cities when focused with no search term
      setFilteredCities(POPULAR_CITIES.slice(0, 8));
    }
  };

  const displayValue = selectedCity 
    ? selectedCity.city
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
              Searching cities...
            </div>
          ) : filteredCities.length > 0 ? (
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
              {filteredCities.map((city, index) => (
                <div
                  key={city.iataCode || `${city.city}-${index}`}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {city.city}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {city.name}
                      </div>
                      {city.country && (
                        <div className="text-xs text-gray-400">
                          {city.country}
                        </div>
                      )}
                    </div>
                    {city.iataCode && (
                      <div className="text-sm font-medium text-blue-600 ml-2">
                        {city.iataCode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No cities found for &quot;{searchTerm}&quot;
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

export default CityAutocomplete;
