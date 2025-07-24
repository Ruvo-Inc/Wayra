'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import WayraHomepage from '@/components/WayraHomepage';

// Analytics tracking as per integration guide
const trackCTAClick = (location: string) => {
  if (typeof window !== 'undefined') {
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: location,
        value: 1
      });
    }
  }
  console.log(`CTA clicked from: ${location}`);
};

const HomePage = () => {
  const router = useRouter();
  const { user, signIn } = useAuth();

  // CTA handler with Firebase auth integration as per guide
  const handleCTAClick = (source: string) => {
    // Track analytics
    trackCTAClick(source);
    
    // Different actions based on user state as per customization guide
    if (user) {
      router.push('/dashboard');
    } else {
      signIn();
    }
  };

  return (
    <div className="homepage-wrapper">
      <WayraHomepage onCTAClick={handleCTAClick} />
    </div>
  );
};

export default HomePage;
