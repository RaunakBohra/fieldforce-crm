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

  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    return response.json();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getHeaders(true),
    });

    return response.json();
  }
}

export const api = new ApiService();
