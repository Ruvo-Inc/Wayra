import React, { useState } from 'react';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Visit } from '../../types/adventure';
import { DeleteWarning } from '../common/DeleteWarning';

interface VisitCardProps {
  visit: Visit;
  onEdit?: (visit: Visit) => void;
  onDelete?: (visitId: string) => void;
  onToggleVisited?: (visitId: string, isVisited: boolean) => void;
  className?: string;
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  onEdit,
  onDelete,
  onToggleVisited,
  className = ''
}) => {
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(visit);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (onDelete) {
          onDelete(visit.id);
        }
      } else {
        console.error('Error deleting visit');
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
    } finally {
      setIsLoading(false);
      setIsWarningModalOpen(false);
    }
  };

  const handleToggleVisited = async () => {
    if (!onToggleVisited) return;
    
    try {
      setIsLoading(true);
      const newVisitedStatus = !visit.isVisited;
      
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_visited: newVisitedStatus })
      });
      
      if (response.ok) {
        onToggleVisited(visit.id, newVisitedStatus);
      } else {
        console.error('Error updating visit status');
      }
    } catch (error) {
      console.error('Error updating visit status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRange = () => {
    if (visit.startDate && visit.endDate) {
      const startDate = new Date(visit.startDate);
      const endDate = new Date(visit.endDate);
      
      if (startDate.toDateString() === endDate.toDateString()) {
        // Same day
        return `${formatDate(visit.startDate)} ${formatTime(visit.startDate)} - ${formatTime(visit.endDate)}`;
      } else {
        // Different days
        return `${formatDate(visit.startDate)} - ${formatDate(visit.endDate)}`;
      }
    } else if (visit.startDate) {
      return `From ${formatDate(visit.startDate)}`;
    } else if (visit.endDate) {
      return `Until ${formatDate(visit.endDate)}`;
    }
    return null;
  };

  const getDuration = () => {
    if (visit.startDate && visit.endDate) {
      const start = new Date(visit.startDate);
      const end = new Date(visit.endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 24) {
        const days = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        return `${days}d ${remainingHours}h`;
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    }
    return null;
  };

  return (
    <>
      {/* Delete Warning Modal */}
      {isWarningModalOpen && (
        <DeleteWarning
          title="Delete Visit"
          description="Are you sure you want to delete this visit? This action cannot be undone."
          buttonText="Delete Visit"
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center flex-1 min-w-0">
              {/* Visit Status Icon */}
              <div className={`p-2 rounded-full mr-3 ${
                visit.isVisited 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {visit.isVisited ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {visit.adventure?.name || 'Visit'}
                </h3>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    visit.isVisited 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {visit.isVisited ? 'Visited' : 'Planned'}
                  </span>
                  {visit.adventure?.category && (
                    <span className="text-sm text-gray-500">
                      {visit.adventure.category.icon} {visit.adventure.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1 ml-2">
              {onToggleVisited && (
                <button
                  onClick={handleToggleVisited}
                  className={`p-2 rounded-lg transition-colors ${
                    visit.isVisited
                      ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                      : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  }`}
                  title={visit.isVisited ? 'Mark as planned' : 'Mark as visited'}
                  disabled={isLoading}
                >
                  {visit.isVisited ? (
                    <XMarkIcon className="w-4 h-4" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit visit"
                  disabled={isLoading}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setIsWarningModalOpen(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete visit"
                  disabled={isLoading}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Date and Time */}
          {formatDateRange() && (
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span>{formatDateRange()}</span>
              {getDuration() && (
                <>
                  <ClockIcon className="w-4 h-4 ml-4 mr-1 text-gray-400" />
                  <span>{getDuration()}</span>
                </>
              )}
            </div>
          )}

          {/* Location */}
          {visit.adventure?.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{visit.adventure.location}</span>
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-3">
                {visit.notes}
              </p>
            </div>
          )}

          {/* Timezone */}
          {visit.timezone && (
            <div className="text-xs text-gray-500">
              Timezone: {visit.timezone}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {visit.isAllDay ? 'All day' : 'Timed visit'}
            </span>
            {visit.createdAt && (
              <span>Created {formatDate(visit.createdAt)}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
