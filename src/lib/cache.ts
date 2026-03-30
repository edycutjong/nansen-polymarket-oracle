/**
 * Simple in-memory TTL cache to reduce API calls during scans.
 * Labels rarely change, so caching for 5 minutes is safe.
 */

interface CacheEntry<T> {
  data: T;
  expires_at: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires_at) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expires_at: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /** Cache-through helper: returns cached value or calls the fetch fn */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const data = await fetchFn();
    this.set(key, data, ttlMs);
    return data;
  }
}

/** Global label cache — shared across commands */
export const labelCache = new Cache(5 * 60 * 1000);  // 5 min
/** Global market cache */
export const marketCache = new Cache(2 * 60 * 1000);  // 2 min
