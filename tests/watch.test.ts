import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { watchCommand } from '../src/commands/watch.js';
import * as nansen from '../src/lib/nansen.js';
import * as enricher from '../src/lib/enricher.js';
import * as formatter from '../src/lib/formatter.js';
import * as analyzer from '../src/lib/analyzer.js';
import { labelCache, marketCache } from '../src/lib/cache.js';

vi.mock('../src/lib/nansen.js', () => ({
  fetchMarketScreener: vi.fn(),
  fetchTopHolders: vi.fn(),
  getApiCallCount: vi.fn().mockReturnValue(1),
}));

vi.mock('../src/lib/analyzer.js', () => ({
  analyzeMarket: vi.fn(),
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

let mockWarn = vi.fn().mockReturnThis();

vi.mock('ora', () => {
  return {
    default: vi.fn(() => ({
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      warn: mockWarn,
      info: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis()
    }))
  };
});

describe('Watch Command', () => {
  let processOnSpy: any;
  let processExitSpy: any;
  let clearIntervalSpy: any;
  let setIntervalSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    processOnSpy = vi.spyOn(process, 'on').mockImplementation((event, cb) => {
      return process;
    });
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    setIntervalSpy = vi.spyOn(global, 'setInterval');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('runs initial scan and registers interval and SIGINT', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ success: false });

    await watchCommand({ marketId: 'm1', interval: '10' }); // 10s interval

    expect(nansen.fetchMarketScreener).toHaveBeenCalled();
    expect(nansen.fetchTopHolders).toHaveBeenCalled();
    
    // Check interval
    expect(setIntervalSpy).toHaveBeenCalled();
    const intervalArg = setIntervalSpy.mock.calls[0][1];
    expect(intervalArg).toBe(10000);

    // Check SIGINT
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });

  it('handles SIGINT to exit cleanly', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [] });
    vi.mocked(nansen.fetchTopHolders).mockResolvedValue({ success: false });

    await watchCommand({ marketId: 'm1' });
    
    // Trigger SIGINT handler
    const handler = processOnSpy.mock.calls.find((call: any) => call[0] === 'SIGINT')[1];
    handler();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('handles error in runScan safely', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockRejectedValue(new Error('Network error'));
    
    // Should not throw, should just fail the spinner
    await watchCommand({ marketId: 'm1' });
    expect(nansen.fetchMarketScreener).toHaveBeenCalled();
  });

  it('handles non Error thrown in runScan safely', async () => {
    vi.mocked(nansen.fetchMarketScreener).mockRejectedValue('String Error');
    
    await watchCommand({ marketId: 'm1' });
    expect(nansen.fetchMarketScreener).toHaveBeenCalled();
  });

  it('completes the full loop and detects divergence shift', async () => {
    const mockMarket = {
      market_id: 'm1',
      outcomes: ['Y', 'N'],
      outcome_prices: [0.5, 0.5]
    };

    vi.mocked(nansen.fetchMarketScreener).mockResolvedValue({ success: true, data: [mockMarket] });
    
    // Return different scores to trigger delta
    // Call 1:
    vi.mocked(nansen.fetchTopHolders)
      .mockResolvedValueOnce({
        success: true,
        data: [{ address: '0x1', amount: 100, outcome: 'Y' } as any]
      })
      .mockResolvedValueOnce({
        success: true,
        data: [{ address: '0x1', amount: 900, outcome: 'Y' } as any]
      });

    vi.mocked(enricher.enrichHolders).mockResolvedValue([
      { address: '0x1', amount: 100, outcome: 'Y', sm_labels: ['Smart DEX Trader'] } as any
    ]);
    
    vi.mocked(enricher.filterSmartMoney)
      .mockReturnValueOnce([
        { address: '0x1', amount: 100, outcome: 'Y', sm_labels: ['Smart DEX Trader'] } as any
      ])
      .mockReturnValueOnce([
        { address: '0x1', amount: 9000, outcome: 'Y', sm_labels: ['Smart DEX Trader'] } as any
      ]);

    vi.mocked(analyzer.analyzeMarket).mockReturnValueOnce({ divergence_score: 5 } as any);
    vi.mocked(analyzer.analyzeMarket).mockReturnValueOnce({ divergence_score: 15 } as any);

    // First scan happens automatically in watchCommand()
    await watchCommand({ marketId: 'm1' });
    
    expect(formatter.printMarketDetail).toHaveBeenCalledTimes(1);

    // Now fire the interval to trigger 2nd scan
    const intervalCallback = setIntervalSpy.mock.calls[0][0];
    await intervalCallback();

    expect(formatter.printMarketDetail).toHaveBeenCalledTimes(2);
    // Because difference is >= 5, warn should be called with delta
    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('Divergence shifted'));
  });
});
