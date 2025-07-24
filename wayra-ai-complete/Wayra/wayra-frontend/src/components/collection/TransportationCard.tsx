import React, { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Transportation, Collection, User } from '../../types/adventure';

interface TransportationCardProps {
  transportation: Transportation;
  user?: User | null;
  collection?: Collection | null;
  onEdit?: (transportation: Transportation) => void;
  onDelete?: (transportationId: string) => void;
  className?: string;
}

const TRANSPORTATION_TYPE_ICONS: Record<string, string> = {
  car: '🚗',
  plane: '✈️',
  train: '🚂',
  bus: '🚌',
  boat: '🚢',
  bike: '🚲',
  walking: '🚶',
  other: '🚗'
};

const TRANSPORTATION_TYPE_LABELS: Record<string, string> = {
  car: 'Car',
  plane: 'Plane',
  train: 'Train',
  bus: 'Bus',
  boat: 'Boat',
  bike: 'Bike',
  walking: 'Walking',
  other: 'Other'
};

export const TransportationCard: React.FC<TransportationCardProps> = ({
  transportation,
  user,
  collection,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Check if transportation dates are outside collection date range
  const isUnlinked = useMemo(() => {
    if (!collection?.startDate || !collection?.endDate) {
      return !transportation.date && !transportation.endDate;
    }

    const transportationStartDate = transportation.date ? new Date(transportation.date.split('T')[0]) : null;
    const transportationEndDate = transportation.endDate ? new Date(transportation.endDate.split('T')[0]) : null;
    const collectionStartDate = new Date(collection.startDate);
    const collectionEndDate = new Date(collection.endDate);

    const startOutsideRange = transportationStartDate && 
      collectionStartDate < transportationStartDate && 
      collectionEndDate < transportationStartDate;

    const endOutsideRange = transportationEndDate && 
      collectionStartDate > transportationEndDate && 
      collectionEndDate > transportationEndDate;

    return !!(startOutsideRange || endOutsideRange || (!transportationStartDate && !transportationEndDate));
  }, [transportation.date, transportation.endDate, collection?.startDate, collection?.endDate]);

  // Check if user can edit/delete
  const canEdit = useMemo(() => {
    if (!user) return false;
    
    // User owns the transportation
    if (transportation.userId === user.id) return true;
    
    // User has access to the collection
    if (collection && user && collection.sharedWith?.includes(user.id)) return true;
    
    return false;
  }, [transportation.userId, user, collection]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transportation);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(transportation.id);
    }
    setShowDeleteWarning(false);
  };

  const getTransportationIcon = (type: string) => {
    return TRANSPORTATION_TYPE_ICONS[type] || '🚗';
  };

  const getTransportationTypeLabel = (type: string) => {
    return TRANSPORTATION_TYPE_LABELS[type] || 'Other';
  };

  const formatDate = (dateString: string, timezone?: string) => {
    const date = new Date(dateString);
    const isAllDay = !dateString.includes('T') || dateString.endsWith('T00:00:00.000Z');
    
    if (isAllDay) {
      return date.toLocaleDateString(undefined, { 
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const toMiles = (km: number) => (km * 0.621371).toFixed(1);

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group ${className}`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 truncate">{transportation.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getTransportationTypeLabel(transportation.type)}
                <span>{getTransportationIcon(transportation.type)}</span>
              </span>
              {transportation.type === 'plane' && transportation.flightNumber && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {transportation.flightNumber}
                </span>
              )}
              {isUnlinked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Range
                </span>
              )}
            </div>
          </div>

          {/* Route Info */}
          <div className="space-y-3">
            {transportation.fromLocation && (
              <div className="flex items-start gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">From:</span>
                  <span className="ml-1 text-gray-600 break-words">{transportation.fromLocation}</span>
                </div>
              </div>
            )}

            {transportation.toLocation && (
              <div className="flex items-start gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">To:</span>
                  <span className="ml-1 text-gray-600 break-words">{transportation.toLocation}</span>
                </div>
              </div>
            )}

            {transportation.distance && !isNaN(Number(transportation.distance)) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Distance:</span>
                <span className="text-gray-600">
                  {Number(transportation.distance).toFixed(1)} km / {toMiles(Number(transportation.distance))} mi
                </span>
              </div>
            )}
          </div>

          {/* Time Info */}
          <div className="space-y-3">
            {transportation.date && (
              <div className="flex items-start gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">Start:</span>
                  <div className="text-gray-600">
                    {formatDate(transportation.date, transportation.startTimezone)}
                    {transportation.startTimezone && (
                      <span className="ml-1 text-xs opacity-60">({transportation.startTimezone})</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {transportation.endDate && (
              <div className="flex items-start gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">End:</span>
                  <div className="text-gray-600">
                    {formatDate(transportation.endDate, transportation.endTimezone)}
                    {transportation.endTimezone && (
                      <span className="ml-1 text-xs opacity-60">({transportation.endTimezone})</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          {transportation.rating && transportation.rating > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Rating:</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < transportation.rating! ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="ml-2 text-sm text-gray-600">({transportation.rating}/5)</span>
              </div>
            </div>
          )}

          {/* Description */}
          {transportation.description && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Description:</span>
              <p className="text-sm text-gray-600 break-words">{transportation.description}</p>
            </div>
          )}

          {/* Link */}
          {transportation.link && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Link:</span>
              <a
                href={transportation.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 break-all"
              >
                {transportation.link}
              </a>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                title="Edit transportation"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteWarning(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                title="Delete transportation"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Warning Modal */}
      {showDeleteWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Transportation</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this transportation? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteWarning(false)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
