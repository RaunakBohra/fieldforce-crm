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
  role: 'ADMIN' | 'MANAGER' | 'FIELD_REP';
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

export interface UpcomingVisit {
  id: string;
  name: string;
  contactType: string;
  nextVisitDate: string;
  lastVisitDate: string | null;
}

export interface OverdueVisit {
  id: string;
  name: string;
  contactType: string;
  nextVisitDate: string;
  lastVisitDate: string | null;
  daysPending: number;
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
  territoryId?: string;
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
  territoryId?: string;
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
  checkInTime?: string;
  checkOutTime?: string;
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
  barcode?: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageObjectKey?: string;
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

// Territory Types
export interface Territory {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: 'COUNTRY' | 'STATE' | 'CITY' | 'DISTRICT' | 'ZONE';
  country: string;
  state?: string;
  city?: string;
  pincode?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  children?: {
    id: string;
    name: string;
    code: string;
    type: string;
    isActive: boolean;
  }[];
  users?: User[];
  _count?: {
    users: number;
    children: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TerritoryListResponse {
  territories: Territory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TerritoryQueryParams {
  page?: number;
  limit?: number;
  country?: string;
  state?: string;
  city?: string;
  type?: string;
  parentId?: string;
  isActive?: string;
  search?: string;
}

export interface CreateTerritoryData {
  name: string;
  code: string;
  description?: string;
  type: 'COUNTRY' | 'STATE' | 'CITY' | 'DISTRICT' | 'ZONE';
  country: string;
  state?: string;
  city?: string;
  pincode?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateTerritoryData {
  name?: string;
  code?: string;
  description?: string;
  type?: 'COUNTRY' | 'STATE' | 'CITY' | 'DISTRICT' | 'ZONE';
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  parentId?: string;
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
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'DISPATCHED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  dueDate?: string;
  creditPeriod?: number;
  notes?: string;
  cancellationReason?: string;
  items: OrderItem[];
  payments?: Payment[];
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
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'DISPATCHED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  actualDeliveryDate?: string;
  notes?: string;
}

export interface CancelOrderData {
  reason: string;
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

export interface PaymentListResponse {
  payments: (Payment & {
    order?: {
      orderNumber: string;
      contact: { name: string };
    };
  })[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalCount: number;
  };
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  averagePayment: string;
  paymentModes: Record<string, number>;
  totalOutstanding: number;
  outstandingCount: number;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  paymentMode?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
}

export interface PendingOrder {
  id: string;
  orderNumber: string;
  contact: { name: string; phone?: string };
  totalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  daysPending: number;
  createdAt: string;
}

export interface PendingPaymentsResponse {
  pendingOrders: PendingOrder[];
}

// Dashboard Types
export interface DashboardStats {
  visits: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  orders: {
    total: number;
    pending: number;
    approved: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    collected: number;
    outstanding: number;
  };
  payments: {
    total: number;
    collected: number;
    outstanding: number;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'visit' | 'order' | 'payment';
  title: string;
  status?: string;
  amount?: number;
  paymentMode?: string;
  contactName?: string;
  timestamp: string;
}

export interface DashboardActivitiesResponse {
  activities: DashboardActivity[];
}

export interface TopPerformer {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  totalRevenue: number;
  totalOrders: number;
}

export interface TopPerformersResponse {
  performers: TopPerformer[];
  period: string;
  startDate: string;
}

// User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'MANAGER' | 'FIELD_REP';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'FIELD_REP';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'FIELD_REP';
  isActive?: boolean;
}

// Analytics Types
export interface VisitTrend {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface VisitTrendsResponse {
  trends: VisitTrend[];
  startDate: string;
  endDate: string;
}

export interface RevenueData {
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  deliveredRevenue: number;
}

export interface RevenueDataResponse {
  trends: RevenueData[];
  startDate: string;
  endDate: string;
}

export interface PaymentModeData {
  mode: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PaymentModesResponse {
  paymentModes: PaymentModeData[];
  grandTotal: number;
  startDate: string;
  endDate: string;
}

export interface TerritoryPerformance {
  territoryId: string;
  territoryName: string;
  territoryCode: string;
  territoryType: string;
  contactCount: number;
  orderCount: number;
  deliveredOrders: number;
  totalRevenue: number;
  visitCount: number;
}

export interface TerritoryPerformanceResponse {
  territories: TerritoryPerformance[];
  totals: {
    contacts: number;
    orders: number;
    revenue: number;
    visits: number;
  };
  startDate: string;
  endDate: string;
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

  async getUpcomingVisits(days?: number): Promise<ApiResponse<UpcomingVisit[]>> {
    try {
      const queryString = days ? `?days=${days}` : '';
      const response = await fetch(`${API_URL}/api/contacts/upcoming-visits${queryString}`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<UpcomingVisit[]>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getOverdueVisits(): Promise<ApiResponse<OverdueVisit[]>> {
    try {
      const response = await fetch(`${API_URL}/api/contacts/overdue-visits`, {
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse<OverdueVisit[]>(response);
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

  async uploadVisitPhoto(photo: string, visitId?: string): Promise<ApiResponse<{ objectKey: string }>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/upload-photo`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify({ photo, visitId }),
      });

      return this.handleResponse<{ objectKey: string }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async checkInVisit(data: {
    contactId: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }): Promise<ApiResponse<{ visit: Visit }>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/check-in`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<{ visit: Visit }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async checkOutVisit(
    visitId: string,
    data: {
      purpose?: string;
      notes?: string;
      outcome?: string;
      products?: string[];
      samplesGiven?: Record<string, number>;
      followUpRequired?: boolean;
      followUpNotes?: string;
      nextVisitDate?: string;
      photos?: string[];
    }
  ): Promise<ApiResponse<{ visit: Visit }>> {
    try {
      const response = await fetch(`${API_URL}/api/visits/${visitId}/check-out`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<{ visit: Visit }>(response);
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
    barcode?: string;
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

  async generateSku(): Promise<ApiResponse<{ sku: string }>> {
    try {
      const response = await fetch(`${API_URL}/api/products/generate-sku`, {
        headers: await this.getHeaders(true, false),
      });

      return this.handleResponse<{ sku: string }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async lookupProductByBarcode(barcode: string): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_URL}/api/products/barcode/${encodeURIComponent(barcode)}`, {
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

  async uploadProductImage(productId: string, imageData: string): Promise<ApiResponse<{ imageUrl: string; imageObjectKey: string }>> {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/image`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify({ image: imageData }),
      });

      return this.handleResponse<{ imageUrl: string; imageObjectKey: string }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async deleteProductImage(productId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/image`, {
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
        method: 'PATCH',
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

  async updateOrder(id: string, data: Partial<CreateOrderData>): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'PATCH',
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

  async cancelOrder(id: string, data: CancelOrderData): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${id}/cancel`, {
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

  async getPayments(params?: PaymentQueryParams): Promise<ApiResponse<PaymentListResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.paymentMode) queryParams.append('paymentMode', params.paymentMode);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.minAmount) queryParams.append('minAmount', params.minAmount);
      if (params?.maxAmount) queryParams.append('maxAmount', params.maxAmount);
      if (params?.search) queryParams.append('search', params.search);

      const response = await fetch(`${API_URL}/api/payments?${queryParams}`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<PaymentListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getPaymentStats(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<PaymentStats>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`${API_URL}/api/payments/stats?${queryParams}`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<PaymentStats>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getPendingPayments(): Promise<ApiResponse<PendingPaymentsResponse>> {
    try {
      const response = await fetch(`${API_URL}/api/payments/pending`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<PendingPaymentsResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Dashboard Management
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<DashboardStats>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getRecentActivity(): Promise<ApiResponse<DashboardActivitiesResponse>> {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/recent-activity`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<DashboardActivitiesResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getTopPerformers(): Promise<ApiResponse<TopPerformersResponse>> {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/top-performers`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<TopPerformersResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Analytics Management
  async getVisitTrends(startDate?: string, endDate?: string): Promise<ApiResponse<VisitTrendsResponse>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_URL}/api/analytics/visit-trends${queryString}`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<VisitTrendsResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getOrdersRevenue(startDate?: string, endDate?: string): Promise<ApiResponse<RevenueDataResponse>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_URL}/api/analytics/orders-revenue${queryString}`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<RevenueDataResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getPaymentModes(startDate?: string, endDate?: string): Promise<ApiResponse<PaymentModesResponse>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_URL}/api/analytics/payment-modes${queryString}`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<PaymentModesResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getTerritoryPerformance(startDate?: string, endDate?: string): Promise<ApiResponse<TerritoryPerformanceResponse>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_URL}/api/analytics/territory-performance${queryString}`, {
        method: 'GET',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<TerritoryPerformanceResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // User Management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<UserListResponse>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/users${queryString}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<UserListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getUser(id: string): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<{ user: User }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async createUser(data: CreateUserData): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: await this.getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<{ user: User }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: await this.getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<{ user: User }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(true),
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

  // Reports
  async getVisitsReport(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    fieldRepId?: string;
    contactId?: string;
    format?: 'json' | 'csv';
  }): Promise<ApiResponse<any>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/reports/visits${queryString}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      // Handle CSV downloads
      if (params?.format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visits_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, data: null };
      }

      return this.handleResponse<any>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getOrdersReport(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentStatus?: string;
    fieldRepId?: string;
    contactId?: string;
    format?: 'json' | 'csv';
  }): Promise<ApiResponse<any>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/reports/orders${queryString}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      // Handle CSV downloads
      if (params?.format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, data: null };
      }

      return this.handleResponse<any>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getPaymentsReport(params?: {
    startDate?: string;
    endDate?: string;
    paymentMode?: string;
    fieldRepId?: string;
    contactId?: string;
    format?: 'json' | 'csv';
  }): Promise<ApiResponse<any>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/reports/payments${queryString}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      // Handle CSV downloads
      if (params?.format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, data: null };
      }

      return this.handleResponse<any>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // ============================================================================
  // Territory Management
  // ============================================================================

  async getTerritories(params?: TerritoryQueryParams): Promise<ApiResponse<TerritoryListResponse>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

      const response = await fetch(`${API_URL}/api/territories${queryString}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<TerritoryListResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getTerritory(id: string): Promise<ApiResponse<{ territory: Territory }>> {
    try {
      const response = await fetch(`${API_URL}/api/territories/${id}`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<{ territory: Territory }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async createTerritory(data: CreateTerritoryData): Promise<ApiResponse<{ territory: Territory }>> {
    try {
      const response = await fetch(`${API_URL}/api/territories`, {
        method: 'POST',
        headers: await this.getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<{ territory: Territory }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async updateTerritory(id: string, data: UpdateTerritoryData): Promise<ApiResponse<{ territory: Territory }>> {
    try {
      const response = await fetch(`${API_URL}/api/territories/${id}`, {
        method: 'PUT',
        headers: await this.getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return this.handleResponse<{ territory: Territory }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async deleteTerritory(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_URL}/api/territories/${id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async getTerritoryUsers(territoryId: string): Promise<ApiResponse<{ territory: any; users: User[] }>> {
    try {
      const response = await fetch(`${API_URL}/api/territories/${territoryId}/users`, {
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<{ territory: any; users: User[] }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async assignUserToTerritory(territoryId: string, userId: string): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await fetch(`${API_URL}/api/territories/${territoryId}/users/${userId}`, {
        method: 'PUT',
        headers: await this.getHeaders(true),
        credentials: 'include',
      });

      return this.handleResponse<{ user: User }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // ============================================================================
  // Notification APIs (Day 18)
  // ============================================================================

  async sendPaymentReminder(orderId: string, channel: 'SMS' | 'WHATSAPP'): Promise<ApiResponse<{
    orderId: string;
    orderNumber: string;
    contactName: string;
    outstandingAmount: number;
    daysPending: number;
    channel: string;
    delivered: boolean;
  }>> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/send-reminder`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
        body: JSON.stringify({ channel }),
      });

      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  async notifyProductLaunch(productId: string): Promise<ApiResponse<{
    productId: string;
    productName: string;
    totalUsers: number;
    successCount: number;
    errorCount: number;
    sentToUserIds: string[];
  }>> {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/notify-launch`, {
        method: 'POST',
        headers: await this.getHeaders(true, true),
        credentials: 'include',
      });

      return this.handleResponse(response);
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
