'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdventureApi } from '@/services/adventureApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { 
  ChartBarIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  GlobeAltIcon,
  FolderIcon,
  TrophyIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Stats {
  adventures: {
    totalAdventures: number;
    visitedAdventures: number;
    plannedAdventures: number;
    uniqueCountries: number;
    averageRating: number | null;
    byCategory?: Array<{ category: string; count: number; icon: string }>;
    byRating?: Array<{ rating: number; count: number }>;
    recentlyAdded?: Array<{ id: string; name: string; createdAt: string }>;
  };
  collections?: {
    total: number;
    public: number;
    private: number;
    archived: number;
    byType: Array<{ type: string; count: number }>;
    recentlyCreated: Array<{ id: string; name: string; createdAt: string }>;
  };
  visits?: {
    total: number;
    thisYear: number;
    thisMonth: number;
    byMonth: Array<{ month: string; count: number }>;
    byYear: Array<{ year: number; count: number }>;
  };
  geography: {
    visitedCountries: number;
    visitedRegions: number;
    visitedCities: number;
    totalCountries: number;
    totalRegions: number;
    totalCities: number;
    countryPercentage: string;
    regionPercentage: string;
    cityPercentage: string;
    topCountries?: Array<{ country: string; count: number }>;
    topCities?: Array<{ city: string; count: number }>;
  };
  timeline: {
    firstAdventure: string | null;
    lastVisit: string | null;
    totalDays: number;
    averageVisitsPerMonth: number;
  };
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'year' | 'month'>('all');

  const adventureApi = new AdventureApi();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adventureApi.getStats({ timeRange });
      console.log('📊 Frontend - Raw API response:', response);
      
      // Extract the data property from the API response
      const statsData = response.data || response;
      console.log('📊 Frontend - Extracted stats data:', statsData);
      
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [user, loadStats]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your statistics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={loadStats} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No statistics available</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
              <p className="text-sm text-gray-600">Your adventure analytics and insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'all' | 'year' | 'month')}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Adventures</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.adventures.totalAdventures}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.collections?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Visits</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.visits?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Countries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.geography.visitedCountries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Adventures by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adventures by Category</h3>
            <div className="space-y-3">
              {stats.adventures.byCategory && stats.adventures.byCategory.length > 0 ? (
                stats.adventures.byCategory.map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(category.count / stats.adventures.totalAdventures) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{category.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No category data available yet.</p>
              )}
            </div>
          </div>

          {/* Visits by Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visits by Month</h3>
            <div className="space-y-3">
              {stats.visits?.byMonth && stats.visits.byMonth.length > 0 ? (
                stats.visits.byMonth.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{month.month}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max((month.count / Math.max(...(stats.visits?.byMonth?.map(m => m.count) || [1]))) * 100, 5)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{month.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No visit data available yet.</p>
              )}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-3">
              {stats.geography.topCountries && stats.geography.topCountries.length > 0 ? (
                stats.geography.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{country.country}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${(country.count / (stats.geography.topCountries?.[0]?.count || 1)) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{country.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No country visit data available yet.</p>
              )}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {stats.adventures.byRating && stats.adventures.byRating.length > 0 ? (
                stats.adventures.byRating.map((rating) => (
                  <div key={rating.rating} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex">
                        {Array.from({ length: rating.rating }, (_, i) => (
                          <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {rating.rating} Star{rating.rating !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{
                            width: `${(rating.count / stats.adventures.totalAdventures) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{rating.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No rating data available yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              {stats.timeline?.firstAdventure && (
                <div className="flex items-center">
                  <TrophyIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">First Adventure</p>
                    <p className="text-sm text-gray-600">{formatDate(stats.timeline.firstAdventure)}</p>
                  </div>
                </div>
              )}
              
              {stats.timeline?.lastVisit && (
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Visit</p>
                    <p className="text-sm text-gray-600">{formatDate(stats.timeline.lastVisit)}</p>
                  </div>
                </div>
              )}
              
              {stats.timeline?.totalDays !== undefined && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Days Tracked</p>
                    <p className="text-sm text-gray-600">{stats.timeline.totalDays} days</p>
                  </div>
                </div>
              )}
              
              {stats.timeline?.averageVisitsPerMonth !== undefined && (
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Average Visits/Month</p>
                    <p className="text-sm text-gray-600">{stats.timeline.averageVisitsPerMonth.toFixed(1)}</p>
                  </div>
                </div>
              )}
              
              {(!stats.timeline?.firstAdventure && !stats.timeline?.lastVisit && stats.timeline?.totalDays === undefined) && (
                <p className="text-sm text-gray-500">No timeline data available yet.</p>
              )}
            </div>
          </div>

          {/* Recent Adventures */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Adventures</h3>
            <div className="space-y-3">
              {stats.adventures.recentlyAdded && stats.adventures.recentlyAdded.length > 0 ? (
                stats.adventures.recentlyAdded.map((adventure) => (
                  <div key={adventure.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{adventure.name}</p>
                      <p className="text-xs text-gray-600">{formatDate(adventure.createdAt)}</p>
                    </div>
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent adventures available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
