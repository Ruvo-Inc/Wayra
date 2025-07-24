import { 
  Adventure, 
  Collection, 
  AdventureFormData,
  CollectionFormData,
  AdventureFilters,
  CollectionFilters
} from '@/types/adventure';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class AdventureApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 AdventureApi - Making request to:', url);
    console.log('🌐 AdventureApi - Request options:', { method: options.method || 'GET', ...options });
    
    // Get auth token from Firebase
    const token = await this.getAuthToken();
    console.log('🔐 AdventureApi - Auth token:', token ? `Present (${token.length} chars)` : 'Missing');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    console.log('🌐 AdventureApi - Final config headers:', config.headers);

    try {
      const response = await fetch(url, config);
      console.log('🌐 AdventureApi - Response status:', response.status, response.statusText);
      console.log('🌐 AdventureApi - Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('❌ AdventureApi - Error response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          console.log('❌ AdventureApi - JSON error data:', errorData);
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } else {
          // Handle HTML error pages (like 404s)
          const errorText = await response.text();
          console.error('❌ AdventureApi - HTML error response:', errorText.substring(0, 500));
          throw new Error(`HTTP ${response.status}: ${response.statusText} - Received HTML instead of JSON`);
        }
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('✅ AdventureApi - Success response content-type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        console.log('✅ AdventureApi - JSON response data:', jsonData);
        return jsonData;
      } else {
        const responseText = await response.text();
        console.error('❌ AdventureApi - Non-JSON success response:', responseText.substring(0, 500));
        throw new Error('Expected JSON response but received HTML');
      }
    } catch (error) {
      console.error(`❌ AdventureApi - Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    // Integrate with Firebase auth
    if (typeof window !== 'undefined') {
      try {
        const { auth } = await import('@/lib/firebase');
        console.log('🔐 Auth Debug - Firebase auth object:', !!auth);
        console.log('🔐 Auth Debug - Current user:', !!auth?.currentUser);
        console.log('🔐 Auth Debug - User email:', auth?.currentUser?.email);
        
        if (auth && auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          console.log('🔐 Auth Debug - Token retrieved:', !!token);
          console.log('🔐 Auth Debug - Token length:', token?.length);
          return token;
        } else {
          console.warn('🔐 Auth Debug - No authenticated user found');
        }
      } catch (error) {
        console.error('🔐 Auth Debug - Error getting Firebase auth token:', error);
      }
    } else {
      console.warn('🔐 Auth Debug - Not in browser environment');
    }
    return null;
  }

  // Adventure API methods
  async getAdventures(filters: AdventureFilters = {}): Promise<{ adventures: Adventure[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<{ adventures: Adventure[]; total: number }>(
      `/api/adventures?${params.toString()}`
    );
  }

  async getPublicAdventures(filters: Partial<AdventureFilters> = {}): Promise<{ adventures: Adventure[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<{ adventures: Adventure[]; total: number }>(
      `/api/adventures/public?${params.toString()}`
    );
  }

  async getAdventure(id: string): Promise<Adventure> {
    return this.request<Adventure>(`/api/adventures/${id}`);
  }

  async createAdventure(data: AdventureFormData): Promise<Adventure> {
    return this.request<Adventure>('/api/adventures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdventure(id: string, data: Partial<AdventureFormData>): Promise<Adventure> {
    return this.request<Adventure>(`/api/adventures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdventure(id: string): Promise<void> {
    console.log('🗑️ AdventureApi.deleteAdventure called with ID:', id);
    try {
      console.log('📡 Making DELETE request to:', `/api/adventures/${id}`);
      const response = await this.request(`/api/adventures/${id}`, {
        method: 'DELETE',
      });
      console.log('✅ Delete API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Delete API error:', error);
      throw error;
    }
  }

  async uploadAdventureImages(id: string, files: File[]): Promise<{ images: Array<{ url: string; caption?: string; isPrimary: boolean }> }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    return this.request<{ images: Array<{ url: string; caption?: string; isPrimary: boolean }> }>(`/api/adventures/${id}/images`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async uploadAdventureAttachments(id: string, files: File[]): Promise<{ attachments: Array<{ url: string; name: string; type: string }> }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    return this.request<{ attachments: Array<{ url: string; name: string; type: string }> }>(`/api/adventures/${id}/attachments`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async addAdventureVisit(id: string, visit: {
    startDate: string;
    endDate?: string;
    notes?: string;
  }): Promise<Adventure> {
    return this.request<Adventure>(`/api/adventures/${id}/visits`, {
      method: 'POST',
      body: JSON.stringify(visit),
    });
  }

  async getNearbyAdventures(
    longitude: number, 
    latitude: number, 
    maxDistance: number = 10000,
    limit: number = 20
  ): Promise<Adventure[]> {
    const params = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      maxDistance: String(maxDistance),
      limit: String(limit),
    });

    return this.request<Adventure[]>(`/api/adventures/nearby?${params.toString()}`);
  }

  // Collection API methods
  async getCollections(filters: CollectionFilters = {}): Promise<{ collections: Collection[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<{ collections: Collection[]; total: number }>(
      `/api/collections?${params.toString()}`
    );
  }

  async getPublicCollections(filters: Partial<CollectionFilters> = {}): Promise<{ collections: Collection[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<{ collections: Collection[]; total: number }>(
      `/api/collections/public?${params.toString()}`
    );
  }

  async getCollection(id: string): Promise<Collection> {
    console.log('🔍 AdventureApi - getCollection called with ID:', id);
    console.log('🔍 AdventureApi - ID type:', typeof id, 'length:', id?.length);
    console.log('🔍 AdventureApi - API_BASE_URL:', API_BASE_URL);
    
    // Validate collection ID format
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ AdventureApi - Invalid collection ID:', id);
      throw new Error('Invalid collection ID provided');
    }
    
    // Check if ID looks like a valid MongoDB ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error('❌ AdventureApi - Collection ID is not valid MongoDB ObjectId format:', id);
      throw new Error('Collection ID must be a valid MongoDB ObjectId');
    }
    
    const endpoint = `/api/collections/${id}`;
    console.log('🔍 AdventureApi - Full URL will be:', `${API_BASE_URL}${endpoint}`);
    
    try {
      const result = await this.request<Collection>(endpoint);
      console.log('✅ AdventureApi - getCollection success:', result);
      return result;
    } catch (error) {
      console.error('❌ AdventureApi - getCollection failed:', error);
      throw error;
    }
  }

  async createCollection(data: CollectionFormData): Promise<Collection> {
    return this.request<Collection>('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: Partial<CollectionFormData>): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string): Promise<void> {
    console.log('🗑️ [API] deleteCollection called with ID:', id);
    console.log('🗑️ [API] ID type:', typeof id, 'length:', id.length);
    console.log('🗑️ [API] API_BASE_URL:', API_BASE_URL);
    console.log('🗑️ [API] Full URL will be:', `${API_BASE_URL}/api/collections/${id}`);
    
    try {
      await this.request(`/api/collections/${id}`, {
        method: 'DELETE',
      });
      console.log('✅ [API] deleteCollection success');
    } catch (error) {
      console.error('❌ [API] deleteCollection error:', error);
      throw error;
    }
  }

  async addAdventureToCollection(collectionId: string, adventureId: string): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/adventures`, {
      method: 'POST',
      body: JSON.stringify({ adventureId }),
    });
  }

  async removeAdventureFromCollection(collectionId: string, adventureId: string): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/adventures/${adventureId}`, {
      method: 'DELETE',
    });
  }

  async shareCollection(collectionId: string, userIds: string[], role: string = 'viewer'): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/share`, {
      method: 'POST',
      body: JSON.stringify({ userIds, role }),
    });
  }

  async removeCollaborator(collectionId: string, userId: string): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/share/${userId}`, {
      method: 'DELETE',
    });
  }

  // Adventure and Collection stats
  async getAdventureStats(userId?: string): Promise<{ totalAdventures: number; visitedAdventures: number; plannedAdventures: number; uniqueCountries: number; averageRating: number }> {
    const endpoint = userId ? `/api/adventures/stats/${userId}` : '/api/adventures/stats';
    return this.request(endpoint);
  }

  async getCollectionStats(userId?: string): Promise<{ totalCollections: number; publicCollections: number; sharedCollections: number; totalAdventures: number; averageDuration: number }> {
    const endpoint = userId ? `/api/collections/stats/${userId}` : '/api/collections/stats';
    return this.request(endpoint);
  }

  // Combined stats method for statistics page
  async getStats(options: { timeRange?: 'all' | 'year' | 'month' } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (options.timeRange) {
      params.append('timeRange', options.timeRange);
    }
    
    const endpoint = `/api/adventures/stats${params.toString() ? '?' + params.toString() : ''}`;
    return this.request(endpoint);
  }

  // Geography data method for geography page
  async getGeographyData(): Promise<any> {
    try {
      // Get all geography data in parallel
      const [countries, cities, stats, mapData] = await Promise.all([
        this.request('/api/geography/countries'),
        this.request('/api/geography/cities'), 
        this.request('/api/geography/stats'),
        this.request('/api/geography/map-data')
      ]);

      // Combine the data for the geography page
      return {
        visitedCountries: countries.countries || [],
        visitedCities: cities.cities || [],
        nearbyAdventures: [], // Will be populated by geolocation
        stats: {
          totalCountries: countries.total || 0,
          totalCities: cities.total || 0,
          totalContinents: stats.geography?.continents || 0,
          mostVisitedCountry: stats.geography?.mostVisitedCountry || '',
          mostVisitedCity: stats.geography?.mostVisitedCity || ''
        }
      };
    } catch (error) {
      console.error('Error fetching geography data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const adventureApi = new AdventureApiService();

export default adventureApi;
export { AdventureApiService as AdventureApi };

