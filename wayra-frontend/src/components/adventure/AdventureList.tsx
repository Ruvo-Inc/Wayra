'use client';

import React, { useState, useEffect } from 'react';
import { Adventure, AdventureFilters } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { AdventureCard } from './AdventureCard';
import { AdventureModal } from './AdventureModal';
import { AdventureFiltersComponent } from './AdventureFilters';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { EmptyState } from '../ui/EmptyState';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AdventureListProps {
  showFilters?: boolean;
  showCreateButton?: boolean;
  collectionId?: string;
  limit?: number;
  className?: string;
}

export const AdventureList: React.FC<AdventureListProps> = ({
  showFilters = true,
  showCreateButton = true,
  collectionId,
  limit,
  className = ''
}) => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdventureFilters>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const adventureApi = new AdventureApi();

  const loadAdventures = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: limit || 20,
        ...filters,
        collectionId
      };

      const response = await adventureApi.getAdventures(params);
      
      if (page === 1) {
        setAdventures(response.adventures);
      } else {
        setAdventures(prev => [...prev, ...response.adventures]);
      }

      setPagination({
        page: response.currentPage,
        totalPages: response.totalPages,
        total: response.total
      });
    } catch (err) {
      console.error('Error loading adventures:', err);
      setError('Failed to load adventures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdventures();
  }, [filters, collectionId]);

  const handleFilterChange = (newFilters: AdventureFilters) => {
    setFilters(newFilters);
  };

  const handleCreateAdventure = () => {
    setSelectedAdventure(null);
    setShowModal(true);
  };

  const handleEditAdventure = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    setShowModal(true);
  };

  const handleAdventureSaved = (adventure: Adventure) => {
    if (selectedAdventure) {
      // Update existing adventure
      setAdventures(prev => 
        prev.map(a => a.id === adventure.id ? adventure : a)
      );
    } else {
      // Add new adventure
      setAdventures(prev => [adventure, ...prev]);
    }
    setShowModal(false);
    setSelectedAdventure(null);
  };

  const handleAdventureDeleted = (adventureId: string) => {
    setAdventures(prev => prev.filter(a => a.id !== adventureId));
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      loadAdventures(pagination.page + 1);
    }
  };

  if (loading && adventures.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Adventures</h2>
          <p className="text-gray-600">
            {pagination.total} adventure{pagination.total !== 1 ? 's' : ''}
            {filters.isVisited !== undefined && (
              filters.isVisited ? ' visited' : ' planned'
            )}
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={handleCreateAdventure}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Adventure
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <AdventureFiltersComponent
          filters={filters}
          onFiltersChange={handleFilterChange}
        />
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => loadAdventures()} 
        />
      )}

      {/* Empty State */}
      {!loading && adventures.length === 0 && !error && (
        <EmptyState
          title="No adventures found"
          description={
            Object.keys(filters).length > 0
              ? "Try adjusting your filters to see more adventures."
              : "Create your first adventure to get started!"
          }
          action={
            showCreateButton ? {
              label: "Create Adventure",
              onClick: handleCreateAdventure
            } : undefined
          }
        />
      )}

      {/* Adventures Grid */}
      {adventures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adventures.map((adventure) => (
            <AdventureCard
              key={adventure.id}
              adventure={adventure}
              onEdit={handleEditAdventure}
              onDelete={handleAdventureDeleted}
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

      {/* Adventure Modal */}
      {showModal && (
        <AdventureModal
          adventure={selectedAdventure}
          onSave={handleAdventureSaved}
          onClose={() => {
            setShowModal(false);
            setSelectedAdventure(null);
          }}
        />
      )}
    </div>
  );
};
