'use client';

import React, { useState } from 'react';
import { Checklist } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { 
  PlusIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';

interface ChecklistsListProps {
  collectionId: string;
  checklists: Checklist[];
  onUpdate: (checklists: Checklist[]) => void;
  className?: string;
}

const CHECKLIST_CATEGORIES = [
  { value: 'packing', label: 'Packing', color: 'bg-blue-100 text-blue-800' },
  { value: 'planning', label: 'Planning', color: 'bg-green-100 text-green-800' },
  { value: 'booking', label: 'Booking', color: 'bg-purple-100 text-purple-800' },
  { value: 'documents', label: 'Documents', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'health', label: 'Health & Safety', color: 'bg-red-100 text-red-800' },
  { value: 'activities', label: 'Activities', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' }
];

export const ChecklistsList: React.FC<ChecklistsListProps> = ({
  collectionId,
  checklists,
  onUpdate,
  className = ''
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    items: ['']
  });

  const adventureApi = new AdventureApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const checklistData = {
        ...formData,
        items: formData.items
          .filter(item => item.trim())
          .map(item => ({
            text: item.trim(),
            completed: false
          }))
      };

      let result;
      if (editingChecklist) {
        result = await adventureApi.updateCollectionChecklist(
          collectionId,
          editingChecklist.id,
          checklistData
        );
        onUpdate(checklists.map(c => c.id === result.id ? result : c));
      } else {
        result = await adventureApi.createCollectionChecklist(collectionId, checklistData);
        onUpdate([...checklists, result]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (checklist: Checklist) => {
    setEditingChecklist(checklist);
    setFormData({
      title: checklist.title,
      description: checklist.description || '',
      category: checklist.category || 'general',
      items: checklist.items?.map(item => item.text) || ['']
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adventureApi.deleteCollectionChecklist(collectionId, id);
      onUpdate(checklists.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const handleToggleItem = async (checklistId: string, itemIndex: number) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) return;

      const updatedItems = checklist.items?.map((item, index) => 
        index === itemIndex ? { ...item, completed: !item.completed } : item
      ) || [];

      const result = await adventureApi.updateCollectionChecklist(
        collectionId,
        checklistId,
        { items: updatedItems }
      );

      onUpdate(checklists.map(c => c.id === result.id ? result : c));
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingChecklist(null);
    setFormData({
      title: '',
      description: '',
      category: 'general',
      items: ['']
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, '']
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const getCategoryStyle = (category: string) => {
    const categoryConfig = CHECKLIST_CATEGORIES.find(c => c.value === category);
    return categoryConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCompletionStats = (items: Array<{ text: string; completed: boolean }>) => {
    const completed = items.filter(item => item.completed).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Checklists</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Checklist
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
                  placeholder="e.g., Packing Checklist"
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
                  {CHECKLIST_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Checklist Items *
              </label>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Item ${index + 1}`}
                    />
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>
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
                  editingChecklist ? 'Update' : 'Add'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Checklists List */}
      {checklists.length > 0 ? (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const stats = getCompletionStats(checklist.items || []);
            
            return (
              <div
                key={checklist.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{checklist.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(checklist.category || 'general')}`}>
                          {CHECKLIST_CATEGORIES.find(c => c.value === checklist.category)?.label || 'General'}
                        </span>
                        {checklist.createdAt && (
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>{formatDate(checklist.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {checklist.description && (
                      <p className="text-gray-600 mb-3">{checklist.description}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{stats.completed}/{stats.total} completed ({stats.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-2">
                      {checklist.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                        >
                          <button
                            onClick={() => handleToggleItem(checklist.id, index)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.completed
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 hover:border-blue-600'
                            }`}
                          >
                            {item.completed && <CheckIconSolid className="h-3 w-3" />}
                          </button>
                          <span className={`flex-1 ${
                            item.completed 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900'
                          }`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(checklist)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(checklist.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No checklists added"
          description="Create checklists to keep track of tasks and items for your collection."
          icon={<ClipboardDocumentListIcon className="h-12 w-12" />}
          action={{
            label: "Add Checklist",
            onClick: () => setShowForm(true)
          }}
        />
      )}
    </div>
  );
};
