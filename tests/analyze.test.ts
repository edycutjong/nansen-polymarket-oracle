import { vi, describe, it, expect, beforeEach } from 'vitest';
import { analyzeCommand } from '../src/commands/analyze.js';
import * as nansen from '../src/lib/nansen.js';
import * as enricher from '../src/lib/enricher.js';
import * as formatter from '../src/lib/formatter.js';

vi.mock('../src/lib/nansen.js', () => ({
  fetchMarketScreener: vi.fn(),
  fetchTopHolders: vi.fn(),
  fetchTradesByMarket: vi.fn(),
  fetchPnlByMarket: vi.fn(),
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
  printMarketDetail: vi.fn(),
}));

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

describe('Analyze Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMarket = {
    market_id: 'm1',
    market_slug: 'm1-slug',
    question: 'Will it happen?',
    volume_usd: 1000,
    outcomes: ['YES', 'NO'],
    outcome_prices: [0.6, 0.4]
  };

  it('handles market not found in screener', async () => {
    // Return empty array
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [] });
    // Holders fails
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ success: false, error: 'no holders' });

    await analyzeCommand({ marketId: 'm1' });
    
    expect(nansen.fetchMarketScreener).toHaveBeenCalled();
    expect(nansen.fetchTopHolders).toHaveBeenCalledWith('m1', 100);
    // Formatter shouldn't be called if holders fail
    expect(formatter.printMarketDetail).not.toHaveBeenCalled();
  });

  it('runs successful analysis flow with all data', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarket] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ 
      success: true, 
      data: [{ address: '0x1', amount: 100 }]
    });
    vi.mocked(enricher.enrichHolders).mockResolvedValue([
      { address: '0x1', amount: 100, sm_labels: ['Smart DEX Trader'] } as any
    ]);
    vi.mocked(enricher.filterSmartMoney).mockReturnValue([
      { address: '0x1', amount: 100, sm_labels: ['Smart DEX Trader'] } as any
    ]);
    
    vi.mocked(nansen.fetchTradesByMarket).mockResolvedValue({
      success: true,
      data: [
        { address: '0x1', side: 'BUY', outcome: 'YES', value_usd: '500', timestamp: '2023-01-01' },
        { address: '0x1', side: 'SELL', outcome: 'NO', timestamp: '2023-01-02' }, // Missing value_usd
        { address: '0x2', side: 'SELL' } // Non-SM trade
      ]
    });

    vi.mocked(nansen.fetchPnlByMarket).mockResolvedValue({
      success: true,
      data: [{ address: '0x1', pnl: 100 }]
    });

    await analyzeCommand({ marketId: 'm1-slug' });

    expect(nansen.fetchMarketScreener).toHaveBeenCalled();
    expect(formatter.printMarketDetail).toHaveBeenCalled();
    expect(nansen.fetchTradesByMarket).toHaveBeenCalled();
    expect(nansen.fetchPnlByMarket).toHaveBeenCalled();
  });

  it('handles missing trades and missing pnl gracefully', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: false }); // Fails gracefully
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ 
      success: true, 
      data: [{ address: '0x1', amount: 100 }]
    });
    vi.mocked(enricher.enrichHolders).mockResolvedValue([]);
    vi.mocked(enricher.filterSmartMoney).mockReturnValue([]);
    
    vi.mocked(nansen.fetchTradesByMarket).mockResolvedValue({ success: false });
    vi.mocked(nansen.fetchPnlByMarket).mockResolvedValue({ success: false });

    await analyzeCommand({ marketId: 'm1' });

    expect(formatter.printMarketDetail).toHaveBeenCalled();
  });

  it('handles empty holders array gracefully', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarket] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ success: true, data: [] });
    vi.mocked(enricher.enrichHolders).mockResolvedValue([]);
    vi.mocked(enricher.filterSmartMoney).mockReturnValue([]);
    vi.mocked(nansen.fetchTradesByMarket).mockResolvedValue({ success: true, data: [] });
    vi.mocked(nansen.fetchPnlByMarket).mockResolvedValue({ success: true, data: [] });

    await analyzeCommand({ marketId: 'm1' });
    expect(formatter.printMarketDetail).toHaveBeenCalled();
  });
});
