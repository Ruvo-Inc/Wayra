# TravelPlanner-CrewAi-Agents-Streamlit Repository Analysis

**Repository:** https://github.com/AdritPal08/TravelPlanner-CrewAi-Agents-Streamlit  
**Stars:** 38 | **Forks:** 13  
**Last Updated:** August 11, 2024  
**Language:** Python 100%  

## Initial Overview:

### Key Technologies:
- **CrewAI Framework**: Multi-agent orchestration system
- **LLaMA 3.1 (70b)**: Large language model via Groq API
- **Streamlit**: Web application interface
- **Python**: Core programming language
- **SERPER API**: Search functionality

### Repository Structure:
- `.devcontainer/` - Development container configuration
- `.streamlit/` - Streamlit configuration
- `Cover Images/` - Project images
- `Travel Doc/` - Documentation
- `tools/` - Custom tools and utilities
- `AgentProcess_Streamlit.py` - Agent processing logic
- `agents.py` - Agent definitions
- `app.py` - Main Streamlit application
- `README.md` - Project documentation

### Core Agents Identified:
1. **Destination_Research_Agent** - Destination analysis and recommendations
2. **Accommodation_Agent** - Hotel and lodging curation
3. **Transportation_Agent** - Travel logistics planning
4. **Weather_Agent** - Weather analysis and forecasting
5. **Itinerary_Planner_Agent** - Daily activity planning
6. **Budget_Analyst_Agent** - Cost analysis and budgeting
7. **Trip_Planner_Agent** - Overall trip orchestration

### Key Features:
- Multi-agent collaborative planning
- Personalized itinerary generation
- Budget analysis and breakdown
- Weather integration
- Transportation planning
- Accommodation recommendations
- Streamlit web interface



## Detailed Agent Analysis from agents.py:

### Agent Architecture:
- **CrewAI Framework**: Uses CrewAI for multi-agent orchestration
- **LLM Integration**: ChatGroq with LLaMA 3.1-70b-versatile model
- **Tool Integration**: SearchTools and CalculatorTools for enhanced capabilities

### Individual Agent Definitions:

#### 1. Trip_Planner_Agent (#1)
- **Role**: Lead agent responsible for coordinating the entire trip planning process
- **Backstory**: Experienced travel consultant with passion for creating unforgettable journeys
- **Goal**: Develop detailed, personalized travel itinerary covering all trip aspects
- **Tools**: SearchTools.search_internet, CalculatorTools.calculate
- **Capabilities**: Delegates tasks to specialized agents and assembles comprehensive trip plan

#### 2. Destination_Research_Agent (#2)
- **Role**: Expert on gathering in-depth destination information
- **Backstory**: Well-traveled explorer with wealth of knowledge about different cultures
- **Goal**: Analyze and recommend most suitable destination including famous places, local cuisine, cultural experiences
- **Tools**: SearchTools.search_internet, BrowserTool.scrape_and_summarize_website
- **Focus**: Weather, events, costs, and alignment with user interests

#### 3. Accommodation_Agent (#3)
- **Role**: Expert in finding suitable accommodation options based on preferences and budget
- **Backstory**: Seasoned traveler with keen eye for comfort, amenities, and value
- **Goal**: Provide curated list of accommodation options with detailed information and pricing
- **Tools**: SearchTools.search_internet, BrowserTool.scrape_and_summarize_website, CalculatorTools.calculate

#### 4. Transportation_Agent (#4)
- **Role**: Expert in planning efficient and cost-effective transportation
- **Backstory**: Well-versed traveler with extensive knowledge of transportation modes and logistics
- **Goal**: Provide detailed transportation plan including modes, schedules, and pricing
- **Tools**: SearchTools.search_internet, BrowserTool.scrape_and_summarize_website, CalculatorTools.calculate

#### 5. Weather_Agent (#5)
- **Role**: Expert in providing accurate weather forecasts and advisories
- **Backstory**: Meteorologist with deep understanding of weather patterns and travel impact
- **Goal**: Provide detailed weather information for trip dates including forecasts and advisories
- **Tools**: SearchTools.search_internet, BrowserTool.scrape_and_summarize_website

#### 6. Itinerary_Planner_Agent (#6)
- **Role**: Expert in creating well-structured and engaging daily itineraries
- **Backstory**: Meticulous travel planner with keen eye for detail and knack for creating well-paced experiences
- **Goal**: Create detailed daily itinerary balancing must-see attractions with unique local experiences
- **Tools**: SearchTools.search_internet, BrowserTool.scrape_and_summarize_website

#### 7. Budget_Analyst_Agent (#7)
- **Role**: Analyze and provide cost estimates for various trip aspects
- **Backstory**: Financial expert with deep understanding of travel costs and talent for finding deals
- **Goal**: Provide comprehensive budget breakdown for the trip
- **Tools**: SearchTools.search_internet, BrowserTool.scrape_and_summarize_website, CalculatorTools.calculate

