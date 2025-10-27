import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove hash and normalize
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function createHash(text: string): string {
  // Simple hash function for deduplication
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


