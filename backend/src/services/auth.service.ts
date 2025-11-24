import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import config from '../config/env';
import { getJwtSecretSync } from '../config/secrets';
import { RegisterData, LoginCredentials, JWTPayload } from '../types';
import { JWT_EXPIRATION, JWT_REFRESH_EXPIRATION, ROLES } from '../utils/constants';

class AuthService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Register a new user
   * @param skipDefaultRole - If true, don't assign default viewer role (used for first admin)
   */
  async register(data: RegisterData, skipDefaultRole: boolean = false) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          defaultMenuItem: skipDefaultRole ? 'dashboard' : 'history', // Admins go to dashboard, viewers to history
        },
      });

      // Create user profile
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
        },
      });

      // Assign viewer role (default for new registrations) unless skipped
      if (!skipDefaultRole) {
        const viewerRole = await tx.role.findUnique({
          where: { name: ROLES.VIEWER },
        });

        if (viewerRole) {
          await tx.userRole.create({
            data: {
              userId: newUser.id,
              roleId: viewerRole.id,
            },
          });
        }
      }

      return newUser;
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      defaultMenuItem: user.defaultMenuItem,
      roles: skipDefaultRole ? [] : [ROLES.VIEWER], // Return appropriate roles
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
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
    const isValidPassword = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

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
    } else {
      expiresAt.setHours(expiresAt.getHours() + 4); // 4 hours
    }

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Update last login
    await prisma.user.update({
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
        defaultMenuItem: user.defaultMenuItem,
        roles,
      },
    };
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Refresh token
   */
  async refreshToken(oldToken: string, ipAddress?: string, userAgent?: string) {
    // Verify old token
    const payload = this.verifyToken(oldToken);

    // Check if session exists
    const session = await prisma.session.findFirst({
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
    await prisma.$transaction([
      prisma.session.delete({
        where: { id: session.id },
      }),
      prisma.session.create({
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
  generateToken(payload: JWTPayload, longExpiration: boolean = false): string {
    const expiration = longExpiration ? config.jwtRefreshExpiration : config.jwtExpiration;
    const jwtSecret = getJwtSecretSync();
    return jwt.sign(payload, jwtSecret, { expiresIn: expiration } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const jwtSecret = getJwtSecretSync();
      return jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete all sessions (force re-login)
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export default new AuthService();

