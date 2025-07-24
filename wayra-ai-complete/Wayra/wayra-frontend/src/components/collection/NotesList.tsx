'use client';

import React, { useState } from 'react';
import { Note } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { 
  PlusIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface NotesListProps {
  collectionId: string;
  notes: Note[];
  onUpdate: (notes: Note[]) => void;
  className?: string;
}

const NOTE_CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
  { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
  { value: 'budget', label: 'Budget', color: 'bg-green-100 text-green-800' },
  { value: 'packing', label: 'Packing', color: 'bg-purple-100 text-purple-800' },
  { value: 'research', label: 'Research', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'contacts', label: 'Contacts', color: 'bg-pink-100 text-pink-800' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' },
  { value: 'memories', label: 'Memories', color: 'bg-indigo-100 text-indigo-800' }
];

export const NotesList: React.FC<NotesListProps> = ({
  collectionId,
  notes,
  onUpdate,
  className = ''
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  const adventureApi = new AdventureApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let result;
      if (editingNote) {
        result = await adventureApi.updateCollectionNote(
          collectionId,
          editingNote.id,
          noteData
        );
        onUpdate(notes.map(n => n.id === result.id ? result : n));
      } else {
        result = await adventureApi.createCollectionNote(collectionId, noteData);
        onUpdate([...notes, result]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category || 'general',
      tags: note.tags?.join(', ') || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adventureApi.deleteCollectionNote(collectionId, id);
      onUpdate(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      tags: ''
    });
  };

  const getCategoryStyle = (category: string) => {
    const categoryConfig = NOTE_CATEGORIES.find(c => c.value === category);
    return categoryConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Notes</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Note
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Packing List"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {NOTE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., important, urgent, remember (comma-separated)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your note here..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  editingNote ? 'Update' : 'Add'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{note.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(note.category || 'general')}`}>
                        {NOTE_CATEGORIES.find(c => c.value === note.category)?.label || 'General'}
                      </span>
                      {note.createdAt && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                    <p className="whitespace-pre-wrap">{truncateContent(note.content)}</p>
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1 mb-2">
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      {note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <div className="text-xs text-gray-500">
                      Updated: {formatDate(note.updatedAt)}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notes added"
          description="Add notes to keep track of important information, ideas, and reminders for your collection."
          icon={<DocumentTextIcon className="h-12 w-12" />}
          action={{
            label: "Add Note",
            onClick: () => setShowForm(true)
          }}
        />
      )}
    </div>
  );
};
