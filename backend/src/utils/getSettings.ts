import prisma from '../config/database';
import logger from './logger';

// Cache for settings to avoid excessive database calls
let settingsCache: Record<string, string | null> = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Get a specific setting value from database with caching
 * 
 * IMPORTANT: This function only retrieves the DATABASE value.
 * For configuration priority order, use this pattern in your code:
 * 
 * Priority Order:
 * 1. Property file (not implemented yet)
 * 2. Database (system_settings table) ← This function returns this
 * 3. Environment variables (should override DB) ← Check process.env AFTER calling this
 * 
 * Example usage:
 * ```typescript
 * const dbValue = await getSetting('my_setting', null);
 * const finalValue = process.env.MY_SETTING || dbValue || 'default';
 * ```
 */
export async function getSetting(key: string, defaultValue?: string | null): Promise<string | null> {
  try {
    // Check if cache is valid
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_DURATION && key in settingsCache) {
      return settingsCache[key];
    }

    // Fetch from database
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });

    const value = setting?.settingValue || defaultValue || null;
    settingsCache[key] = value;
    cacheTimestamp = now;

    return value;
  } catch (error: any) {
    logger.error(`Failed to get setting: ${key}`, error.message);
    return defaultValue || null;
  }
}

/**
 * Get all settings from database with caching
 */
export async function getAllSettings(): Promise<Record<string, string | null>> {
  try {
    // Check if cache is valid
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_DURATION && Object.keys(settingsCache).length > 0) {
      return settingsCache;
    }

    // Fetch from database
    const settings = await prisma.systemSetting.findMany();
    
    settingsCache = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue;
      return acc;
    }, {} as Record<string, string | null>);
    
    cacheTimestamp = now;

    return settingsCache;
  } catch (error: any) {
    logger.error('Failed to get all settings', error.message);
    return {};
  }
}

/**
 * Clear the settings cache
 */
export function clearSettingsCache(): void {
  settingsCache = {};
  cacheTimestamp = 0;
}

