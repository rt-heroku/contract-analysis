import bcrypt from 'bcrypt';
import prisma from '../config/database';
import logger from './logger';
import { seedDefaultSettings } from './seedSettings';

async function seed() {
  try {
    logger.info('Starting database seeding...');

    // Seed system settings first
    await seedDefaultSettings();

    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator with full access',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Regular user with limited access',
      },
    });

    logger.info('Roles created');

    // Create menu items
    await prisma.menuItem.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Dashboard',
        icon: 'home',
        route: '/dashboard',
        orderIndex: 1,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'Profile',
        icon: 'user',
        route: '/profile',
        orderIndex: 2,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 3 },
      update: {},
      create: {
        title: 'Document Processing',
        icon: 'file-text',
        route: '/processing',
        orderIndex: 3,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 4 },
      update: {},
      create: {
        title: 'Analysis History',
        icon: 'history',
        route: '/history',
        orderIndex: 4,
      },
    });

    const transactionsMenu = await prisma.menuItem.upsert({
      where: { id: 5 },
      update: {},
      create: {
        title: 'Transactions',
        icon: 'credit-card',
        route: null,
        orderIndex: 5,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 6 },
      update: {},
      create: {
        parentId: transactionsMenu.id,
        title: 'Transaction History',
        icon: 'list',
        route: '/transactions',
        orderIndex: 1,
      },
    });

    const adminPanelMenu = await prisma.menuItem.upsert({
      where: { id: 7 },
      update: {},
      create: {
        title: 'Admin Panel',
        icon: 'shield',
        route: null,
        orderIndex: 6,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 8 },
      update: {},
      create: {
        parentId: adminPanelMenu.id,
        title: 'User Management',
        icon: 'users',
        route: '/admin/users',
        orderIndex: 1,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 9 },
      update: {},
      create: {
        parentId: adminPanelMenu.id,
        title: 'System Logs',
        icon: 'file-text',
        route: '/admin/logs',
        orderIndex: 2,
      },
    });

    await prisma.menuItem.upsert({
      where: { id: 10 },
      update: {},
      create: {
        title: 'Settings',
        icon: 'settings',
        route: '/settings',
        orderIndex: 7,
      },
    });

    logger.info('Menu items created');

    // Get all menu items
    const allMenuItems = await prisma.menuItem.findMany();

    // Assign all menu items to admin role
    for (const menuItem of allMenuItems) {
      await prisma.menuPermission.upsert({
        where: {
          menuItemId_roleId: {
            menuItemId: menuItem.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          menuItemId: menuItem.id,
          roleId: adminRole.id,
        },
      });
    }

    // Assign non-admin menu items to user role
    const userMenuItems = allMenuItems.filter(
      (item) => item.title !== 'Admin Panel' && item.parentId !== adminPanelMenu.id
    );

    for (const menuItem of userMenuItems) {
      await prisma.menuPermission.upsert({
        where: {
          menuItemId_roleId: {
            menuItemId: menuItem.id,
            roleId: userRole.id,
          },
        },
        update: {},
        create: {
          menuItemId: menuItem.id,
          roleId: userRole.id,
        },
      });
    }

    logger.info('Menu permissions created');

    // Create system settings
    await prisma.systemSetting.upsert({
      where: { settingKey: 'mulesoft_api_base_url' },
      update: {},
      create: {
        settingKey: 'mulesoft_api_base_url',
        settingValue: process.env.MULESOFT_API_BASE_URL || 'https://api.mulesoft.example.com',
        description: 'MuleSoft API base URL',
        isSecret: false,
      },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: 'app_name' },
      update: {},
      create: {
        settingKey: 'app_name',
        settingValue: 'Document Processing App',
        description: 'Application name',
        isSecret: false,
      },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: 'powered_by_text' },
      update: {},
      create: {
        settingKey: 'powered_by_text',
        settingValue: 'Powered by Your Company',
        description: 'Footer text',
        isSecret: false,
      },
    });

    logger.info('System settings created');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        passwordHash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    logger.info('Admin user created (email: admin@demo.com, password: Admin@123)');

    // Create regular user
    const userPasswordHash = await bcrypt.hash('User@123', 10);
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@demo.com' },
      update: {},
      create: {
        email: 'user@demo.com',
        passwordHash: userPasswordHash,
        firstName: 'Regular',
        lastName: 'User',
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: regularUser.id },
      update: {},
      create: {
        userId: regularUser.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: regularUser.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    });

    logger.info('Regular user created (email: user@demo.com, password: User@123)');

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();

