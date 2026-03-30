import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printScanTable, printMarketDetail, generateMarkdownReport } from '../src/lib/formatter.js';
import type { MarketAnalysis, OracleReport } from '../src/types/report.js';
import type { SmartMoneyHolder } from '../src/types/smartmoney.js';

describe('Formatter', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const mockHolder: SmartMoneyHolder = {
    address: '0x1234567890123456789012345678901234567890',
    position: 'YES',
    value_usd: 1500000, // tests >= 1M
    shares: 3000000,
    labels: [{ label: 'Fund' }],
    label_summary: 'Fund',
    is_smart_money: true,
  };

  const mockAnalysis: MarketAnalysis = {
    market: {
      market_id: 'm1',
      question: 'Will something happen that is a very very very long question that gets truncated?',
      yes_price: 0.8,
      volume_usd: 50000, // tests >= 1K
      category: 'Crypto',
    },
    divergence_score: 50,
    divergence_level: 'EXTREME',
    sm_total_capital_usd: 500, // tests < 1K
    sm_yes_ratio: 0.1,
    sm_holder_count: 1,
    total_holders_scanned: 10,
    analyzed_at: new Date(1700000000000).toISOString(),
    sm_holders: Array.from({ length: 15 }, (_, i) => ({
      ...mockHolder,
      address: `0x${i.toString().padStart(40, '0')}`,
    })),
  };

  it('printScanTable prints correctly', () => {
    printScanTable([mockAnalysis]);
    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(calls).toContain('Will something happen that is a ver...');
    expect(calls).toContain('80% YES');
    expect(calls).toContain('EXTREME');
    expect(calls).toContain('$500'); // usd format < 1k
  });

  it('printMarketDetail prints correctly', () => {
    printMarketDetail({
      ...mockAnalysis,
      market: { ...mockAnalysis.market, category: undefined }
    });
    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(calls).toContain('Market Odds');
    expect(calls).toContain('SM Capital Deployed');
    expect(calls).toContain('1 of 10 holders');
    expect(calls).toContain('N/A'); // category missing
    expect(calls).toContain('0x0000...0000'); // truncAddr
    expect(calls).toContain('... and 5 more'); // 15 holders -> limits to 10
  });

  it('generateMarkdownReport works with alerts and leaderboard', () => {
    const report: OracleReport = {
      generated_at: new Date(1700000000000).toISOString(),
      total_markets_scanned: 1,
      total_api_calls: 1,
      alerts: [mockAnalysis],
      analyses: [
        {
          ...mockAnalysis,
          divergence_level: 'MODERATE',
          divergence_score: -20,
        },
        {
          ...mockAnalysis,
          divergence_level: 'LOW',
          divergence_score: 5,
        }
      ],
      sm_leaderboard: [
        {
          address: '0x123',
          label_summary: 'Fund, Smart Trader',
          markets_active: 5,
          total_capital_usd: 2500000, // tests M format
          avg_divergence: 20
        }
      ]
    };

    const md = generateMarkdownReport(report);
    expect(md).toContain('# 🔮 Nansen Polymarket Oracle Report');
    expect(md).toContain('## 🚨 High Divergence Alerts');
    expect(md).toContain('**+50 pts (EXTREME)**');
    // wait I'll just check if the string is generated.
    expect(md).toContain('1. "Will something happen that is a very very very long question that gets truncated?"');
    expect(md).toContain('| Will something happen that is a ... | 80% YES | 10% YES | 📊 -20 | $50.0K |');
    expect(md).toContain('## 🏦 Smart Money Leaderboard');
    expect(md).toContain('| 1 | 0x123 | Fund, Smart Trader | 5 | $2.5M |');
  });

  it('generateMarkdownReport works with no alerts and no leaderboard', () => {
    const report: OracleReport = {
      generated_at: new Date(1700000000000).toISOString(),
      total_markets_scanned: 0,
      total_api_calls: 0,
      alerts: [],
      analyses: [],
      sm_leaderboard: []
    };
    const md = generateMarkdownReport(report);
    expect(md).not.toContain('## 🚨 High Divergence Alerts');
    expect(md).not.toContain('## 🏦 Smart Money Leaderboard');
    expect(md).toContain('## 📊 Market Overview');
  });

  it('generateMarkdownReport with positive divergence handles text correctly', () => {
     // A positive divergence means SM is MORE bullish than the market
      const md = generateMarkdownReport({
      generated_at: new Date(1700000000000).toISOString(),
      total_markets_scanned: 1,
      total_api_calls: 1,
      alerts: [{...mockAnalysis, divergence_score: 50}],
      analyses: [],
      sm_leaderboard: []
    });
    expect(md).toContain('bullish');
  });

  it('generateMarkdownReport with negative divergence handles text correctly', () => {
      const topHolder = {...mockHolder};
      const md = generateMarkdownReport({
      generated_at: new Date(1700000000000).toISOString(),
      total_markets_scanned: 1,
      total_api_calls: 1,
      alerts: [{...mockAnalysis, divergence_score: -50, sm_holders: [topHolder]}],
      analyses: [],
      sm_leaderboard: []
    });
    expect(md).toContain('bearish');
    expect(md).toContain('Top SM Holder');
  });

  it('printScanTable and generateMarkdownReport short question', () => {
    const shortAnalysis = { ...mockAnalysis, market: { ...mockAnalysis.market, question: 'Short?' } };
    printScanTable([shortAnalysis]);
    const md = generateMarkdownReport({
      generated_at: new Date(1700000000000).toISOString(),
      total_markets_scanned: 1,
      total_api_calls: 1,
      alerts: [],
      analyses: [shortAnalysis],
      sm_leaderboard: []
    });
    expect(md).toContain('Short?');
  });
});
