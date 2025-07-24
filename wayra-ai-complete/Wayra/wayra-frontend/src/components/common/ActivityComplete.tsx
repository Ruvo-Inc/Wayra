import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ActivityCompleteProps {
  activities?: string[] | null;
  onActivitiesChange?: (activities: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const ActivityComplete: React.FC<ActivityCompleteProps> = ({
  activities: initialActivities = [],
  onActivitiesChange,
  placeholder = "Add a tag",
  className = ""
}) => {
  const [activities, setActivities] = useState<string[]>(initialActivities || []);
  const [allActivities, setAllActivities] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all available activities on mount
  useEffect(() => {
    fetchAllActivities();
  }, []);

  // Update activities when prop changes
  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities);
    }
  }, [initialActivities]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.activities) {
          setAllActivities(data.activities);
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = () => {
    if (inputValue.trim()) {
      const trimmedInput = inputValue.trim().toLowerCase();
      if (trimmedInput && !activities.includes(trimmedInput)) {
        const newActivities = [...activities, trimmedInput];
        setActivities(newActivities);
        onActivitiesChange?.(newActivities);
        setInputValue('');
        setIsDropdownOpen(false);
      }
    }
  };

  const removeActivity = (activityToRemove: string) => {
    const newActivities = activities.filter(activity => activity !== activityToRemove);
    setActivities(newActivities);
    onActivitiesChange?.(newActivities);
  };

  const selectActivity = (activity: string) => {
    setInputValue(activity);
    addActivity();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addActivity();
    } else if (event.key === 'Escape') {
      setIsDropdownOpen(false);
      setInputValue('');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setIsDropdownOpen(value.length > 0);
  };

  // Filter activities based on input and exclude already selected ones
  const filteredActivities = allActivities.filter(activity =>
    activity.toLowerCase().includes(inputValue.toLowerCase()) &&
    !activities.includes(activity.toLowerCase())
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Section */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsDropdownOpen(inputValue.length > 0)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            
            {/* Dropdown */}
            {isDropdownOpen && inputValue && filteredActivities.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredActivities.map((activity, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectActivity(activity)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{activity}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={addActivity}
            disabled={!inputValue.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Selected Activities */}
      {activities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Activities ({activities.length})
          </h4>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                  {activity}
                </span>
                <button
                  type="button"
                  onClick={() => removeActivity(activity)}
                  className="inline-flex items-center p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  aria-label={`Remove ${activity}`}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activities.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No activities added yet. Start typing to add some!
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading activities...
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityComplete;
