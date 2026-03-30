/**
 * Analyzer — The divergence score calculator.
 *
 * SM Divergence Score: -100 to +100
 * - Positive = SM more bullish (weighted toward YES) than market odds
 * - Negative = SM more bearish (weighted toward NO) than market odds
 * - Zero = SM and market agree
 */

import type { PredictionMarket } from '../types/market.js';
import type { SmartMoneyHolder } from '../types/smartmoney.js';
import type { MarketAnalysis, DivergenceLevel, SmartMoneyLeaderboardEntry } from '../types/report.js';

// ---------------------------------------------------------------------------
// Divergence Score
// ---------------------------------------------------------------------------

/**
 * Calculate the SM Divergence Score for a market.
 *
 * The score is capital-weighted: a whale holding $500K YES counts more
 * than a smart trader holding $5K YES.
 *
 * @param marketOdds - Current YES price (0.0 to 1.0)
 * @param smHolders - Enriched SM holders for this market
 * @returns Score from -100 to +100
 */
export function calculateDivergence(
  marketOdds: number,
  smHolders: SmartMoneyHolder[],
): number {
  if (smHolders.length === 0) return 0;

  const totalSmCapital = smHolders.reduce((sum, h) => sum + h.value_usd, 0);
  if (totalSmCapital === 0) return 0;

  // Capital-weighted SM conviction
  const smConviction = smHolders.reduce((acc, holder) => {
    const weight = holder.value_usd / totalSmCapital;
    return acc + (holder.position === 'YES' ? weight : -weight);
  }, 0);

  // Normalize convicton from [-1, 1] to [0, 1] for comparison
  const smOdds = (smConviction + 1) / 2;

  // Divergence = SM odds - Market odds (in percentage points)
  return Math.round((smOdds - marketOdds) * 100);
}

/**
 * Classify divergence level for display.
 */
export function classifyDivergence(score: number): DivergenceLevel {
  const abs = Math.abs(score);
  if (abs >= 40) return 'EXTREME';
  if (abs >= 30) return 'HIGH';
  if (abs >= 15) return 'MODERATE';
  if (abs >= 5) return 'LOW';
  return 'ALIGNED';
}

/**
 * Get the emoji for a divergence level.
 */
export function divergenceEmoji(level: DivergenceLevel): string {
  switch (level) {
    case 'EXTREME': return '🔥';
    case 'HIGH': return '⚠️';
    case 'MODERATE': return '📊';
    case 'LOW': return '✅';
    case 'ALIGNED': return '🤝';
  }
}

// ---------------------------------------------------------------------------
// Market Analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a single market: compute divergence from enriched holders.
 */
export function analyzeMarket(
  market: PredictionMarket,
  smHolders: SmartMoneyHolder[],
  totalHoldersScanned: number,
): MarketAnalysis {
  const score = calculateDivergence(market.yes_price, smHolders);
  const level = classifyDivergence(score);

  const yesHolders = smHolders.filter((h) => h.position === 'YES');
  const smYesRatio = smHolders.length > 0
    ? yesHolders.length / smHolders.length
    : 0;

  const totalCapital = smHolders.reduce((sum, h) => sum + h.value_usd, 0);

  return {
    market,
    divergence_score: score,
    divergence_level: level,
    sm_yes_ratio: smYesRatio,
    sm_total_capital_usd: totalCapital,
    sm_holder_count: smHolders.length,
    total_holders_scanned: totalHoldersScanned,
    sm_holders: smHolders,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Sort analyses by absolute divergence score (highest first).
 */
export function sortByDivergence(analyses: MarketAnalysis[]): MarketAnalysis[] {
  return [...analyses].sort(
    (a, b) => Math.abs(b.divergence_score) - Math.abs(a.divergence_score),
  );
}

/**
 * Filter to only high-divergence alerts (|score| >= threshold).
 */
export function filterAlerts(
  analyses: MarketAnalysis[],
  threshold = 30,
): MarketAnalysis[] {
  return analyses.filter((a) => Math.abs(a.divergence_score) >= threshold);
}

// ---------------------------------------------------------------------------
// SM Leaderboard
// ---------------------------------------------------------------------------

/**
 * Build an SM leaderboard aggregated across all analyzed markets.
 */
export function buildSmLeaderboard(
  analyses: MarketAnalysis[],
): SmartMoneyLeaderboardEntry[] {
  const addressMap = new Map<string, {
    label_summary: string;
    markets: number;
    capital: number;
    divergences: number[];
  }>();

  for (const analysis of analyses) {
    for (const holder of analysis.sm_holders) {
      const existing = addressMap.get(holder.address);
      if (existing) {
        existing.markets++;
        existing.capital += holder.value_usd;
        existing.divergences.push(analysis.divergence_score);
      } else {
        addressMap.set(holder.address, {
          label_summary: holder.label_summary,
          markets: 1,
          capital: holder.value_usd,
          divergences: [analysis.divergence_score],
        });
      }
    }
  }

  return Array.from(addressMap.entries())
    .map(([address, data]) => ({
      address,
      label_summary: data.label_summary,
      markets_active: data.markets,
      total_capital_usd: data.capital,
      avg_divergence: Math.round(
        data.divergences.reduce((a, b) => a + b, 0) / data.divergences.length,
      ),
    }))
    .sort((a, b) => b.total_capital_usd - a.total_capital_usd);
}
