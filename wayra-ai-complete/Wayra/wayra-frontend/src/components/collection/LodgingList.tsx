'use client';

import React, { useState } from 'react';
import { Lodging } from '@/types/adventure';
import { AdventureApi } from '@/services/adventureApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { 
  PlusIcon,
  HomeIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface LodgingListProps {
  collectionId: string;
  lodging: Lodging[];
  onUpdate: (lodging: Lodging[]) => void;
  className?: string;
}

const LODGING_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'motel', label: 'Motel', icon: '🏩' },
  { value: 'resort', label: 'Resort', icon: '🏖️' },
  { value: 'hostel', label: 'Hostel', icon: '🏠' },
  { value: 'bnb', label: 'Bed & Breakfast', icon: '🏡' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'house', label: 'House', icon: '🏘️' },
  { value: 'cabin', label: 'Cabin', icon: '🏕️' },
  { value: 'camping', label: 'Camping', icon: '⛺' },
  { value: 'other', label: 'Other', icon: '🏠' }
];

export const LodgingList: React.FC<LodgingListProps> = ({
  collectionId,
  lodging,
  onUpdate,
  className = ''
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingLodging, setEditingLodging] = useState<Lodging | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hotel',
    address: '',
    checkInDate: '',
    checkOutDate: '',
    pricePerNight: '',
    totalCost: '',
    currency: 'USD',
    rating: '',
    bookingReference: '',
    website: '',
    phone: '',
    notes: ''
  });

  const adventureApi = new AdventureApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lodgingData = {
        ...formData,
        pricePerNight: formData.pricePerNight ? parseFloat(formData.pricePerNight) : undefined,
        totalCost: formData.totalCost ? parseFloat(formData.totalCost) : undefined,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
        checkInDate: formData.checkInDate ? new Date(formData.checkInDate).toISOString() : undefined,
        checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined
      };

      let result;
      if (editingLodging) {
        result = await adventureApi.updateCollectionLodging(
          collectionId,
          editingLodging.id,
          lodgingData
        );
        onUpdate(lodging.map(l => l.id === result.id ? result : l));
      } else {
        result = await adventureApi.createCollectionLodging(collectionId, lodgingData);
        onUpdate([...lodging, result]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving lodging:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Lodging) => {
    setEditingLodging(item);
    setFormData({
      name: item.name,
      type: item.type,
      address: item.address || '',
      checkInDate: item.checkInDate ? new Date(item.checkInDate).toISOString().split('T')[0] : '',
      checkOutDate: item.checkOutDate ? new Date(item.checkOutDate).toISOString().split('T')[0] : '',
      pricePerNight: item.pricePerNight?.toString() || '',
      totalCost: item.totalCost?.toString() || '',
      currency: item.currency || 'USD',
      rating: item.rating?.toString() || '',
      bookingReference: item.bookingReference || '',
      website: item.website || '',
      phone: item.phone || '',
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adventureApi.deleteCollectionLodging(collectionId, id);
      onUpdate(lodging.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting lodging:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLodging(null);
    setFormData({
      name: '',
      type: 'hotel',
      address: '',
      checkInDate: '',
      checkOutDate: '',
      pricePerNight: '',
      totalCost: '',
      currency: 'USD',
      rating: '',
      bookingReference: '',
      website: '',
      phone: '',
      notes: ''
    });
  };

  const getTypeIcon = (type: string) => {
    const lodgingType = LODGING_TYPES.find(t => t.value === type);
    return lodgingType?.icon || '🏠';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < rating ? (
          <StarIconSolid className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-300" />
        )}
      </span>
    ));
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Lodging</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Lodging
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Marriott Downtown"
                  required
                />
              </div>

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
                  {LODGING_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 123 Main St, New York, NY 10001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Night
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
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (1-5)
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No rating</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
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
                  placeholder="e.g., ABC123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., +1 (555) 123-4567"
                />
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
                  editingLodging ? 'Update' : 'Add'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lodging List */}
      {lodging.length > 0 ? (
        <div className="space-y-4">
          {lodging.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{getTypeIcon(item.type)}</span>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                      {item.rating && (
                        <div className="flex items-center mt-1">
                          {renderStars(item.rating)}
                          <span className="ml-1 text-sm text-gray-600">({item.rating}/5)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {item.address && (
                    <div className="flex items-center mb-2 text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{item.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    {item.checkInDate && item.checkOutDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>
                          {formatDate(item.checkInDate)} - {formatDate(item.checkOutDate)}
                          {' '}({calculateNights(item.checkInDate, item.checkOutDate)} nights)
                        </span>
                      </div>
                    )}

                    {item.pricePerNight && (
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>{item.currency} {item.pricePerNight}/night</span>
                      </div>
                    )}

                    {item.totalCost && (
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>Total: {item.currency} {item.totalCost}</span>
                      </div>
                    )}
                  </div>

                  {item.bookingReference && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Booking Reference:</strong> {item.bookingReference}
                    </div>
                  )}

                  {(item.website || item.phone) && (
                    <div className="mt-2 text-sm text-gray-600 space-x-4">
                      {item.website && (
                        <a
                          href={item.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Website
                        </a>
                      )}
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {item.phone}
                        </a>
                      )}
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
          title="No lodging added"
          description="Add lodging details to keep track of your accommodation arrangements."
          icon={<HomeIcon className="h-12 w-12" />}
          action={{
            label: "Add Lodging",
            onClick: () => setShowForm(true)
          }}
        />
      )}
    </div>
  );
};
