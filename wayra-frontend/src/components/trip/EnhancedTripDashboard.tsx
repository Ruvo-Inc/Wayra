'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign, Users, Plus, Edit, Trash2 } from 'lucide-react';

interface TripItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  title: string;
  date: string;
  time?: string;
  location: string;
  price: number;
  currency: string;
  status: 'booked' | 'planned' | 'wishlist';
  bookingUrl?: string;
}

interface EnhancedTripDashboardProps {
  tripId: string;
  tripName: string;
  budget: number;
  currency: string;
}

const EnhancedTripDashboard: React.FC<EnhancedTripDashboardProps> = ({
  tripId,
  tripName,
  budget,
  currency = 'USD'
}) => {
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'bookings'>('itinerary');

  // Sample data - in real app, this would come from API
  useEffect(() => {
    const sampleItems: TripItem[] = [
      {
        id: '1',
        type: 'flight',
        title: 'Flight to New York',
        date: '2024-08-15',
        time: '10:30 AM',
        location: 'JFK Airport',
        price: 450,
        currency: 'USD',
        status: 'booked',
        bookingUrl: 'https://booking.com/flight/123'
      },
      {
        id: '2',
        type: 'hotel',
        title: 'Hotel Manhattan',
        date: '2024-08-15',
        location: 'Times Square, NYC',
        price: 200,
        currency: 'USD',
        status: 'booked'
      },
      {
        id: '3',
        type: 'activity',
        title: 'Statue of Liberty Tour',
        date: '2024-08-16',
        time: '2:00 PM',
        location: 'Liberty Island',
        price: 75,
        currency: 'USD',
        status: 'planned'
      }
    ];
    
    setTripItems(sampleItems);
    setTotalSpent(sampleItems.reduce((sum, item) => sum + item.price, 0));
  }, []);

  const budgetPercentage = (totalSpent / budget) * 100;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      default: return '📍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-green-100 text-green-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'wishlist': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tripName}</h1>
            <p className="text-gray-600">Trip ID: {tripId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Budget</p>
              <p className="text-lg font-semibold">${budget.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Spent</p>
              <p className="text-lg font-semibold text-blue-600">${totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Budget Progress</span>
            <span>{budgetPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                budgetPercentage > 90 ? 'bg-red-500' : 
                budgetPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'itinerary', label: 'Itinerary', icon: Calendar },
              { id: 'budget', label: 'Budget', icon: DollarSign },
              { id: 'bookings', label: 'Bookings', icon: MapPin }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'itinerary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Trip Itinerary</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {tripItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(item.type)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{item.date}</span>
                              {item.time && <span>at {item.time}</span>}
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{item.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ${item.price.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {item.bookingUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <a
                          href={item.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Booking →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Budget Breakdown</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">✈️</span>
                    <div>
                      <p className="text-sm text-gray-600">Flights</p>
                      <p className="text-lg font-semibold">$450</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🏨</span>
                    <div>
                      <p className="text-sm text-gray-600">Hotels</p>
                      <p className="text-lg font-semibold">$200</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm text-gray-600">Activities</p>
                      <p className="text-lg font-semibold">$75</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Remaining Budget</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className="text-lg font-semibold text-green-600">
                    ${(budget - totalSpent).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Booking Management</h2>
              
              <div className="space-y-3">
                {tripItems.filter(item => item.status === 'booked').map((item) => (
                  <div key={item.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(item.type)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.price.toLocaleString()}</p>
                        <p className="text-sm text-green-600">Confirmed</p>
                      </div>
                    </div>
                    {item.bookingUrl && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <a
                          href={item.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-green-700 hover:text-green-900 font-medium"
                        >
                          <span>Manage Booking</span>
                          <span>→</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedTripDashboard;
