'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Map, List } from 'lucide-react';
import AdventureCard from '@/components/adventure/AdventureCard';
import AdventureModal from '@/components/adventure/AdventureModal';
import adventureApi from '@/services/adventureApi';
import { Adventure, AdventureFilters } from '@/types/adventure';
import { useAuth } from '@/contexts/AuthContext';

export default function AdventuresPage() {
  const { user, loading: authLoading } = useAuth();
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<AdventureFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debug authentication state
  console.log('🔐 Adventures Page - Auth Debug:', {
    user: !!user,
    userEmail: user?.email,
    authLoading,
    loading
  });

  const loadAdventures = useCallback(async () => {
    console.log('🔄 Loading adventures - User:', !!user, user?.email);
    
    if (!user) {
      console.log('❌ No user found, skipping adventure load');
      setAdventures([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      console.log('📡 Starting adventures API call...');
      setLoading(true);
      setError(null);
      const response = await adventureApi.getAdventures({
        ...filters,
        search: searchQuery || undefined,
      });
      console.log('✅ Adventures API response:', response);
      setAdventures(response.adventures || []);
    } catch (err) {
      console.error('❌ Error loading adventures:', err);
      setError(err instanceof Error ? err.message : 'Failed to load adventures');
    } finally {
      console.log('🏁 Adventures loading completed');
      setLoading(false);
    }
  }, [user, filters, searchQuery]);

  useEffect(() => {
    if (user) {
      loadAdventures();
    } else {
      setLoading(false);
    }
  }, [filters, user, loadAdventures]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdventures();
  };

  const handleCreateAdventure = () => {
    console.log('🎯 Create Adventure button clicked');
    setShowCreateModal(true);
    console.log('🎯 showCreateModal set to true');
  };

  const handleAdventureCreated = (adventure: Adventure) => {
    setAdventures(prev => [adventure, ...prev]);
  };

  const handleEditAdventure = (adventure: Adventure) => {
    console.log('🎯 Edit adventure clicked:', adventure);
    // Navigate to adventure detail view
    window.location.href = `/adventures/${adventure._id || adventure.id}`;
  };

  const handleDeleteAdventure = async (adventureId: string) => {
    console.log('🗑️ Delete adventure called with ID:', adventureId);
    try {
      await adventureApi.deleteAdventure(adventureId);
      console.log('✅ Adventure deleted successfully, updating UI');
      setAdventures(prev => prev.filter(a => (a._id || a.id) !== adventureId));
    } catch (err) {
      console.error('❌ Error deleting adventure:', err);
    }
  };

  const handleAddToCollection = (adventureId: string) => {
    // TODO: Implement add to collection modal
    console.log('🎯 Add to collection clicked - adventureId:', adventureId);
    console.log('🎯 adventureId type:', typeof adventureId);
    if (!adventureId) {
      console.error('❌ adventureId is undefined or null!');
      return;
    }
  };

  const handleToggleVisibility = async (adventureId: string, isPublic: boolean) => {
    try {
      await adventureApi.updateAdventure(adventureId, { isPublic });
      setAdventures(prev => 
        prev.map(a => a.id === adventureId ? { ...a, isPublic } : a)
      );
    } catch (err) {
      console.error('Error updating adventure visibility:', err);
    }
  };

  // Show loading spinner while authentication is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in required if user is not authenticated after loading
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your adventures.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Adventures</h1>
              <p className="text-sm text-gray-600">Track and manage your travel experiences</p>
            </div>
            <button
              onClick={handleCreateAdventure}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Adventure
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search adventures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'} hover:bg-blue-50 transition-colors`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'} hover:bg-blue-50 transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadAdventures}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : adventures.length === 0 ? (
          <div className="text-center py-12">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Adventures Yet</h3>
            <p className="text-gray-600 mb-6">Start tracking your travel experiences by creating your first adventure.</p>
            <button
              onClick={handleCreateAdventure}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Adventure
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {adventures.map((adventure, index) => (
              <AdventureCard
                key={adventure.id || adventure._id || `adventure-${index}`}
                adventure={adventure}
                user={user}
                onEdit={handleEditAdventure}
                onDelete={handleDeleteAdventure}
                onAddToCollection={handleAddToCollection}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Adventure Creation Modal */}
      <AdventureModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdventureCreated={handleAdventureCreated}
      />
    </div>
  );
}
