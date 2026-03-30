import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as nansen from '../src/lib/nansen.js';
import * as cp from 'node:child_process';

let mockIsMock = false;

vi.mock('../src/lib/mock.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/mock.js')>();
  return {
    ...actual,
    get IS_MOCK() { return mockIsMock; }
  };
});

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

describe('Nansen API wrappers', () => {
  beforeEach(() => {
    nansen.resetApiCallCount();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset mock mode just to be safe if any test alters it
  });

  it('getApiCallCount and resetApiCallCount', () => {
    expect(nansen.getApiCallCount()).toBe(0);
    // Let's force a call
    const promise = nansen.execNansen('test');
    expect(nansen.getApiCallCount()).toBe(1);
    nansen.resetApiCallCount();
    expect(nansen.getApiCallCount()).toBe(0);
  });

  describe('execNansen', () => {
    it('executes command successfully (non-mock mode)', async () => {
      vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
        const callback = args[args.length - 1];
        callback(null, JSON.stringify({ success: true, data: { foo: 'bar' } }), '');
        return {} as any;
      });

      // Need to temporarily set mock mode to false (if it's true, which it probably is since vitest sets NODE_ENV)
      const prev = (nansen as any).IS_MOCK;
      (nansen as any).IS_MOCK = false;
      
      const res = await nansen.execNansen('test cmd', ['--arg', 'val']);
      
      (nansen as any).IS_MOCK = prev;

      expect(res.success).toBe(true);
      expect((res.data as any).foo).toBe('bar');
      expect(cp.execFile).toHaveBeenCalled();
    });

    it('handles exec limits/timeouts with stderr parsed JSON (non-mock mode)', async () => {
      vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
        const callback = args[args.length - 1];
        callback(new Error('timeout'), '', JSON.stringify({ error: 'rate limit', code: '429', status: 429 }));
        return {} as any;
      });

      const prev = (nansen as any).IS_MOCK;
      (nansen as any).IS_MOCK = false;

      const res = await nansen.execNansen('test cmd');

      (nansen as any).IS_MOCK = prev;

      expect(res.success).toBe(false);
      expect(res.error).toBe('rate limit');
      expect(res.code).toBe('429');
      expect(res.code).toBe('429');
      expect(res.status).toBe(429);
    });

    it('handles exec limits/timeouts with stderr parsed JSON (non-mock mode) missing error prop', async () => {
      vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
        const callback = args[args.length - 1];
        callback(new Error('timeout-message'), '', JSON.stringify({ code: '429', status: 429 }));
        return {} as any;
      });

      const prev = (nansen as any).IS_MOCK;
      (nansen as any).IS_MOCK = false;

      const res = await nansen.execNansen('test cmd');

      (nansen as any).IS_MOCK = prev;

      expect(res.success).toBe(false);
      expect(res.error).toBe('timeout-message');
      expect(res.code).toBe('429');
      expect(res.status).toBe(429);
    });

    it('handles generic exec error (non-mock mode)', async () => {
      vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
        const callback = args[args.length - 1];
        callback(new Error('Process exit'), '', 'Something crashed horribly');
        return {} as any;
      });

      const prev = (nansen as any).IS_MOCK;
      (nansen as any).IS_MOCK = false;

      const res = await nansen.execNansen('test cmd');

      (nansen as any).IS_MOCK = prev;

      expect(res.success).toBe(false);
      expect(res.error).toBe('Something crashed horribly');
      expect(res.code).toBe('EXEC_ERROR');
    });

    it('handles invalid JSON output (non-mock mode)', async () => {
      vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
        const callback = args[args.length - 1];
        callback(null, 'Not valid json output', '');
        return {} as any;
      });

      const prev = (nansen as any).IS_MOCK;
      (nansen as any).IS_MOCK = false;

      const res = await nansen.execNansen('test cmd');

      (nansen as any).IS_MOCK = prev;

      expect(res.success).toBe(false);
      expect(res.code).toBe('PARSE_ERROR');
    });

    it('executes in mock mode', async () => {
      mockIsMock = true;
      
      const res = await nansen.execNansen('research prediction-market market-screener');
      
      mockIsMock = false;
      
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('fails gracefully in mock mode for unknown command', async () => {
      mockIsMock = true;
      
      const res = await nansen.execNansen('some totally unknown command');
      
      mockIsMock = false;
      
      expect(res.success).toBe(false);
      expect(res.error).toContain('[MOCK] No data for');
    });
  });

  describe('Wrapper Functions', () => {
    // We only need to verify they call execNansen with the right args.
    // Instead of mocking execNansen, we just observe what it does in mock mode or error.
    it('checkNansenInstalled (mock mode)', async () => {
      mockIsMock = true;
      const res = await nansen.checkNansenInstalled();
      mockIsMock = false;
      expect(res).toBe(true);
    });

    it('checkNansenInstalled (real)', async () => {
      vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
        const callback = args[args.length - 1];
        callback(null, 'v1.0.0', '');
        return {} as any;
      });

      mockIsMock = false;
      const res = await nansen.checkNansenInstalled();
      
      expect(res).toBe(true);
    });

    it('wrappers return expected mock data (Integration style check)', async () => {
      mockIsMock = true;
      
      const scream = await nansen.fetchMarketScreener(5);
      expect(scream.success).toBe(true);
      
      const event = await nansen.fetchEventScreener(5);
      expect(event.success).toBe(true);
      
      const holders = await nansen.fetchTopHolders('m1', 5);
      expect(holders.success).toBe(true);
      
      const trades = await nansen.fetchTradesByMarket('m1', 5);
      expect(trades.success).toBe(true);
      
      const pnl = await nansen.fetchPnlByMarket('m1', 5);
      expect(pnl.success).toBe(true);
      
      const ohlcv = await nansen.fetchMarketOHLCV('m1');
      expect(ohlcv.success).toBe(true);
      
      const ob = await nansen.fetchMarketOrderbook('m1');
      expect(ob.success).toBe(true);
      
      const addrPnl = await nansen.fetchPnlByAddress('0x1');
      expect(addrPnl.success).toBe(true);

      const addrTrades = await nansen.fetchTradesByAddress('0x1');
      expect(addrTrades.success).toBe(true);

      const cats = await nansen.fetchMarketCategories();
      expect(cats.success).toBe(true);

      const pd = await nansen.fetchPositionDetail('m1');
      expect(pd.success).toBe(true);

      const profL = await nansen.fetchProfilerLabels('0x1');
      expect(profL.success).toBe(true);

      const profPnl = await nansen.fetchPnlSummary('0x1');
      expect(profPnl.success).toBe(true);

      const batch = await nansen.fetchProfilerBatch(['0x1', '0x2']);
      expect(batch.success).toBe(true);

      const smf = await nansen.fetchSmartMoneyNetflow('ethereum', 5);
      expect(smf.success).toBe(true);

      const smh = await nansen.fetchSmartMoneyHoldings('ethereum', 5);
      expect(smh.success).toBe(true);

      const act = await nansen.fetchAccountStatus();
      expect(act.success).toBe(true);

      mockIsMock = false;
    });
  });
});
