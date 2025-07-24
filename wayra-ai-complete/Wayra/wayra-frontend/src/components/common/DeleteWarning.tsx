import React, { useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteWarningProps {
  title: string;
  buttonText: string;
  description: string;
  isWarning?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteWarning: React.FC<DeleteWarningProps> = ({
  title,
  buttonText,
  description,
  isWarning = false,
  isOpen,
  onClose,
  onConfirm
}) => {
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

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${
          isWarning ? 'border-2 border-yellow-400' : ''
        }`}
        role="dialog"
        tabIndex={0}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon 
                className={`w-6 h-6 ${
                  isWarning ? 'text-yellow-600' : 'text-red-600'
                }`} 
              />
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">{description}</p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                isWarning 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
