'use client';

import React, { useState, useEffect } from 'react';
import { Collection, CollectionFilters } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { CollectionCard } from './CollectionCard';
import CollectionModal from '../adventure/CollectionModal';
import { CollectionFiltersComponent } from './CollectionFilters';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { EmptyState } from '../ui/EmptyState';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface CollectionListProps {
  showFilters?: boolean;
  showCreateButton?: boolean;
  limit?: number;
  className?: string;
}

export const CollectionList: React.FC<CollectionListProps> = ({
  showFilters = true,
  showCreateButton = true,
  limit,
  className = ''
}) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CollectionFilters>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const adventureApi = new AdventureApi();

  const loadCollections = async (page = 1) => {
    // Don't make API calls if user is not authenticated
    if (!user) {
      setLoading(false);
      setError('Please sign in to view collections');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: limit || 20,
        ...filters
      };

      const response = await adventureApi.getCollections(params);
      
      if (page === 1) {
        setCollections(response.collections);
      } else {
        setCollections(prev => [...prev, ...response.collections]);
      }

      setPagination({
        page: response.currentPage,
        totalPages: response.totalPages,
        total: response.total
      });
    } catch (err) {
      console.error('Error loading collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCollections();
    } else {
      setLoading(false);
    }
  }, [filters, user]);

  const handleFilterChange = (newFilters: CollectionFilters) => {
    setFilters(newFilters);
  };

  const handleCreateCollection = () => {
    setSelectedCollection(null);
    setShowModal(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowModal(true);
  };

  const handleCollectionSaved = (collection: Collection) => {
    if (selectedCollection) {
      // Update existing collection
      setCollections(prev => 
        prev.map(c => c.id === collection.id ? collection : c)
      );
    } else {
      // Add new collection
      setCollections(prev => [collection, ...prev]);
    }
    setShowModal(false);
    setSelectedCollection(null);
  };

  const handleCollectionDeleted = (collectionId: string) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      loadCollections(pagination.page + 1);
    }
  };

  if (loading && collections.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
          <p className="text-gray-600">
            {pagination.total} collection{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={handleCreateCollection}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Collection
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <CollectionFiltersComponent
          filters={filters}
          onFiltersChange={handleFilterChange}
        />
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => loadCollections()} 
        />
      )}

      {/* Empty State */}
      {!loading && collections.length === 0 && !error && (
        <EmptyState
          title="No collections found"
          description={
            Object.keys(filters).length > 0
              ? "Try adjusting your filters to see more collections."
              : "Create your first collection to organize your adventures!"
          }
          action={
            showCreateButton ? {
              label: "Create Collection",
              onClick: handleCreateCollection
            } : undefined
          }
        />
      )}

      {/* Collections Grid */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={handleEditCollection}
              onDelete={handleCollectionDeleted}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {pagination.page < pagination.totalPages && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Collection Modal */}
      {showModal && (
        <CollectionModal
          collection={selectedCollection}
          onSave={handleCollectionSaved}
          onClose={() => {
            setShowModal(false);
            setSelectedCollection(null);
          }}
        />
      )}
    </div>
  );
};
