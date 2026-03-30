import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import { divergenceEmoji } from '../src/lib/analyzer.js';
import { enrichAddress } from '../src/lib/enricher.js';
import { lookupKnownWallet } from '../src/lib/known-wallets.js';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    appendFileSync: vi.fn(),
  };
});

describe('Coverage catch-up', () => {
  describe('analyzer.ts', () => {
    it('divergenceEmoji covers all branches', () => {
      expect(divergenceEmoji('EXTREME')).toBe('🔥');
      expect(divergenceEmoji('HIGH')).toBe('⚠️');
      expect(divergenceEmoji('MODERATE')).toBe('📊');
      expect(divergenceEmoji('LOW')).toBe('✅');
      expect(divergenceEmoji('ALIGNED')).toBe('🤝');
    });
  });

  describe('known-wallets.ts', () => {
    it('lookupKnownWallet returns the correct wallet', () => {
      const result = lookupKnownWallet('0x50c8c52ca63217fdbfb33d671932c8a84caeda27');
      expect(result).not.toBeNull();
      expect(result?.label).toBe('Smart Trader');
      expect(result?.fullname).toBe('PM Whale Alpha');
    });

    it('lookupKnownWallet ignores case', () => {
      const result = lookupKnownWallet('0x50C8C52CA63217FDBFB33D671932C8A84CAEDA27');
      expect(result).not.toBeNull();
    });

    it('lookupKnownWallet returns null for unknown wallet', () => {
      expect(lookupKnownWallet('0xdeadbeef')).toBeNull();
    });
  });

  describe('enricher.ts', () => {
    it('enrichAddress short-circuits to known-wallets', async () => {
      const result = await enrichAddress('0x50c8c52ca63217fdbfb33d671932c8a84caeda27');
      expect(result.is_smart_money).toBe(true);
      expect(result.labels.length).toBe(1);
      expect(result.labels[0].label).toBe('Smart Trader');
    });
  });

  describe('replay.ts', () => {
    let getReplayData: any;

    beforeEach(async () => {
      vi.clearAllMocks();
      vi.resetModules();
      const mod = await import('../src/lib/replay.js');
      getReplayData = mod.getReplayData;
    });

    it('handles missing file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(getReplayData('research prediction-market market-screener', [])).toBeNull();
    });

    it('parses valid log data and matches exact command', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: research prediction-market market-screener
{"success": true, "data": {"data": [{"exactMatch": true}]}}

// Command: other command
{"success": true, "data": []}

// Command: direct hit array
{"success": true, "data": [{"directArray": true}]}
`);
      vi.resetModules();
      const mod = await import('../src/lib/replay.js');
      getReplayData = mod.getReplayData;
      const exact = getReplayData('research prediction-market market-screener', []);
      expect(exact).toEqual([{"exactMatch": true}]);
      
      const direct = getReplayData('direct hit array', []);
      expect(direct).toEqual([{"directArray": true}]);
    });

    it('matches base command + key args', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: some base --market-id 123 --limit 5
{"success": true, "data": {"data": [{"idMatch": true}]}}
`);
      vi.resetModules();
      let mod = await import('../src/lib/replay.js');
      let getReplayDataRef = mod.getReplayData;
      const match = getReplayDataRef('some base', ['--market-id', '123']);
      expect(match).toEqual([{"idMatch": true}]);
      
      // non array data
      vi.resetModules();
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: some base --market-id 456
{"success": true, "data": {"singleMatch": true}}
`);
      mod = await import('../src/lib/replay.js');
      getReplayDataRef = mod.getReplayData;
      const singleMatch = getReplayDataRef('some base', ['--market-id', '456']);
      expect(singleMatch).toEqual({"singleMatch": true});
    });

    it('falls back to screener match', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: research prediction-market market-screener --limit 20
{"success": true, "data": {"data": [{"screenerMatch": true}]}}
`);
      vi.resetModules();
      const mod = await import('../src/lib/replay.js');
      getReplayData = mod.getReplayData;
      const match = getReplayData('research prediction-market market-screener', ['--category', 'foo']);
      expect(match).toEqual([{"screenerMatch": true}]);
    });

    it('skips malformed json', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: research prediction-market market-screener
invalid json
`);
      vi.resetModules();
      const mod = await import('../src/lib/replay.js');
      getReplayData = mod.getReplayData;
      // Would return null if not matched
      expect(getReplayData('research prediction-market market-screener', [])).toBeNull();
    });

    it('handles direct array and malformed data for different branches', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: research prediction-market market-screener --limit 30
{"success": true, "data": [{"screenerDirect": true}]}

// Command: exact-direct
{"success": true, "data": [{"exactDirect": true}]}

// Command: exact-nested
{"success": true, "data": {"data": [{"exactNested": true}]}}
`);
      vi.resetModules();
      const mod = await import('../src/lib/replay.js');
      getReplayData = mod.getReplayData;
      
      const screener = getReplayData('research prediction-market market-screener', ['--limit', '30']);
      expect(screener).toEqual([{"screenerDirect": true}]);

      const exactD = getReplayData('exact-direct', []);
      expect(exactD).toEqual([{"exactDirect": true}]);

      const exactN = getReplayData('exact-nested', []);
      expect(exactN).toEqual([{"exactNested": true}]);
    });

    it('covers ?? fallbacks and missing newline in blocks', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`
// Command: research prediction-market market-screener --limit 99
{"success": true}

// Command: base fallback --limit 50 --market-id 999
{"success": true}

// Command: exact fallback
{"success": true}

// Command: base direct array with extra stuff --market-id 888
{"success": true, "data": [{"baseArray": true}]}

// Command: something without newline`);
      vi.resetModules();
      let mod = await import('../src/lib/replay.js');
      let getReplayDataRef = mod.getReplayData;

      expect(getReplayDataRef('exact fallback', [])).toEqual({ success: true });
      expect(getReplayDataRef('base fallback', ['--market-id', '999'])).toEqual({ success: true });
      expect(getReplayDataRef('base direct array', ['--market-id', '888'])).toEqual([{"baseArray": true}]);
      expect(getReplayDataRef('research prediction-market market-screener', ['--limit', '99'])).toEqual({ success: true });
    });
  });
});
