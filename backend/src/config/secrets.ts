/**
 * Dynamic Secrets Configuration
 * 
 * Loads JWT_SECRET and ENCRYPTION_KEY from database first, then falls back to environment variables.
 * This ensures consistency across deployments and prevents password mismatch issues.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache for secrets to avoid repeated DB queries
let secretsCache: {
  jwtSecret?: string;
  encryptionKey?: string;
  lastFetch?: number;
} = {};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get JWT_SECRET from database or environment
 * Priority: Database > Environment Variable > Default (dev only)
 */
export async function getJwtSecret(): Promise<string> {
  try {
    // Check cache first
    if (
      secretsCache.jwtSecret &&
      secretsCache.lastFetch &&
      Date.now() - secretsCache.lastFetch < CACHE_TTL
    ) {
      return secretsCache.jwtSecret;
    }

    // Try to get from database
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'jwt_secret' },
    });

    if (setting?.settingValue) {
      secretsCache.jwtSecret = setting.settingValue;
      secretsCache.lastFetch = Date.now();
      return setting.settingValue;
    }

    // Fall back to environment variable
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }

    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Using default JWT_SECRET - NOT SUITABLE FOR PRODUCTION');
      return 'dev-jwt-secret-change-in-production';
    }

    throw new Error('JWT_SECRET not found in database or environment variables');
  } catch (error: any) {
    // If database is not available, fall back to environment
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === 'development') {
      return 'dev-jwt-secret-change-in-production';
    }

    throw new Error('JWT_SECRET not configured');
  }
}

/**
 * Get ENCRYPTION_KEY from database or environment
 * Priority: Database > Environment Variable > Default (dev only)
 */
export async function getEncryptionKey(): Promise<string> {
  try {
    // Check cache first
    if (
      secretsCache.encryptionKey &&
      secretsCache.lastFetch &&
      Date.now() - secretsCache.lastFetch < CACHE_TTL
    ) {
      return secretsCache.encryptionKey;
    }

    // Try to get from database
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'encryption_key' },
    });

    if (setting?.settingValue) {
      secretsCache.encryptionKey = setting.settingValue;
      secretsCache.lastFetch = Date.now();
      return setting.settingValue;
    }

    // Fall back to environment variable
    if (process.env.ENCRYPTION_KEY) {
      return process.env.ENCRYPTION_KEY;
    }

    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Using default ENCRYPTION_KEY - NOT SUITABLE FOR PRODUCTION');
      return 'dev-encryption-key-32-characters';
    }

    throw new Error('ENCRYPTION_KEY not found in database or environment variables');
  } catch (error: any) {
    // If database is not available, fall back to environment
    if (process.env.ENCRYPTION_KEY) {
      return process.env.ENCRYPTION_KEY;
    }

    if (process.env.NODE_ENV === 'development') {
      return 'dev-encryption-key-32-characters';
    }

    throw new Error('ENCRYPTION_KEY not configured');
  }
}

/**
 * Get JWT_SECRET synchronously (uses cached value or env var)
 * Use getJwtSecret() async version when possible
 */
export function getJwtSecretSync(): string {
  if (secretsCache.jwtSecret) {
    return secretsCache.jwtSecret;
  }

  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'dev-jwt-secret-change-in-production';
  }

  throw new Error('JWT_SECRET not available synchronously - use getJwtSecret() instead');
}

/**
 * Clear the secrets cache (useful for testing or after updating settings)
 */
export function clearSecretsCache(): void {
  secretsCache = {};
}

/**
 * Initialize secrets cache on startup
 */
export async function initializeSecrets(): Promise<void> {
  try {
    await getJwtSecret();
    await getEncryptionKey();
    console.log('✅ Secrets initialized from database');
  } catch (error: any) {
    console.warn('⚠️  Failed to initialize secrets from database, using environment variables');
    console.warn('   Error:', error.message);
  }
}

