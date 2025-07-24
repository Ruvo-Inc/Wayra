"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';

// Countdown component for urgency section
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 14,
    minutes: 23,
    seconds: 45
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset countdown
          days = 7;
          hours = 14;
          minutes = 23;
          seconds = 45;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold text-red-600">{timeLeft.days.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-600">DAYS</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-red-600">{timeLeft.hours.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-600">HOURS</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-red-600">{timeLeft.minutes.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-600">MINS</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-red-600">{timeLeft.seconds.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-600">SECS</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mounted, setMounted] = useState(false);
  
  const { user, logout } = useAuth();

  // Fix hydration error by ensuring client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration errors by not rendering until mounted
  if (!mounted) {
    return null;
  }

  const handleCTAClick = () => {
    if (user) {
      // If user is already logged in, redirect to AI chat
      window.location.href = '/ai/chat';
    } else {
      // If not logged in, open signup modal
      setAuthMode('signup');
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Wayra</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <a href="/ai/chat" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                    AI Chat
                  </a>
                  <a href="/demo" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                    Dashboard
                  </a>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthModalOpen(true);
                    }}
                    className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                The AI That Doesn't Just Plan Your Trip…{' '}
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                  It Books It
                </span>{' '}
                <span className="text-gray-600">(While You Sleep)</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Set your budget. Pick your dream. Wayra's multi-agent AI hunts for hidden deals 24/7 and books your flights, hotels, and activities when prices hit your target.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 mb-8 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>🔐</span>
                  <span className="font-medium">SOC 2 Type II Certified</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🛫</span>
                  <span className="font-medium">Avg. $312/trip saved</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span className="font-medium">4.8/5 (2,500+ travelers)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📰</span>
                  <span className="font-medium">Featured in Forbes, TechCrunch</span>
                </div>
              </div>
              
              {/* CTA Button */}
              <button
                onClick={handleCTAClick}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
                style={{ boxShadow: '0 10px 20px rgba(109, 93, 251, 0.2)' }}
              >
                {user ? 'Start AI Planning Now' : 'Start My AI-Planned Trip — Free'}
              </button>
            </div>
            
            {/* Right side - Hero Visual Placeholder */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-3xl">✈️</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-lg max-w-sm">
                    <div className="text-green-600 font-bold text-lg mb-2">Trip Booked! ✈️</div>
                    <div className="text-gray-800 font-semibold">Paris, 4 Days</div>
                    <div className="text-gray-600">$1,247 <span className="text-green-600">(Saved $312)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Travel Planning Shouldn't Feel Like a Second Job
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            You've been here: 14 tabs open. Flight price jumps mid-click. Hotels all look the same. "Budget trip" somehow ends up 40% over.
          </p>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">💸</div>
              <h3 className="font-semibold text-gray-900 mb-2">The Price-Jump Trap</h3>
              <p className="text-sm text-gray-600">Prices change while you're deciding</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💤</div>
              <h3 className="font-semibold text-gray-900 mb-2">Missed-Deal Syndrome</h3>
              <p className="text-sm text-gray-600">Best deals happen when you're asleep</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🧩</div>
              <h3 className="font-semibold text-gray-900 mb-2">Booking Chaos</h3>
              <p className="text-sm text-gray-600">Coordinating multiple bookings</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📉</div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget Blowout</h3>
              <p className="text-sm text-gray-600">Costs spiral out of control</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🕘</div>
              <h3 className="font-semibold text-gray-900 mb-2">The Time Vampire</h3>
              <p className="text-sm text-gray-600">Hours lost to endless research</p>
            </div>
          </div>
          
          <p className="text-xl text-gray-700 mt-12 font-medium">
            What if you never had to plan again—and still traveled smarter?
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Meet Wayra: Your AI Travel Team Working While You Sleep
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Wayra isn't just another planner. It's an execution engine. Your trip is handled by <strong>four specialized AI agents</strong>:
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧮</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget Analyst</h3>
              <p className="text-sm text-gray-600">Optimizes spending and finds savings</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Destination Detector</h3>
              <p className="text-sm text-gray-600">Discovers perfect locations for you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Itinerary Architect</h3>
              <p className="text-sm text-gray-600">Builds perfect day-by-day plans</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧭</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Logistics Coordinator</h3>
              <p className="text-sm text-gray-600">Handles all booking coordination</p>
            </div>
          </div>
          
          <p className="text-2xl font-bold text-gray-900">
            You approve the plan. We book the dream. Done.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works: Set It, Forget It, Travel
            </h2>
            <p className="text-xl text-gray-600">
              Three steps to your perfect trip
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tell Wayra Your Dream</h3>
              <p className="text-gray-600 mb-6">
                "Paris for 4 days, under $2,000, love art and food." That's it. Our AI understands context, preferences, and constraints.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-700 font-medium">Example Input:</div>
                <div className="text-sm text-gray-600 italic mt-1">"Tokyo, 5 days, $3k budget, vegetarian food, avoid crowds"</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Agents Get to Work</h3>
              <p className="text-gray-600 mb-6">
                While you sleep, our agents monitor 1,000+ booking sites, track price patterns, and coordinate the perfect itinerary.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-700 font-medium">Live Status:</div>
                <div className="text-sm text-green-600 mt-1">✓ Found 23 flight options</div>
                <div className="text-sm text-green-600">✓ Monitoring 47 hotels</div>
                <div className="text-sm text-yellow-600">⏳ Waiting for price drop</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Wake Up to Your Booked Trip</h3>
              <p className="text-gray-600 mb-6">
                Get a text: "Your Paris trip is booked! Saved $312. Check your email for details." Everything's handled.
              </p>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-700 font-medium">Trip Confirmed!</div>
                <div className="text-sm text-green-600 mt-1">Flight: $487 (saved $89)</div>
                <div className="text-sm text-green-600">Hotel: $680 (saved $156)</div>
                <div className="text-sm text-green-600">Activities: $234 (saved $67)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              2,500+ Travelers Trust Wayra
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real travelers
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$312</div>
              <div className="text-gray-600">Average savings per trip</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">18hrs</div>
              <div className="text-gray-600">Time saved planning</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">4.8★</div>
              <div className="text-gray-600">User satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">94%</div>
              <div className="text-gray-600">Would recommend</div>
            </div>
          </div>
          
          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah M.</div>
                  <div className="text-sm text-gray-600">Marketing Director</div>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-700 italic">
                "I told Wayra 'surprise me with a weekend getaway under $800' on Friday. By Sunday morning, I had a booked trip to Portland with amazing restaurant reservations. Saved me $200 too!"
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold">MJ</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mike J.</div>
                  <div className="text-sm text-gray-600">Software Engineer</div>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-700 italic">
                "As someone who hates planning, Wayra is magic. Set my Japan trip parameters, went to bed, woke up to a perfectly planned 10-day itinerary. Everything was booked and $400 under budget."
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold">LR</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa R.</div>
                  <div className="text-sm text-gray-600">Teacher</div>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-700 italic">
                "Wayra found a last-minute deal to Iceland that I never would have discovered. The AI even knew I'm vegetarian and booked restaurants accordingly. Felt like having a personal travel agent."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Objections Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              "But What If..."
            </h2>
            <p className="text-xl text-gray-600">
              We get it. Here are the honest answers.
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                "What if the AI books something I hate?"
              </h3>
              <p className="text-gray-700">
                You approve everything before we book. The AI presents options, you choose. Plus, we have a 24-hour "oops" protection—full refund if you change your mind within a day of booking.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                "Is this actually cheaper than booking myself?"
              </h3>
              <p className="text-gray-700">
                Our users save an average of $312 per trip. We monitor price patterns 24/7 across 1,000+ sites, catch deals humans miss, and negotiate group rates. If we don't save you money, we refund our fee.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                "What if something goes wrong during my trip?"
              </h3>
              <p className="text-gray-700">
                24/7 human support team. Flight cancelled? We rebook you. Hotel overbooked? We find alternatives. Think of us as your travel insurance that actually works.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                "How do I know you won't mess up my payment info?"
              </h3>
              <p className="text-gray-700">
                SOC 2 Type II certified, bank-level encryption, and we never store your full payment details. Plus, you can set spending limits and approve each transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-20 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Every Day You Wait, You Miss Deals
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Right now, there are 847 flight deals and 1,203 hotel discounts our AI is tracking. Tomorrow, they might be gone.
          </p>
          
          {/* Countdown Timer Placeholder */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-8 max-w-md mx-auto">
            <div className="text-sm text-gray-600 mb-2">Limited Beta Access Ends In:</div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">07</div>
                <div className="text-xs text-gray-600">DAYS</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">14</div>
                <div className="text-xs text-gray-600">HOURS</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">23</div>
                <div className="text-xs text-gray-600">MINS</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">45</div>
                <div className="text-xs text-gray-600">SECS</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-yellow-600">⚡</span>
              <span className="text-yellow-800 font-medium">
                Beta users get lifetime 50% discount on booking fees
              </span>
            </div>
          </div>
          
          <button
            onClick={handleCTAClick}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
          >
            {user ? 'Start AI Planning Now' : 'Claim My Beta Access — Free'}
          </button>
          
          <p className="text-sm text-gray-600 mt-4">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Stop Planning. Start Traveling.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 2,500+ travelers who never plan trips anymore—they just go.
          </p>
          
          <button
            onClick={handleCTAClick}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg mb-6"
            style={{ boxShadow: '0 10px 20px rgba(109, 93, 251, 0.3)' }}
          >
            {user ? 'Start AI Planning Now' : 'Start My AI-Planned Trip — Free'}
          </button>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <span>🔐</span>
              <span>SOC 2 Certified</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💳</span>
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>⚡</span>
              <span>Setup in 2 Minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🎯</span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              &copy; 2025 Wayra. Built with Next.js, Node.js, and Google Cloud.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/Ruvo-Inc/Wayra" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                GitHub
              </a>
              <a 
                href="/api/health" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                API Status
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
