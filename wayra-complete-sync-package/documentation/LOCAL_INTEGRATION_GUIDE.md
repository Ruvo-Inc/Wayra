# Wayra AI Features - Local Integration Guide

## 🎯 **GOAL: Get AI Features Visible in Your Local Wayra App**

This guide will help you integrate all the AI features we built into your existing local Wayra application so you can see and test them immediately.

## 📁 **FILES TO INTEGRATE**

### **Backend Files (Copy to your local wayra-backend/):**
```
services/ai/agents.js           → Multi-agent system
services/ai/agentTools.js       → Agent tools and capabilities  
services/ai/openAIService.js    → OpenAI integration
routes/ai/agents.js             → Multi-agent API endpoints
routes/ai/conversation.js       → Conversational AI endpoints
utils/ai/configLoader.js        → AI configuration management
utils/ai/mathUtils.js           → Mathematical utilities
```

### **Frontend Files (Copy to your local wayra-frontend/src/):**
```
app/ai/chat/page.tsx            → Conversational AI interface
app/ai/agents/page.tsx          → Multi-agent planning interface
services/aiApi.ts               → Conversational AI API service
services/multiAgentApi.ts       → Multi-agent API service
```

## 🔧 **STEP-BY-STEP INTEGRATION**

### **STEP 1: Backend Integration**

#### 1.1 Create AI Directories
```bash
cd /path/to/your/wayra-backend
mkdir -p services/ai routes/ai utils/ai
```

#### 1.2 Copy AI Files
Extract the `wayra-multi-agent-complete.zip` and copy:
- All files from `wayra-backend/services/ai/` → your `services/ai/`
- All files from `wayra-backend/routes/ai/` → your `routes/ai/`
- All files from `wayra-backend/utils/ai/` → your `utils/ai/`

#### 1.3 Install Dependencies
```bash
npm install openai axios
```

#### 1.4 Update Your Server File
Add these lines to your main server file (usually `index.js` or `server.js`):

```javascript
// Add after your existing route imports
try {
  const AIConfigLoader = require('./utils/ai/configLoader');
  
  // Load AI conversation routes if enabled
  if (AIConfigLoader.isFeatureEnabled('aiConversation')) {
    app.use('/api/ai/conversation', require('./routes/ai/conversation'));
    console.log('✅ AI conversation routes loaded successfully');
  }
  
  // Load multi-agent routes if enabled
  if (AIConfigLoader.isFeatureEnabled('multiAgents')) {
    app.use('/api/ai/agents', require('./routes/ai/agents'));
    console.log('✅ AI multi-agent routes loaded successfully');
  }
} catch (error) {
  console.error('❌ AI routes failed:', error.message);
  console.log('ℹ️ Continuing without AI features...');
}
```

#### 1.5 Update Environment Variables
Add to your `.env` file:
```env
# Required: OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=3000

# Feature Flags
FEATURE_AI_CONVERSATION_ENABLED=true
FEATURE_AI_AGENTS_ENABLED=true
FEATURE_AI_BUDGET_OPTIMIZATION_ENABLED=true
```

### **STEP 2: Frontend Integration**

#### 2.1 Create AI Directories
```bash
cd /path/to/your/wayra-frontend/src
mkdir -p app/ai/chat app/ai/agents
```

#### 2.2 Copy Frontend Files
Extract the `wayra-multi-agent-complete.zip` and copy:
- `wayra-frontend/src/app/ai/chat/page.tsx` → your `src/app/ai/chat/page.tsx`
- `wayra-frontend/src/app/ai/agents/page.tsx` → your `src/app/ai/agents/page.tsx`
- `wayra-frontend/src/services/aiApi.ts` → your `src/services/aiApi.ts`
- `wayra-frontend/src/services/multiAgentApi.ts` → your `src/services/multiAgentApi.ts`

#### 2.3 Update Frontend Environment
Add to your `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### **STEP 3: Add Navigation Links**

#### 3.1 Find Your Navigation Component
Look for your main navigation component (usually in `components/Navigation.tsx` or similar).

#### 3.2 Add AI Menu Items
Add these navigation links to your existing menu:

```typescript
// Add to your navigation menu
{
  name: 'AI Chat',
  href: '/ai/chat',
  icon: '🤖'
},
{
  name: 'AI Planning',
  href: '/ai/agents', 
  icon: '🧠'
}
```

### **STEP 4: Test the Integration**

#### 4.1 Restart Your Servers
```bash
# Backend
cd /path/to/your/wayra-backend
npm start

# Frontend (in new terminal)
cd /path/to/your/wayra-frontend
npm run dev
```

#### 4.2 Check for Success Messages
Look for these in your backend console:
```
✅ AI conversation routes loaded successfully
✅ AI multi-agent routes loaded successfully
```

#### 4.3 Test the AI Features
1. Navigate to `http://localhost:3000/ai/chat`
2. Navigate to `http://localhost:3000/ai/agents`
3. Try creating a travel plan with AI

## 🔍 **TROUBLESHOOTING**

### **Issue: AI Routes Not Loading**
**Solution:** Check that files are in correct locations and environment variables are set.

### **Issue: Frontend Build Errors**
**Solution:** Ensure all TypeScript dependencies are installed:
```bash
npm install @types/react @types/node
```

### **Issue: API Calls Failing**
**Solution:** Verify your OpenAI API key is set correctly in `.env`

### **Issue: Navigation Not Showing AI Links**
**Solution:** Make sure you've added the navigation links to your existing menu component.

## 🎯 **VERIFICATION CHECKLIST**

After integration, verify:
- [ ] Backend starts without errors
- [ ] AI route success messages appear in console
- [ ] Frontend builds without TypeScript errors
- [ ] Can navigate to `/ai/chat` and `/ai/agents`
- [ ] AI interfaces load without JavaScript errors
- [ ] Can authenticate and use AI features

## 🚀 **NEXT STEPS**

Once integrated successfully:
1. **Test AI Chat**: Try planning a trip with conversational AI
2. **Test Multi-Agent Planning**: Use the step-by-step planning wizard
3. **Verify Budget Optimization**: Check if AI recommendations save money
4. **Share Feedback**: Let me know how the integration works!

## 📞 **NEED HELP?**

If you encounter any issues:
1. Check the console logs for specific error messages
2. Verify all files are in the correct locations
3. Ensure environment variables are set properly
4. Make sure your OpenAI API key is valid

---

**Once you complete this integration, you'll have a fully functional AI-powered travel planning system in your local Wayra application!**

