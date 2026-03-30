/**
 * Nansen CLI wrapper — evolved from NansenTerm's lib/nansen.ts.
 * Executes nansen-cli commands via child_process and parses JSON output.
 *
 * Supports NANSEN_MOCK=true for local dev/testing without live API.
 * Added prediction-market specific wrappers + profiler batch support.
 */

import { execFile } from 'node:child_process';
import { IS_MOCK, getMockData } from './mock.js';

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export interface NansenResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: number;
}

// ---------------------------------------------------------------------------
// API Call Counter
// ---------------------------------------------------------------------------

let apiCallCount = 0;

export function getApiCallCount(): number {
  return apiCallCount;
}

export function resetApiCallCount(): void {
  apiCallCount = 0;
}

// ---------------------------------------------------------------------------
// Core Executor
// ---------------------------------------------------------------------------

/**
 * Execute a nansen CLI command and parse the JSON output.
 * The command string is split by spaces and combined with args.
 *
 * @example
 * execNansen('research prediction-market market-screener', ['--limit', '20'])
 */
export function execNansen<T = unknown>(
  command: string,
  args: string[] = [],
  options: { timeout?: number } = {},
): Promise<NansenResponse<T>> {
  apiCallCount++;
  const { timeout = 60_000 } = options;

  // Mock mode — return synthetic data without CLI call
  if (IS_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mock = getMockData(command, args);
        if (mock !== null) {
          resolve({ success: true, data: mock as T });
        } else {
          resolve({ success: false, error: '[MOCK] No data for: ' + command });
        }
      }, 300);
    });
  }

  return new Promise((resolve) => {
    const fullArgs = [...command.split(' '), ...args, '--pretty'];

    execFile(
      'nansen',
      fullArgs,
      { maxBuffer: 10 * 1024 * 1024, timeout },
      (error, stdout, stderr) => {
        if (error) {
          const errorText = stderr || stdout || error.message;
          try {
            const parsed = JSON.parse(errorText);
            resolve({
              success: false,
              error: parsed.error || error.message,
              code: parsed.code,
              status: parsed.status,
            });
          } catch {
            resolve({
              success: false,
              error: errorText.slice(0, 500),
              code: 'EXEC_ERROR',
            });
          }
          return;
        }

        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed as NansenResponse<T>);
        } catch {
          resolve({
            success: false,
            error: `Failed to parse JSON: ${stdout.slice(0, 200)}`,
            code: 'PARSE_ERROR',
          });
        }
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Prediction Market Wrappers
// ---------------------------------------------------------------------------

/** Discover active prediction markets */
export async function fetchMarketScreener(limit = 50) {
  return execNansen('research prediction-market market-screener', [
    '--limit', String(limit),
  ]);
}

/** Event-level overview */
export async function fetchEventScreener(limit = 20) {
  return execNansen('research prediction-market event-screener', [
    '--limit', String(limit),
  ]);
}

/** Top holders for a specific market */
export async function fetchTopHolders(marketId: string, limit = 50) {
  return execNansen('research prediction-market top-holders', [
    '--market-id', marketId,
    '--limit', String(limit),
  ]);
}

/** Trades for a specific market */
export async function fetchTradesByMarket(marketId: string, limit = 50) {
  return execNansen('research prediction-market trades-by-market', [
    '--market-id', marketId,
    '--limit', String(limit),
  ]);
}

/** PnL leaderboard for a specific market */
export async function fetchPnlByMarket(marketId: string, limit = 20) {
  return execNansen('research prediction-market pnl-by-market', [
    '--market-id', marketId,
    '--limit', String(limit),
  ]);
}

/** OHLCV price history for a market */
export async function fetchMarketOHLCV(marketId: string) {
  return execNansen('research prediction-market ohlcv', [
    '--market-id', marketId,
  ]);
}

/** Orderbook snapshot for a market */
export async function fetchMarketOrderbook(marketId: string) {
  return execNansen('research prediction-market orderbook', [
    '--market-id', marketId,
  ]);
}

/** PnL for a specific address across prediction markets */
export async function fetchPnlByAddress(address: string) {
  return execNansen('research prediction-market pnl-by-address', [
    '--address', address,
  ]);
}

/** Trades for a specific address across prediction markets */
export async function fetchTradesByAddress(address: string, limit = 50) {
  return execNansen('research prediction-market trades-by-address', [
    '--address', address,
    '--limit', String(limit),
  ]);
}

/** List prediction market categories */
export async function fetchMarketCategories() {
  return execNansen('research prediction-market categories');
}

/** Position detail for a market */
export async function fetchPositionDetail(marketId: string) {
  return execNansen('research prediction-market position-detail', [
    '--market-id', marketId,
  ]);
}

// ---------------------------------------------------------------------------
// Profiler Wrappers (for SM enrichment)
// ---------------------------------------------------------------------------

/** Get Nansen labels for an address */
export async function fetchProfilerLabels(address: string, chain = 'ethereum') {
  return execNansen('research profiler labels', [
    '--address', address,
    '--chain', chain,
  ]);
}

/** Get PnL summary for an address */
export async function fetchPnlSummary(address: string, chain = 'ethereum') {
  return execNansen('research profiler pnl-summary', [
    '--address', address,
    '--chain', chain,
  ]);
}

/** Batch profile multiple addresses */
export async function fetchProfilerBatch(
  addresses: string[],
  chain = 'ethereum',
  include = 'labels,balance',
) {
  return execNansen('profiler batch', [
    '--addresses', addresses.join(','),
    '--chain', chain,
    '--include', include,
  ]);
}

// ---------------------------------------------------------------------------
// Smart Money Wrappers (for context)
// ---------------------------------------------------------------------------

/** Smart money netflow */
export async function fetchSmartMoneyNetflow(chain: string, limit = 20) {
  return execNansen('research smart-money netflow', [
    '--chain', chain,
    '--limit', String(limit),
  ]);
}

/** Smart money holdings */
export async function fetchSmartMoneyHoldings(chain: string, limit = 20) {
  return execNansen('research smart-money holdings', [
    '--chain', chain,
    '--limit', String(limit),
  ]);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Check if nansen CLI is available (always true in mock mode) */
export async function checkNansenInstalled(): Promise<boolean> {
  if (IS_MOCK) return true;
  return new Promise((resolve) => {
    execFile('nansen', ['--version'], { timeout: 5000 }, (error) => {
      resolve(!error);
    });
  });
}

/** Get account status */
export async function fetchAccountStatus() {
  return execNansen('account');
}
