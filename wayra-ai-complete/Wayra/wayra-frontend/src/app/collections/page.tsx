'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Users, Lock, Globe, Trash2 } from 'lucide-react';
import CollectionModal from '@/components/adventure/CollectionModal';
import adventureApi from '@/services/adventureApi';
import { Collection, CollectionFilters } from '@/types/adventure';
import { useAuth } from '@/contexts/AuthContext';

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<CollectionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

  const loadCollections = useCallback(async () => {
    if (!user) {
      setError('Please sign in to view your collections');
      setLoading(false);
      return;
    }

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
  }, [user, filters, searchQuery]);

  useEffect(() => {
    if (user) {
      loadCollections();
    } else {
      setLoading(false);
    }
  }, [filters, user, loadCollections]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCollections();
  };

  const handleCreateCollection = () => {
    setShowCreateModal(true);
  };

  const handleCollectionCreated = (collection: Collection) => {
    setCollections(prev => [collection, ...prev]);
  };

  const handleDeleteCollection = (collection: Collection) => {
    console.log('Opening delete confirmation modal for collection:', collection);
    setDeletingCollection(collection);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCollection) return;
    
    console.log('Confirming delete for collection:', deletingCollection._id);
    
    try {
      await adventureApi.deleteCollection(deletingCollection._id);
      setCollections(prev => prev.filter(c => (c._id || c.id) !== deletingCollection._id));
      setShowDeleteModal(false);
      setDeletingCollection(null);
      console.log('Collection deleted successfully');
    } catch (err) {
      console.error('Error deleting collection:', err);
      alert('Failed to delete collection. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    console.log('Delete cancelled');
    setShowDeleteModal(false);
    setDeletingCollection(null);
  };

  const handleEditCollection = (collection: Collection) => {
    console.log('Opening edit modal for collection:', collection);
    setEditingCollection(collection);
    setShowEditModal(true);
  };

  const handleCollectionUpdated = (updatedCollection: Collection) => {
    setCollections(prev => prev.map(c => 
      (c._id || c.id) === (updatedCollection._id || updatedCollection.id) ? updatedCollection : c
    ));
    setEditingCollection(null);
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
              <div key={collection._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
                        <Globe className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
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
                          key={`${collection._id}-tag-${index}`}
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
                      onClick={() => window.location.href = `/collections/${collection._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Collection
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCollection(collection)}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection)}
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
      
      {/* Collection Creation Modal */}
      <CollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCollectionCreated={handleCollectionCreated}
      />
      
      {/* Collection Edit Modal */}
      <CollectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCollection(null);
        }}
        onCollectionCreated={handleCollectionUpdated}
        collection={editingCollection || undefined}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Delete Collection</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete the collection <strong>&ldquo;{deletingCollection?.name}&rdquo;</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone and will permanently remove the collection and all its data.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
