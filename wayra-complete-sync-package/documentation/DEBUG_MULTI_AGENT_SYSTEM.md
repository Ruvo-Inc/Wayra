# Multi-Agent System Debugging Guide

## 🔍 **CURRENT ISSUE ANALYSIS**

Based on the screenshot, 3 out of 4 agents are working:
- ✅ Budget Analysis Agent
- ✅ Destination Research Agent  
- ✅ Travel Coordinator Agent
- ❌ Itinerary Planning Agent (missing from results)

## 🛠️ **DEBUGGING CHECKLIST**

### **1. Backend Logs Check**
Look for these error patterns in your backend console:

```bash
# Common error patterns to look for:
❌ Error executing itinerary_planning agent task
❌ OpenAI API error
❌ Agent coordination failed
❌ Timeout error
❌ Missing dependencies
```

### **2. Browser Network Tab Check**
1. Open DevTools (F12) → Network tab
2. Try AI planning again
3. Look for failed requests to:
   - `/api/ai/agents/comprehensive-planning`
   - `/api/ai/agents/plan-itinerary`

### **3. Browser Console Check**
Look for JavaScript errors like:
```javascript
// Common frontend errors:
TypeError: Cannot read property 'itineraryPlan' of undefined
Network Error
Timeout Error
```

## 🔧 **MOST LIKELY FIXES**

### **Fix 1: Enhanced Error Handling (RECOMMENDED)**

Update your frontend `multiAgentApi.ts` to handle partial failures:

```typescript
// Add this to your multiAgentApi.ts
async comprehensivePlanning(request: PlanningRequest): Promise<APIResponse<any>> {
  try {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}/api/ai/agents/comprehensive-planning`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    const result = await this.handleResponse(response);
    
    // Enhanced error handling for partial failures
    if (result.success && result.data) {
      // Check if all agents completed
      const agents = ['budgetAnalysis', 'destinationResearch', 'itineraryPlan', 'travelCoordination'];
      const missingAgents = agents.filter(agent => !result.data[agent]);
      
      if (missingAgents.length > 0) {
        console.warn('Some agents failed to complete:', missingAgents);
        // Still return success but with warning
        result.metadata = {
          ...result.metadata,
          partialFailure: true,
          missingAgents: missingAgents
        };
      }
    }
    
    return result;
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
```

### **Fix 2: Backend Agent Timeout Fix**

Update your backend `agents.js` to handle timeouts:

```javascript
// In your agents.js file, update the executeAgentTask method:
async executeAgentTask(agentType, task, context = {}) {
  try {
    const agent = this.getAgent(agentType);
    
    if (!agent) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // Build comprehensive prompt with agent context
    const prompt = this.buildAgentPrompt(agent, task, context);
    
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Agent task timeout')), 120000); // 2 minutes
    });
    
    // Execute task with timeout
    const completionPromise = this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: this.config.maxTokens || 3000,
      response_format: { type: 'json_object' }
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);
    
    const response = completion.choices[0].message.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      console.error(`JSON parse error for ${agentType}:`, parseError);
      // Return a fallback response
      parsedResponse = {
        error: 'Failed to parse agent response',
        agentType: agentType,
        rawResponse: response
      };
    }

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
        type: error.message.includes('timeout') ? 'AGENT_TIMEOUT_ERROR' : 'AGENT_EXECUTION_ERROR',
        agentType: agentType,
        timestamp: new Date().toISOString()
      }
    };
  }
}
```

### **Fix 3: Frontend Display Fix**

Update your frontend `page.tsx` to handle missing agents:

```typescript
// In your agents/page.tsx, update the results display:
{currentStep === 3 && showResults && comprehensiveResult && (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your AI-Generated Travel Plan</h2>
      
      {/* Budget Analysis */}
      {comprehensiveResult.budgetAnalysis ? (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💰 Budget Analysis</h3>
          <div className="text-sm text-blue-800">
            <p>Total Budget: {formatCurrency(planningRequest.budget)}</p>
            <p>Daily Budget: {formatCurrency(planningRequest.budget / planningRequest.duration)}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-2">💰 Budget Analysis</h3>
          <p className="text-sm text-red-800">Budget analysis failed to complete. Please try again.</p>
        </div>
      )}

      {/* Destination Research */}
      {comprehensiveResult.destinationResearch ? (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">🌍 Destination Insights</h3>
          <div className="text-sm text-green-800">
            <p>Destination: {planningRequest.destination}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-2">🌍 Destination Insights</h3>
          <p className="text-sm text-red-800">Destination research failed to complete. Please try again.</p>
        </div>
      )}

      {/* Itinerary Plan */}
      {comprehensiveResult.itineraryPlan ? (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">📅 Itinerary Plan</h3>
          <div className="text-sm text-purple-800">
            <p>Duration: {planningRequest.duration} days</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-2">📅 Itinerary Plan</h3>
          <p className="text-sm text-red-800">Itinerary planning failed to complete. Please try again.</p>
        </div>
      )}

      {/* Travel Coordination */}
      {comprehensiveResult.travelCoordination ? (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-2">✈️ Travel Coordination</h3>
          <div className="text-sm text-orange-800">
            <p>Travelers: {planningRequest.travelers}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-2">✈️ Travel Coordination</h3>
          <p className="text-sm text-red-800">Travel coordination failed to complete. Please try again.</p>
        </div>
      )}
    </div>
  </div>
)}
```

## 🚀 **QUICK DEBUG TEST**

Create this simple test endpoint to check individual agents:

```javascript
// Add to your routes/ai/agents.js
router.post('/test-individual-agent', auth.verifyToken, async (req, res) => {
  try {
    const { agentType } = req.body;
    
    const testContext = {
      destination: 'Paris',
      budget: 3000,
      duration: 7,
      travelers: 2
    };
    
    const result = await agentSystem.executeAgentTask(
      agentType,
      'Test task for debugging',
      testContext
    );
    
    res.json({
      success: true,
      data: result,
      debug: true
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: true
    });
  }
});
```

## 📋 **DEBUGGING STEPS TO FOLLOW**

1. **Check backend logs** for specific error messages
2. **Test individual agents** using the debug endpoint
3. **Apply the enhanced error handling** fixes above
4. **Test the comprehensive planning** again
5. **Check browser console** for any remaining errors

## 🎯 **SUCCESS CRITERIA**

After applying fixes, you should see:
- ✅ All 4 agent sections displayed (even if some show errors)
- ✅ Detailed error messages for any failing agents
- ✅ Graceful handling of partial failures
- ✅ Ability to retry failed agents individually

---

**Apply these fixes and let me know what specific errors you see in the logs!**

