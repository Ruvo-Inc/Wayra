/**
 * Mathematical Utilities for Wayra AI Integration
 * Direct reuse from Travel_Agent_LangChain/src/utils/simple_math_operators.py
 * Enhanced with Wayra-specific budget optimization functions
 */

class MathUtils {
  /**
   * Basic mathematical operations - DIRECT REUSE from original repository
   */
  
  static add(a, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) {
      throw new Error('Invalid numbers provided for addition');
    }
    
    return numA + numB;
  }
  
  static multiply(a, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) {
      throw new Error('Invalid numbers provided for multiplication');
    }
    
    return numA * numB;
  }
  
  static divide(a, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) {
      throw new Error('Invalid numbers provided for division');
    }
    
    if (numB === 0) {
      throw new Error('Division by zero is not allowed');
    }
    
    return numA / numB;
  }
  
  static subtract(a, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) {
      throw new Error('Invalid numbers provided for subtraction');
    }
    
    return numA - numB;
  }
  
  /**
   * Budget-specific calculations - DIRECT REUSE with enhancements for Wayra
   */
  
  static calculatePercentage(part, whole) {
    const numPart = parseFloat(part);
    const numWhole = parseFloat(whole);
    
    if (isNaN(numPart) || isNaN(numWhole)) {
      throw new Error('Invalid numbers provided for percentage calculation');
    }
    
    if (numWhole === 0) return 0;
    
    return (numPart / numWhole) * 100;
  }
  
  static budgetPerDay(totalBudget, days) {
    const budget = parseFloat(totalBudget);
    const numDays = parseInt(days);
    
    if (isNaN(budget) || isNaN(numDays)) {
      throw new Error('Invalid numbers provided for budget per day calculation');
    }
    
    if (numDays <= 0) {
      throw new Error('Days must be greater than zero');
    }
    
    return budget / numDays;
  }
  
  static calculateTax(amount, taxRate) {
    const numAmount = parseFloat(amount);
    const numTaxRate = parseFloat(taxRate);
    
    if (isNaN(numAmount) || isNaN(numTaxRate)) {
      throw new Error('Invalid numbers provided for tax calculation');
    }
    
    return numAmount * numTaxRate;
  }
  
  static calculateTotal(baseAmount, taxRate = 0) {
    const tax = this.calculateTax(baseAmount, taxRate);
    return this.add(baseAmount, tax);
  }
  
  /**
   * Enhanced budget optimization functions specific to Wayra's needs
   */
  
  static optimizeBudgetAllocation(totalBudget, categories = {}) {
    const budget = parseFloat(totalBudget);
    
    if (isNaN(budget) || budget <= 0) {
      throw new Error('Invalid total budget provided');
    }
    
    // Default allocation percentages based on travel industry standards
    const defaultAllocation = {
      accommodation: 0.40,    // 40% for hotels/lodging
      transportation: 0.25,   // 25% for flights/transport
      food: 0.20,            // 20% for meals and dining
      activities: 0.15       // 15% for activities and experiences
    };
    
    // Merge with custom categories, ensuring total doesn't exceed 100%
    const allocation = { ...defaultAllocation, ...categories };
    const totalPercentage = Object.values(allocation).reduce((sum, pct) => sum + pct, 0);
    
    if (totalPercentage > 1.01) { // Allow small floating point tolerance
      throw new Error('Budget allocation percentages cannot exceed 100%');
    }
    
    // Calculate actual amounts for each category
    const result = {};
    for (const [category, percentage] of Object.entries(allocation)) {
      result[category] = this.multiply(budget, percentage);
    }
    
    // Add remaining budget if allocation is less than 100%
    if (totalPercentage < 1) {
      result.contingency = this.multiply(budget, 1 - totalPercentage);
    }
    
    return result;
  }
  
  static calculateSavings(originalAmount, optimizedAmount) {
    const original = parseFloat(originalAmount);
    const optimized = parseFloat(optimizedAmount);
    
    if (isNaN(original) || isNaN(optimized)) {
      throw new Error('Invalid amounts provided for savings calculation');
    }
    
    const savings = this.subtract(original, optimized);
    const percentage = original > 0 ? this.calculatePercentage(savings, original) : 0;
    
    return {
      amount: savings,
      percentage: percentage,
      isPositive: savings > 0,
      original: original,
      optimized: optimized
    };
  }
  
  static calculateHotelExpenses(nights, pricePerNight, taxRate = 0.1, fees = 0) {
    const numNights = parseInt(nights);
    const price = parseFloat(pricePerNight);
    const tax = parseFloat(taxRate);
    const additionalFees = parseFloat(fees);
    
    if (isNaN(numNights) || isNaN(price) || isNaN(tax) || isNaN(additionalFees)) {
      throw new Error('Invalid parameters provided for hotel expense calculation');
    }
    
    if (numNights <= 0) {
      throw new Error('Number of nights must be greater than zero');
    }
    
    const baseCost = this.multiply(numNights, price);
    const taxAmount = this.calculateTax(baseCost, tax);
    const total = this.add(this.add(baseCost, taxAmount), additionalFees);
    
    return {
      nights: numNights,
      pricePerNight: price,
      baseCost: baseCost,
      tax: taxAmount,
      fees: additionalFees,
      total: total,
      averagePerNight: this.divide(total, numNights)
    };
  }
  
  static calculateTotalTripExpenses(expenses) {
    const {
      accommodation = 0,
      transportation = 0,
      food = 0,
      activities = 0,
      miscellaneous = 0
    } = expenses;
    
    const categories = [accommodation, transportation, food, activities, miscellaneous];
    
    // Validate all expenses are numbers
    for (const expense of categories) {
      if (isNaN(parseFloat(expense))) {
        throw new Error('All expense categories must be valid numbers');
      }
    }
    
    const total = categories.reduce((sum, expense) => this.add(sum, expense), 0);
    
    return {
      breakdown: {
        accommodation: parseFloat(accommodation),
        transportation: parseFloat(transportation),
        food: parseFloat(food),
        activities: parseFloat(activities),
        miscellaneous: parseFloat(miscellaneous)
      },
      total: total,
      percentages: {
        accommodation: this.calculatePercentage(accommodation, total),
        transportation: this.calculatePercentage(transportation, total),
        food: this.calculatePercentage(food, total),
        activities: this.calculatePercentage(activities, total),
        miscellaneous: this.calculatePercentage(miscellaneous, total)
      }
    };
  }
  
  static optimizePriceComparison(options) {
    if (!Array.isArray(options) || options.length === 0) {
      throw new Error('Options must be a non-empty array');
    }
    
    // Validate all options have required fields
    for (const option of options) {
      if (!option.price || isNaN(parseFloat(option.price))) {
        throw new Error('All options must have a valid price');
      }
    }
    
    // Sort by price (ascending)
    const sortedOptions = options
      .map(option => ({
        ...option,
        price: parseFloat(option.price)
      }))
      .sort((a, b) => a.price - b.price);
    
    const cheapest = sortedOptions[0];
    const mostExpensive = sortedOptions[sortedOptions.length - 1];
    const averagePrice = sortedOptions.reduce((sum, option) => sum + option.price, 0) / sortedOptions.length;
    
    return {
      options: sortedOptions,
      cheapest: cheapest,
      mostExpensive: mostExpensive,
      averagePrice: averagePrice,
      priceRange: {
        min: cheapest.price,
        max: mostExpensive.price,
        difference: this.subtract(mostExpensive.price, cheapest.price)
      },
      savings: {
        maxSavings: this.subtract(mostExpensive.price, cheapest.price),
        savingsPercentage: this.calculatePercentage(
          this.subtract(mostExpensive.price, cheapest.price),
          mostExpensive.price
        )
      }
    };
  }
  
  /**
   * Currency conversion utilities
   */
  
  static convertCurrency(amount, exchangeRate) {
    const numAmount = parseFloat(amount);
    const rate = parseFloat(exchangeRate);
    
    if (isNaN(numAmount) || isNaN(rate)) {
      throw new Error('Invalid amount or exchange rate provided');
    }
    
    if (rate <= 0) {
      throw new Error('Exchange rate must be greater than zero');
    }
    
    return this.multiply(numAmount, rate);
  }
  
  /**
   * Utility functions for rounding and formatting
   */
  
  static roundToDecimals(number, decimals = 2) {
    const num = parseFloat(number);
    const dec = parseInt(decimals);
    
    if (isNaN(num) || isNaN(dec)) {
      throw new Error('Invalid number or decimal places provided');
    }
    
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
  }
  
  static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    const num = parseFloat(amount);
    
    if (isNaN(num)) {
      throw new Error('Invalid amount provided for currency formatting');
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(num);
  }
}

module.exports = MathUtils;

