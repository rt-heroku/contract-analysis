import prisma from '../config/database';
import bcrypt from 'bcrypt';

class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: number) {
    return prisma.user.findUnique({
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
  async getUserProfile(userId: number) {
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
  async updateUserProfile(
    userId: number,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
    }
  ) {
    await prisma.$transaction(async (tx) => {
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
  async updateAvatar(userId: number, avatarBase64: string) {
    await prisma.userProfile.update({
      where: { userId },
      data: { avatarBase64 },
    });
  }

  /**
   * Get all users (admin)
   */
  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
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
  async updateUser(
    userId: number,
    data: {
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Delete user (admin - soft delete)
   */
  async deleteUser(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  /**
   * Reset user password (admin)
   */
  async resetUserPassword(userId: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete all user sessions
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}

export default new UserService();

