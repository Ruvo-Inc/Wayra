import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Adventure, AdventureImage } from '../../types/adventure';
import { ImageDisplayModal } from './ImageDisplayModal';

interface CardCarouselProps {
  adventures: Adventure[];
  className?: string;
}

interface AdventureImageWithMeta {
  image: string;
  adventure: Adventure;
  isPrimary: boolean;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({ 
  adventures = [], 
  className = "" 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [adventureImages, setAdventureImages] = useState<AdventureImageWithMeta[]>([]);

  // Process and sort adventure images
  useEffect(() => {
    const images = adventures.flatMap((adventure) =>
      (adventure.images || []).map((image: AdventureImage) => ({
        image: image.url,
        adventure: adventure,
        isPrimary: image.isPrimary || false
      }))
    );

    // Sort so that primary images come first
    images.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) {
        return -1;
      } else if (!a.isPrimary && b.isPrimary) {
        return 1;
      } else {
        return 0;
      }
    });

    setAdventureImages(images);
    
    // Reset slide when images change
    if (images.length > 0) {
      setCurrentSlide(0);
    }
  }, [adventures]);

  const changeSlide = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSlide < adventureImages.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (direction === 'prev' && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      changeSlide('prev');
    } else if (event.key === 'ArrowRight') {
      changeSlide('next');
    }
  };

  return (
    <>
      {/* Image Display Modal */}
      {selectedImageUrl && adventureImages[currentSlide] && (
        <ImageDisplayModal
          isOpen={selectedImageUrl !== null}
          onClose={() => setSelectedImageUrl(null)}
          imageUrl={selectedImageUrl}
          adventureTitle={adventureImages[currentSlide].adventure.name}
        />
      )}

      <figure className={className}>
        {adventureImages.length > 0 ? (
          <div 
            className="relative w-full"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="img"
            aria-label={`Image ${currentSlide + 1} of ${adventureImages.length} from ${adventureImages[currentSlide]?.adventure.name}`}
          >
            {/* Main Image */}
            <div className="w-full h-48 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
              <button
                onClick={() => handleImageClick(adventureImages[currentSlide].image)}
                className="w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                aria-label={`View full size image of ${adventureImages[currentSlide].adventure.name}`}
              >
                <img
                  src={adventureImages[currentSlide].image}
                  alt={adventureImages[currentSlide].adventure.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>

              {/* Navigation Controls */}
              {adventureImages.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2">
                  {/* Previous Button */}
                  {currentSlide > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeSlide('prev');
                      }}
                      className="pointer-events-auto p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}

                  {/* Next Button */}
                  {currentSlide < adventureImages.length - 1 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeSlide('next');
                      }}
                      className="pointer-events-auto p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}

              {/* Image Counter */}
              {adventureImages.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
                  {currentSlide + 1} / {adventureImages.length}
                </div>
              )}

              {/* Primary Image Indicator */}
              {adventureImages[currentSlide]?.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                  Primary
                </div>
              )}
            </div>

            {/* Dot Indicators */}
            {adventureImages.length > 1 && (
              <div className="flex justify-center mt-3 space-x-2">
                {adventureImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      index === currentSlide
                        ? 'bg-blue-600 w-4'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Adventure Title Overlay */}
            {adventureImages[currentSlide] && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                <h3 className="text-white font-medium text-sm truncate">
                  {adventureImages[currentSlide].adventure.name}
                </h3>
                {adventureImages[currentSlide].adventure.location && (
                  <p className="text-white/80 text-xs truncate">
                    {adventureImages[currentSlide].adventure.location}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* No Images Placeholder */
          <div className="w-full h-48 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
            </div>
            
            {/* Content */}
            <div className="text-center text-white z-10">
              <div className="w-12 h-12 mx-auto mb-2 opacity-60">
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium opacity-80">No images available</p>
            </div>
          </div>
        )}
      </figure>
    </>
  );
};

export default CardCarousel;
