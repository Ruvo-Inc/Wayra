import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline';
import { Adventure, GeocodeSearchResult, Point } from '../../types/adventure';

interface PointSelectionModalProps {
  isOpen: boolean;
  adventure: Adventure;
  query?: string | null;
  onClose: () => void;
  onSubmit: (adventure: Adventure) => void;
}

export const PointSelectionModal: React.FC<PointSelectionModalProps> = ({
  isOpen,
  adventure,
  query: initialQuery = null,
  onClose,
  onSubmit
}) => {
  const [markers, setMarkers] = useState<Point[]>([]);
  const [query, setQuery] = useState(initialQuery || '');
  const [places, setPlaces] = useState<GeocodeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize markers from adventure coordinates
  useEffect(() => {
    if (adventure.longitude && adventure.latitude) {
      setMarkers([{
        lngLat: { lng: adventure.longitude, lat: adventure.latitude },
        name: adventure.name,
        location: adventure.location || '',
        activity_type: ''
      }]);
    }
  }, [adventure]);

  // Perform initial search if query provided
  useEffect(() => {
    if (initialQuery && isOpen) {
      geocode();
    }
  }, [initialQuery, isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const addMarker = (lngLat: { lng: number; lat: number }) => {
    const newMarkers = [{
      lngLat,
      name: '',
      location: '',
      activity_type: ''
    }];
    setMarkers(newMarkers);
  };

  const geocode = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!query) {
      alert('Please enter a location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/reverse-geocode/search/?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok) {
        setPlaces(data);
        if (data.length === 0) {
          setError('No results found');
        }
      } else {
        setError('Error searching for location');
        setPlaces([]);
      }
    } catch (err) {
      console.error('Error geocoding:', err);
      setError('Error searching for location');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: GeocodeSearchResult) => {
    const newMarkers = [{
      lngLat: { lng: Number(place.lon), lat: Number(place.lat) },
      location: place.display_name || '',
      name: place.name || '',
      activity_type: place.type || ''
    }];
    setMarkers(newMarkers);
  };

  const handleSubmit = () => {
    if (markers.length === 0) {
      alert('Please select a point on the map');
      return;
    }

    const updatedAdventure = { ...adventure };
    const marker = markers[0];

    updatedAdventure.longitude = marker.lngLat.lng;
    updatedAdventure.latitude = marker.lngLat.lat;

    if (!updatedAdventure.location) {
      updatedAdventure.location = marker.location;
    }

    if (!updatedAdventure.name) {
      updatedAdventure.name = marker.name;
    }

    if ((updatedAdventure.type === 'visited' || updatedAdventure.type === 'planned') && marker.activity_type) {
      updatedAdventure.activity_types = [...(updatedAdventure.activity_types || []), marker.activity_type];
    }

    onSubmit(updatedAdventure);
    onClose();
  };

  const handleMapClick = () => {
    // Simulate map click - in a real implementation, this would be handled by the map library
    const randomLat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const randomLng = -74.0060 + (Math.random() - 0.5) * 0.1;
    addMarker({ lat: randomLat, lng: randomLng });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Choose a Point
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={geocode} className="flex gap-2">
            <input
              type="text"
              placeholder="Search for a location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Search
            </button>
          </form>

          {/* Map Placeholder */}
          <div className="space-y-4">
            <div 
              className="relative aspect-video w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onClick={handleMapClick}
            >
              <div className="text-center">
                <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Click to place a marker
                  {markers.length > 0 && (
                    <span className="block text-sm mt-1 text-blue-600 dark:text-blue-400">
                      Marker placed at: {markers[0].lngLat.lat.toFixed(6)}, {markers[0].lngLat.lng.toFixed(6)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Searching...</p>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center py-4">{error}</p>
          )}

          {places.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Search Results</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {places.map((place, index) => (
                  <button
                    key={index}
                    onClick={() => handlePlaceSelect(place)}
                    className="w-full p-3 text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {place.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {place.display_name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointSelectionModal;
