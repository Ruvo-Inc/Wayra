import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  FolderIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  MinusIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Collection, User } from '../../types/adventure';
import { DeleteWarning } from '../common/DeleteWarning';
import { ShareModal } from '../common/ShareModal';

interface CollectionCardProps {
  collection: Collection;
  type?: 'default' | 'link' | 'viewonly';
  linkedCollectionList?: string[] | null;
  user?: User | null;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collectionId: string) => void;
  onArchive?: (collectionId: string) => void;
  onUnarchive?: (collectionId: string) => void;
  onLink?: (collectionId: string) => void;
  onUnlink?: (collectionId: string) => void;
  onView?: (collectionId: string) => void;
  className?: string;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  type = 'default',
  linkedCollectionList = null,
  user = null,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onLink,
  onUnlink,
  onView,
  className = ''
}) => {
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Always call useRouter to satisfy React Hooks rules
  const router = useRouter();
  const canUseRouter = type !== 'link';

  const handleView = () => {
    if (onView) {
      // Use custom onView handler if provided
      const collectionId = collection._id || collection.id;
      if (collectionId) {
        onView(collectionId);
      }
    } else if (canUseRouter && router) {
      // Use router for navigation only when not in 'link' mode
      const collectionId = collection._id || collection.id;
      if (collectionId) {
        try {
          router.push(`/collections/${collectionId}`);
        } catch (error) {
          console.warn('Router navigation failed:', error);
        }
      }
    } else {
      console.warn('No navigation method available');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(collection);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (onDelete) {
          onDelete(collection.id);
        }
      } else {
        console.error('Error deleting collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsLoading(false);
      setIsWarningModalOpen(false);
    }
  };

  const handleArchive = async (isArchived: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/collections/${collection.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_archived: isArchived })
      });
      
      if (response.ok) {
        if (isArchived && onArchive) {
          onArchive(collection.id);
        } else if (!isArchived && onUnarchive) {
          onUnarchive(collection.id);
        }
      } else {
        console.error('Error archiving collection');
      }
    } catch (error) {
      console.error('Error archiving collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleLink = () => {
    if (onLink) {
      onLink(collection.id);
    }
  };

  const handleUnlink = () => {
    if (onUnlink) {
      onUnlink(collection.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Note: getDateRange function removed as we're using inline date formatting in the UI

  const getDuration = () => {
    if (collection.startDate && collection.endDate) {
      const start = new Date(collection.startDate);
      const end = new Date(collection.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} days`;
    }
    return null;
  };

  const isLinked = linkedCollectionList && linkedCollectionList.includes(collection.id);
  const canEdit = user && user.id === collection.userId;

  return (
    <>
      {/* Delete Warning Modal */}
      {isWarningModalOpen && (
        <DeleteWarning
          title="Delete Collection"
          description="Are you sure you want to delete this collection? This action cannot be undone."
          buttonText="Delete Collection"
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          collection={collection}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      <div className={`bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group max-w-md w-full ${className}`}>
        {/* Image Section with Overlay */}
        <div className="relative overflow-hidden rounded-t-2xl">
          {/* Placeholder for CardCarousel - would need to be implemented */}
          <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FolderIcon className="w-16 h-16 text-white/80" />
          </div>

          {/* Status Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
              collection.isPublic 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {collection.isPublic ? (
                <div className="flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  Public
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <EyeSlashIcon className="w-3 h-3" />
                  Private
                </div>
              )}
            </div>
            {collection.isArchived && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 shadow-lg">
                Archived
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-3">
            {type === 'link' ? (
              <h3 className="text-xl font-bold text-left line-clamp-2 w-full text-left">
                {collection.name}
              </h3>
            ) : (
              <button
                onClick={handleView}
                className="text-xl font-bold text-left hover:text-blue-600 transition-colors duration-200 line-clamp-2 group-hover:underline w-full text-left"
              >
                {collection.name}
              </button>
            )}

            {/* Adventure Count */}
            <p className="text-sm text-gray-600">
              {collection.adventures?.length || 0} adventures
            </p>

            {/* Date Range */}
            {collection.startDate && collection.endDate && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Dates: {formatDate(collection.startDate)} – {formatDate(collection.endDate)}
                </p>
                <p className="text-sm text-gray-500">
                  Duration: {getDuration()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200">
            {type === 'link' ? (
              /* Link/Unlink Actions - No view functionality needed */
              isLinked ? (
                <button
                  onClick={handleUnlink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={isLoading}
                >
                  <MinusIcon className="w-4 h-4" />
                  Remove from Collection
                </button>
              ) : (
                <button
                  onClick={handleLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  <PlusIcon className="w-4 h-4" />
                  Add to Collection
                </button>
              )
            ) : (
              /* Default Actions */
              <div className="flex items-center justify-between">
                <button
                  onClick={handleView}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1 mr-2"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Open Details
                </button>

                {canEdit && (
                  <div className="relative">
                    <div className="dropdown dropdown-end">
                      <button 
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        disabled={isLoading}
                      >
                        <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <ul className="dropdown-content menu bg-white rounded-lg shadow-xl border border-gray-200 w-64 p-2 z-10">
                        {type !== 'viewonly' && (
                          <>
                            <li>
                              <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                              >
                                <PencilIcon className="w-4 h-4" />
                                Edit Collection
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                              >
                                <ShareIcon className="w-4 h-4" />
                                Share
                              </button>
                            </li>
                            {collection.isArchived ? (
                              <li>
                                <button
                                  onClick={() => handleArchive(false)}
                                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                                >
                                  <ArchiveBoxXMarkIcon className="w-4 h-4" />
                                  Unarchive
                                </button>
                              </li>
                            ) : (
                              <li>
                                <button
                                  onClick={() => handleArchive(true)}
                                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                                >
                                  <ArchiveBoxIcon className="w-4 h-4" />
                                  Archive
                                </button>
                              </li>
                            )}
                            <div className="border-t border-gray-200 my-1"></div>
                            <li>
                              <button
                                onClick={() => setIsWarningModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            </li>
                          </>
                        )}
                        {type === 'viewonly' && (
                          <li>
                            <button
                              onClick={handleView}
                              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                            >
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              Open Details
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
