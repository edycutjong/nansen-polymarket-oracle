/**
 * Unit tests for the mock data system.
 */

import { describe, it, expect } from 'vitest';
import { getMockData } from '../src/lib/mock.js';

describe('getMockData', () => {
  it('returns market screener data', () => {
    const data = getMockData('research prediction-market market-screener', ['--limit', '5']);
    expect(data).toBeInstanceOf(Array);
    const markets = data as Array<Record<string, unknown>>;
    expect(markets.length).toBeLessThanOrEqual(5);
    expect(markets[0]).toHaveProperty('market_id');
    expect(markets[0]).toHaveProperty('question');
    expect(markets[0]).toHaveProperty('yes_price');
  });

  it('returns top holders with SM and regular wallets', () => {
    const data = getMockData('research prediction-market top-holders', [
      '--market-id', 'pm_btc_200k_june',
    ]);
    expect(data).toBeInstanceOf(Array);
    const holders = data as Array<Record<string, unknown>>;
    expect(holders.length).toBeGreaterThan(0);
    expect(holders[0]).toHaveProperty('address');
    expect(holders[0]).toHaveProperty('position');
    expect(holders[0]).toHaveProperty('value_usd');
  });

  it('returns profiler labels for SM wallets', () => {
    // Known SM address from mock
    const data = getMockData('research profiler labels', [
      '--address', '0xA1B2C3D4E5F6789012345678901234567890ABCD',
    ]);
    expect(data).toBeInstanceOf(Array);
    const labels = data as Array<Record<string, unknown>>;
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toHaveProperty('label');
    expect(labels[0].label).toBe('Fund');
  });

  it('returns empty labels for unknown addresses', () => {
    const data = getMockData('research profiler labels', [
      '--address', '0x0000000000000000000000000000000000000000',
    ]);
    // Could be empty array or array with non-SM label
    expect(data).toBeInstanceOf(Array);
    const labels = data as Array<Record<string, unknown>>;
    // Non-SM wallets: either [] or a non-SM label
    if (labels.length > 0) {
      expect(labels[0].label).not.toBe('Fund');
    }
  });

  it('returns event screener data', () => {
    const data = getMockData('research prediction-market event-screener');
    expect(data).toBeInstanceOf(Array);
    const events = data as Array<Record<string, unknown>>;
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty('event_slug');
  });

  it('returns OHLCV data', () => {
    const data = getMockData('research prediction-market ohlcv', ['--market-id', 'test']);
    expect(data).toBeInstanceOf(Array);
    const candles = data as Array<Record<string, unknown>>;
    expect(candles.length).toBe(48);
    expect(candles[0]).toHaveProperty('open');
    expect(candles[0]).toHaveProperty('close');
    expect(candles[0]).toHaveProperty('volume');
  });

  it('returns orderbook data', () => {
    const data = getMockData('research prediction-market orderbook') as Record<string, unknown>;
    expect(data).toHaveProperty('bids');
    expect(data).toHaveProperty('asks');
    expect(data).toHaveProperty('spread');
    expect(data).toHaveProperty('midpoint');
  });

  it('returns categories', () => {
    const data = getMockData('research prediction-market categories');
    expect(data).toBeInstanceOf(Array);
    const cats = data as Array<Record<string, unknown>>;
    expect(cats.length).toBeGreaterThanOrEqual(4);
    expect(cats[0]).toHaveProperty('slug');
    expect(cats[0]).toHaveProperty('name');
  });

  it('returns null for unknown commands', () => {
    const data = getMockData('unknown-command foo');
    expect(data).toBeNull();
  });

  it('returns account data', () => {
    const data = getMockData('account') as Record<string, unknown>;
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('tier');
    expect(data).toHaveProperty('credits_remaining');
  });
});
