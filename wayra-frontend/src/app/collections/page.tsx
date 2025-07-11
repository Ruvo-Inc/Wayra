'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Lock, Globe } from 'lucide-react';
import adventureApi from '@/services/adventureApi';
import { Collection, CollectionFilters } from '@/types/adventure';
import { useAuth } from '@/contexts/AuthContext';

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CollectionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCollections();
  }, [filters]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adventureApi.getCollections({
        ...filters,
        search: searchQuery || undefined,
      });
      setCollections(response.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdventures();
  };

  const handleCreateCollection = () => {
    // TODO: Implement create collection modal/page
    console.log('Create collection clicked');
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await adventureApi.deleteCollection(collectionId);
      setCollections(prev => prev.filter(c => c.id !== collectionId));
    } catch (err) {
      console.error('Error deleting collection:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your collections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Collections</h1>
              <p className="text-sm text-gray-600">Organize your adventures into meaningful collections</p>
            </div>
            <button
              onClick={handleCreateCollection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Collection
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadCollections}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-6">Create collections to organize your adventures by theme, destination, or trip.</p>
            <button
              onClick={handleCreateCollection}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Collection Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{collection.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {collection.isPublic ? (
                        <Globe className="w-4 h-4 text-green-600" title="Public" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" title="Private" />
                      )}
                    </div>
                  </div>

                  {/* Collection Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>{collection.adventures?.length || 0} adventures</span>
                    {collection.collaborators && collection.collaborators.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{collection.collaborators.length} collaborators</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  {(collection.startDate || collection.endDate) && (
                    <div className="text-sm text-gray-600 mb-4">
                      {collection.startDate && collection.endDate ? (
                        <span>{formatDate(collection.startDate)} - {formatDate(collection.endDate)}</span>
                      ) : collection.startDate ? (
                        <span>Starts {formatDate(collection.startDate)}</span>
                      ) : (
                        <span>Ends {formatDate(collection.endDate!)}</span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {collection.tags && collection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {collection.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {collection.tags.length > 3 && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{collection.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => window.location.href = `/collections/${collection.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Collection
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => console.log('Edit collection:', collection.id)}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
