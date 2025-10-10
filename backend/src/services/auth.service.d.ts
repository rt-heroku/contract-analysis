import { RegisterData, LoginCredentials, JWTPayload } from '../types';
declare class AuthService {
    private readonly SALT_ROUNDS;
    /**
     * Register a new user
     */
    register(data: RegisterData): Promise<{
        id: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
    }>;
    /**
     * Login user
     */
    login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<{
        token: string;
        expiresAt: Date;
        user: {
            id: number;
            email: string;
            firstName: string | null;
            lastName: string | null;
            roles: string[];
        };
    }>;
    /**
     * Logout user
     */
    logout(token: string): Promise<void>;
    /**
     * Refresh token
     */
    refreshToken(oldToken: string, ipAddress?: string, userAgent?: string): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    /**
     * Generate JWT token
     */
    generateToken(payload: JWTPayload, longExpiration?: boolean): string;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): JWTPayload;
    /**
     * Change password
     */
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Clean expired sessions
     */
    cleanExpiredSessions(): Promise<void>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map