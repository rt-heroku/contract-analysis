"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const env_1 = __importDefault(require("../config/env"));
const types_1 = require("../types");
const constants_1 = require("../utils/constants");
class AuthService {
    SALT_ROUNDS = 10;
    /**
     * Register a new user
     */
    async register(data) {
        // Check if user exists
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(data.password, this.SALT_ROUNDS);
        // Create user with transaction
        const user = await database_1.default.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                },
            });
            // Create user profile
            await tx.userProfile.create({
                data: {
                    userId: newUser.id,
                },
            });
            // Assign user role
            const userRole = await tx.role.findUnique({
                where: { name: constants_1.ROLES.USER },
            });
            if (userRole) {
                await tx.userRole.create({
                    data: {
                        userId: newUser.id,
                        roleId: userRole.id,
                    },
                });
            }
            return newUser;
        });
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
    /**
     * Login user
     */
    async login(credentials, ipAddress, userAgent) {
        const user = await database_1.default.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (!user.isActive) {
            throw new Error('Account is disabled');
        }
        // Verify password
        const isValidPassword = await bcrypt_1.default.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        // Get user roles
        const roles = user.userRoles.map((ur) => ur.role.name);
        // Generate JWT token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            roles,
        }, credentials.stayLoggedIn);
        // Calculate expiration
        const expiresAt = new Date();
        if (credentials.stayLoggedIn) {
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        }
        else {
            expiresAt.setHours(expiresAt.getHours() + 4); // 4 hours
        }
        // Create session
        await database_1.default.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
                ipAddress,
                userAgent,
            },
        });
        // Update last login
        await database_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        return {
            token,
            expiresAt,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles,
            },
        };
    }
    /**
     * Logout user
     */
    async logout(token) {
        await database_1.default.session.deleteMany({
            where: { token },
        });
    }
    /**
     * Refresh token
     */
    async refreshToken(oldToken, ipAddress, userAgent) {
        // Verify old token
        const payload = this.verifyToken(oldToken);
        // Check if session exists
        const session = await database_1.default.session.findFirst({
            where: {
                token: oldToken,
                userId: payload.id,
            },
        });
        if (!session) {
            throw new Error('Invalid session');
        }
        // Generate new token
        const newToken = this.generateToken(payload, false);
        // Calculate expiration (4 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 4);
        // Delete old session and create new one
        await database_1.default.$transaction([
            database_1.default.session.delete({
                where: { id: session.id },
            }),
            database_1.default.session.create({
                data: {
                    userId: payload.id,
                    token: newToken,
                    expiresAt,
                    ipAddress,
                    userAgent,
                },
            }),
        ]);
        return {
            token: newToken,
            expiresAt,
        };
    }
    /**
     * Generate JWT token
     */
    generateToken(payload, longExpiration = false) {
        const expiration = longExpiration ? env_1.default.jwtRefreshExpiration : env_1.default.jwtExpiration;
        return jsonwebtoken_1.default.sign(payload, env_1.default.jwtSecret, { expiresIn: expiration });
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.default.jwtSecret);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Verify current password
        const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        // Hash new password
        const passwordHash = await bcrypt_1.default.hash(newPassword, this.SALT_ROUNDS);
        // Update password
        await database_1.default.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        // Delete all sessions (force re-login)
        await database_1.default.session.deleteMany({
            where: { userId },
        });
    }
    /**
     * Clean expired sessions
     */
    async cleanExpiredSessions() {
        await database_1.default.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map