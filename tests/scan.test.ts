import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scanCommand } from '../src/commands/scan.js';
import * as nansen from '../src/lib/nansen.js';
import * as enricher from '../src/lib/enricher.js';
import * as formatter from '../src/lib/formatter.js';

vi.mock('../src/lib/nansen.js', () => ({
  fetchMarketScreener: vi.fn(),
  fetchTopHolders: vi.fn(),
  getApiCallCount: vi.fn().mockReturnValue(1),
}));

vi.mock('../src/lib/enricher.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/enricher.js')>();
  return {
    ...actual,
    enrichHolders: vi.fn(),
    filterSmartMoney: vi.fn(),
  };
});

vi.mock('../src/lib/formatter.js', () => ({
  printScanTable: vi.fn(),
}));

// Mock ora directly with chaining support
vi.mock('ora', () => {
  return {
    default: vi.fn(() => ({
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      warn: vi.fn().mockReturnThis(),
      info: vi.fn().mockReturnThis()
    }))
  };
});

describe('Scan Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMarkets = [
    {
      market_id: 'm1',
      question: 'Will something happen?',
      volume_usd: 150,
      category: 'Crypto',
      yes_price: 0.6,
      outcomes: ['YES', 'NO'],
      outcome_prices: [0.6, 0.4],
    },
    {
      market_id: 'm2',
      question: 'A very very very long question that will definitely get truncated by the 50 char limit?',
      volume_usd: 50,
      category: 'Politics',
      yes_price: 0.5,
      outcomes: ['A', 'B'],
      outcome_prices: [0.5, 0.5],
    },
    {
      market_id: 'm3',
      question: 'Missing category market',
      volume_usd: 100,
      yes_price: 0.5,
      outcomes: ['A', 'B'],
      outcome_prices: [0.5, 0.5],
    }
  ];

  it('fails quickly if fetchMarketScreener fails', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: false, error: 'API Error' });

    const res = await scanCommand({});
    expect(res).toEqual([]);
    expect(nansen.fetchMarketScreener).toHaveBeenCalled();
  });

  it('handles empty markets after category filter', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: mockMarkets });

    const res = await scanCommand({ category: 'non_existent_category' });
    expect(res).toEqual([]);
    expect(vi.mocked(formatter.printScanTable)).not.toHaveBeenCalled();
  });

  it('filters out markets correctly via minVolume', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: mockMarkets });
    
    // minVolume = 120 should filter out m2 (50) and m3 (100)
    const res = await scanCommand({ minVolume: '120' });
    expect(res).toEqual([]);
  });

  it('handles empty markets after filter', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: mockMarkets });

    // filter by category that doesn't exist
    const res = await scanCommand({ category: 'Sports', minVolume: '0' });
    expect(res).toEqual([]);
  });

  it('skips market if top holders fetch fails', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarkets[0]] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ success: false });

    const res = await scanCommand({});
    expect(res).toEqual([]);
    expect(formatter.printScanTable).toHaveBeenCalledWith([]);
  });

  it('handles fetchMarketScreener returning success: false without error property', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: false });
    const res = await scanCommand({});
    expect(res).toEqual([]);
  });

  it('handles fetchMarketScreener returning success: true without data property', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true } as any);
    const res = await scanCommand({});
    expect(res).toEqual([]);
  });

  it('prints divergence correctly when divergence score is exactly 0', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarkets[0]] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({
      success: true,
      data: [{ address: '0x1', shares: 100, position: 'YES' } as any]
    });
    vi.mocked(enricher.enrichHolders).mockResolvedValue([
      { address: '0x1', shares: 60, position: 'YES', is_smart_money: true, value_usd: 60 } as any,
      { address: '0x2', shares: 40, position: 'NO', is_smart_money: true, value_usd: 40 } as any
    ]);
    vi.mocked(enricher.filterSmartMoney).mockReturnValue([
      { address: '0x1', shares: 60, position: 'YES', is_smart_money: true, value_usd: 60 } as any,
      { address: '0x2', shares: 40, position: 'NO', is_smart_money: true, value_usd: 40 } as any
    ]);

    const res = await scanCommand({});
    expect(res.length).toBe(1);
    expect(res[0].divergence_score).toBe(0);
  });

  it('skips market if 0 holders returned', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarkets[0]] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ success: true, data: [] });

    const res = await scanCommand({});
    expect(res).toEqual([]);
  });

  it('handles error gracefully during market loop', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarkets[0]] });
    vi.mocked(nansen.fetchTopHolders).mockRejectedValue(new Error('Network drop'));

    const res = await scanCommand({});
    expect(res).toEqual([]);
  });
  
  it('handles non error thrown', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarkets[0]] });
    vi.mocked(nansen.fetchTopHolders).mockRejectedValue('String Error');

    const res = await scanCommand({});
    expect(res).toEqual([]);
  }); // To cover the `err instanceof Error` catch block branch

  it('processes markets and generates analysis', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: mockMarkets });
    
    // m1 will have smart money (divergence score > 0)
    vi.mocked(nansen.fetchTopHolders).mockResolvedValueOnce({
      success: true,
      data: [{ address: '0x1', shares: 100, position: 'YES' } as any],
    });
    vi.mocked(enricher.enrichHolders).mockResolvedValueOnce([
      { address: '0x1', shares: 100, position: 'YES', sm_labels: ['Smart DEX Trader'], value_usd: 100 } as any
    ]);
    vi.mocked(enricher.filterSmartMoney).mockReturnValueOnce([
      { address: '0x1', shares: 100, position: 'YES', sm_labels: ['Smart DEX Trader'], value_usd: 100 } as any
    ]);

    // m2 will have no smart money
    vi.mocked(nansen.fetchTopHolders).mockResolvedValueOnce({
      success: true,
      data: [{ address: '0x2', shares: 200, position: 'A' } as any],
    });
    vi.mocked(enricher.enrichHolders).mockResolvedValueOnce([
      { address: '0x2', shares: 200, position: 'A', sm_labels: [] } as any
    ]);
    vi.mocked(enricher.filterSmartMoney).mockReturnValueOnce([]);

    const res = await scanCommand({ limit: '10' });
    expect(res.length).toBe(2);
    // m1 analysis should have divergence score
    const m1Analysis = res.find((a: any) => a.market.market_id === 'm1');
    expect(m1Analysis?.sm_holders.length).toBe(1);

    const m2Analysis = res.find((a: any) => a.market.market_id === 'm2');
    expect(m2Analysis?.sm_holders.length).toBe(0);

    expect(formatter.printScanTable).toHaveBeenCalledWith(res);
  });
});
