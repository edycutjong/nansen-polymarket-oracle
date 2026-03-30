/**
 * Smart Money types — wallet labels, profiler data, cross-referencing.
 */

/** Smart Money label categories (from nansen-skills/references/smart-money-labels.md) */
export type SmartMoneyLabel =
  | 'Fund'
  | 'Smart Trader'
  | '30D Smart Trader'
  | '90D Smart Trader'
  | '180D Smart Trader'
  | 'Smart HL Perps Trader';

/** Label result from profiler labels --address */
export interface WalletLabel {
  label: string;
  category?: string;
  definition?: string;
  smEarnedDate?: string;
  fullname?: string;
}

/** Enriched SM holder — a market holder that we've confirmed is Smart Money */
export interface SmartMoneyHolder {
  address: string;
  labels: WalletLabel[];
  position: 'YES' | 'NO';
  shares: number;
  value_usd: number;
  entry_price?: number;
  pnl_usd?: number;
  /** Summary of labels for display */
  label_summary: string;
  /** Is this address confirmed as Smart Money? */
  is_smart_money: boolean;
}

/** PnL summary from profiler pnl-summary --address */
export interface PnLSummary {
  total_realized_pnl?: number;
  total_unrealized_pnl?: number;
  win_rate?: number;
  total_trades?: number;
}

/** Enrichment result for a single address */
export interface EnrichmentResult {
  address: string;
  labels: WalletLabel[];
  is_smart_money: boolean;
  pnl_summary?: PnLSummary;
}
