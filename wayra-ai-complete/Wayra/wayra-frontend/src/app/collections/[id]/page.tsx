'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import adventureApi from '@/services/adventureApi';
import { Collection, Adventure } from '@/types/adventure';
import { ArrowLeft, Plus, MapPin, Calendar, Users, Globe, Lock, Edit, Trash2, FolderPlus, X } from 'lucide-react';
import CollectionModal from '@/components/adventure/CollectionModal';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [adventures, setAdventures] = useState<Adventure[]>([]); // All user adventures for the modal
  const [collectionAdventures, setCollectionAdventures] = useState<Adventure[]>([]); // Adventures in this collection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const collectionId = params.id as string;

  const loadCollectionDetails = useCallback(async () => {
    if (!user) {
      console.log('🔐 Collection Detail - No user, skipping load');
      setCollection(null);
      setAdventures([]);
      setCollectionAdventures([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!collectionId || collectionId === 'undefined') {
      console.error('❌ Collection Detail - Invalid collection ID:', collectionId);
      setError('Invalid collection ID');
      setLoading(false);
      return;
    }

    console.log('🔄 Collection Detail - Loading collection:', collectionId);
    console.log('🔐 Collection Detail - User:', user.email);

    try {
      setLoading(true);
      setError(null);

      // Load collection details
      console.log('📡 Collection Detail - Calling getCollection API...');
      const collectionResponse = await adventureApi.getCollection(collectionId);
      console.log('✅ Collection Detail - Collection loaded:', collectionResponse);
      setCollection(collectionResponse);
      
      // Set adventures that are in this collection
      setCollectionAdventures(collectionResponse.adventures || []);

      // Load all user adventures (to show in the add existing modal)
      console.log('📡 Collection Detail - Loading user adventures...');
      const adventuresResponse = await adventureApi.getAdventures({});
      console.log('✅ Collection Detail - Adventures loaded:', adventuresResponse);
      setAdventures(adventuresResponse.adventures || []);
    } catch (err: unknown) {
      console.error('❌ Collection Detail - Error loading collection details:', err);
      console.error('❌ Collection Detail - Error details:', {
        message: (err as any)?.message,
        response: (err as any)?.response,
        status: (err as any)?.response?.status,
        data: (err as any)?.response?.data
      });
      setError((err as any)?.response?.data?.error || 'Failed to load collection details');
    } finally {
      setLoading(false);
    }
  }, [user, collectionId]);

  useEffect(() => {
    if (user && collectionId) {
      loadCollectionDetails();
    }
  }, [user, collectionId, loadCollectionDetails]);

  const handleDeleteCollection = () => {
    console.log('🗑️ [COLLECTION DELETE] Delete collection clicked');
    console.log('🗑️ [COLLECTION DELETE] Collection object:', collection);
    
    if (!collection) {
      console.error('❌ [COLLECTION DELETE] No collection object found');
      return;
    }
    
    console.log('🗑️ [COLLECTION DELETE] Collection ID:', collection._id);
    console.log('🗑️ [COLLECTION DELETE] Collection name:', collection.name);
    console.log('🗑️ [COLLECTION DELETE] Opening confirmation modal');
    
    // Open the confirmation modal instead of using window.confirm
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    console.log('🗑️ [COLLECTION DELETE] User confirmed deletion, proceeding...');
    
    if (!collection) {
      console.error('❌ [COLLECTION DELETE] No collection object found during confirmation');
      return;
    }
    
    try {
      console.log('📡 [COLLECTION DELETE] Calling adventureApi.deleteCollection with ID:', collection._id);
      await adventureApi.deleteCollection(collection._id);
      console.log('✅ [COLLECTION DELETE] Collection deleted successfully, navigating to /collections');
      setIsDeleteConfirmOpen(false);
      router.push('/collections');
    } catch (err) {
      console.error('❌ [COLLECTION DELETE] Error deleting collection:', err);
      console.error('❌ [COLLECTION DELETE] Error details:', {
        message: (err as any)?.message,
        response: (err as any)?.response,
        status: (err as any)?.response?.status,
        data: (err as any)?.response?.data
      });
      setIsDeleteConfirmOpen(false);
      alert('Failed to delete collection. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    console.log('🗑️ [COLLECTION DELETE] User cancelled deletion');
    setIsDeleteConfirmOpen(false);
  };

  const handleEditCollection = () => {
    if (!collection) return;
    console.log('Edit collection:', collection._id);
    setIsEditModalOpen(true);
  };

  const handleCollectionUpdated = (updatedCollection: Collection) => {
    setCollection(updatedCollection);
    // Refresh the page to show updated data
    window.location.reload();
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view collection details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection details...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Collection Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The collection you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
                {collection.isPublic ? (
                  <Globe className="w-5 h-5 text-green-600" title="Public Collection" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" title="Private Collection" />
                )}
              </div>
              
              {collection.description && (
                <p className="text-gray-600 text-lg mb-4">{collection.description}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>{adventures.length} adventures</span>
                {collection.collaborators && collection.collaborators.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{collection.collaborators.length} collaborators</span>
                  </div>
                )}
                {(collection.startDate || collection.endDate) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {collection.startDate && collection.endDate ? (
                      <span>{formatDate(collection.startDate)} - {formatDate(collection.endDate)}</span>
                    ) : collection.startDate ? (
                      <span>Starts {formatDate(collection.startDate)}</span>
                    ) : (
                      <span>Ends {formatDate(collection.endDate!)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEditCollection}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDeleteCollection}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {collection.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Adventures */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Adventures</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/adventures/new?collectionId=${collection.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Adventure
              </button>
              <button
                onClick={() => setIsAddExistingOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                Add Existing Adventure
              </button>
            </div>
          </div>

          {collectionAdventures.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Adventures Yet</h3>
              <p className="text-gray-600 mb-6">Start adding adventures to this collection.</p>
              <button
                onClick={() => router.push(`/adventures/new?collectionId=${collection.id}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Adventure
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collectionAdventures.map((adventure) => (
                <div key={adventure._id || adventure.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{adventure.name}</h3>
                        {adventure.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">{adventure.description}</p>
                        )}
                      </div>
                    </div>

                    {adventure.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{adventure.location}</span>
                      </div>
                    )}

                    {adventure.visits && adventure.visits.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                        <Calendar className="w-3 h-3" />
                        {adventure.visits[0].startDate && adventure.visits[0].endDate ? (
                          <span>{formatDate(adventure.visits[0].startDate)} - {formatDate(adventure.visits[0].endDate)}</span>
                        ) : adventure.visits[0].startDate ? (
                          <span>Starts {formatDate(adventure.visits[0].startDate)}</span>
                        ) : (
                          <span>Last visited</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/adventures/${adventure._id || adventure.id}?from=collection&collectionId=${collection._id}`)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Adventure
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/adventures/${adventure.id || adventure._id}?from=collection&collectionId=${collection._id}`)}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => console.log('Delete adventure:', adventure.id)}
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
    </div>

    {/* Adventure Selection Modal for Adding Existing Adventures */}
    {isAddExistingOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <FolderPlus className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Add Adventures to Collection</h1>
                  <p className="text-sm text-gray-600">Select adventures to add to "{collection?.name}"</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddExistingOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {adventures.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Adventures Available</h3>
                <p className="text-gray-600 mb-6">You don't have any adventures to add to this collection yet.</p>
                <button
                  onClick={() => {
                    setIsAddExistingOpen(false);
                    router.push('/adventures/new');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Adventure
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adventures.map((adventure) => {
                  const isInCollection = collection?.adventures?.some(a => (a.id || a._id) === (adventure.id || adventure._id));
                  const currentCollectionId = collection?._id || collection?.id || collectionId;
                  return (
                    <div
                      key={adventure.id || adventure._id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isInCollection
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                      onClick={async () => {
                        if (!currentCollectionId) {
                          console.error('Collection ID is missing');
                          alert('Collection ID is missing. Please refresh the page.');
                          return;
                        }
                        
                        if (isInCollection) {
                          // Remove from collection
                          try {
                            await adventureApi.removeAdventureFromCollection(currentCollectionId, adventure.id || adventure._id!);
                            loadCollectionDetails();
                          } catch (error) {
                            console.error('Error removing adventure:', error);
                            alert('Failed to remove adventure from collection.');
                          }
                        } else {
                          // Add to collection
                          try {
                            await adventureApi.addAdventureToCollection(currentCollectionId, adventure.id || adventure._id!);
                            loadCollectionDetails();
                          } catch (error) {
                            console.error('Error adding adventure:', error);
                            alert('Failed to add adventure to collection.');
                          }
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{adventure.name}</h3>
                          {adventure.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{adventure.description}</p>
                          )}
                          {adventure.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{adventure.location}</span>
                            </div>
                          )}
                        </div>
                        <div className={`ml-4 p-2 rounded-full ${
                          isInCollection ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {isInCollection ? (
                            <span className="text-green-600 text-sm font-medium">✓ Added</span>
                          ) : (
                            <Plus className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddExistingOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Collection Edit Modal */}
    <CollectionModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onCollectionCreated={handleCollectionUpdated}
      collection={collection}
    />

    {/* Delete Confirmation Modal */}
    {isDeleteConfirmOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Collection</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete the collection <strong>&quot;{collection?.name}&quot;</strong>? 
            This will permanently remove the collection and all its associated data.
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete Collection
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
