'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Adventure, AdventureFormData, ACTIVITY_TYPES } from '@/types/adventure';
import adventureApi from '@/services/adventureApi';
import LocationAutocomplete from '@/components/location/LocationAutocomplete';

interface AdventureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdventureCreated?: (adventure: Adventure) => void;
  onAdventureUpdated?: (adventure: Adventure) => void;
  adventure?: Adventure; // For edit mode
  mode?: 'create' | 'edit';
}

export default function AdventureModal({ 
  isOpen, 
  onClose, 
  onAdventureCreated, 
  onAdventureUpdated, 
  adventure, 
  mode = 'create' 
}: AdventureModalProps) {
  const [formData, setFormData] = useState<AdventureFormData>({
    name: '',
    location: '',
    description: '',
    latitude: undefined,
    longitude: undefined,
    category: {
      name: 'general',
      displayName: 'General 🌍',
      icon: '🌍'
    },
    activityTypes: ['general'],
    rating: undefined,
    link: '',
    isVisited: false,
    isPublic: true,
    tripId: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === 'edit' && adventure) {
      setFormData({
        name: adventure.name || '',
        location: adventure.location || '',
        description: adventure.description || '',
        latitude: adventure.coordinates?.coordinates?.[1],
        longitude: adventure.coordinates?.coordinates?.[0],
        category: adventure.category || {
          name: 'general',
          displayName: 'General 🌍',
          icon: '🌍'
        },
        activityTypes: adventure.activityTypes || ['general'],
        rating: adventure.rating,
        link: adventure.link || '',
        isVisited: adventure.isVisited || false,
        isPublic: adventure.isPublic !== false, // Default to true if undefined
        tripId: adventure.tripId
      });
    } else {
      // Reset to default for create mode
      setFormData({
        name: '',
        location: '',
        description: '',
        latitude: undefined,
        longitude: undefined,
        category: {
          name: 'general',
          displayName: 'General 🌍',
          icon: '🌍'
        },
        activityTypes: ['general'],
        rating: undefined,
        link: '',
        isVisited: false,
        isPublic: true,
        tripId: undefined
      });
    }
  }, [mode, adventure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'edit' && adventure) {
        // Update existing adventure
        const updatedAdventure = await adventureApi.updateAdventure((adventure as any)._id || adventure.id, formData);
        onAdventureUpdated?.(updatedAdventure);
      } else {
        // Create new adventure
        const newAdventure = await adventureApi.createAdventure(formData);
        onAdventureCreated?.(newAdventure);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} adventure`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityTypeChange = (activityType: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        activityTypes: [...prev.activityTypes, activityType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        activityTypes: prev.activityTypes.filter(type => type !== activityType)
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Adventure' : 'Create New Adventure'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Adventure Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adventure Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter adventure name"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <LocationAutocomplete
              value={formData.location || ''}
              onChange={(location, coordinates) => {
                setFormData(prev => ({
                  ...prev,
                  location,
                  latitude: coordinates?.lat,
                  longitude: coordinates?.lng
                }));
              }}
              placeholder="Search for a location..."
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your adventure"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category.name}
              onChange={(e) => {
                const selectedType = ACTIVITY_TYPES.find(type => type.name === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  category: {
                    name: e.target.value,
                    displayName: selectedType?.displayName || e.target.value,
                    icon: selectedType?.displayName.split(' ').pop() || '🌍'
                  }
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ACTIVITY_TYPES.map((activityType) => (
                <option key={activityType.name} value={activityType.name}>
                  {activityType.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Types
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {ACTIVITY_TYPES.slice(0, 12).map((activityType) => (
                <label key={activityType.name} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.activityTypes.includes(activityType.name)}
                    onChange={(e) => handleActivityTypeChange(activityType.name, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {activityType.displayName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (1-5)
            </label>
            <select
              value={formData.rating || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rating: e.target.value ? Number(e.target.value) : undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No rating</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link (optional)
            </label>
            <input
              type="url"
              value={formData.link || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isVisited}
                onChange={(e) => setFormData(prev => ({ ...prev, isVisited: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">I have visited this place</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Make this adventure public</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Adventure' : 'Create Adventure')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
