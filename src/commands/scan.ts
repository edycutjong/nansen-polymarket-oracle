/**
 * `nansen-oracle scan` command
 *
 * Scans active prediction markets, enriches holders with SM labels,
 * and ranks markets by divergence score.
 */

import chalk from 'chalk';
import ora from 'ora';
import { fetchMarketScreener, fetchTopHolders, getApiCallCount } from '../lib/nansen.js';
import { enrichHolders, filterSmartMoney } from '../lib/enricher.js';
import { analyzeMarket, sortByDivergence } from '../lib/analyzer.js';
import { printScanTable } from '../lib/formatter.js';
import type { PredictionMarket, MarketHolder } from '../types/market.js';
import type { MarketAnalysis } from '../types/report.js';

export interface ScanOptions {
  category?: string;
  minVolume?: string;
  limit?: string;
  chain?: string;
}

export async function scanCommand(options: ScanOptions): Promise<MarketAnalysis[]> {
  const limit = parseInt(options.limit || '20', 10);
  const minVolume = parseFloat(options.minVolume || '0');
  const chain = options.chain || 'ethereum';

  console.log('');
  console.log(chalk.cyan.bold('🔮 Nansen Polymarket Oracle'));
  console.log(chalk.gray(`Scanning top ${limit} markets by volume...`));
  console.log('');

  // Phase 1: Discover markets
  const spinner = ora('Fetching active prediction markets...').start();

  const marketsResult = await fetchMarketScreener(limit);

  if (!marketsResult.success || !marketsResult.data) {
    spinner.fail('Failed to fetch markets');
    console.error(chalk.red(`Error: ${marketsResult.error || 'Unknown error'}`));
    return [];
  }

  let markets: PredictionMarket[] = (marketsResult.data || []) as PredictionMarket[];

  // Filter by minimum volume
  if (minVolume > 0) {
    markets = markets.filter((m) => m.volume_usd >= minVolume);
  }

  // Filter by category
  if (options.category) {
    const cat = options.category.toLowerCase();
    markets = markets.filter((m) =>
      m.category?.toLowerCase().includes(cat),
    );
  }

  spinner.succeed(`Found ${markets.length} markets`);

  if (markets.length === 0) {
    console.log(chalk.yellow('No markets match your filters.'));
    return [];
  }

  // Phase 2: Enrich each market
  const analyses: MarketAnalysis[] = [];

  for (const [i, market] of markets.entries()) {
    const label = market.question.length > 50
      ? market.question.slice(0, 47) + '...'
      : market.question;
    const progressSpinner = ora(
      `[${i + 1}/${markets.length}] Scanning: ${label}`,
    ).start();

    try {
      // Fetch holders for this market
      const holdersResult = await fetchTopHolders(market.market_id, 50);

      if (!holdersResult.success || !holdersResult.data) {
        progressSpinner.warn(`Skipped: ${label} (no holder data)`);
        continue;
      }

      const holders: MarketHolder[] = holdersResult.data as MarketHolder[];

      if (holders.length === 0) {
        progressSpinner.warn(`Skipped: ${label} (0 holders)`);
        continue;
      }

      // Enrich holders with SM labels
      const enrichedHolders = await enrichHolders(holders, chain, 3);
      const smHolders = filterSmartMoney(enrichedHolders);

      // Analyze
      const analysis = analyzeMarket(market, smHolders, holders.length);
      analyses.push(analysis);

      if (smHolders.length > 0) {
        progressSpinner.succeed(
          `${label} — SM: ${smHolders.length}/${holders.length} holders, Divergence: ${analysis.divergence_score > 0 ? '+' : ''}${analysis.divergence_score}`,
        );
      } else {
        progressSpinner.info(
          `${label} — No SM holders found (${holders.length} scanned)`,
        );
      }
    } catch (err) {
      progressSpinner.fail(`Error scanning: ${label}`);
      console.error(chalk.gray(`  ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  // Phase 3: Sort and display
  const sorted = sortByDivergence(analyses);
  printScanTable(sorted);

  console.log(chalk.gray(`Total API calls: ${getApiCallCount()}`));

  return sorted;
}
