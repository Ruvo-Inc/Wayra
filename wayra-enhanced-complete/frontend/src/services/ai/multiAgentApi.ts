/**
 * Wayra Multi-Agent API Service
 * TypeScript client for AI agent interactions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface PlanningRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  dates?: {
    start: string;
    end: string;
  };
}

interface AgentResponse {
  success: boolean;
  result: any;
  timestamp: string;
}

interface ComprehensivePlanningResponse {
  success: boolean;
  result: {
    budgetAnalysis: any;
    destinationInsights: any;
    itineraryPlan: any;
    travelCoordination: any;
    errors: any;
  };
  timestamp: string;
}

class MultiAgentApi {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/api/ai${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async executeComprehensivePlanning(request: PlanningRequest): Promise<ComprehensivePlanningResponse> {
    return this.makeRequest('/agents/comprehensive-planning', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async executeAgentTask(agentRole: string, task: string, context: any = {}): Promise<AgentResponse> {
    return this.makeRequest(`/agents/agent/${agentRole}`, {
      method: 'POST',
      body: JSON.stringify({ task, context }),
    });
  }

  async getAgentCapabilities() {
    return this.makeRequest('/agents/capabilities');
  }

  async healthCheck() {
    return this.makeRequest('/health');
  }
}

export const multiAgentApi = new MultiAgentApi();
export type { PlanningRequest, AgentResponse, ComprehensivePlanningResponse };
