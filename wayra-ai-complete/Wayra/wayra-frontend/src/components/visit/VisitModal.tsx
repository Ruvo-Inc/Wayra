import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Visit, Adventure } from '../../types/adventure';
import { TimezoneSelector } from '../common/TimezoneSelector';

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visit: Partial<Visit>) => void;
  visit?: Visit | null;
  adventure?: Adventure | null;
  title?: string;
}

export const VisitModal: React.FC<VisitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  visit = null,
  adventure = null,
  title = 'Add Visit'
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: '',
    isVisited: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visit) {
      // Editing existing visit
      const startDate = visit.startDate ? new Date(visit.startDate) : null;
      const endDate = visit.endDate ? new Date(visit.endDate) : null;
      
      setFormData({
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        startTime: startDate && !visit.isAllDay ? startDate.toTimeString().slice(0, 5) : '',
        endTime: endDate && !visit.isAllDay ? endDate.toTimeString().slice(0, 5) : '',
        isAllDay: visit.isAllDay || false,
        timezone: visit.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: visit.notes || '',
        isVisited: visit.isVisited || false
      });
    } else {
      // Creating new visit
      setFormData({
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isAllDay: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: '',
        isVisited: false
      });
    }
    setErrors({});
  }, [visit, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && formData.startDate) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);
      
      if (endDateTime < startDateTime) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.isAllDay) {
      if (formData.startDate && !formData.startTime) {
        newErrors.startTime = 'Start time is required for timed visits';
      }
      if (formData.endDate && !formData.endTime) {
        newErrors.endTime = 'End time is required when end date is set';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Construct the visit data
      const visitData: Partial<Visit> = {
        adventureId: (adventure as any)?._id || adventure?.id || visit?.adventureId,
        isAllDay: formData.isAllDay,
        timezone: formData.timezone,
        notes: formData.notes.trim() || null,
        isVisited: formData.isVisited
      };

      // Handle dates
      if (formData.startDate) {
        if (formData.isAllDay) {
          visitData.startDate = new Date(`${formData.startDate}T00:00:00`).toISOString();
        } else {
          visitData.startDate = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`).toISOString();
        }
      }

      if (formData.endDate) {
        if (formData.isAllDay) {
          visitData.endDate = new Date(`${formData.endDate}T23:59:59`).toISOString();
        } else {
          visitData.endDate = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`).toISOString();
        }
      } else if (formData.startDate && !formData.isAllDay && formData.startTime) {
        // If no end date but we have start time, set end time to 1 hour later
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        startDateTime.setHours(startDateTime.getHours() + 1);
        visitData.endDate = startDateTime.toISOString();
      }

      if (visit) {
        visitData.id = visit.id;
      }

      await onSave(visitData);
      onClose();
    } catch (error) {
      console.error('Error saving visit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Adventure Info */}
          {adventure && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{adventure.category?.icon || '📍'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{adventure.name}</h3>
                  {adventure.location && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {adventure.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => handleInputChange('isAllDay', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-700">
              All day event
            </label>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.startDate ? 'border-red-500' : ''
              }`}
              required
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>

          {/* Start Time */}
          {!formData.isAllDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startTime ? 'border-red-500' : ''
                }`}
                required={!formData.isAllDay}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>
          )}

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              min={formData.startDate}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.endDate ? 'border-red-500' : ''
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>

          {/* End Time */}
          {!formData.isAllDay && formData.endDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endTime ? 'border-red-500' : ''
                }`}
                required={formData.endDate && !formData.isAllDay}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <TimezoneSelector
              selectedTimezone={formData.timezone}
              onTimezoneChange={(timezone) => handleInputChange('timezone', timezone)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="w-4 h-4 inline mr-1" />
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this visit..."
            />
          </div>

          {/* Visited Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVisited"
              checked={formData.isVisited}
              onChange={(e) => handleInputChange('isVisited', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isVisited" className="ml-2 text-sm text-gray-700">
              Mark as visited
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (visit ? 'Update Visit' : 'Create Visit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
