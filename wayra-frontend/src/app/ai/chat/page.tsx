'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import aiApiService, { TravelPlanRequest } from '../../../services/aiApi';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ConversationData {
  conversationId: string;
  initialPlan?: TravelPlanRequest;
  message: string;
  tripId?: string;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(true);
  
  // Travel plan form state
  const [planRequest, setPlanRequest] = useState<TravelPlanRequest>({
    destination: '',
    budget: 0,
    duration: 0,
    travelers: 1,
    interests: []
  });

  const startNewConversation = async () => {
    if (!user) {
      alert('Please log in to use AI chat');
      return;
    }

    // Validate plan request
    const errors = aiApiService.validateTravelPlanRequest(planRequest);
    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join('\n')}`);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await aiApiService.startConversation(planRequest);
      
      if (result.success && result.data) {
        setConversation(result.data);
        setMessages([
          {
            id: Date.now().toString(),
            type: 'ai',
            content: result.data.message,
            timestamp: new Date().toISOString()
          }
        ]);
        setShowPlanForm(false);
      } else {
        console.error('Failed to start conversation:', result.error);
        alert(`Failed to start conversation: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Error starting conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const result = await aiApiService.sendMessage(conversation.conversationId, {
        message: newMessage.trim(),
        context: {
          tripId: conversation.tripId,
          currentPlan: conversation.initialPlan,
          conversationHistory: messages
        }
      });

      if (result.success && result.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.data.response,
          timestamp: result.data.timestamp
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('Failed to send message:', result.error);
        alert(`Failed to send message: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Travel Assistant</h1>
          <p className="text-gray-600">Please log in to use the AI travel planning assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Travel Planning Assistant</h1>
        
        {showPlanForm ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Your Travel Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={planRequest.destination}
                  onChange={(e) => setPlanRequest(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Paris, France"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  value={planRequest.budget || ''}
                  onChange={(e) => setPlanRequest(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={planRequest.duration || ''}
                  onChange={(e) => setPlanRequest(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
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
                  value={planRequest.travelers || ''}
                  onChange={(e) => setPlanRequest(prev => ({ ...prev, travelers: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                value={planRequest.interestsText || ''}
                onChange={(e) => {
                  const input = e.target.value;
                  console.log('Input value:', input); // Debug log
                  
                  // Store the raw text and parse it when needed
                  setPlanRequest(prev => ({ 
                    ...prev, 
                    interestsText: input,
                    interests: input ? input.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0) : []
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., museums, food, architecture, nightlife (separate with commas, semicolons, or spaces)"
              />
            </div>
            
            <button
              onClick={startNewConversation}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Your Plan...' : 'Start AI Planning Session'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                    <p>AI is thinking...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your travel plan..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
        
        {conversation && (
          <div className="mt-6">
            <button
              onClick={() => {
                setShowPlanForm(true);
                setConversation(null);
                setMessages([]);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Start New Planning Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

