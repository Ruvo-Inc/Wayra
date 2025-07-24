'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TripDashboard from '@/components/trips/TripDashboard';
import AuthModal from '@/components/auth/AuthModal';

/**
 * Demo Page - Real-time Collaboration Showcase
 * Demonstrates the live collaboration features of Wayra
 */

export default function DemoPage() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Wayra Collaboration Demo
            </h1>
            <p className="text-gray-600 mb-6">
              Sign in to experience real-time collaborative trip planning
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setAuthModalOpen(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Sign Up
              </button>
            </div>
            <AuthModal
              isOpen={authModalOpen}
              onClose={() => setAuthModalOpen(false)}
              mode={authMode}
              onModeChange={setAuthMode}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TripDashboard tripId="demo-trip-123" />
    </div>
  );
}
