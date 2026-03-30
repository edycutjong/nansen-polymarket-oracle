/**
 * `nansen-oracle analyze` command
 *
 * Deep-dives into a specific market: enriched holder breakdown,
 * trading activity, PnL leaderboard, and price history.
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  fetchTopHolders,
  fetchTradesByMarket,
  fetchPnlByMarket,
  fetchMarketScreener,
  getApiCallCount,
} from '../lib/nansen.js';
import { enrichHolders, filterSmartMoney } from '../lib/enricher.js';
import { analyzeMarket } from '../lib/analyzer.js';
import { printMarketDetail } from '../lib/formatter.js';
import type { PredictionMarket, MarketHolder } from '../types/market.js';

export interface AnalyzeOptions {
  marketId: string;
  chain?: string;
}

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const { marketId, chain = 'ethereum' } = options;

  console.log('');
  console.log(chalk.cyan.bold('🔮 Nansen Polymarket Oracle — Deep Analysis'));
  console.log(chalk.gray(`Market ID: ${marketId}`));
  console.log('');

  // Step 1: Get market info from screener
  const infoSpinner = ora('Fetching market info...').start();

  const screenResult = await fetchMarketScreener(100);
  let market: PredictionMarket | undefined;

  if (screenResult.success && Array.isArray(screenResult.data)) {
    market = (screenResult.data as PredictionMarket[]).find(
      (m) => m.market_id === marketId || m.market_slug === marketId,
    );
  }

  if (!market) {
    // Construct minimal market object if not found in screener
    market = {
      market_id: marketId,
      question: `Market ${marketId}`,
      yes_price: 0.5,
      volume_usd: 0,
    };
    infoSpinner.warn('Market not found in screener, using defaults');
  } else {
    infoSpinner.succeed(`Market: "${market.question}"`);
  }

  // Step 2: Fetch holders
  const holderSpinner = ora('Fetching top holders...').start();
  const holdersResult = await fetchTopHolders(marketId, 100);

  if (!holdersResult.success || !holdersResult.data) {
    holderSpinner.fail('Failed to fetch holders');
    console.error(chalk.red(`Error: ${holdersResult.error}`));
    return;
  }

  const holders: MarketHolder[] = Array.isArray(holdersResult.data)
    ? (holdersResult.data as MarketHolder[])
    : [];

  holderSpinner.succeed(`Found ${holders.length} holders`);

  // Step 3: Enrich with SM labels
  const enrichSpinner = ora('Cross-referencing with Smart Money labels...').start();
  const enrichedHolders = await enrichHolders(holders, chain, 5);
  const smHolders = filterSmartMoney(enrichedHolders);
  enrichSpinner.succeed(`Identified ${smHolders.length} Smart Money holders`);

  // Step 4: Analyze divergence
  const analysis = analyzeMarket(market, smHolders, holders.length);
  printMarketDetail(analysis);

  // Step 5: Additional context — trades
  const tradeSpinner = ora('Fetching recent trades...').start();
  const tradesResult = await fetchTradesByMarket(marketId, 20);

  if (tradesResult.success && Array.isArray(tradesResult.data)) {
    const trades = tradesResult.data as Array<Record<string, unknown>>;
    tradeSpinner.succeed(`${trades.length} recent trades`);

    // Show SM trades only
    const smAddresses = new Set(smHolders.map((h) => h.address.toLowerCase()));
    const smTrades = trades.filter(
      (t) => typeof t.address === 'string' && smAddresses.has(t.address.toLowerCase()),
    );

    if (smTrades.length > 0) {
      console.log(chalk.white.bold('  Recent SM Trades:'));
      for (const t of smTrades.slice(0, 5)) {
        console.log(
          chalk.gray(`    ${t.side} ${t.outcome} — $${Number(t.value_usd || 0).toFixed(0)} @ ${t.timestamp}`),
        );
      }
    }
  } else {
    tradeSpinner.info('No trade data available');
  }

  // Step 6: PnL leaderboard
  const pnlSpinner = ora('Fetching PnL leaderboard...').start();
  const pnlResult = await fetchPnlByMarket(marketId, 10);

  if (pnlResult.success && Array.isArray(pnlResult.data)) {
    const pnlEntries = pnlResult.data as Array<Record<string, unknown>>;
    pnlSpinner.succeed(`PnL data for ${pnlEntries.length} traders`);
  } else {
    pnlSpinner.info('No PnL data available');
  }

  console.log('');
  console.log(chalk.gray(`Total API calls: ${getApiCallCount()}`));
  console.log('');
}
