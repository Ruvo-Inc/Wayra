'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { multiAgentApiService } from '@/services/multiAgentApi';

// Types
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
    budgetPriority: string;
    travelStyle: string;
    pace: string;
  };
}

interface AgentStatus {
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

interface BudgetBreakdown {
  accommodation: Record<string, unknown>;
  food: Record<string, unknown>;
  transportation: Record<string, unknown>;
  activities: Record<string, unknown>;
  miscellaneous: Record<string, unknown>;
}

interface BudgetAnalysis {
  totalEstimatedCost: number;
  budgetBreakdown: BudgetBreakdown;
  costOptimizationSuggestions: Record<string, string>;
  budgetFeasibility: string;
}

interface DestinationResearch {
  overview: string;
  culturalHighlights: Record<string, unknown>;
  localCustoms: Record<string, unknown>;
  weatherInfo: Record<string, unknown>;
  languageTips: Record<string, unknown>;
  currencyInfo: Record<string, unknown>;
  transportationOptions: Record<string, unknown>;
}

interface TravelCoordination {
  bookingRecommendations: Record<string, unknown>;
  documentationRequirements: Record<string, unknown>;
  itinerary: Record<string, unknown>;
  contingencyPlans: Record<string, unknown>;
}

interface ComprehensiveResult {
  budgetAnalysis: BudgetAnalysis;
  destinationResearch: DestinationResearch;
  itineraryPlanning: Record<string, unknown>;
  travelCoordination: TravelCoordination;
}

interface ItineraryPlan {
  dailyItinerary: { [key: string]: DayDetails };
  routeOptimization?: RouteOptimization;
  budgetBreakdown?: BudgetBreakdown;
  error?: string;
}

interface DayDetails {
  theme: string;
  date: string;
  activities: Activity[];
  totalDayCost: number;
}

interface RouteOptimization {
  transportationStrategy: string;
  estimatedTravelTime?: string;
  costSavings?: number;
}

interface Activity {
  time: string;
  activity: string;
  cost: number;
  location?: string;
  duration?: string;
  budgetBreakdown?: BudgetBreakdown;
  error?: string;
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
    if (!planningRequest.destination || !planningRequest.budget || !planningRequest.duration) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      alert('Please sign in to use AI agents');
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
              <div className="mt-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mr-4"></div>
                      <div>
                        <div className="text-lg font-semibold text-gray-800">AI Agents Working</div>
                        <div className="text-sm text-gray-600">Creating your personalized travel plan...</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Analyzing your preferences</span>
                        <div className="w-6 h-6 bg-blue-100 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Researching destination insights</span>
                        <div className="w-6 h-6 bg-green-100 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Optimizing budget allocation</span>
                        <div className="w-6 h-6 bg-yellow-100 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Coordinating travel logistics</span>
                        <div className="w-6 h-6 bg-purple-100 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <div className="text-xs text-gray-500">
                      This usually takes 30-60 seconds
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 3 && showResults && comprehensiveResult && (
          <div className="space-y-6">
            {/* Agent Status Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">🤖</span>
                  AI Agent Execution Summary
                </h2>
                <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                  Generated {new Date().toLocaleTimeString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                  comprehensiveResult.budgetAnalysis 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 shadow-md' 
                    : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 shadow-md'
                }`}>
                  <div className="text-3xl mb-2">💰</div>
                  <div className="font-semibold text-gray-800 mb-1">Budget Analysis</div>
                  <div className={`text-sm font-medium ${
                    comprehensiveResult.budgetAnalysis ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {comprehensiveResult.budgetAnalysis ? '✅ Complete' : '❌ Failed'}
                  </div>
                  {comprehensiveResult.budgetAnalysis && (
                    <div className="text-xs text-green-600 mt-1">
                      Budget breakdown ready
                    </div>
                  )}
                </div>
                
                <div className={`p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                  comprehensiveResult.destinationResearch 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 shadow-md' 
                    : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 shadow-md'
                }`}>
                  <div className="text-3xl mb-2">🌍</div>
                  <div className="font-semibold text-gray-800 mb-1">Destination Insights</div>
                  <div className={`text-sm font-medium ${
                    comprehensiveResult.destinationResearch ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {comprehensiveResult.destinationResearch ? '✅ Complete' : '❌ Failed'}
                  </div>
                  {comprehensiveResult.destinationResearch && (
                    <div className="text-xs text-green-600 mt-1">
                      Cultural insights ready
                    </div>
                  )}
                </div>
                
                <div className={`p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                  comprehensiveResult.itineraryPlanning 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 shadow-md' 
                    : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 shadow-md'
                }`}>
                  <div className="text-3xl mb-2">🗺️</div>
                  <div className="font-semibold text-gray-800 mb-1">Itinerary Plan</div>
                  <div className={`text-sm font-medium ${
                    comprehensiveResult.itineraryPlanning ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {comprehensiveResult.itineraryPlanning ? '✅ Complete' : '❌ Failed'}
                  </div>
                  {comprehensiveResult.itineraryPlanning && (
                    <div className="text-xs text-green-600 mt-1">
                      Daily schedule ready
                    </div>
                  )}
                </div>
                
                <div className={`p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                  comprehensiveResult.travelCoordination 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 shadow-md' 
                    : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 shadow-md'
                }`}>
                  <div className="text-3xl mb-2">✈️</div>
                  <div className="font-semibold text-gray-800 mb-1">Travel Coordination</div>
                  <div className={`text-sm font-medium ${
                    comprehensiveResult.travelCoordination ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {comprehensiveResult.travelCoordination ? '✅ Complete' : '❌ Failed'}
                  </div>
                  {comprehensiveResult.travelCoordination && (
                    <div className="text-xs text-green-600 mt-1">
                      Booking strategy ready
                    </div>
                  )}
                </div>
              </div>
              
              {/* Overall Success Rate */}
              <div className="mt-6 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      Overall Success Rate
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round([
                        comprehensiveResult.budgetAnalysis,
                        comprehensiveResult.destinationResearch,
                        comprehensiveResult.itineraryPlanning,
                        comprehensiveResult.travelCoordination
                      ].filter(Boolean).length / 4 * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Travel Plan */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🎯 Your AI-Generated Travel Plan</h2>
              
              {/* Budget Analysis Section */}
              {comprehensiveResult.budgetAnalysis && (
                <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">💰</span>
                    Budget Analysis & Optimization
                  </h3>
                  
                  {/* Budget Breakdown */}
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-6">
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                        <span className="text-xl mr-2">💰</span>
                        Budget Breakdown
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(comprehensiveResult.budgetAnalysis.budgetBreakdown || {}).map(([category, data]) => {
                          // Extract the budget data properly
                          const budgetData = data as any;
                          const totalCost = budgetData.totalCost || budgetData.total || 0;
                          const dailyCost = budgetData.dailyCost || budgetData.daily || 0;
                          const savings = budgetData.savingsOpportunity;
                          
                          // Calculate percentage of total budget
                          const percentage = planningRequest.budget > 0 ? ((totalCost / planningRequest.budget) * 100).toFixed(1) : 0;
                          
                          return (
                            <div key={category} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <span className="capitalize font-semibold text-gray-800 text-sm">{category}</span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {percentage}% of total budget
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-lg text-blue-600">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)}
                                  </span>
                                  {dailyCost > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dailyCost)}/day
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Progress bar for budget allocation */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(Number(percentage), 100)}%` }}
                                ></div>
                              </div>
                              
                              {savings && (
                                <div className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                                  <div className="text-xs text-green-700 font-medium">
                                    💡 Save {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(savings.costDifference || 0))}
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    {savings.alternativeOption}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Daily Budget Summary */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                          <span className="text-lg mr-2">📅</span>
                          Daily Budget
                        </h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-900 mb-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.round(planningRequest.budget / planningRequest.duration))}
                          </div>
                          <div className="text-sm text-blue-700">per day</div>
                          <div className="text-xs text-blue-600 mt-2">
                            {planningRequest.duration} days total
                          </div>
                        </div>
                      </div>
                      
                      {/* Total Budget Summary */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                          <span className="text-lg mr-2">🎯</span>
                          Total Budget
                        </h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-900 mb-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(planningRequest.budget)}
                          </div>
                          <div className="text-sm text-green-700">for {planningRequest.travelers} traveler{planningRequest.travelers > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Optimization Suggestions */}
                  {comprehensiveResult.budgetAnalysis.costOptimizationSuggestions && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                        <span className="text-xl mr-2">💡</span>
                        Money-Saving Tips
                      </h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(comprehensiveResult.budgetAnalysis.costOptimizationSuggestions).map(([category, tip]) => (
                          <div key={category} className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center mb-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                              <div className="font-semibold text-sm capitalize text-yellow-800">{category}</div>
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed">{tip as string}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Destination Research Section */}
              {comprehensiveResult.destinationResearch && (
                <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">🌍</span>
                    Destination Insights: {planningRequest.destination}
                  </h3>
                  
                  {/* Destination Overview */}
                  {comprehensiveResult.destinationResearch.Destination?.Overview && (
                    <div className="mb-4 p-4 bg-white rounded border">
                      <h4 className="font-medium text-green-800 mb-2">📍 Overview</h4>
                      <p className="text-sm text-gray-700">{comprehensiveResult.destinationResearch.Destination.Overview}</p>
                      
                      {/* Key Highlights */}
                      {comprehensiveResult.destinationResearch.Destination["Key Highlights"] && (
                        <div className="mt-3">
                          <h5 className="font-medium text-green-700 text-xs mb-1">✨ Key Highlights:</h5>
                          <div className="flex flex-wrap gap-1">
                            {comprehensiveResult.destinationResearch.Destination["Key Highlights"].map((highlight: string, index: number) => (
                              <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Budget-Friendly Attractions */}
                  {comprehensiveResult.destinationResearch["Budget-friendly Attractions and Activities"] && (
                    <div className="mb-4">
                      <h4 className="font-medium text-green-800 mb-2">🎯 Budget-Friendly Activities by Day</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(comprehensiveResult.destinationResearch["Budget-friendly Attractions and Activities"]).map(([day, activities]) => (
                          <div key={day} className="bg-white p-3 rounded border">
                            <div className="font-medium text-sm text-green-700 mb-2">{day}</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {(activities as string[]).map((activity: string, index: number) => (
                                <li key={index}>• {activity}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden Gems */}
                  {comprehensiveResult.destinationResearch.hiddenGems && (
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">💎 Hidden Gems</h4>
                      <div className="grid md:grid-cols-3 gap-3">
                        {comprehensiveResult.destinationResearch.hiddenGems.map((gem, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="font-medium text-sm">{gem.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{gem.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Itinerary Section */}
              {comprehensiveResult.itineraryPlanning && (
                <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">📅</span>
                    Detailed Daily Itinerary ({planningRequest.duration} Days)
                  </h3>
                  
                  {/* Itinerary Overview */}
                  {comprehensiveResult.itineraryPlanning.budgetBreakdown && (
                    <div className="mb-6 p-4 bg-white rounded border">
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-purple-900">
                            ${comprehensiveResult.itineraryPlanning.budgetBreakdown.totalItineraryCost}
                          </div>
                          <div className="text-sm text-purple-700">Total Itinerary Cost</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-900">
                            {Object.keys(comprehensiveResult.itineraryPlanning.dailyItinerary || {}).length}
                          </div>
                          <div className="text-sm text-purple-700">Days Planned</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-900">
                            ${Math.round((comprehensiveResult.itineraryPlanning.budgetBreakdown.totalItineraryCost || 0) / planningRequest.duration)}
                          </div>
                          <div className="text-sm text-purple-700">Avg. Daily Cost</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily Itineraries */}
                  {comprehensiveResult.itineraryPlanning.dailyItinerary && (
                    <div className="space-y-4">
                      {Object.entries(comprehensiveResult.itineraryPlanning.dailyItinerary).map(([dayKey, dayData]: [string, any]) => (
                        <div key={dayKey} className="bg-white rounded-lg border p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-purple-900">
                                {dayKey.replace('day', 'Day ')} - {dayData.theme}
                              </h4>
                              <div className="text-sm text-gray-600">{dayData.date}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-purple-900">${dayData.totalDayCost}</div>
                              <div className="text-xs text-gray-600">daily cost</div>
                            </div>
                          </div>

                          {/* Activities */}
                          {dayData.activities && (
                            <div className="mb-3">
                              <h5 className="font-medium text-sm mb-2">🎯 Activities</h5>
                              <div className="space-y-2">
                                {dayData.activities.map((activity, actIndex) => (
                                  <div key={actIndex} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                                    <div className="text-xs font-medium text-purple-700 min-w-[50px]">
                                      {activity.time}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{activity.activity}</div>
                                      <div className="text-xs text-gray-600">{activity.location} • {activity.duration}</div>
                                      <div className="text-xs text-gray-500 mt-1">{activity.description}</div>
                                      {activity.tips && (
                                        <div className="text-xs text-blue-600 mt-1">💡 {activity.tips}</div>
                                      )}
                                    </div>
                                    <div className="text-xs font-medium text-green-700">
                                      ${activity.cost}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Transportation & Meals */}
                          <div className="grid md:grid-cols-2 gap-3 text-xs">
                            {dayData.transportationNotes && (
                              <div>
                                <span className="font-medium">🚇 Transport:</span> {dayData.transportationNotes}
                              </div>
                            )}
                            {dayData.mealSuggestions && (
                              <div>
                                <span className="font-medium">🍽️ Meals:</span> {dayData.mealSuggestions.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Practical Tips */}
                  {comprehensiveResult.itineraryPlanning.practicalTips && (
                    <div className="mt-4 p-4 bg-white rounded border">
                      <h4 className="font-medium text-purple-800 mb-2">💡 Practical Tips</h4>
                      <ul className="text-sm space-y-1">
                        {comprehensiveResult.itineraryPlanning.practicalTips.map((tip, index) => (
                          <li key={index} className="text-gray-700">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Itinerary Planning Failed */}
              {comprehensiveResult.itineraryPlanning === null && (
                <div className="mb-8 p-6 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                    <span className="text-xl mr-2">📅</span>
                    Itinerary Plan
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-orange-600 mr-2">⚠️</span>
                      <h4 className="font-medium text-orange-800">Detailed Itinerary Coming Soon</h4>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      Our AI agents have analyzed your budget and destination preferences. 
                      A detailed day-by-day itinerary is being generated and will be available shortly.
                    </p>
                    <div className="text-xs text-orange-600">
                      💡 In the meantime, check out the destination insights and travel coordination sections above for helpful planning information.
                    </div>
                  </div>
                </div>
              )}

              {/* Travel Coordination Section */}
              {comprehensiveResult.travelCoordination && (
                <div className="mb-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">✈️</span>
                    Travel Coordination & Logistics
                  </h3>
                  
                  <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Flight Booking Recommendations */}
                    {comprehensiveResult.travelCoordination.bookingRecommendations?.flight && (
                      <div>
                        <h4 className="font-medium text-orange-800 mb-3">✈️ Flight Booking</h4>
                        <div className="bg-white p-3 rounded border mb-3">
                          <div className="text-sm text-gray-700 mb-2">
                            {comprehensiveResult.travelCoordination.bookingRecommendations.flight.bookingStrategy}
                          </div>
                          {comprehensiveResult.travelCoordination.bookingRecommendations.flight.flightOptions && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-medium text-orange-700">Flight Options:</h5>
                              {comprehensiveResult.travelCoordination.bookingRecommendations.flight.flightOptions.map((flight: any, index: number) => (
                                <div key={index} className="text-xs bg-orange-50 p-2 rounded">
                                  <div className="font-medium">{flight.airline}</div>
                                  <div>{flight.departure} → {flight.arrival}</div>
                                  <div className="text-orange-600 font-medium">{flight.price}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Accommodation Booking */}
                    {comprehensiveResult.travelCoordination.bookingRecommendations?.accommodation && (
                      <div>
                        <h4 className="font-medium text-orange-800 mb-3">🏨 Accommodation</h4>
                        <div className="bg-white p-3 rounded border mb-3">
                          <div className="text-sm text-gray-700 mb-2">
                            {comprehensiveResult.travelCoordination.bookingRecommendations.accommodation.bookingStrategy}
                          </div>
                          {comprehensiveResult.travelCoordination.bookingRecommendations.accommodation.accommodationOptions && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-medium text-orange-700">Accommodation Options:</h5>
                              {comprehensiveResult.travelCoordination.bookingRecommendations.accommodation.accommodationOptions.map((hotel: any, index: number) => (
                                <div key={index} className="text-xs bg-orange-50 p-2 rounded">
                                  <div className="font-medium">{hotel.name}</div>
                                  <div>{hotel.pricePerNight}/night</div>
                                  <div className="text-orange-600 font-medium">Total: {hotel.totalPrice}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Documentation Requirements */}
                    {comprehensiveResult.travelCoordination.documentationRequirements && (
                      <div>
                        <h4 className="font-medium text-orange-800 mb-3">📄 Documentation Requirements</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="space-y-2">
                            {Object.entries(comprehensiveResult.travelCoordination.documentationRequirements).map(([item, desc]) => (
                              <div key={item} className="flex items-start space-x-2">
                                <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mt-0.5 flex-shrink-0">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full m-1"></div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm capitalize text-orange-700">
                                    {item.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {desc as string}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Detailed Itinerary */}
                  {comprehensiveResult.travelCoordination.itinerary && (
                    <div className="mt-6 p-4 bg-white rounded border">
                      <h4 className="font-medium text-orange-800 mb-3">🗺️ Suggested Daily Itinerary</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(comprehensiveResult.travelCoordination.itinerary).map(([day, activities]) => (
                          <div key={day} className="bg-orange-50 p-3 rounded">
                            <div className="font-medium text-orange-700 mb-2 capitalize">
                              {day.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-sm text-gray-700">
                              {activities as string}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Contingency Plans */}
                  {comprehensiveResult.travelCoordination.contingencyPlans && (
                    <div className="mt-4 p-4 bg-white rounded border">
                      <h4 className="font-medium text-orange-800 mb-3">⚠️ Contingency Plans</h4>
                      <div className="grid md:grid-cols-1 gap-3">
                        {Object.entries(comprehensiveResult.travelCoordination.contingencyPlans).map(([scenario, plan]) => (
                          <div key={scenario} className="bg-red-50 p-3 rounded border border-red-200">
                            <div className="font-medium text-red-700 text-sm mb-1 capitalize">
                              {scenario.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-xs text-red-600">
                              {plan as string}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
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
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  🌍 Plan Another Trip
                </button>
                <button
                  onClick={() => {
                    // Enhanced save functionality - could integrate with AdventureLog
                    const planData = {
                      destination: planningRequest.destination,
                      duration: planningRequest.duration,
                      budget: planningRequest.budget,
                      travelers: planningRequest.travelers,
                      generatedPlan: comprehensiveResult
                    };
                    console.log('Saving travel plan:', planData);
                    alert('Travel plan saved! (Integration with AdventureLog coming soon)');
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  💾 Save This Plan
                </button>
              </div>
              
              {/* Additional Actions */}
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                <button
                  onClick={() => {
                    const planText = JSON.stringify(comprehensiveResult, null, 2);
                    navigator.clipboard.writeText(planText);
                    alert('Plan copied to clipboard!');
                  }}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  📋 Copy Plan Details
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  🖨️ Print Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

