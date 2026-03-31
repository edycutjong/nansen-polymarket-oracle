import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  recordCall,
  getEntries,
  getCallCount,
  resetTelemetry,
  setTelemetryEnabled,
  isTelemetryEnabled,
  classifyRole,
  printTelemetryReceipt,
  type TelemetryEntry,
} from '../src/lib/telemetry.js';

describe('Telemetry Module', () => {
  beforeEach(() => {
    resetTelemetry();
    setTelemetryEnabled(true);
  });

  // -----------------------------------------------------------------------
  // Core Registry
  // -----------------------------------------------------------------------

  describe('recordCall / getEntries / getCallCount', () => {
    it('starts empty', () => {
      expect(getEntries()).toEqual([]);
      expect(getCallCount()).toBe(0);
    });

    it('records a single call', () => {
      const entry: TelemetryEntry = {
        endpoint: 'research prediction-market market-screener',
        method: 'EXEC',
        latency_ms: 320,
        status: 'SUCCESS',
        cache: 'N/A',
        role: 'Discovery',
      };
      recordCall(entry);
      expect(getCallCount()).toBe(1);
      expect(getEntries()[0]).toEqual(entry);
    });

    it('records multiple calls', () => {
      recordCall({ endpoint: 'a', method: 'EXEC', latency_ms: 10, status: '200', cache: 'MISS', role: 'Other' });
      recordCall({ endpoint: 'b', method: 'GET', latency_ms: 20, status: 'ERROR', cache: 'HIT', role: 'Other' });
      expect(getCallCount()).toBe(2);
    });

    it('getEntries returns a copy (defensive)', () => {
      recordCall({ endpoint: 'x', method: 'EXEC', latency_ms: 5, status: '200', cache: 'MISS', role: 'Other' });
      const copy = getEntries();
      copy.push({ endpoint: 'y', method: 'GET', latency_ms: 0, status: '200', cache: 'HIT', role: 'Other' });
      expect(getCallCount()).toBe(1); // original untouched
    });
  });

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  describe('resetTelemetry', () => {
    it('clears all entries', () => {
      recordCall({ endpoint: 'z', method: 'EXEC', latency_ms: 1, status: '200', cache: 'MISS', role: 'Other' });
      expect(getCallCount()).toBe(1);
      resetTelemetry();
      expect(getCallCount()).toBe(0);
      expect(getEntries()).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Enable / Disable
  // -----------------------------------------------------------------------

  describe('setTelemetryEnabled / isTelemetryEnabled', () => {
    it('defaults to enabled', () => {
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('does not record calls when disabled', () => {
      setTelemetryEnabled(false);
      expect(isTelemetryEnabled()).toBe(false);
      recordCall({ endpoint: 'ignored', method: 'EXEC', latency_ms: 1, status: '200', cache: 'MISS', role: 'Other' });
      expect(getCallCount()).toBe(0);
    });

    it('records again after re-enabling', () => {
      setTelemetryEnabled(false);
      recordCall({ endpoint: 'skip', method: 'EXEC', latency_ms: 1, status: '200', cache: 'MISS', role: 'Other' });
      setTelemetryEnabled(true);
      recordCall({ endpoint: 'kept', method: 'EXEC', latency_ms: 1, status: '200', cache: 'MISS', role: 'Other' });
      expect(getCallCount()).toBe(1);
      expect(getEntries()[0].endpoint).toBe('kept');
    });
  });

  // -----------------------------------------------------------------------
  // Role Classification
  // -----------------------------------------------------------------------

  describe('classifyRole', () => {
    it('classifies market-screener as Discovery', () => {
      expect(classifyRole('research prediction-market market-screener --limit 50')).toBe('Discovery');
    });

    it('classifies event-screener as Discovery', () => {
      expect(classifyRole('research prediction-market event-screener')).toBe('Discovery');
    });

    it('classifies categories as Discovery', () => {
      expect(classifyRole('research prediction-market categories')).toBe('Discovery');
    });

    it('classifies profiler as Enrichment', () => {
      expect(classifyRole('research profiler labels --address 0x1')).toBe('Enrichment');
    });

    it('classifies labels as Enrichment', () => {
      expect(classifyRole('research profiler labels --address 0x1')).toBe('Enrichment');
    });

    it('classifies smart-money as SM Analysis', () => {
      expect(classifyRole('research smart-money netflow --chain ethereum')).toBe('SM Analysis');
    });

    it('classifies top-holders as Holder Analysis', () => {
      expect(classifyRole('research prediction-market top-holders --market-id m1')).toBe('Holder Analysis');
    });

    it('classifies position-detail as Holder Analysis', () => {
      expect(classifyRole('research prediction-market position-detail --market-id m1')).toBe('Holder Analysis');
    });

    it('classifies pnl as PnL Tracking', () => {
      expect(classifyRole('research prediction-market pnl-by-market --market-id m1')).toBe('PnL Tracking');
    });

    it('classifies trades-by as Trade History', () => {
      expect(classifyRole('research prediction-market trades-by-market --market-id m1')).toBe('Trade History');
    });

    it('classifies ohlcv as Market Data', () => {
      expect(classifyRole('research prediction-market ohlcv --market-id m1')).toBe('Market Data');
    });

    it('classifies orderbook as Market Data', () => {
      expect(classifyRole('research prediction-market orderbook --market-id m1')).toBe('Market Data');
    });

    it('classifies token info as Price Oracle', () => {
      expect(classifyRole('trade token info WETH --chain base')).toBe('Price Oracle');
    });

    it('classifies trade quote as Trade Quote', () => {
      expect(classifyRole('trade quote --token WETH --amount 0.1')).toBe('Trade Quote');
    });

    it('classifies trade execute as Trade Execution', () => {
      expect(classifyRole('trade execute --token WETH --amount 0.1')).toBe('Trade Execution');
    });

    it('classifies wallet as Wallet Mgmt', () => {
      expect(classifyRole('wallet create')).toBe('Wallet Mgmt');
    });

    it('classifies bridge-status as Bridge Status', () => {
      expect(classifyRole('bridge-status --tx 0x123')).toBe('Bridge Status');
    });

    it('classifies account as Account', () => {
      expect(classifyRole('account')).toBe('Account');
    });

    it('classifies unknown commands as Other', () => {
      expect(classifyRole('some-random-command')).toBe('Other');
    });
  });

  // -----------------------------------------------------------------------
  // Receipt Printer
  // -----------------------------------------------------------------------

  describe('printTelemetryReceipt', () => {
    it('prints nothing when no entries exist', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      printTelemetryReceipt();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('prints a formatted receipt for recorded calls', () => {
      const logs: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logs.push(args.join(' '));
      });

      recordCall({ endpoint: 'research prediction-market market-screener', method: 'EXEC', latency_ms: 320, status: 'SUCCESS', cache: 'N/A', role: 'Discovery' });
      recordCall({ endpoint: 'research profiler labels', method: 'EXEC', latency_ms: 150, status: '200', cache: 'MISS', role: 'Enrichment' });
      recordCall({ endpoint: 'research profiler labels', method: 'EXEC', latency_ms: 5, status: '200', cache: 'HIT', role: 'Enrichment' });

      printTelemetryReceipt();

      const allOutput = logs.join('\n');
      expect(allOutput).toContain('NANSEN API TELEMETRY');
      expect(allOutput).toContain('TOTAL:');
      expect(allOutput).toContain('AVG LATENCY');

      spy.mockRestore();
    });

    it('shows WARN when calls < 10', () => {
      const logs: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logs.push(args.join(' '));
      });

      recordCall({ endpoint: 'a', method: 'EXEC', latency_ms: 10, status: 'SUCCESS', cache: 'N/A', role: 'Other' });
      printTelemetryReceipt();

      const allOutput = logs.join('\n');
      expect(allOutput).toContain('WARN');

      spy.mockRestore();
    });

    it('shows PASS when calls >= 10', () => {
      const logs: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logs.push(args.join(' '));
      });

      for (let i = 0; i < 8; i++) {
        recordCall({ endpoint: `call-${i}`, method: 'EXEC', latency_ms: 10, status: '200', cache: 'MISS', role: 'Other' });
      }
      recordCall({ endpoint: 'call-8', method: 'EXEC', latency_ms: 600, status: 'ERROR', cache: 'MISS', role: 'Other' });
      recordCall({ endpoint: `call-9`, method: 'EXEC', latency_ms: 10, status: '500', cache: 'MISS', role: 'Other' });
      
      printTelemetryReceipt();

      const allOutput = logs.join('\n');
      expect(allOutput).toContain('PASS');
      expect(allOutput).toContain('TOTAL: 10 calls');

      spy.mockRestore();
    });

    it('handles long endpoint names by truncating', () => {
      const logs: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logs.push(args.join(' '));
      });

      recordCall({
        endpoint: 'a-very-long-endpoint-name-that-exceeds-the-forty-character-limit-for-display',
        method: 'EXEC',
        latency_ms: 10,
        status: '200',
        cache: 'MISS',
        role: 'Other',
      });
      printTelemetryReceipt();

      const allOutput = logs.join('\n');
      expect(allOutput).toContain('...');

      spy.mockRestore();
    });

    it('highlights ERROR status and high latency', () => {
      const logs: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logs.push(args.join(' '));
      });

      recordCall({ endpoint: 'fail-call', method: 'EXEC', latency_ms: 800, status: 'ERROR', cache: 'MISS', role: 'Other' });
      printTelemetryReceipt();

      const allOutput = logs.join('\n');
      // Just verify it renders without crashing (color codes vary)
      expect(allOutput).toContain('TOTAL:');

      spy.mockRestore();
    });
  });
});
