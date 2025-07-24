'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdventureModal from '@/components/adventure/AdventureModal';
import { Adventure } from '@/types/adventure';

export default function TestAdventurePage() {
  const { user, loading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdAdventures, setCreatedAdventures] = useState<Adventure[]>([]);

  const handleAdventureCreated = (adventure: Adventure) => {
    setCreatedAdventures(prev => [...prev, adventure]);
    console.log('Adventure created successfully:', adventure);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to test adventure creation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Adventure Creation</h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This page is for testing the Adventure creation functionality with LocationAutocomplete.
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Adventure
            </button>
          </div>

          {/* Display created adventures */}
          {createdAdventures.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Created Adventures</h2>
              <div className="space-y-4">
                {createdAdventures.map((adventure, index) => (
                  <div key={adventure.id || index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900">{adventure.name}</h3>
                    <p className="text-gray-600">Location: {adventure.location}</p>
                    {adventure.latitude && adventure.longitude && (
                      <p className="text-gray-600">
                        Coordinates: {adventure.latitude}, {adventure.longitude}
                      </p>
                    )}
                    <p className="text-gray-600">Description: {adventure.description}</p>
                    <p className="text-gray-600">
                      Activity Types: {adventure.activityTypes?.join(', ')}
                    </p>
                    {adventure.rating && (
                      <p className="text-gray-600">Rating: {adventure.rating}/5</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adventure Creation Modal */}
      <AdventureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdventureCreated={handleAdventureCreated}
      />
    </div>
  );
}
