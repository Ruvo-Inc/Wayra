import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  MapPinIcon, 
  EyeIcon, 
  CheckCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface Region {
  id: string;
  name: string;
  country_name: string;
  num_cities: number;
}

interface RegionCardProps {
  region: Region;
  visited?: boolean;
  onVisit?: (data: any) => void;
  onRemove?: (region: Region) => void;
}

export const RegionCard: React.FC<RegionCardProps> = ({
  region,
  visited,
  onVisit,
  onRemove
}) => {
  const router = useRouter();
  const [isVisited, setIsVisited] = useState(visited);
  const [loading, setLoading] = useState(false);

  const goToCity = () => {
    const countryCode = region.id.split('-')[0];
    router.push(`/worldtravel/${countryCode}/${region.id}`);
  };

  const markVisited = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/visitedregion/', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ region: region.id })
      });

      if (response.ok) {
        const data = await response.json();
        setIsVisited(true);
        console.log(`Visit to ${region.name} marked as visited`);
        onVisit?.(data);
      } else {
        console.error('Failed to mark region as visited');
        alert(`Failed to mark visit to ${region.name}`);
      }
    } catch (error) {
      console.error('Error marking region as visited:', error);
      alert(`Failed to mark visit to ${region.name}`);
    } finally {
      setLoading(false);
    }
  };

  const removeVisit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/visitedregion/${region.id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE'
      });

      if (response.ok) {
        setIsVisited(false);
        console.log(`Visit to ${region.name} removed`);
        onRemove?.(region);
      } else {
        console.error('Failed to remove region visit');
        alert(`Failed to remove visit to ${region.name}`);
      }
    } catch (error) {
      console.error('Error removing region visit:', error);
      alert(`Failed to remove visit to ${region.name}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          {region.name}
        </h2>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {region.country_name}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {region.num_cities} Cities
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            ID: {region.id}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 justify-end">
          {isVisited === false && (
            <button
              onClick={markVisited}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {loading ? 'Marking...' : 'Mark Visited'}
            </button>
          )}

          {isVisited === true && (
            <button
              onClick={removeVisit}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <XMarkIcon className="w-4 h-4" />
              {loading ? 'Removing...' : 'Remove'}
            </button>
          )}

          {region.num_cities > 0 && (
            <button
              onClick={goToCity}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <EyeIcon className="w-4 h-4" />
              View Cities
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionCard;
