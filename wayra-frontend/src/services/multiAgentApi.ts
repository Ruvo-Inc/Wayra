/**
 * Multi-Agent API Service for Wayra Frontend
 * Provides client-side interface for multi-agent AI travel planning
 * 
 * Integrates with existing Wayra API patterns and authentication
 */

import { auth } from '../lib/firebase';

// Types for Multi-Agent API interactions
export interface PlanningRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests?: string[];
  travelDates?: {
    start: string;
    end: string;
  };
  preferences?: {
    budgetPriority?: 'high' | 'medium' | 'low';
    travelStyle?: 'budget' | 'comfort' | 'luxury';
    pace?: 'relaxed' | 'moderate' | 'packed';
  };
}

export interface BudgetAnalysisRequest {
  totalBudget: number;
  duration: number;
  destination: string;
  travelers: number;
  categories?: Record<string, number>;
  priorities?: Record<string, number>;
  currentPlan?: any;
}

export interface DestinationResearchRequest {
  destination: string;
  budget?: number;
  interests?: string[];
  travelDates?: {
    start: string;
    end: string;
  };
  travelers?: number;
  preferences?: Record<string, any>;
}

export interface ItineraryPlanningRequest {
  destination: string;
  duration: number;
  budget?: number;
  travelers?: number;
  interests?: string[];
  travelDates?: {
    start: string;
    end: string;
  };
  preferences?: Record<string, any>;
  destinationResearch?: any;
  budgetAnalysis?: any;
}

export interface TravelCoordinationRequest {
  itinerary: any;
  budget?: number;
  travelers?: number;
  preferences?: Record<string, any>;
  bookingRequirements?: Record<string, any>;
  flexibility?: 'low' | 'medium' | 'high';
}

export interface OptimizationRequest {
  currentPlan: any;
  targetBudget?: number;
  priorities?: string[];
  constraints?: string[];
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
    totalAgents?: number;
    totalTokens?: number;
    totalCost?: number;
  };
}

class MultiAgentApiService {
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
      console.error('Multi-agent API response error:', error);
      
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
   * Budget Analyst Agent - Comprehensive budget analysis
   */
  async analyzeBudget(request: BudgetAnalysisRequest): Promise<APIResponse<{
    analysis: any;
    calculations: any;
    agent: string;
    context: any;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/analyze-budget`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in budget analysis:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to analyze budget',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Destination Research Agent - Comprehensive destination analysis
   */
  async researchDestination(request: DestinationResearchRequest): Promise<APIResponse<{
    research: any;
    destinationData: any;
    weatherAnalysis: any;
    agent: string;
    context: any;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/research-destination`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in destination research:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to research destination',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Itinerary Planning Agent - Detailed itinerary creation
   */
  async planItinerary(request: ItineraryPlanningRequest): Promise<APIResponse<{
    itinerary: any;
    activityRecommendations: any;
    agent: string;
    context: any;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/plan-itinerary`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in itinerary planning:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to plan itinerary',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Travel Coordinator Agent - Logistics coordination
   */
  async coordinateTravel(request: TravelCoordinationRequest): Promise<APIResponse<{
    coordination: any;
    bookingOptimization: any;
    agent: string;
    context: any;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/coordinate-travel`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in travel coordination:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to coordinate travel',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Comprehensive Planning - Full multi-agent workflow
   * WAYRA-SPECIFIC: Core multi-agent functionality
   */
  async comprehensivePlanning(request: PlanningRequest): Promise<APIResponse<{
    budgetAnalysis: any;
    destinationResearch: any;
    itineraryPlan: any;
    travelCoordination: any;
    workflow: string;
    context: any;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/comprehensive-planning`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in comprehensive planning:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to execute comprehensive planning',
          type: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Optimize Existing Plan - Multi-agent optimization workflow
   */
  async optimizeExistingPlan(request: OptimizationRequest): Promise<APIResponse<{
    optimization: any;
    workflow: string;
    context: any;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/optimize-existing-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in plan optimization:', error);
      
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
   * Get Agent Capabilities - Check available agents and features
   */
  async getAgentCapabilities(): Promise<APIResponse<{
    agents: Record<string, any>;
    workflows: Record<string, any>;
    features: Record<string, boolean>;
  }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/ai/agents/capabilities`, {
        method: 'GET',
        headers
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error getting agent capabilities:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get agent capabilities',
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
   * Calculate daily budget
   */
  calculateDailyBudget(totalBudget: number, duration: number): number {
    if (duration <= 0) return 0;
    return totalBudget / duration;
  }
  
  /**
   * Calculate savings percentage
   */
  calculateSavingsPercentage(original: number, optimized: number): number {
    if (original <= 0) return 0;
    return ((original - optimized) / original) * 100;
  }
  
  /**
   * Validate planning request
   * PRESERVE: Wayra's existing validation patterns
   */
  validatePlanningRequest(request: PlanningRequest): string[] {
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
    
    if (request.budget && request.duration && request.budget / request.duration < 10) {
      errors.push('Daily budget is too low (minimum $10/day)');
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
      
      const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (Math.abs(daysDifference - request.duration) > 1) {
        errors.push('Duration should match the difference between start and end dates');
      }
    }
    
    return errors;
  }
  
  /**
   * Validate budget analysis request
   */
  validateBudgetAnalysisRequest(request: BudgetAnalysisRequest): string[] {
    const errors: string[] = [];
    
    if (!request.totalBudget || request.totalBudget <= 0) {
      errors.push('Total budget must be greater than zero');
    }
    
    if (!request.duration || request.duration <= 0) {
      errors.push('Duration must be greater than zero');
    }
    
    if (!request.destination || request.destination.trim().length === 0) {
      errors.push('Destination is required');
    }
    
    if (!request.travelers || request.travelers <= 0) {
      errors.push('Number of travelers must be greater than zero');
    }
    
    return errors;
  }
  
  /**
   * Check if multi-agent features are available
   */
  async checkMultiAgentAvailability(): Promise<{
    budgetAnalyst: boolean;
    destinationResearch: boolean;
    itineraryPlanning: boolean;
    travelCoordinator: boolean;
    comprehensivePlanning: boolean;
  }> {
    try {
      const capabilities = await this.getAgentCapabilities();
      
      if (capabilities.success && capabilities.data) {
        const agents = capabilities.data.agents;
        const workflows = capabilities.data.workflows;
        
        return {
          budgetAnalyst: agents.budget_analyst?.available || false,
          destinationResearch: agents.destination_research?.available || false,
          itineraryPlanning: agents.itinerary_planning?.available || false,
          travelCoordinator: agents.travel_coordinator?.available || false,
          comprehensivePlanning: workflows.comprehensive_planning?.available || false
        };
      }
      
      return {
        budgetAnalyst: false,
        destinationResearch: false,
        itineraryPlanning: false,
        travelCoordinator: false,
        comprehensivePlanning: false
      };
    } catch (error) {
      console.error('Error checking multi-agent availability:', error);
      
      return {
        budgetAnalyst: false,
        destinationResearch: false,
        itineraryPlanning: false,
        travelCoordinator: false,
        comprehensivePlanning: false
      };
    }
  }
  
  /**
   * Get estimated planning time based on request complexity
   */
  estimatePlanningTime(request: PlanningRequest): {
    estimatedMinutes: number;
    complexity: 'simple' | 'moderate' | 'complex';
    factors: string[];
  } {
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    let estimatedMinutes = 1;
    const factors: string[] = [];
    
    // Duration factor
    if (request.duration > 7) {
      estimatedMinutes += 0.5;
      factors.push('Long duration');
    }
    
    // Travelers factor
    if (request.travelers > 2) {
      estimatedMinutes += 0.3;
      factors.push('Multiple travelers');
    }
    
    // Interests factor
    if (request.interests && request.interests.length > 5) {
      estimatedMinutes += 0.2;
      factors.push('Many interests');
    }
    
    // Budget complexity
    if (request.budget > 5000) {
      estimatedMinutes += 0.2;
      factors.push('High budget complexity');
    }
    
    // Determine complexity
    if (estimatedMinutes > 2) {
      complexity = 'complex';
    } else if (estimatedMinutes > 1.5) {
      complexity = 'moderate';
    }
    
    return {
      estimatedMinutes: Math.ceil(estimatedMinutes),
      complexity,
      factors
    };
  }
}

// Export singleton instance
export const multiAgentApiService = new MultiAgentApiService();
export default multiAgentApiService;

