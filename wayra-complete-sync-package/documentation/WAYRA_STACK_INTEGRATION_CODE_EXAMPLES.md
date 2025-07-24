# Wayra Stack Integration Code Examples
## Complete Implementation Examples for Enhanced Itinerary Stacks

---

## 🎯 **COMPLETE CODE IMPLEMENTATION**

### **Enhanced Master Itinerary Component**

#### **Frontend: Master Itinerary with Smart Monitoring Status**
```typescript
// wayra-frontend/src/components/itinerary/MasterItinerary.tsx
import React, { useState, useEffect } from 'react';
import { ItineraryComponent, MonitoringStatus } from '@/types/itinerary';
import { itineraryApi } from '@/services/itineraryApi';

interface MasterItineraryProps {
  itineraryId: string;
}

export const MasterItinerary: React.FC<MasterItineraryProps> = ({ itineraryId }) => {
  const [itinerary, setItinerary] = useState(null);
  const [components, setComponents] = useState<ItineraryComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItinerary();
    // Set up real-time monitoring status updates
    const interval = setInterval(updateMonitoringStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [itineraryId]);

  const loadItinerary = async () => {
    try {
      const data = await itineraryApi.getItineraryWithComponents(itineraryId);
      setItinerary(data.itinerary);
      setComponents(data.components);
    } catch (error) {
      console.error('Failed to load itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMonitoringStatus = async () => {
    try {
      const updatedComponents = await itineraryApi.getComponentsStatus(itineraryId);
      setComponents(updatedComponents);
    } catch (error) {
      console.error('Failed to update monitoring status:', error);
    }
  };

  const enterComponentStack = (component: ItineraryComponent) => {
    // Navigate to component stack with context
    window.location.href = `/itinerary/${itineraryId}/component/${component.id}`;
  };

  const getStatusDisplay = (component: ItineraryComponent) => {
    const statusMap = {
      'not-started': { icon: '⭕', text: 'Not started', color: 'text-gray-500' },
      'planning': { icon: '📝', text: 'Planning', color: 'text-blue-500' },
      'monitoring': { 
        icon: '🤖', 
        text: `Monitoring (Target: $${component.budgetTarget})`, 
        color: 'text-blue-500',
        subtext: `Last checked: ${component.lastChecked ? new Date(component.lastChecked).toLocaleTimeString() : 'Never'}`
      },
      'deal-found': { 
        icon: '✨', 
        text: 'Deal found!', 
        color: 'text-green-500',
        subtext: component.bestDeal ? `$${component.bestDeal.price} - Save $${component.budgetTarget - component.bestDeal.price}` : ''
      },
      'booked': { 
        icon: '✅', 
        text: 'Booked', 
        color: 'text-green-500',
        subtext: `$${component.actualPrice} - Saved $${component.savings || 0}`
      },
      'failed': { icon: '❌', text: 'Booking failed', color: 'text-red-500' }
    };

    return statusMap[component.status] || statusMap['not-started'];
  };

  const getComponentActions = (component: ItineraryComponent) => {
    const baseActions = [
      { id: 'view', label: 'View Details', primary: false }
    ];

    switch (component.status) {
      case 'not-started':
      case 'planning':
        return [
          ...baseActions,
          { id: 'start-monitoring', label: 'Start Smart Monitoring', primary: true }
        ];
      case 'monitoring':
        return [
          ...baseActions,
          { id: 'view-monitoring', label: 'View Monitoring', primary: true },
          { id: 'pause-monitoring', label: 'Pause', primary: false }
        ];
      case 'deal-found':
        return [
          ...baseActions,
          { id: 'view-deal', label: 'View Deal', primary: true },
          { id: 'book-deal', label: 'Book Now', primary: true }
        ];
      case 'booked':
        return [
          ...baseActions,
          { id: 'view-booking', label: 'View Booking', primary: true },
          { id: 'modify-booking', label: 'Modify', primary: false }
        ];
      default:
        return baseActions;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading itinerary...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Itinerary Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {itinerary?.title}
        </h1>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>📍 {itinerary?.destination}</span>
          <span>📅 {itinerary?.dates}</span>
          <span>💰 Budget: ${itinerary?.totalBudget}</span>
          <span>💳 Spent: ${itinerary?.currentSpend}</span>
          <span className="text-green-600">💵 Remaining: ${itinerary?.totalBudget - itinerary?.currentSpend}</span>
        </div>
      </div>

      {/* Components List */}
      <div className="space-y-4">
        {components.map((component) => {
          const status = getStatusDisplay(component);
          const actions = getComponentActions(component);

          return (
            <div key={component.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{component.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {component.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{status.icon}</span>
                    <span className={`font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  {status.subtext && (
                    <p className="text-sm text-gray-500 ml-6">
                      {status.subtext}
                    </p>
                  )}
                  
                  {component.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {component.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.id === 'view') {
                          enterComponentStack(component);
                        } else {
                          // Handle other actions
                          console.log(`Action: ${action.id} for component: ${component.id}`);
                        }
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        action.primary
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### **Backend: Enhanced Itinerary API with Monitoring**
```javascript
// wayra-backend/routes/itinerary/enhanced.js
const express = require('express');
const router = express.Router();
const { ItineraryService } = require('../../services/itinerary/ItineraryService');
const { MonitoringService } = require('../../services/monitoring/MonitoringService');
const { authMiddleware } = require('../../middleware/auth');

// Get itinerary with components and monitoring status
router.get('/:itineraryId/enhanced', authMiddleware, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const userId = req.user.uid;

    // Get base itinerary
    const itinerary = await ItineraryService.getItinerary(itineraryId, userId);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Get components with monitoring status
    const components = await ItineraryService.getComponentsWithMonitoring(itineraryId);
    
    // Calculate current spend and budget allocation
    const budgetAnalysis = await ItineraryService.calculateBudgetStatus(itineraryId);

    res.json({
      itinerary: {
        ...itinerary,
        currentSpend: budgetAnalysis.currentSpend,
        budgetAllocation: budgetAnalysis.allocation
      },
      components: components.map(component => ({
        ...component,
        statusDisplay: ItineraryService.getComponentStatusDisplay(component),
        actions: ItineraryService.getComponentActions(component)
      }))
    });

  } catch (error) {
    console.error('Error getting enhanced itinerary:', error);
    res.status(500).json({ error: 'Failed to load itinerary' });
  }
});

// Get real-time component status updates
router.get('/:itineraryId/components/status', authMiddleware, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const userId = req.user.uid;

    // Verify ownership
    const itinerary = await ItineraryService.getItinerary(itineraryId, userId);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Get latest monitoring status for all components
    const components = await MonitoringService.getLatestComponentStatus(itineraryId);

    res.json(components);

  } catch (error) {
    console.error('Error getting component status:', error);
    res.status(500).json({ error: 'Failed to get status updates' });
  }
});

module.exports = router;
```

### **Enhanced Component Stack Implementation**

#### **Frontend: Enhanced Flight Stack Component**
```typescript
// wayra-frontend/src/components/stacks/EnhancedFlightStack.tsx
import React, { useState, useEffect } from 'react';
import { FlightStackProps, MonitoringConfig } from '@/types/stacks';
import { stackApi } from '@/services/stackApi';

export const EnhancedFlightStack: React.FC<FlightStackProps> = ({ 
  itineraryId, 
  componentId, 
  onReturn 
}) => {
  const [currentView, setCurrentView] = useState<'overview' | 'search' | 'ai-recommendations' | 'smart-monitoring' | 'manual-booking'>('overview');
  const [component, setComponent] = useState(null);
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig>({
    budgetTarget: 0,
    preferences: {
      directFlights: true,
      preferredTimes: ['morning', 'evening'],
      airlines: ['any'],
      flexibility: {
        dates: '+/- 2 days',
        airports: 'nearby airports ok'
      }
    },
    automationLevel: 'approve'
  });

  useEffect(() => {
    loadComponentData();
  }, [componentId]);

  const loadComponentData = async () => {
    try {
      const data = await stackApi.getFlightComponent(itineraryId, componentId);
      setComponent(data);
      
      // Set suggested budget target
      if (data.suggestedBudget) {
        setMonitoringConfig(prev => ({
          ...prev,
          budgetTarget: data.suggestedBudget
        }));
      }
    } catch (error) {
      console.error('Failed to load component data:', error);
    }
  };

  const startSmartMonitoring = async () => {
    try {
      const monitoringJob = await stackApi.startFlightMonitoring(
        itineraryId, 
        componentId, 
        monitoringConfig
      );
      
      // Update component status
      setComponent(prev => ({
        ...prev,
        monitoringStatus: 'active',
        monitoringJobId: monitoringJob.id
      }));
      
      // Return to overview
      setCurrentView('overview');
      
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">
          {component?.route || 'Flight Component'}
        </h3>
        <p className="text-sm text-gray-600">
          Budget allocation: ${component?.budgetTarget || 'Not set'} 
          (from ${component?.totalBudget} total)
        </p>
      </div>

      <div className="text-lg font-medium text-gray-800 mb-4">
        Choose your approach:
      </div>

      <div className="space-y-3">
        {/* Search & Compare Option */}
        <div 
          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => setCurrentView('search')}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h4 className="font-medium text-gray-800">Search & Compare</h4>
              <p className="text-sm text-gray-600">Browse available flights manually</p>
            </div>
          </div>
        </div>

        {/* AI Recommendations Option */}
        <div 
          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => setCurrentView('ai-recommendations')}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h4 className="font-medium text-gray-800">AI Recommendations</h4>
              <p className="text-sm text-gray-600">Get AI-powered flight suggestions</p>
            </div>
          </div>
        </div>

        {/* Smart Monitoring Option */}
        <div 
          className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            component?.monitoringStatus === 'active' ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => setCurrentView('smart-monitoring')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-medium text-gray-800">Smart Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Set budget and let AI monitor & book automatically
                </p>
                {component?.monitoringStatus === 'active' && (
                  <p className="text-sm text-blue-600 mt-1">
                    Currently monitoring for flights under ${component.budgetTarget}
                  </p>
                )}
              </div>
            </div>
            {component?.monitoringStatus === 'active' && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-sm font-medium">🤖 Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Booking Option */}
        <div 
          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => setCurrentView('manual-booking')}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📋</span>
            <div>
              <h4 className="font-medium text-gray-800">Manual Booking</h4>
              <p className="text-sm text-gray-600">Book a specific flight now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSmartMonitoring = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">
          Set up intelligent monitoring for your flight
        </h3>
        <p className="text-sm text-gray-600">
          Configure your preferences and let AI find the best deals within your budget
        </p>
      </div>

      {/* Budget Target */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💰 Budget Target
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            value={monitoringConfig.budgetTarget}
            onChange={(e) => setMonitoringConfig(prev => ({
              ...prev,
              budgetTarget: parseInt(e.target.value)
            }))}
            className="border rounded-md px-3 py-2 w-32"
            placeholder="400"
          />
          <span className="text-sm text-gray-500">
            (Suggested based on ${component?.totalBudget} total budget)
          </span>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ⚙️ Preferences
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={monitoringConfig.preferences.directFlights}
              onChange={(e) => setMonitoringConfig(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  directFlights: e.target.checked
                }
              }))}
              className="mr-2"
            />
            <span className="text-sm">Direct flights preferred</span>
          </label>
          
          <div className="ml-6 space-y-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={monitoringConfig.preferences.preferredTimes.includes('morning')}
                onChange={(e) => {
                  const times = monitoringConfig.preferences.preferredTimes;
                  setMonitoringConfig(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      preferredTimes: e.target.checked 
                        ? [...times, 'morning']
                        : times.filter(t => t !== 'morning')
                    }
                  }));
                }}
                className="mr-2"
              />
              <span className="text-sm">Morning departures (6AM-12PM)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={monitoringConfig.preferences.preferredTimes.includes('evening')}
                onChange={(e) => {
                  const times = monitoringConfig.preferences.preferredTimes;
                  setMonitoringConfig(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      preferredTimes: e.target.checked 
                        ? [...times, 'evening']
                        : times.filter(t => t !== 'evening')
                    }
                  }));
                }}
                className="mr-2"
              />
              <span className="text-sm">Evening departures (6PM-11PM)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Automation Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🤖 Automation Level
        </label>
        <div className="space-y-2">
          {[
            { id: 'notify', label: 'Notify me when found', description: "I'll book manually" },
            { id: 'approve', label: 'Ask before booking', description: 'Show me the deal first' },
            { id: 'auto', label: 'Book automatically', description: 'Book immediately when found' }
          ].map((option) => (
            <label key={option.id} className="flex items-start">
              <input
                type="radio"
                name="automationLevel"
                value={option.id}
                checked={monitoringConfig.automationLevel === option.id}
                onChange={(e) => setMonitoringConfig(prev => ({
                  ...prev,
                  automationLevel: e.target.value as any
                }))}
                className="mr-3 mt-1"
              />
              <div>
                <span className="text-sm font-medium">{option.label}</span>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={startSmartMonitoring}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Start Monitoring
        </button>
        <button
          onClick={() => setCurrentView('overview')}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onReturn}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <span className="mr-2">←</span>
          Back to Itinerary
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          🛫 Flight Component
        </h2>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'smart-monitoring' && renderSmartMonitoring()}
        {/* Add other views as needed */}
      </div>
    </div>
  );
};
```

#### **Backend: Smart Monitoring Service**
```javascript
// wayra-backend/services/monitoring/SmartMonitoringService.js
const { PriceMonitoringEngine } = require('./PriceMonitoringEngine');
const { BudgetOptimizer } = require('./BudgetOptimizer');
const { AutomatedBooker } = require('./AutomatedBooker');
const { NotificationService } = require('../notifications/NotificationService');

class SmartMonitoringService {
  constructor() {
    this.priceMonitor = new PriceMonitoringEngine();
    this.optimizer = new BudgetOptimizer();
    this.booker = new AutomatedBooker();
    this.notifications = new NotificationService();
  }

  async createMonitoringJob(config) {
    try {
      // Validate configuration
      this.validateMonitoringConfig(config);

      // Create monitoring job record
      const job = await this.createJobRecord(config);

      // Start price monitoring
      await this.priceMonitor.startMonitoring(job);

      // Schedule regular checks
      this.scheduleMonitoringChecks(job);

      // Update component status
      await this.updateComponentStatus(config.componentId, {
        monitoringStatus: 'active',
        monitoringJobId: job.id,
        budgetTarget: config.budgetTarget
      });

      return job;

    } catch (error) {
      console.error('Error creating monitoring job:', error);
      throw error;
    }
  }

  async createJobRecord(config) {
    const job = {
      id: this.generateJobId(),
      itineraryId: config.itineraryId,
      componentId: config.componentId,
      componentType: config.componentType,
      status: 'active',
      budgetTarget: config.budgetTarget,
      preferences: config.preferences,
      automationLevel: config.automationLevel,
      searchCriteria: config.searchCriteria,
      createdAt: new Date(),
      lastChecked: null,
      bestDealFound: null,
      checksPerformed: 0
    };

    // Save to database
    await this.saveJobToDatabase(job);
    
    return job;
  }

  async checkForDeals(jobId) {
    try {
      const job = await this.getMonitoringJob(jobId);
      if (!job || job.status !== 'active') {
        return;
      }

      // Get current market data
      const currentDeals = await this.priceMonitor.getCurrentDeals(job.searchCriteria);
      
      // Filter deals within budget
      const viableDeals = currentDeals.filter(deal => 
        deal.price <= job.budgetTarget
      );

      // Update job with latest check
      await this.updateJobLastChecked(jobId);

      if (viableDeals.length > 0) {
        // Find best deal using optimization engine
        const bestDeal = await this.optimizer.selectBestDeal(viableDeals, job.preferences);
        
        // Update job with best deal found
        await this.updateJobBestDeal(jobId, bestDeal);

        // Handle based on automation level
        await this.handleDealFound(job, bestDeal);
      }

    } catch (error) {
      console.error(`Error checking deals for job ${jobId}:`, error);
      await this.handleMonitoringError(jobId, error);
    }
  }

  async handleDealFound(job, deal) {
    switch (job.automationLevel) {
      case 'notify':
        await this.notifyUserOfDeal(job, deal);
        break;
      case 'approve':
        await this.requestBookingApproval(job, deal);
        break;
      case 'auto':
        await this.executeAutomaticBooking(job, deal);
        break;
    }
  }

  async notifyUserOfDeal(job, deal) {
    // Update component status
    await this.updateComponentStatus(job.componentId, {
      monitoringStatus: 'deal-found',
      bestDeal: deal
    });

    // Send notification
    await this.notifications.sendDealAlert({
      userId: job.userId,
      itineraryId: job.itineraryId,
      componentType: job.componentType,
      deal: deal,
      savings: job.budgetTarget - deal.price
    });
  }

  async requestBookingApproval(job, deal) {
    // Update component status
    await this.updateComponentStatus(job.componentId, {
      monitoringStatus: 'deal-found',
      bestDeal: deal,
      approvalRequired: true
    });

    // Send approval request
    await this.notifications.sendBookingApprovalRequest({
      userId: job.userId,
      itineraryId: job.itineraryId,
      componentType: job.componentType,
      deal: deal,
      approvalUrl: this.generateApprovalUrl(job.id, deal.id)
    });
  }

  async executeAutomaticBooking(job, deal) {
    try {
      // Execute booking
      const booking = await this.booker.bookDeal(deal, job);
      
      // Update component status
      await this.updateComponentStatus(job.componentId, {
        monitoringStatus: 'booked',
        booking: booking,
        actualPrice: deal.price,
        savings: job.budgetTarget - deal.price,
        bookedAt: new Date()
      });

      // Deactivate monitoring job
      await this.deactivateMonitoringJob(job.id);

      // Notify user of successful booking
      await this.notifications.sendBookingConfirmation({
        userId: job.userId,
        itineraryId: job.itineraryId,
        componentType: job.componentType,
        booking: booking,
        savings: job.budgetTarget - deal.price
      });

    } catch (error) {
      console.error('Automatic booking failed:', error);
      await this.handleBookingFailure(job, deal, error);
    }
  }

  async handleBookingFailure(job, deal, error) {
    // Update component status
    await this.updateComponentStatus(job.componentId, {
      monitoringStatus: 'failed',
      lastError: error.message,
      failedDeal: deal
    });

    // Notify user of failure
    await this.notifications.sendBookingFailureAlert({
      userId: job.userId,
      itineraryId: job.itineraryId,
      componentType: job.componentType,
      deal: deal,
      error: error.message
    });

    // Optionally restart monitoring for alternative deals
    if (job.automationLevel !== 'auto') {
      await this.restartMonitoring(job.id);
    }
  }

  scheduleMonitoringChecks(job) {
    // Schedule immediate check
    setTimeout(() => this.checkForDeals(job.id), 1000);

    // Schedule regular checks every 15 minutes
    const interval = setInterval(() => {
      this.checkForDeals(job.id);
    }, 15 * 60 * 1000);

    // Store interval for cleanup
    this.monitoringIntervals = this.monitoringIntervals || new Map();
    this.monitoringIntervals.set(job.id, interval);
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateMonitoringConfig(config) {
    if (!config.itineraryId || !config.componentId || !config.componentType) {
      throw new Error('Missing required configuration fields');
    }
    if (!config.budgetTarget || config.budgetTarget <= 0) {
      throw new Error('Invalid budget target');
    }
    if (!['notify', 'approve', 'auto'].includes(config.automationLevel)) {
      throw new Error('Invalid automation level');
    }
  }

  // Database operations
  async saveJobToDatabase(job) {
    // Implementation depends on your database
    // This is a placeholder for the actual database save operation
    console.log('Saving monitoring job to database:', job.id);
  }

  async updateComponentStatus(componentId, status) {
    // Implementation depends on your database
    // This updates the itinerary component with monitoring status
    console.log('Updating component status:', componentId, status);
  }

  async getMonitoringJob(jobId) {
    // Implementation depends on your database
    // This retrieves the monitoring job from database
    console.log('Getting monitoring job:', jobId);
  }

  async updateJobLastChecked(jobId) {
    // Implementation depends on your database
    console.log('Updating job last checked:', jobId);
  }

  async updateJobBestDeal(jobId, deal) {
    // Implementation depends on your database
    console.log('Updating job best deal:', jobId, deal);
  }
}

module.exports = { SmartMonitoringService };
```

### **API Routes for Stack Integration**

#### **Stack API Routes**
```javascript
// wayra-backend/routes/stacks/enhanced.js
const express = require('express');
const router = express.Router();
const { SmartMonitoringService } = require('../../services/monitoring/SmartMonitoringService');
const { ItineraryService } = require('../../services/itinerary/ItineraryService');
const { authMiddleware } = require('../../middleware/auth');

const monitoringService = new SmartMonitoringService();

// Get flight component data for stack
router.get('/:itineraryId/flight/:componentId', authMiddleware, async (req, res) => {
  try {
    const { itineraryId, componentId } = req.params;
    const userId = req.user.uid;

    // Verify ownership
    const itinerary = await ItineraryService.getItinerary(itineraryId, userId);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Get component data
    const component = await ItineraryService.getComponent(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Get suggested budget allocation
    const budgetAnalysis = await ItineraryService.calculateBudgetAllocation(itineraryId, 'flight');

    res.json({
      ...component,
      suggestedBudget: budgetAnalysis.suggestedFlightBudget,
      totalBudget: itinerary.totalBudget,
      route: `${component.departure} → ${component.destination}`,
      dates: component.dates
    });

  } catch (error) {
    console.error('Error getting flight component:', error);
    res.status(500).json({ error: 'Failed to load component' });
  }
});

// Start flight monitoring
router.post('/:itineraryId/flight/:componentId/monitoring', authMiddleware, async (req, res) => {
  try {
    const { itineraryId, componentId } = req.params;
    const { budgetTarget, preferences, automationLevel } = req.body;
    const userId = req.user.uid;

    // Verify ownership
    const itinerary = await ItineraryService.getItinerary(itineraryId, userId);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Get component for search criteria
    const component = await ItineraryService.getComponent(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Create monitoring configuration
    const monitoringConfig = {
      itineraryId,
      componentId,
      componentType: 'flight',
      budgetTarget,
      preferences,
      automationLevel,
      userId,
      searchCriteria: {
        departure: component.departure,
        destination: component.destination,
        departureDate: component.departureDate,
        returnDate: component.returnDate,
        passengers: component.passengers || 1
      }
    };

    // Start monitoring
    const monitoringJob = await monitoringService.createMonitoringJob(monitoringConfig);

    res.json({
      success: true,
      monitoringJob: {
        id: monitoringJob.id,
        status: monitoringJob.status,
        budgetTarget: monitoringJob.budgetTarget,
        createdAt: monitoringJob.createdAt
      }
    });

  } catch (error) {
    console.error('Error starting flight monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

// Get monitoring status
router.get('/:itineraryId/component/:componentId/monitoring', authMiddleware, async (req, res) => {
  try {
    const { itineraryId, componentId } = req.params;
    const userId = req.user.uid;

    // Verify ownership
    const itinerary = await ItineraryService.getItinerary(itineraryId, userId);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Get monitoring status
    const monitoringStatus = await monitoringService.getComponentMonitoringStatus(componentId);

    res.json(monitoringStatus);

  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ error: 'Failed to get monitoring status' });
  }
});

// Pause/resume monitoring
router.patch('/:itineraryId/component/:componentId/monitoring', authMiddleware, async (req, res) => {
  try {
    const { itineraryId, componentId } = req.params;
    const { action } = req.body; // 'pause' or 'resume'
    const userId = req.user.uid;

    // Verify ownership
    const itinerary = await ItineraryService.getItinerary(itineraryId, userId);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    let result;
    if (action === 'pause') {
      result = await monitoringService.pauseMonitoring(componentId);
    } else if (action === 'resume') {
      result = await monitoringService.resumeMonitoring(componentId);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, status: result.status });

  } catch (error) {
    console.error('Error updating monitoring:', error);
    res.status(500).json({ error: 'Failed to update monitoring' });
  }
});

module.exports = router;
```

---

*This complete code implementation shows how the automated booking feature integrates seamlessly into the existing itinerary-centric stack architecture, enhancing each component with smart monitoring capabilities while preserving the navigation flow and user experience.*

