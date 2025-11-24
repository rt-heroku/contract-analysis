import crypto from 'crypto';
import prisma from '../config/database';

/**
 * Migrate encrypted data from old CBC format to new GCM format
 * 
 * This is a ONE-TIME migration script. After running:
 * 1. All encrypted data will use new GCM format
 * 2. Old CBC decryption code can be removed
 * 3. System will only use ENCRYPTION_KEY (not JWT_SECRET)
 * 
 * Usage:
 *   # Dry run (show what would change, don't modify)
 *   npm run migration:encrypt-format
 * 
 *   # Actually execute migration
 *   npm run migration:encrypt-format --execute
 */

// OLD CBC format constants
const IV_LENGTH = 16;
const ALGORITHM_CBC = 'aes-256-cbc';

// NEW GCM format constants
const ALGORITHM_GCM = 'aes-256-gcm';
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get NEW encryption key (for GCM format)
 */
function getNewKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

/**
 * Get OLD key - tries ENCRYPTION_KEY first, then JWT_SECRET
 */
function getOldKey(): { key: Buffer; source: 'ENCRYPTION_KEY' | 'JWT_SECRET' } {
  // Try ENCRYPTION_KEY first
  if (process.env.ENCRYPTION_KEY) {
    try {
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      return { key, source: 'ENCRYPTION_KEY' };
    } catch (error) {
      console.warn('Failed to parse ENCRYPTION_KEY, trying JWT_SECRET');
    }
  }
  
  // Fall back to JWT_SECRET
  if (process.env.JWT_SECRET) {
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    return { key, source: 'JWT_SECRET' };
  }
  
  throw new Error('Neither ENCRYPTION_KEY nor JWT_SECRET is set');
}

/**
 * Check if data is in legacy CBC format
 */
function isLegacyFormat(encryptedData: string): boolean {
  return encryptedData.includes(':') && /^[0-9a-f]+:[0-9a-f]+$/i.test(encryptedData);
}

/**
 * Decrypt OLD CBC format
 */
function decryptOld(encryptedData: string, key: Buffer): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid CBC format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM_CBC, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt with NEW GCM format
 */
function encryptNew(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(getNewKey(), salt, 100000, 32, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM_GCM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: number; name: string; error: string }>;
}

/**
 * Migrate IDP executions
 */
async function migrateIdpExecutions(
  oldKey: Buffer,
  execute: boolean
): Promise<MigrationStats> {
  console.log('\n🔄 Processing idp_executions table...\n');
  
  const executions = await prisma.idpExecution.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      authClientId: true,
      authClientSecret: true,
      anypointUsername: true,
      anypointPassword: true,
    },
  });
  
  const stats: MigrationStats = {
    total: executions.length,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };
  
  for (const exec of executions) {
    console.log(`  Processing ID ${exec.id}: ${exec.name}`);
    
    try {
      // Check if already in new format
      if (!isLegacyFormat(exec.authClientId)) {
        console.log('    ⏭️  Already in GCM format - skipping');
        stats.skipped++;
        continue;
      }
      
      // Decrypt old format
      const clientId = decryptOld(exec.authClientId, oldKey);
      const clientSecret = decryptOld(exec.authClientSecret, oldKey);
      const username = exec.anypointUsername ? decryptOld(exec.anypointUsername, oldKey) : null;
      const password = exec.anypointPassword ? decryptOld(exec.anypointPassword, oldKey) : null;
      
      console.log(`    ✅ Decrypted with old CBC format`);
      console.log(`       Client ID: ${clientId.substring(0, 15)}...`);
      
      // Encrypt with new format
      const newClientId = encryptNew(clientId);
      const newClientSecret = encryptNew(clientSecret);
      const newUsername = username ? encryptNew(username) : null;
      const newPassword = password ? encryptNew(password) : null;
      
      console.log(`    ✅ Re-encrypted with new GCM format`);
      
      if (execute) {
        // Update database
        await prisma.idpExecution.update({
          where: { id: exec.id },
          data: {
            authClientId: newClientId,
            authClientSecret: newClientSecret,
            anypointUsername: newUsername,
            anypointPassword: newPassword,
          },
        });
        console.log(`    ✅ Updated in database`);
      } else {
        console.log(`    ℹ️  Would update in database (dry run)`);
      }
      
      stats.migrated++;
    } catch (error: any) {
      console.log(`    ❌ Failed: ${error.message}`);
      stats.failed++;
      stats.errors.push({
        id: exec.id,
        name: exec.name,
        error: error.message,
      });
    }
    
    console.log('');
  }
  
  return stats;
}

/**
 * Check for other tables with encrypted data
 */
async function checkConnectorsTable(
  oldKey: Buffer,
  execute: boolean
): Promise<MigrationStats> {
  console.log('\n🔄 Checking connectors table...\n');
  
  const connectors = await prisma.connector.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      config: true,
    },
  });
  
  const stats: MigrationStats = {
    total: connectors.length,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };
  
  if (connectors.length === 0) {
    console.log('  No connectors found - skipping');
    return stats;
  }
  
  console.log(`  Found ${connectors.length} connectors`);
  console.log('  Note: Connectors use encryptConnectorConfig which may have different format');
  console.log('  Checking for encrypted fields in config...\n');
  
  for (const conn of connectors) {
    const config = conn.config as any;
    let hasEncryptedFields = false;
    
    // Check common encrypted fields
    if (config && typeof config === 'object') {
      const potentiallyEncrypted = ['password', 'apiKey', 'token', '_accessKeyId', '_secretAccessKey'];
      const encryptedFields = potentiallyEncrypted.filter(field => 
        config[field] && typeof config[field] === 'string' && isLegacyFormat(config[field])
      );
      
      if (encryptedFields.length > 0) {
        hasEncryptedFields = true;
        console.log(`  ID ${conn.id}: ${conn.name}`);
        console.log(`    Found encrypted fields: ${encryptedFields.join(', ')}`);
        console.log(`    ⚠️  Connector encryption format may differ - manual review recommended`);
        stats.skipped++;
      }
    }
    
    if (!hasEncryptedFields) {
      stats.skipped++;
    }
  }
  
  console.log('');
  return stats;
}

/**
 * Main migration function
 */
async function migrate() {
  const execute = process.argv.includes('--execute');
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ENCRYPTION FORMAT MIGRATION');
  console.log('  CBC → GCM Format');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${execute ? '🔴 EXECUTE (will modify database)' : '🟡 DRY RUN (no changes)'}`);
  console.log('');
  
  if (!execute) {
    console.log('💡 This is a dry run. No data will be modified.');
    console.log('   Run with --execute flag to actually perform migration');
    console.log('');
  } else {
    console.log('⚠️  WARNING: This will modify your database!');
    console.log('   Make sure you have a backup before proceeding.');
    console.log('');
    console.log('   Waiting 5 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Get keys
  console.log('🔑 Checking encryption keys...\n');
  const { key: oldKey, source: keySource } = getOldKey();
  console.log(`  Old key source: ${keySource}`);
  console.log(`  New key: ENCRYPTION_KEY`);
  console.log('');
  
  // Migrate tables
  const idpStats = await migrateIdpExecutions(oldKey, execute);
  const connectorStats = await checkConnectorsTable(oldKey, execute);
  
  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('IDP Executions:');
  console.log(`  Total: ${idpStats.total}`);
  console.log(`  Migrated: ${idpStats.migrated}`);
  console.log(`  Skipped (already GCM): ${idpStats.skipped}`);
  console.log(`  Failed: ${idpStats.failed}`);
  console.log('');
  console.log('Connectors:');
  console.log(`  Total: ${connectorStats.total}`);
  console.log(`  Needs review: ${connectorStats.skipped}`);
  console.log('');
  
  if (idpStats.errors.length > 0) {
    console.log('❌ Errors:');
    idpStats.errors.forEach(err => {
      console.log(`  ID ${err.id} (${err.name}): ${err.error}`);
    });
    console.log('');
  }
  
  if (execute) {
    if (idpStats.failed === 0 && idpStats.migrated > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('📝 Next steps:');
      console.log('  1. Run verification: npm run migration:verify-encryption');
      console.log('  2. Test the application with migrated data');
      console.log('  3. Deploy new code (GCM-only version)');
      console.log('  4. Repeat for other environments (dev/prod)');
    } else if (idpStats.failed > 0) {
      console.log('⚠️  Migration completed with errors');
      console.log('   Review errors above and fix issues before deploying');
    } else {
      console.log('ℹ️  No data needed migration');
    }
  } else {
    console.log('💡 This was a dry run. Run with --execute to apply changes:');
    console.log('   npm run migration:encrypt-format --execute');
  }
  
  await prisma.$disconnect();
}

migrate().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});

