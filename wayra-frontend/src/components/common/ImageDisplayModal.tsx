import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Adventure } from '../../types/adventure';

interface ImageDisplayModalProps {
  image: string;
  adventure?: Adventure | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageDisplayModal: React.FC<ImageDisplayModalProps> = ({
  image,
  adventure = null,
  isOpen,
  onClose
}) => {
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

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative bg-white rounded-lg shadow-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        {adventure && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">
              {adventure.name}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        )}

        {/* Image Container */}
        <div className="flex items-center justify-center p-4">
          <img
            src={image}
            alt={adventure?.name || 'Image'}
            className="max-w-full max-h-[75vh] object-contain"
            style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
          />
        </div>

        {/* Close button if no adventure header */}
        {!adventure && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};
