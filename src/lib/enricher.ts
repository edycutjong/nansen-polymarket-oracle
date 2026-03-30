/**
 * Enricher — Cross-references market holder addresses against Nansen's
 * Smart Money labels. This is the core "secret sauce" of the Oracle.
 *
 * Flow:
 * 1. Take a list of market holders (addresses)
 * 2. For each address, call profiler labels
 * 3. Check if any label matches the SM label set
 * 4. Return enriched holders with SM classification
 */

import { fetchProfilerLabels } from './nansen.js';
import { labelCache } from './cache.js';
import { lookupKnownWallet } from './known-wallets.js';
import type { MarketHolder } from '../types/market.js';
import type { WalletLabel, SmartMoneyHolder } from '../types/smartmoney.js';

/** Labels that qualify an address as "Smart Money" */
const SM_LABELS = new Set([
  'Fund',
  'Smart Trader',
  '30D Smart Trader',
  '90D Smart Trader',
  '180D Smart Trader',
  'Smart HL Perps Trader',
]);

/**
 * Check if a set of labels contains any Smart Money label.
 */
export function isSmartMoney(labels: WalletLabel[]): boolean {
  return labels.some((l) => SM_LABELS.has(l.label));
}

/**
 * Create a human-readable label summary.
 * e.g. "Fund, Smart Trader" or "Unknown"
 */
export function summarizeLabels(labels: WalletLabel[]): string {
  if (labels.length === 0) return 'Unknown';
  const smLabels = labels.filter((l) => SM_LABELS.has(l.label));
  if (smLabels.length > 0) {
    return smLabels.map((l) => l.fullname || l.label).join(', ');
  }
  return labels.map((l) => l.fullname || l.label).join(', ');
}

/**
 * Enrich a single address with Nansen labels.
 *
 * Lookup order:
 * 1. Local known-wallets registry (free, instant — $1M+ whale addresses)
 * 2. Label cache (previously resolved addresses)
 * 3. Nansen profiler API (costs credits — used only for unknown addresses)
 *
 * This means scans work even when profiler credits are exhausted.
 */
export async function enrichAddress(
  address: string,
  chain = 'ethereum',
): Promise<{ labels: WalletLabel[]; is_smart_money: boolean }> {
  // Fast path: check known-wallets registry first (zero API cost)
  const knownLabel = lookupKnownWallet(address);
  if (knownLabel) {
    return {
      labels: [knownLabel],
      is_smart_money: true, // All known wallets are SM by definition
    };
  }

  const cacheKey = `labels:${chain}:${address}`;

  return labelCache.getOrFetch(cacheKey, async () => {
    const result = await fetchProfilerLabels(address, chain);

    if (!result.success || !result.data) {
      return { labels: [], is_smart_money: false };
    }

    // Handle both array and single-object responses
    const labels: WalletLabel[] = Array.isArray(result.data)
      ? (result.data as WalletLabel[])
      : [result.data as WalletLabel];

    return {
      labels,
      is_smart_money: isSmartMoney(labels),
    };
  });
}

/**
 * Enrich a batch of market holders with Smart Money labels.
 * This is the main enrichment pipeline.
 *
 * @param holders - Raw market holders from top-holders endpoint
 * @param chain - Chain to query labels on (default: ethereum for Polymarket)
 * @param concurrency - Max concurrent label lookups
 */
export async function enrichHolders(
  holders: MarketHolder[],
  chain = 'ethereum',
  concurrency = 5,
): Promise<SmartMoneyHolder[]> {
  const results: SmartMoneyHolder[] = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < holders.length; i += concurrency) {
    const batch = holders.slice(i, i + concurrency);
    const enrichedBatch = await Promise.all(
      batch.map(async (holder) => {
        const enrichment = await enrichAddress(holder.address, chain);
        return {
          address: holder.address,
          labels: enrichment.labels,
          position: holder.position,
          shares: holder.shares,
          value_usd: holder.value_usd,
          entry_price: holder.entry_price,
          pnl_usd: holder.pnl_usd,
          label_summary: summarizeLabels(enrichment.labels),
          is_smart_money: enrichment.is_smart_money,
        } satisfies SmartMoneyHolder;
      }),
    );
    results.push(...enrichedBatch);
  }

  return results;
}

/**
 * Filter enriched holders to only Smart Money.
 */
export function filterSmartMoney(holders: SmartMoneyHolder[]): SmartMoneyHolder[] {
  return holders.filter((h) => h.is_smart_money);
}
