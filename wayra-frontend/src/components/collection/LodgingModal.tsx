import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Lodging, Collection } from '../../types/adventure';

interface LodgingModalProps {
  isOpen: boolean;
  lodging?: Lodging | null;
  collection: Collection;
  onClose: () => void;
  onSave?: (lodging: Lodging) => void;
  onCreate?: (lodging: Lodging) => void;
}

const LODGING_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'resort', label: 'Resort' },
  { value: 'bnb', label: 'B&B / Airbnb' },
  { value: 'campground', label: 'Campground' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'motel', label: 'Motel' },
  { value: 'other', label: 'Other' }
];

export const LodgingModal: React.FC<LodgingModalProps> = ({
  isOpen,
  lodging,
  collection,
  onClose,
  onSave,
  onCreate
}) => {
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [lodgingInfoExpanded, setLodgingInfoExpanded] = useState(true);
  const [dateRangeExpanded, setDateRangeExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(true);
  const [constrainDates, setConstrainDates] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    userId: '',
    name: '',
    type: 'other',
    description: '',
    rating: null as number | null,
    link: '',
    checkIn: '',
    checkOut: '',
    reservationNumber: '',
    price: null as number | null,
    latitude: null as number | null,
    longitude: null as number | null,
    location: '',
    isPublic: false,
    collectionId: collection.id,
    timezone: '',
    createdAt: '',
    updatedAt: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (lodging) {
        setFormData({
          id: lodging.id || '',
          userId: lodging.userId || '',
          name: lodging.name || '',
          type: lodging.type || 'other',
          description: lodging.description || '',
          rating: lodging.rating || null,
          link: lodging.link || '',
          checkIn: lodging.checkIn || '',
          checkOut: lodging.checkOut || '',
          reservationNumber: lodging.reservationNumber || '',
          price: lodging.price || null,
          latitude: lodging.latitude || null,
          longitude: lodging.longitude || null,
          location: lodging.location || '',
          isPublic: lodging.isPublic || false,
          collectionId: lodging.collectionId || collection.id,
          timezone: lodging.timezone || '',
          createdAt: lodging.createdAt || '',
          updatedAt: lodging.updatedAt || ''
        });
      } else {
        // Reset form for new lodging
        setFormData({
          id: '',
          userId: '',
          name: '',
          type: 'other',
          description: '',
          rating: null,
          link: '',
          checkIn: '',
          checkOut: '',
          reservationNumber: '',
          price: null,
          latitude: null,
          longitude: null,
          location: '',
          isPublic: collection.isPublic || false,
          collectionId: collection.id,
          timezone: '',
          createdAt: '',
          updatedAt: ''
        });
      }
    }
  }, [isOpen, lodging, collection]);

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleRatingRemove = () => {
    setFormData(prev => ({ ...prev, rating: null }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    // Auto-set checkout date if missing but checkin exists
    let checkOutDate = formData.checkOut;
    if (formData.checkIn && !formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 0, 0, 0); // Set to 9:00 AM next day
      checkOutDate = nextDay.toISOString().slice(0, 16); // Format for datetime-local input
    }

    const lodgingData: Lodging = {
      ...formData,
      checkOut: checkOutDate,
      name: formData.name.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (lodging?.id) {
        // Update existing lodging
        if (onSave) {
          onSave(lodgingData);
        }
      } else {
        // Create new lodging
        if (onCreate) {
          const newLodging = {
            ...lodgingData,
            id: `temp_${Date.now()}`, // Temporary ID
            createdAt: new Date().toISOString()
          };
          onCreate(newLodging);
        }
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save lodging:', error);
      alert('Failed to save lodging');
    }
  };

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleRatingClick(i)}
          className="focus:outline-none"
        >
          {formData.rating && formData.rating >= i ? (
            <StarIconSolid className="h-6 w-6 text-yellow-400" />
          ) : (
            <StarIcon className="h-6 w-6 text-gray-300 hover:text-yellow-400 transition-colors" />
          )}
        </button>
      );
    }
    return stars;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">
            {lodging ? 'Edit Lodging' : 'New Lodging'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="text-xl font-medium text-gray-900">Basic Information</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${basicInfoExpanded ? 'rotate-180' : ''}`} />
            </button>
            {basicInfoExpanded && (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                {/* Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    {LODGING_TYPES.map(type => (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your lodging experience..."
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {renderStarRating()}
                    </div>
                    {formData.rating && (
                      <button
                        type="button"
                        onClick={handleRatingRemove}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.link}
                    onChange={(e) => handleInputChange('link', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lodging Information Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setLodgingInfoExpanded(!lodgingInfoExpanded)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="text-xl font-medium text-gray-900">Lodging Information</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${lodgingInfoExpanded ? 'rotate-180' : ''}`} />
            </button>
            {lodgingInfoExpanded && (
              <div className="p-4 space-y-4">
                {/* Reservation Number */}
                <div>
                  <label htmlFor="reservationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Reservation Number
                  </label>
                  <input
                    type="text"
                    id="reservationNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.reservationNumber}
                    onChange={(e) => handleInputChange('reservationNumber', e.target.value)}
                  />
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date Range Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setDateRangeExpanded(!dateRangeExpanded)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="text-xl font-medium text-gray-900">Check-in / Check-out</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${dateRangeExpanded ? 'rotate-180' : ''}`} />
            </button>
            {dateRangeExpanded && (
              <div className="p-4 space-y-4">
                {collection.startDate && collection.endDate && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={constrainDates}
                      onChange={(e) => setConstrainDates(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Constrain to collection dates</span>
                  </label>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Check-in */}
                  <div>
                    <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in
                    </label>
                    <input
                      type="datetime-local"
                      id="checkIn"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.checkIn}
                      onChange={(e) => handleInputChange('checkIn', e.target.value)}
                      min={constrainDates ? `${collection.startDate}T00:00` : undefined}
                      max={constrainDates ? `${collection.endDate}T23:59` : undefined}
                    />
                  </div>

                  {/* Check-out */}
                  <div>
                    <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out
                    </label>
                    <input
                      type="datetime-local"
                      id="checkOut"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.checkOut}
                      onChange={(e) => handleInputChange('checkOut', e.target.value)}
                      min={constrainDates ? `${collection.startDate}T00:00` : undefined}
                      max={constrainDates ? `${collection.endDate}T23:59` : undefined}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setLocationExpanded(!locationExpanded)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="text-xl font-medium text-gray-900">Location</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${locationExpanded ? 'rotate-180' : ''}`} />
            </button>
            {locationExpanded && (
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.latitude || ''}
                      onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>

                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.longitude || ''}
                      onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
