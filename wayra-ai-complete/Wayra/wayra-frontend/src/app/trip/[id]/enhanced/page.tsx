'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import EnhancedTripDashboard from '@/components/trip/EnhancedTripDashboard';

const EnhancedTripPage: React.FC = () => {
  const params = useParams();
  const tripId = params.id as string;

  // In a real app, this would come from API/database
  const tripData = {
    name: "Summer Adventure in New York",
    budget: 2500,
    currency: "USD"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedTripDashboard
        tripId={tripId}
        tripName={tripData.name}
        budget={tripData.budget}
        currency={tripData.currency}
      />
    </div>
  );
};

export default EnhancedTripPage;
