import prisma from '../config/database';
import crypto from 'crypto';

/**
 * Encryption Tool CLI
 * 
 * Usage:
 *   # Test decrypt a single value with different keys
 *   ENCRYPTION_KEY=<key> npm run encryption:test <encrypted_value>
 * 
 *   # Migrate all IDP executions from old key to new key
 *   OLD_ENCRYPTION_KEY=<old_key> ENCRYPTION_KEY=<new_key> npm run encryption:migrate
 * 
 *   # List all IDP executions and test decrypt
 *   ENCRYPTION_KEY=<key> npm run encryption:list
 * 
 *   # Encrypt a plain value
 *   ENCRYPTION_KEY=<key> npm run encryption:encrypt <plain_value>
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getKey(keyHex: string): Buffer {
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

function encrypt(text: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(getKey(encryptionKey), salt, 100000, 32, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

function decrypt(encryptedData: string, encryptionKey: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.subarray(ENCRYPTED_POSITION);
  
  const key = crypto.pbkdf2Sync(getKey(encryptionKey), salt, 100000, 32, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

async function testDecrypt() {
  const encryptedValue = process.argv[3];
  const testKey = process.env.ENCRYPTION_KEY;

  if (!encryptedValue) {
    console.error('❌ Please provide an encrypted value to test');
    console.log('Usage: ENCRYPTION_KEY=<key> npm run encryption:test <encrypted_value>');
    process.exit(1);
  }

  if (!testKey) {
    console.error('❌ ENCRYPTION_KEY environment variable not set');
    process.exit(1);
  }

  try {
    const decrypted = decrypt(encryptedValue, testKey);
    console.log('✅ Decryption successful!');
    console.log('Decrypted value:', decrypted);
  } catch (error: any) {
    console.error('❌ Decryption failed:', error.message);
    process.exit(1);
  }
}

async function encryptValue() {
  const plainValue = process.argv[3];
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!plainValue) {
    console.error('❌ Please provide a plain value to encrypt');
    console.log('Usage: ENCRYPTION_KEY=<key> npm run encryption:encrypt <plain_value>');
    process.exit(1);
  }

  if (!encryptionKey) {
    console.error('❌ ENCRYPTION_KEY environment variable not set');
    process.exit(1);
  }

  try {
    const encrypted = encrypt(plainValue, encryptionKey);
    console.log('✅ Encryption successful!');
    console.log('Encrypted value:', encrypted);
  } catch (error: any) {
    console.error('❌ Encryption failed:', error.message);
    process.exit(1);
  }
}

async function listIdpExecutions() {
  const testKey = process.env.ENCRYPTION_KEY;

  if (!testKey) {
    console.error('❌ ENCRYPTION_KEY environment variable not set');
    process.exit(1);
  }

  const executions = await prisma.idpExecution.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      authClientId: true,
      userId: true,
    },
  });

  console.log(`\n📋 Found ${executions.length} IDP executions\n`);

  for (const exec of executions) {
    console.log(`ID: ${exec.id} | Name: ${exec.name} | User: ${exec.userId}`);
    
    try {
      const decrypted = decrypt(exec.authClientId, testKey);
      console.log(`  ✅ Client ID decrypts to: ${decrypted.substring(0, 10)}...`);
    } catch (error) {
      console.log(`  ❌ Failed to decrypt Client ID`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

async function migrateIdpExecutions() {
  const oldKey = process.env.OLD_ENCRYPTION_KEY;
  const newKey = process.env.ENCRYPTION_KEY;

  if (!oldKey || !newKey) {
    console.error('❌ Both OLD_ENCRYPTION_KEY and ENCRYPTION_KEY must be set');
    console.log('Usage: OLD_ENCRYPTION_KEY=<old> ENCRYPTION_KEY=<new> npm run encryption:migrate');
    process.exit(1);
  }

  const executions = await prisma.idpExecution.findMany({
    where: { isActive: true },
  });

  console.log(`\n🔄 Migrating ${executions.length} IDP executions...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const exec of executions) {
    try {
      console.log(`Processing ID ${exec.id}: ${exec.name}`);

      // Decrypt with old key
      const clientId = decrypt(exec.authClientId, oldKey);
      const clientSecret = decrypt(exec.authClientSecret, oldKey);
      const username = exec.anypointUsername ? decrypt(exec.anypointUsername, oldKey) : null;
      const password = exec.anypointPassword ? decrypt(exec.anypointPassword, oldKey) : null;

      console.log('  ✅ Decrypted with old key');

      // Re-encrypt with new key
      const newClientId = encrypt(clientId, newKey);
      const newClientSecret = encrypt(clientSecret, newKey);
      const newUsername = username ? encrypt(username, newKey) : null;
      const newPassword = password ? encrypt(password, newKey) : null;

      console.log('  ✅ Re-encrypted with new key');

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

      console.log('  ✅ Updated in database\n');
      successCount++;
    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log(`\n📊 Migration complete:`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);

  await prisma.$disconnect();
}

// Main execution
const command = process.argv[2];

(async () => {
  try {
    if (command === 'test') {
      await testDecrypt();
    } else if (command === 'list') {
      await listIdpExecutions();
    } else if (command === 'migrate') {
      await migrateIdpExecutions();
    } else if (command === 'encrypt') {
      await encryptValue();
    } else {
      console.log('Encryption Tool CLI\n');
      console.log('Commands:');
      console.log('  test <encrypted_value>  - Test decrypt with ENCRYPTION_KEY');
      console.log('  encrypt <plain_value>   - Encrypt a value with ENCRYPTION_KEY');
      console.log('  list                    - List all IDP executions and test decrypt');
      console.log('  migrate                 - Migrate from OLD_ENCRYPTION_KEY to ENCRYPTION_KEY');
      console.log('\nExamples:');
      console.log('  ENCRYPTION_KEY=abc123... npm run encryption:test "base64value..."');
      console.log('  ENCRYPTION_KEY=abc123... npm run encryption:encrypt "my-client-id"');
      console.log('  ENCRYPTION_KEY=abc123... npm run encryption:list');
      console.log('  OLD_ENCRYPTION_KEY=old123 ENCRYPTION_KEY=new456 npm run encryption:migrate');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();

