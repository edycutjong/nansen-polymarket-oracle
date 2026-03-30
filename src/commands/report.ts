/**
 * `nansen-oracle report` command
 *
 * Generates a full alpha report: scans markets, enriches, analyzes,
 * and outputs as a formatted Markdown or JSON file.
 */

import chalk from 'chalk';
import { writeFileSync } from 'node:fs';
import { scanCommand } from './scan.js';
import { sortByDivergence, filterAlerts, buildSmLeaderboard } from '../lib/analyzer.js';
import { generateMarkdownReport, printScanTable } from '../lib/formatter.js';
import { getApiCallCount } from '../lib/nansen.js';
import type { OracleReport, OutputFormat } from '../types/report.js';

export interface ReportOptions {
  format?: string;
  output?: string;
  category?: string;
  minVolume?: string;
  limit?: string;
  chain?: string;
}

export async function reportCommand(options: ReportOptions): Promise<void> {
  const format = (options.format || 'md') as OutputFormat;
  const outputPath = options.output || `oracle-report-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;

  console.log('');
  console.log(chalk.cyan.bold('🔮 Nansen Polymarket Oracle — Full Report'));
  console.log(chalk.gray(`Output: ${outputPath} (${format})`));
  console.log('');

  // Run the full scan pipeline
  const analyses = await scanCommand({
    category: options.category,
    minVolume: options.minVolume,
    limit: options.limit || '30',
    chain: options.chain,
  });

  if (analyses.length === 0) {
    console.log(chalk.yellow('No data to report.'));
    return;
  }

  // Build the report
  const sorted = sortByDivergence(analyses);
  const alerts = filterAlerts(sorted, 30);
  const leaderboard = buildSmLeaderboard(sorted);

  const report: OracleReport = {
    generated_at: new Date().toISOString(),
    total_markets_scanned: analyses.length,
    total_api_calls: getApiCallCount(),
    analyses: sorted,
    alerts,
    sm_leaderboard: leaderboard,
  };

  // Output
  if (format === 'json') {
    const json = JSON.stringify(report, null, 2);
    writeFileSync(outputPath, json);
    console.log(chalk.green(`✅ JSON report saved to ${outputPath}`));
  } else if (format === 'table') {
    printScanTable(sorted);
  } else {
    const markdown = generateMarkdownReport(report);
    writeFileSync(outputPath, markdown);
    console.log(chalk.green(`✅ Markdown report saved to ${outputPath}`));
  }

  // Summary
  console.log('');
  console.log(chalk.cyan.bold('📋 Report Summary'));
  console.log(`  Markets analyzed: ${chalk.white(String(report.total_markets_scanned))}`);
  console.log(`  High divergence alerts: ${chalk.yellow(String(report.alerts.length))}`);
  console.log(`  SM wallets identified: ${chalk.white(String(report.sm_leaderboard.length))}`);
  console.log(`  API calls made: ${chalk.gray(String(report.total_api_calls))}`);
  console.log('');
}
