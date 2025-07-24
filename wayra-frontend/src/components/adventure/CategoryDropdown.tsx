import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Category } from '../../types/adventure';

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategory: Category | null;
  onCategorySelect: (category: Category) => void;
  placeholder?: string;
  className?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  placeholder = 'Select Category',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    displayName: '',
    icon: '',
    id: '',
    userId: '',
    numAdventures: 0
  });
  const [sortedCategories, setSortedCategories] = useState<Category[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const commonEmojis = ['🌍', '🏔️', '🏖️', '🏛️', '🎭', '🍽️', '🎨', '🏃‍♂️', '📚', '🎵', '🛍️', '🌮', '☕', '🍺', '🎪', '🎯'];

  useEffect(() => {
    // Sort categories by number of adventures (descending)
    const sorted = [...categories].sort((a, b) => (b.numAdventures || 0) - (a.numAdventures || 0));
    setSortedCategories(sorted);
  }, [categories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEmojiPickerVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setIsEmojiPickerVisible(false);
  };

  const selectCategory = (category: Category) => {
    onCategorySelect(category);
    setIsOpen(false);
    setIsEmojiPickerVisible(false);
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerVisible(!isEmojiPickerVisible);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewCategory(prev => ({ ...prev, icon: emoji }));
    setIsEmojiPickerVisible(false);
  };

  const createCustomCategory = () => {
    if (!newCategory.displayName.trim()) return;

    const customCategory: Category = {
      ...newCategory,
      name: newCategory.displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      displayName: newCategory.displayName.trim(),
      icon: newCategory.icon || '🌍',
      id: `custom_${Date.now()}`, // Temporary ID for custom categories
      userId: 'current_user', // Will be set by the backend
      numAdventures: 0
    };

    selectCategory(customCategory);
    
    // Reset form
    setNewCategory({
      name: '',
      displayName: '',
      icon: '',
      id: '',
      userId: '',
      numAdventures: 0
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setIsEmojiPickerVisible(false);
    } else if (event.key === 'Enter' && newCategory.displayName.trim()) {
      event.preventDefault();
      createCustomCategory();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {selectedCategory && selectedCategory.name ? (
            <>
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.displayName}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3 border-b border-gray-200">
            {/* Custom Category Creation */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category name"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newCategory.displayName}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, displayName: e.target.value }))}
                  onKeyDown={handleKeyDown}
                />
                <input
                  type="text"
                  placeholder="Icon"
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={toggleEmojiPicker}
                  className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                >
                  😀
                </button>
                <button
                  type="button"
                  onClick={createCustomCategory}
                  disabled={!newCategory.displayName.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>

              {/* Emoji Picker */}
              {isEmojiPickerVisible && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="grid grid-cols-8 gap-1">
                    {commonEmojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="p-1 hover:bg-gray-200 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="max-h-60 overflow-y-auto">
            {sortedCategories.length > 0 ? (
              <div className="p-2 space-y-1">
                {sortedCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`w-full px-3 py-2 text-left rounded-md transition-colors flex items-center justify-between ${
                      selectedCategory && selectedCategory.id === category.id
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100'
                    }`}
                    role="option"
                    aria-selected={selectedCategory && selectedCategory.id === category.id}
                  >
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.displayName}</span>
                    </span>
                    {category.numAdventures !== undefined && (
                      <span className="text-sm text-gray-500">({category.numAdventures})</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No categories available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
