/**
 * Response Cache for Common Queries
 * Caches frequently asked questions for instant responses
 */

interface CacheEntry {
  message: string;
  sources: string[];
  products?: any[];
  timestamp: number;
  hits: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxAge = 3600000; // 1 hour in milliseconds
  private maxSize = 100; // Maximum cache entries

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  get(query: string): CacheEntry | null {
    const key = this.normalizeQuery(query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    console.log(`💾 Cache HIT for "${query}" (${entry.hits} hits)`);
    return entry;
  }

  set(query: string, message: string, sources: string[], products?: any[]): void {
    const key = this.normalizeQuery(query);

    // Limit cache size
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      message,
      sources,
      products,
      timestamp: Date.now(),
      hits: 1,
    });

    console.log(`💾 Cached response for "${query}"`);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        query: key,
        hits: entry.hits,
        age: Math.floor((Date.now() - entry.timestamp) / 1000) + 's',
      })),
    };
  }
}

// Singleton instance
let cacheInstance: ResponseCache | null = null;

export function getResponseCache(): ResponseCache {
  if (!cacheInstance) {
    cacheInstance = new ResponseCache();
  }
  return cacheInstance;
}

