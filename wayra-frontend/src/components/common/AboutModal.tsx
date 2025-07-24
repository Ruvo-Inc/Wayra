import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { appVersion, versionChangelog, appTitle, copyrightYear, companyName, companyUrl, sourceCodeUrl, licenseType } from '../../lib/config';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integrations {
  google_maps?: boolean;
  [key: string]: boolean | undefined;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [integrations, setIntegrations] = useState<Integrations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchIntegrations();
    }
  }, [isOpen]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      } else {
        setIntegrations(null);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setIntegrations(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="relative max-w-2xl w-full mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 transform transition-all duration-300 ease-out animate-slideUp"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Branding */}
          <div className="text-center mb-6">
            <h3
              id="about-modal-title"
              className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center justify-center"
            >
              About {appTitle}
              <img 
                src="/favicon.ico" 
                alt={`${appTitle} Logo`} 
                className="w-12 h-12 ml-3 inline-block" 
              />
            </h3>
            <p className="mt-3 text-gray-500 dark:text-gray-300 text-sm">
              {appTitle}{' '}
              <a
                href={versionChangelog}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {appVersion}
              </a>
            </p>
          </div>

          {/* Links and Details */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              © {copyrightYear}{' '}
              <a
                href={companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {companyName}
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Released under the {licenseType}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <a
                href={sourceCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View Source Code
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built with ❤️ for travelers and adventurers worldwide
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>

          {/* OSS Acknowledgments */}
          <div className="text-left">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Open Source Acknowledgments
            </h4>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                {integrations?.google_maps ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Location services powered by{' '}
                    <a
                      href="https://developers.google.com/maps/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Google Maps
                    </a>
                    .
                  </p>
                ) : integrations && !integrations.google_maps ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Location services powered by{' '}
                    <a
                      href="https://operations.osmfoundation.org/policies/nominatim/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      OpenStreetMap
                    </a>
                    . Data © OpenStreetMap contributors.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    This application uses various open source libraries and services.
                  </p>
                )}
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Built with React, Next.js, TypeScript, Tailwind CSS, and other amazing open source technologies.
                  Special thanks to all the contributors and maintainers of these projects.
                </p>
              </>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={onClose}
              className="px-8 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AboutModal;
