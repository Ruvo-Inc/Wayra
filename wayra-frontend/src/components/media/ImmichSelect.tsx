import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  CalendarDaysIcon, 
  PhotoIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { Adventure, ImmichAlbum, ImmichImage } from '../../types/adventure';
import { debounce } from 'lodash';

interface ImmichSelectProps {
  adventure?: Adventure | null;
  copyImmichLocally?: boolean;
  onRemoteImmichSaved?: (data: any) => void;
  onFetchImage?: (imageUrl: string) => void;
}

type SearchCategory = 'search' | 'date' | 'album';

export const ImmichSelect: React.FC<ImmichSelectProps> = ({
  adventure = null,
  copyImmichLocally = false,
  onRemoteImmichSaved,
  onFetchImage
}) => {
  const [immichImages, setImmichImages] = useState<ImmichImage[]>([]);
  const [immichSearchValue, setImmichSearchValue] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('date');
  const [immichError, setImmichError] = useState('');
  const [immichNextURL, setImmichNextURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<ImmichAlbum[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Initialize selected date from adventure visits or current date
  useEffect(() => {
    if (adventure?.visits && adventure.visits.length > 0) {
      const latestVisit = adventure.visits
        .map(v => new Date(v.end_date || v.start_date))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      setSelectedDate(latestVisit.toISOString().split('T')[0]);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [adventure]);

  // Load albums on mount
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch('/api/integrations/immich/albums');
        if (response.ok) {
          const data = await response.json();
          setAlbums(data);
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };

    fetchAlbums();
  }, []);

  // Handle search category changes
  useEffect(() => {
    if (searchCategory === 'album' && currentAlbum) {
      setImmichImages([]);
      fetchAlbumAssets(currentAlbum);
    } else if (searchCategory === 'date' && selectedDate) {
      if (currentAlbum) {
        setCurrentAlbum('');
      }
      searchImmich();
    } else if (searchCategory === 'search') {
      if (currentAlbum) {
        setCurrentAlbum('');
      }
    }
  }, [searchCategory, currentAlbum, selectedDate]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (immichSearchValue && searchCategory === 'search') {
      params.append('query', immichSearchValue);
    } else if (selectedDate && searchCategory === 'date') {
      params.append('date', selectedDate);
    }
    return params.toString();
  };

  const fetchAssets = async (url: string, usingNext = false) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      setImmichError('');
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error in handling fetchAssets', data.message);
        setImmichError(data.code || 'Error fetching assets');
      } else {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          if (usingNext) {
            setImmichImages(prev => [...prev, ...data.results]);
          } else {
            setImmichImages(data.results);
          }
        } else {
          setImmichError('No items found');
        }
        setImmichNextURL(data.next || '');
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      setImmichError('Error fetching assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumAssets = async (albumId: string) => {
    return fetchAssets(`/api/integrations/immich/albums/${albumId}`);
  };

  const _searchImmich = async () => {
    setImmichImages([]);
    return fetchAssets(`/api/integrations/immich/search/?${buildQueryParams()}`);
  };

  const searchImmich = useCallback(
    debounce(() => {
      _searchImmich();
    }, 500),
    [immichSearchValue, selectedDate, searchCategory]
  );

  const loadMoreImmich = async () => {
    if (immichNextURL) {
      const url = new URL(immichNextURL);
      const relativePath = url.pathname + url.search;
      return fetchAssets(relativePath, true);
    }
  };

  const saveImmichRemoteUrl = async (imageId: string) => {
    if (!adventure) {
      console.error('No adventure provided to save the image URL');
      return;
    }

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          immich_id: imageId,
          adventure: adventure.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.image) {
          console.error('No image data returned from the server');
          setImmichError('Error saving image');
          return;
        }
        onRemoteImmichSaved?.(data);
      } else {
        const errorData = await response.json();
        console.error('Error saving image URL:', errorData);
        setImmichError(errorData.message || 'Error saving image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      setImmichError('Error saving image');
    }
  };

  const handleImageSelect = (image: ImmichImage) => {
    const currentDomain = window.location.origin;
    const fullUrl = `${currentDomain}/immich/${image.id}`;
    
    if (copyImmichLocally) {
      onFetchImage?.(fullUrl);
    } else {
      saveImmichRemoteUrl(image.id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchImmich();
  };

  return (
    <div className="mb-4">
      <label htmlFor="immich" className="block font-medium mb-2 flex items-center gap-2">
        Immich
        <PhotoIcon className="h-6 w-6" />
      </label>

      <div className="mt-4">
        {/* Search Category Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setCurrentAlbum('');
              setSearchCategory('search');
            }}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              searchCategory === 'search'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
            Search
          </button>
          <button
            type="button"
            onClick={() => setSearchCategory('date')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              searchCategory === 'date'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
            Date
          </button>
          <button
            type="button"
            onClick={() => setSearchCategory('album')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              searchCategory === 'album'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <PhotoIcon className="w-4 h-4 inline mr-1" />
            Album
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          {searchCategory === 'search' && (
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Search images..."
                value={immichSearchValue}
                onChange={(e) => setImmichSearchValue(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Search
              </button>
            </form>
          )}

          {searchCategory === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          {searchCategory === 'album' && (
            <select
              value={currentAlbum}
              onChange={(e) => setCurrentAlbum(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                Select an Album
              </option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.albumName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error Message */}
      {immichError && (
        <p className="text-red-500 text-sm mb-4">{immichError}</p>
      )}

      {/* Images Grid */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div className={`flex flex-wrap gap-4 ${loading ? 'opacity-50' : ''}`}>
          {immichImages.map((image) => (
            <div key={image.id} className="flex flex-col items-center gap-2">
              <img
                src={image.image_url}
                alt="Image from Immich"
                className="h-24 w-24 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-image.png';
                }}
              />
              <h4 className="text-xs text-gray-600 dark:text-gray-400">
                {image.fileCreatedAt?.split('T')[0] || 'Unknown'}
              </h4>
              <button
                type="button"
                onClick={() => handleImageSelect(image)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                <ArrowUpTrayIcon className="w-3 h-3" />
                Upload Image
              </button>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {immichNextURL && (
          <div className="mt-4">
            <button
              onClick={loadMoreImmich}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImmichSelect;
