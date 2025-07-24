'use client';

import React, { useState, useEffect } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import CollaborationPanel from '@/components/collaboration/CollaborationPanel';
import PresenceIndicator from '@/components/collaboration/PresenceIndicator';

/**
 * TripDashboard Component
 * Main dashboard for trip planning with real-time collaboration
 */

interface TripDashboardProps {
  tripId?: string;
}

const TripDashboard: React.FC<TripDashboardProps> = ({ tripId = 'demo-trip-123' }) => {
  const { state, updateTrip, updateBudget, startTyping, stopTyping } = useCollaboration();
  const [tripData, setTripData] = useState({
    title: 'Amazing Europe Adventure',
    destination: 'Paris, Rome, Barcelona',
    startDate: '2024-08-15',
    endDate: '2024-08-25',
    budget: 5000,
    description: 'A wonderful 10-day journey through Europe with friends'
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle real-time trip updates
  useEffect(() => {
    const unsubscribe = state.isConnected ? (() => {
      // In a real app, you'd listen for trip updates and update local state
      // For demo purposes, we'll just log updates
      console.log('Trip dashboard connected to real-time updates');
      return () => {};
    })() : () => {};

    return unsubscribe;
  }, [state.isConnected]);

  // Generate share link on component mount
  useEffect(() => {
    const currentUrl = window.location.origin;
    const shareUrl = `${currentUrl}/trip/${tripId}?share=true`;
    setShareLink(shareUrl);
  }, [tripId]);

  // Handle share trip functionality
  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle close share modal
  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setCopySuccess(false);
  };

  const handleFieldEdit = (field: string, value: string) => {
    setTripData(prev => ({ ...prev, [field]: value }));
    
    // Send real-time update
    updateTrip('trip-details', {
      field,
      value,
      timestamp: new Date().toISOString()
    });
  };

  const handleFieldFocus = (field: string) => {
    setIsEditing(field);
    startTyping(field);
  };

  const handleFieldBlur = (field: string) => {
    setIsEditing(null);
    stopTyping(field);
  };

  const handleBudgetUpdate = (newBudget: number) => {
    setTripData(prev => ({ ...prev, budget: newBudget }));
    updateBudget({ total: newBudget }, 'total');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Trip Dashboard</h1>
              <div className="hidden sm:block">
                <PresenceIndicator />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm ${
                state.isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {state.isConnected ? '🟢 Live' : '🔴 Offline'}
              </div>
              
              <button 
                onClick={handleShareTrip}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Share Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip info card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
              
              <div className="space-y-4">
                {/* Trip title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Title
                  </label>
                  <input
                    type="text"
                    value={tripData.title}
                    onChange={(e) => handleFieldEdit('title', e.target.value)}
                    onFocus={() => handleFieldFocus('title')}
                    onBlur={() => handleFieldBlur('title')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isEditing === 'title' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter trip title..."
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={tripData.destination}
                    onChange={(e) => handleFieldEdit('destination', e.target.value)}
                    onFocus={() => handleFieldFocus('destination')}
                    onBlur={() => handleFieldBlur('destination')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isEditing === 'destination' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter destinations..."
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tripData.startDate}
                      onChange={(e) => handleFieldEdit('startDate', e.target.value)}
                      onFocus={() => handleFieldFocus('startDate')}
                      onBlur={() => handleFieldBlur('startDate')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isEditing === 'startDate' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={tripData.endDate}
                      onChange={(e) => handleFieldEdit('endDate', e.target.value)}
                      onFocus={() => handleFieldFocus('endDate')}
                      onBlur={() => handleFieldBlur('endDate')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isEditing === 'endDate' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={tripData.budget}
                      onChange={(e) => handleBudgetUpdate(Number(e.target.value))}
                      onFocus={() => handleFieldFocus('budget')}
                      onBlur={() => handleFieldBlur('budget')}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isEditing === 'budget' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(tripData.budget)} total budget
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={tripData.description}
                    onChange={(e) => handleFieldEdit('description', e.target.value)}
                    onFocus={() => handleFieldFocus('description')}
                    onBlur={() => handleFieldBlur('description')}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      isEditing === 'description' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    placeholder="Describe your trip..."
                  />
                </div>
              </div>
            </div>

            {/* Itinerary placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h2>
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-lg mb-2">Itinerary coming soon</p>
                <p className="text-sm">This will show your day-by-day travel plan with real-time collaboration</p>
              </div>
            </div>
          </div>

          {/* Collaboration panel */}
          <div className="lg:col-span-1">
            <CollaborationPanel tripId={tripId} className="h-[600px]" />
          </div>
        </div>
      </div>

      {/* Demo info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 text-xl">ℹ️</div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Real-time Collaboration Demo</h3>
              <p className="text-sm text-blue-700 mt-1">
                This dashboard demonstrates real-time collaboration features. Try editing fields to see live updates, 
                typing indicators, and activity tracking. Open this page in multiple tabs to see collaboration in action!
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <p>• Edit any field to trigger real-time updates</p>
                <p>• Check the collaboration panel for live activity</p>
                <p>• Add comments to start conversations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Trip</h3>
              <button
                onClick={handleCloseShareModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share this trip with others
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Anyone with this link can view and collaborate on your trip planning.
                </p>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  💡 Tip: Collaborators can edit trip details, add comments, and see real-time updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDashboard;
