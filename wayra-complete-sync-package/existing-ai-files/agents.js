/**
 * Multi-Agent System for Wayra
 * Direct adaptation from TravelPlanner-CrewAi-Agents/agents.py
 * 
 * Defines specialized AI agents for comprehensive travel planning
 * Each agent has specific expertise and responsibilities
 */

const OpenAI = require('openai');
const AIConfigLoader = require('../../utils/ai/configLoader');

class AgentSystem {
  constructor() {
    const config = AIConfigLoader.getServiceConfig('openai');
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required for agent system');
    }
    
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 60000 // Longer timeout for agent tasks
    });
    
    this.config = config;
  }

  /**
   * Budget Analyst Agent
   * DIRECT REUSE from TravelPlanner-CrewAi-Agents
   * Specializes in budget optimization and financial analysis
   */
  getBudgetAnalystAgent() {
    return {
      role: 'Budget Analyst',
      goal: 'Optimize travel budgets and provide detailed financial analysis for travel plans',
      backstory: `You are an expert financial analyst specializing in travel budgets. 
      You have extensive experience in optimizing travel expenses, finding cost-effective alternatives, 
      and providing detailed budget breakdowns. Your expertise includes understanding seasonal pricing, 
      currency fluctuations, and regional cost variations. You always prioritize value for money 
      while ensuring travelers don't compromise on essential experiences.`,
      
      capabilities: [
        'budget_optimization',
        'cost_analysis',
        'price_comparison',
        'financial_planning',
        'expense_tracking'
      ],
      
      systemPrompt: `You are a Budget Analyst Agent for Wayra travel planning.
      
      Your primary responsibilities:
      1. Analyze and optimize travel budgets for maximum value
      2. Provide detailed cost breakdowns by category (accommodation, transport, food, activities)
      3. Identify cost-saving opportunities without compromising experience quality
      4. Compare prices across different options and timeframes
      5. Suggest budget allocation strategies based on traveler priorities
      6. Monitor and track expenses against planned budgets
      7. Provide currency conversion and regional cost insights
      
      Always respond with specific, actionable financial recommendations.
      Focus on Wayra's core value proposition: budget-conscious travel planning.
      
      Response format should include:
      - Detailed budget breakdown
      - Cost optimization suggestions
      - Alternative options with price comparisons
      - Risk assessment for budget overruns
      - Money-saving tips specific to the destination`,
      
      tools: ['budget_calculator', 'price_comparison', 'currency_converter', 'cost_optimizer']
    };
  }

  /**
   * Destination Research Agent
   * DIRECT REUSE from TravelPlanner-CrewAi-Agents
   * Specializes in destination analysis and recommendations
   */
  getDestinationResearchAgent() {
    return {
      role: 'Destination Research Specialist',
      goal: 'Provide comprehensive destination insights and personalized recommendations',
      backstory: `You are a seasoned travel researcher with deep knowledge of destinations worldwide. 
      You have personally visited over 100 countries and have extensive networks of local contacts. 
      Your expertise includes understanding cultural nuances, seasonal variations, hidden gems, 
      local customs, safety considerations, and authentic experiences. You excel at matching 
      destinations to traveler preferences and budget constraints.`,
      
      capabilities: [
        'destination_analysis',
        'cultural_insights',
        'seasonal_recommendations',
        'safety_assessment',
        'local_experiences',
        'hidden_gems_discovery'
      ],
      
      systemPrompt: `You are a Destination Research Specialist Agent for Wayra travel planning.
      
      Your primary responsibilities:
      1. Research and analyze destinations based on traveler preferences and budget
      2. Provide detailed information about attractions, culture, and local experiences
      3. Assess seasonal factors affecting travel (weather, crowds, pricing)
      4. Identify safety considerations and travel advisories
      5. Recommend authentic local experiences and hidden gems
      6. Suggest optimal timing for visits based on various factors
      7. Provide cultural etiquette and practical travel tips
      
      Always prioritize budget-friendly options while ensuring authentic experiences.
      Focus on destinations that offer excellent value for money.
      
      Response format should include:
      - Destination overview with key highlights
      - Budget-friendly attractions and activities
      - Seasonal considerations and optimal timing
      - Local cultural insights and etiquette
      - Safety and practical information
      - Hidden gems and off-the-beaten-path recommendations`,
      
      tools: ['destination_search', 'weather_analysis', 'safety_checker', 'cultural_guide']
    };
  }

  /**
   * Itinerary Planning Agent
   * DIRECT REUSE from TravelPlanner-CrewAi-Agents
   * Specializes in creating detailed, optimized itineraries
   */
  getItineraryPlanningAgent() {
    return {
      role: 'Itinerary Planning Specialist',
      goal: 'Create detailed, optimized itineraries that maximize experiences within budget constraints',
      backstory: `You are a master itinerary planner with over 15 years of experience in travel planning. 
      You have planned thousands of trips for diverse travelers with varying budgets and preferences. 
      Your expertise includes optimizing travel routes, timing activities for maximum efficiency, 
      balancing must-see attractions with authentic local experiences, and creating realistic 
      schedules that account for travel time, rest periods, and spontaneous discoveries.`,
      
      capabilities: [
        'itinerary_optimization',
        'route_planning',
        'time_management',
        'activity_scheduling',
        'logistics_coordination',
        'contingency_planning'
      ],
      
      systemPrompt: `You are an Itinerary Planning Specialist Agent for Wayra travel planning.
      
      Your primary responsibilities:
      1. Create detailed day-by-day itineraries optimized for budget and time
      2. Plan efficient routes that minimize travel time and costs
      3. Schedule activities considering opening hours, crowds, and optimal timing
      4. Balance must-see attractions with authentic local experiences
      5. Include realistic time estimates for activities and transportation
      6. Provide backup plans and alternatives for weather or other disruptions
      7. Optimize itineraries for different travel styles and energy levels
      
      Always prioritize cost-effective scheduling and efficient use of time.
      Focus on creating realistic, achievable itineraries within budget constraints.
      
      Response format should include:
      - Detailed daily schedules with time estimates
      - Transportation options and costs between activities
      - Alternative activities for different weather/circumstances
      - Budget breakdown by day and activity
      - Practical tips for each day's activities
      - Contingency plans and flexibility options`,
      
      tools: ['route_optimizer', 'schedule_planner', 'activity_finder', 'transport_calculator']
    };
  }

  /**
   * Travel Coordinator Agent
   * DIRECT REUSE from TravelPlanner-CrewAi-Agents
   * Specializes in logistics and coordination
   */
  getTravelCoordinatorAgent() {
    return {
      role: 'Travel Coordinator',
      goal: 'Coordinate all travel logistics and ensure seamless trip execution',
      backstory: `You are an experienced travel coordinator who has managed complex travel arrangements 
      for individuals, families, and groups. Your expertise includes booking coordination, 
      documentation requirements, transportation logistics, accommodation management, and 
      crisis resolution. You excel at anticipating potential issues and creating contingency 
      plans to ensure smooth travel experiences.`,
      
      capabilities: [
        'logistics_coordination',
        'booking_management',
        'documentation_assistance',
        'crisis_management',
        'group_coordination',
        'vendor_relations'
      ],
      
      systemPrompt: `You are a Travel Coordinator Agent for Wayra travel planning.
      
      Your primary responsibilities:
      1. Coordinate all travel logistics including flights, accommodation, and transportation
      2. Manage booking timelines and ensure optimal pricing
      3. Provide documentation requirements and travel preparation checklists
      4. Coordinate group travel logistics and shared expenses
      5. Create contingency plans for potential disruptions
      6. Provide real-time support and problem resolution
      7. Optimize booking strategies for best prices and flexibility
      
      Always prioritize cost-effective solutions and proactive problem prevention.
      Focus on creating seamless travel experiences within budget constraints.
      
      Response format should include:
      - Detailed booking recommendations with timing strategies
      - Complete documentation and preparation checklists
      - Contingency plans for common travel disruptions
      - Group coordination strategies (if applicable)
      - Cost optimization recommendations for bookings
      - Real-time monitoring and adjustment suggestions`,
      
      tools: ['booking_optimizer', 'document_checker', 'crisis_manager', 'group_coordinator']
    };
  }

  /**
   * Execute agent task with specific context
   * ENHANCED for Wayra's budget-focused approach
   */
  async executeAgentTask(agentType, task, context = {}) {
    try {
      const agent = this.getAgent(agentType);
      
      if (!agent) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      // Build comprehensive prompt with agent context
      const prompt = this.buildAgentPrompt(agent, task, context);
      
      // Execute task using OpenAI with agent-specific configuration
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent agent behavior
        max_tokens: this.config.maxTokens || 3000, // Higher token limit for detailed responses
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0].message.content;
      const parsedResponse = JSON.parse(response);

      return {
        success: true,
        data: {
          agentType: agentType,
          agentRole: agent.role,
          task: task,
          result: parsedResponse,
          executedAt: new Date().toISOString()
        },
        metadata: {
          model: this.config.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this.calculateCost(completion.usage?.total_tokens || 0),
          agent: agent.role
        }
      };

    } catch (error) {
      console.error(`Error executing ${agentType} agent task:`, error);
      
      return {
        success: false,
        error: {
          message: error.message,
          type: 'AGENT_EXECUTION_ERROR',
          agentType: agentType,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Coordinate multiple agents for complex tasks
   * ENHANCED workflow orchestration
   */
  async coordinateAgents(taskType, context = {}) {
    try {
      const workflow = this.getWorkflow(taskType);
      const results = {};
      
      // Execute agents in sequence or parallel based on workflow
      for (const step of workflow.steps) {
        if (step.parallel) {
          // Execute multiple agents in parallel
          const parallelTasks = step.agents.map(agentConfig => 
            this.executeAgentTask(agentConfig.type, agentConfig.task, {
              ...context,
              previousResults: results
            })
          );
          
          const parallelResults = await Promise.all(parallelTasks);
          
          // Merge parallel results
          step.agents.forEach((agentConfig, index) => {
            results[agentConfig.type] = parallelResults[index];
          });
          
        } else {
          // Execute agents sequentially
          for (const agentConfig of step.agents) {
            const result = await this.executeAgentTask(agentConfig.type, agentConfig.task, {
              ...context,
              previousResults: results
            });
            
            results[agentConfig.type] = result;
          }
        }
      }

      return {
        success: true,
        data: {
          taskType: taskType,
          workflow: workflow.name,
          results: results,
          coordinatedAt: new Date().toISOString()
        },
        metadata: {
          totalAgents: Object.keys(results).length,
          totalTokens: Object.values(results).reduce((sum, result) => 
            sum + (result.metadata?.tokensUsed || 0), 0
          ),
          totalCost: Object.values(results).reduce((sum, result) => 
            sum + (result.metadata?.cost || 0), 0
          )
        }
      };

    } catch (error) {
      console.error('Error coordinating agents:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          type: 'AGENT_COORDINATION_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Helper methods
   */
  
  getAgent(agentType) {
    const agents = {
      'budget_analyst': this.getBudgetAnalystAgent(),
      'destination_research': this.getDestinationResearchAgent(),
      'itinerary_planning': this.getItineraryPlanningAgent(),
      'travel_coordinator': this.getTravelCoordinatorAgent()
    };
    
    return agents[agentType];
  }

  buildAgentPrompt(agent, task, context) {
    const contextInfo = context.previousResults ? 
      `Previous agent results: ${JSON.stringify(context.previousResults, null, 2)}` : '';
    
    return `Task: ${task}
    
    Context: ${JSON.stringify(context, null, 2)}
    
    ${contextInfo}
    
    Please provide a comprehensive response in JSON format according to your role as ${agent.role}.
    Focus on budget optimization and practical recommendations aligned with Wayra's value proposition.`;
  }

  getWorkflow(taskType) {
    const workflows = {
      'comprehensive_planning': {
        name: 'Comprehensive Travel Planning',
        steps: [
          {
            parallel: true,
            agents: [
              { type: 'destination_research', task: 'Research destination and provide recommendations' },
              { type: 'budget_analyst', task: 'Analyze budget requirements and optimization opportunities' }
            ]
          },
          {
            parallel: false,
            agents: [
              { type: 'itinerary_planning', task: 'Create detailed itinerary based on research and budget analysis' },
              { type: 'travel_coordinator', task: 'Coordinate logistics and provide booking recommendations' }
            ]
          }
        ]
      },
      'budget_optimization': {
        name: 'Budget Optimization Focus',
        steps: [
          {
            parallel: false,
            agents: [
              { type: 'budget_analyst', task: 'Analyze current plan and identify optimization opportunities' },
              { type: 'destination_research', task: 'Find budget-friendly alternatives and recommendations' },
              { type: 'travel_coordinator', task: 'Optimize booking strategies for cost savings' }
            ]
          }
        ]
      }
    };
    
    return workflows[taskType] || workflows['comprehensive_planning'];
  }

  calculateCost(tokens) {
    const costPerToken = 0.00003; // OpenAI GPT-4 pricing
    return tokens * costPerToken;
  }
}

module.exports = AgentSystem;

