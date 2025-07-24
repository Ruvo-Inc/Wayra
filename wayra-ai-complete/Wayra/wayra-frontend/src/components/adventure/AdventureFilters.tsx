'use client';

import React, { useState } from 'react';
import { AdventureFilters } from '@/types/adventure';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AdventureFiltersProps {
  filters: AdventureFilters;
  onFiltersChange: (filters: AdventureFilters) => void;
  className?: string;
}

const ACTIVITY_TYPES = [
  { name: 'hiking', displayName: 'Hiking', icon: '🥾' },
  { name: 'restaurant', displayName: 'Restaurant', icon: '🍽️' },
  { name: 'museum', displayName: 'Museum', icon: '🏛️' },
  { name: 'park', displayName: 'Park', icon: '🌳' },
  { name: 'beach', displayName: 'Beach', icon: '🏖️' },
  { name: 'mountain', displayName: 'Mountain', icon: '⛰️' },
  { name: 'city', displayName: 'City', icon: '🏙️' },
  { name: 'nature', displayName: 'Nature', icon: '🌿' },
  { name: 'culture', displayName: 'Culture', icon: '🎭' },
  { name: 'adventure', displayName: 'Adventure', icon: '🎯' },
  { name: 'food', displayName: 'Food', icon: '🍕' },
  { name: 'shopping', displayName: 'Shopping', icon: '🛍️' },
  { name: 'nightlife', displayName: 'Nightlife', icon: '🌃' },
  { name: 'sports', displayName: 'Sports', icon: '⚽' },
  { name: 'entertainment', displayName: 'Entertainment', icon: '🎪' }
];

const RATING_OPTIONS = [
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' }
];

export const AdventureFiltersComponent: React.FC<AdventureFiltersProps> = ({
  filters,
  onFiltersChange,
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof AdventureFilters, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const handleCategoryChange = (categoryName: string) => {
    const currentCategories = filters.category || [];
    const isSelected = currentCategories.includes(categoryName);
    
    let newCategories;
    if (isSelected) {
      newCategories = currentCategories.filter(c => c !== categoryName);
    } else {
      newCategories = [...currentCategories, categoryName];
    }
    
    handleFilterChange('category', newCategories.length > 0 ? newCategories : undefined);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Toggle */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search adventures..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Visit Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.isVisited === undefined ? '' : filters.isVisited.toString()}
              onChange={(e) => handleFilterChange('isVisited', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Adventures</option>
              <option value="true">Visited</option>
              <option value="false">Planned</option>
            </select>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const isSelected = filters.category?.includes(type.name) || false;
                return (
                  <button
                    key={type.name}
                    onClick={() => handleCategoryChange(type.name)}
                    className={`flex items-center px-3 py-2 text-sm rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{type.icon}</span>
                    {type.displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <select
              value={filters.minRating || ''}
              onChange={(e) => handleFilterChange('minRating', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Rating</option>
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                placeholder="e.g., United States"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="e.g., New York"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="visitDate">Visit Date</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
