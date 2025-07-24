'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Collection, CollectionFormData } from '@/types/adventure';
import adventureApi from '@/services/adventureApi';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionCreated: (collection: Collection) => void;
  collection?: Collection; // Optional: for editing existing collection
}

export default function CollectionModal({ isOpen, onClose, onCollectionCreated, collection }: CollectionModalProps) {
  // Helper function to format date for input field (timezone-safe)
  const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Use local date methods to avoid timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`; // Format as YYYY-MM-DD
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState<CollectionFormData>({
    name: collection?.name || '',
    description: collection?.description || '',
    startDate: formatDateForInput(collection?.startDate),
    endDate: formatDateForInput(collection?.endDate),
    isPublic: collection?.isPublic ?? true,
    tags: collection?.tags || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when collection prop changes (for editing)
  useEffect(() => {
    console.log('CollectionModal - collection prop changed:', collection);
    if (collection) {
      console.log('CollectionModal - updating form data with collection:', collection);
      setFormData({
        name: collection.name || '',
        description: collection.description || '',
        startDate: formatDateForInput(collection.startDate),
        endDate: formatDateForInput(collection.endDate),
        isPublic: collection.isPublic ?? true,
        tags: collection.tags || []
      });
    } else {
      console.log('CollectionModal - resetting form data for new collection');
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        isPublic: true,
        tags: []
      });
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for backend - convert empty strings to null for dates
      const submitData = {
        ...formData,
        startDate: formData.startDate ? formData.startDate : null,
        endDate: formData.endDate ? formData.endDate : null
      };

      let updatedCollection;
      if (collection) {
        // Editing existing collection
        updatedCollection = await adventureApi.updateCollection(collection._id, submitData);
      } else {
        // Creating new collection
        updatedCollection = await adventureApi.createCollection(submitData);
      }
      onCollectionCreated(updatedCollection);
      onClose();
      // Reset form only if creating new collection
      if (!collection) {
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          isPublic: true,
          tags: []
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${collection ? 'update' : 'create'} collection`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{collection ? 'Edit Collection' : 'Create New Collection'}</h2>
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

          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter collection name"
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
              placeholder="Describe your collection"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Make this collection public</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Public collections can be discovered and viewed by other users
            </p>
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
              {loading ? (collection ? 'Updating...' : 'Creating...') : (collection ? 'Update Collection' : 'Create Collection')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
