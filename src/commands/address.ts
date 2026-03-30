import ora from 'ora';
import chalk from 'chalk';
import {
  fetchPnlByAddress,
  fetchTradesByAddress,
  fetchPnlSummary,
  fetchProfilerLabels,
} from '../lib/nansen.js';
import { formatCurrency, formatPercent } from '../lib/formatter.js';

export async function addressCommand(address: string) {
  console.log(chalk.cyan(`\n🔮 Nansen Polymarket Oracle — Address Analysis`));
  console.log(chalk.gray(`Target: ${address}\n`));

  const spinner = ora('Fetching address profile and labels from Nansen...').start();

  try {
    // 1. Fetch labels
    const labelsRes = await fetchProfilerLabels(address);
    // 2. Fetch general Pnl Summary
    spinner.text = 'Fetching generic wallet PnL summary...';
    const summaryRes = await fetchPnlSummary(address);
    // 3. Fetch Prediction Market specific PNL
    spinner.text = 'Fetching prediction market PnL history...';
    const pmPnlRes = await fetchPnlByAddress(address);
    // 4. Fetch recent trades
    spinner.text = 'Fetching recent prediction market trades...';
    const tradesRes = await fetchTradesByAddress(address, 10);

    spinner.stop();

    // --- RENDER LABELS ---
    if (labelsRes.success && labelsRes.data && (labelsRes.data as any[]).length > 0) {
      const labels = (labelsRes.data as any[]).map((l: any) => l.label || l.name || String(l)).join(', ');
      console.log(`${chalk.bold('Labels:')} ${chalk.green(labels)}`);
    } else {
      console.log(`${chalk.bold('Labels:')} ${chalk.gray('None / Unclassified')}`);
    }

    // --- RENDER OVERALL SUMMARY ---
    if (summaryRes.success && summaryRes.data) {
      const data = summaryRes.data as any;
      console.log(`\n${chalk.bold.underline('Overall Wallet PnL (All Chains)')}`);
      console.log(`Realized PnL:   ${formatCurrency(data.total_realized_pnl_usd || 0)}`);
      console.log(`Unrealized PnL: ${formatCurrency(data.total_unrealized_pnl_usd || 0)}`);
      if (data.win_rate !== undefined) {
        console.log(`Win Rate:       ${formatPercent(data.win_rate)}`);
      }
      console.log(`Best Trade:     ${formatCurrency(data.best_trade_usd || 0)}`);
      console.log(`Worst Trade:    ${formatCurrency(data.worst_trade_usd || 0)}`);
    }

    // --- RENDER PM PNL ---
    console.log(`\n${chalk.bold.underline('Top Prediction Market Positions')}`);
    if (pmPnlRes.success && pmPnlRes.data && Array.isArray(pmPnlRes.data)) {
      const positions = pmPnlRes.data as any[];
      if (positions.length === 0) {
        console.log(chalk.gray('  No active or historical prediction market positions found.'));
      } else {
        positions.slice(0, 5).forEach((p: any) => {
          const color = p.total_pnl_usd >= 0 ? chalk.green : chalk.red;
          console.log(`  ${chalk.bold(p.question || p.market_id)}`);
          console.log(`    Position: ${p.position || 'Unknown'} | PnL: ${color(formatCurrency(p.total_pnl_usd))}`);
        });
      }
    } else {
      console.log(chalk.gray('  Could not load prediction market PnL.'));
    }

    // --- RENDER TRADES ---
    console.log(`\n${chalk.bold.underline('Recent Prediction Market Trades')}`);
    if (tradesRes.success && tradesRes.data && Array.isArray(tradesRes.data)) {
      const trades = tradesRes.data as any[];
      if (trades.length === 0) {
        console.log(chalk.gray('  No recent trades.'));
      } else {
        trades.slice(0, 10).forEach((t: any) => {
          const sideColor = t.side?.toUpperCase() === 'BUY' ? chalk.green : chalk.red;
          const date = t.timestamp ? new Date(t.timestamp).toLocaleDateString() : 'Unknown Date';
          console.log(`  ${sideColor(t.side)} ${t.outcome} — ${formatCurrency(t.value_usd)} @ ${date}`);
        });
      }
    } else {
      console.log(chalk.gray('  Could not load recent trades.'));
    }

    console.log();
  } catch (err: any) {
    spinner.fail('Failed to analyze address');
    console.error(chalk.red(err.message || String(err)));
  }
}
