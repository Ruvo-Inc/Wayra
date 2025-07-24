import React from 'react';
import { useRouter } from 'next/router';
import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Country {
  id: string;
  name: string;
  country_code: string;
  flag_url: string;
  subregion?: string;
  capital?: string;
  num_visits: number;
  num_regions: number;
}

interface CountryCardProps {
  country: Country;
}

export const CountryCard: React.FC<CountryCardProps> = ({ country }) => {
  const router = useRouter();

  const handleNavigation = () => {
    router.push(`/worldtravel/${country.country_code}`);
  };

  const getVisitStatus = () => {
    if (country.num_visits > 0 && country.num_visits !== country.num_regions) {
      return {
        text: `Visited ${country.num_visits} Region${country.num_visits > 1 ? 's' : ''}`,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      };
    } else if (country.num_visits > 0 && country.num_visits === country.num_regions) {
      return {
        text: 'Visited',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      };
    } else {
      return {
        text: 'Not Visited',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      };
    }
  };

  const visitStatus = getVisitStatus();

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group overflow-hidden">
      {/* Flag Image */}
      <div className="relative">
        <img 
          src={country.flag_url} 
          alt={`Flag of ${country.name}`} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            // Fallback for broken flag images
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder-flag.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          {country.name}
        </h2>

        {/* Info Badges */}
        <div className="flex flex-wrap gap-2">
          {country.subregion && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {country.subregion}
            </span>
          )}
          
          {country.capital && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              <MapPinIcon className="w-3 h-3" />
              {country.capital}
            </span>
          )}

          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${visitStatus.className}`}>
            {visitStatus.text}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            onClick={handleNavigation}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountryCard;
