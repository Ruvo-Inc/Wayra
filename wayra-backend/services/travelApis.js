/**
 * Travel API Integration Service
 * Handles integration with Amadeus, Skyscanner, and Booking.com APIs
 */

const axios = require('axios');

class TravelApiService {
  constructor() {
    this.amadeus = {
      baseUrl: 'https://test.api.amadeus.com/v2',
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
      accessToken: null,
      tokenExpiry: null
    };

    this.skyscanner = {
      baseUrl: 'https://partners.api.skyscanner.net/apiservices',
      apiKey: process.env.SKYSCANNER_API_KEY
    };

    this.booking = {
      baseUrl: 'https://distribution-xml.booking.com/json/bookings',
      username: process.env.BOOKING_USERNAME,
      password: process.env.BOOKING_PASSWORD
    };
  }

  // ==================== AMADEUS API METHODS ====================

  /**
   * Get Amadeus access token
   */
  async getAmadeusToken() {
    if (this.amadeus.accessToken && this.amadeus.tokenExpiry > Date.now()) {
      return this.amadeus.accessToken;
    }

    try {
      const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', {
        grant_type: 'client_credentials',
        client_id: this.amadeus.clientId,
        client_secret: this.amadeus.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.amadeus.accessToken = response.data.access_token;
      this.amadeus.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.amadeus.accessToken;
    } catch (error) {
      console.error('Amadeus token error:', error.response?.data || error.message);
      throw new Error('Failed to get Amadeus access token');
    }
  }

  /**
   * Search flights using Amadeus API
   */
  async searchFlights(params) {
    try {
      const token = await this.getAmadeusToken();
      
      const searchParams = {
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.adults || 1,
        max: params.max || 10,
        currencyCode: 'USD'
      };

      if (params.returnDate) {
        searchParams.returnDate = params.returnDate;
      }

      const response = await axios.get(`${this.amadeus.baseUrl}/shopping/flight-offers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: searchParams
      });

      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
        source: 'amadeus'
      };
    } catch (error) {
      console.error('Amadeus flight search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        source: 'amadeus'
      };
    }
  }

  /**
   * Search airports and cities using Amadeus API
   */
  async searchLocations(query, subType = 'AIRPORT,CITY') {
    try {
      const token = await this.getAmadeusToken();
      
      const searchParams = {
        keyword: query,
        subType: subType,
        'page[limit]': 10
      };

      const response = await axios.get('https://test.api.amadeus.com/v1/reference-data/locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: searchParams
      });

      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
        source: 'amadeus'
      };
    } catch (error) {
      console.error('Amadeus location search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        source: 'amadeus'
      };
    }
  }

  /**
   * Search hotels using Amadeus API
   * Note: Hotel search API endpoint may not be available with current credentials
   */
  async searchHotels(params) {
    try {
      const token = await this.getAmadeusToken();
      
      // Try direct hotel offers search by city
      const searchParams = {
        cityCode: params.cityCode,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults || 1,
        currency: 'USD',
        roomQuantity: 1
      };

      console.log('Hotel search params:', searchParams);

      const response = await axios.get(`${this.amadeus.baseUrl}/shopping/hotel-offers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: searchParams
      });

      console.log('Hotel search response:', response.data);

      return {
        success: true,
        data: response.data.data || [],
        meta: response.data.meta || { count: 0 },
        source: 'amadeus'
      };
    } catch (error) {
      console.error('Amadeus hotel search error:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      
      // Check if it's a 404 error (endpoint not found)
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Hotel search is currently unavailable. The Amadeus hotel search API endpoint may not be accessible with current credentials. Please try flight search instead.',
          source: 'amadeus',
          code: 'HOTEL_SEARCH_UNAVAILABLE'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        source: 'amadeus'
      };
    }
  }

  // ==================== SKYSCANNER API METHODS ====================

  /**
   * Search flights using Skyscanner API
   */
  async searchSkyscannerFlights(params) {
    try {
      const searchParams = {
        apikey: this.skyscanner.apiKey,
        country: params.country || 'US',
        currency: 'USD',
        locale: params.locale || 'en-US',
        originplace: params.origin,
        destinationplace: params.destination,
        outbounddate: params.departureDate,
        adults: params.adults || 1
      };

      if (params.returnDate) {
        searchParams.inbounddate = params.returnDate;
      }

      const response = await axios.get(`${this.skyscanner.baseUrl}/browsequotes/v1.0/${searchParams.country}/${searchParams.currency}/${searchParams.locale}/${searchParams.originplace}/${searchParams.destinationplace}/${searchParams.outbounddate}`, {
        params: {
          apikey: this.skyscanner.apiKey
        }
      });

      return {
        success: true,
        data: response.data,
        source: 'skyscanner'
      };
    } catch (error) {
      console.error('Skyscanner flight search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        source: 'skyscanner'
      };
    }
  }

  // ==================== BOOKING.COM API METHODS ====================

  /**
   * Search hotels using Booking.com API
   */
  async searchBookingHotels(params) {
    try {
      const searchParams = {
        checkin: params.checkInDate,
        checkout: params.checkOutDate,
        dest_id: params.destId,
        dest_type: params.destType || 'city',
        adults: params.adults || 1,
        rows: params.max || 10
      };

      const response = await axios.get(`${this.booking.baseUrl}`, {
        auth: {
          username: this.booking.username,
          password: this.booking.password
        },
        params: searchParams
      });

      return {
        success: true,
        data: response.data,
        source: 'booking'
      };
    } catch (error) {
      console.error('Booking.com hotel search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        source: 'booking'
      };
    }
  }

  // ==================== UNIFIED SEARCH METHODS ====================

  /**
   * Unified flight search across multiple APIs
   */
  async searchAllFlights(params) {
    const results = {
      amadeus: null,
      skyscanner: null,
      timestamp: new Date().toISOString()
    };

    // Search Amadeus flights
    if (this.amadeus.clientId && this.amadeus.clientSecret) {
      results.amadeus = await this.searchFlights(params);
    }

    // Search Skyscanner flights
    if (this.skyscanner.apiKey) {
      results.skyscanner = await this.searchSkyscannerFlights(params);
    }

    return results;
  }

  /**
   * Unified hotel search across multiple APIs
   */
  async searchAllHotels(params) {
    const results = {
      amadeus: null,
      booking: null,
      timestamp: new Date().toISOString()
    };

    // Search Amadeus hotels
    if (this.amadeus.clientId && this.amadeus.clientSecret) {
      results.amadeus = await this.searchHotels(params);
    }

    // Search Booking.com hotels
    if (this.booking.username && this.booking.password) {
      results.booking = await this.searchBookingHotels(params);
    }

    return results;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get API status and configuration
   */
  getApiStatus() {
    return {
      amadeus: {
        configured: !!(this.amadeus.clientId && this.amadeus.clientSecret),
        hasToken: !!this.amadeus.accessToken,
        tokenExpiry: this.amadeus.tokenExpiry
      },
      skyscanner: {
        configured: !!this.skyscanner.apiKey
      },
      booking: {
        configured: !!(this.booking.username && this.booking.password)
      }
    };
  }
}

module.exports = TravelApiService;
