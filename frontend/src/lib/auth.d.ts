import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';
export declare const authApi: {
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    register(data: RegisterData): Promise<{
        user: User;
    }>;
    logout(): Promise<void>;
    refreshToken(): Promise<AuthResponse>;
    getCurrentUser(): Promise<{
        user: User;
    }>;
    getStoredUser(): User | null;
    getStoredToken(): string | null;
    storeAuth(token: string, user: User): void;
    clearAuth(): void;
};
//# sourceMappingURL=auth.d.ts.map