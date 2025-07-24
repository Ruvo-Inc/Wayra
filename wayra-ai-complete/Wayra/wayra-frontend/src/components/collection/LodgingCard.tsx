import React, { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Lodging, Collection, User } from '../../types/adventure';

interface LodgingCardProps {
  lodging: Lodging;
  user?: User | null;
  collection?: Collection | null;
  onEdit?: (lodging: Lodging) => void;
  onDelete?: (lodgingId: string) => void;
  className?: string;
}

const LODGING_TYPE_ICONS: Record<string, string> = {
  hotel: '🏨',
  hostel: '🏠',
  resort: '🏖️',
  bnb: '🏡',
  campground: '🏕️',
  cabin: '🛖',
  apartment: '🏢',
  house: '🏠',
  villa: '🏰',
  motel: '🏨',
  other: '🏨'
};

const LODGING_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  hostel: 'Hostel',
  resort: 'Resort',
  bnb: 'B&B / Airbnb',
  campground: 'Campground',
  cabin: 'Cabin',
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  motel: 'Motel',
  other: 'Other'
};

export const LodgingCard: React.FC<LodgingCardProps> = ({
  lodging,
  user,
  collection,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Check if lodging dates are outside collection date range
  const isUnlinked = useMemo(() => {
    if (!collection?.startDate || !collection?.endDate) {
      return !lodging.checkIn && !lodging.checkOut;
    }

    const lodgingStartDate = lodging.checkIn ? new Date(lodging.checkIn.split('T')[0]) : null;
    const lodgingEndDate = lodging.checkOut ? new Date(lodging.checkOut.split('T')[0]) : null;
    const collectionStartDate = new Date(collection.startDate);
    const collectionEndDate = new Date(collection.endDate);

    const startOutsideRange = lodgingStartDate && 
      collectionStartDate < lodgingStartDate && 
      collectionEndDate < lodgingStartDate;

    const endOutsideRange = lodgingEndDate && 
      collectionStartDate > lodgingEndDate && 
      collectionEndDate > lodgingEndDate;

    return !!(startOutsideRange || endOutsideRange || (!lodgingStartDate && !lodgingEndDate));
  }, [lodging.checkIn, lodging.checkOut, collection?.startDate, collection?.endDate]);

  // Check if user can edit/delete
  const canEdit = useMemo(() => {
    if (!user) return false;
    
    // User owns the lodging
    if (lodging.userId === user.id) return true;
    
    // User has access to the collection
    if (collection && user && collection.sharedWith?.includes(user.id)) return true;
    
    return false;
  }, [lodging.userId, user, collection]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(lodging);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(lodging.id);
    }
    setShowDeleteWarning(false);
  };

  const getLodgingIcon = (type: string) => {
    return LODGING_TYPE_ICONS[type] || '🏨';
  };

  const getLodgingTypeLabel = (type: string) => {
    return LODGING_TYPE_LABELS[type] || 'Other';
  };

  const formatDate = (dateString: string) => {
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

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group ${className}`}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-gray-900 break-words">{lodging.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getLodgingTypeLabel(lodging.type)}
                <span>{getLodgingIcon(lodging.type)}</span>
              </span>
              {isUnlinked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Range
                </span>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="space-y-2">
            {lodging.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Location:</span>
                <p className="text-sm text-gray-600 break-words">{lodging.location}</p>
              </div>
            )}

            <div className="space-y-3">
              {lodging.checkIn && (
                <div className="flex items-start gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">Check-in:</span>
                    <span className="text-gray-600">
                      {formatDate(lodging.checkIn)}
                      {lodging.timezone && (
                        <span className="ml-1 text-xs opacity-60">({lodging.timezone})</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {lodging.checkOut && (
                <div className="flex items-start gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">Check-out:</span>
                    <span className="text-gray-600">
                      {formatDate(lodging.checkOut)}
                      {lodging.timezone && (
                        <span className="ml-1 text-xs opacity-60">({lodging.timezone})</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reservation Info */}
          {canEdit && (
            <div className="space-y-2">
              {lodging.reservationNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Reservation:</span>
                  <p className="text-sm text-gray-600 break-all">{lodging.reservationNumber}</p>
                </div>
              )}
              {lodging.price && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Price:</span>
                  <p className="text-sm text-gray-600">${lodging.price}</p>
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          {lodging.rating && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Rating:</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < lodging.rating! ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="ml-2 text-sm text-gray-600">({lodging.rating}/5)</span>
              </div>
            </div>
          )}

          {/* Description */}
          {lodging.description && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Description:</span>
              <p className="text-sm text-gray-600 break-words">{lodging.description}</p>
            </div>
          )}

          {/* Link */}
          {lodging.link && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Link:</span>
              <a
                href={lodging.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 break-all"
              >
                {lodging.link}
              </a>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                title="Edit lodging"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteWarning(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                title="Delete lodging"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Lodging</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this lodging? This action cannot be undone.
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
