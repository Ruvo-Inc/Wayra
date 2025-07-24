import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  StarIcon,
  CalendarIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  LinkIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  PlusIcon,
  PhotoIcon,
  ClockIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  TagIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Adventure, Visit, AdventureImage, Attachment, User, Category } from '../../types/adventure';
import adventureApi from '../../services/adventureApi';
import { AttachmentCard } from './AttachmentCard';
import { VisitCard } from '../visit/VisitCard';
import { VisitModal } from '../visit/VisitModal';
import { ChecklistCard } from '../collection/ChecklistCard';
import { NoteCard } from '../collection/NoteCard';
import { TransportationCard } from '../collection/TransportationCard';
import { LodgingCard } from '../collection/LodgingCard';
import { ShareModal } from '../common/ShareModal';
import { DeleteWarning } from '../common/DeleteWarning';
import { ImageDisplayModal } from '../common/ImageDisplayModal';
import { CollectionLink } from '../common/CollectionLink';

interface AdventureDetailViewProps {
  adventureId: string;
  user?: User | null;
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (adventureId: string) => void;
  onBack?: () => void;
  className?: string;
}

export const AdventureDetailView: React.FC<AdventureDetailViewProps> = ({
  adventureId,
  user = null,
  onEdit,
  onDelete,
  onBack,
  className = ''
}) => {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [images, setImages] = useState<AdventureImage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'media' | 'notes' | 'checklist' | 'transportation' | 'lodging'>('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [isCollectionLinkOpen, setIsCollectionLinkOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAdventureDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Handle 'new' adventure ID case - don't try to load non-existent adventure
      if (adventureId === 'new') {
        console.log('🆕 Adventure ID is "new" - skipping load, this should be handled by create flow');
        setLoading(false);
        setError('Cannot load adventure details for new adventure. Use the create adventure flow instead.');
        return;
      }

      // Wait for auth to be ready and check if user is authenticated
      if (authLoading) {
        console.log('🔐 Auth still loading, waiting...');
        return;
      }

      if (!authUser) {
        throw new Error('Authentication required');
      }

      // Get authentication token from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      console.log('🔐 AdventureDetailView - Auth token retrieved, length:', token.length);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load adventure data
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/adventures/${adventureId}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to load adventure');
      }
      const adventureData = await response.json();
      
      // Debug: Log the adventure data returned from backend
      console.log('🔍 AdventureDetailView - Backend adventure data:', {
        id: adventureData._id || adventureData.id,
        name: adventureData.name,
        collections: adventureData.collections,
        collectionsLength: adventureData.collections?.length || 0
      });
      
      // Load related data
      const [visitsResponse, imagesResponse, attachmentsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/adventures/${adventureId}/visits`, { headers }),
        fetch(`${baseUrl}/api/adventures/${adventureId}/images`, { headers }),
        fetch(`${baseUrl}/api/adventures/${adventureId}/attachments`, { headers })
      ]);

      const visitsData = visitsResponse.ok ? await visitsResponse.json() : [];
      const imagesData = imagesResponse.ok ? await imagesResponse.json() : [];
      const attachmentsData = attachmentsResponse.ok ? await attachmentsResponse.json() : [];

      setAdventure(adventureData);
      setVisits(visitsData);
      setImages(imagesData);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error('Error loading adventure details:', err);
      setError('Failed to load adventure details');
    } finally {
      setLoading(false);
    }
  }, [adventureId, authLoading, authUser]);

  useEffect(() => {
    // Only load adventure details when auth is ready and user is authenticated
    if (!authLoading && authUser) {
      loadAdventureDetails();
    }
  }, [loadAdventureDetails, authLoading, authUser]);

  const handleMarkAsVisited = async () => {
    if (!adventure) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/adventures/${adventure.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVisited: true })
      });
      
      if (response.ok) {
        const updatedAdventure = await response.json();
        setAdventure(updatedAdventure);
      }
    } catch (err) {
      console.error('Error marking as visited:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!adventure || !user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/adventures/${adventure.id}/favorite`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updatedAdventure = await response.json();
        setAdventure(updatedAdventure);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleDelete = async () => {
    if (!adventure || !onDelete) {
      console.log('🚫 Delete blocked - adventure:', !!adventure, 'onDelete:', !!onDelete);
      return;
    }

    const adventureId = adventure._id || adventure.id;
    console.log('🗑️ Delete adventure clicked:', adventureId);
    console.log('🔍 onDelete function type:', typeof onDelete);
    
    if (!adventureId) {
      console.error('No adventure ID found for deletion');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📞 Calling onDelete with adventureId:', adventureId);
      await onDelete(adventureId);
      console.log('✅ onDelete completed successfully');
      router.back();
    } catch (err) {
      console.error('❌ Error in onDelete:', err);
    } finally {
      setIsLoading(false);
      setIsDeleteWarningOpen(false);
    }
  };

  const handleVisitSave = async (visitData: Partial<Visit>) => {
    try {
      setIsLoading(true);
      console.log('🔍 Creating visit with data:', visitData);
      console.log('🔍 Adventure object:', adventure);
      console.log('🔍 Adventure ID from adventure object:', adventure?.id);
      
      const token = authUser ? await authUser.getIdToken() : null;
      console.log('🔐 Visit creation - Auth token retrieved, length:', token?.length || 'No token');
      console.log('🔐 Auth user:', authUser ? 'Present' : 'Missing');
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const apiUrl = `${baseUrl}/api/visits`;
      console.log('🌐 Visit creation - API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(visitData)
      });
      
      console.log('📡 Visit creation API response status:', response.status);
      
      if (response.ok) {
        const newVisit = await response.json();
        console.log('✅ Visit created successfully:', newVisit);
        setVisits(prev => [...prev, newVisit]);
        setIsVisitModalOpen(false);
      } else {
        const errorData = await response.text();
        console.error('❌ Visit creation failed:', response.status, errorData);
      }
    } catch (err) {
      console.error('❌ Error saving visit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < rating ? (
          <StarIconSolid className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIcon className="h-5 w-5 text-gray-300" />
        )}
      </span>
    ));
  };

  // Fix permission check for development mode - use authUser from useAuth hook
  const currentUser = authUser || user; // Prefer authUser from context, fallback to prop
  const canEdit = currentUser && (currentUser.uid === adventure?.userId || currentUser.email === adventure?.userId || 
    // Development mode: allow editing if user is authenticated
    (process.env.NODE_ENV === 'development' && adventure?.userId === 'dev-user-123'));
  const isOwner = canEdit;
  
  console.log('🔐 Edit Permission Debug:', {
    authUser: authUser ? 'Present' : 'Missing',
    authUserUid: authUser?.uid,
    authUserEmail: authUser?.email,
    userProp: user ? 'Present' : 'Missing',
    currentUser: currentUser ? 'Present' : 'Missing',
    adventureUserId: adventure?.userId,
    canEdit,
    isOwner,
    isDevelopment: process.env.NODE_ENV === 'development'
  });
  const isFavorite = (adventure as any)?.isFavorite || false;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadAdventureDetails}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Adventure not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {isVisitModalOpen && (
        <VisitModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
          onSave={handleVisitSave}
          adventure={adventure}
          title="Add Visit"
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          adventure={adventure}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {isDeleteWarningOpen && (
        <DeleteWarning
          title="Delete Adventure"
          description={`Are you sure you want to delete "${adventure.name}"? This action cannot be undone.`}
          buttonText="Delete Adventure"
          isOpen={isDeleteWarningOpen}
          onClose={() => setIsDeleteWarningOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      {isCollectionLinkOpen && (
        <CollectionLink
          isOpen={isCollectionLinkOpen}
          onClose={() => setIsCollectionLinkOpen(false)}
          linkedCollectionList={(() => {
            console.log('🔍 AdventureDetailView - Debug adventure.collections:', adventure.collections);
            return adventure.collections || [];
          })()}
          onLink={async (collectionId: string) => {
            try {
              console.log('🔗 Adding adventure to collection:', { adventureId: adventure._id || adventure.id, collectionId });
              await adventureApi.addAdventureToCollection(collectionId, adventure._id || adventure.id);
              console.log('✅ Adventure successfully added to collection');
              
              // Frontend workaround: manually update collections array
              const updatedCollections = [...(adventure.collections || []), collectionId];
              setAdventure(prev => prev ? { ...prev, collections: updatedCollections } : prev);
              console.log('🔄 Frontend: Updated adventure.collections to:', updatedCollections);
              
              // Also refresh adventure data from backend
              loadAdventureDetails();
            } catch (error) {
              console.error('❌ Error adding adventure to collection:', error);
              alert('Failed to add adventure to collection. Please try again.');
            }
          }}
          onUnlink={async (collectionId: string) => {
            try {
              console.log('🔗 Removing adventure from collection:', { adventureId: adventure._id || adventure.id, collectionId });
              await adventureApi.removeAdventureFromCollection(collectionId, adventure._id || adventure.id);
              console.log('✅ Adventure successfully removed from collection');
              
              // Frontend workaround: manually update collections array
              const updatedCollections = (adventure.collections || []).filter(id => id !== collectionId);
              setAdventure(prev => prev ? { ...prev, collections: updatedCollections } : prev);
              console.log('🔄 Frontend: Updated adventure.collections to:', updatedCollections);
              
              // Also refresh adventure data from backend
              loadAdventureDetails();
            } catch (error) {
              console.error('❌ Error removing adventure from collection:', error);
              alert('Failed to remove adventure from collection. Please try again.');
            }
          }}
        />
      )}

      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <ImageDisplayModal
          isOpen={selectedImageIndex !== null}
          onClose={() => setSelectedImageIndex(null)}
          imageUrl={images[selectedImageIndex].url}
          adventureTitle={adventure.name}
        />
      )}

      <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="relative">
          {/* Hero Image */}
          {images.length > 0 && (
            <div className="relative h-64 md:h-80 bg-gray-200">
              <img
                src={images[0].url}
                alt={adventure.name}
                className="w-full h-full object-cover"
                onClick={() => setSelectedImageIndex(0)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(0)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  1 / {images.length}
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            {user && (
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                }`}
                disabled={isLoading}
              >
                {isFavorite ? (
                  <HeartIconSolid className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
            )}
            
            <button
              onClick={handleShare}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            
            {isOwner && (
              <div className="relative">
                <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
                {/* Dropdown menu would go here */}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Basic Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{adventure.name}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  {adventure.category && (
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{adventure.category.icon}</span>
                      <span className="text-sm">{adventure.category.name}</span>
                    </div>
                  )}
                  
                  {adventure.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm">{adventure.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    {adventure.isPublic ? (
                      <>
                        <GlobeAltIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">Public</span>
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">Private</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Visit Status */}
              <div className="flex items-center space-x-2">
                {adventure.isVisited ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Visited
                  </span>
                ) : (
                  <button
                    onClick={handleMarkAsVisited}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    disabled={isLoading}
                  >
                    <EyeSlashIcon className="w-4 h-4 mr-1" />
                    Mark as Visited
                  </button>
                )}
              </div>
            </div>

            {/* Rating */}
            {adventure.rating && (
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-2">
                  {renderStars(adventure.rating)}
                </div>
                <span className="text-sm text-gray-600">({adventure.rating}/5)</span>
              </div>
            )}

            {/* Description */}
            {adventure.description && (
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{adventure.description}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Visit
            </button>
            
            <button
              onClick={() => setIsCollectionLinkOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Add to Collection
            </button>
            
            {adventure.link && (
              <a
                href={adventure.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Open Link
              </a>
            )}
            
            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(adventure)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            
            {isOwner && onDelete && (
              <button
                onClick={() => setIsDeleteWarningOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: DocumentIcon },
                { id: 'visits', label: `Visits (${visits.length})`, icon: CalendarIcon },
                { id: 'media', label: `Media (${images.length})`, icon: PhotoIcon },
                { id: 'notes', label: 'Notes', icon: DocumentIcon },
                { id: 'checklist', label: 'Checklist', icon: CheckIcon },
                { id: 'transportation', label: 'Transportation', icon: ClockIcon },
                { id: 'lodging', label: 'Lodging', icon: UserIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Details</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(adventure.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      {adventure.coordinates && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                          <dd className="text-sm text-gray-900">
                            {adventure.coordinates.coordinates[1].toFixed(6)}, {adventure.coordinates.coordinates[0].toFixed(6)}
                          </dd>
                        </div>
                      )}
                      {adventure.activityTypes && adventure.activityTypes.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Activity Types</dt>
                          <dd className="text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1 mt-1">
                              {adventure.activityTypes.map((type, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  <TagIcon className="w-3 h-3 mr-1" />
                                  {type.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="space-y-4">
                {visits.length > 0 ? (
                  visits.map((visit) => (
                    <VisitCard
                      key={visit.id}
                      visit={visit}
                      onEdit={(v) => console.log('Edit visit:', v)}
                      onDelete={(id) => console.log('Delete visit:', id)}
                      onToggleVisited={(id, visited) => console.log('Toggle visited:', id, visited)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No visits recorded yet</p>
                    <button
                      onClick={() => setIsVisitModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Your First Visit
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-4">
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={image.url}
                          alt={`${adventure.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No images uploaded yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Notes would be rendered here using NoteCard components */}
                <div className="text-center py-8">
                  <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notes added yet</p>
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-4">
                {/* Checklist items would be rendered here using ChecklistCard components */}
                <div className="text-center py-8">
                  <CheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No checklist items added yet</p>
                </div>
              </div>
            )}

            {activeTab === 'transportation' && (
              <div className="space-y-4">
                {/* Transportation would be rendered here using TransportationCard components */}
                <div className="text-center py-8">
                  <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transportation added yet</p>
                </div>
              </div>
            )}

            {activeTab === 'lodging' && (
              <div className="space-y-4">
                {/* Lodging would be rendered here using LodgingCard components */}
                <div className="text-center py-8">
                  <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No lodging added yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdventureDetailView;
