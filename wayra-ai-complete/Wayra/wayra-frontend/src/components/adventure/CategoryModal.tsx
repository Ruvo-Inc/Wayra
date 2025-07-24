import React, { useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Category } from '../../types/adventure';
import { adventureApi } from '../../services/api';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChange?: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryChange
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ displayName: '', icon: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPickerAdd, setShowEmojiPickerAdd] = useState(false);
  const [showEmojiPickerEdit, setShowEmojiPickerEdit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesData = await adventureApi.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoryToEdit(null);
    setNewCategory({ displayName: '', icon: '' });
    setShowAddForm(false);
    setShowEmojiPickerAdd(false);
    setShowEmojiPickerEdit(false);
    setError(null);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const nameTrimmed = newCategory.displayName.trim();
    if (!nameTrimmed) {
      setError('Category name is required');
      return;
    }
    
    setError(null);

    const payload = {
      displayName: nameTrimmed,
      name: nameTrimmed
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, ''),
      icon: newCategory.icon.trim() || '🌍'
    };

    try {
      const created = await adventureApi.createCategory(payload);
      setCategories([...categories, created]);
      setNewCategory({ displayName: '', icon: '' });
      setShowAddForm(false);
      setShowEmojiPickerAdd(false);
      onCategoryChange?.();
    } catch (err) {
      console.error('Failed to create category:', err);
      setError('Failed to create category');
    }
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryToEdit) return;

    const nameTrimmed = categoryToEdit.displayName.trim();
    if (!nameTrimmed) {
      setError('Category name is required');
      return;
    }
    
    setError(null);

    try {
      const updated = await adventureApi.updateCategory(categoryToEdit.id, {
        ...categoryToEdit,
        displayName: nameTrimmed
      });
      setCategories(categories.map(c => c.id === updated.id ? updated : c));
      setCategoryToEdit(null);
      setShowEmojiPickerEdit(false);
      onCategoryChange?.();
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Failed to save category');
    }
  };

  const startEdit = (category: Category) => {
    setCategoryToEdit({ ...category });
    setShowAddForm(false);
    setShowEmojiPickerAdd(false);
    setShowEmojiPickerEdit(false);
  };

  const cancelEdit = () => {
    setCategoryToEdit(null);
    setShowEmojiPickerEdit(false);
  };

  const removeCategory = async (category: Category) => {
    if (category.name === 'general') return;

    try {
      await adventureApi.deleteCategory(category.id);
      setCategories(categories.filter(c => c.id !== category.id));
      onCategoryChange?.();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category');
    }
  };

  const commonEmojis = ['🌍', '🏔️', '🏖️', '🏛️', '🎭', '🍽️', '🎨', '🏃‍♂️', '📚', '🎵', '🛍️', '🌮', '☕', '🍺', '🎪', '🎯'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Manage Categories</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Category List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-2 mb-6">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{category.icon || '🌍'}</span>
                    <span className="font-medium text-gray-900">{category.displayName}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {category.name !== 'general' && (
                      <button
                        onClick={() => removeCategory(category)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          )}

          {/* Edit Category Form */}
          {categoryToEdit && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-4 text-gray-900">Edit Category</h3>
              <form onSubmit={saveCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={categoryToEdit.displayName}
                      onChange={(e) => setCategoryToEdit({...categoryToEdit, displayName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={categoryToEdit.icon}
                        onChange={(e) => setCategoryToEdit({...categoryToEdit, icon: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmojiPickerEdit(!showEmojiPickerEdit)}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        😀
                      </button>
                    </div>
                    {showEmojiPickerEdit && (
                      <div className="mt-2 p-2 border border-gray-200 rounded-md bg-white">
                        <div className="grid grid-cols-8 gap-1">
                          {commonEmojis.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setCategoryToEdit({...categoryToEdit, icon: emoji});
                                setShowEmojiPickerEdit(false);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Category Form */}
          {showAddForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-4 text-gray-900">Add New Category</h3>
              <form onSubmit={createCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCategory.displayName}
                      onChange={(e) => setNewCategory({...newCategory, displayName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmojiPickerAdd(!showEmojiPickerAdd)}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        😀
                      </button>
                    </div>
                    {showEmojiPickerAdd && (
                      <div className="mt-2 p-2 border border-gray-200 rounded-md bg-white">
                        <div className="grid grid-cols-8 gap-1">
                          {commonEmojis.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setNewCategory({...newCategory, icon: emoji});
                                setShowEmojiPickerAdd(false);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Create Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategory({ displayName: '', icon: '' });
                      setShowEmojiPickerAdd(false);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Category Button */}
          {!showAddForm && !categoryToEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Category
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
