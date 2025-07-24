import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Checklist, ChecklistItem, Collection, User } from '../../types/adventure';

interface ChecklistModalProps {
  isOpen: boolean;
  checklist?: Checklist | null;
  collection: Collection;
  user?: User | null;
  onClose: () => void;
  onSave?: (checklist: Checklist) => void;
  onCreate?: (checklist: Checklist) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  isOpen,
  checklist,
  collection,
  user,
  onClose,
  onSave,
  onCreate
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [constrainDates, setConstrainDates] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [newStatus, setNewStatus] = useState(false);
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    items: [] as ChecklistItem[],
    collectionId: collection.id,
    isPublic: collection.isPublic || false
  });

  // Check if user can edit
  const isReadOnly = React.useMemo(() => {
    if (!checklist) return false; // New checklist - can edit
    if (!user) return true;
    
    // User owns the checklist
    if (checklist.userId === user.id) return false;
    
    // User has access to the collection
    if (collection.sharedWith?.includes(user.id)) return false;
    
    return true;
  }, [checklist, user, collection]);

  useEffect(() => {
    if (isOpen) {
      // Initialize form data
      setFormData({
        name: checklist?.name || '',
        date: checklist?.date || '',
        items: checklist?.items || [],
        collectionId: collection.id,
        isPublic: collection.isPublic || false
      });
      setItems(checklist?.items || []);
      setWarning(null);
      setNewItem('');
      setNewStatus(false);
    }
  }, [isOpen, checklist, collection]);

  const handleClose = () => {
    setWarning(null);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const addItem = () => {
    if (newItem.trim() === '') {
      setWarning('Item cannot be empty');
      return;
    }
    
    if (items.find(item => item.name.trim() === newItem.trim())) {
      setWarning('Item already exists');
      return;
    }

    const newChecklistItem: ChecklistItem = {
      id: `temp_${Date.now()}`, // Temporary ID
      name: newItem.trim(),
      completed: newStatus,
      userId: user?.id || '',
      checklistId: checklist?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedItems = [...items, newChecklistItem];
    setItems(updatedItems);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setNewItem('');
    setNewStatus(false);
    setWarning(null);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setWarning('Checklist name is required');
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      date: formData.date || null,
      items: items
    };

    try {
      if (checklist?.id) {
        // Update existing checklist
        if (onSave) {
          onSave({ ...checklist, ...payload });
        }
      } else {
        // Create new checklist
        if (onCreate) {
          const newChecklist: Checklist = {
            id: `temp_${Date.now()}`, // Temporary ID
            ...payload,
            userId: user?.id || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onCreate(newChecklist);
        }
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save checklist:', error);
      setWarning('Failed to save checklist');
    }
  };

  const handleAddItemKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addItem();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">
            {checklist?.id ? 'Edit Checklist' : 'New Checklist'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning Message */}
          {warning && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {warning}
            </div>
          )}

          {/* Basic Information Section */}
          <div className="mb-4 border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="text-lg font-bold text-gray-900">Basic Information</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${basicInfoExpanded ? 'rotate-180' : ''}`} />
            </button>
            {basicInfoExpanded && (
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  {collection.startDate && collection.endDate && !isReadOnly && (
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={constrainDates}
                        onChange={(e) => setConstrainDates(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Constrain to collection dates</span>
                    </label>
                  )}
                  <input
                    type="date"
                    id="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={constrainDates ? collection.startDate : undefined}
                    max={constrainDates ? collection.endDate : undefined}
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="mb-4 border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setItemsExpanded(!itemsExpanded)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span className="text-lg font-bold text-gray-900">Items</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${itemsExpanded ? 'rotate-180' : ''}`} />
            </button>
            {itemsExpanded && (
              <div className="p-4 space-y-4">
                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newStatus}
                      onChange={(e) => setNewStatus(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="New item"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={handleAddItemKeyDown}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900">Items</h4>
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => updateItem(index, 'completed', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isReadOnly}
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly={isReadOnly}
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Public Collection Warning */}
          {collection.isPublic && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This checklist will be public since it belongs to a public collection.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {!isReadOnly && (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
