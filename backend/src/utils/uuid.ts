import { v4 as uuidv4Generator } from 'uuid';

export async function uuidv4(): Promise<string> {
  return uuidv4Generator();
}

export function uuidv4Sync(): string {
  return uuidv4Generator();
}

