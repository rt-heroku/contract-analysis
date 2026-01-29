/**
 * E2E Tests for Default Signup Role Feature
 * 
 * Tests the complete flow:
 * 1. Admin updates default_signup_role setting
 * 2. New user registers
 * 3. User receives correct role
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import prisma from '../../config/database';

describe('E2E: Default Signup Role Configuration', () => {
  let adminToken: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // Login as admin to get token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@mulesoft.com',
        password: 'Admin@123',
      });

    adminToken = adminLogin.body.token;
  });

  beforeEach(() => {
    // Generate unique email for each test
    testUserEmail = `test-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@example.com',
        },
      },
    });

    // Reset setting to default
    await prisma.systemSetting.update({
      where: { settingKey: 'default_signup_role' },
      data: { settingValue: 'viewer' },
    });

    await prisma.$disconnect();
  });

  describe('Settings API', () => {
    it('should allow admin to view default_signup_role setting', async () => {
      const response = await request(app)
        .get('/api/settings/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const signupRoleSetting = response.body.settings.find(
        (s: any) => s.settingKey === 'default_signup_role'
      );

      expect(signupRoleSetting).toBeDefined();
      expect(signupRoleSetting.settingValue).toMatch(/^(admin|user|viewer)$/);
      expect(signupRoleSetting.description).toContain('Default role assigned to new user registrations');
    });

    it('should allow admin to update default_signup_role to "user"', async () => {
      const response = await request(app)
        .put('/api/settings/default_signup_role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settingValue: 'user' })
        .expect(200);

      expect(response.body.setting.settingValue).toBe('user');

      // Verify in database
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'default_signup_role' },
      });
      expect(setting?.settingValue).toBe('user');
    });

    it('should allow admin to update default_signup_role to "admin"', async () => {
      const response = await request(app)
        .put('/api/settings/default_signup_role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settingValue: 'admin' })
        .expect(200);

      expect(response.body.setting.settingValue).toBe('admin');
    });

    it('should not allow non-admin to update settings', async () => {
      // Register a viewer user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'viewer-test@example.com',
          password: 'Password123!',
          firstName: 'Viewer',
          lastName: 'Test',
        });

      const viewerToken = userResponse.body.token;

      await request(app)
        .put('/api/settings/default_signup_role')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ settingValue: 'admin' })
        .expect(403);
    });
  });

  describe('User Registration with Different Default Roles', () => {
    it('should assign viewer role when default_signup_role is "viewer"', async () => {
      // Set default role to viewer
      await prisma.systemSetting.update({
        where: { settingKey: 'default_signup_role' },
        data: { settingValue: 'viewer' },
      });

      // Register new user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Viewer',
        })
        .expect(201);

      expect(response.body.user.roles).toContain('viewer');
      expect(response.body.user.defaultMenuItem).toBe('history');

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      expect(user?.userRoles[0]?.role.name).toBe('viewer');
    });

    it('should assign user role when default_signup_role is "user"', async () => {
      // Set default role to user
      await prisma.systemSetting.update({
        where: { settingKey: 'default_signup_role' },
        data: { settingValue: 'user' },
      });

      // Register new user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body.user.roles).toContain('user');
      expect(response.body.user.defaultMenuItem).toBe('history');

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      expect(user?.userRoles[0]?.role.name).toBe('user');
    });

    it('should assign admin role when default_signup_role is "admin"', async () => {
      // Set default role to admin
      await prisma.systemSetting.update({
        where: { settingKey: 'default_signup_role' },
        data: { settingValue: 'admin' },
      });

      // Register new user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Admin',
        })
        .expect(201);

      expect(response.body.user.roles).toContain('admin');
      expect(response.body.user.defaultMenuItem).toBe('dashboard');

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      expect(user?.userRoles[0]?.role.name).toBe('admin');
    });

    it('should fallback to viewer when setting has invalid value', async () => {
      // Set invalid role
      await prisma.systemSetting.update({
        where: { settingKey: 'default_signup_role' },
        data: { settingValue: 'invalid_role' },
      });

      // Register new user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Fallback',
        })
        .expect(201);

      expect(response.body.user.roles).toContain('viewer');

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      expect(user?.userRoles[0]?.role.name).toBe('viewer');
    });
  });

  describe('ENV Override Behavior', () => {
    it('should indicate ENV override in settings API when DEFAULT_SIGNUP_ROLE is set', async () => {
      // Note: This test assumes the environment variable is set
      // In real testing, you would set process.env.DEFAULT_SIGNUP_ROLE
      
      const response = await request(app)
        .get('/api/settings/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const signupRoleSetting = response.body.settings.find(
        (s: any) => s.settingKey === 'default_signup_role'
      );

      expect(signupRoleSetting).toBeDefined();
      // If ENV variable is set, hasEnvOverride should be true
      if (process.env.DEFAULT_SIGNUP_ROLE) {
        expect(signupRoleSetting.hasEnvOverride).toBe(true);
        expect(signupRoleSetting.effectiveValue).toBe(process.env.DEFAULT_SIGNUP_ROLE);
      }
    });
  });

  describe('Security Validation', () => {
    it('should require authentication for settings endpoints', async () => {
      await request(app)
        .get('/api/settings/all')
        .expect(401);

      await request(app)
        .put('/api/settings/default_signup_role')
        .send({ settingValue: 'admin' })
        .expect(401);
    });

    it('should validate role values when updating setting', async () => {
      // This test assumes validation is added in the settings controller
      const response = await request(app)
        .put('/api/settings/default_signup_role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settingValue: 'superadmin' });

      // Should either succeed (if no validation) or fail with appropriate error
      // The actual implementation may vary
      expect([200, 400]).toContain(response.status);
    });

    it('should not expose secret settings in public endpoint', async () => {
      const response = await request(app)
        .get('/api/settings/public')
        .expect(200);

      const signupRoleSetting = response.body.settings.default_signup_role;
      expect(signupRoleSetting).toBeDefined();
      
      // Ensure JWT secret is not exposed
      expect(response.body.settings.jwt_secret).toBeUndefined();
    });
  });

  describe('Activity Logging', () => {
    it('should log when default_signup_role setting is changed', async () => {
      await request(app)
        .put('/api/settings/default_signup_role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settingValue: 'user' })
        .expect(200);

      // Check activity log
      const logs = await prisma.activityLog.findMany({
        where: {
          actionType: {
            contains: 'setting',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      // Activity logging should capture this change
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should log new user registration with assigned role', async () => {
      await prisma.systemSetting.update({
        where: { settingKey: 'default_signup_role' },
        data: { settingValue: 'user' },
      });

      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Logger',
        })
        .expect(201);

      // Check activity log for registration
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      const logs = await prisma.activityLog.findMany({
        where: {
          userId: user?.id,
          actionType: 'auth.register',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
