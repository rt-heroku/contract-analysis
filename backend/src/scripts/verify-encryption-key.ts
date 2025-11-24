import crypto from 'crypto';
import prisma from '../config/database';

/**
 * Verify which encryption key is being used for the OLD CBC format
 * 
 * This tests both ENCRYPTION_KEY and JWT_SECRET to see which one
 * can successfully decrypt existing data
 * 
 * Usage:
 *   npm run migration:verify-key
 */

const IV_LENGTH = 16;
const ALGORITHM_CBC = 'aes-256-cbc';

/**
 * Get legacy key using ENCRYPTION_KEY
 */
function getLegacyKeyFromEncryptionKey(): Buffer | null {
  if (!process.env.ENCRYPTION_KEY) {
    return null;
  }
  try {
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  } catch {
    return null;
  }
}

/**
 * Get legacy key using JWT_SECRET via scrypt
 */
function getLegacyKeyFromJwtSecret(): Buffer | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }
  try {
    return crypto.scryptSync(jwtSecret, 'salt', 32);
  } catch {
    return null;
  }
}

/**
 * Try to decrypt with CBC format
 */
function tryDecryptCBC(encryptedData: string, key: Buffer): { success: boolean; result?: string; error?: string } {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid format (not colon-separated)' };
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM_CBC, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return { success: true, result: decrypted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if data is in legacy CBC format
 */
function isLegacyFormat(encryptedData: string): boolean {
  return encryptedData.includes(':') && /^[0-9a-f]+:[0-9a-f]+$/i.test(encryptedData);
}

async function verifyEncryptionKey() {
  console.log('\n🔍 Verifying which encryption key is being used...\n');
  
  // Check environment variables
  const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
  const hasJwtSecret = !!process.env.JWT_SECRET;
  
  console.log('Environment variables:');
  console.log(`  ENCRYPTION_KEY: ${hasEncryptionKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`  JWT_SECRET: ${hasJwtSecret ? '✅ Set' : '❌ Not set'}`);
  console.log('');
  
  if (!hasEncryptionKey && !hasJwtSecret) {
    console.error('❌ Neither ENCRYPTION_KEY nor JWT_SECRET is set!');
    console.error('   Cannot proceed with verification.');
    process.exit(1);
  }
  
  // Get keys
  const encryptionKey = getLegacyKeyFromEncryptionKey();
  const jwtKey = getLegacyKeyFromJwtSecret();
  
  console.log('Available keys:');
  console.log(`  ENCRYPTION_KEY (as buffer): ${encryptionKey ? '✅ Valid' : '❌ Invalid/Missing'}`);
  console.log(`  JWT_SECRET (via scrypt): ${jwtKey ? '✅ Valid' : '❌ Invalid/Missing'}`);
  console.log('');
  
  // Get sample data from database
  console.log('📋 Fetching sample IDP execution...\n');
  
  const sample = await prisma.idpExecution.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      authClientId: true,
    },
  });
  
  if (!sample) {
    console.log('❌ No IDP executions found in database');
    await prisma.$disconnect();
    process.exit(0);
  }
  
  console.log(`Sample: ID ${sample.id} | Name: ${sample.name}`);
  console.log(`  Encrypted value preview: ${sample.authClientId.substring(0, 50)}...`);
  console.log(`  Format: ${isLegacyFormat(sample.authClientId) ? 'Legacy CBC (colon-separated hex)' : 'New GCM (base64)'}`);
  console.log('');
  
  if (!isLegacyFormat(sample.authClientId)) {
    console.log('✅ Data is already in new GCM format - no migration needed!');
    await prisma.$disconnect();
    process.exit(0);
  }
  
  // Test decryption with each key
  console.log('🔐 Testing decryption with available keys...\n');
  
  let workingKey: 'ENCRYPTION_KEY' | 'JWT_SECRET' | null = null;
  let decryptedValue: string | null = null;
  
  if (encryptionKey) {
    console.log('Testing ENCRYPTION_KEY:');
    const result = tryDecryptCBC(sample.authClientId, encryptionKey);
    if (result.success) {
      console.log('  ✅ SUCCESS! Decrypted value:', result.result?.substring(0, 20) + '...');
      workingKey = 'ENCRYPTION_KEY';
      decryptedValue = result.result!;
    } else {
      console.log('  ❌ Failed:', result.error);
    }
    console.log('');
  }
  
  if (jwtKey && !workingKey) {
    console.log('Testing JWT_SECRET (via scrypt):');
    const result = tryDecryptCBC(sample.authClientId, jwtKey);
    if (result.success) {
      console.log('  ✅ SUCCESS! Decrypted value:', result.result?.substring(0, 20) + '...');
      workingKey = 'JWT_SECRET';
      decryptedValue = result.result!;
    } else {
      console.log('  ❌ Failed:', result.error);
    }
    console.log('');
  }
  
  // Summary
  console.log('━'.repeat(60));
  console.log('');
  
  if (workingKey) {
    console.log('✅ RESULT: Data can be decrypted with:', workingKey);
    console.log('');
    console.log('📝 Migration Instructions:');
    console.log('');
    console.log('1. The migration script will automatically use the working key');
    console.log('2. Make sure this environment variable is set when running migration:');
    if (workingKey === 'ENCRYPTION_KEY') {
      console.log('   ENCRYPTION_KEY=<your_encryption_key>');
    } else {
      console.log('   JWT_SECRET=<your_jwt_secret>');
    }
    console.log('');
    console.log('3. After migration, the new code will use ENCRYPTION_KEY only');
    console.log('   (JWT_SECRET will no longer be used for encryption)');
    console.log('');
    console.log('Next step: Run migration with:');
    console.log('  npm run migration:encrypt-format');
  } else {
    console.log('❌ RESULT: Could not decrypt data with any available key!');
    console.log('');
    console.log('⚠️  Possible issues:');
    console.log('  1. The ENCRYPTION_KEY or JWT_SECRET values are incorrect');
    console.log('  2. The data was encrypted with different credentials');
    console.log('  3. The data format is corrupted');
    console.log('');
    console.log('💡 Try:');
    console.log('  1. Check Heroku config for the correct keys:');
    console.log('     heroku config:get ENCRYPTION_KEY -a contract-dev');
    console.log('     heroku config:get JWT_SECRET -a contract-dev');
    console.log('  2. Make sure you\'re testing against the correct database');
    console.log('  3. Try on the reverted (working) version to confirm keys');
  }
  
  await prisma.$disconnect();
}

verifyEncryptionKey().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

