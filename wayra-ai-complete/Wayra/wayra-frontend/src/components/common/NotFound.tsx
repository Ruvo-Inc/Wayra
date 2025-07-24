import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NotFoundProps {
  error?: string;
  title?: string;
  description?: string;
}

export const NotFound: React.FC<NotFoundProps> = ({ 
  error, 
  title = "No Adventures Found",
  description = "The adventure you're looking for doesn't exist or has been removed."
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 -mt-20">
      <div className="mx-auto max-w-md text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <ExclamationTriangleIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {title}
        </h1>
        
        {!error ? (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {description}
          </p>
        ) : (
          <p className="text-red-500 dark:text-red-400 mt-2 font-medium">
            {error}
          </p>
        )}
        
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
