'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TravelSearch from '@/components/travel/TravelSearch';
import { Plane, Hotel, MapPin, Star, Clock, Users } from 'lucide-react';

const TravelPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Travel Search</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Find the best flights and hotels for your next adventure
                </p>
              </div>
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">Welcome, {user.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Banner */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Flight Search</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Search across multiple airlines and booking platforms to find the best flight deals for your trip.
            </p>
            <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Real-time prices</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>Global coverage</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Hotel className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Hotel Search</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Discover accommodations from budget-friendly options to luxury resorts with detailed reviews and ratings.
            </p>
            <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>Verified reviews</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Group bookings</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Smart Integration</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Seamlessly integrate your search results with trip planning and collaborate with your travel companions.
            </p>
            <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Team collaboration</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Real-time sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Search Component */}
        <TravelSearch 
          onResultsFound={(results) => {
            console.log('Travel search results:', results);
          }}
        />

        {/* API Information */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Powered by Leading Travel APIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plane className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Amadeus</h4>
              <p className="text-sm text-gray-600">
                Global leader in travel technology providing comprehensive flight and hotel data from airlines and hotels worldwide.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plane className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Skyscanner</h4>
              <p className="text-sm text-gray-600">
                Popular flight comparison platform offering competitive pricing and extensive route coverage across the globe.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Hotel className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Booking.com</h4>
              <p className="text-sm text-gray-600">
                World's largest accommodation booking platform with millions of properties and verified guest reviews.
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-gray-700 mb-4">
            Ready to start planning your next trip? Here's how to get the most out of Wayra's travel search:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Search & Compare</h4>
                <p className="text-sm text-gray-600">Use our search tools to find flights and hotels that match your preferences and budget.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Plan Together</h4>
                <p className="text-sm text-gray-600">Share your findings with travel companions and collaborate on trip planning in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelPage;
