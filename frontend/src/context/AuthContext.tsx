import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '@/types';
import { authApi } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    console.debug('🔐 [AuthContext] Initializing, checking for stored credentials...');
    const storedUser = authApi.getStoredUser();
    const storedToken = authApi.getStoredToken();

    console.debug('🔐 [AuthContext] Token found:', !!storedToken);
    console.debug('🔐 [AuthContext] User found:', storedUser ? storedUser.email : 'none');

    // Use a small timeout to ensure state updates are batched correctly
    // This prevents race conditions where components check auth before state is set
    const timer = setTimeout(() => {
      if (storedUser && storedToken) {
        console.debug('🔐 [AuthContext] Setting user as authenticated');
        setUser(storedUser);
      } else {
        console.debug('🔐 [AuthContext] No valid credentials found');
      }
      setIsLoading(false);
    }, 0); // 0ms timeout ensures this runs after current execution stack

    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      console.debug('🔐 [AuthContext] Login called for:', credentials.email);
      const response = await authApi.login(credentials);
      console.debug('🔐 [AuthContext] Login API response received:', response);
      console.debug('🔐 [AuthContext] Token length:', response.token?.length, 'User:', response.user?.email);
      console.debug('🔐 [AuthContext] Storing auth with stayLoggedIn:', credentials.stayLoggedIn);
      authApi.storeAuth(response.token, response.user, credentials.stayLoggedIn);
      console.debug('🔐 [AuthContext] Auth stored, setting state...');
      setUser(response.user);
      console.debug('🔐 [AuthContext] State updated, user is now authenticated');
    } catch (error) {
      console.error('🔐 [AuthContext] Login error:', error);
      throw new Error(handleApiError(error));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      console.debug('🔐 [AuthContext] Register called for:', data.email);
      await authApi.register(data);
      // After registration, automatically log in
      await login({
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      console.error('🔐 [AuthContext] Register error:', error);
      throw new Error(handleApiError(error));
    }
  };

  const logout = async () => {
    console.debug('🔐 [AuthContext] Logout called');
    console.trace('🔐 [AuthContext] Logout stack trace');
    try {
      await authApi.logout();
      console.debug('🔐 [AuthContext] Logout API call completed');
    } catch (error) {
      console.error('🔐 [AuthContext] Logout error:', error);
      // Ignore error, clear auth anyway
    } finally {
      authApi.clearAuth();
      setUser(null);
      console.debug('🔐 [AuthContext] User logged out, state cleared');
    }
  };

  const refreshAuth = async () => {
    console.debug('🔐 [AuthContext] Refreshing auth...');
    try {
      const response = await authApi.getCurrentUser();
      console.debug('🔐 [AuthContext] Got current user:', response.user.email);
      setUser(response.user);
      authApi.storeAuth(authApi.getStoredToken() || '', response.user);
    } catch (error) {
      console.error('🔐 [AuthContext] Refresh auth failed:', error);
      authApi.clearAuth();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

