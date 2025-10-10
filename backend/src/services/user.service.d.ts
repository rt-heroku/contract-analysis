declare class UserService {
    /**
     * Get user by ID
     */
    getUserById(userId: number): Promise<({
        profile: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            avatarBase64: string | null;
            phone: string | null;
            bio: string | null;
        } | null;
        userRoles: ({
            role: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            userId: number;
            roleId: number;
        })[];
    } & {
        id: number;
        email: string;
        passwordHash: string;
        firstName: string | null;
        lastName: string | null;
        isActive: boolean;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    /**
     * Get user profile
     */
    getUserProfile(userId: number): Promise<{
        id: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null | undefined;
        bio: string | null | undefined;
        avatarBase64: string | null | undefined;
        roles: string[];
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    /**
     * Update user profile
     */
    updateUserProfile(userId: number, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        bio?: string;
    }): Promise<{
        id: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null | undefined;
        bio: string | null | undefined;
        avatarBase64: string | null | undefined;
        roles: string[];
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    /**
     * Update user avatar
     */
    updateAvatar(userId: number, avatarBase64: string): Promise<void>;
    /**
     * Get all users (admin)
     */
    getAllUsers(page?: number, limit?: number, search?: string): Promise<{
        users: {
            id: number;
            email: string;
            firstName: string | null;
            lastName: string | null;
            isActive: boolean;
            lastLogin: Date | null;
            roles: string[];
            avatarBase64: string | null | undefined;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Update user (admin)
     */
    updateUser(userId: number, data: {
        firstName?: string;
        lastName?: string;
        isActive?: boolean;
    }): Promise<{
        id: number;
        email: string;
        passwordHash: string;
        firstName: string | null;
        lastName: string | null;
        isActive: boolean;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Delete user (admin - soft delete)
     */
    deleteUser(userId: number): Promise<void>;
    /**
     * Reset user password (admin)
     */
    resetUserPassword(userId: number, newPassword: string): Promise<void>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=user.service.d.ts.map