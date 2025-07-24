import React from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Attachment } from '../../types/adventure';

interface AttachmentCardProps {
  attachment: Attachment;
  allowEdit?: boolean;
  onEdit?: (attachment: Attachment) => void;
  onDelete?: (attachmentId: string) => void;
  className?: string;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({
  attachment,
  allowEdit = false,
  onEdit,
  onDelete,
  className = ''
}) => {
  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      // Call the delete handler passed from parent
      onDelete(attachment.id);
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(attachment);
    }
  };

  const handleOpen = () => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };

  // Check if the attachment is an image
  const isImage = () => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => 
      attachment.filename.toLowerCase().endsWith(ext) || 
      attachment.type?.startsWith('image/')
    );
  };

  // Get file extension from filename
  const getFileExtension = () => {
    const parts = attachment.filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  // Get display name (filename without extension)
  const getDisplayName = () => {
    const parts = attachment.filename.split('.');
    return parts.length > 1 ? parts.slice(0, -1).join('.') : attachment.filename;
  };

  return (
    <div className={`relative rounded-lg shadow-lg group hover:shadow-xl transition-shadow overflow-hidden ${className}`}>
      {/* Card Image or Placeholder */}
      <div
        className="w-full h-48 bg-cover bg-center group-hover:opacity-90 transition-opacity cursor-pointer"
        style={{
          backgroundImage: isImage() ? `url(${attachment.url})` : 'none'
        }}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label={attachment.filename}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleOpen();
          }
        }}
      >
        {!isImage() && (
          <div className="flex justify-center items-center w-full h-full text-white text-lg font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-center">
            <div>
              <p className="mb-2">{getDisplayName()}</p>
              <p className="text-2xl">{getFileExtension()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Attachment Label */}
      <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-bl-lg shadow-md">
        Attachment
      </div>
      
      {/* File Extension Badge */}
      <div className="absolute top-0 left-0 bg-green-600 text-white px-2 py-1 text-sm font-medium rounded-br-lg shadow-md">
        {getFileExtension()}
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/50 to-transparent p-3 rounded-b-lg flex justify-between items-center">
        <span className="text-white text-sm font-medium truncate flex-1 mr-2">
          {getDisplayName()}
        </span>
        <div className="flex space-x-2">
          {!allowEdit && (
            <button
              type="button"
              onClick={handleOpen}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              title="Open attachment"
            >
              <EyeIcon className="h-4 w-4" />
              Open
            </button>
          )}
          {allowEdit && (
            <>
              <button
                type="button"
                onClick={handleEdit}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors flex items-center gap-1"
                title="Edit attachment"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                title="Delete attachment"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
