# Travel-Planner-AI Repository Initial Findings

**Repository:** https://github.com/hardikverma22/travel-planner-ai  
**Current Status:** Evolved into "Rutugo" platform  
**Stars:** 202  
**Forks:** 55  

## Key Information from README:

### Technology Stack:
- **Next.js 14** - Web application framework
- **Tailwind CSS with Shadcn-UI** - Styling and UI components
- **Convex Backend Platform** - Backend infrastructure
- **OpenAI APIs** - AI content generation
- **Clerk** - Authentication
- **Razorpay** - Payment processing
- **Resend** - Email functionality

### Key Features:
- **Top Spots Unveiled** - Discover attractions and hidden gems
- **Tailored Itineraries** - Custom-tailored schedules
- **Optimal Timing** - Best time to visit recommendations
- **Foodie Hotspots** - Local dining recommendations
- **Prime Experiences** - Curated experiences
- **Expense Tracker** - Budget tracking throughout journey
- **Email Invite** - Collaboration features
- **Community Plans** - Explore plans from other travelers
- **Meta-searched Booking Integration** - Skyscanner, Kayak, Viator, GetYourGuide
- **Smart Plan Refinement** - Dynamic adjustment capabilities
- **Feasibility Check System** - Plan validation
- **Multi-Step Plan Creation** - 4-step guided process

### Repository Structure:
- `.eraser/` - Documentation/diagrams
- `.vscode/` - VS Code configuration
- `app/` - Next.js app directory
- `components/` - React components
- `contexts/` - React contexts
- `convex/` - Backend functions
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries
- `public/` - Static assets
- `.env.sample` - Environment configuration template

### Evolution to Rutugo:
The original Travel Planner AI has been rebranded and enhanced as "Rutugo" with additional features and improvements.



## Plan.ts Analysis:

### Key Functions Found:
- **PlanAdmin** - Query to check if user is plan admin
- **getPlanAdmin** - Get plan admin status and plan name
- **getSharedPlans** - Get plans shared with a user
- **getAllUsersForAPlan** - Get all users with access to a plan
- **getAllPlansForUser** - Get user's own and shared plans with settings
- **getPublicPlans** - Get public community plans
- **getComboBoxPlansForAUser** - Get plans for dropdown/combobox
- **validatePlanAccess** - Validate user access to a plan
- **getSinglePlan** - Get individual plan with access control

### Key Features Identified:
- **Plan Sharing System** - Users can share plans with others
- **Access Control** - Admin/user permissions for plans
- **Public Community Plans** - Plans can be made public for community
- **Plan Settings** - Activity preferences, dates, companion info
- **Batch Processing** - Efficient database queries with indexing
- **Storage Integration** - File storage for plan assets

