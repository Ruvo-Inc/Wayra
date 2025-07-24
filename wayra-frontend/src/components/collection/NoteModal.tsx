import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Note, Collection, User } from '../../types/adventure';

interface NoteModalProps {
  note?: Note | null;
  collection: Collection;
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (note: Note) => void;
  onCreate?: (note: Note) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  note,
  collection,
  user,
  isOpen,
  onClose,
  onSave,
  onCreate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    date: '',
    links: [] as string[]
  });
  const [newLink, setNewLink] = useState('');
  const [constrainDates, setConstrainDates] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);

  // Check if user can edit
  const isReadOnly = note && user && note.userId !== user.id && 
    !(collection.sharedWith?.includes(user.id));

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: note?.name || '',
        content: note?.content || '',
        date: note?.date || '',
        links: note?.links || []
      });
      setNewLink('');
      setWarning(null);
    }
  }, [isOpen, note]);

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addLink = () => {
    if (!isValidUrl(newLink)) {
      setWarning('Please enter a valid URL');
      return;
    }
    
    setWarning(null);
    
    if (newLink.trim().length > 0) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, newLink.trim()]
      }));
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      const noteData = {
        ...formData,
        date: formData.date || null,
        collection: collection.id,
        isPublic: collection.isPublic
      };

      if (note?.id) {
        // Update existing note
        const response = await fetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noteData)
        });

        if (response.ok) {
          const updatedNote = await response.json();
          onSave?.(updatedNote);
          handleClose();
        } else {
          console.error('Failed to save note');
        }
      } else {
        // Create new note
        const response = await fetch('/api/notes/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noteData)
        });

        if (response.ok) {
          const newNote = await response.json();
          onCreate?.(newNote);
          handleClose();
        } else {
          const errorData = await response.json();
          console.error('Failed to create note:', errorData);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Simple markdown-like rendering for preview
  const renderMarkdown = (content: string) => {
    if (!content) return '';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {note?.id && !isReadOnly ? `Editing Note: ${note.name}` :
               !isReadOnly ? 'Note Editor' : 'Note Viewer'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
                className="w-full px-4 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex justify-between items-center"
              >
                Basic Information
                <span className={`transform transition-transform ${isBasicInfoExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isBasicInfoExpanded && (
                <div className="p-4 space-y-4">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      readOnly={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  {/* Date Input */}
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    
                    {collection.startDate && collection.endDate && !isReadOnly && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600">Constrain to collection dates</span>
                        <input
                          type="checkbox"
                          id="constrain_dates"
                          checked={constrainDates}
                          onChange={(e) => setConstrainDates(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <input
                      type="date"
                      id="date"
                      readOnly={isReadOnly}
                      min={constrainDates ? collection.startDate : ''}
                      max={constrainDates ? collection.endDate : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    {!isReadOnly ? (
                      <textarea
                        id="content"
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your note content here... (Markdown supported)"
                      />
                    ) : (
                      <div className="prose max-w-none p-4 border border-gray-200 rounded-md bg-gray-50">
                        <div 
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(note?.content || '') }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Links Section */}
                  {!isReadOnly && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Links
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add a link (e.g. https://example.com)"
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addLink();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addLink}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Links List */}
                  {formData.links.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Added Links:</h4>
                      <ul className="space-y-2">
                        {formData.links.map((link, index) => (
                          <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 break-all"
                            >
                              {link}
                            </a>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warning Message */}
            {warning && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{warning}</span>
              </div>
            )}

            {/* Public Note Alert */}
            {collection.isPublic && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700">
                  This note will be public since the collection is public.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
