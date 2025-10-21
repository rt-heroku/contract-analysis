import api from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<{ user: User }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    
    // Clear from both storages
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stayLoggedIn');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getStoredUser(): User | null {
    // Check both storages
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    // Check both storages
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  storeAuth(token: string, user: User, stayLoggedIn = false): void {
    // Store the preference
    if (stayLoggedIn) {
      localStorage.setItem('stayLoggedIn', 'true');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Clear from sessionStorage if it was there
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      localStorage.setItem('stayLoggedIn', 'false');
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // Don't store in localStorage for session-only login
    }
  },

  clearAuth(): void {
    // Clear from both storages
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stayLoggedIn');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
};


