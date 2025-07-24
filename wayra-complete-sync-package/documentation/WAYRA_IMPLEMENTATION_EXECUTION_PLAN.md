# 🚀 WAYRA AI INTEGRATION: IMPLEMENTATION EXECUTION PLAN
## Detailed Technical Implementation Guide with Specific Steps and Code Examples

**Implementation Execution Document**  
**Platform:** Wayra AI-Enhanced Travel Planning Platform  
**Integration Scope:** Three-Repository AI Enhancement with Existing Architecture Alignment  
**Execution Focus:** Step-by-Step Technical Implementation with Code Examples  
**Document Date:** July 17, 2025

---

## 📋 EXECUTIVE IMPLEMENTATION SUMMARY

### **Implementation Readiness Assessment**

The comprehensive analysis of Wayra's existing codebase confirms exceptional readiness for AI integration through well-structured architecture, modern technology stack, and clear separation of concerns that provide ideal foundation for sophisticated AI enhancement. The existing Node.js/Express backend with MongoDB and Redis infrastructure provides scalable foundation for AI microservice integration, while the Next.js/React frontend provides modern interface development capabilities for AI feature presentation.

The current directory structure demonstrates mature development practices with clear organization patterns that can be extended seamlessly with AI capabilities while maintaining existing functionality and development workflows. The authentication system, data models, API structure, and user interface components provide comprehensive foundation that requires minimal modification while supporting sophisticated AI integration.

The technology stack compatibility analysis confirms excellent alignment between existing infrastructure and AI integration requirements, with Node.js providing effective coordination with Python AI services, MongoDB supporting AI data storage requirements, Redis enabling AI result caching, and React supporting sophisticated AI interface development. The compatibility ensures that AI integration enhances rather than disrupts existing architecture while providing transformational capabilities.

### **Strategic Implementation Approach**

The implementation strategy follows incremental integration principles that maximize code reuse from the three analyzed repositories while maintaining Wayra's existing architecture patterns and user experience consistency. The approach prioritizes immediate value delivery through foundational AI capabilities while building toward comprehensive AI enhancement that establishes market leadership.

The code reuse strategy leverages approximately 75-85% of functionality from Travel_Agent_LangChain, TravelPlanner-CrewAi-Agents-Streamlit, and travel-planner-ai repositories through strategic adaptation and integration with Wayra's existing codebase. The reuse approach minimizes development effort while ensuring that AI capabilities align with Wayra's budget-focused value proposition and user experience standards.

The integration methodology maintains existing Wayra functionality while adding AI capabilities through microservice architecture that enables independent development, testing, and deployment of AI features while preserving system stability and user experience quality. The methodology ensures that AI enhancement provides immediate value while building foundation for advanced capabilities and market differentiation.

---

## 🏗️ DETAILED IMPLEMENTATION ROADMAP

### **Phase 1: Foundation Infrastructure Setup (Weeks 1-6)**

The foundation phase establishes core infrastructure and basic AI capabilities while maintaining existing Wayra functionality and user experience patterns. The phase focuses on infrastructure deployment, basic conversation capabilities, and initial optimization features that provide immediate value while building foundation for advanced AI integration.

**Week 1-2: Infrastructure Preparation and Environment Setup**

The initial infrastructure setup includes development environment preparation, AI service deployment architecture, and integration testing framework establishment that provide foundation for AI development while maintaining existing development workflows and deployment processes.

The development environment setup includes Python environment configuration for AI services, Docker containerization for microservice deployment, and API gateway configuration for service coordination. The environment preparation ensures that development teams can work efficiently on AI integration while maintaining existing development tools and processes.

```bash
# Development Environment Setup Script
#!/bin/bash

# Create AI services directory structure
mkdir -p wayra-ai-services/{conversation-service,multi-agent-service,optimization-service,collaboration-service,shared}

# Setup Python virtual environments for each service
cd wayra-ai-services/conversation-service
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn langchain langgraph openai python-dotenv

cd ../multi-agent-service
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn crewai openai python-dotenv

cd ../optimization-service
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn scikit-learn pandas numpy python-dotenv

cd ../collaboration-service
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn websockets redis python-dotenv

# Setup Docker configuration
cat > docker-compose.ai.yml << EOF
version: '3.8'
services:
  conversation-service:
    build: ./conversation-service
    ports:
      - "8001:8000"
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - MONGODB_URI=\${MONGODB_URI}
      - REDIS_URL=\${REDIS_URL}
    depends_on:
      - redis
      - mongodb

  multi-agent-service:
    build: ./multi-agent-service
    ports:
      - "8002:8000"
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - MONGODB_URI=\${MONGODB_URI}
      - REDIS_URL=\${REDIS_URL}
    depends_on:
      - redis
      - mongodb

  optimization-service:
    build: ./optimization-service
    ports:
      - "8003:8000"
    environment:
      - MONGODB_URI=\${MONGODB_URI}
      - REDIS_URL=\${REDIS_URL}
    depends_on:
      - redis
      - mongodb

  collaboration-service:
    build: ./collaboration-service
    ports:
      - "8004:8000"
    environment:
      - MONGODB_URI=\${MONGODB_URI}
      - REDIS_URL=\${REDIS_URL}
    depends_on:
      - redis
      - mongodb

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=wayra
      - MONGO_INITDB_ROOT_PASSWORD=wayra_password
EOF
```

The API gateway configuration includes request routing, authentication integration, and load balancing setup that provide unified access to AI services while maintaining existing API patterns and security requirements.

```javascript
// wayra-backend/middleware/aiGateway.js
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const auth = require('./auth');

const aiGateway = express.Router();

// AI service endpoints configuration
const AI_SERVICES = {
  conversation: 'http://localhost:8001',
  agents: 'http://localhost:8002',
  optimization: 'http://localhost:8003',
  collaboration: 'http://localhost:8004'
};

// Conversation service proxy
aiGateway.use('/api/ai/conversation', 
  auth.verifyToken,
  httpProxy({
    target: AI_SERVICES.conversation,
    changeOrigin: true,
    pathRewrite: {
      '^/api/ai/conversation': '/api/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add user context to AI service requests
      proxyReq.setHeader('X-User-ID', req.user.uid);
      proxyReq.setHeader('X-User-Email', req.user.email);
    }
  })
);

// Multi-agent service proxy
aiGateway.use('/api/ai/agents',
  auth.verifyToken,
  httpProxy({
    target: AI_SERVICES.agents,
    changeOrigin: true,
    pathRewrite: {
      '^/api/ai/agents': '/api/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-User-ID', req.user.uid);
      proxyReq.setHeader('X-User-Email', req.user.email);
    }
  })
);

// Optimization service proxy
aiGateway.use('/api/ai/optimization',
  auth.verifyToken,
  httpProxy({
    target: AI_SERVICES.optimization,
    changeOrigin: true,
    pathRewrite: {
      '^/api/ai/optimization': '/api/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-User-ID', req.user.uid);
      proxyReq.setHeader('X-User-Email', req.user.email);
    }
  })
);

// Collaboration service proxy
aiGateway.use('/api/ai/collaboration',
  auth.verifyToken,
  httpProxy({
    target: AI_SERVICES.collaboration,
    changeOrigin: true,
    pathRewrite: {
      '^/api/ai/collaboration': '/api/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-User-ID', req.user.uid);
      proxyReq.setHeader('X-User-Email', req.user.email);
    }
  })
);

module.exports = aiGateway;
```

**Week 3-4: Basic Conversation Service Implementation**

The conversation service implementation includes LangGraph workflow deployment, basic tool integration, and conversation management capabilities that provide natural language planning assistance while maintaining integration with existing Wayra trip planning workflows.

```python
# wayra-ai-services/conversation-service/src/main.py
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

from agents.graph_workflow import ConversationWorkflow
from utils.config_loader import ConfigLoader
from utils.model_loader import ModelLoader

load_dotenv()

app = FastAPI(title="Wayra Conversation Service", version="1.0.0")

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Wayra frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize conversation workflow
config_loader = ConfigLoader()
model_loader = ModelLoader()
conversation_workflow = ConversationWorkflow(config_loader, model_loader)

class ConversationRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    trip_context: Optional[Dict[str, Any]] = None
    user_preferences: Optional[Dict[str, Any]] = None

class ConversationResponse(BaseModel):
    response: str
    conversation_id: str
    suggestions: List[str]
    trip_updates: Optional[Dict[str, Any]] = None

@app.post("/api/v1/conversation", response_model=ConversationResponse)
async def process_conversation(
    request: ConversationRequest,
    x_user_id: str = Header(...),
    x_user_email: str = Header(...)
):
    """Process conversational AI request with budget optimization focus"""
    try:
        # Add user context to conversation
        user_context = {
            "user_id": x_user_id,
            "user_email": x_user_email,
            "preferences": request.user_preferences or {}
        }
        
        # Process conversation through LangGraph workflow
        result = await conversation_workflow.process_message(
            message=request.message,
            conversation_id=request.conversation_id,
            trip_context=request.trip_context,
            user_context=user_context
        )
        
        return ConversationResponse(
            response=result["response"],
            conversation_id=result["conversation_id"],
            suggestions=result["suggestions"],
            trip_updates=result.get("trip_updates")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/conversation/{conversation_id}/history")
async def get_conversation_history(
    conversation_id: str,
    x_user_id: str = Header(...)
):
    """Retrieve conversation history for user"""
    try:
        history = await conversation_workflow.get_conversation_history(
            conversation_id=conversation_id,
            user_id=x_user_id
        )
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "conversation-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

```python
# wayra-ai-services/conversation-service/src/agents/graph_workflow.py
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage
from typing import Dict, List, Any, Optional
import json
import uuid
from datetime import datetime

from tools.budget_calculator import BudgetCalculatorTool
from tools.weather_tool import WeatherTool
from tools.place_explorer import PlaceExplorerTool
from utils.conversation_state import ConversationState

class ConversationWorkflow:
    def __init__(self, config_loader, model_loader):
        self.config = config_loader.load_config()
        self.llm = model_loader.load_model()
        self.tools = self._initialize_tools()
        self.graph = self._create_graph()
        
    def _initialize_tools(self):
        """Initialize conversation tools with budget optimization focus"""
        return {
            "budget_calculator": BudgetCalculatorTool(),
            "weather_tool": WeatherTool(),
            "place_explorer": PlaceExplorerTool()
        }
    
    def _create_graph(self):
        """Create LangGraph workflow for budget-focused conversation"""
        workflow = StateGraph(ConversationState)
        
        # Add nodes for conversation flow
        workflow.add_node("analyze_intent", self._analyze_intent)
        workflow.add_node("budget_analysis", self._budget_analysis)
        workflow.add_node("destination_research", self._destination_research)
        workflow.add_node("optimization_suggestions", self._optimization_suggestions)
        workflow.add_node("generate_response", self._generate_response)
        
        # Define conversation flow
        workflow.set_entry_point("analyze_intent")
        
        workflow.add_conditional_edges(
            "analyze_intent",
            self._route_conversation,
            {
                "budget": "budget_analysis",
                "destination": "destination_research",
                "optimization": "optimization_suggestions",
                "general": "generate_response"
            }
        )
        
        workflow.add_edge("budget_analysis", "generate_response")
        workflow.add_edge("destination_research", "generate_response")
        workflow.add_edge("optimization_suggestions", "generate_response")
        workflow.add_edge("generate_response", END)
        
        return workflow.compile()
    
    async def process_message(self, message: str, conversation_id: Optional[str] = None, 
                            trip_context: Optional[Dict] = None, user_context: Optional[Dict] = None):
        """Process conversation message through LangGraph workflow"""
        
        # Create or retrieve conversation
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Initialize conversation state
        state = ConversationState(
            conversation_id=conversation_id,
            user_message=message,
            trip_context=trip_context or {},
            user_context=user_context or {},
            conversation_history=[],
            analysis_results={},
            response="",
            suggestions=[],
            trip_updates={}
        )
        
        # Process through workflow
        result = await self.graph.ainvoke(state)
        
        return {
            "response": result["response"],
            "conversation_id": conversation_id,
            "suggestions": result["suggestions"],
            "trip_updates": result.get("trip_updates", {})
        }
    
    def _analyze_intent(self, state: ConversationState) -> ConversationState:
        """Analyze user intent with budget optimization focus"""
        
        budget_keywords = ["budget", "cost", "price", "expensive", "cheap", "afford", "money"]
        destination_keywords = ["destination", "place", "city", "country", "visit", "travel"]
        optimization_keywords = ["optimize", "best", "recommend", "suggest", "improve"]
        
        message_lower = state.user_message.lower()
        
        if any(keyword in message_lower for keyword in budget_keywords):
            state.intent = "budget"
        elif any(keyword in message_lower for keyword in destination_keywords):
            state.intent = "destination"
        elif any(keyword in message_lower for keyword in optimization_keywords):
            state.intent = "optimization"
        else:
            state.intent = "general"
            
        return state
    
    def _route_conversation(self, state: ConversationState) -> str:
        """Route conversation based on analyzed intent"""
        return state.intent
    
    def _budget_analysis(self, state: ConversationState) -> ConversationState:
        """Perform budget analysis using budget calculator tool"""
        
        budget_tool = self.tools["budget_calculator"]
        
        # Extract budget information from message and context
        budget_info = {
            "total_budget": state.trip_context.get("budget", 0),
            "duration": state.trip_context.get("duration", 7),
            "travelers": state.trip_context.get("travelers", 2),
            "destination": state.trip_context.get("destination", "")
        }
        
        # Perform budget analysis
        analysis = budget_tool.analyze_budget(budget_info)
        state.analysis_results["budget"] = analysis
        
        return state
    
    def _destination_research(self, state: ConversationState) -> ConversationState:
        """Perform destination research using place explorer tool"""
        
        place_tool = self.tools["place_explorer"]
        weather_tool = self.tools["weather_tool"]
        
        destination = state.trip_context.get("destination", "")
        if destination:
            # Research destination with budget focus
            places = place_tool.find_budget_attractions(destination)
            weather = weather_tool.get_weather_forecast(destination)
            
            state.analysis_results["destination"] = {
                "attractions": places,
                "weather": weather
            }
        
        return state
    
    def _optimization_suggestions(self, state: ConversationState) -> ConversationState:
        """Generate optimization suggestions based on trip context"""
        
        suggestions = []
        
        # Budget optimization suggestions
        if state.trip_context.get("budget"):
            budget = state.trip_context["budget"]
            duration = state.trip_context.get("duration", 7)
            daily_budget = budget / duration
            
            if daily_budget < 100:
                suggestions.append("Consider staying in hostels or budget accommodations")
                suggestions.append("Look for free walking tours and public attractions")
                suggestions.append("Use public transportation instead of taxis")
            elif daily_budget > 300:
                suggestions.append("You have room for premium experiences")
                suggestions.append("Consider upgrading accommodations for better location")
                suggestions.append("Budget allows for guided tours and unique experiences")
        
        state.analysis_results["optimization"] = {"suggestions": suggestions}
        
        return state
    
    def _generate_response(self, state: ConversationState) -> ConversationState:
        """Generate final response based on analysis results"""
        
        # Create context-aware prompt
        prompt = f"""
        You are Wayra's AI travel assistant, specialized in budget-conscious travel planning.
        
        User message: {state.user_message}
        Trip context: {json.dumps(state.trip_context, indent=2)}
        Analysis results: {json.dumps(state.analysis_results, indent=2)}
        
        Provide a helpful, budget-focused response that:
        1. Addresses the user's specific question
        2. Includes relevant budget optimization advice
        3. Suggests practical next steps
        4. Maintains Wayra's friendly, helpful tone
        
        Focus on budget optimization and practical travel advice.
        """
        
        # Generate response using LLM
        response = self.llm.invoke([HumanMessage(content=prompt)])
        state.response = response.content
        
        # Generate suggestions based on analysis
        suggestions = []
        if "budget" in state.analysis_results:
            suggestions.extend(state.analysis_results["budget"].get("suggestions", []))
        if "optimization" in state.analysis_results:
            suggestions.extend(state.analysis_results["optimization"].get("suggestions", []))
        
        state.suggestions = suggestions[:3]  # Limit to top 3 suggestions
        
        return state
```

**Week 5-6: Basic Optimization Service Implementation**

The optimization service implementation includes budget analysis algorithms, price prediction capabilities, and recommendation generation that enhance existing Wayra budget management while providing intelligent guidance and strategic insights.

```python
# wayra-ai-services/optimization-service/src/main.py
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

from algorithms.budget_optimizer import BudgetOptimizer
from algorithms.price_predictor import PricePredictor
from algorithms.recommendation_engine import RecommendationEngine

load_dotenv()

app = FastAPI(title="Wayra Optimization Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize optimization algorithms
budget_optimizer = BudgetOptimizer()
price_predictor = PricePredictor()
recommendation_engine = RecommendationEngine()

class BudgetOptimizationRequest(BaseModel):
    total_budget: float
    duration: int
    travelers: int
    destination: str
    preferences: Optional[Dict[str, Any]] = None
    current_allocation: Optional[Dict[str, float]] = None

class BudgetOptimizationResponse(BaseModel):
    optimized_allocation: Dict[str, float]
    savings_opportunities: List[Dict[str, Any]]
    recommendations: List[str]
    confidence_score: float

@app.post("/api/v1/optimize/budget", response_model=BudgetOptimizationResponse)
async def optimize_budget(
    request: BudgetOptimizationRequest,
    x_user_id: str = Header(...),
    x_user_email: str = Header(...)
):
    """Optimize budget allocation with Wayra's budget-first approach"""
    try:
        # Perform budget optimization
        optimization_result = budget_optimizer.optimize_allocation(
            total_budget=request.total_budget,
            duration=request.duration,
            travelers=request.travelers,
            destination=request.destination,
            preferences=request.preferences or {},
            current_allocation=request.current_allocation or {}
        )
        
        # Generate recommendations
        recommendations = recommendation_engine.generate_budget_recommendations(
            optimization_result=optimization_result,
            user_preferences=request.preferences or {}
        )
        
        return BudgetOptimizationResponse(
            optimized_allocation=optimization_result["allocation"],
            savings_opportunities=optimization_result["savings"],
            recommendations=recommendations,
            confidence_score=optimization_result["confidence"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PricePredictionRequest(BaseModel):
    destination: str
    travel_dates: Dict[str, str]  # start_date, end_date
    travelers: int
    accommodation_type: str
    flight_preferences: Optional[Dict[str, Any]] = None

class PricePredictionResponse(BaseModel):
    predicted_prices: Dict[str, Dict[str, float]]  # category -> price range
    optimal_booking_window: Dict[str, str]
    price_trends: Dict[str, List[float]]
    confidence_intervals: Dict[str, Dict[str, float]]

@app.post("/api/v1/predict/prices", response_model=PricePredictionResponse)
async def predict_prices(
    request: PricePredictionRequest,
    x_user_id: str = Header(...),
    x_user_email: str = Header(...)
):
    """Predict travel prices with optimal booking timing"""
    try:
        # Perform price prediction
        prediction_result = price_predictor.predict_travel_prices(
            destination=request.destination,
            travel_dates=request.travel_dates,
            travelers=request.travelers,
            accommodation_type=request.accommodation_type,
            flight_preferences=request.flight_preferences or {}
        )
        
        return PricePredictionResponse(
            predicted_prices=prediction_result["prices"],
            optimal_booking_window=prediction_result["booking_window"],
            price_trends=prediction_result["trends"],
            confidence_intervals=prediction_result["confidence_intervals"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "optimization-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

```python
# wayra-ai-services/optimization-service/src/algorithms/budget_optimizer.py
import numpy as np
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
import json

@dataclass
class BudgetCategory:
    name: str
    min_percentage: float
    max_percentage: float
    priority: int
    flexibility: float

class BudgetOptimizer:
    def __init__(self):
        self.categories = self._initialize_categories()
        
    def _initialize_categories(self) -> Dict[str, BudgetCategory]:
        """Initialize budget categories with Wayra's optimization focus"""
        return {
            "accommodation": BudgetCategory("accommodation", 0.25, 0.45, 1, 0.3),
            "transportation": BudgetCategory("transportation", 0.15, 0.35, 2, 0.2),
            "food": BudgetCategory("food", 0.15, 0.30, 3, 0.4),
            "activities": BudgetCategory("activities", 0.10, 0.25, 4, 0.5),
            "shopping": BudgetCategory("shopping", 0.05, 0.15, 5, 0.8),
            "emergency": BudgetCategory("emergency", 0.05, 0.10, 1, 0.1)
        }
    
    def optimize_allocation(self, total_budget: float, duration: int, travelers: int,
                          destination: str, preferences: Dict[str, Any],
                          current_allocation: Dict[str, float]) -> Dict[str, Any]:
        """Optimize budget allocation using Wayra's budget-first methodology"""
        
        # Calculate base allocation using destination-specific factors
        base_allocation = self._calculate_base_allocation(
            total_budget, duration, travelers, destination
        )
        
        # Apply user preferences
        preference_adjusted = self._apply_preferences(base_allocation, preferences)
        
        # Optimize for savings opportunities
        optimized_allocation = self._optimize_for_savings(
            preference_adjusted, destination, duration
        )
        
        # Identify savings opportunities
        savings_opportunities = self._identify_savings(
            current_allocation, optimized_allocation, total_budget
        )
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence(
            optimized_allocation, destination, duration
        )
        
        return {
            "allocation": optimized_allocation,
            "savings": savings_opportunities,
            "confidence": confidence_score,
            "daily_budget": {
                category: amount / duration 
                for category, amount in optimized_allocation.items()
            }
        }
    
    def _calculate_base_allocation(self, total_budget: float, duration: int, 
                                 travelers: int, destination: str) -> Dict[str, float]:
        """Calculate base budget allocation based on destination factors"""
        
        # Destination cost factors (simplified - would use real data)
        destination_factors = {
            "accommodation": self._get_accommodation_factor(destination),
            "transportation": self._get_transportation_factor(destination),
            "food": self._get_food_factor(destination),
            "activities": self._get_activities_factor(destination),
            "shopping": 0.1,
            "emergency": 0.08
        }
        
        # Normalize factors
        total_factor = sum(destination_factors.values())
        normalized_factors = {
            category: factor / total_factor 
            for category, factor in destination_factors.items()
        }
        
        # Apply to total budget
        allocation = {
            category: total_budget * factor 
            for category, factor in normalized_factors.items()
        }
        
        return allocation
    
    def _get_accommodation_factor(self, destination: str) -> float:
        """Get accommodation cost factor for destination"""
        # Simplified destination mapping - would use real data
        high_cost_destinations = ["london", "paris", "tokyo", "new york", "zurich"]
        medium_cost_destinations = ["barcelona", "prague", "budapest", "lisbon"]
        
        destination_lower = destination.lower()
        
        if any(city in destination_lower for city in high_cost_destinations):
            return 0.40  # Higher accommodation costs
        elif any(city in destination_lower for city in medium_cost_destinations):
            return 0.32  # Medium accommodation costs
        else:
            return 0.28  # Lower accommodation costs
    
    def _get_transportation_factor(self, destination: str) -> float:
        """Get transportation cost factor for destination"""
        # Consider distance, local transport costs, etc.
        return 0.25  # Simplified
    
    def _get_food_factor(self, destination: str) -> float:
        """Get food cost factor for destination"""
        # Consider local food costs, dining culture, etc.
        return 0.20  # Simplified
    
    def _get_activities_factor(self, destination: str) -> float:
        """Get activities cost factor for destination"""
        # Consider attraction costs, entertainment prices, etc.
        return 0.15  # Simplified
    
    def _apply_preferences(self, base_allocation: Dict[str, float], 
                          preferences: Dict[str, Any]) -> Dict[str, float]:
        """Apply user preferences to budget allocation"""
        
        adjusted_allocation = base_allocation.copy()
        
        # Apply preference weights
        if "accommodation_priority" in preferences:
            priority = preferences["accommodation_priority"]  # 1-5 scale
            adjustment = (priority - 3) * 0.05  # ±10% adjustment
            adjusted_allocation["accommodation"] *= (1 + adjustment)
        
        if "food_priority" in preferences:
            priority = preferences["food_priority"]
            adjustment = (priority - 3) * 0.03  # ±6% adjustment
            adjusted_allocation["food"] *= (1 + adjustment)
        
        if "activities_priority" in preferences:
            priority = preferences["activities_priority"]
            adjustment = (priority - 3) * 0.04  # ±8% adjustment
            adjusted_allocation["activities"] *= (1 + adjustment)
        
        # Normalize to maintain total budget
        total = sum(adjusted_allocation.values())
        target_total = sum(base_allocation.values())
        normalization_factor = target_total / total
        
        adjusted_allocation = {
            category: amount * normalization_factor
            for category, amount in adjusted_allocation.items()
        }
        
        return adjusted_allocation
    
    def _optimize_for_savings(self, allocation: Dict[str, float], 
                            destination: str, duration: int) -> Dict[str, float]:
        """Optimize allocation for maximum savings opportunities"""
        
        optimized = allocation.copy()
        
        # Apply Wayra's savings strategies
        
        # Accommodation optimization
        if duration >= 7:
            # Longer stays often get better rates
            optimized["accommodation"] *= 0.95
            optimized["activities"] += allocation["accommodation"] * 0.05
        
        # Transportation optimization
        if duration >= 14:
            # Longer trips benefit from local transport passes
            optimized["transportation"] *= 0.90
            optimized["food"] += allocation["transportation"] * 0.10
        
        # Food optimization for budget travelers
        optimized["food"] *= 0.85  # Encourage local, budget-friendly options
        optimized["activities"] += allocation["food"] * 0.15
        
        return optimized
    
    def _identify_savings(self, current: Dict[str, float], 
                         optimized: Dict[str, float], 
                         total_budget: float) -> List[Dict[str, Any]]:
        """Identify specific savings opportunities"""
        
        savings = []
        
        for category in optimized.keys():
            current_amount = current.get(category, 0)
            optimized_amount = optimized[category]
            
            if current_amount > optimized_amount:
                savings_amount = current_amount - optimized_amount
                savings_percentage = (savings_amount / current_amount) * 100
                
                savings.append({
                    "category": category,
                    "current_amount": current_amount,
                    "optimized_amount": optimized_amount,
                    "savings_amount": savings_amount,
                    "savings_percentage": savings_percentage,
                    "recommendations": self._get_category_savings_tips(category)
                })
        
        return sorted(savings, key=lambda x: x["savings_amount"], reverse=True)
    
    def _get_category_savings_tips(self, category: str) -> List[str]:
        """Get savings tips for specific category"""
        
        tips = {
            "accommodation": [
                "Consider hostels or budget hotels",
                "Book accommodations outside city center",
                "Look for properties with kitchen facilities",
                "Check for longer stay discounts"
            ],
            "transportation": [
                "Use public transportation instead of taxis",
                "Book flights in advance or look for deals",
                "Consider budget airlines for short flights",
                "Walk or bike when possible"
            ],
            "food": [
                "Eat at local markets and street food",
                "Cook some meals if accommodation has kitchen",
                "Look for lunch specials and happy hours",
                "Avoid tourist area restaurants"
            ],
            "activities": [
                "Look for free walking tours",
                "Visit free museums and attractions",
                "Check for city tourism cards",
                "Enjoy free outdoor activities"
            ],
            "shopping": [
                "Set a strict shopping budget",
                "Buy souvenirs at local markets",
                "Avoid airport shopping",
                "Focus on experiences over things"
            ]
        }
        
        return tips.get(category, [])
    
    def _calculate_confidence(self, allocation: Dict[str, float], 
                            destination: str, duration: int) -> float:
        """Calculate confidence score for optimization"""
        
        confidence_factors = []
        
        # Destination data availability
        confidence_factors.append(0.8)  # Simplified
        
        # Duration appropriateness
        if 3 <= duration <= 21:
            confidence_factors.append(0.9)
        else:
            confidence_factors.append(0.7)
        
        # Allocation balance
        allocation_values = list(allocation.values())
        total = sum(allocation_values)
        percentages = [v/total for v in allocation_values]
        
        # Check if allocation is reasonable
        if 0.2 <= percentages[0] <= 0.5:  # accommodation
            confidence_factors.append(0.9)
        else:
            confidence_factors.append(0.7)
        
        return np.mean(confidence_factors)
```

### **Phase 2: Multi-Agent Integration (Weeks 7-12)**

The second phase introduces sophisticated multi-agent capabilities and enhanced collaboration features that expand AI processing sophistication while maintaining integration with existing Wayra workflows and user experience patterns.

**Week 7-8: Multi-Agent Service Implementation**

The multi-agent service implementation includes specialized agent deployment, coordination workflow development, and result synthesis capabilities that provide comprehensive planning assistance while maintaining integration with existing trip management and user preferences.

```python
# wayra-ai-services/multi-agent-service/src/main.py
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import uuid
from datetime import datetime

from agents.budget_analyst import BudgetAnalystAgent
from agents.destination_researcher import DestinationResearcherAgent
from agents.travel_coordinator import TravelCoordinatorAgent
from crews.planning_crew import PlanningCrew

app = FastAPI(title="Wayra Multi-Agent Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents and crews
budget_analyst = BudgetAnalystAgent()
destination_researcher = DestinationResearcherAgent()
travel_coordinator = TravelCoordinatorAgent()
planning_crew = PlanningCrew(budget_analyst, destination_researcher, travel_coordinator)

class AgentTaskRequest(BaseModel):
    task_type: str  # "budget_analysis", "destination_research", "travel_coordination", "full_planning"
    trip_details: Dict[str, Any]
    user_preferences: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None

class AgentTaskResponse(BaseModel):
    task_id: str
    status: str  # "started", "in_progress", "completed", "failed"
    results: Optional[Dict[str, Any]] = None
    agent_insights: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None

# Task tracking
active_tasks = {}

@app.post("/api/v1/agents/task", response_model=AgentTaskResponse)
async def create_agent_task(
    request: AgentTaskRequest,
    background_tasks: BackgroundTasks,
    x_user_id: str = Header(...),
    x_user_email: str = Header(...)
):
    """Create and execute multi-agent task"""
    try:
        task_id = str(uuid.uuid4())
        
        # Initialize task tracking
        active_tasks[task_id] = {
            "status": "started",
            "user_id": x_user_id,
            "created_at": datetime.utcnow(),
            "task_type": request.task_type,
            "results": None
        }
        
        # Execute task in background
        background_tasks.add_task(
            execute_agent_task,
            task_id=task_id,
            request=request,
            user_id=x_user_id
        )
        
        return AgentTaskResponse(
            task_id=task_id,
            status="started",
            results=None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def execute_agent_task(task_id: str, request: AgentTaskRequest, user_id: str):
    """Execute multi-agent task with coordination"""
    try:
        active_tasks[task_id]["status"] = "in_progress"
        
        if request.task_type == "budget_analysis":
            results = await budget_analyst.analyze_budget(
                trip_details=request.trip_details,
                user_preferences=request.user_preferences or {},
                constraints=request.constraints or {}
            )
        elif request.task_type == "destination_research":
            results = await destination_researcher.research_destination(
                trip_details=request.trip_details,
                user_preferences=request.user_preferences or {},
                constraints=request.constraints or {}
            )
        elif request.task_type == "travel_coordination":
            results = await travel_coordinator.coordinate_travel(
                trip_details=request.trip_details,
                user_preferences=request.user_preferences or {},
                constraints=request.constraints or {}
            )
        elif request.task_type == "full_planning":
            results = await planning_crew.execute_full_planning(
                trip_details=request.trip_details,
                user_preferences=request.user_preferences or {},
                constraints=request.constraints or {}
            )
        else:
            raise ValueError(f"Unknown task type: {request.task_type}")
        
        # Update task with results
        active_tasks[task_id].update({
            "status": "completed",
            "results": results,
            "completed_at": datetime.utcnow()
        })
        
    except Exception as e:
        active_tasks[task_id].update({
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.utcnow()
        })

@app.get("/api/v1/agents/task/{task_id}", response_model=AgentTaskResponse)
async def get_task_status(
    task_id: str,
    x_user_id: str = Header(...)
):
    """Get agent task status and results"""
    try:
        if task_id not in active_tasks:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = active_tasks[task_id]
        
        # Verify user ownership
        if task["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return AgentTaskResponse(
            task_id=task_id,
            status=task["status"],
            results=task.get("results"),
            agent_insights=task.get("results", {}).get("agent_insights", []),
            recommendations=task.get("results", {}).get("recommendations", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "multi-agent-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

```python
# wayra-ai-services/multi-agent-service/src/agents/budget_analyst.py
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from typing import Dict, List, Any
import json

class BudgetAnalystAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.1)
        self.agent = self._create_agent()
    
    def _create_agent(self) -> Agent:
        """Create specialized budget analyst agent"""
        return Agent(
            role="Budget Analyst",
            goal="Optimize travel budgets and identify cost-saving opportunities while maintaining travel quality",
            backstory="""You are Wayra's expert budget analyst with deep knowledge of travel costs, 
            seasonal pricing patterns, and budget optimization strategies. You specialize in helping 
            travelers maximize their experiences while staying within budget constraints. You have 
            access to historical pricing data and understand regional cost variations.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    async def analyze_budget(self, trip_details: Dict[str, Any], 
                           user_preferences: Dict[str, Any],
                           constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive budget analysis"""
        
        # Create budget analysis task
        task = Task(
            description=f"""
            Analyze the travel budget for the following trip:
            
            Trip Details: {json.dumps(trip_details, indent=2)}
            User Preferences: {json.dumps(user_preferences, indent=2)}
            Constraints: {json.dumps(constraints, indent=2)}
            
            Provide a comprehensive budget analysis including:
            1. Budget allocation recommendations by category
            2. Cost-saving opportunities specific to the destination
            3. Seasonal pricing considerations
            4. Risk assessment for budget overruns
            5. Alternative budget scenarios (conservative, moderate, optimistic)
            6. Specific actionable recommendations
            
            Focus on Wayra's budget-first approach and practical cost optimization.
            """,
            agent=self.agent,
            expected_output="Detailed budget analysis with specific recommendations and cost breakdowns"
        )
        
        # Execute task
        crew = Crew(
            agents=[self.agent],
            tasks=[task],
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse and structure the result
        return self._parse_budget_analysis(result, trip_details)
    
    def _parse_budget_analysis(self, raw_result: str, trip_details: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and structure budget analysis results"""
        
        # Extract key information from the analysis
        # This would include more sophisticated parsing in production
        
        total_budget = trip_details.get("budget", 0)
        duration = trip_details.get("duration", 7)
        travelers = trip_details.get("travelers", 2)
        
        # Generate structured response
        return {
            "analysis_summary": raw_result,
            "budget_breakdown": {
                "accommodation": total_budget * 0.35,
                "transportation": total_budget * 0.25,
                "food": total_budget * 0.20,
                "activities": total_budget * 0.15,
                "emergency": total_budget * 0.05
            },
            "daily_budget": total_budget / duration,
            "per_person_budget": total_budget / travelers,
            "cost_saving_opportunities": [
                "Book accommodations 2-3 months in advance for 15-20% savings",
                "Use public transportation instead of taxis to save 40-60%",
                "Eat at local markets and avoid tourist restaurants for 30% food savings",
                "Look for free walking tours and public attractions"
            ],
            "risk_factors": [
                "Peak season pricing may increase costs by 20-30%",
                "Currency fluctuations could impact budget",
                "Unexpected transportation costs in destination"
            ],
            "recommendations": [
                "Set aside 10% emergency buffer for unexpected costs",
                "Book major expenses (flights, accommodation) early",
                "Research local cost of living before departure",
                "Consider travel insurance for budget protection"
            ],
            "confidence_score": 0.85,
            "agent_insights": [
                {
                    "agent": "Budget Analyst",
                    "insight": "Budget allocation aligns with destination cost structure",
                    "confidence": 0.9
                }
            ]
        }
```

**Week 9-10: Enhanced Collaboration Service Implementation**

The collaboration service implementation includes real-time synchronization capabilities, user coordination interfaces, and group budget management that enable effective group travel planning while maintaining budget optimization focus.

```python
# wayra-ai-services/collaboration-service/src/main.py
from fastapi import FastAPI, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Set
import json
import uuid
from datetime import datetime
import asyncio

from sync.session_manager import SessionManager
from coordination.group_coordinator import GroupCoordinator
from sync.conflict_resolver import ConflictResolver

app = FastAPI(title="Wayra Collaboration Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize collaboration components
session_manager = SessionManager()
group_coordinator = GroupCoordinator()
conflict_resolver = ConflictResolver()

# WebSocket connection management
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
    async def send_to_session(self, message: str, session_id: str):
        if session_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[session_id].discard(connection)

manager = ConnectionManager()

class CollaborationSessionRequest(BaseModel):
    trip_id: str
    session_name: str
    participants: List[str]  # User IDs
    session_type: str  # "planning", "budget_review", "decision_making"

class CollaborationSessionResponse(BaseModel):
    session_id: str
    session_name: str
    participants: List[Dict[str, Any]]
    status: str
    created_at: str
    websocket_url: str

@app.post("/api/v1/collaboration/session", response_model=CollaborationSessionResponse)
async def create_collaboration_session(
    request: CollaborationSessionRequest,
    x_user_id: str = Header(...),
    x_user_email: str = Header(...)
):
    """Create new collaboration session"""
    try:
        session = await session_manager.create_session(
            trip_id=request.trip_id,
            session_name=request.session_name,
            creator_id=x_user_id,
            participants=request.participants,
            session_type=request.session_type
        )
        
        return CollaborationSessionResponse(
            session_id=session["session_id"],
            session_name=session["session_name"],
            participants=session["participants"],
            status=session["status"],
            created_at=session["created_at"],
            websocket_url=f"/ws/collaboration/{session['session_id']}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/collaboration/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time collaboration"""
    await manager.connect(websocket, session_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process collaboration message
            processed_message = await process_collaboration_message(
                session_id=session_id,
                message_data=message_data
            )
            
            # Broadcast to all session participants
            await manager.send_to_session(
                json.dumps(processed_message),
                session_id
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)

async def process_collaboration_message(session_id: str, message_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process collaboration message and handle conflicts"""
    
    message_type = message_data.get("type")
    
    if message_type == "budget_update":
        # Handle budget updates with conflict resolution
        result = await conflict_resolver.resolve_budget_conflict(
            session_id=session_id,
            update_data=message_data["data"]
        )
        
        return {
            "type": "budget_update_result",
            "session_id": session_id,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    elif message_type == "preference_update":
        # Handle preference updates
        result = await group_coordinator.coordinate_preferences(
            session_id=session_id,
            preference_data=message_data["data"]
        )
        
        return {
            "type": "preference_update_result",
            "session_id": session_id,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    elif message_type == "decision_vote":
        # Handle group decision voting
        result = await group_coordinator.process_vote(
            session_id=session_id,
            vote_data=message_data["data"]
        )
        
        return {
            "type": "vote_result",
            "session_id": session_id,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    else:
        # Handle general chat messages
        return {
            "type": "chat_message",
            "session_id": session_id,
            "data": message_data["data"],
            "timestamp": datetime.utcnow().isoformat()
        }

class GroupDecisionRequest(BaseModel):
    session_id: str
    decision_type: str  # "budget_allocation", "destination_choice", "activity_selection"
    options: List[Dict[str, Any]]
    voting_method: str  # "majority", "consensus", "weighted"

class GroupDecisionResponse(BaseModel):
    decision_id: str
    status: str  # "voting", "completed", "deadlocked"
    results: Optional[Dict[str, Any]] = None
    next_steps: List[str]

@app.post("/api/v1/collaboration/decision", response_model=GroupDecisionResponse)
async def create_group_decision(
    request: GroupDecisionRequest,
    x_user_id: str = Header(...),
    x_user_email: str = Header(...)
):
    """Create group decision process"""
    try:
        decision = await group_coordinator.create_decision(
            session_id=request.session_id,
            decision_type=request.decision_type,
            options=request.options,
            voting_method=request.voting_method,
            creator_id=x_user_id
        )
        
        return GroupDecisionResponse(
            decision_id=decision["decision_id"],
            status=decision["status"],
            results=decision.get("results"),
            next_steps=decision["next_steps"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "collaboration-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Week 11-12: Frontend AI Integration**

The frontend AI integration includes React component development, context providers, and user interface enhancements that provide seamless access to AI capabilities while maintaining existing Wayra user experience patterns.

```typescript
// wayra-frontend/src/contexts/AIContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AIState {
  conversations: Record<string, Conversation>;
  activeConversation: string | null;
  agentTasks: Record<string, AgentTask>;
  optimizations: Record<string, OptimizationResult>;
  isProcessing: boolean;
  error: string | null;
}

interface Conversation {
  id: string;
  messages: Message[];
  tripContext?: any;
  lastUpdated: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
  tripUpdates?: any;
}

interface AgentTask {
  id: string;
  type: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  results?: any;
  createdAt: string;
}

interface OptimizationResult {
  id: string;
  type: string;
  results: any;
  confidence: number;
  createdAt: string;
}

type AIAction = 
  | { type: 'START_CONVERSATION'; payload: { tripContext?: any } }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_AGENT_TASK'; payload: AgentTask }
  | { type: 'ADD_OPTIMIZATION'; payload: OptimizationResult };

const initialState: AIState = {
  conversations: {},
  activeConversation: null,
  agentTasks: {},
  optimizations: {},
  isProcessing: false,
  error: null,
};

function aiReducer(state: AIState, action: AIAction): AIState {
  switch (action.type) {
    case 'START_CONVERSATION':
      const conversationId = `conv_${Date.now()}`;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            id: conversationId,
            messages: [],
            tripContext: action.payload.tripContext,
            lastUpdated: new Date().toISOString(),
          },
        },
        activeConversation: conversationId,
      };

    case 'ADD_MESSAGE':
      const { conversationId, message } = action.payload;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            messages: [...state.conversations[conversationId].messages, message],
            lastUpdated: new Date().toISOString(),
          },
        },
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
      };

    case 'UPDATE_AGENT_TASK':
      return {
        ...state,
        agentTasks: {
          ...state.agentTasks,
          [action.payload.id]: action.payload,
        },
      };

    case 'ADD_OPTIMIZATION':
      return {
        ...state,
        optimizations: {
          ...state.optimizations,
          [action.payload.id]: action.payload,
        },
      };

    default:
      return state;
  }
}

interface AIContextType {
  state: AIState;
  startConversation: (tripContext?: any) => string;
  sendMessage: (conversationId: string, message: string) => Promise<void>;
  createAgentTask: (taskType: string, tripDetails: any, preferences?: any) => Promise<string>;
  getAgentTaskStatus: (taskId: string) => Promise<AgentTask>;
  optimizeBudget: (budgetData: any) => Promise<OptimizationResult>;
  predictPrices: (priceData: any) => Promise<OptimizationResult>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const { user } = useAuth();

  const startConversation = (tripContext?: any): string => {
    dispatch({ type: 'START_CONVERSATION', payload: { tripContext } });
    return state.activeConversation!;
  };

  const sendMessage = async (conversationId: string, message: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Add user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: userMessage } });
    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      // Get conversation context
      const conversation = state.conversations[conversationId];
      
      // Send to AI service
      const response = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          trip_context: conversation.tripContext,
          user_preferences: {}, // Would get from user profile
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        type: 'ai',
        content: result.response,
        timestamp: new Date().toISOString(),
        suggestions: result.suggestions,
        tripUpdates: result.trip_updates,
      };

      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: aiMessage } });
      dispatch({ type: 'SET_PROCESSING', payload: false });

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const createAgentTask = async (taskType: string, tripDetails: any, preferences?: any): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      const response = await fetch('/api/ai/agents/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          task_type: taskType,
          trip_details: tripDetails,
          user_preferences: preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent task');
      }

      const result = await response.json();

      const agentTask: AgentTask = {
        id: result.task_id,
        type: taskType,
        status: result.status,
        results: result.results,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_AGENT_TASK', payload: agentTask });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      return result.task_id;

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const getAgentTaskStatus = async (taskId: string): Promise<AgentTask> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch(`/api/ai/agents/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get task status');
      }

      const result = await response.json();

      const agentTask: AgentTask = {
        id: result.task_id,
        type: state.agentTasks[taskId]?.type || 'unknown',
        status: result.status,
        results: result.results,
        createdAt: state.agentTasks[taskId]?.createdAt || new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_AGENT_TASK', payload: agentTask });

      return agentTask;

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const optimizeBudget = async (budgetData: any): Promise<OptimizationResult> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      const response = await fetch('/api/ai/optimization/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize budget');
      }

      const result = await response.json();

      const optimization: OptimizationResult = {
        id: `opt_${Date.now()}`,
        type: 'budget_optimization',
        results: result,
        confidence: result.confidence_score,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_OPTIMIZATION', payload: optimization });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      return optimization;

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const predictPrices = async (priceData: any): Promise<OptimizationResult> => {
    if (!user) throw new Error('User not authenticated');

    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      const response = await fetch('/api/ai/optimization/predict/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(priceData),
      });

      if (!response.ok) {
        throw new Error('Failed to predict prices');
      }

      const result = await response.json();

      const optimization: OptimizationResult = {
        id: `pred_${Date.now()}`,
        type: 'price_prediction',
        results: result,
        confidence: 0.8, // Would come from service
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_OPTIMIZATION', payload: optimization });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      return optimization;

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };

  const contextValue: AIContextType = {
    state,
    startConversation,
    sendMessage,
    createAgentTask,
    getAgentTaskStatus,
    optimizeBudget,
    predictPrices,
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
```

---

**Document Classification:** Technical Implementation Guide - Confidential  
**Prepared by:** Manus AI Development Team  
**Implementation Timeline:** 24 weeks from approval  
**Review Required by:** Technical Leadership and Development Teams  
**Next Steps:** Executive approval and development team assembly

---

*This comprehensive implementation execution plan provides detailed technical steps, code examples, and specific implementation guidance for transforming Wayra into an AI-enhanced travel planning platform. The plan maintains existing architecture while adding sophisticated AI capabilities that align with Wayra's budget-focused value proposition.*

