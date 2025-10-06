import { getCsrfToken, getCsrfHeaderName } from '../utils/csrf';

const API_URL = import.meta.env.VITE_API_URL || 'https://crm-api.raunakbohra.com';

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

// Visit Types
export interface Visit {
  id: string;
  visitDate: string;
  visitType: 'FIELD_VISIT' | 'FOLLOW_UP' | 'EMERGENCY' | 'PLANNED' | 'COLD_CALL' | 'VIRTUAL' | 'EVENT';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED' | 'NO_SHOW';
  duration?: number;
  contactId: string;
  contact?: {
    id: string;
    name: string;
    designation?: string;
    specialty?: string;
    contactType: string;
    phone?: string;
    email?: string;
    hospitalName?: string;
    clinicName?: string;
  };
  fieldRepId: string;
  fieldRep?: {
    id: string;
    name: string;
    email: string;
  };
  latitude?: number;
  longitude?: number;
  locationName?: string;
  purpose?: string;
  notes?: string;
  outcome: 'SUCCESSFUL' | 'PARTIAL' | 'UNSUCCESSFUL' | 'FOLLOW_UP_NEEDED' | 'ORDER_PLACED' | 'SAMPLE_GIVEN' | 'INFORMATION_ONLY';
  nextVisitDate?: string;
  products?: string[];
  samplesGiven?: Record<string, number>;
  marketingMaterials?: string[];
  followUpRequired: boolean;
  followUpNotes?: string;
  attachments?: string[];
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VisitStats {
  totalVisits: number;
  plannedVisits: number;
  completedVisits: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  byType: Record<string, number>;
  byOutcome: Record<string, number>;
}

export interface VisitListResponse {
  visits: Visit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateVisitData {
  contactId: string;
  visitDate?: string;
  visitType?: 'FIELD_VISIT' | 'FOLLOW_UP' | 'EMERGENCY' | 'PLANNED' | 'COLD_CALL' | 'VIRTUAL' | 'EVENT';
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED' | 'NO_SHOW';
  latitude?: number;
  longitude?: number;
  locationName?: string;
  purpose?: string;
  notes?: string;
  outcome?: 'SUCCESSFUL' | 'PARTIAL' | 'UNSUCCESSFUL' | 'FOLLOW_UP_NEEDED' | 'ORDER_PLACED' | 'SAMPLE_GIVEN' | 'INFORMATION_ONLY';
  duration?: number;
  nextVisitDate?: string;
  products?: string[];
  samplesGiven?: Record<string, number>;
  marketingMaterials?: string[];
  followUpRequired?: boolean;
  followUpNotes?: string;
  attachments?: string[];
  photos?: string[];
}

export interface VisitQueryParams {
  page?: number;
  limit?: number;
  contactId?: string;
  fieldRepId?: string;
  visitType?: string;
  status?: string;
  outcome?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
}

// Order Types
export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  contactId: string;
  contact?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    contactType: string;
  };
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateOrderData {
  contactId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface UpdateOrderStatusData {
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  actualDeliveryDate?: string;
  notes?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  contactId?: string;
  startDate?: string;
  endDate?: string;
}

// Payment Types
export interface Payment {
  id: string;
  paymentNumber: string;
  orderId: string;
  amount: number;
  paymentMode: 'CASH' | 'CHEQUE' | 'NEFT' | 'UPI' | 'CARD' | 'OTHER';
  paymentDate: string;
  referenceNumber?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  orderId: string;
  amount: number;
  paymentMode: 'CASH' | 'CHEQUE' | 'NEFT' | 'UPI' | 'CARD' | 'OTHER';
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

class ApiService {
  private async getHeaders(includeAuth: boolean = false, includeCsrf: boolean = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (includeCsrf) {
      try {
        const csrfToken = await getCsrfToken();
        headers[getCsrfHeaderName()] = csrfToken;
      } catch (error) {
        console.warn('Failed to get CSRF token:', error);
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
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: await this.getHeaders(),
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: await this.getHeaders(),
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
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
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

      const response = await fetch(`${API_URL}/api/contacts${queryString}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/api/contacts/stats`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/api/contacts/${id}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/api/contacts/${id}`, {
        method: 'PUT',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Visit Management
  async getVisits(params?: VisitQueryParams): Promise<ApiResponse<VisitListResponse>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/visits${queryString}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<VisitListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getVisitStats(): Promise<ApiResponse<VisitStats>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/stats`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<VisitStats>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getVisit(id: string): Promise<ApiResponse<Visit>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/${id}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<Visit>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async createVisit(data: CreateVisitData): Promise<ApiResponse<Visit>> {
    try {
      const response = await fetch(`${API_URL}/api/visits`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Visit>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async updateVisit(id: string, data: Partial<CreateVisitData>): Promise<ApiResponse<Visit>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/${id}`, {
        method: 'PUT',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Visit>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async deleteVisit(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/${id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Product Management
  async getProducts(params?: ProductQueryParams): Promise<ApiResponse<ProductListResponse>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/products${queryString}`, {
        headers: await this.getHeaders(true, false),
      });

      return this.handleResponse<ProductListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        headers: await this.getHeaders(true, false),
      });

      return this.handleResponse<Product>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getProductCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${API_URL}/api/products/categories/list`, {
        headers: await this.getHeaders(true, false),
      });

      return this.handleResponse<string[]>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async createProduct(data: {
    name: string;
    sku: string;
    description?: string;
    category: string;
    price: number;
    stock: number;
  }): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Product>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Product>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Order Management
  async getOrders(params?: OrderQueryParams): Promise<ApiResponse<OrderListResponse>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/orders${queryString}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<OrderListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/stats`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<OrderStats>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<Order>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Order>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusData): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Order>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async cancelOrder(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Payment Management
  async createPayment(data: CreatePaymentData): Promise<ApiResponse<Payment>> {
    try {
      const response = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<Payment>(response);
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
