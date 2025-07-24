'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Collection, Adventure } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { AdventureCard } from '../adventure/AdventureCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { 
  FolderIcon,
  MapPinIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface CollectionDetailViewProps {
  collectionId: string;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collectionId: string) => void;
  className?: string;
}

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({
  collectionId,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'adventures'>('adventures');

  const adventureApi = useMemo(() => new AdventureApi(), []);

  const loadCollectionDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 CollectionDetailView - Starting to load collection details');
      console.log('🔍 CollectionDetailView - Collection ID:', collectionId);
      console.log('🔍 CollectionDetailView - Collection ID type:', typeof collectionId);
      console.log('🔍 CollectionDetailView - Collection ID length:', collectionId?.length);
      console.log('🔍 CollectionDetailView - Collection ID valid ObjectId format:', /^[0-9a-fA-F]{24}$/.test(collectionId));

      const collectionData = await adventureApi.getCollection(collectionId);
      console.log('✅ CollectionDetailView - getCollection success:', collectionData);

      setCollection(collectionData);
      // Fix type error: adventures should be Adventure[] not string[]
      setAdventures(Array.isArray(collectionData.adventures) ? collectionData.adventures : []);
      console.log('✅ CollectionDetailView - All data loaded and state updated successfully');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ CollectionDetailView - Error loading collection details:', error);
      console.error('❌ CollectionDetailView - Error name:', error?.name);
      console.error('❌ CollectionDetailView - Error message:', error?.message);
      console.error('❌ CollectionDetailView - Error stack:', error?.stack);
      setError(`Failed to load collection details: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [collectionId, adventureApi]);

  useEffect(() => {
    loadCollectionDetails();
  }, [loadCollectionDetails]);

  const handleArchiveToggle = async () => {
    if (!collection || !collection.id) return;

    try {
      const updatedCollection = await adventureApi.updateCollection(collection.id, {
        isArchived: !collection.isArchived
      });
      setCollection(updatedCollection);
    } catch (err) {
      console.error('Error toggling archive status:', err);
    }
  };

  const handleVisibilityToggle = async () => {
    if (!collection || !collection.id) return;

    try {
      const updatedCollection = await adventureApi.updateCollection(collection.id, {
        isPublic: !collection.isPublic
      });
      setCollection(updatedCollection);
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className={className}>
        <ErrorMessage message="Collection not found" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'adventures',
      label: 'Adventures',
      count: adventures.length
    }
  ];

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FolderIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
              <div className="flex items-center mt-1 space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>{adventures.length} adventures</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  {collection.isPublic ? (
                    <>
                      <GlobeAltIcon className="h-4 w-4 mr-1" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-4 w-4 mr-1" />
                      <span>Private</span>
                    </>
                  )}
                </div>
                {collection.isArchived && (
                  <div className="flex items-center text-sm text-gray-500">
                    <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                    <span>Archived</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleArchiveToggle}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArchiveBoxIcon className="h-4 w-4 mr-1" />
              {collection.isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={handleVisibilityToggle}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {collection.isPublic ? (
                <>
                  <LockClosedIcon className="h-4 w-4 mr-1" />
                  Make Private
                </>
              ) : (
                <>
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Make Public
                </>
              )}
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(collection)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(collection.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'adventures')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'adventures' && (
          <div className="space-y-6">
            {adventures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adventures.map((adventure) => (
                  <AdventureCard
                    key={adventure.id}
                    adventure={adventure}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No adventures</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add adventures to this collection to get started.
                </p>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};
