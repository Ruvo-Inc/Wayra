import React, { useState } from 'react';
import Image from 'next/image';
import {
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Adventure, User } from '../../types/adventure';
import { DeleteWarning } from '../common/DeleteWarning';

interface AdventureCardProps {
  adventure: Adventure;
  user?: User | null;
  readOnly?: boolean;
  showVisitStatus?: boolean;
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (adventureId: string) => void;
  onAddToCollection?: (adventureId: string) => void;
  onToggleVisibility?: (adventureId: string, isPublic: boolean) => void;
  onToggleFavorite?: (adventureId: string, isFavorite: boolean) => void;
  onShare?: (adventure: Adventure) => void;
  className?: string;
}

export const AdventureCard: React.FC<AdventureCardProps> = ({
  adventure,
  user = null,
  readOnly = false,
  showVisitStatus = true,
  onEdit,
  onDelete,
  onAddToCollection,
  onToggleVisibility,
  onToggleFavorite,
  onShare,
  className = ''
}) => {
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canEdit = user && adventure.userId === user.id && !readOnly;
  const primaryImage = adventure.images?.find(img => img.isPrimary) || adventure.images?.[0];

  const handleEdit = () => {
    if (onEdit && canEdit) {
      onEdit(adventure);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      if (onDelete && canEdit) {
        await onDelete(adventure.id);
      }
    } catch (error) {
      console.error('Error deleting adventure:', error);
    } finally {
      setIsLoading(false);
      setIsWarningModalOpen(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (onToggleFavorite && user) {
      try {
        setIsLoading(true);
        await onToggleFavorite(adventure.id, !(adventure as any).isFavorite);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(adventure);
    }
  };

  const handleToggleVisibility = () => {
    if (onToggleVisibility && canEdit) {
      onToggleVisibility(adventure.id, !adventure.isPublic);
    }
  };

  const handleAddToCollection = () => {
    console.log('🎯 AdventureCard handleAddToCollection called');
    console.log('🎯 adventure object:', adventure);
    console.log('🎯 adventure.id:', adventure.id);
    console.log('🎯 adventure._id:', adventure._id);
    if (onAddToCollection) {
      const adventureId = adventure.id || adventure._id;
      console.log('🎯 Using adventureId:', adventureId);
      onAddToCollection(adventureId);
    }
  };

  const handleCardClick = () => {
    console.log('🎯 Adventure card clicked:', adventure);
    if (onEdit) {
      onEdit(adventure);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityTypeEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      general: '🌍',
      outdoor: '🏞️',
      lodging: '🛌',
      dining: '🍽️',
      activity: '🏄',
      attraction: '🎢',
      shopping: '🛍️',
      nightlife: '🌃',
      event: '🎉',
      transportation: '🚗',
      culture: '🎭',
      water_sports: '🚤',
      hiking: '🥾',
      wildlife: '🦒',
      historical_sites: '🏛️',
      music_concerts: '🎶',
      fitness: '🏋️',
      art_museums: '🎨',
      festivals: '🎪',
      spiritual_journeys: '🧘‍♀️',
      volunteer_work: '🤝',
      other: '📍'
    };
    return emojiMap[type] || '📍';
  };

  const displayActivityTypes = adventure.activityTypes?.slice(0, 3) || [];
  const remainingCount = (adventure.activityTypes?.length || 0) - 3;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        {primaryImage && !imageError ? (
          <Image
            src={primaryImage.url}
            alt={adventure.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <MapPinIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay with actions */}
        <div className="absolute top-2 right-2 flex gap-1">
          {canEdit && (
            <>
              <button
                onClick={handleToggleVisibility}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title={adventure.isPublic ? 'Make Private' : 'Make Public'}
              >
                {adventure.isPublic ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleEdit}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title="Edit Adventure"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {showVisitStatus && adventure.isVisited && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
              <EyeIcon className="w-3 h-3" />
              Visited
            </span>
          )}
          {(adventure as any).isFavorite && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
              <HeartIcon className="w-3 h-3 fill-current" />
              Favorite
            </span>
          )}
        </div>

        {/* Rating */}
        {adventure.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
            <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-white text-xs font-medium">{adventure.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title and Location */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
            {adventure.name}
          </h3>
          {adventure.location && (
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <MapPinIcon className="w-3 h-3" />
              <span className="line-clamp-1">{adventure.location}</span>
            </div>
          )}
        </div>

        {/* Geographic Info */}
        {(adventure as any).geographic && (
          <div className="mb-3 text-sm text-gray-600">
            {(adventure as any).geographic.city && (
              <>
                <span>{(adventure as any).geographic.city}</span>
                {(adventure as any).geographic.state && <span>, {(adventure as any).geographic.state}</span>}
                {(adventure as any).geographic.country && <span>, {(adventure as any).geographic.country}</span>}
              </>
            )}
          </div>
        )}

        {/* Activity Types */}
        {displayActivityTypes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {displayActivityTypes.map((type, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                <span>{getActivityTypeEmoji(type)}</span>
                <span className="capitalize">{type.replace('_', ' ')}</span>
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{remainingCount} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {adventure.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {adventure.description}
          </p>
        )}

        {/* Visit Dates */}
        {adventure.visits && adventure.visits.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <CalendarIcon className="w-3 h-3" />
              <span>
                {adventure.visits.length === 1 
                  ? formatDate(adventure.visits[0].startDate)
                  : `${adventure.visits.length} visits`
                }
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            {adventure.link && (
              <a
                href={adventure.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Open Link"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            )}
            
            {!readOnly && (
              <button
                onClick={handleAddToCollection}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Add to Collection"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1">
            {user && (
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  (adventure as any).isFavorite
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
                title={(adventure as any).isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                disabled={isLoading}
              >
                <HeartIcon className={`w-4 h-4 ${(adventure as any).isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            
            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Share Adventure"
              disabled={isLoading}
            >
              <ShareIcon className="w-4 h-4" />
            </button>
            
            {canEdit && (
              <button
                onClick={() => setIsWarningModalOpen(true)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Adventure"
                disabled={isLoading}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Warning Modal */}
      {isWarningModalOpen && (
        <DeleteWarning
          title="Delete Adventure"
          description={`Are you sure you want to delete "${adventure.name}"? This action cannot be undone.`}
          buttonText="Delete Adventure"
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default AdventureCard;
