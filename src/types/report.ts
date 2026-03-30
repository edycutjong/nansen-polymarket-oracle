/**
 * Report types — output structures for the Oracle's analysis.
 */

import type { PredictionMarket } from './market.js';
import type { SmartMoneyHolder } from './smartmoney.js';

/** Divergence severity levels */
export type DivergenceLevel = 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW' | 'ALIGNED';

/** Core analysis result for a single market */
export interface MarketAnalysis {
  market: PredictionMarket;
  /** SM Divergence Score: -100 to +100 */
  divergence_score: number;
  /** Human-readable level */
  divergence_level: DivergenceLevel;
  /** Percentage of SM holders on YES side (0.0 to 1.0) */
  sm_yes_ratio: number;
  /** Total SM capital in this market */
  sm_total_capital_usd: number;
  /** Number of SM wallets identified */
  sm_holder_count: number;
  /** Total holders scanned */
  total_holders_scanned: number;
  /** Individual SM holder details */
  sm_holders: SmartMoneyHolder[];
  /** Timestamp of analysis */
  analyzed_at: string;
}

/** Full Oracle report */
export interface OracleReport {
  /** Report metadata */
  generated_at: string;
  total_markets_scanned: number;
  total_api_calls: number;

  /** Markets sorted by |divergence_score| desc */
  analyses: MarketAnalysis[];

  /** High divergence alerts (|score| >= 30) */
  alerts: MarketAnalysis[];

  /** SM leaderboard across all scanned markets */
  sm_leaderboard: SmartMoneyLeaderboardEntry[];
}

/** SM leaderboard entry (aggregated across markets) */
export interface SmartMoneyLeaderboardEntry {
  address: string;
  label_summary: string;
  markets_active: number;
  total_capital_usd: number;
  /** Average divergence of markets they're in */
  avg_divergence: number;
}

/** Output format options */
export type OutputFormat = 'table' | 'json' | 'md';
