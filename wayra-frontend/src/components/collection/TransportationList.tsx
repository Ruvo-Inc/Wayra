'use client';

import React, { useState } from 'react';
import { Transportation } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { 
  PlusIcon,
  TruckIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface TransportationListProps {
  collectionId: string;
  transportation: Transportation[];
  onUpdate: (transportation: Transportation[]) => void;
  className?: string;
}

const TRANSPORTATION_TYPES = [
  { value: 'flight', label: 'Flight', icon: '✈️' },
  { value: 'train', label: 'Train', icon: '🚂' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'taxi', label: 'Taxi', icon: '🚕' },
  { value: 'uber', label: 'Uber/Lyft', icon: '🚙' },
  { value: 'ferry', label: 'Ferry', icon: '⛴️' },
  { value: 'other', label: 'Other', icon: '🚚' }
];

export const TransportationList: React.FC<TransportationListProps> = ({
  collectionId,
  transportation,
  onUpdate,
  className = ''
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransportation, setEditingTransportation] = useState<Transportation | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'flight',
    origin: '',
    destination: '',
    departureDate: '',
    arrivalDate: '',
    cost: '',
    currency: 'USD',
    bookingReference: '',
    notes: ''
  });

  const adventureApi = new AdventureApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transportationData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        departureDate: formData.departureDate ? new Date(formData.departureDate).toISOString() : undefined,
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate).toISOString() : undefined
      };

      let result;
      if (editingTransportation) {
        result = await adventureApi.updateCollectionTransportation(
          collectionId,
          editingTransportation.id,
          transportationData
        );
        onUpdate(transportation.map(t => t.id === result.id ? result : t));
      } else {
        result = await adventureApi.createCollectionTransportation(collectionId, transportationData);
        onUpdate([...transportation, result]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving transportation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Transportation) => {
    setEditingTransportation(item);
    setFormData({
      type: item.type,
      origin: item.origin,
      destination: item.destination,
      departureDate: item.departureDate ? new Date(item.departureDate).toISOString().split('T')[0] : '',
      arrivalDate: item.arrivalDate ? new Date(item.arrivalDate).toISOString().split('T')[0] : '',
      cost: item.cost?.toString() || '',
      currency: item.currency || 'USD',
      bookingReference: item.bookingReference || '',
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adventureApi.deleteCollectionTransportation(collectionId, id);
      onUpdate(transportation.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transportation:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTransportation(null);
    setFormData({
      type: 'flight',
      origin: '',
      destination: '',
      departureDate: '',
      arrivalDate: '',
      cost: '',
      currency: 'USD',
      bookingReference: '',
      notes: ''
    });
  };

  const getTypeIcon = (type: string) => {
    const transportType = TRANSPORTATION_TYPES.find(t => t.value === type);
    return transportType?.icon || '🚚';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Transportation</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Transportation
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {TRANSPORTATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Reference
                </label>
                <input
                  type="text"
                  value={formData.bookingReference}
                  onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ABC123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., New York, NY"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Los Angeles, CA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arrival Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <div className="flex">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  editingTransportation ? 'Update' : 'Add'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transportation List */}
      {transportation.length > 0 ? (
        <div className="space-y-4">
          {transportation.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{getTypeIcon(item.type)}</span>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {item.origin} → {item.destination}
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    {item.departureDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Departs: {formatDate(item.departureDate)}</span>
                      </div>
                    )}
                    
                    {item.arrivalDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Arrives: {formatDate(item.arrivalDate)}</span>
                      </div>
                    )}

                    {item.cost && (
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>{item.currency} {item.cost}</span>
                      </div>
                    )}
                  </div>

                  {item.bookingReference && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Booking Reference:</strong> {item.bookingReference}
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Notes:</strong> {item.notes}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No transportation added"
          description="Add transportation details to keep track of your travel arrangements."
          icon={<TruckIcon className="h-12 w-12" />}
          action={{
            label: "Add Transportation",
            onClick: () => setShowForm(true)
          }}
        />
      )}
    </div>
  );
};
