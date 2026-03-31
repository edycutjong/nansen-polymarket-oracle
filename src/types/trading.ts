/**
 * Trading Types — Cross-Chain Proxy Hedging
 *
 * These types model the nansen-trading skill interaction:
 *  - Wallet management (create, check status)
 *  - Token price discovery
 *  - Quote generation (DEX aggregation)
 *  - Trade execution (with dry-run safety)
 */

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export interface WalletStatus {
  address: string;
  chain: string;
  balance_native: number;
  balance_usd: number;
  exists: boolean;
}

// ---------------------------------------------------------------------------
// Token Info
// ---------------------------------------------------------------------------

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  price_usd: number;
  market_cap_usd: number;
  liquidity_usd: number;
  volume_24h_usd: number;
}

// ---------------------------------------------------------------------------
// Trade Quote
// ---------------------------------------------------------------------------

export interface TradeQuote {
  from_token: string;
  to_token: string;
  chain: string;
  amount_in: number;
  expected_out: number;
  price_impact: number;
  route: string;
  gas_estimate_usd: number;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Trade Execution
// ---------------------------------------------------------------------------

export interface TradeExecution {
  tx_hash: string;
  status: 'success' | 'failed' | 'pending';
  from_token: string;
  to_token: string;
  amount_in: number;
  amount_out: number;
  chain: string;
  gas_used_usd: number;
  executed_at: string;
}

// ---------------------------------------------------------------------------
// Trade Config (CLI options)
// ---------------------------------------------------------------------------

export interface TradeConfig {
  market_id: string;
  chain: string;
  amount_usd: number;
  max_trade_usd: number;
  dry_run: boolean;
  slippage_bps: number;
}

// ---------------------------------------------------------------------------
// Proxy Hedge Signal
// ---------------------------------------------------------------------------

export interface ProxyHedgeSignal {
  market_question: string;
  divergence_score: number;
  divergence_level: string;
  direction: 'LONG' | 'SHORT';
  proxy_token: string;
  proxy_chain: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}
