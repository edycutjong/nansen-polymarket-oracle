#!/usr/bin/env node
/**
 * Nansen Polymarket Oracle
 *
 * Smart Money × Prediction Market Intelligence
 * Cross-reference whale positions with market odds to find alpha.
 *
 * Usage:
 *   nansen-oracle scan              # Discover mispriced markets
 *   nansen-oracle analyze <market>  # Deep dive into a market
 *   nansen-oracle report            # Generate full alpha report
 *   nansen-oracle watch <market>    # Real-time monitoring
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { scanCommand } from './commands/scan.js';
import { analyzeCommand } from './commands/analyze.js';
import { reportCommand } from './commands/report.js';
import { watchCommand } from './commands/watch.js';
import { addressCommand } from './commands/address.js';
import { tradeCommand } from './commands/trade.js';
import { checkNansenInstalled, resetApiCallCount } from './lib/nansen.js';
import { resetTelemetry, printTelemetryReceipt } from './lib/telemetry.js';

const program = new Command();

program
  .name('nansen-oracle')
  .description(
    '🔮 Smart Money × Prediction Market Intelligence\n' +
    'Cross-reference whale positions with market odds to find alpha.',
  )
  .version('2.0.0');

// ─── scan ─────────────────────────────────────────────────────────────────────
program
  .command('scan')
  .description('Scan active prediction markets for SM divergence')
  .option('-c, --category <category>', 'Filter by market category')
  .option('-v, --min-volume <usd>', 'Minimum volume in USD', '10000')
  .option('-l, --limit <number>', 'Number of markets to scan', '20')
  .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
  .action(async (options) => {
    await ensureNansen();
    resetApiCallCount();
    resetTelemetry();
    await scanCommand(options);
    printTelemetryReceipt();
  });

// ─── analyze ──────────────────────────────────────────────────────────────────
program
  .command('analyze <market-id>')
  .description('Deep analysis of a specific prediction market')
  .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
  .action(async (marketId: string, options) => {
    await ensureNansen();
    resetApiCallCount();
    resetTelemetry();
    await analyzeCommand({ marketId, ...options });
    printTelemetryReceipt();
  });

// ─── report ───────────────────────────────────────────────────────────────────
program
  .command('report')
  .description('Generate a full alpha report (Markdown or JSON)')
  .option('-f, --format <format>', 'Output format: md, json, table', 'md')
  .option('-o, --output <path>', 'Output file path')
  .option('-c, --category <category>', 'Filter by market category')
  .option('-v, --min-volume <usd>', 'Minimum volume in USD', '10000')
  .option('-l, --limit <number>', 'Number of markets to scan', '30')
  .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
  .action(async (options) => {
    await ensureNansen();
    resetApiCallCount();
    resetTelemetry();
    await reportCommand(options);
    printTelemetryReceipt();
  });

// ─── watch ────────────────────────────────────────────────────────────────────
program
  .command('watch <market-id>')
  .description('Real-time monitoring of a prediction market')
  .option('-i, --interval <seconds>', 'Scan interval in seconds', '60')
  .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
  .action(async (marketId: string, options) => {
    await ensureNansen();
    resetApiCallCount();
    resetTelemetry();
    await watchCommand({ marketId, ...options });
    printTelemetryReceipt();
  });

// ─── address ──────────────────────────────────────────────────────────────────
program
  .command('address <address>')
  .description('Investigate a specific trader address to show prediction market PnL, trades, and Smart Money profile')
  .action(async (address) => {
    await ensureNansen();
    resetApiCallCount();
    resetTelemetry();
    await addressCommand(address);
    printTelemetryReceipt();
  });

// ─── trade ────────────────────────────────────────────────────────────────────
program
  .command('trade')
  .description('Cross-chain proxy hedge based on SM divergence signals')
  .option('-a, --amount <usd>', 'Trade amount in USD', '10')
  .option('--chain <chain>', 'Chain for trading (base, solana)', 'base')
  .option('--no-dry-run', 'Execute live trade (default: dry-run)')
  .option('-t, --threshold <score>', 'Min divergence score for trade', '30')
  .option('-s, --slippage <bps>', 'Slippage tolerance in bps', '50')
  .option('--max-usd <usd>', 'Maximum trade size in USD', '100')
  .option('-c, --category <category>', 'Filter markets by category')
  .option('-l, --limit <number>', 'Number of markets to scan', '20')
  .action(async (options) => {
    await ensureNansen();
    resetApiCallCount();
    resetTelemetry();
    await tradeCommand(options);
    printTelemetryReceipt();
  });

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function ensureNansen(): Promise<void> {
  const installed = await checkNansenInstalled();
  if (!installed) {
    console.error(chalk.red('❌ Nansen CLI not found.'));
    console.error(chalk.gray('   Install: npm install -g @anthropic-ai/nansen-cli'));
    console.error(chalk.gray('   Then:    nansen auth login'));
    process.exit(1);
  }
}

program.parse();
