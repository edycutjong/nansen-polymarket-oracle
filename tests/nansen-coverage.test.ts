import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as nansen from '../src/lib/nansen.js';
import * as cp from 'node:child_process';
import * as fs from 'node:fs';

let mockIsReplay = false;

vi.mock('../src/lib/replay.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/replay.js')>();
  return {
    ...actual,
    get IS_REPLAY() { return mockIsReplay; },
    getReplayData: vi.fn((cmd, args) => {
      if (cmd === 'error cmd') return null;
      return [{ replayed: true }];
    })
  };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    appendFileSync: vi.fn(),
  };
});

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

describe('Nansen coverage test', () => {

  afterEach(() => {
    vi.clearAllMocks();
    mockIsReplay = false;
    process.env.NANSEN_RECORD = undefined;
  });

  it('runs replay mode successfully', async () => {
    mockIsReplay = true;
    const res = await nansen.execNansen('test cmd');
    expect(res.success).toBe(true);
    expect((res.data as any)[0].replayed).toBe(true);
  });

  it('runs replay mode and returns error when not found', async () => {
    mockIsReplay = true;
    const res = await nansen.execNansen('error cmd');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('runs in record mode', async () => {
    process.env.NANSEN_RECORD = 'true';

    vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
      const callback = args[args.length - 1];
      callback(null, JSON.stringify({ success: true, data: { data: [{ record: true }] } }), '');
      return {} as any;
    });

    const prev = (nansen as any).IS_MOCK;
    (nansen as any).IS_MOCK = false;

    const res = await nansen.execNansen('rec cmd');

    (nansen as any).IS_MOCK = prev;

    expect(fs.appendFileSync).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  it('runs nansen data normalizers with fallback values', async () => {
    vi.mocked(cp.execFile).mockImplementation((...args: any[]) => {
      const cmdArgs = args[1] as string[];
      const callback = args[args.length - 1];
      console.log('Mock execNansen args:', args);

      if (cmdArgs && cmdArgs.includes('market-screener')) {
        callback(null, JSON.stringify({
          success: true,
          data: [{
            // Missing many fields to trigger fallbacks
            slug: 'empty-market',
            tags: []
          }, {
            // No slug
            market_slug: 'has-market-slug',
            tags: []
          }]
        }), '');
        return {} as any;
      }
      
      if (cmdArgs && cmdArgs.includes('top-holders')) {
        callback(null, JSON.stringify({
          success: true,
          data: [
            { position: 'YES', shares: 100 }, // hits line 186
            { side: 'No', owner_address: '0x12345', current_price: 0.9, position_size: 50 },
            { side: 'No', address: '0xproxy' }, // no owner_address, hits the proxy fallback
            { owner_address: '0x123', position_size: 10 } // no side, hits 'Yes' fallback
          ]
        }), '');
        return {} as any;
      }

      callback(null, '{"success": false}', '');
      return {} as any;
    });

    const prev = (nansen as any).IS_MOCK;
    (nansen as any).IS_MOCK = false;

    // Test market normalizer
    const market = await nansen.fetchMarketScreener(1);
    expect(market.success).toBe(true);

    // Test holder normalizer
    const holders = await nansen.fetchTopHolders('m1', 3);
    if (!holders.success) console.log(holders);
    expect(holders.success).toBe(true);
    
    (nansen as any).IS_MOCK = prev;
  });

});
