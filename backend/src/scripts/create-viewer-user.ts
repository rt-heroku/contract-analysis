import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createViewerUser() {
  try {
    console.log('🔐 Creating viewer role and demo user...\n');

    // Create viewer role
    const viewerRole = await prisma.role.upsert({
      where: { name: 'viewer' },
      update: {},
      create: {
        name: 'viewer',
        description: 'Read-only access to view analysis history and documents',
      },
    });
    console.log('✅ Viewer role created/updated:', viewerRole);

    // Hash password: Demo@123
    const passwordHash = await bcrypt.hash('Demo@123', 10);

    // Create demo user
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@mulesoft.com' },
      update: {
        passwordHash,
        firstName: 'Demo',
        lastName: 'Viewer',
        defaultMenuItem: 'history',
        isActive: true,
      },
      create: {
        email: 'demo@mulesoft.com',
        passwordHash,
        firstName: 'Demo',
        lastName: 'Viewer',
        defaultMenuItem: 'history',
        isActive: true,
      },
    });
    console.log('✅ Demo user created/updated:', {
      id: demoUser.id,
      email: demoUser.email,
      name: `${demoUser.firstName} ${demoUser.lastName}`,
      defaultMenuItem: demoUser.defaultMenuItem,
    });

    // Assign viewer role to demo user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: demoUser.id,
          roleId: viewerRole.id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        roleId: viewerRole.id,
      },
    });
    console.log('✅ Viewer role assigned to demo user\n');

    // Display credentials
    console.log('📋 Demo Viewer Credentials:');
    console.log('   Email: demo@mulesoft.com');
    console.log('   Password: Demo@123');
    console.log('   Default Page: History\n');

    console.log('🎉 Viewer setup complete!');
  } catch (error) {
    console.error('❌ Error creating viewer user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createViewerUser();

