/**
 * Unit tests for AuthService - Default Signup Role Configuration
 * 
 * Tests the new configurable default signup role feature
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AuthService from '../auth.service';
import prisma from '../../config/database';
import { getSetting } from '../../utils/getSettings';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../utils/getSettings');
jest.mock('../../config/secrets', () => ({
  getJwtSecretSync: () => 'test-secret-key',
}));

describe('AuthService - Configurable Default Signup Role', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockGetSetting = getSetting as jest.MockedFunction<typeof getSetting>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);
    mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      const tx = {
        user: {
          create: jest.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            defaultMenuItem: 'history',
          }),
        },
        userProfile: {
          create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
        },
        role: {
          findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'viewer' }),
        },
        userRole: {
          create: jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 1 }),
        },
      };
      return callback(tx);
    });
  });

  afterEach(() => {
    delete process.env.DEFAULT_SIGNUP_ROLE;
  });

  describe('register() with default_signup_role setting', () => {
    it('should assign viewer role when setting is "viewer"', async () => {
      mockGetSetting.mockResolvedValue('viewer');
      
      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['viewer']);
      expect(result.defaultMenuItem).toBe('history');
    });

    it('should assign user role when setting is "user"', async () => {
      mockGetSetting.mockResolvedValue('user');
      
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              defaultMenuItem: 'history',
            }),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue({ id: 2, name: 'user' }),
          },
          userRole: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 2 }),
          },
        };
        return callback(tx);
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['user']);
      expect(result.defaultMenuItem).toBe('history');
    });

    it('should assign admin role and set dashboard as default when setting is "admin"', async () => {
      mockGetSetting.mockResolvedValue('admin');
      
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              defaultMenuItem: 'dashboard',
            }),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue({ id: 3, name: 'admin' }),
          },
          userRole: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 3 }),
          },
        };
        return callback(tx);
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['admin']);
      expect(result.defaultMenuItem).toBe('dashboard');
    });

    it('should fallback to viewer when setting is null', async () => {
      mockGetSetting.mockResolvedValue(null);
      
      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['viewer']);
    });

    it('should fallback to viewer when setting is empty string', async () => {
      mockGetSetting.mockResolvedValue('');
      
      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['viewer']);
    });

    it('should fallback to viewer when configured role does not exist in database', async () => {
      mockGetSetting.mockResolvedValue('nonexistent');
      
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              defaultMenuItem: 'history',
            }),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
          },
          role: {
            findUnique: jest.fn()
              .mockResolvedValueOnce(null) // First call for nonexistent role
              .mockResolvedValueOnce({ id: 1, name: 'viewer' }), // Fallback to viewer
          },
          userRole: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['viewer']);
    });

    it('should prioritize ENV variable over database setting', async () => {
      process.env.DEFAULT_SIGNUP_ROLE = 'admin';
      mockGetSetting.mockResolvedValue('viewer');
      
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              defaultMenuItem: 'dashboard',
            }),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue({ id: 3, name: 'admin' }),
          },
          userRole: {
            create: jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 3 }),
          },
        };
        return callback(tx);
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['admin']);
      expect(result.defaultMenuItem).toBe('dashboard');
    });

    it('should skip role assignment when skipDefaultRole is true', async () => {
      mockGetSetting.mockResolvedValue('viewer');
      
      const result = await AuthService.register(
        {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        },
        true // skipDefaultRole
      );

      expect(result.roles).toEqual([]);
      expect(result.defaultMenuItem).toBe('dashboard');
      expect(mockGetSetting).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive role names', async () => {
      mockGetSetting.mockResolvedValue('VIEWER');
      
      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.roles).toEqual(['viewer']);
    });

    it('should reject duplicate email addresses', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 999,
        email: 'test@example.com',
      });

      await expect(
        AuthService.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle all valid role values correctly', async () => {
      const roles = ['admin', 'user', 'viewer'];
      
      for (const roleName of roles) {
        mockGetSetting.mockResolvedValue(roleName);
        
        const expectedMenuItem = roleName === 'admin' ? 'dashboard' : 'history';
        
        mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
          const tx = {
            user: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                email: `test-${roleName}@example.com`,
                firstName: 'Test',
                lastName: 'User',
                defaultMenuItem: expectedMenuItem,
              }),
            },
            userProfile: {
              create: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
            },
            role: {
              findUnique: jest.fn().mockResolvedValue({ id: 1, name: roleName }),
            },
            userRole: {
              create: jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 1 }),
            },
          };
          return callback(tx);
        });
        
        const result = await AuthService.register({
          email: `test-${roleName}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

        expect(result.roles).toEqual([roleName]);
        expect(result.defaultMenuItem).toBe(expectedMenuItem);
      }
    });
  });
});
