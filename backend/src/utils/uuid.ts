let cachedUuidModule: typeof import('uuid') | null = null;

export async function uuidv4(): Promise<string> {
  if (!cachedUuidModule) {
    cachedUuidModule = await import('uuid');
  }

  return cachedUuidModule.v4();
}

