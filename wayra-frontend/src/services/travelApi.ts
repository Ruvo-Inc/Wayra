/**
 * Travel API Service
 * Frontend service for interacting with travel search APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  max?: number;
}

export interface HotelSearchParams {
  cityCode?: string;
  destId?: string;
  destType?: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  max?: number;
}

export interface TravelApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface FlightOffer {
  id: string;
  price: {
    currency: string;
    total: string;
    base?: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  source?: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  price: {
    currency: string;
    total: string;
    base?: string;
  };
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  rating?: number;
  amenities?: string[];
  source?: string;
}

class TravelApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<TravelApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Travel API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ==================== FLIGHT SEARCH METHODS ====================

  /**
   * Search flights across all available APIs
   */
  async searchFlights(params: FlightSearchParams): Promise<TravelApiResponse<any>> {
    return this.makeRequest('/api/travel/flights/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search flights using Amadeus API only
   */
  async searchAmadeusFlights(params: FlightSearchParams): Promise<TravelApiResponse<FlightOffer[]>> {
    return this.makeRequest('/api/travel/flights/amadeus', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search flights using Skyscanner API only
   */
  async searchSkyscannerFlights(params: FlightSearchParams & {
    country?: string;
    currency?: string;
    locale?: string;
  }): Promise<TravelApiResponse<any>> {
    return this.makeRequest('/api/travel/flights/skyscanner', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ==================== HOTEL SEARCH METHODS ====================

  /**
   * Search hotels across all available APIs
   */
  async searchHotels(params: HotelSearchParams): Promise<TravelApiResponse<any>> {
    return this.makeRequest('/api/travel/hotels/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search hotels using Amadeus API only
   */
  async searchAmadeusHotels(params: HotelSearchParams): Promise<TravelApiResponse<HotelOffer[]>> {
    return this.makeRequest('/api/travel/hotels/amadeus', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search hotels using Booking.com API only
   */
  async searchBookingHotels(params: HotelSearchParams): Promise<TravelApiResponse<any>> {
    return this.makeRequest('/api/travel/hotels/booking', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get travel API status
   */
  async getApiStatus(): Promise<TravelApiResponse<any>> {
    return this.makeRequest('/api/travel/status');
  }

  /**
   * Get travel API health check
   */
  async getApiHealth(): Promise<TravelApiResponse<any>> {
    return this.makeRequest('/api/travel/health');
  }

  /**
   * Format flight duration from ISO 8601 duration to readable format
   */
  formatDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    
    if (hours && minutes) {
      return `${hours}h ${minutes}m`;
    } else if (hours) {
      return `${hours}h`;
    } else if (minutes) {
      return `${minutes}m`;
    }
    return duration;
  }

  /**
   * Format price for display
   */
  formatPrice(price: { currency: string; total: string }): string {
    const amount = parseFloat(price.total);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(amount);
  }

  /**
   * Format date for API requests (YYYY-MM-DD)
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse date from API response
   */
  parseDate(dateString: string): Date {
    return new Date(dateString);
  }
}

// Export singleton instance
export const travelApiService = new TravelApiService();
export default travelApiService;
