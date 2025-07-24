import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Adventure, User } from '../../types/adventure';
import { AdventureCard } from './AdventureCard';

interface AdventureLinkProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (adventure: Adventure) => void;
  user: User | null;
  collectionId: string;
}

type FilterOption = 'all' | 'visited' | 'not_visited' | 'public' | 'private';

export const AdventureLink: React.FC<AdventureLinkProps> = ({
  isOpen,
  onClose,
  onAdd,
  user,
  collectionId
}) => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [filteredAdventures, setFilteredAdventures] = useState<Adventure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load adventures when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAdventures();
    }
  }, [isOpen, collectionId]);

  // Apply filters when search query or filter option changes
  useEffect(() => {
    applyFilters();
  }, [adventures, searchQuery, filterOption]);

  const loadAdventures = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/adventures/all?include_collections=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        const allAdventures = await response.json();
        
        // Filter out adventures that are already linked to the collection
        const availableAdventures = allAdventures.filter((adventure: Adventure) => {
          return !(adventure.collections ?? []).includes(collectionId);
        });
        
        setAdventures(availableAdventures);
      } else {
        console.error('Failed to load adventures');
      }
    } catch (error) {
      console.error('Error loading adventures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = adventures;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((adventure) => {
        const nameMatch = adventure.name.toLowerCase().includes(query);
        const locationMatch = adventure.location?.toLowerCase().includes(query) || false;
        const descriptionMatch = adventure.description?.toLowerCase().includes(query) || false;
        return nameMatch || locationMatch || descriptionMatch;
      });
    }

    // Apply status filter
    switch (filterOption) {
      case 'public':
        filtered = filtered.filter((adventure) => adventure.isPublic);
        break;
      case 'private':
        filtered = filtered.filter((adventure) => !adventure.isPublic);
        break;
      case 'visited':
        filtered = filtered.filter((adventure) => adventure.visits && adventure.visits.length > 0);
        break;
      case 'not_visited':
        filtered = filtered.filter((adventure) => !adventure.visits || adventure.visits.length === 0);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredAdventures(filtered);
  };

  const handleAdd = (adventure: Adventure) => {
    // Remove from local list
    setAdventures(prev => prev.filter(a => a.id !== adventure.id));
    // Notify parent
    onAdd(adventure);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterOption('all');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Statistics
  const totalAdventures = adventures.length;
  const publicAdventures = adventures.filter(a => a.isPublic).length;
  const privateAdventures = adventures.filter(a => !a.isPublic).length;
  const visitedAdventures = adventures.filter(a => a.visits && a.visits.length > 0).length;
  const notVisitedAdventures = adventures.filter(a => !a.visits || a.visits.length === 0).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adventure-link-title"
    >
      <div
        className="relative w-11/12 max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <MapPinIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 id="adventure-link-title" className="text-3xl font-bold text-gray-900 dark:text-white">
                  Link Adventures
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAdventures.length} of {totalAdventures} adventures
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                <div className="px-3 py-1 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Available</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{totalAdventures}</div>
                </div>
                <div className="px-3 py-1 text-center border-l border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Visited</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">{visitedAdventures}</div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search adventures by name, location..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {(searchQuery || filterOption !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', icon: MapPinIcon },
                { key: 'visited', label: 'Visited', icon: CheckCircleIcon },
                { key: 'not_visited', label: 'Not Visited', icon: XCircleIcon },
                { key: 'public', label: 'Public', icon: GlobeAltIcon },
                { key: 'private', label: 'Private', icon: LockClosedIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterOption(key as FilterOption)}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
                    filterOption === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                <div className="animate-spin rounded-full w-16 h-16 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Loading Adventures...
              </h3>
            </div>
          ) : filteredAdventures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                <MapPinIcon className="w-16 h-16 text-gray-400" />
              </div>
              {searchQuery || filterOption !== 'all' ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Adventures Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    Try adjusting your search terms or filters to find more adventures.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Linkable Adventures
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    All your adventures are already linked to this collection.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdventures.map((adventure) => (
                <AdventureCard
                  key={adventure.id}
                  adventure={adventure}
                  user={user}
                  type="link"
                  onLink={() => handleAdd(adventure)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAdventures.length} adventures available to link
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureLink;
