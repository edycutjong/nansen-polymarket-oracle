/**
 * Nansen CLI wrapper — evolved from NansenTerm's lib/nansen.ts.
 * Executes nansen-cli commands via child_process and parses JSON output.
 *
 * Supports three data modes:
 *  - NANSEN_MOCK=true   → synthetic data (works offline, no API)
 *  - NANSEN_REPLAY=true → real recorded data from nansen-record.log
 *  - (default)          → live Nansen CLI API
 */

import { execFile } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { IS_MOCK, getMockData } from './mock.js';
import { IS_REPLAY, getReplayData } from './replay.js';

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

  // Replay mode — return recorded real API data from nansen-record.log
  if (IS_REPLAY) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const replay = getReplayData(command, args);
        if (replay !== null) {
          resolve({ success: true, data: replay as T });
        } else {
          resolve({ success: false, error: '[REPLAY] No recorded data for: ' + command + ' ' + args.join(' ') });
        }
      }, 150); // faster than mock — simulates cached lookups
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
          
          if (process.env.NANSEN_RECORD === 'true') {
            const logEntry = `\n\n// Command: ${command} ${args.join(' ')}\n${JSON.stringify(parsed, null, 2)}`;
            appendFileSync('nansen-record.log', logEntry);
          }

          // The real CLI wraps lists in { pagination, data: [...] } 
          // Our code historically expects the raw array directly in result.data
          if (parsed.success && parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data) && 'data' in parsed.data) {
            parsed.data = parsed.data.data;
          }

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

function normalizeMarket(m: any) {
  return {
    ...m,
    market_slug: m.slug || m.market_slug,
    category: Array.isArray(m.tags) && m.tags.length > 0 ? m.tags[0] : (m.category || 'Unknown'),
    yes_price: m.last_trade_price ?? m.best_ask ?? m.yes_price ?? 0.5,
    volume_usd: m.volume ?? m.volume_usd ?? 0,
    liquidity_usd: m.liquidity ?? m.liquidity_usd ?? 0,
    num_traders: m.unique_traders_24h ?? m.num_traders ?? 0,
  };
}

/** Discover active prediction markets */
export async function fetchMarketScreener(limit = 50) {
  const res = await execNansen('research prediction-market market-screener', [
    '--limit', String(limit),
  ]);
  
  if (res.success && Array.isArray(res.data)) {
    res.data = res.data.map(normalizeMarket);
  }
  return res;
}

/** Event-level overview */
export async function fetchEventScreener(limit = 20) {
  return execNansen('research prediction-market event-screener', [
    '--limit', String(limit),
  ]);
}

/**
 * Normalize a holder from the real API schema to internal MarketHolder type.
 * Real API uses: side ("Yes"/"No"), position_size, owner_address, current_price
 * Internal uses: position ("YES"/"NO"), shares, value_usd, address (actual wallet)
 */
function normalizeHolder(h: any) {
  // Already in internal format (has position field)
  if (h.position !== undefined) return h;

  // In Polymarket, owner_address is the real wallet; address is the proxy contract.
  // Use the real wallet for profiler enrichment lookups.
  const resolvedAddress =
    h.owner_address && h.owner_address !== '0x' && h.owner_address.length > 4
      ? h.owner_address
      : h.address;

  const side = ((h.side || 'Yes') as string).toUpperCase() as 'YES' | 'NO';
  const currentPrice = h.current_price ?? 1;

  return {
    ...h,
    address: resolvedAddress,
    proxy_address: h.address, // Preserve original Polymarket proxy
    position: side,
    shares: h.position_size ?? h.shares ?? 0,
    value_usd: (h.position_size ?? 0) * currentPrice,
    entry_price: h.avg_entry_price ?? h.entry_price,
    pnl_usd: h.unrealized_pnl_usd ?? h.pnl_usd ?? 0,
  };
}

/** Top holders for a specific market */
export async function fetchTopHolders(marketId: string, limit = 50) {
  const res = await execNansen('research prediction-market top-holders', [
    '--market-id', marketId,
    '--limit', String(limit),
  ]);

  if (res.success && Array.isArray(res.data)) {
    res.data = res.data.map(normalizeHolder);
  }
  return res;
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
