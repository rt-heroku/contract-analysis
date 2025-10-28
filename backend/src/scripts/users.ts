#!/usr/bin/env node

/**
 * User Management CLI Script
 * 
 * Usage:
 *   npm run users -- CREATE email@example.com [password]
 *   npm run users -- DELETE email@example.com
 *   npm run users -- RESET email@example.com [newPassword]
 * 
 * If password is omitted, user will be prompted on next login to set password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Constants
const SALT_ROUNDS = 10;
const TEMP_PASSWORD_FLAG = 'TEMP_PASSWORD_RESET_REQUIRED';

interface UserAction {
  action: 'CREATE' | 'DELETE' | 'RESET';
  email: string;
  password?: string;
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function createUser(email: string, password?: string): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`❌ Error: User with email ${email} already exists`);
      process.exit(1);
    }

    // Check if this is the first user (will be admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Use temp password if none provided
    const passwordHash = password
      ? await hashPassword(password)
      : await hashPassword(TEMP_PASSWORD_FLAG);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isActive: true,
        firstName: email.split('@')[0],
        lastName: '',
        defaultMenuItem: isFirstUser ? 'dashboard' : 'history', // Admins to dashboard, users to history
      },
    });

    console.log(`✅ User created successfully: ${email} (ID: ${user.id})`);

    // Assign admin role if first user
    if (isFirstUser) {
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' },
      });

      if (adminRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });
        console.log(`👑 First user - Admin role assigned`);
      }
    } else {
      // Assign default user role
      const userRole = await prisma.role.findUnique({
        where: { name: 'user' },
      });

      if (userRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: userRole.id,
          },
        });
        console.log(`👤 Default user role assigned`);
      }
    }

    if (!password) {
      console.log(`⚠️  No password provided - user will be prompted to set password on first login`);
    }
  } catch (error: any) {
    console.error(`❌ Error creating user:`, error.message);
    process.exit(1);
  }
}

async function deleteUser(email: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      console.error(`❌ Error: User with email ${email} not found`);
      process.exit(1);
    }

    // Check if user is the last admin
    const isAdmin = user.userRoles.some(ur => ur.role.name === 'admin');
    if (isAdmin) {
      const adminCount = await prisma.userRole.count({
        where: {
          role: {
            name: 'admin',
          },
        },
      });

      if (adminCount <= 1) {
        console.error(`❌ Error: Cannot delete the last admin user`);
        process.exit(1);
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ User deleted successfully: ${email}`);
  } catch (error: any) {
    console.error(`❌ Error deleting user:`, error.message);
    process.exit(1);
  }
}

async function resetPassword(email: string, newPassword?: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Error: User with email ${email} not found`);
      process.exit(1);
    }

    // Use temp password if none provided
    const passwordHash = newPassword
      ? await hashPassword(newPassword)
      : await hashPassword(TEMP_PASSWORD_FLAG);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
      },
    });

    console.log(`✅ Password reset successfully for: ${email}`);

    if (!newPassword) {
      console.log(`⚠️  No password provided - user will be prompted to set password on next login`);
    }
  } catch (error: any) {
    console.error(`❌ Error resetting password:`, error.message);
    process.exit(1);
  }
}

function printUsage(): void {
  console.log(`
User Management Script

Usage:
  npm run users -- <ACTION> <EMAIL> [PASSWORD]

Actions:
  CREATE  - Create a new user
  DELETE  - Delete an existing user
  RESET   - Reset user password

Examples:
  npm run users -- CREATE admin@demo.com MySecurePass123
  npm run users -- CREATE user@demo.com
  npm run users -- RESET admin@demo.com NewPassword
  npm run users -- DELETE user@demo.com

Notes:
  - If PASSWORD is omitted, user will be prompted to set password on next login
  - First user created automatically becomes an admin
  - Cannot delete the last admin user
  `);
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      printUsage();
      process.exit(1);
    }

    const action = args[0].toUpperCase() as 'CREATE' | 'DELETE' | 'RESET';
    const email = args[1];
    const password = args[2];

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`❌ Error: Invalid email format: ${email}`);
      process.exit(1);
    }

    // Validate action
    if (!['CREATE', 'DELETE', 'RESET'].includes(action)) {
      console.error(`❌ Error: Invalid action: ${action}`);
      console.error(`   Valid actions: CREATE, DELETE, RESET`);
      process.exit(1);
    }

    console.log(`\n🔧 Processing ${action} for ${email}...\n`);

    switch (action) {
      case 'CREATE':
        await createUser(email, password);
        break;
      case 'DELETE':
        await deleteUser(email);
        break;
      case 'RESET':
        await resetPassword(email, password);
        break;
    }

    console.log(`\n✨ Operation completed successfully\n`);
  } catch (error: any) {
    console.error(`\n❌ Fatal error:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

