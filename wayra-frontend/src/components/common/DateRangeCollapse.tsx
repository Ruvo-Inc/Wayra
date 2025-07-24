import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Collection, Visit, TransportationVisit } from '../../types/adventure';
import { TimezoneSelector } from './TimezoneSelector';

interface DateRangeCollapseProps {
  collection?: Collection | null;
  type?: 'adventure' | 'transportation' | 'lodging';
  utcStartDate: string | null;
  utcEndDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  selectedStartTimezone: string;
  selectedEndTimezone: string;
  onStartTimezoneChange: (timezone: string) => void;
  onEndTimezoneChange: (timezone: string) => void;
  note?: string | null;
  onNoteChange?: (note: string) => void;
  visits?: (Visit | TransportationVisit)[] | null;
  onVisitsChange?: (visits: (Visit | TransportationVisit)[]) => void;
  className?: string;
}

export const DateRangeCollapse: React.FC<DateRangeCollapseProps> = ({
  collection = null,
  type = 'adventure',
  utcStartDate,
  utcEndDate,
  onStartDateChange,
  onEndDateChange,
  selectedStartTimezone,
  selectedEndTimezone,
  onStartTimezoneChange,
  onEndTimezoneChange,
  note = '',
  onNoteChange,
  visits = null,
  onVisitsChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [constrainDates, setConstrainDates] = useState(false);
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [localNote, setLocalNote] = useState(note || '');

  // Date constraint boundaries
  const fullStartDate = collection?.startDate ? `${collection.startDate}T00:00` : '';
  const fullEndDate = collection?.endDate ? `${collection.endDate}T23:59` : '';

  // Utility functions
  const isAllDayDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  };

  const formatDateInTimezone = (utcDate: string, timezone: string): string => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(utcDate));
    } catch {
      return new Date(utcDate).toLocaleString();
    }
  };

  const updateLocalDate = (utcDate: string | null, timezone: string): string => {
    if (!utcDate) return '';
    
    try {
      const date = new Date(utcDate);
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      
      if (allDay) {
        return localDate.toISOString().split('T')[0];
      } else {
        return localDate.toISOString().slice(0, 16);
      }
    } catch {
      return '';
    }
  };

  const updateUTCDate = (localDate: string, timezone: string, isAllDay: boolean): string | null => {
    if (!localDate) return null;
    
    try {
      let date: Date;
      
      if (isAllDay) {
        // For all-day events, create date at midnight UTC
        date = new Date(localDate + 'T00:00:00.000Z');
      } else {
        // For timed events, convert local datetime to UTC
        date = new Date(localDate);
      }
      
      return date.toISOString();
    } catch {
      return null;
    }
  };

  const validateDateRange = (startDate: string, endDate: string): { valid: boolean; message?: string } => {
    if (!startDate || !endDate) return { valid: true };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return { valid: false, message: 'End date must be after start date' };
    }
    
    return { valid: true };
  };

  // Initialize component
  useEffect(() => {
    // Auto-detect all-day for transportation and lodging types
    if ((type === 'transportation' || type === 'lodging') && utcStartDate) {
      setAllDay(isAllDayDate(utcStartDate));
    }

    // Initialize local dates
    setLocalStartDate(updateLocalDate(utcStartDate, selectedStartTimezone));
    setLocalEndDate(updateLocalDate(utcEndDate, type === 'transportation' ? selectedEndTimezone : selectedStartTimezone));
  }, []);

  // Update local dates when UTC dates or timezones change
  useEffect(() => {
    if (!isEditing) {
      setLocalStartDate(updateLocalDate(utcStartDate, selectedStartTimezone));
      setLocalEndDate(updateLocalDate(utcEndDate, type === 'transportation' ? selectedEndTimezone : selectedStartTimezone));
    }
  }, [utcStartDate, utcEndDate, selectedStartTimezone, selectedEndTimezone, allDay, isEditing]);

  // Handle local date changes
  const handleLocalDateChange = () => {
    const newUtcStartDate = updateUTCDate(localStartDate, selectedStartTimezone, allDay);
    const newUtcEndDate = updateUTCDate(localEndDate, type === 'transportation' ? selectedEndTimezone : selectedStartTimezone, allDay);
    
    onStartDateChange(newUtcStartDate);
    onEndDateChange(newUtcEndDate);
  };

  // Handle all-day toggle
  const handleAllDayToggle = (checked: boolean) => {
    setAllDay(checked);
    
    let newLocalStartDate = localStartDate;
    let newLocalEndDate = localEndDate;
    
    if (checked) {
      // Convert to date-only format
      newLocalStartDate = localStartDate ? localStartDate.split('T')[0] : '';
      newLocalEndDate = localEndDate ? localEndDate.split('T')[0] : '';
    } else {
      // Convert to datetime format
      newLocalStartDate = localStartDate ? localStartDate + 'T00:00' : '';
      newLocalEndDate = localEndDate ? localEndDate + 'T23:59' : '';
    }
    
    setLocalStartDate(newLocalStartDate);
    setLocalEndDate(newLocalEndDate);
    
    // Update UTC dates
    const newUtcStartDate = updateUTCDate(newLocalStartDate, selectedStartTimezone, checked);
    const newUtcEndDate = updateUTCDate(newLocalEndDate, type === 'transportation' ? selectedEndTimezone : selectedStartTimezone, checked);
    
    onStartDateChange(newUtcStartDate);
    onEndDateChange(newUtcEndDate);
  };

  // Create visit object
  const createVisitObject = (): Visit | TransportationVisit => {
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    if (type === 'transportation') {
      return {
        id: uniqueId,
        startDate: utcStartDate || '',
        endDate: utcEndDate || utcStartDate || '',
        notes: localNote,
        startTimezone: selectedStartTimezone,
        endTimezone: selectedEndTimezone
      } as TransportationVisit;
    } else {
      return {
        id: uniqueId,
        startDate: utcStartDate || '',
        endDate: utcEndDate || utcStartDate || '',
        notes: localNote,
        timezone: selectedStartTimezone
      } as Visit;
    }
  };

  // Add visit
  const handleAddVisit = () => {
    if (!onVisitsChange) return;
    
    const newVisit = createVisitObject();
    const updatedVisits = visits ? [...visits, newVisit] : [newVisit];
    onVisitsChange(updatedVisits);
    
    // Clear form
    setLocalNote('');
    setLocalStartDate('');
    setLocalEndDate('');
    onStartDateChange(null);
    onEndDateChange(null);
    if (onNoteChange) onNoteChange('');
  };

  // Edit visit
  const handleEditVisit = (visit: Visit | TransportationVisit) => {
    if (!onVisitsChange) return;
    
    setIsEditing(true);
    const isAllDayEvent = isAllDayDate(visit.startDate);
    setAllDay(isAllDayEvent);
    
    // Set timezone information
    if ('startTimezone' in visit) {
      onStartTimezoneChange(visit.startTimezone);
      onEndTimezoneChange(visit.endTimezone);
    } else if ('timezone' in visit && visit.timezone) {
      onStartTimezoneChange(visit.timezone);
    }
    
    // Set dates
    if (isAllDayEvent) {
      setLocalStartDate(visit.startDate.split('T')[0]);
      setLocalEndDate(visit.endDate.split('T')[0]);
    } else {
      setLocalStartDate(updateLocalDate(visit.startDate, selectedStartTimezone));
      setLocalEndDate(updateLocalDate(visit.endDate, 'endTimezone' in visit ? visit.endTimezone : selectedStartTimezone));
    }
    
    // Remove from visits list
    const updatedVisits = visits?.filter(v => v.id !== visit.id) || [];
    onVisitsChange(updatedVisits);
    
    setLocalNote(visit.notes);
    setConstrainDates(true);
    onStartDateChange(visit.startDate);
    onEndDateChange(visit.endDate);
    if (onNoteChange) onNoteChange(visit.notes);
    
    setTimeout(() => setIsEditing(false), 0);
  };

  // Remove visit
  const handleRemoveVisit = (visitId: string) => {
    if (!onVisitsChange || !visits) return;
    
    const updatedVisits = visits.filter(v => v.id !== visitId);
    onVisitsChange(updatedVisits);
  };

  // Get constraint dates
  const getConstraintStartDate = () => {
    if (!constrainDates) return '';
    return allDay ? (fullStartDate ? fullStartDate.split('T')[0] : '') : fullStartDate;
  };

  const getConstraintEndDate = () => {
    if (!constrainDates) return '';
    return allDay ? (fullEndDate ? fullEndDate.split('T')[0] : '') : fullEndDate;
  };

  const validation = validateDateRange(utcStartDate || '', utcEndDate || '');

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Collapse Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">Date Information</h3>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapse Content */}
      {isOpen && (
        <div className="p-4 pt-0 space-y-6">
          {/* Settings Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h4 className="text-md font-semibold text-gray-900">Settings</h4>

            {/* Timezone Selectors */}
            {type === 'transportation' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Timezone
                  </label>
                  <TimezoneSelector
                    selectedTimezone={selectedStartTimezone}
                    onTimezoneChange={onStartTimezoneChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival Timezone
                  </label>
                  <TimezoneSelector
                    selectedTimezone={selectedEndTimezone}
                    onTimezoneChange={onEndTimezoneChange}
                  />
                </div>
              </div>
            ) : (
              <TimezoneSelector
                selectedTimezone={selectedStartTimezone}
                onTimezoneChange={onStartTimezoneChange}
              />
            )}

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">All Day</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => handleAllDayToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Constrain Dates Toggle */}
            {collection?.startDate && collection?.endDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Constrain to Collection Dates</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={constrainDates}
                    onChange={(e) => setConstrainDates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {type === 'transportation' 
                  ? 'Departure Date' 
                  : type === 'lodging' 
                    ? 'Check In' 
                    : 'Start Date'}
              </label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={localStartDate}
                onChange={(e) => {
                  setLocalStartDate(e.target.value);
                  handleLocalDateChange();
                }}
                min={getConstraintStartDate()}
                max={getConstraintEndDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            {localStartDate && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {type === 'transportation' 
                    ? 'Arrival Date' 
                    : type === 'lodging' 
                      ? 'Check Out' 
                      : 'End Date'}
                </label>
                <input
                  type={allDay ? 'date' : 'datetime-local'}
                  value={localEndDate}
                  onChange={(e) => {
                    setLocalEndDate(e.target.value);
                    handleLocalDateChange();
                  }}
                  min={constrainDates ? localStartDate : ''}
                  max={getConstraintEndDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Notes (for adventures only) */}
            {type === 'adventure' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Notes
                </label>
                <textarea
                  value={localNote}
                  onChange={(e) => {
                    setLocalNote(e.target.value);
                    if (onNoteChange) onNoteChange(e.target.value);
                  }}
                  placeholder="Add notes..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Add Visit Button (for adventures only) */}
            {type === 'adventure' && (
              <button
                type="button"
                onClick={handleAddVisit}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Visit
              </button>
            )}
          </div>

          {/* Validation Message */}
          {!validation.valid && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">Invalid date range</span>
            </div>
          )}

          {/* Visits Section (for adventures only) */}
          {type === 'adventure' && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Visits</h4>
              
              {!visits || visits.length === 0 ? (
                <p className="text-sm text-gray-500">No visits added yet.</p>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <div key={visit.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                          {isAllDayDate(visit.startDate) ? (
                            <>
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mr-2">
                                All Day
                              </span>
                              {visit.startDate.split('T')[0]} – {visit.endDate.split('T')[0]}
                            </>
                          ) : 'startTimezone' in visit ? (
                            <>
                              {formatDateInTimezone(visit.startDate, visit.startTimezone)} – {formatDateInTimezone(visit.endDate, visit.endTimezone)}
                            </>
                          ) : 'timezone' in visit && visit.timezone ? (
                            <>
                              {formatDateInTimezone(visit.startDate, visit.timezone)} – {formatDateInTimezone(visit.endDate, visit.timezone)}
                            </>
                          ) : (
                            <>
                              {new Date(visit.startDate).toLocaleString()} – {new Date(visit.endDate).toLocaleString()}
                            </>
                          )}
                        </p>

                        {/* Timezone badges */}
                        {'timezone' in visit && visit.timezone && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {visit.timezone}
                          </span>
                        )}

                        {/* Transportation timezone info */}
                        {'startTimezone' in visit && 'endTimezone' in visit && visit.startTimezone !== visit.endTimezone && (
                          <p className="text-xs text-gray-600">
                            {visit.startTimezone} → {visit.endTimezone}
                          </p>
                        )}

                        {/* Notes */}
                        {visit.notes && (
                          <p className="text-sm text-gray-600 italic">
                            "{visit.notes}"
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEditVisit(visit)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveVisit(visit.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
