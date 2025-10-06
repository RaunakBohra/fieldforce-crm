const API_URL = import.meta.env.VITE_API_URL;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Contact {
  id: string;
  contactCategory: 'DISTRIBUTION' | 'MEDICAL';
  name: string;
  contactType: string;
  designation?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hospitalName?: string;
  clinicName?: string;
  licenseNumber?: string;
  territory?: string;
  creditLimit?: number;
  paymentTerms?: string;
  visitFrequency?: string;
  preferredDay?: string;
  preferredTime?: string;
  lastVisitDate?: string;
  nextVisitDate?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactStats {
  total: number;
  distribution: number;
  medical: number;
  byType: Record<string, number>;
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateContactData {
  contactCategory?: 'DISTRIBUTION' | 'MEDICAL';
  name: string;
  contactType?: string;
  designation?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hospitalName?: string;
  clinicName?: string;
  licenseNumber?: string;
  territory?: string;
  creditLimit?: number;
  paymentTerms?: string;
  visitFrequency?: string;
  preferredDay?: string;
  preferredTime?: string;
  nextVisitDate?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface ContactQueryParams {
  page?: number;
  limit?: number;
  contactCategory?: 'DISTRIBUTION' | 'MEDICAL';
  contactType?: string;
  city?: string;
  isActive?: boolean;
  search?: string;
}

class ApiService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }));

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return this.handleResponse<AuthResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      });

      return this.handleResponse<AuthResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: this.getHeaders(true),
      });

      return this.handleResponse<User>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Contact Management
  async getContacts(params?: ContactQueryParams): Promise<ApiResponse<ContactListResponse>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/contacts${queryString}`, {
        headers: this.getHeaders(true),
      });

      return this.handleResponse<ContactListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getContactStats(): Promise<ApiResponse<ContactStats>> {
    try {
      const response = await fetch(`${API_URL}/contacts/stats`, {
        headers: this.getHeaders(true),
      });

      return this.handleResponse<ContactStats>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getContact(id: string): Promise<ApiResponse<Contact>> {
    try {
      const response = await fetch(`${API_URL}/contacts/${id}`, {
        headers: this.getHeaders(true),
      });

      return this.handleResponse<Contact>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async createContact(data: CreateContactData): Promise<ApiResponse<Contact>> {
    try {
      const response = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(data),
      });

      return this.handleResponse<Contact>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async updateContact(id: string, data: Partial<CreateContactData>): Promise<ApiResponse<Contact>> {
    try {
      const response = await fetch(`${API_URL}/contacts/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(data),
      });

      return this.handleResponse<Contact>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async deleteContact(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_URL}/contacts/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(true),
      });

      return this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }
}

const api = new ApiService();

export { api };
