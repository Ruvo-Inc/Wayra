'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Star, Eye, EyeOff, ExternalLink, Edit, Trash2, Plus } from 'lucide-react';
import { Adventure, User } from '@/types/adventure';

interface AdventureCardProps {
  adventure: Adventure;
  user: User | null;
  readOnly?: boolean;
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (adventureId: string) => void;
  onAddToCollection?: (adventureId: string) => void;
  onToggleVisibility?: (adventureId: string, isPublic: boolean) => void;
}

export default function AdventureCard({
  adventure,
  user,
  readOnly = false,
  onEdit,
  onDelete,
  onAddToCollection,
  onToggleVisibility
}: AdventureCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  const canEdit = user && adventure.userId === user.id && !readOnly;
  const primaryImage = adventure.images?.find(img => img.isPrimary) || adventure.images?.[0];

  const handleEdit = () => {
    if (onEdit && canEdit) {
      onEdit(adventure);
    }
  };

  const handleDelete = () => {
    if (onDelete && canEdit) {
      onDelete(adventure.id);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleVisibility = () => {
    if (onToggleVisibility && canEdit) {
      onToggleVisibility(adventure.id, !adventure.isPublic);
    }
  };

  const handleAddToCollection = () => {
    if (onAddToCollection) {
      onAddToCollection(adventure.id);
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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
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
            <MapPin className="w-12 h-12 text-gray-400" />
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
                {adventure.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={handleEdit}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title="Edit Adventure"
              >
                <Edit className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Visit Status Badge */}
        {adventure.isVisited && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              Visited
            </span>
          </div>
        )}

        {/* Rating */}
        {adventure.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
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
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{adventure.location}</span>
            </div>
          )}
        </div>

        {/* Geographic Info */}
        {adventure.geographic && (
          <div className="mb-3 text-sm text-gray-600">
            {adventure.geographic.city && (
              <span>{adventure.geographic.city}</span>
            )}
            {adventure.geographic.region && adventure.geographic.city && (
              <span>, </span>
            )}
            {adventure.geographic.region && (
              <span>{adventure.geographic.region}</span>
            )}
            {adventure.geographic.country && (
              <>
                {(adventure.geographic.city || adventure.geographic.region) && <span>, </span>}
                <span>{adventure.geographic.country}</span>
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
              <Calendar className="w-3 h-3" />
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
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            
            {!readOnly && (
              <button
                onClick={handleAddToCollection}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Add to Collection"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {canEdit && (
            <div className="flex gap-1">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Adventure"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Adventure</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{adventure.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

