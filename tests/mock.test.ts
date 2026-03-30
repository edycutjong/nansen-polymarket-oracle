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

    const defaultData = getMockData('research prediction-market market-screener', []);
    expect((defaultData as any[]).length).toBe(12);

    const noValueLimit = getMockData('research prediction-market market-screener', ['--limit']);
    expect((noValueLimit as any[]).length).toBe(12);

    expect(markets[0]).toHaveProperty('market_id');
    expect(markets[0]).toHaveProperty('question');
    expect(markets[0]).toHaveProperty('last_trade_price');
  });

  it('returns top holders with SM and regular wallets', () => {
    const data = getMockData('research prediction-market top-holders', [
      '--market-id', 'pm_btc_200k_june',
    ]);
    expect(data).toBeInstanceOf(Array);
    const holders = data as Array<Record<string, unknown>>;
    expect(holders.length).toBeGreaterThan(0);
    expect(holders[0]).toHaveProperty('address');
    expect(holders[0]).toHaveProperty('side');
    expect(holders[0]).toHaveProperty('position_size');

    // Test different yesPrice branches in generateTopHolders
    getMockData('research prediction-market top-holders', ['--market-id', 'pm_btc_200k_june']); // low yes price < 0.4
    getMockData('research prediction-market top-holders', ['--market-id', 'pm_sol_firedancer']); // high yes price > 0.7
    getMockData('research prediction-market top-holders', ['--market-id', 'pm_argentina_imf_deal']); // medium price
    getMockData('research prediction-market top-holders', ['--market-id']); // missing arg
    getMockData('research prediction-market top-holders', []); // missing --market-id entirely
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

    // Test missing Address argument
    expect(getMockData('research profiler labels', ['--address'])).toBeInstanceOf(Array);
    expect(getMockData('research profiler labels', [])).toBeInstanceOf(Array);
  });

  it('returns empty labels for unknown addresses', () => {
    const origRandom = Math.random;
    Math.random = () => 0.5;
    expect(getMockData('research profiler labels', ['--address', '0x1111222233334444555566667777888899990000'])).toEqual([]);
    
    // Also cover the random branch in labels
    Math.random = () => 0.8;
    const randomLabels = getMockData('research profiler labels', ['--address', '0xunknown']) as any[];
    expect(randomLabels[0]).toHaveProperty('category', 'Activity');
    Math.random = origRandom;
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

  it('generateMarketOHLCV', () => {
    const data = getMockData('polymarket ohlcv pm_1') as any[];
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('timestamp');
      expect(data[0]).toHaveProperty('open');
      expect(data[0]).toHaveProperty('high');
      expect(data[0]).toHaveProperty('low');
      expect(data[0]).toHaveProperty('close');
      expect(data[0]).toHaveProperty('volume');
    }
  });

  it('generateOrderbook', () => {
    const data = getMockData('polymarket orderbook pm_1') as any;
    expect(data).toHaveProperty('bids');
    expect(data).toHaveProperty('asks');
    expect(Array.isArray(data.bids)).toBe(true);
    expect(Array.isArray(data.asks)).toBe(true);
  });

  it('generatePnlByAddress', () => {
    const data = getMockData('polymarket pnl-by-address 0x123') as any[];
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('address');
      expect(data[0]).toHaveProperty('realized_pnl_usd');
    }
  });

  it('generateTradesByAddress', () => {
    const data = getMockData('polymarket trades-by-address 0x123') as any[];
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('address');
      expect(data[0]).toHaveProperty('side');
    }
  });

  it('generatePositionDetail', () => {
    const data = getMockData('polymarket position-detail pm_1') as any;
    expect(data).toHaveProperty('total_holders');
    expect(data).toHaveProperty('yes_holders');
    expect(data).toHaveProperty('holders');
  });

  it('generateCategories', () => {
    const data = getMockData('polymarket categories') as any[];
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('slug');
      expect(data[0]).toHaveProperty('name');
    }
  });

  it('generateSmartMoneyNetflow / holdings', () => {
    const flowData = getMockData('smart-money netflow') as any[];
    const holdData = getMockData('smart-money holdings') as any[];
    expect(Array.isArray(flowData)).toBe(true);
    expect(Array.isArray(holdData)).toBe(true);
    if (flowData.length > 0) {
      expect(flowData[0]).toHaveProperty('token_symbol');
      expect(flowData[0]).toHaveProperty('net_flow_24h_usd');
    }
  });

  it('generateAccount', () => {
    const data = getMockData('account') as any;
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('tier');
  });
});
