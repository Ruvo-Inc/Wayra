/**
 * Wayra Budget Optimizer
 * Advanced budget optimization and cost analysis for travel planning
 */

class BudgetOptimizer {
  constructor() {
    this.costFactors = {
      destination: {
        'low': 0.7,    // Southeast Asia, Eastern Europe
        'medium': 1.0,  // Southern Europe, parts of US
        'high': 1.5,   // Western Europe, Japan, Australia
        'luxury': 2.0  // Switzerland, Norway, luxury destinations
      },
      season: {
        'low': 0.8,    // Off-season
        'shoulder': 1.0, // Shoulder season
        'peak': 1.4    // Peak season
      },
      duration: {
        'short': 1.2,  // 1-3 days (higher daily cost)
        'medium': 1.0, // 4-10 days (optimal)
        'long': 0.9    // 11+ days (economies of scale)
      }
    };
  }

  /**
   * Optimize budget allocation across travel components
   */
  optimizeBudgetAllocation(totalBudget, preferences = {}) {
    const baseAllocation = {
      accommodation: 0.35,
      transportation: 0.25,
      food: 0.20,
      activities: 0.15,
      miscellaneous: 0.05
    };

    // Adjust based on preferences
    let allocation = { ...baseAllocation };

    if (preferences.budgetPriority === 'accommodation') {
      allocation.accommodation += 0.10;
      allocation.food -= 0.05;
      allocation.activities -= 0.05;
    } else if (preferences.budgetPriority === 'activities') {
      allocation.activities += 0.10;
      allocation.accommodation -= 0.05;
      allocation.food -= 0.05;
    } else if (preferences.budgetPriority === 'food') {
      allocation.food += 0.10;
      allocation.accommodation -= 0.05;
      allocation.activities -= 0.05;
    }

    // Calculate actual amounts
    const optimizedBudget = {};
    for (const [category, percentage] of Object.entries(allocation)) {
      optimizedBudget[category] = Math.round(totalBudget * percentage);
    }

    return {
      allocation: allocation,
      amounts: optimizedBudget,
      total: totalBudget,
      recommendations: this.generateBudgetRecommendations(optimizedBudget)
    };
  }

  /**
   * Generate budget recommendations based on allocation
   */
  generateBudgetRecommendations(budgetAmounts) {
    const recommendations = [];

    if (budgetAmounts.accommodation > 2000) {
      recommendations.push({
        category: 'accommodation',
        type: 'luxury',
        suggestion: 'Consider luxury hotels or premium vacation rentals'
      });
    } else if (budgetAmounts.accommodation < 500) {
      recommendations.push({
        category: 'accommodation',
        type: 'budget',
        suggestion: 'Look for hostels, budget hotels, or shared accommodations'
      });
    }

    if (budgetAmounts.food > 1000) {
      recommendations.push({
        category: 'food',
        type: 'premium',
        suggestion: 'Explore fine dining and premium culinary experiences'
      });
    } else if (budgetAmounts.food < 300) {
      recommendations.push({
        category: 'food',
        type: 'budget',
        suggestion: 'Focus on local markets, street food, and cooking facilities'
      });
    }

    if (budgetAmounts.activities > 800) {
      recommendations.push({
        category: 'activities',
        type: 'comprehensive',
        suggestion: 'Include premium tours, experiences, and multiple attractions'
      });
    }

    return recommendations;
  }

  /**
   * Calculate cost adjustments based on destination and timing
   */
  calculateCostAdjustments(destination, travelDates, duration) {
    let costMultiplier = 1.0;

    // Destination cost factor (simplified - in real app, use destination database)
    const destinationLevel = this.getDestinationCostLevel(destination);
    costMultiplier *= this.costFactors.destination[destinationLevel];

    // Season cost factor
    const season = this.getTravelSeason(travelDates);
    costMultiplier *= this.costFactors.season[season];

    // Duration factor
    const durationCategory = this.getDurationCategory(duration);
    costMultiplier *= this.costFactors.duration[durationCategory];

    return {
      multiplier: costMultiplier,
      adjustments: {
        destination: destinationLevel,
        season: season,
        duration: durationCategory
      }
    };
  }

  /**
   * Get destination cost level (simplified categorization)
   */
  getDestinationCostLevel(destination) {
    const lowCostDestinations = ['thailand', 'vietnam', 'india', 'poland', 'hungary'];
    const highCostDestinations = ['switzerland', 'norway', 'japan', 'australia', 'iceland'];
    const luxuryDestinations = ['monaco', 'dubai', 'singapore', 'maldives'];

    const dest = destination.toLowerCase();

    if (luxuryDestinations.some(d => dest.includes(d))) return 'luxury';
    if (highCostDestinations.some(d => dest.includes(d))) return 'high';
    if (lowCostDestinations.some(d => dest.includes(d))) return 'low';
    
    return 'medium'; // Default
  }

  /**
   * Determine travel season based on dates
   */
  getTravelSeason(travelDates) {
    if (!travelDates || !travelDates.start) return 'shoulder';

    const startDate = new Date(travelDates.start);
    const month = startDate.getMonth() + 1; // 1-12

    // Simplified seasonal categorization (Northern Hemisphere bias)
    if ([12, 1, 2, 6, 7, 8].includes(month)) return 'peak';
    if ([3, 4, 5, 9, 10, 11].includes(month)) return 'shoulder';
    
    return 'shoulder';
  }

  /**
   * Categorize trip duration
   */
  getDurationCategory(duration) {
    if (duration <= 3) return 'short';
    if (duration <= 10) return 'medium';
    return 'long';
  }

  /**
   * Generate money-saving tips
   */
  generateMoneySavingTips(budgetAmounts, destination) {
    const tips = [
      'Book accommodations and flights well in advance for better rates',
      'Consider traveling during shoulder season for lower costs',
      'Use public transportation instead of taxis when possible',
      'Look for free walking tours and activities',
      'Eat at local restaurants rather than tourist areas'
    ];

    // Add destination-specific tips
    if (budgetAmounts.accommodation < 800) {
      tips.push('Consider vacation rentals or hostels for budget accommodation');
    }

    if (budgetAmounts.food < 500) {
      tips.push('Visit local markets and cook some meals yourself');
    }

    return tips;
  }

  /**
   * Calculate daily budget breakdown
   */
  calculateDailyBudget(totalBudget, duration) {
    const dailyBudget = totalBudget / duration;
    
    return {
      total: Math.round(dailyBudget),
      accommodation: Math.round(dailyBudget * 0.35),
      food: Math.round(dailyBudget * 0.20),
      activities: Math.round(dailyBudget * 0.15),
      transportation: Math.round(dailyBudget * 0.25),
      miscellaneous: Math.round(dailyBudget * 0.05)
    };
  }

  /**
   * Validate budget feasibility
   */
  validateBudgetFeasibility(budget, destination, duration, travelers) {
    const minDailyBudget = this.getMinimumDailyBudget(destination);
    const requiredBudget = minDailyBudget * duration * travelers;

    return {
      feasible: budget >= requiredBudget,
      providedBudget: budget,
      minimumRequired: requiredBudget,
      dailyMinimum: minDailyBudget,
      recommendations: budget < requiredBudget ? 
        this.generateBudgetIncreaseSuggestions(requiredBudget - budget) : []
    };
  }

  /**
   * Get minimum daily budget for destination
   */
  getMinimumDailyBudget(destination) {
    const destinationLevel = this.getDestinationCostLevel(destination);
    const baseBudgets = {
      'low': 30,
      'medium': 60,
      'high': 100,
      'luxury': 200
    };

    return baseBudgets[destinationLevel];
  }

  /**
   * Generate suggestions for budget increases
   */
  generateBudgetIncreaseSuggestions(shortfall) {
    return [
      `Consider increasing your budget by $${shortfall} for a more comfortable trip`,
      'Extend your planning timeline to save more money',
      'Consider traveling during off-season for lower costs',
      'Look into group discounts or package deals'
    ];
  }
}

module.exports = { BudgetOptimizer };
