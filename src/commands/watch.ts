/**
 * `nansen-oracle watch` command
 *
 * Real-time monitoring mode — re-scans a market at intervals
 * and alerts when SM divergence changes significantly.
 */

import chalk from 'chalk';
import ora from 'ora';
import { fetchTopHolders, fetchMarketScreener, getApiCallCount } from '../lib/nansen.js';
import { enrichHolders, filterSmartMoney } from '../lib/enricher.js';
import { analyzeMarket } from '../lib/analyzer.js';
import { printMarketDetail } from '../lib/formatter.js';
import { labelCache, marketCache } from '../lib/cache.js';
import type { PredictionMarket, MarketHolder } from '../types/market.js';

export interface WatchOptions {
  marketId: string;
  interval?: string;
  chain?: string;
}

export async function watchCommand(options: WatchOptions): Promise<void> {
  const { marketId, chain = 'ethereum' } = options;
  const intervalMs = parseInt(options.interval || '60', 10) * 1000;
  let lastScore: number | null = null;

  console.log('');
  console.log(chalk.cyan.bold('🔮 Nansen Polymarket Oracle — Watch Mode'));
  console.log(chalk.gray(`Market: ${marketId}`));
  console.log(chalk.gray(`Interval: ${intervalMs / 1000}s | Press Ctrl+C to stop`));
  console.log('');

  const runScan = async () => {
    // Clear caches for fresh data
    labelCache.clear();
    marketCache.clear();

    const spinner = ora('Scanning...').start();

    try {
      // Fetch market info
      const screenResult = await fetchMarketScreener(100);
      let market: PredictionMarket | undefined;

      if (screenResult.success && Array.isArray(screenResult.data)) {
        market = (screenResult.data as PredictionMarket[]).find(
          (m) => m.market_id === marketId || m.market_slug === marketId,
        );
      }

      if (!market) {
        market = {
          market_id: marketId,
          question: `Market ${marketId}`,
          yes_price: 0.5,
          volume_usd: 0,
        };
      }

      // Fetch and enrich holders
      const holdersResult = await fetchTopHolders(marketId, 50);

      if (!holdersResult.success || !holdersResult.data) {
        spinner.warn('No holder data');
        return;
      }

      const holders: MarketHolder[] = Array.isArray(holdersResult.data)
        ? (holdersResult.data as MarketHolder[])
        : [];

      const enriched = await enrichHolders(holders, chain, 3);
      const smHolders = filterSmartMoney(enriched);
      const analysis = analyzeMarket(market, smHolders, holders.length);

      // Check for change
      if (lastScore !== null) {
        const delta = analysis.divergence_score - lastScore;
        if (Math.abs(delta) >= 5) {
          spinner.warn(
            chalk.yellow(`⚡ Divergence shifted ${delta > 0 ? '+' : ''}${delta} pts!`),
          );
        }
      }
      lastScore = analysis.divergence_score;

      spinner.stop();
      printMarketDetail(analysis);
      console.log(chalk.gray(`[${new Date().toLocaleTimeString()}] API calls: ${getApiCallCount()} | Next scan in ${intervalMs / 1000}s`));
    } catch (err) {
      spinner.fail(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Initial scan
  await runScan();

  // Interval loop
  const timer = setInterval(runScan, intervalMs);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('');
    console.log(chalk.gray('Watch stopped.'));
    console.log(chalk.gray(`Total API calls: ${getApiCallCount()}`));
    process.exit(0);
  });
}
