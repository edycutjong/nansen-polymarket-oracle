/**
 * Unit tests for the TTL cache.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cache } from '../src/lib/cache.js';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(1000); // 1s TTL for tests
  });

  it('stores and retrieves values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    vi.useFakeTimers();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(1100); // past 1s TTL
    expect(cache.get('key1')).toBeUndefined();
    vi.useRealTimers();
  });

  it('reports correct has()', () => {
    cache.set('k', 'v');
    expect(cache.has('k')).toBe(true);
    expect(cache.has('x')).toBe(false);
  });

  it('clears all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('getOrFetch caches the result', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount++;
      return 'fetched_value';
    };

    const v1 = await cache.getOrFetch('key', fetchFn);
    expect(v1).toBe('fetched_value');
    expect(callCount).toBe(1);

    const v2 = await cache.getOrFetch('key', fetchFn);
    expect(v2).toBe('fetched_value');
    expect(callCount).toBe(1); // not called again
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
