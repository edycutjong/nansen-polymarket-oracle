/**
 * Trading Module — Cross-Chain Proxy Hedging Agent
 *
 * Wraps the `nansen trade` and `nansen wallet` CLI commands.
 * All trades default to --dry-run for safety.
 *
 * Architecture:
 *  1. WalletGuard  — ensures wallet exists before any trade
 *  2. TokenOracle  — resolves token prices via `nansen research token info`
 *  3. TradeAgent   — generates quotes and executes trades
 *  4. SignalMapper — maps divergence signals to proxy hedge tokens
 */

import { execNansen, type NansenResponse } from './nansen.js';
import type {
  WalletStatus,
  TokenInfo,
  TradeQuote,
  TradeExecution,
  ProxyHedgeSignal,
} from '../types/trading.js';
import type { MarketAnalysis } from '../types/report.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum trade size in USD — safety guardrail */
export const MAX_TRADE_USD = 100;

/** Default slippage tolerance in basis points */
export const DEFAULT_SLIPPAGE_BPS = 50;

/** Proxy token mappings — divergence in prediction markets maps to spot tokens */
const PROXY_MAP: Record<string, { token: string; chain: string }> = {
  Crypto:   { token: 'WETH', chain: 'base' },
  Politics: { token: 'USDC', chain: 'base' },
  Sports:   { token: 'USDC', chain: 'base' },
  Culture:  { token: 'WETH', chain: 'base' },
  Science:  { token: 'WETH', chain: 'base' },
  default:  { token: 'WETH', chain: 'base' },
};

// ---------------------------------------------------------------------------
// Wallet Guard
// ---------------------------------------------------------------------------

/**
 * Check if a wallet exists for the given chain.
 * Returns the wallet status or creates one if missing.
 */
export async function checkWallet(chain = 'base'): Promise<NansenResponse<WalletStatus>> {
  return execNansen<WalletStatus>('wallet status', ['--chain', chain]);
}

/**
 * Create a wallet for the given chain.
 */
export async function createWallet(chain = 'base'): Promise<NansenResponse<WalletStatus>> {
  return execNansen<WalletStatus>('wallet create', ['--chain', chain]);
}

/**
 * Ensure wallet exists — check first, create if needed.
 */
export async function ensureWallet(chain = 'base'): Promise<NansenResponse<WalletStatus>> {
  const status = await checkWallet(chain);
  if (status.success && status.data?.exists) {
    return status;
  }
  return createWallet(chain);
}

// ---------------------------------------------------------------------------
// Token Oracle
// ---------------------------------------------------------------------------

/**
 * Get token information including current price.
 */
export async function fetchTokenInfo(
  symbol: string,
  chain = 'base',
): Promise<NansenResponse<TokenInfo>> {
  return execNansen<TokenInfo>('research token info', [
    '--symbol', symbol,
    '--chain', chain,
  ]);
}

// ---------------------------------------------------------------------------
// Trade Agent
// ---------------------------------------------------------------------------

/**
 * Get a trade quote (DEX aggregation).
 */
export async function getTradeQuote(
  fromToken: string,
  toToken: string,
  amount: number,
  chain = 'base',
  slippageBps = DEFAULT_SLIPPAGE_BPS,
): Promise<NansenResponse<TradeQuote>> {
  return execNansen<TradeQuote>('trade quote', [
    '--from', fromToken,
    '--to', toToken,
    '--amount', String(amount),
    '--chain', chain,
    '--slippage', String(slippageBps),
  ]);
}

/**
 * Execute a trade — ONLY if not in dry-run mode.
 * This is the most dangerous function in the codebase.
 */
export async function executeTrade(
  fromToken: string,
  toToken: string,
  amount: number,
  chain = 'base',
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  dryRun = true,
): Promise<NansenResponse<TradeExecution>> {
  const args = [
    '--from', fromToken,
    '--to', toToken,
    '--amount', String(amount),
    '--chain', chain,
    '--slippage', String(slippageBps),
  ];

  if (dryRun) {
    args.push('--dry-run');
  }

  return execNansen<TradeExecution>('trade execute', args);
}

// ---------------------------------------------------------------------------
// Signal Mapper — Divergence → Proxy Hedge
// ---------------------------------------------------------------------------

/**
 * Map a market analysis to a proxy hedge signal.
 *
 * Logic:
 *  - If SM is MORE bullish than market → LONG the category proxy token
 *  - If SM is MORE bearish than market → SHORT (stay in USDC)
 *  - Confidence based on divergence level
 */
export function mapToHedgeSignal(analysis: MarketAnalysis): ProxyHedgeSignal {
  const category = analysis.market.category || 'default';
  const proxy = PROXY_MAP[category] || PROXY_MAP['default'];
  const score = analysis.divergence_score;
  const absScore = Math.abs(score);

  const direction: 'LONG' | 'SHORT' = score > 0 ? 'LONG' : 'SHORT';

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  if (absScore >= 40) confidence = 'HIGH';
  else if (absScore >= 25) confidence = 'MEDIUM';
  else confidence = 'LOW';

  const directionText = direction === 'LONG' ? 'bullish' : 'bearish';
  const rationale = `SM ${directionText} divergence (${score}) on "${analysis.market.question}" → proxy ${direction} ${proxy.token} on ${proxy.chain}`;

  return {
    market_question: analysis.market.question,
    divergence_score: score,
    divergence_level: analysis.divergence_level,
    direction,
    proxy_token: direction === 'SHORT' ? 'USDC' : proxy.token,
    proxy_chain: proxy.chain,
    confidence,
    rationale,
  };
}

/**
 * Validate trade amount against safety limits.
 */
export function validateTradeAmount(amount: number, maxUsd = MAX_TRADE_USD): {
  valid: boolean;
  reason?: string;
} {
  if (amount <= 0) {
    return { valid: false, reason: 'Trade amount must be positive' };
  }
  if (amount > maxUsd) {
    return { valid: false, reason: `Trade amount $${amount} exceeds max $${maxUsd}` };
  }
  return { valid: true };
}

/**
 * Get the proxy token for a given category.
 */
export function getProxyForCategory(category: string): { token: string; chain: string } {
  return PROXY_MAP[category] || PROXY_MAP['default'];
}
