/**
 * Replay Mode — serves real recorded API responses from nansen-record.log.
 *
 * When NANSEN_REPLAY=true, the CLI returns actual data captured from a previous
 * live session instead of hitting the API or generating synthetic data.
 *
 * This gives demos with real market names, real holder addresses, and real
 * position sizes — all without burning any API credits.
 *
 * The log format is:
 *   // Command: research prediction-market market-screener --limit 20
 *   { "success": true, "data": { ... } }
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const IS_REPLAY = process.env.NANSEN_REPLAY === 'true';

interface ReplayEntry {
  command: string;  // full command string e.g. "research prediction-market market-screener --limit 20"
  data: any;        // parsed JSON response
}

let replayCache: ReplayEntry[] | null = null;

/**
 * Parse nansen-record.log into an array of { command, data } entries.
 * Lazily loaded on first call and cached.
 */
function loadReplayData(): ReplayEntry[] {
  if (replayCache) return replayCache;

  const logPath = join(process.cwd(), 'nansen-record.log');
  if (!existsSync(logPath)) {
    console.error('[REPLAY] nansen-record.log not found in', process.cwd());
    replayCache = [];
    return replayCache;
  }

  const raw = readFileSync(logPath, 'utf-8');
  const blocks = raw.split('\n\n// Command: ');
  const entries: ReplayEntry[] = [];

  for (const block of blocks) {
    const trimmed = block.replace(/^\/\/ Command: /, '').trim();
    const newlineIdx = trimmed.indexOf('\n');
    if (newlineIdx === -1) continue;

    const command = trimmed.slice(0, newlineIdx).trim();
    const jsonStr = trimmed.slice(newlineIdx + 1).trim();

    try {
      const parsed = JSON.parse(jsonStr);
      entries.push({ command, data: parsed });
    } catch {
      // Skip malformed blocks
    }
  }

  replayCache = entries;
  return entries;
}

/**
 * Look up a command in the replay log.
 *
 * Matching strategy:
 * 1. Exact match on the full command string
 * 2. If the command has a --market-id, match on that specific arg
 * 3. For screener commands, return the first matching entry
 *
 * @returns The recorded response data, or null if not found
 */
export function getReplayData(command: string, args: string[]): any {
  const entries = loadReplayData();
  const fullCommand = `${command} ${args.join(' ')}`.trim();

  // Try exact match first
  const exact = entries.find((e) => e.command === fullCommand);
  if (exact) {
    // Unwrap pagination wrapper (same as real execNansen)
    const d = exact.data;
    if (d.success && d.data && typeof d.data === 'object' && !Array.isArray(d.data) && 'data' in d.data) {
      return d.data.data;
    }
    return d.data ?? d;
  }

  // Try matching just the base command + key args
  const marketIdIdx = args.indexOf('--market-id');
  if (marketIdIdx !== -1 && args[marketIdIdx + 1]) {
    const marketId = args[marketIdIdx + 1];
    const match = entries.find((e) => e.command.includes(`--market-id ${marketId}`));
    if (match) {
      const d = match.data;
      if (d.success && d.data && typeof d.data === 'object' && !Array.isArray(d.data) && 'data' in d.data) {
        return d.data.data;
      }
      return d.data ?? d;
    }
  }

  // For screener commands, return the first matching screener entry
  if (command.includes('market-screener')) {
    const match = entries.find((e) => e.command.includes('market-screener'));
    if (match) {
      const d = match.data;
      if (d.success && d.data && typeof d.data === 'object' && !Array.isArray(d.data) && 'data' in d.data) {
        return d.data.data;
      }
      return d.data ?? d;
    }
  }

  // For profiler commands, return null (will fall back to known-wallets)
  return null;
}
