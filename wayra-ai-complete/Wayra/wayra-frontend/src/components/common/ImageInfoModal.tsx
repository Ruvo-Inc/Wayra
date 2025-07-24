import React, { useEffect } from 'react';

interface Background {
  author: string;
  location: string;
}

interface ImageInfoModalProps {
  background: Background;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageInfoModal: React.FC<ImageInfoModalProps> = ({
  background,
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          About This Background
        </h3>

        {/* Content */}
        <div className="flex flex-col items-center space-y-2 mb-6">
          {background.author && (
            <p className="text-center text-gray-700">
              Photo by {background.author}
            </p>
          )}
          
          {background.location && (
            <p className="text-center text-gray-700">
              Location: {background.location}
            </p>
          )}
          
          <p className="text-center text-gray-600 mt-4">
            <a
              href="https://discord.gg/wRbQ9Egr8C"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Join Discord
            </a>
            {' '}to share your own backgrounds!
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
