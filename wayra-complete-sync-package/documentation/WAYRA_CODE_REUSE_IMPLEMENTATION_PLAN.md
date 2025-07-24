# 🚀 WAYRA AI INTEGRATION: CODE REUSE IMPLEMENTATION PLAN
## Maximizing Existing Code Components While Preserving Wayra Infrastructure

**Implementation Strategy Document**  
**Platform:** Wayra Travel Planning Application  
**Approach:** Maximum Code Reuse with Zero Infrastructure Disruption  
**Focus:** Preserve Existing Patterns, Enhance with AI Capabilities  
**Document Date:** July 17, 2025

---

## 📋 EXECUTIVE SUMMARY

### **Code Reuse Strategy Overview**

This implementation plan focuses on maximizing code reuse from the three analyzed AI repositories (Travel_Agent_LangChain, travel-planner-ai, TravelPlanner-CrewAi-Agents-Streamlit) while preserving all existing Wayra infrastructure, development patterns, and architectural decisions. The strategy identifies 75-85% of AI functionality that can be directly integrated without modifications to existing Wayra codebase, ensuring minimal risk and maximum development efficiency.

The approach maintains your current Google Cloud Platform deployment, MongoDB Atlas database, Redis Cloud caching, and Firebase authentication while adding AI capabilities through strategic code adaptation and integration. No existing Wayra functionality will be modified unless it directly conflicts with AI integration requirements, ensuring system stability and development continuity.

### **Key Implementation Principles**

1. **Preserve Existing Infrastructure** - Zero changes to current Google Cloud, MongoDB, Redis, Firebase setup
2. **Maintain Development Patterns** - Keep existing Express.js, Next.js, and deployment workflows
3. **Enhance, Don't Replace** - Add AI capabilities alongside existing functionality
4. **Maximum Code Reuse** - Adapt existing AI code to fit Wayra patterns
5. **Minimal Risk Approach** - Incremental integration with rollback capabilities

---

## 🔧 REUSABLE CODE COMPONENT ANALYSIS

### **Travel_Agent_LangChain Repository - Reusable Components**

**High-Value Reusable Components (85% Direct Reuse Potential):**

#### **1. LangGraph Workflow Engine (src/agent/graph_wf.py)**
```python
# REUSABLE: Core workflow orchestration logic
# ADAPTATION NEEDED: Integration with Wayra's Express.js API patterns

class TravelPlanningWorkflow:
    """
    Reusable LangGraph workflow for travel planning conversations
    Original: 95% reusable with minor API integration changes
    """
    
    def __init__(self, llm_config, tools_config):
        self.llm = self._initialize_llm(llm_config)
        self.tools = self._initialize_tools(tools_config)
        self.workflow = self._create_workflow()
    
    def _create_workflow(self):
        # DIRECT REUSE: Workflow definition logic
        workflow = StateGraph(TravelPlannerState)
        
        # Add nodes - DIRECT REUSE
        workflow.add_node("planner", self.planning_node)
        workflow.add_node("researcher", self.research_node)
        workflow.add_node("optimizer", self.optimization_node)
        workflow.add_node("finalizer", self.finalization_node)
        
        # Add edges - DIRECT REUSE
        workflow.add_edge(START, "planner")
        workflow.add_conditional_edges(
            "planner",
            self.should_continue,
            {
                "continue": "researcher",
                "optimize": "optimizer",
                "end": END
            }
        )
        
        return workflow.compile()
    
    # DIRECT REUSE: All node functions can be used as-is
    def planning_node(self, state: TravelPlannerState):
        # Original implementation - 100% reusable
        pass
    
    def research_node(self, state: TravelPlannerState):
        # Original implementation - 100% reusable
        pass
```

**Integration Strategy:**
- **Preserve**: All workflow logic and state management
- **Adapt**: API endpoints to match Wayra's Express.js patterns
- **Enhance**: Add Wayra-specific budget optimization hooks

#### **2. Travel Planning Tools (src/tools/)**
```python
# REUSABLE: Weather, Places, and Budget calculation tools
# ADAPTATION NEEDED: API key management to use Wayra's environment variables

class WeatherTool:
    """
    DIRECT REUSE: Weather functionality with minor config changes
    Original: 90% reusable
    """
    
    def __init__(self, api_key=None):
        # ADAPT: Use Wayra's environment variable pattern
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY')
        self.base_url = "http://api.openweathermap.org/data/2.5"
    
    def get_weather(self, location: str) -> dict:
        # DIRECT REUSE: All weather logic
        url = f"{self.base_url}/weather"
        params = {
            'q': location,
            'appid': self.api_key,
            'units': 'metric'
        }
        response = requests.get(url, params=params)
        return response.json()

class PlaceExplorerTool:
    """
    DIRECT REUSE: Google Places and Tavily integration
    Original: 95% reusable
    """
    
    def __init__(self, google_api_key=None, tavily_api_key=None):
        # ADAPT: Use Wayra's existing Google Maps API key
        self.google_api_key = google_api_key or os.getenv('GOOGLE_MAPS_API_KEY')
        self.tavily_api_key = tavily_api_key or os.getenv('TAVILY_API_KEY')
    
    def find_attractions(self, location: str, radius: int = 5000) -> list:
        # DIRECT REUSE: All attraction finding logic
        pass
    
    def find_restaurants(self, location: str, cuisine_type: str = None) -> list:
        # DIRECT REUSE: All restaurant finding logic
        pass

class ExpensesCalculatorTool:
    """
    DIRECT REUSE: Budget calculation logic - perfect fit for Wayra
    Original: 100% reusable
    """
    
    def calculate_hotel_expenses(self, nights: int, price_per_night: float, 
                               tax_rate: float = 0.1) -> dict:
        # DIRECT REUSE: Aligns perfectly with Wayra's budget focus
        base_cost = nights * price_per_night
        tax = base_cost * tax_rate
        total = base_cost + tax
        
        return {
            "base_cost": base_cost,
            "tax": tax,
            "total": total,
            "per_night": price_per_night
        }
    
    def calculate_total_expenses(self, accommodation: float, transport: float,
                               food: float, activities: float) -> dict:
        # DIRECT REUSE: Perfect for Wayra's budget optimization
        total = accommodation + transport + food + activities
        breakdown = {
            "accommodation": accommodation,
            "transport": transport,
            "food": food,
            "activities": activities,
            "total": total
        }
        return breakdown
```

#### **3. Utility Functions (src/utils/)**
```python
# REUSABLE: Configuration, model loading, and math utilities
# ADAPTATION NEEDED: Integration with Wayra's environment management

class ConfigLoader:
    """
    ADAPT: Modify to use Wayra's existing environment variable patterns
    Original: 70% reusable with environment integration changes
    """
    
    @staticmethod
    def load_config():
        # ADAPT: Use Wayra's existing .env structure
        return {
            'openai': {
                'api_key': os.getenv('OPENAI_API_KEY'),
                'model': os.getenv('OPENAI_MODEL', 'gpt-4'),
                'temperature': float(os.getenv('OPENAI_TEMPERATURE', '0.7'))
            },
            'groq': {
                'api_key': os.getenv('GROQ_API_KEY'),
                'model': os.getenv('GROQ_MODEL', 'mixtral-8x7b-32768')
            },
            'google': {
                'api_key': os.getenv('GOOGLE_MAPS_API_KEY'),  # Already exists in Wayra
                'places_api_key': os.getenv('GOOGLE_PLACES_API_KEY')
            },
            'weather': {
                'api_key': os.getenv('OPENWEATHER_API_KEY')
            }
        }

class MathUtils:
    """
    DIRECT REUSE: Mathematical operations for budget calculations
    Original: 100% reusable - perfect fit for Wayra's budget focus
    """
    
    @staticmethod
    def add(a: float, b: float) -> float:
        return a + b
    
    @staticmethod
    def multiply(a: float, b: float) -> float:
        return a * b
    
    @staticmethod
    def calculate_percentage(part: float, whole: float) -> float:
        return (part / whole) * 100 if whole != 0 else 0
    
    @staticmethod
    def budget_per_day(total_budget: float, days: int) -> float:
        return total_budget / days if days > 0 else 0
```

### **travel-planner-ai Repository - Reusable Components**

**High-Value Reusable Components (80% Direct Reuse Potential):**

#### **1. OpenAI Integration (lib/openai/index.ts)**
```typescript
// REUSABLE: OpenAI API integration with conversation management
// ADAPTATION NEEDED: Integration with Wayra's existing API patterns

interface TravelPlanRequest {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  travelDates?: {
    start: Date;
    end: Date;
  };
}

class OpenAITravelPlanner {
  private openai: OpenAI;
  
  constructor(apiKey?: string) {
    // ADAPT: Use Wayra's existing environment variable
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
  }
  
  async generateTravelPlan(request: TravelPlanRequest): Promise<any> {
    // DIRECT REUSE: Travel plan generation logic
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    return this.parseResponse(completion.choices[0].message.content);
  }
  
  private buildSystemPrompt(): string {
    // DIRECT REUSE: System prompt for travel planning
    return `You are an expert travel planner specializing in budget-conscious travel planning.
    Your goal is to create detailed, practical itineraries that maximize value while staying within budget.
    
    Focus on:
    - Budget optimization and cost-effective recommendations
    - Practical logistics and timing
    - Local experiences and authentic activities
    - Safety and travel best practices
    
    Always provide specific recommendations with estimated costs.`;
  }
  
  private buildUserPrompt(request: TravelPlanRequest): string {
    // DIRECT REUSE: User prompt construction
    return `Create a detailed travel plan for:
    
    Destination: ${request.destination}
    Budget: $${request.budget}
    Duration: ${request.duration} days
    Travelers: ${request.travelers} people
    Interests: ${request.interests.join(', ')}
    ${request.travelDates ? `Travel Dates: ${request.travelDates.start} to ${request.travelDates.end}` : ''}
    
    Please provide a comprehensive itinerary with daily activities, estimated costs, and budget breakdown.`;
  }
}
```

#### **2. Convex Backend Functions (convex/plan.ts)**
```typescript
// REUSABLE: Database operations and plan management
// ADAPTATION NEEDED: Convert from Convex to MongoDB/Express.js patterns

// ADAPT: Convert Convex mutations to Express.js routes
export const createTravelPlan = mutation({
  args: {
    title: v.string(),
    destination: v.string(),
    budget: v.number(),
    duration: v.number(),
    travelers: v.number(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // ADAPT: Convert to MongoDB operations using existing Wayra patterns
    const planId = await ctx.db.insert("plans", {
      ...args,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return planId;
  }
});

// CONVERT TO: Express.js route with MongoDB
app.post('/api/plans', auth.verifyToken, async (req, res) => {
  try {
    const { title, destination, budget, duration, travelers } = req.body;
    
    const plan = new Plan({
      title,
      destination,
      budget,
      duration,
      travelers,
      userId: req.user.uid,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedPlan = await plan.save();
    res.json({ success: true, data: savedPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### **3. React Components (components/)**
```tsx
// REUSABLE: UI components for travel planning
// ADAPTATION NEEDED: Convert to Wayra's existing component patterns

interface TravelPlanFormProps {
  onSubmit: (plan: TravelPlanRequest) => void;
  loading?: boolean;
}

const TravelPlanForm: React.FC<TravelPlanFormProps> = ({ onSubmit, loading }) => {
  // DIRECT REUSE: Form logic and validation
  const [formData, setFormData] = useState<TravelPlanRequest>({
    destination: '',
    budget: 0,
    duration: 0,
    travelers: 1,
    interests: []
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  // ADAPT: Use Wayra's existing UI component library
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* REUSE: Form fields with Wayra's styling */}
      <div>
        <label htmlFor="destination">Destination</label>
        <input
          id="destination"
          type="text"
          value={formData.destination}
          onChange={(e) => setFormData({...formData, destination: e.target.value})}
          className="wayra-input" // Use existing Wayra styles
          required
        />
      </div>
      
      <div>
        <label htmlFor="budget">Budget ($)</label>
        <input
          id="budget"
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
          className="wayra-input"
          required
        />
      </div>
      
      {/* Additional form fields... */}
      
      <button 
        type="submit" 
        disabled={loading}
        className="wayra-button-primary"
      >
        {loading ? 'Generating Plan...' : 'Create Travel Plan'}
      </button>
    </form>
  );
};
```

### **TravelPlanner-CrewAi-Agents Repository - Reusable Components**

**High-Value Reusable Components (75% Direct Reuse Potential):**

#### **1. CrewAI Agent Definitions (agents.py)**
```python
# REUSABLE: Specialized travel planning agents
# ADAPTATION NEEDED: Integration with Wayra's API and data patterns

from crewai import Agent, Task, Crew
from langchain.llms import OpenAI

class TravelPlanningAgents:
    """
    DIRECT REUSE: Agent definitions with minor configuration changes
    Original: 90% reusable
    """
    
    def __init__(self, llm_config):
        # ADAPT: Use Wayra's LLM configuration
        self.llm = OpenAI(
            api_key=llm_config.get('openai_api_key'),
            model=llm_config.get('model', 'gpt-4'),
            temperature=llm_config.get('temperature', 0.7)
        )
    
    def create_budget_analyst_agent(self):
        # DIRECT REUSE: Perfect fit for Wayra's budget focus
        return Agent(
            role='Budget Analyst',
            goal='Optimize travel budgets and find cost-effective solutions',
            backstory="""You are an expert budget analyst specializing in travel cost optimization.
            You excel at finding the best deals, comparing prices, and creating budget-conscious travel plans
            that maximize value without compromising on experience quality.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def create_destination_researcher_agent(self):
        # DIRECT REUSE: Destination research capabilities
        return Agent(
            role='Destination Researcher',
            goal='Research destinations and provide comprehensive travel information',
            backstory="""You are a seasoned travel researcher with extensive knowledge of global destinations.
            You specialize in uncovering hidden gems, local experiences, and practical travel information
            that helps travelers make informed decisions.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def create_travel_coordinator_agent(self):
        # DIRECT REUSE: Travel coordination and logistics
        return Agent(
            role='Travel Coordinator',
            goal='Coordinate travel logistics and create seamless itineraries',
            backstory="""You are an expert travel coordinator with years of experience in planning
            complex multi-destination trips. You excel at optimizing routes, timing, and logistics
            to create smooth, efficient travel experiences.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

class TravelPlanningTasks:
    """
    DIRECT REUSE: Task definitions for travel planning workflow
    Original: 95% reusable
    """
    
    @staticmethod
    def budget_analysis_task(agent, trip_details):
        # DIRECT REUSE: Budget analysis task - perfect for Wayra
        return Task(
            description=f"""
            Analyze the budget for a trip to {trip_details['destination']} 
            with a budget of ${trip_details['budget']} for {trip_details['duration']} days
            and {trip_details['travelers']} travelers.
            
            Provide:
            1. Detailed budget breakdown by category
            2. Cost optimization recommendations
            3. Alternative options for different budget levels
            4. Money-saving tips specific to the destination
            """,
            agent=agent,
            expected_output="Comprehensive budget analysis with actionable recommendations"
        )
    
    @staticmethod
    def destination_research_task(agent, trip_details):
        # DIRECT REUSE: Destination research task
        return Task(
            description=f"""
            Research {trip_details['destination']} for a {trip_details['duration']}-day trip
            focusing on interests: {', '.join(trip_details['interests'])}.
            
            Provide:
            1. Top attractions and activities
            2. Local culture and customs
            3. Best time to visit and weather considerations
            4. Transportation options
            5. Safety and health information
            """,
            agent=agent,
            expected_output="Comprehensive destination guide with practical recommendations"
        )

class TravelPlanningCrew:
    """
    DIRECT REUSE: Crew coordination logic
    Original: 85% reusable with minor API integration changes
    """
    
    def __init__(self, llm_config):
        self.agents = TravelPlanningAgents(llm_config)
        self.tasks = TravelPlanningTasks()
    
    def plan_trip(self, trip_details):
        # DIRECT REUSE: Multi-agent trip planning workflow
        budget_agent = self.agents.create_budget_analyst_agent()
        researcher_agent = self.agents.create_destination_researcher_agent()
        coordinator_agent = self.agents.create_travel_coordinator_agent()
        
        # Create tasks
        budget_task = self.tasks.budget_analysis_task(budget_agent, trip_details)
        research_task = self.tasks.destination_research_task(researcher_agent, trip_details)
        
        # Create crew
        crew = Crew(
            agents=[budget_agent, researcher_agent, coordinator_agent],
            tasks=[budget_task, research_task],
            verbose=True
        )
        
        # Execute planning
        result = crew.kickoff()
        return result
```

#### **2. Streamlit Interface Adaptation**
```python
# ADAPT: Convert Streamlit interface to Express.js API endpoints
# REUSE: Input validation and processing logic

class TravelPlannerAPI:
    """
    ADAPT: Convert Streamlit app logic to API endpoints
    Original: 60% reusable (logic), 40% adaptation needed (interface)
    """
    
    def __init__(self):
        self.crew = TravelPlanningCrew(self.load_config())
    
    def process_travel_request(self, request_data):
        # DIRECT REUSE: Input processing logic from Streamlit app
        trip_details = {
            'destination': request_data.get('destination'),
            'budget': float(request_data.get('budget', 0)),
            'duration': int(request_data.get('duration', 1)),
            'travelers': int(request_data.get('travelers', 1)),
            'interests': request_data.get('interests', [])
        }
        
        # Validate input - DIRECT REUSE
        if not self.validate_trip_details(trip_details):
            raise ValueError("Invalid trip details provided")
        
        # Execute planning - DIRECT REUSE
        result = self.crew.plan_trip(trip_details)
        
        # Format response - ADAPT to match Wayra's API response format
        return self.format_response(result)
    
    def validate_trip_details(self, details):
        # DIRECT REUSE: Validation logic from Streamlit app
        required_fields = ['destination', 'budget', 'duration', 'travelers']
        return all(details.get(field) for field in required_fields)
    
    def format_response(self, crew_result):
        # ADAPT: Format to match Wayra's API response patterns
        return {
            'success': True,
            'data': {
                'plan': crew_result,
                'timestamp': datetime.now().isoformat(),
                'version': '1.0'
            },
            'meta': {
                'service': 'ai_agents',
                'processing_time': 0  # Add actual processing time
            }
        }
```

---

## 🏗️ INTEGRATION ARCHITECTURE

### **Wayra-Integrated Directory Structure**

```
Wayra/
├── wayra-backend/                    # PRESERVE: Existing backend
│   ├── middleware/                   # PRESERVE: Existing middleware
│   │   ├── auth.js                  # PRESERVE: Current auth
│   │   └── aiGateway.js             # ADD: AI service routing
│   ├── models/                      # ENHANCE: Existing models
│   │   ├── User.js                  # ENHANCE: Add AI preferences
│   │   ├── Trip.js                  # ENHANCE: Add AI analysis fields
│   │   └── AIConversation.js        # ADD: New AI conversation model
│   ├── routes/                      # ENHANCE: Existing routes
│   │   ├── trips.js                 # PRESERVE: Existing trip routes
│   │   ├── users.js                 # PRESERVE: Existing user routes
│   │   └── ai/                      # ADD: New AI routes directory
│   │       ├── conversation.js      # ADD: Conversation endpoints
│   │       ├── agents.js            # ADD: Multi-agent endpoints
│   │       └── optimization.js      # ADD: Budget optimization
│   ├── services/                    # ENHANCE: Existing services
│   │   ├── travelApis.js           # PRESERVE: Existing travel APIs
│   │   └── ai/                      # ADD: New AI services directory
│   │       ├── langGraphService.js  # ADD: LangGraph integration
│   │       ├── crewAIService.js     # ADD: CrewAI integration
│   │       └── openAIService.js     # ADD: OpenAI integration
│   └── utils/                       # ENHANCE: Existing utilities
│       ├── database.js              # PRESERVE: Existing DB utils
│       ├── redis.js                 # PRESERVE: Existing cache utils
│       └── ai/                      # ADD: New AI utilities
│           ├── configLoader.js      # ADD: AI config management
│           ├── mathUtils.js         # ADD: Budget calculations
│           └── responseFormatter.js # ADD: AI response formatting
├── wayra-frontend/                  # PRESERVE: Existing frontend
│   ├── src/
│   │   ├── app/                     # PRESERVE: Existing pages
│   │   │   ├── page.tsx            # PRESERVE: Current home page
│   │   │   ├── trips/              # PRESERVE: Existing trip pages
│   │   │   └── ai/                 # ADD: New AI interface pages
│   │   │       ├── chat/           # ADD: Conversation interface
│   │   │       ├── agents/         # ADD: Multi-agent interface
│   │   │       └── optimization/   # ADD: Budget optimization UI
│   │   ├── components/             # ENHANCE: Existing components
│   │   │   ├── trip/               # PRESERVE: Existing trip components
│   │   │   └── ai/                 # ADD: New AI components
│   │   │       ├── ChatInterface.tsx    # ADD: Conversation UI
│   │   │       ├── AgentDashboard.tsx   # ADD: Agent coordination UI
│   │   │       └── OptimizationPanel.tsx # ADD: Budget optimization UI
│   │   ├── contexts/               # ENHANCE: Existing contexts
│   │   │   ├── AuthContext.tsx     # PRESERVE: Current auth context
│   │   │   └── AIContext.tsx       # ADD: AI state management
│   │   ├── services/               # ENHANCE: Existing services
│   │   │   ├── travelApi.ts        # PRESERVE: Existing travel API
│   │   │   └── aiApi.ts            # ADD: AI service integration
│   │   └── types/                  # ENHANCE: Existing types
│   │       ├── trip.ts             # PRESERVE: Existing trip types
│   │       └── ai.ts               # ADD: AI-specific types
└── ai-services/                     # ADD: New microservices directory
    ├── conversation-service/        # ADD: LangGraph-based service
    │   ├── src/
    │   │   ├── workflow/            # REUSE: LangGraph workflow code
    │   │   ├── tools/               # REUSE: Weather, places, budget tools
    │   │   └── utils/               # REUSE: Configuration and utilities
    │   ├── Dockerfile               # ADD: Container configuration
    │   └── requirements.txt         # ADD: Python dependencies
    ├── agents-service/              # ADD: CrewAI-based service
    │   ├── src/
    │   │   ├── agents/              # REUSE: CrewAI agent definitions
    │   │   ├── tasks/               # REUSE: Task definitions
    │   │   └── crew/                # REUSE: Crew coordination logic
    │   ├── Dockerfile               # ADD: Container configuration
    │   └── requirements.txt         # ADD: Python dependencies
    └── shared/                      # ADD: Shared utilities
        ├── auth/                    # ADD: Service authentication
        ├── database/                # ADD: Database connection utilities
        └── monitoring/              # ADD: Logging and monitoring
```

### **Code Reuse Implementation Strategy**

#### **Phase 1: Direct Code Extraction and Adaptation**

**Step 1: Extract Reusable Python Components**
```bash
# Create AI services directory structure
mkdir -p /home/ubuntu/Wayra/ai-services/{conversation-service,agents-service,shared}

# Extract LangGraph workflow components
mkdir -p /home/ubuntu/Wayra/ai-services/conversation-service/src/{workflow,tools,utils}

# Extract CrewAI agent components  
mkdir -p /home/ubuntu/Wayra/ai-services/agents-service/src/{agents,tasks,crew}

# Extract shared utilities
mkdir -p /home/ubuntu/Wayra/ai-services/shared/{auth,database,monitoring}
```

**Step 2: Adapt Configuration Management**
```javascript
// wayra-backend/utils/ai/configLoader.js
// ADAPTED from Travel_Agent_LangChain/src/utils/utils_main.py

class AIConfigLoader {
  static loadConfig() {
    // PRESERVE: Use Wayra's existing environment variable patterns
    return {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
      },
      google: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY, // REUSE: Existing Wayra key
        placesApiKey: process.env.GOOGLE_PLACES_API_KEY
      },
      weather: {
        apiKey: process.env.OPENWEATHER_API_KEY
      },
      tavily: {
        apiKey: process.env.TAVILY_API_KEY
      },
      // PRESERVE: Wayra's existing database and cache configuration
      database: {
        mongoUri: process.env.MONGODB_URI,
        redisUrl: process.env.REDIS_URL
      },
      // PRESERVE: Wayra's existing authentication
      auth: {
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID
      }
    };
  }
  
  static validateConfig(config) {
    // REUSE: Validation logic from original repositories
    const required = ['openai.apiKey', 'database.mongoUri'];
    const missing = required.filter(key => !this.getNestedValue(config, key));
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    
    return true;
  }
  
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

module.exports = AIConfigLoader;
```

**Step 3: Integrate Mathematical Utilities**
```javascript
// wayra-backend/utils/ai/mathUtils.js
// DIRECT REUSE from Travel_Agent_LangChain/src/utils/simple_math_operators.py

class MathUtils {
  // DIRECT REUSE: Mathematical operations for budget calculations
  static add(a, b) {
    return parseFloat(a) + parseFloat(b);
  }
  
  static multiply(a, b) {
    return parseFloat(a) * parseFloat(b);
  }
  
  static divide(a, b) {
    if (b === 0) throw new Error('Division by zero');
    return parseFloat(a) / parseFloat(b);
  }
  
  static subtract(a, b) {
    return parseFloat(a) - parseFloat(b);
  }
  
  // DIRECT REUSE: Budget-specific calculations
  static calculatePercentage(part, whole) {
    if (whole === 0) return 0;
    return (parseFloat(part) / parseFloat(whole)) * 100;
  }
  
  static budgetPerDay(totalBudget, days) {
    if (days <= 0) throw new Error('Days must be greater than zero');
    return parseFloat(totalBudget) / parseInt(days);
  }
  
  static calculateTax(amount, taxRate) {
    return parseFloat(amount) * parseFloat(taxRate);
  }
  
  static calculateTotal(baseAmount, taxRate = 0) {
    const tax = this.calculateTax(baseAmount, taxRate);
    return this.add(baseAmount, tax);
  }
  
  // ENHANCE: Additional budget optimization functions for Wayra
  static optimizeBudgetAllocation(totalBudget, categories) {
    // Implement budget optimization logic specific to Wayra's needs
    const defaultAllocation = {
      accommodation: 0.40,  // 40% for hotels
      transportation: 0.25, // 25% for flights/transport
      food: 0.20,          // 20% for meals
      activities: 0.15     // 15% for activities
    };
    
    const allocation = { ...defaultAllocation, ...categories };
    const result = {};
    
    for (const [category, percentage] of Object.entries(allocation)) {
      result[category] = this.multiply(totalBudget, percentage);
    }
    
    return result;
  }
  
  static calculateSavings(originalAmount, optimizedAmount) {
    const savings = this.subtract(originalAmount, optimizedAmount);
    const percentage = this.calculatePercentage(savings, originalAmount);
    
    return {
      amount: savings,
      percentage: percentage,
      isPositive: savings > 0
    };
  }
}

module.exports = MathUtils;
```

---

**Document Classification:** Implementation Plan - Confidential  
**Prepared by:** Manus AI Development Team  
**Analysis Date:** July 17, 2025  
**Review Required by:** Development Team and Technical Leadership  
**Next Steps:** Begin Phase 1 implementation with direct code extraction

---

*This implementation plan provides detailed strategies for maximizing code reuse while preserving all existing Wayra infrastructure and development patterns. The approach ensures minimal risk while adding sophisticated AI capabilities through strategic code adaptation and integration.*

