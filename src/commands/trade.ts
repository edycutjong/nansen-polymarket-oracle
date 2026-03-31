/**
 * Trade Command — Cross-Chain Proxy Hedging
 *
 * Flow:
 *  1. Run the scan pipeline to find divergent markets
 *  2. Map divergence signals to proxy hedge tokens
 *  3. Check wallet status (create if needed)
 *  4. Get trade quote from DEX aggregator
 *  5. Execute trade (dry-run by default)
 *
 * Safety:
 *  - All trades default to --dry-run
 *  - MAX_TRADE_USD enforced ($100 default)
 *  - Wallet existence verified before any trade
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  ensureWallet,
  fetchTokenInfo,
  getTradeQuote,
  executeTrade,
  mapToHedgeSignal,
  validateTradeAmount,
  MAX_TRADE_USD,
  DEFAULT_SLIPPAGE_BPS,
} from '../lib/trading.js';
import { scanCommand } from './scan.js';
import { filterAlerts } from '../lib/analyzer.js';
import type { MarketAnalysis } from '../types/report.js';
import type { ProxyHedgeSignal } from '../types/trading.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TradeOptions {
  amount?: string;
  chain?: string;
  dryRun?: boolean;
  threshold?: string;
  slippage?: string;
  maxUsd?: string;
  category?: string;
  limit?: string;
}

// ---------------------------------------------------------------------------
// Signal Formatter
// ---------------------------------------------------------------------------

export function printHedgeSignals(signals: ProxyHedgeSignal[]): void {
  if (signals.length === 0) {
    console.log(chalk.yellow('  No actionable hedge signals found.'));
    return;
  }

  console.log(chalk.cyan.bold('\n  📡 Proxy Hedge Signals:\n'));
  for (const s of signals) {
    const dirIcon = s.direction === 'LONG' ? chalk.green('▲ LONG') : chalk.red('▼ SHORT');
    const confColor = s.confidence === 'HIGH' ? chalk.green : s.confidence === 'MEDIUM' ? chalk.yellow : chalk.gray;
    const question = s.market_question.length > 50
      ? s.market_question.slice(0, 47) + '...'
      : s.market_question;

    console.log(`  ${dirIcon} ${chalk.white(s.proxy_token)} on ${chalk.gray(s.proxy_chain)} | ${confColor(s.confidence)} | div: ${chalk.white(String(s.divergence_score))} | ${chalk.gray(question)}`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Trade Command
// ---------------------------------------------------------------------------

export async function tradeCommand(opts: TradeOptions): Promise<{
  signals: ProxyHedgeSignal[];
  executed: boolean;
}> {
  const amount = parseFloat(opts.amount || '10');
  const chain = opts.chain || 'base';
  const dryRun = opts.dryRun !== false; // default true
  const threshold = parseInt(opts.threshold || '30', 10);
  const slippage = parseInt(opts.slippage || String(DEFAULT_SLIPPAGE_BPS), 10);
  const maxUsd = parseFloat(opts.maxUsd || String(MAX_TRADE_USD));

  // Phase 1: Validate trade amount
  const validation = validateTradeAmount(amount, maxUsd);
  if (!validation.valid) {
    const spinner = ora();
    spinner.fail(chalk.red(`Trade blocked: ${validation.reason}`));
    return { signals: [], executed: false };
  }

  // Phase 2: Scan markets for divergence
  const spinner = ora('Scanning markets for divergence signals...').start();
  const analyses = await scanCommand({
    category: opts.category,
    limit: opts.limit,
  });

  if (analyses.length === 0) {
    spinner.fail('No markets found. Cannot generate hedge signals.');
    return { signals: [], executed: false };
  }

  // Phase 3: Filter to high-divergence alerts
  const alerts = filterAlerts(analyses as MarketAnalysis[], threshold);
  if (alerts.length === 0) {
    spinner.warn(`No divergence above threshold (${threshold}). No trades.`);
    return { signals: [], executed: false };
  }

  spinner.succeed(`Found ${alerts.length} divergent market(s) above threshold ${threshold}`);

  // Phase 4: Map alerts to hedge signals
  const signals = alerts.map(mapToHedgeSignal);
  printHedgeSignals(signals);

  // Phase 5: Pick the highest-confidence signal
  const bestSignal = signals.sort((a, b) => {
    const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return order[b.confidence] - order[a.confidence];
  })[0];

  if (!bestSignal || bestSignal.confidence === 'LOW') {
    console.log(chalk.yellow('  Best signal is LOW confidence. Skipping trade.'));
    return { signals, executed: false };
  }

  // Phase 6: Wallet check
  const walletSpinner = ora(`Checking wallet on ${chain}...`).start();
  const walletResult = await ensureWallet(chain);
  if (!walletResult.success) {
    walletSpinner.fail('Wallet check failed. Cannot proceed.');
    return { signals, executed: false };
  }
  walletSpinner.succeed(`Wallet ready: ${walletResult.data?.address?.slice(0, 10)}...`);

  // Phase 7: Token price lookup
  const tokenSpinner = ora(`Fetching ${bestSignal.proxy_token} price...`).start();
  const tokenResult = await fetchTokenInfo(bestSignal.proxy_token, chain);
  if (tokenResult.success && tokenResult.data) {
    tokenSpinner.succeed(`${bestSignal.proxy_token}: $${tokenResult.data.price_usd}`);
  } else {
    tokenSpinner.warn('Token price unavailable, proceeding with quote...');
  }

  // Phase 8: Trade quote
  const fromToken = bestSignal.direction === 'LONG' ? 'USDC' : bestSignal.proxy_token;
  const toToken = bestSignal.direction === 'LONG' ? bestSignal.proxy_token : 'USDC';
  const quoteSpinner = ora(`Getting quote: ${amount} ${fromToken} → ${toToken}...`).start();

  const quoteResult = await getTradeQuote(fromToken, toToken, amount, chain, slippage);
  if (!quoteResult.success || !quoteResult.data) {
    quoteSpinner.fail('Quote failed. Aborting trade.');
    return { signals, executed: false };
  }

  const quote = quoteResult.data;
  quoteSpinner.succeed(
    `Quote: ${quote.amount_in} ${fromToken} → ${quote.expected_out} ${toToken} | Impact: ${quote.price_impact}% | Gas: $${quote.gas_estimate_usd}`,
  );

  // Phase 9: Execute (or dry-run)
  const modeLabel = dryRun ? chalk.yellow('[DRY RUN]') : chalk.green('[LIVE]');
  const execSpinner = ora(`${modeLabel} Executing trade...`).start();

  const execResult = await executeTrade(fromToken, toToken, amount, chain, slippage, dryRun);
  if (!execResult.success || !execResult.data) {
    execSpinner.fail('Trade execution failed.');
    return { signals, executed: false };
  }

  const exec = execResult.data;
  if (dryRun) {
    execSpinner.succeed(`${modeLabel} Simulated: ${exec.amount_in} ${fromToken} → ${exec.amount_out} ${toToken} | tx: ${exec.tx_hash.slice(0, 16)}...`);
  } else {
    execSpinner.succeed(`${modeLabel} Executed: ${exec.amount_in} ${fromToken} → ${exec.amount_out} ${toToken} | tx: ${exec.tx_hash.slice(0, 16)}... | gas: $${exec.gas_used_usd}`);
  }

  return { signals, executed: true };
}
