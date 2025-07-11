import { 
  Adventure, 
  Collection, 
  AdventureListResponse, 
  CollectionListResponse,
  CountryListResponse,
  RegionListResponse,
  CityListResponse,
  GeocodeResponse,
  MapData,
  GeographicStats,
  AdventureFormData,
  CollectionFormData,
  TransportationFormData,
  AdventureFilters,
  CollectionFilters,
  GeographyFilters
} from '@/types/adventure';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class AdventureApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from Firebase
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
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
  async getAdventures(filters: AdventureFilters = {}): Promise<AdventureListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<AdventureListResponse>(
      `/api/adventures?${params.toString()}`
    );
  }

  async getPublicAdventures(filters: Partial<AdventureFilters> = {}): Promise<AdventureListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<AdventureListResponse>(
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
    await this.request(`/api/adventures/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadAdventureImages(id: string, files: File[]): Promise<{ images: any[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return this.request<{ images: any[] }>(`/api/adventures/${id}/images`, {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async uploadAdventureAttachments(id: string, files: File[]): Promise<{ attachments: any[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('attachments', file));

    return this.request<{ attachments: any[] }>(`/api/adventures/${id}/attachments`, {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async addAdventureVisit(id: string, visit: {
    startDate: string;
    endDate: string;
    timezone?: string;
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
  async getCollections(filters: CollectionFilters = {}): Promise<CollectionListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<CollectionListResponse>(
      `/api/collections?${params.toString()}`
    );
  }

  async getPublicCollections(filters: Partial<CollectionFilters> = {}): Promise<CollectionListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<CollectionListResponse>(
      `/api/collections/public?${params.toString()}`
    );
  }

  async getCollection(id: string): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${id}`);
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
    await this.request(`/api/collections/${id}`, {
      method: 'DELETE',
    });
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

  async addTransportation(collectionId: string, data: TransportationFormData): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/transportation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransportation(
    collectionId: string, 
    transportId: string, 
    data: Partial<TransportationFormData>
  ): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/transportation/${transportId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransportation(collectionId: string, transportId: string): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/transportation/${transportId}`, {
      method: 'DELETE',
    });
  }

  async addNote(collectionId: string, note: {
    name: string;
    content?: string;
    links?: string[];
    date?: string;
    isPublic?: boolean;
  }): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async addChecklist(collectionId: string, checklist: {
    name: string;
    items?: { text: string }[];
  }): Promise<Collection> {
    return this.request<Collection>(`/api/collections/${collectionId}/checklists`, {
      method: 'POST',
      body: JSON.stringify(checklist),
    });
  }

  async toggleChecklistItem(
    collectionId: string, 
    checklistId: string, 
    itemId: string
  ): Promise<Collection> {
    return this.request<Collection>(
      `/api/collections/${collectionId}/checklists/${checklistId}/items/${itemId}/complete`,
      { method: 'PUT' }
    );
  }

  // Geography API methods
  async getCountries(filters: GeographyFilters = {}): Promise<CountryListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<CountryListResponse>(
      `/api/geography/countries?${params.toString()}`
    );
  }

  async getRegions(countryCode: string, filters: GeographyFilters = {}): Promise<RegionListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<RegionListResponse>(
      `/api/geography/countries/${countryCode}/regions?${params.toString()}`
    );
  }

  async getCities(regionId: string, filters: GeographyFilters = {}): Promise<CityListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<CityListResponse>(
      `/api/geography/regions/${regionId}/cities?${params.toString()}`
    );
  }

  async geocode(latitude: number, longitude: number): Promise<GeocodeResponse> {
    return this.request<GeocodeResponse>('/api/geography/geocode', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async searchGeography(query: string, type: string = 'all'): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      type,
    });

    return this.request(`/api/geography/search?${params.toString()}`);
  }

  async getNearbyLocations(
    latitude: number, 
    longitude: number, 
    maxDistance: number = 50000,
    type: string = 'all'
  ): Promise<any> {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      maxDistance: String(maxDistance),
      type,
    });

    return this.request(`/api/geography/nearby?${params.toString()}`);
  }

  async getTravelStats(): Promise<GeographicStats> {
    return this.request<GeographicStats>('/api/geography/stats');
  }

  async getMapData(includeAdventures: boolean = true): Promise<MapData> {
    const params = new URLSearchParams({
      includeAdventures: String(includeAdventures),
    });

    return this.request<MapData>(`/api/geography/map-data?${params.toString()}`);
  }

  async getAdventureStats(userId?: string): Promise<any> {
    const endpoint = userId ? `/api/adventures/stats/${userId}` : '/api/adventures/stats';
    return this.request(endpoint);
  }
}

// Create singleton instance
const adventureApi = new AdventureApiService();

export default adventureApi;

