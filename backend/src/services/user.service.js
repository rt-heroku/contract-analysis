"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        return database_1.default.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.profile?.phone,
            bio: user.profile?.bio,
            avatarBase64: user.profile?.avatarBase64,
            roles: user.userRoles.map((ur) => ur.role.name),
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
        };
    }
    /**
     * Update user profile
     */
    async updateUserProfile(userId, data) {
        await database_1.default.$transaction(async (tx) => {
            // Update user
            if (data.firstName !== undefined || data.lastName !== undefined) {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                    },
                });
            }
            // Update profile
            if (data.phone !== undefined || data.bio !== undefined) {
                await tx.userProfile.update({
                    where: { userId },
                    data: {
                        phone: data.phone,
                        bio: data.bio,
                    },
                });
            }
        });
        return this.getUserProfile(userId);
    }
    /**
     * Update user avatar
     */
    async updateAvatar(userId, avatarBase64) {
        await database_1.default.userProfile.update({
            where: { userId },
            data: { avatarBase64 },
        });
    }
    /**
     * Get all users (admin)
     */
    async getAllUsers(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            database_1.default.user.findMany({
                where,
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    profile: {
                        select: {
                            avatarBase64: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.user.count({ where }),
        ]);
        return {
            users: users.map((user) => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                roles: user.userRoles.map((ur) => ur.role.name),
                avatarBase64: user.profile?.avatarBase64,
                createdAt: user.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Update user (admin)
     */
    async updateUser(userId, data) {
        return database_1.default.user.update({
            where: { id: userId },
            data,
        });
    }
    /**
     * Delete user (admin - soft delete)
     */
    async deleteUser(userId) {
        await database_1.default.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }
    /**
     * Reset user password (admin)
     */
    async resetUserPassword(userId, newPassword) {
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await database_1.default.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        // Delete all user sessions
        await database_1.default.session.deleteMany({
            where: { userId },
        });
    }
}
exports.default = new UserService();
//# sourceMappingURL=user.service.js.map