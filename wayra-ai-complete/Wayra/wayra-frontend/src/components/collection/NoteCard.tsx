import React, { useState, useMemo } from 'react';
import { CalendarIcon, PencilIcon, TrashIcon, EyeIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Note, Collection, User } from '../../types/adventure';

interface NoteCardProps {
  note: Note;
  user?: User | null;
  collection?: Collection | null;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  className?: string;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  user,
  collection,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Check if note date is outside collection date range
  const isUnlinked = useMemo(() => {
    if (!collection?.startDate || !collection?.endDate || !note.date) {
      return !note.date;
    }

    const noteDate = new Date(note.date);
    const collectionStart = new Date(collection.startDate);
    const collectionEnd = new Date(collection.endDate);

    const startOutsideRange = noteDate < collectionStart;
    const endOutsideRange = noteDate > collectionEnd;

    return startOutsideRange || endOutsideRange;
  }, [note.date, collection?.startDate, collection?.endDate]);

  // Check if user can edit/delete
  const canEdit = useMemo(() => {
    if (!user) return false;
    
    // User owns the note
    if (note.userId === user.id) return true;
    
    // User has access to the collection
    if (collection && user && collection.sharedWith?.includes(user.id)) return true;
    
    return false;
  }, [note.userId, user, collection]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(note);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(note.id);
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

  // Simple markdown-like rendering for basic formatting
  const renderContent = (content: string) => {
    if (!content) return '';
    
    // Basic markdown-like replacements
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const extractDomain = (url: string) => {
    try {
      const domain = url.split('//')[1]?.split('/')[0];
      return domain || url;
    } catch {
      return url;
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group ${className}`}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 break-words">{note.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Note
              </span>
              {isUnlinked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Range
                </span>
              )}
            </div>
          </div>

          {/* Note Content */}
          {note.content && note.content.length > 0 && (
            <div className="prose max-w-none overflow-auto max-h-72 p-4 border border-gray-200 bg-gray-50 rounded-lg">
              <div 
                className="text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: renderContent(note.content) }}
              />
            </div>
          )}

          {/* Links */}
          {note.links && note.links.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">
                  {note.links.length} {note.links.length > 1 ? 'links' : 'link'}
                </p>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {note.links.slice(0, 3).map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {extractDomain(link)}
                    </a>
                  </li>
                ))}
                {note.links.length > 3 && (
                  <li className="text-gray-500">…</li>
                )}
              </ul>
            </div>
          )}

          {/* Date */}
          {note.date && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <p>{formatDate(note.date)}</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Note</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this note? This action cannot be undone.
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
