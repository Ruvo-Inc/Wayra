import React, { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  FolderIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Collection } from '../../types/adventure';
import adventureApi from '../../services/adventureApi';

interface CollectionLinkProps {
  linkedCollectionList?: string[] | null;
  isOpen: boolean;
  onClose: () => void;
  onLink: (collectionId: string) => void;
  onUnlink: (collectionId: string) => void;
}

export const CollectionLink: React.FC<CollectionLinkProps> = ({
  linkedCollectionList = null,
  isOpen,
  onClose,
  onLink,
  onUnlink
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 CollectionLink - Loading collections...');
      
      // Use the adventureApi service to get collections with proper authentication
      const response = await adventureApi.getCollections({});
      console.log('✅ CollectionLink - Collections loaded:', response);
      
      const collectionsData: Collection[] = response.collections || [];

      // Move linked collections to the front
      if (linkedCollectionList && linkedCollectionList.length > 0) {
        collectionsData.sort((a, b) => {
          const aId = a._id || a.id;
          const bId = b._id || b.id;
          const aLinked = aId ? linkedCollectionList?.includes(aId) : false;
          const bLinked = bId ? linkedCollectionList?.includes(bId) : false;
          return aLinked === bLinked ? 0 : aLinked ? -1 : 1;
        });
      }

      setCollections(collectionsData);
      setFilteredCollections(collectionsData);
    } catch (error) {
      console.error('❌ CollectionLink - Failed to load collections:', error);
      // Set empty array on error so UI shows "No collections found" instead of loading forever
      setCollections([]);
      setFilteredCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, [linkedCollectionList]);

  // Load collections when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen, loadCollections]);

  // Filter collections based on search query
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredCollections(collections);
    } else {
      setFilteredCollections(
        collections.filter(collection =>
          collection.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [collections, searchQuery]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const linkedCount = linkedCollectionList ? linkedCollectionList.length : 0;
  const totalCollections = collections.length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-11/12 max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FolderIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  My Collections
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredCollections.length} of {totalCollections} collections
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Linked</div>
                    <div className="text-lg font-semibold text-green-600">{linkedCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Available</div>
                    <div className="text-lg font-semibold text-blue-600">{totalCollections}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {searchQuery && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading collections...</p>
              </div>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-6 bg-gray-100 rounded-2xl mb-6">
                <FolderIcon className="w-16 h-16 text-gray-400" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No collections found
                  </h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Try a different search term or clear your search to see all collections.
                  </p>
                  <button
                    onClick={clearSearch}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No collections found
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Create your first collection to get started organizing your adventures.
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Collections Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              {filteredCollections.map((collection) => {
                const collectionId = collection._id || collection.id;
                if (!collectionId) return null;
                
                // Debug logging
                console.log('🔍 CollectionLink - Debug:', {
                  collectionId,
                  collectionName: collection.name,
                  linkedCollectionList,
                  isLinked: linkedCollectionList && linkedCollectionList.includes(collectionId)
                });
                
                const isLinked = linkedCollectionList && linkedCollectionList.includes(collectionId);
                
                return (
                  <div
                    key={collectionId}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group max-w-md w-full"
                  >
                    {/* Image Section */}
                    <div className="relative overflow-hidden rounded-t-2xl">
                      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <FolderIcon className="w-16 h-16 text-white/80" />
                      </div>
                      
                      {/* Status Overlay */}
                      <div className="absolute top-4 left-4">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
                          collection.isPublic 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {collection.isPublic ? 'Public' : 'Private'}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                      {/* Title */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-left line-clamp-2">
                          {collection.name}
                        </h3>

                        {/* Adventure Count */}
                        <p className="text-sm text-gray-600">
                          {collection.adventures?.length || 0} adventures
                        </p>

                        {/* Date Range */}
                        {collection.startDate && collection.endDate && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              Dates: {new Date(collection.startDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} – {new Date(collection.endDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-200">
                        {isLinked ? (
                          <button
                            onClick={() => {
                              console.log('🔴 CollectionLink - Remove button clicked:', { collectionId, isLinked });
                              if (collectionId) {
                                onUnlink(collectionId);
                              } else {
                                console.error('❌ CollectionLink - No collectionId for unlink');
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Remove from Collection
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              console.log('🔵 CollectionLink - Add button clicked:', { collectionId, isLinked });
                              if (collectionId) {
                                onLink(collectionId);
                              } else {
                                console.error('❌ CollectionLink - No collectionId for link');
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Add to Collection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {linkedCount} collections linked
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
