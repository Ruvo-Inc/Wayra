/**
 * Wayra Multi-Agent Planning Component
 * Interface for comprehensive AI travel planning
 */

import React, { useState } from 'react';
import { multiAgentApi } from '../../../services/ai/multiAgentApi';

interface PlanningRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  dates: {
    start: string;
    end: string;
  };
}

interface AgentResult {
  budgetAnalysis: any;
  destinationInsights: any;
  itineraryPlan: any;
  travelCoordination: any;
  errors: any;
}

export const MultiAgentPlanning: React.FC = () => {
  const [planningRequest, setPlanningRequest] = useState<PlanningRequest>({
    destination: '',
    budget: 0,
    duration: 0,
    travelers: 1,
    interests: [],
    dates: { start: '', end: '' }
  });

  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await multiAgentApi.executeComprehensivePlanning(planningRequest);
      setResult(response.result);
      setCurrentStep(4);
    } catch (error) {
      console.error('Planning failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
            currentStep >= step ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderTripDetails = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Trip Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <input
            type="text"
            value={planningRequest.destination}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, destination: e.target.value }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g., Paris, France"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Budget ($)
          </label>
          <input
            type="number"
            value={planningRequest.budget}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (days)
          </label>
          <input
            type="number"
            value={planningRequest.duration}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="7"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Travelers
          </label>
          <input
            type="number"
            value={planningRequest.travelers}
            onChange={(e) => setPlanningRequest(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2"
            placeholder="2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!planningRequest.destination || !planningRequest.budget || !planningRequest.duration}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          Next: Preferences
        </button>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Preferences</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Travel Interests
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Museums', 'Food', 'Nightlife', 'Nature', 'Adventure', 'Culture', 'Shopping', 'Photography'].map((interest) => (
            <label key={interest} className="flex items-center">
              <input
                type="checkbox"
                checked={planningRequest.interests.includes(interest)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPlanningRequest(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                  } else {
                    setPlanningRequest(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Next: AI Planning
        </button>
      </div>
    </div>
  );

  const renderAIPlanning = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">AI Planning</h2>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Ready to create your personalized travel plan!</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>🎯 <strong>Destination:</strong> {planningRequest.destination}</p>
          <p>💰 <strong>Budget:</strong> ${planningRequest.budget.toLocaleString()}</p>
          <p>📅 <strong>Duration:</strong> {planningRequest.duration} days</p>
          <p>👥 <strong>Travelers:</strong> {planningRequest.travelers}</p>
          <p>🎨 <strong>Interests:</strong> {planningRequest.interests.join(', ')}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">AI agents are working on your travel plan...</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={loading}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 disabled:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Creating Plan...' : 'Create Travel Plan'}
        </button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Your AI-Generated Travel Plan</h2>
      
      {result && (
        <div className="space-y-6">
          {/* Agent Status Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">🤖 AI Agent Execution Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Budget Analysis', status: result.budgetAnalysis ? 'Complete' : 'Failed', icon: '💰' },
                { name: 'Destination Insights', status: result.destinationInsights ? 'Complete' : 'Failed', icon: '🌍' },
                { name: 'Itinerary Plan', status: result.itineraryPlan ? 'Complete' : 'Failed', icon: '📋' },
                { name: 'Travel Coordination', status: result.travelCoordination ? 'Complete' : 'Failed', icon: '✈️' }
              ].map((agent) => (
                <div key={agent.name} className={`p-3 rounded-md ${agent.status === 'Complete' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="text-lg">{agent.icon}</div>
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className={`text-xs ${agent.status === 'Complete' ? 'text-green-600' : 'text-red-600'}`}>
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Analysis */}
          {result.budgetAnalysis && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Budget Analysis</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {result.budgetAnalysis}
              </div>
            </div>
          )}

          {/* Destination Insights */}
          {result.destinationInsights && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🌍 Destination Insights</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {result.destinationInsights}
              </div>
            </div>
          )}

          {/* Itinerary Plan */}
          {result.itineraryPlan && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Detailed Itinerary</h3>
              {typeof result.itineraryPlan === 'object' ? (
                <div className="space-y-4">
                  {Object.entries(result.itineraryPlan).map(([day, details]: [string, any]) => (
                    <div key={day} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-800">{day.toUpperCase()}</h4>
                      {details.activities && (
                        <div className="mt-2 space-y-2">
                          {details.activities.map((activity: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600">
                              <strong>{activity.time}</strong> - {activity.activity} at {activity.location}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-gray-700">
                  {result.itineraryPlan}
                </div>
              )}
            </div>
          )}

          {/* Travel Coordination */}
          {result.travelCoordination && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">✈️ Travel Coordination</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {result.travelCoordination}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => {
            setResult(null);
            setCurrentStep(1);
          }}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200"
        >
          Plan Another Trip
        </button>
        <button
          onClick={() => console.log('Save plan functionality')}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          Save This Plan
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          AI Multi-Agent Travel Planning
        </h1>
        
        {renderStepIndicator()}
        
        {currentStep === 1 && renderTripDetails()}
        {currentStep === 2 && renderPreferences()}
        {currentStep === 3 && renderAIPlanning()}
        {currentStep === 4 && renderResults()}
      </div>
    </div>
  );
};
