/**
 * Formatter — Terminal and Markdown output rendering.
 * Uses Chalk for beautiful terminal colors.
 */

import chalk from 'chalk';
import type { MarketAnalysis, OracleReport, DivergenceLevel } from '../types/report.js';

// ---------------------------------------------------------------------------
// Color Helpers
// ---------------------------------------------------------------------------

const colors: Record<DivergenceLevel, (text: string) => string> = {
  EXTREME: chalk.red.bold,
  HIGH: chalk.yellow.bold,
  MODERATE: chalk.blueBright,
  LOW: chalk.green,
  ALIGNED: chalk.gray,
};

function colorScore(score: number, level: DivergenceLevel, width: number = 0): string {
  const prefix = score > 0 ? '+' : '';
  const valStr = `${prefix}${score}`.padStart(4, ' ');
  const text = width > 0 ? padEnd(valStr, width) : valStr;
  return colors[level](text);
}

function emoji(level: DivergenceLevel): string {
  const map: Record<DivergenceLevel, string> = {
    EXTREME: '🔥', HIGH: '⚠️', MODERATE: '📊', LOW: '✅', ALIGNED: '🤝',
  };
  return map[level];
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`.padStart(4, ' ');
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function truncAddr(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Terminal Table Output
// ---------------------------------------------------------------------------

/**
 * Print the scan summary table to terminal.
 */
export function printScanTable(analyses: MarketAnalysis[]): void {
  console.log('');
  console.log(chalk.cyan.bold('🔮 Nansen Polymarket Oracle — Scan Results'));
  console.log(chalk.gray('─'.repeat(100)));
  console.log(
    chalk.gray(
      padEnd('Market', 40) +
      padEnd('Odds', 10) +
      padEnd('SM Pos', 12) +
      padEnd('Diverg.', 10) +
      padEnd('SM $', 10) +
      padEnd('SM #', 6) +
      padEnd('Level', 12)
    ),
  );
  console.log(chalk.gray('─'.repeat(100)));

  for (const a of analyses) {
    const question = a.market.question.length > 38
      ? a.market.question.slice(0, 35) + '...'
      : a.market.question;

    console.log(
      padEnd(question, 40) +
      padEnd(formatPercent(a.market.yes_price) + ' YES', 10) +
      padEnd(formatPercent(a.sm_yes_ratio) + ' YES', 12) +
      colorScore(a.divergence_score, a.divergence_level, 10) +
      padEnd(formatCurrency(a.sm_total_capital_usd), 10) +
      padEnd(String(a.sm_holder_count), 6) +
      `${emoji(a.divergence_level)} ${a.divergence_level}`
    );
  }

  console.log(chalk.gray('─'.repeat(100)));
  console.log('');
}

/**
 * Print a detailed market analysis to terminal.
 */
export function printMarketDetail(analysis: MarketAnalysis): void {
  const a = analysis;
  console.log('');
  console.log(chalk.cyan.bold(`🔮 ${a.market.question}`));
  console.log(chalk.gray('─'.repeat(70)));

  const rows: [string, string][] = [
    ['Market Odds', `${formatPercent(a.market.yes_price)} YES`],
    ['SM Position', `${formatPercent(a.sm_yes_ratio)} YES (${a.sm_holder_count} of ${a.total_holders_scanned} holders)`],
    ['Divergence Score', `${colorScore(a.divergence_score, a.divergence_level)} ${emoji(a.divergence_level)} ${a.divergence_level}`],
    ['SM Capital Deployed', formatCurrency(a.sm_total_capital_usd)],
    ['Volume', formatCurrency(a.market.volume_usd)],
    ['Category', a.market.category || 'N/A'],
  ];

  for (const [label, value] of rows) {
    console.log(`  ${chalk.white.bold(padEnd(label, 22))} ${value}`);
  }

  if (a.sm_holders.length > 0) {
    console.log('');
    console.log(chalk.white.bold('  Smart Money Holders:'));
    console.log(chalk.gray('  ' + padEnd('Address', 16) + padEnd('Label', 22) + padEnd('Pos', 6) + padEnd('Value', 12)));

    for (const h of a.sm_holders.slice(0, 10)) {
      console.log(
        `  ${padEnd(truncAddr(h.address), 16)}` +
        `${padEnd(h.label_summary.slice(0, 20), 22)}` +
        `${padEnd(h.position, 6)}` +
        `${formatCurrency(h.value_usd)}`
      );
    }
    if (a.sm_holders.length > 10) {
      console.log(chalk.gray(`  ... and ${a.sm_holders.length - 10} more`));
    }
  }

  console.log(chalk.gray('─'.repeat(70)));
  console.log('');
}

// ---------------------------------------------------------------------------
// Markdown Report
// ---------------------------------------------------------------------------

/**
 * Generate a full Markdown report.
 */
export function generateMarkdownReport(report: OracleReport): string {
  const lines: string[] = [];

  lines.push('# 🔮 Nansen Polymarket Oracle Report');
  lines.push('');
  lines.push(`Generated: ${new Date(report.generated_at).toLocaleString()}`);
  lines.push(`Markets Scanned: ${report.total_markets_scanned} | API Calls: ${report.total_api_calls}`);
  lines.push('');

  // Alerts section
  if (report.alerts.length > 0) {
    lines.push('## 🚨 High Divergence Alerts (SM ≠ Market)');
    lines.push('');

    for (const [i, a] of report.alerts.entries()) {
      lines.push(`### ${i + 1}. "${a.market.question}"`);
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Market Odds | ${formatPercent(a.market.yes_price)} YES |`);
      lines.push(`| SM Position | ${formatPercent(a.sm_yes_ratio)} YES (${a.sm_holder_count} SM wallets) |`);
      lines.push(`| **Divergence Score** | **${a.divergence_score > 0 ? '+' : ''}${a.divergence_score} pts (${a.divergence_level})** |`);
      lines.push(`| SM Capital Deployed | ${formatCurrency(a.sm_total_capital_usd)} |`);
      lines.push(`| Volume | ${formatCurrency(a.market.volume_usd)} |`);

      if (a.sm_holders.length > 0) {
        const topHolder = a.sm_holders[0];
        lines.push(`| Top SM Holder | ${truncAddr(topHolder.address)} (${topHolder.label_summary}) |`);
      }

      lines.push('');
      const direction = a.divergence_score > 0 ? 'bullish' : 'bearish';
      lines.push(`> 🧠 **Insight**: Smart Money is **${direction}** on this outcome despite ` +
        `${a.divergence_score > 0 ? 'low' : 'high'} market odds. ` +
        `${a.sm_holder_count} SM wallets identified.`);
      lines.push('');
    }
  }

  // Market Overview Table
  lines.push('## 📊 Market Overview');
  lines.push('');
  lines.push('| Market | Odds | SM Position | Divergence | Volume |');
  lines.push('|--------|------|-------------|------------|--------|');

  for (const a of report.analyses) {
    const scoreStr = `${a.divergence_score > 0 ? '+' : ''}${a.divergence_score}`;
    const emojiStr = a.divergence_level === 'EXTREME' || a.divergence_level === 'HIGH'
      ? '🔥' : a.divergence_level === 'MODERATE' ? '📊' : '✅';
    const question = a.market.question.length > 35
      ? a.market.question.slice(0, 32) + '...'
      : a.market.question;
    lines.push(
      `| ${question} | ${formatPercent(a.market.yes_price)} YES | ${formatPercent(a.sm_yes_ratio)} YES | ${emojiStr} ${scoreStr} | ${formatCurrency(a.market.volume_usd)} |`
    );
  }
  lines.push('');

  // SM Leaderboard
  if (report.sm_leaderboard.length > 0) {
    lines.push('## 🏦 Smart Money Leaderboard');
    lines.push('');
    lines.push('| Rank | Address | Label | Markets | Capital |');
    lines.push('|------|---------|-------|---------|---------|');

    for (const [i, entry] of report.sm_leaderboard.slice(0, 15).entries()) {
      lines.push(
        `| ${i + 1} | ${truncAddr(entry.address)} | ${entry.label_summary.slice(0, 20)} | ${entry.markets_active} | ${formatCurrency(entry.total_capital_usd)} |`
      );
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('> 📊 Data by [Nansen](https://nansen.ai) | Built for #NansenCLI Week 3');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padEnd(str: string, length: number): string {
  return str.padEnd(length);
}
