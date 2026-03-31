/**
 * Telemetry — Global API call tracker for the Oracle.
 *
 * Records every Nansen CLI call with:
 *  - Endpoint name
 *  - Method (GET/EXEC)
 *  - Latency (ms)
 *  - Status (200/SUCCESS/ERROR)
 *  - Cache hit/miss
 *  - Role classification (Discovery, Enrichment, Trading, etc.)
 *
 * Prints a formatted receipt at the end of each command to prove
 * API call count for the hackathon submission.
 */

import chalk from 'chalk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TelemetryEntry {
  endpoint: string;
  method: 'GET' | 'EXEC';
  latency_ms: number;
  status: string;
  cache: 'HIT' | 'MISS' | 'N/A';
  role: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const entries: TelemetryEntry[] = [];
let enabled = true;

/**
 * Record a new API call in the telemetry log.
 */
export function recordCall(entry: TelemetryEntry): void {
  if (enabled) {
    entries.push(entry);
  }
}

/**
 * Get all recorded telemetry entries.
 */
export function getEntries(): TelemetryEntry[] {
  return [...entries];
}

/**
 * Get the total number of recorded calls.
 */
export function getCallCount(): number {
  return entries.length;
}

/**
 * Reset the telemetry log (call between commands).
 */
export function resetTelemetry(): void {
  entries.length = 0;
}

/**
 * Enable or disable telemetry recording.
 */
export function setTelemetryEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Check if telemetry is enabled.
 */
export function isTelemetryEnabled(): boolean {
  return enabled;
}

// ---------------------------------------------------------------------------
// Role Classification
// ---------------------------------------------------------------------------

/**
 * Classify the role of an API call based on the command string.
 */
export function classifyRole(command: string): string {
  if (command.includes('market-screener') || command.includes('event-screener')) {
    return 'Discovery';
  }
  if (command.includes('categories')) {
    return 'Discovery';
  }
  if (command.includes('profiler') || command.includes('labels')) {
    return 'Enrichment';
  }
  if (command.includes('smart-money')) {
    return 'SM Analysis';
  }
  if (command.includes('top-holders') || command.includes('position-detail')) {
    return 'Holder Analysis';
  }
  if (command.includes('pnl')) {
    return 'PnL Tracking';
  }
  if (command.includes('trades-by')) {
    return 'Trade History';
  }
  if (command.includes('ohlcv') || command.includes('orderbook')) {
    return 'Market Data';
  }
  if (command.includes('token info')) {
    return 'Price Oracle';
  }
  if (command.includes('trade quote')) {
    return 'Trade Quote';
  }
  if (command.includes('trade execute')) {
    return 'Trade Execution';
  }
  if (command.includes('wallet')) {
    return 'Wallet Mgmt';
  }
  if (command.includes('bridge-status')) {
    return 'Bridge Status';
  }
  if (command.includes('account')) {
    return 'Account';
  }
  return 'Other';
}

// ---------------------------------------------------------------------------
// Receipt Formatter
// ---------------------------------------------------------------------------

/**
 * Print the telemetry receipt to stdout.
 * Designed to be screenshot-friendly for hackathon submissions.
 */
export function printTelemetryReceipt(): void {
  const all = getEntries();
  if (all.length === 0) return;

  const width = 96;
  const divider = '─'.repeat(width);

  console.log('');
  console.log(chalk.cyan('┌' + '─'.repeat(width - 2) + '┐'));
  console.log(chalk.cyan('│') + chalk.cyan.bold(centerText('NANSEN API TELEMETRY', width - 2)) + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Header
  const header =
    padEnd('Endpoint', 42) +
    padEnd('Method', 8) +
    padEnd('Latency', 10) +
    padEnd('Status', 10) +
    padEnd('Cache', 8) +
    padEnd('Role', 16);
  console.log(chalk.cyan('│') + ' ' + chalk.gray(header) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.gray(divider.slice(0, width - 4)) + ' ' + chalk.cyan('│'));

  // Entries
  for (const e of all) {
    const endpoint = e.endpoint.length > 40
      ? e.endpoint.slice(0, 37) + '...'
      : e.endpoint;
    const statusColor = e.status === '200' || e.status === 'SUCCESS'
      ? chalk.green
      : e.status === 'ERROR' ? chalk.red : chalk.yellow;
    const cacheColor = e.cache === 'HIT' ? chalk.green : chalk.gray;
    const latencyColor = e.latency_ms > 500 ? chalk.yellow : chalk.white;

    const row =
      padEnd(endpoint, 42) +
      padEnd(e.method, 8) +
      latencyColor(padEnd(`${e.latency_ms}ms`, 10)) +
      statusColor(padEnd(e.status, 10)) +
      cacheColor(padEnd(e.cache, 8)) +
      padEnd(e.role, 16);
    console.log(chalk.cyan('│') + ' ' + row + chalk.cyan('│'));
  }

  // Summary
  const totalCalls = all.length;
  const avgLatency = Math.round(all.reduce((sum, e) => sum + e.latency_ms, 0) / totalCalls);
  const errorCount = all.filter(e => e.status === 'ERROR').length;
  const cacheHits = all.filter(e => e.cache === 'HIT').length;
  const verificationStatus = totalCalls >= 10 ? '✅' : '⚠️';

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  const summaryLine =
    `TOTAL: ${chalk.white.bold(String(totalCalls))} calls` +
    `  |  AVG LATENCY: ${chalk.white(avgLatency + 'ms')}` +
    `  |  CACHE HITS: ${chalk.green(String(cacheHits))}` +
    `  |  ERRORS: ${errorCount > 0 ? chalk.red(String(errorCount)) : chalk.green('0')}` +
    `  |  10+ CALLS: ${verificationStatus}`;

  // Strip ANSI for measuring, then pad with spaces
  // eslint-disable-next-line no-control-regex
  const rawSummary = summaryLine.replace(/\x1b\[[0-9;]*m/g, '');
  const summaryPadding = Math.max(0, width - 4 - rawSummary.length);
  console.log(chalk.cyan('│') + ' ' + summaryLine + ' '.repeat(summaryPadding) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('└' + '─'.repeat(width - 2) + '┘'));
  console.log('');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padEnd(str: string, length: number): string {
  return str.padEnd(length);
}

function centerText(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text + ' '.repeat(width - pad - text.length);
}
