import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Category } from '../../types/adventure';

interface CategoryFilterDropdownProps {
  types: string;
  onTypesChange: (types: string) => void;
  className?: string;
}

export const CategoryFilterDropdown: React.FC<CategoryFilterDropdownProps> = ({
  types,
  onTypesChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [typesArray, setTypesArray] = useState<string[]>([]);
  const [adventureTypes, setAdventureTypes] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories/categories');
        const categoryData = await response.json();
        setAdventureTypes(categoryData);
        setTypesArray(types ? types.split(',').filter(t => t !== '') : []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Update types array when types prop changes
  useEffect(() => {
    setTypesArray(types ? types.split(',').filter(t => t !== '') : []);
  }, [types]);

  // Clear all selected types
  const clearTypes = () => {
    setTypesArray([]);
    onTypesChange('');
  };

  // Toggle selection of a type
  const toggleSelect = (typeName: string) => {
    let newTypesArray: string[];
    
    if (typesArray.includes(typeName)) {
      newTypesArray = typesArray.filter(item => item !== typeName);
    } else {
      newTypesArray = [...typesArray, typeName];
    }
    
    // Filter out empty strings
    newTypesArray = newTypesArray.filter(item => item !== '');
    
    setTypesArray(newTypesArray);
    onTypesChange(newTypesArray.join(','));
  };

  return (
    <div className={`bg-gray-100 rounded-lg border border-gray-200 mb-4 ${className}`}>
      {/* Collapse Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-200 transition-colors"
      >
        <h3 className="text-lg font-medium text-gray-900">Category Filter</h3>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapse Content */}
      {isOpen && (
        <div className="p-4 pt-0 bg-gray-100">
          {/* Clear Button */}
          <button
            onClick={clearTypes}
            className="w-full mb-3 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Loading categories...</div>
            </div>
          ) : (
            /* Category List */
            <div className="space-y-2">
              {adventureTypes.map((type) => (
                <label
                  key={type.name}
                  className="flex items-center gap-3 cursor-pointer hover:bg-white hover:bg-opacity-50 p-2 rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={typesArray.includes(type.name)}
                    onChange={() => toggleSelect(type.name)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-900 flex-1">
                    {type.displayName} {type.icon} ({type.numAdventures || 0})
                  </span>
                </label>
              ))}
              
              {adventureTypes.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">No categories available</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
