import React, { useState } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface City {
  id: string;
  name: string;
  region: string;
  region_name: string;
  country_name: string;
}

interface CityCardProps {
  city: City;
  visited: boolean;
  onVisit?: (visitData: any) => void;
  onRemove?: (city: City) => void;
  className?: string;
}

export const CityCard: React.FC<CityCardProps> = ({
  city,
  visited: initialVisited,
  onVisit,
  onRemove,
  className = ""
}) => {
  const [visited, setVisited] = useState(initialVisited);
  const [isLoading, setIsLoading] = useState(false);

  const markVisited = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/visitedcity/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await (window as any).user?.getIdToken()}`
        },
        body: JSON.stringify({ city: city.id })
      });

      if (response.ok) {
        const data = await response.json();
        setVisited(true);
        onVisit?.(data);
        
        // Show success toast (you can implement a toast system)
        console.log(`Visit to ${city.name} marked`);
      } else {
        console.error('Failed to mark city as visited');
        // Show error toast
        console.error(`Failed to mark visit to ${city.name}`);
      }
    } catch (error) {
      console.error('Error marking city as visited:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeVisit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/visitedcity/${city.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await (window as any).user?.getIdToken()}`
        }
      });

      if (response.ok) {
        setVisited(false);
        onRemove?.(city);
        
        // Show info toast
        console.log(`Visit to ${city.name} removed`);
      } else {
        console.error('Failed to remove visit');
        // Show error toast
        console.error(`Failed to remove visit to ${city.name}`);
      }
    } catch (error) {
      console.error('Error removing city visit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group overflow-hidden rounded-lg ${className}`}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate flex-1 mr-2">
            {city.name}
          </h2>
          
          {/* Visit Status Icon */}
          <div className="flex-shrink-0">
            {visited ? (
              <CheckCircleIconSolid className="w-6 h-6 text-green-500" />
            ) : (
              <CheckCircleIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {city.region_name}, {city.country_name}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Region ID: {city.region}
          </span>
        </div>

        {/* Visit Status */}
        <div className="flex items-center gap-2 text-sm">
          {visited ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircleIconSolid className="w-4 h-4 mr-1" />
              <span className="font-medium">Visited</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              <span>Not visited</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          {!visited ? (
            <button
              onClick={markVisited}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Mark Visited
                </>
              )}
            </button>
          ) : (
            <button
              onClick={removeVisit}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Removing...
                </>
              ) : (
                <>
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Remove Visit
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default CityCard;
