import React, { useState, useMemo } from 'react';
import { CalendarIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Checklist, Collection, User } from '../../types/adventure';

interface ChecklistCardProps {
  checklist: Checklist;
  user?: User | null;
  collection?: Collection | null;
  onEdit?: (checklist: Checklist) => void;
  onDelete?: (checklistId: string) => void;
  className?: string;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  checklist,
  user,
  collection,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Check if checklist date is outside collection date range
  const isUnlinked = useMemo(() => {
    if (!collection?.startDate || !collection?.endDate || !checklist.date) {
      return !checklist.date;
    }

    const checklistDate = new Date(checklist.date);
    const collectionStart = new Date(collection.startDate);
    const collectionEnd = new Date(collection.endDate);

    const startOutsideRange = checklistDate < collectionStart;
    const endOutsideRange = checklistDate > collectionEnd;

    return startOutsideRange || endOutsideRange;
  }, [checklist.date, collection?.startDate, collection?.endDate]);

  // Check if user can edit/delete
  const canEdit = useMemo(() => {
    if (!user) return false;
    
    // User owns the checklist
    if (checklist.userId === user.id) return true;
    
    // User has access to the collection
    if (collection && user && collection.sharedWith?.includes(user.id)) return true;
    
    return false;
  }, [checklist.userId, user, collection]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(checklist);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(checklist.id);
    }
    setShowDeleteWarning(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompletedCount = () => {
    return checklist.items?.filter(item => item.completed).length || 0;
  };

  const getTotalCount = () => {
    return checklist.items?.length || 0;
  };

  const getCompletionPercentage = () => {
    const total = getTotalCount();
    if (total === 0) return 0;
    return Math.round((getCompletedCount() / total) * 100);
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group ${className}`}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 break-words">{checklist.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Checklist
              </span>
              {isUnlinked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Range
                </span>
              )}
            </div>
          </div>

          {/* Checklist Stats */}
          <div className="space-y-2">
            {getTotalCount() > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {getCompletedCount()} of {getTotalCount()} completed
                </p>
                <span className="text-sm font-medium text-gray-900">
                  {getCompletionPercentage()}%
                </span>
              </div>
            )}
            
            {getTotalCount() > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
            )}

            {getTotalCount() > 0 && (
              <p className="text-sm text-gray-500">
                {getTotalCount()} {getTotalCount() === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>

          {/* Date */}
          {checklist.date && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <p>{formatDate(checklist.date)}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button 
              onClick={handleEdit}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Open
            </button>
            {canEdit && (
              <button
                onClick={() => setShowDeleteWarning(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Warning Modal */}
      {showDeleteWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Checklist</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this checklist? This action cannot be undone.
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
