import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageFetcherProps {
  name?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onImageFetched: (file: File) => void;
}

export const ImageFetcher: React.FC<ImageFetcherProps> = ({
  name = null,
  isOpen,
  onClose,
  onImageFetched
}) => {
  const [url, setUrl] = useState('');
  const [wikiName, setWikiName] = useState(name || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setUrl('');
      setWikiName(name || '');
    }
  }, [isOpen, name]);

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Fetch image from URL
  const fetchImageFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }

      const file = new File([blob], 'image.jpg', { type: blob.type });
      onImageFetched(file);
      onClose();
    } catch (err) {
      setError('No image found at that URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch image from Wikipedia
  const fetchWikiImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wikiName.trim()) {
      setError('Please enter a Wikipedia article name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/generate/img/?name=${encodeURIComponent(wikiName)}`);
      const data = await response.json();
      
      if (data.source) {
        const imageResponse = await fetch(data.source);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch image from Wikipedia');
        }

        const blob = await imageResponse.blob();
        const file = new File([blob], `${wikiName}.jpg`, { type: 'image/jpeg' });
        onImageFetched(file);
        onClose();
      } else {
        setError('No image found for that Wikipedia article.');
      }
    } catch (err) {
      setError('No image found for that Wikipedia article.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Image Fetcher
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* URL Fetcher */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Fetch from URL</h4>
          <form onSubmit={fetchImageFromUrl} className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter image URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Fetching...' : 'Fetch from URL'}
            </button>
          </form>
        </div>

        {/* Wikipedia Fetcher */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Fetch from Wikipedia</h4>
          <form onSubmit={fetchWikiImage} className="space-y-3">
            <input
              type="text"
              value={wikiName}
              onChange={(e) => setWikiName(e.target.value)}
              placeholder="Enter Wikipedia article name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !wikiName.trim()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Fetching...' : 'Fetch from Wikipedia'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
