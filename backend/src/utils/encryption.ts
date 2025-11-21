import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key (32 bytes for AES-256)
 */
function getKey(): Buffer {
  // Use first 32 bytes of the key
  return Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
}

/**
 * Encrypt a string value
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(getKey(), salt, 100000, 32, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt an encrypted string
 */
export function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.subarray(ENCRYPTED_POSITION);
  
  const key = crypto.pbkdf2Sync(getKey(), salt, 100000, 32, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Encrypt connector config passwords
 */
export function encryptConnectorConfig(config: any): any {
  if (!config) return config;
  
  const encrypted = { ...config };
  
  // Encrypt password field if it exists
  if (encrypted.password) {
    encrypted.password = encrypt(encrypted.password);
  }
  
  // Encrypt API key if it exists
  if (encrypted.apiKey) {
    encrypted.apiKey = encrypt(encrypted.apiKey);
  }
  
  // Encrypt token if it exists
  if (encrypted.token) {
    encrypted.token = encrypt(encrypted.token);
  }
  
  return encrypted;
}

/**
 * Decrypt connector config passwords
 */
export function decryptConnectorConfig(config: any): any {
  if (!config) return config;
  
  const decrypted = { ...config };
  
  try {
    // Decrypt password field if it exists
    if (decrypted.password) {
      decrypted.password = decrypt(decrypted.password);
    }
    
    // Decrypt API key if it exists
    if (decrypted.apiKey) {
      decrypted.apiKey = decrypt(decrypted.apiKey);
    }
    
    // Decrypt token if it exists
    if (decrypted.token) {
      decrypted.token = decrypt(decrypted.token);
    }
  } catch (error) {
    // If decryption fails, assume it's already decrypted or invalid
    console.warn('Failed to decrypt config, using as-is:', error);
  }
  
  return decrypted;
}

/**
 * Check if a string is encrypted
 */
export function isEncrypted(value: string): boolean {
  try {
    const buffer = Buffer.from(value, 'base64');
    return buffer.length > (SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  } catch {
    return false;
  }
}

/**
 * Mask a secret string (show only first 4 chars)
 */
export function maskSecret(value: string): string {
  if (!value || value.length < 8) {
    return '********';
  }
  return value.substring(0, 4) + '********';
}

/**
 * Parse IDP URL to extract components
 * Expected format: protocol://host/api/v1/organizations/ORG_ID/actions/ACTION_ID/versions/VERSION/executions
 */
export function parseIdpUrl(url: string): any {
  try {
    const urlPattern = /^(.+):\/\/(.+?)\/api\/v1\/organizations\/([^\/]+)\/actions\/([^\/]+)\/versions\/([^\/]+)\/executions$/;
    const match = url.match(urlPattern);
    
    if (!match) {
      return null;
    }
    
    return {
      protocol: match[1],
      host: match[2],
      baseUrl: `${match[1]}://${match[2]}`,
      organizationId: match[3],
      actionId: match[4],
      version: match[5],
    };
  } catch (error) {
    return null;
  }
}

/**
 * Default export object for compatibility with existing code
 */
export const encryption = {
  encrypt,
  decrypt,
  encryptConnectorConfig,
  decryptConnectorConfig,
  isEncrypted,
  maskSecret,
  parseIdpUrl,
};
