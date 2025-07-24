/**
 * AI API Service for Wayra Frontend
 * Provides client-side interface for AI-powered travel planning features
 * 
 * Integrates with existing Wayra API patterns and authentication
 */

import { auth } from '../lib/firebase';

// Types for AI API interactions
export interface TravelPlanRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests?: string[];
  travelDates?: {
    start: string;
    end: string;
  };
  tripId?: string;
}

export interface ConversationMessage {
  message: string;
  context?: {
    tripId?: string;
    currentPlan?: any;
    userPreferences?: any;
    conversationHistory?: any[];
  };
}

export interface OptimizationRequest {
  targetBudget?: number;
  priorities?: string[];
  constraints?: string[];
  currentPlan: any;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    type: string;
    timestamp?: string;
    details?: any;
  };
  metadata?: {
    service: string;
    timestamp: string;
    tokensUsed?: number;
    cost?: number;
  };
}

class AIApiService {
  private baseUrl: string;
  
  constructor() {
    // Use existing Wayra API base URL pattern
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }
  
  /**
   * Get authentication headers for API requests
   * REUSE: Wayra's existing authentication pattern
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Handle API responses with consistent error handling
   * PRESERVE: Wayra's existing error handling patterns
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API response error:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'API_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Start a new AI conversation for travel planning
   */
  async startConversation(request: TravelPlanRequest): Promise<APIResponse<{
    conversationId: string;
    initialPlan: any;
    message: string;
    tripId?: string;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/conversation/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to start conversation',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Send a message in an existing conversation
   */
  async sendMessage(
    conversationId: string, 
    messageData: ConversationMessage
  ): Promise<APIResponse<{
    conversationId: string;
    response: string;
    tripUpdates?: any;
    timestamp: string;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(
        `${this.baseUrl}/api/ai/conversation/${conversationId}/message`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(messageData)
        }
      );
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error sending message:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to send message',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<APIResponse<{
    conversationId: string;
    messages: any[];
    status: string;
    createdAt: string;
    lastActivity: string;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(
        `${this.baseUrl}/api/ai/conversation/${conversationId}`,
        {
          method: 'GET',
          headers
        }
      );
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error getting conversation:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get conversation',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Optimize travel plan within conversation context
   * WAYRA-SPECIFIC: Core budget optimization functionality
   */
  async optimizePlan(
    conversationId: string,
    optimizationData: OptimizationRequest
  ): Promise<APIResponse<{
    conversationId: string;
    optimizations: any;
    savingsAnalysis: any;
    optimizedAt: string;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(
        `${this.baseUrl}/api/ai/conversation/${conversationId}/optimize`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(optimizationData)
        }
      );
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error optimizing plan:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to optimize plan',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<APIResponse<{
    conversationId: string;
    status: string;
    archivedAt: string;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(
        `${this.baseUrl}/api/ai/conversation/${conversationId}`,
        {
          method: 'DELETE',
          headers
        }
      );
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error archiving conversation:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to archive conversation',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Get all conversations for current user
   */
  async getUserConversations(): Promise<APIResponse<{
    conversations: any[];
    totalCount: number;
    activeCount: number;
  }>> {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(
        `${this.baseUrl}/api/ai/conversation/user/${user.uid}`,
        {
          method: 'GET',
          headers
        }
      );
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get conversations',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Utility methods for common operations
   */
  
  /**
   * Format budget for display
   * REUSE: Consistent with Wayra's existing budget formatting
   */
  formatBudget(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  /**
   * Calculate savings percentage
   * REUSE: Mathematical utilities for budget analysis
   */
  calculateSavingsPercentage(original: number, optimized: number): number {
    if (original <= 0) return 0;
    return ((original - optimized) / original) * 100;
  }
  
  /**
   * Validate travel plan request
   * PRESERVE: Wayra's existing validation patterns
   */
  validateTravelPlanRequest(request: TravelPlanRequest): string[] {
    const errors: string[] = [];
    
    if (!request.destination || request.destination.trim().length === 0) {
      errors.push('Destination is required');
    }
    
    if (!request.budget || request.budget <= 0) {
      errors.push('Budget must be greater than zero');
    }
    
    if (!request.duration || request.duration <= 0) {
      errors.push('Duration must be greater than zero');
    }
    
    if (!request.travelers || request.travelers <= 0) {
      errors.push('Number of travelers must be greater than zero');
    }
    
    if (request.travelDates) {
      const startDate = new Date(request.travelDates.start);
      const endDate = new Date(request.travelDates.end);
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }
      
      if (startDate < new Date()) {
        errors.push('Start date cannot be in the past');
      }
    }
    
    return errors;
  }
  
  /**
   * Check if AI features are available
   * PRESERVE: Wayra's existing feature flag patterns
   */
  async checkAIFeatureAvailability(): Promise<{
    conversation: boolean;
    optimization: boolean;
    agents: boolean;
  }> {
    try {
      // This would typically check with the backend for feature flags
      // For now, return default availability
      return {
        conversation: true,
        optimization: true,
        agents: false // Multi-agent features not yet implemented
      };
    } catch (error) {
      console.error('Error checking AI feature availability:', error);
      
      return {
        conversation: false,
        optimization: false,
        agents: false
      };
    }
  }
}

// Export singleton instance
export const aiApiService = new AIApiService();
export default aiApiService;

