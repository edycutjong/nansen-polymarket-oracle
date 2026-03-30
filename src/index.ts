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
import { checkNansenInstalled, resetApiCallCount } from './lib/nansen.js';

const program = new Command();

program
  .name('nansen-oracle')
  .description(
    '🔮 Smart Money × Prediction Market Intelligence\n' +
    'Cross-reference whale positions with market odds to find alpha.',
  )
  .version('1.0.0');

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
    await scanCommand(options);
  });

// ─── analyze ──────────────────────────────────────────────────────────────────
program
  .command('analyze <market-id>')
  .description('Deep analysis of a specific prediction market')
  .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
  .action(async (marketId: string, options) => {
    await ensureNansen();
    resetApiCallCount();
    await analyzeCommand({ marketId, ...options });
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
    await reportCommand(options);
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
    await watchCommand({ marketId, ...options });
  });

// ─── address ──────────────────────────────────────────────────────────────────
program
  .command('address <address>')
  .description('Investigate a specific trader address to show prediction market PnL, trades, and Smart Money profile')
  .action(async (address) => {
    await ensureNansen();
    resetApiCallCount();
    await addressCommand(address);
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
