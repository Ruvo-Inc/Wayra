import React, { useState, useEffect } from 'react';
import { XMarkIcon, MapPinIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Transportation, Collection } from '../../types/adventure';

interface TransportationModalProps {
  transportation?: Transportation | null;
  collection: Collection;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (transportation: Transportation) => void;
  onCreate?: (transportation: Transportation) => void;
}

const TRANSPORTATION_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'plane', label: 'Plane' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'boat', label: 'Boat' },
  { value: 'bike', label: 'Bike' },
  { value: 'walking', label: 'Walking' },
  { value: 'other', label: 'Other' }
];

export const TransportationModal: React.FC<TransportationModalProps> = ({
  transportation,
  collection,
  isOpen,
  onClose,
  onSave,
  onCreate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    date: '',
    endDate: '',
    rating: 0,
    link: '',
    flightNumber: '',
    fromLocation: '',
    toLocation: '',
    originLatitude: 0,
    originLongitude: 0,
    destinationLatitude: 0,
    destinationLongitude: 0,
    startTimezone: '',
    endTimezone: ''
  });

  const [startingAirport, setStartingAirport] = useState('');
  const [endingAirport, setEndingAirport] = useState('');
  const [constrainDates, setConstrainDates] = useState(false);
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);
  const [isDateRangeExpanded, setIsDateRangeExpanded] = useState(true);
  const [isLocationExpanded, setIsLocationExpanded] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: transportation?.name || '',
        type: transportation?.type || '',
        description: transportation?.description || '',
        date: transportation?.date || '',
        endDate: transportation?.endDate || '',
        rating: transportation?.rating || 0,
        link: transportation?.link || '',
        flightNumber: transportation?.flightNumber || '',
        fromLocation: transportation?.fromLocation || '',
        toLocation: transportation?.toLocation || '',
        originLatitude: transportation?.originLatitude || 0,
        originLongitude: transportation?.originLongitude || 0,
        destinationLatitude: transportation?.destinationLatitude || 0,
        destinationLongitude: transportation?.destinationLongitude || 0,
        startTimezone: transportation?.startTimezone || '',
        endTimezone: transportation?.endTimezone || ''
      });
      setStartingAirport('');
      setEndingAirport('');
    }
  }, [isOpen, transportation]);

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const geocodeLocation = async () => {
    try {
      const fetchLocation = async (query: string) => {
        const response = await fetch(`/api/reverse-geocode/search/?query=${encodeURIComponent(query)}`);
        return await response.json();
      };

      let startingData = null;
      let endingData = null;

      if (formData.type === 'plane') {
        if (!startingAirport || !endingAirport) {
          alert('Please enter both starting and ending airport codes');
          return;
        }
        startingData = await fetchLocation(startingAirport + ' Airport');
        endingData = await fetchLocation(endingAirport + ' Airport');
      } else {
        if (!formData.fromLocation || !formData.toLocation) {
          alert('Please enter both from and to locations');
          return;
        }
        startingData = await fetchLocation(formData.fromLocation);
        endingData = await fetchLocation(formData.toLocation);
      }

      if (!startingData?.length || !endingData?.length) {
        alert('Location not found. Please check your entries.');
        return;
      }

      const updatedData = { ...formData };

      if (formData.type === 'plane') {
        updatedData.fromLocation = `${startingData[0].name} (${startingAirport.toUpperCase()})`;
        updatedData.toLocation = `${endingData[0].name} (${endingAirport.toUpperCase()})`;
      } else {
        updatedData.fromLocation = startingData[0].display_name;
        updatedData.toLocation = endingData[0].display_name;
      }

      updatedData.originLatitude = parseFloat(startingData[0].lat);
      updatedData.originLongitude = parseFloat(startingData[0].lon);
      updatedData.destinationLatitude = parseFloat(endingData[0].lat);
      updatedData.destinationLongitude = parseFloat(endingData[0].lon);

      setFormData(updatedData);
    } catch (error) {
      console.error('Error geocoding locations:', error);
      alert('Error fetching location information. Please try again.');
    }
  };

  const clearLocations = () => {
    setFormData(prev => ({
      ...prev,
      fromLocation: '',
      toLocation: '',
      originLatitude: 0,
      originLongitude: 0,
      destinationLatitude: 0,
      destinationLongitude: 0
    }));
    setStartingAirport('');
    setEndingAirport('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submissionData = {
        ...formData,
        collection: collection.id,
        isPublic: collection.isPublic,
        // Round coordinates to 6 decimal places
        originLatitude: formData.originLatitude ? Math.round(formData.originLatitude * 1e6) / 1e6 : null,
        originLongitude: formData.originLongitude ? Math.round(formData.originLongitude * 1e6) / 1e6 : null,
        destinationLatitude: formData.destinationLatitude ? Math.round(formData.destinationLatitude * 1e6) / 1e6 : null,
        destinationLongitude: formData.destinationLongitude ? Math.round(formData.destinationLongitude * 1e6) / 1e6 : null,
        // Clear flight number if not a plane
        flightNumber: formData.type === 'plane' ? formData.flightNumber : ''
      };

      if (transportation?.id) {
        // Update existing transportation
        const response = await fetch(`/api/transportations/${transportation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          const updatedTransportation = await response.json();
          onSave?.(updatedTransportation);
          handleClose();
        } else {
          console.error('Failed to update transportation');
        }
      } else {
        // Create new transportation
        const response = await fetch('/api/transportations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          const newTransportation = await response.json();
          onCreate?.(newTransportation);
          handleClose();
        } else {
          console.error('Failed to create transportation');
        }
      }
    } catch (error) {
      console.error('Error saving transportation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {transportation ? 'Edit Transportation' : 'New Transportation'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
                className="w-full px-4 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex justify-between items-center"
              >
                Basic Information
                <span className={`transform transition-transform ${isBasicInfoExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isBasicInfoExpanded && (
                <div className="p-4 space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">Select transportation type</option>
                      {TRANSPORTATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your transportation experience..."
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                            className={`text-2xl ${
                              star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {formData.rating > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rating: 0 }))}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Link */}
                  <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                      Link
                    </label>
                    <input
                      type="url"
                      id="link"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Section */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setIsDateRangeExpanded(!isDateRangeExpanded)}
                className="w-full px-4 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
              >
                Date & Time
                <span className={`transform transition-transform ${isDateRangeExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isDateRangeExpanded && (
                <div className="p-4 space-y-4">
                  {collection.startDate && collection.endDate && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-sm text-gray-600">Constrain to collection dates</span>
                      <input
                        type="checkbox"
                        checked={constrainDates}
                        onChange={(e) => setConstrainDates(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        id="startDate"
                        min={constrainDates ? collection.startDate : ''}
                        max={constrainDates ? collection.endDate : ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        id="endDate"
                        min={constrainDates ? collection.startDate : ''}
                        max={constrainDates ? collection.endDate : ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location Information Section */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                className="w-full px-4 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-b-lg flex justify-between items-center"
              >
                {formData.type === 'plane' ? 'Flight Information' : 'Location Information'}
                <span className={`transform transition-transform ${isLocationExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isLocationExpanded && (
                <div className="p-4 space-y-4">
                  {formData.type === 'plane' && (
                    <div>
                      <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Flight Number
                      </label>
                      <input
                        type="text"
                        id="flightNumber"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                        placeholder="e.g., AA123"
                      />
                    </div>
                  )}

                  {formData.type === 'plane' && (!formData.fromLocation || !formData.toLocation) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startingAirport" className="block text-sm font-medium text-gray-700 mb-1">
                          Starting Airport Code
                        </label>
                        <input
                          type="text"
                          id="startingAirport"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={startingAirport}
                          onChange={(e) => setStartingAirport(e.target.value.toUpperCase())}
                          placeholder="e.g., LAX"
                        />
                      </div>
                      <div>
                        <label htmlFor="endingAirport" className="block text-sm font-medium text-gray-700 mb-1">
                          Ending Airport Code
                        </label>
                        <input
                          type="text"
                          id="endingAirport"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={endingAirport}
                          onChange={(e) => setEndingAirport(e.target.value.toUpperCase())}
                          placeholder="e.g., JFK"
                        />
                      </div>
                    </div>
                  )}

                  {(formData.type !== 'plane' || (formData.fromLocation && formData.toLocation)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fromLocation" className="block text-sm font-medium text-gray-700 mb-1">
                          From Location
                        </label>
                        <input
                          type="text"
                          id="fromLocation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.fromLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, fromLocation: e.target.value }))}
                          placeholder="Starting location"
                        />
                      </div>
                      <div>
                        <label htmlFor="toLocation" className="block text-sm font-medium text-gray-700 mb-1">
                          To Location
                        </label>
                        <input
                          type="text"
                          id="toLocation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.toLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, toLocation: e.target.value }))}
                          placeholder="Destination location"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={geocodeLocation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      Fetch Location Information
                    </button>
                    
                    {(formData.fromLocation || formData.toLocation) && (
                      <button
                        type="button"
                        onClick={clearLocations}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Clear Locations
                      </button>
                    )}
                  </div>

                  {/* Map placeholder - would integrate with actual map component */}
                  {(formData.originLatitude || formData.destinationLatitude) && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Map View:</p>
                      <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                        <span className="text-gray-500">Map integration would go here</span>
                      </div>
                      {formData.originLatitude && formData.originLongitude && (
                        <p className="text-xs text-gray-500 mt-2">
                          Origin: {formData.originLatitude.toFixed(6)}, {formData.originLongitude.toFixed(6)}
                        </p>
                      )}
                      {formData.destinationLatitude && formData.destinationLongitude && (
                        <p className="text-xs text-gray-500">
                          Destination: {formData.destinationLatitude.toFixed(6)}, {formData.destinationLongitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
