'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { multiAgentApiService } from '../../../services/multiAgentApi';

interface PlanningRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  travelDates?: {
    start: string;
    end: string;
  };
  preferences: {
    budgetPriority: 'high' | 'medium' | 'low';
    travelStyle: 'budget' | 'comfort' | 'luxury';
    pace: 'relaxed' | 'moderate' | 'packed';
  };
}

interface AgentResult {
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export default function MultiAgentPlanningPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [planningRequest, setPlanningRequest] = useState<PlanningRequest>({
    destination: '',
    budget: 0,
    duration: 0,
    travelers: 1,
    interests: [],
    preferences: {
      budgetPriority: 'high',
      travelStyle: 'budget',
      pace: 'moderate'
    }
  });

  const [agentResults, setAgentResults] = useState<AgentResult[]>([
    { agent: 'Budget Analyst', status: 'pending' },
    { agent: 'Destination Research', status: 'pending' },
    { agent: 'Itinerary Planning', status: 'pending' },
    { agent: 'Travel Coordinator', status: 'pending' }
  ]);

  const [comprehensiveResult, setComprehensiveResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const steps = [
    'Trip Details',
    'Preferences',
    'AI Planning',
    'Results'
  ];

  const interestOptions = [
    'Museums & Culture',
    'Food & Dining',
    'Architecture',
    'Nature & Outdoors',
    'Nightlife',
    'Shopping',
    'History',
    'Art',
    'Adventure Sports',
    'Local Experiences',
    'Photography',
    'Wellness & Spa'
  ];

  const startComprehensivePlanning = async () => {
    if (!user) {
      alert('Please log in to use AI planning');
      return;
    }

    // Validate request
    const errors = multiAgentApiService.validatePlanningRequest(planningRequest);
    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join('\n')}`);
      return;
    }

    setIsLoading(true);
    setCurrentStep(2);
    setShowResults(false);

    try {
      // Reset agent results
      setAgentResults([
        { agent: 'Budget Analyst', status: 'processing' },
        { agent: 'Destination Research', status: 'processing' },
        { agent: 'Itinerary Planning', status: 'processing' },
        { agent: 'Travel Coordinator', status: 'processing' }
      ]);

      // Start comprehensive planning
      const result = await multiAgentApiService.comprehensivePlanning(planningRequest);

      if (result.success && result.data) {
        // Update agent results based on response
        const updatedResults = agentResults.map(agent => ({
          ...agent,
          status: 'completed' as const,
          result: result.data[agent.agent.toLowerCase().replace(' ', '')]
        }));

        setAgentResults(updatedResults);
        setComprehensiveResult(result.data);
        setCurrentStep(3);
        setShowResults(true);
      } else {
        console.error('Comprehensive planning failed:', result.error);
        alert(`Planning failed: ${result.error?.message || 'Unknown error'}`);
        
        // Mark all agents as error
        setAgentResults(prev => prev.map(agent => ({
          ...agent,
          status: 'error',
          error: result.error?.message || 'Planning failed'
        })));
      }
    } catch (error) {
      console.error('Error in comprehensive planning:', error);
      alert('Error during planning. Please try again.');
      
      setAgentResults(prev => prev.map(agent => ({
        ...agent,
        status: 'error',
        error: 'Network error'
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setPlanningRequest(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Multi-Agent Travel Planning</h1>
          <p className="text-gray-600">Please log in to use the AI multi-agent travel planning system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Multi-Agent Travel Planning</h1>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Trip Details */}
        {currentStep === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={planningRequest.destination}
                  onChange={(e) => setPlanningRequest(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Paris, France"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget (USD)
                </label>
                <input
                  type="number"
                  value={planningRequest.budget || ''}
                  onChange={(e) => setPlanningRequest(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={planningRequest.duration || ''}
                  onChange={(e) => setPlanningRequest(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 7"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travelers
                </label>
                <input
                  type="number"
                  value={planningRequest.travelers || ''}
                  onChange={(e) => setPlanningRequest(prev => ({ ...prev, travelers: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Dates (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={planningRequest.travelDates?.start || ''}
                  onChange={(e) => setPlanningRequest(prev => ({
                    ...prev,
                    travelDates: { ...prev.travelDates, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={planningRequest.travelDates?.end || ''}
                  onChange={(e) => setPlanningRequest(prev => ({
                    ...prev,
                    travelDates: { ...prev.travelDates, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Next: Preferences
            </button>
          </div>
        )}

        {/* Step 2: Preferences */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Travel Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Priority
                </label>
                <select
                  value={planningRequest.preferences.budgetPriority}
                  onChange={(e) => setPlanningRequest(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, budgetPriority: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">High - Maximize savings</option>
                  <option value="medium">Medium - Balance cost & experience</option>
                  <option value="low">Low - Experience over cost</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Style
                </label>
                <select
                  value={planningRequest.preferences.travelStyle}
                  onChange={(e) => setPlanningRequest(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, travelStyle: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="budget">Budget - Hostels, local transport</option>
                  <option value="comfort">Comfort - Mid-range hotels</option>
                  <option value="luxury">Luxury - Premium accommodations</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Pace
                </label>
                <select
                  value={planningRequest.preferences.pace}
                  onChange={(e) => setPlanningRequest(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, pace: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relaxed">Relaxed - Fewer activities</option>
                  <option value="moderate">Moderate - Balanced schedule</option>
                  <option value="packed">Packed - Maximum activities</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {interestOptions.map((interest) => (
                  <label key={interest} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planningRequest.interests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="mr-2"
                    />
                    <span className="text-sm">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Back: Trip Details
              </button>
              <button
                onClick={startComprehensivePlanning}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Start AI Planning
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Planning Progress */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Agents Working on Your Plan</h2>
            
            <div className="space-y-4">
              {agentResults.map((agent, index) => (
                <div key={agent.agent} className="flex items-center p-4 border rounded-lg">
                  <div className="flex-shrink-0 mr-4">
                    {agent.status === 'pending' && (
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    )}
                    {agent.status === 'processing' && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                    {agent.status === 'completed' && (
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {agent.status === 'error' && (
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{agent.agent}</h3>
                    <p className="text-sm text-gray-600">
                      {agent.status === 'pending' && 'Waiting to start...'}
                      {agent.status === 'processing' && 'Analyzing and creating recommendations...'}
                      {agent.status === 'completed' && 'Analysis complete!'}
                      {agent.status === 'error' && `Error: ${agent.error}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">AI agents are working on your travel plan...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 3 && showResults && comprehensiveResult && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your AI-Generated Travel Plan</h2>
              
              {/* Budget Analysis */}
              {comprehensiveResult.budgetAnalysis && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">💰 Budget Analysis</h3>
                  <div className="text-sm text-blue-800">
                    <p>Total Budget: {formatCurrency(planningRequest.budget)}</p>
                    <p>Daily Budget: {formatCurrency(planningRequest.budget / planningRequest.duration)}</p>
                    {/* Add more budget analysis details */}
                  </div>
                </div>
              )}

              {/* Destination Research */}
              {comprehensiveResult.destinationResearch && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">🌍 Destination Insights</h3>
                  <div className="text-sm text-green-800">
                    <p>Destination: {planningRequest.destination}</p>
                    {/* Add more destination research details */}
                  </div>
                </div>
              )}

              {/* Itinerary Plan */}
              {comprehensiveResult.itineraryPlan && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">📅 Itinerary Plan</h3>
                  <div className="text-sm text-purple-800">
                    <p>Duration: {planningRequest.duration} days</p>
                    {/* Add more itinerary details */}
                  </div>
                </div>
              )}

              {/* Travel Coordination */}
              {comprehensiveResult.travelCoordination && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">✈️ Travel Coordination</h3>
                  <div className="text-sm text-orange-800">
                    <p>Travelers: {planningRequest.travelers}</p>
                    {/* Add more coordination details */}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setShowResults(false);
                  setComprehensiveResult(null);
                  setAgentResults([
                    { agent: 'Budget Analyst', status: 'pending' },
                    { agent: 'Destination Research', status: 'pending' },
                    { agent: 'Itinerary Planning', status: 'pending' },
                    { agent: 'Travel Coordinator', status: 'pending' }
                  ]);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Plan Another Trip
              </button>
              <button
                onClick={() => {
                  // TODO: Save plan or export functionality
                  alert('Save/Export functionality coming soon!');
                }}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Save This Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

