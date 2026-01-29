#!/usr/bin/env ts-node

/**
 * Verification script for default_signup_role setting
 * 
 * This script verifies that:
 * 1. The default_signup_role setting exists in system_settings
 * 2. The setting has a valid value (admin, user, or viewer)
 * 3. All required roles exist in the roles table
 * 4. The setting can be read by getSetting utility
 */

import prisma from '../config/database';
import { getSetting } from '../utils/getSettings';
import logger from '../utils/logger';

const VALID_ROLES = ['admin', 'user', 'viewer'];

async function verifyDefaultSignupRole() {
  try {
    console.log('\n🔍 Verifying default_signup_role configuration...\n');

    // Step 1: Check if setting exists in database
    console.log('1️⃣  Checking system_settings table...');
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'default_signup_role' },
    });

    if (!setting) {
      console.error('❌ FAILED: default_signup_role setting not found in system_settings table');
      console.log('\nTo fix this, run:');
      console.log('  psql $DATABASE_URL -f backend/init-database.sql');
      process.exit(1);
    }

    console.log(`✅ Setting exists: ${setting.settingKey} = "${setting.settingValue}"`);
    console.log(`   Description: ${setting.description}`);
    console.log(`   Is Secret: ${setting.isSecret}`);

    // Step 2: Validate setting value
    console.log('\n2️⃣  Validating setting value...');
    if (!setting.settingValue) {
      console.error('❌ FAILED: Setting value is null or empty');
      process.exit(1);
    }

    const currentValue = setting.settingValue.toLowerCase();
    if (!VALID_ROLES.includes(currentValue)) {
      console.error(`❌ FAILED: Invalid role "${currentValue}"`);
      console.log(`   Valid values: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }

    console.log(`✅ Setting value is valid: "${currentValue}"`);

    // Step 3: Verify all required roles exist
    console.log('\n3️⃣  Checking roles table...');
    const roles = await prisma.role.findMany();
    const roleNames = roles.map(r => r.name);

    const missingRoles = VALID_ROLES.filter(r => !roleNames.includes(r));
    if (missingRoles.length > 0) {
      console.error(`❌ FAILED: Missing required roles: ${missingRoles.join(', ')}`);
      console.log('\nTo fix this, ensure all roles are created in your database:');
      console.log('  psql $DATABASE_URL -f backend/init-database.sql');
      process.exit(1);
    }

    console.log('✅ All required roles exist:');
    VALID_ROLES.forEach(role => {
      const roleData = roles.find(r => r.name === role);
      console.log(`   - ${role} (id: ${roleData?.id})`);
    });

    // Step 4: Test getSetting utility
    console.log('\n4️⃣  Testing getSetting utility...');
    const retrievedValue = await getSetting('default_signup_role', 'viewer');
    
    if (!retrievedValue) {
      console.error('❌ FAILED: getSetting returned null');
      process.exit(1);
    }

    if (retrievedValue.toLowerCase() !== currentValue) {
      console.error(`❌ FAILED: getSetting returned "${retrievedValue}" but database has "${currentValue}"`);
      process.exit(1);
    }

    console.log(`✅ getSetting works correctly: "${retrievedValue}"`);

    // Step 5: Check ENV override
    console.log('\n5️⃣  Checking environment variable override...');
    if (process.env.DEFAULT_SIGNUP_ROLE) {
      console.log(`⚠️  ENV variable set: DEFAULT_SIGNUP_ROLE="${process.env.DEFAULT_SIGNUP_ROLE}"`);
      console.log('   This will override the database setting');
      
      const envValue = process.env.DEFAULT_SIGNUP_ROLE.toLowerCase();
      if (!VALID_ROLES.includes(envValue)) {
        console.error(`❌ FAILED: Invalid ENV value "${envValue}"`);
        console.log(`   Valid values: ${VALID_ROLES.join(', ')}`);
        process.exit(1);
      }
      console.log('   ENV value is valid');
    } else {
      console.log('✅ No ENV override (will use database setting)');
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL CHECKS PASSED');
    console.log('='.repeat(60));
    console.log('\nConfiguration Summary:');
    console.log(`  Database Setting: "${setting.settingValue}"`);
    console.log(`  ENV Override: ${process.env.DEFAULT_SIGNUP_ROLE || 'None'}`);
    console.log(`  Effective Value: "${process.env.DEFAULT_SIGNUP_ROLE || setting.settingValue}"`);
    console.log(`  Available Roles: ${roleNames.join(', ')}`);
    
    console.log('\n📝 Next Steps:');
    console.log('  1. Register a new user to test role assignment');
    console.log('  2. Check Settings page in Admin UI');
    console.log('  3. Verify role dropdown displays correctly');
    console.log('  4. Test changing the setting and registering another user');
    
    console.log('\n✨ Configuration is ready!\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    logger.error('Verification failed', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyDefaultSignupRole();
