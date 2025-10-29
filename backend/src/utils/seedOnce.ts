import bcrypt from 'bcrypt';
import prisma from '../config/database';
import logger from './logger';

/**
 * Check if database has already been seeded
 * by looking for the existence of the admin user
 */
async function isAlreadySeeded(): Promise<boolean> {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
    });
    
    if (adminUser) {
      // Valid bcrypt hash must be exactly 60 characters
      const hasValidPassword = adminUser.passwordHash && adminUser.passwordHash.length === 60;
      return Boolean(hasValidPassword);
    }
    
    return false;
  } catch (error) {
    // If the table doesn't exist yet, definitely not seeded
    return false;
  }
}

/**
 * Seed only user passwords and critical data
 * This runs after init-database.sql has created the structure
 */
async function seedOnce() {
  try {
    // Check if already seeded
    const alreadySeeded = await isAlreadySeeded();
    
    if (alreadySeeded) {
      logger.info('✓ Database already seeded - skipping user password generation');
      logger.info('  (This is expected for subsequent deployments)');
      return;
    }

    logger.info('🌱 Starting one-time database seeding...');
    logger.info('  (Setting user passwords for demo accounts)');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const userPasswordHash = await bcrypt.hash('User@123', 10);
    const viewerPasswordHash = await bcrypt.hash('Demo@123', 10);

    // Get role IDs
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    const viewerRole = await prisma.role.findUnique({ where: { name: 'viewer' } });

    if (!adminRole || !userRole || !viewerRole) {
      throw new Error('Roles not found. Please run init-database.sql first.');
    }

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: { passwordHash: adminPasswordHash },
      create: {
        email: 'admin@demo.com',
        passwordHash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      },
    });
    
    // Ensure admin profile exists
    await prisma.userProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: { userId: adminUser.id },
    });
    
    // Ensure admin role is assigned
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
    logger.info('✓ Admin user created/updated (admin@demo.com / Admin@123)');

    // Create or update regular user
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@demo.com' },
      update: { passwordHash: userPasswordHash },
      create: {
        email: 'user@demo.com',
        passwordHash: userPasswordHash,
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
      },
    });
    
    await prisma.userProfile.upsert({
      where: { userId: regularUser.id },
      update: {},
      create: { userId: regularUser.id },
    });
    
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: regularUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: regularUser.id, roleId: userRole.id },
    });
    logger.info('✓ Regular user created/updated (user@demo.com / User@123)');

    // Create or update viewer user
    const viewerUser = await prisma.user.upsert({
      where: { email: 'demo@mulesoft.com' },
      update: { passwordHash: viewerPasswordHash },
      create: {
        email: 'demo@mulesoft.com',
        passwordHash: viewerPasswordHash,
        firstName: 'Demo',
        lastName: 'Viewer',
        defaultMenuItem: 'history',
        isActive: true,
      },
    });
    
    await prisma.userProfile.upsert({
      where: { userId: viewerUser.id },
      update: {},
      create: { userId: viewerUser.id },
    });
    
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: viewerUser.id, roleId: viewerRole.id } },
      update: {},
      create: { userId: viewerUser.id, roleId: viewerRole.id },
    });
    logger.info('✓ Viewer user created/updated (demo@mulesoft.com / Demo@123)');

    // Auto-detect and create connectors from environment variables
    logger.info('');
    logger.info('🔌 Auto-detecting connectors from environment variables...');
    const autoConnectorService = (await import('../services/auto-connector.service')).default;
    await autoConnectorService.detectAndCreateConnectors(adminUser.id);

    logger.info('');
    logger.info('✅ Database seeding completed successfully!');
    logger.info('');
    logger.info('Demo Credentials:');
    logger.info('  Admin:  admin@demo.com / Admin@123');
    logger.info('  User:   user@demo.com / User@123');
    logger.info('  Viewer: demo@mulesoft.com / Demo@123');
    logger.info('');
  } catch (error: any) {
    logger.error('❌ Error seeding database:', error);
    // Don't throw - allow the deployment to continue even if seeding fails
    logger.warn('⚠️  Continuing deployment despite seeding error');
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedOnce();
}

export default seedOnce;

