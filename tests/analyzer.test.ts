/**
 * Unit tests for the divergence score algorithm.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDivergence,
  classifyDivergence,
  divergenceEmoji,
  analyzeMarket,
  sortByDivergence,
  filterAlerts,
  buildSmLeaderboard,
} from '../src/lib/analyzer.js';
import type { SmartMoneyHolder } from '../src/types/smartmoney.js';
import type { PredictionMarket } from '../src/types/market.js';

// ─── Helpers ───

function makeHolder(opts: {
  position: 'YES' | 'NO';
  value_usd: number;
  address?: string;
}): SmartMoneyHolder {
  return {
    address: opts.address || `0x${Math.random().toString(16).slice(2, 42)}`,
    labels: [{ label: 'Fund' }],
    position: opts.position,
    shares: opts.value_usd / 0.5,
    value_usd: opts.value_usd,
    label_summary: 'Fund',
    is_smart_money: true,
  };
}

function makeMarket(overrides?: Partial<PredictionMarket>): PredictionMarket {
  return {
    market_id: 'test_market',
    question: 'Test Market?',
    yes_price: 0.5,
    volume_usd: 1_000_000,
    ...overrides,
  };
}

// ─── Tests ───

describe('calculateDivergence', () => {
  it('returns 0 when no SM holders', () => {
    expect(calculateDivergence(0.5, [])).toBe(0);
  });

  it('returns 0 when total SM capital is 0', () => {
    const holders = [
      makeHolder({ position: 'YES', value_usd: 0 }),
      makeHolder({ position: 'NO', value_usd: 0 }),
    ];
    expect(calculateDivergence(0.5, holders)).toBe(0);
  });

  it('returns positive when SM is more bullish than market', () => {
    // Market says 20% YES, but SM is 100% YES
    const holders = [
      makeHolder({ position: 'YES', value_usd: 100_000 }),
      makeHolder({ position: 'YES', value_usd: 100_000 }),
    ];
    const score = calculateDivergence(0.2, holders);
    expect(score).toBeGreaterThan(0);
    expect(score).toBe(80); // smOdds=1.0, divergence = (1.0-0.2)*100 = 80
  });

  it('returns negative when SM is more bearish than market', () => {
    // Market says 80% YES, but SM is 100% NO
    const holders = [
      makeHolder({ position: 'NO', value_usd: 100_000 }),
      makeHolder({ position: 'NO', value_usd: 100_000 }),
    ];
    const score = calculateDivergence(0.8, holders);
    expect(score).toBeLessThan(0);
    expect(score).toBe(-80); // smOdds=0.0, divergence = (0.0-0.8)*100 = -80
  });

  it('returns 0 when SM and market perfectly agree', () => {
    // Market says 50%, SM is split 50/50 by capital
    const holders = [
      makeHolder({ position: 'YES', value_usd: 100_000 }),
      makeHolder({ position: 'NO', value_usd: 100_000 }),
    ];
    const score = calculateDivergence(0.5, holders);
    expect(score).toBe(0);
  });

  it('capital-weights the conviction', () => {
    // Market at 30%, SM: small NO + big YES → should lean bullish
    const holders = [
      makeHolder({ position: 'NO', value_usd: 10_000 }),    // small bear
      makeHolder({ position: 'YES', value_usd: 500_000 }),  // huge bull
    ];
    const score = calculateDivergence(0.3, holders);
    expect(score).toBeGreaterThan(0);
  });
});

describe('classifyDivergence', () => {
  it('classifies EXTREME at ≥40', () => {
    expect(classifyDivergence(45)).toBe('EXTREME');
    expect(classifyDivergence(-50)).toBe('EXTREME');
  });

  it('classifies HIGH at 30-39', () => {
    expect(classifyDivergence(35)).toBe('HIGH');
    expect(classifyDivergence(-32)).toBe('HIGH');
  });

  it('classifies MODERATE at 15-29', () => {
    expect(classifyDivergence(20)).toBe('MODERATE');
    expect(classifyDivergence(-15)).toBe('MODERATE');
  });

  it('classifies LOW at 5-14', () => {
    expect(classifyDivergence(8)).toBe('LOW');
    expect(classifyDivergence(-12)).toBe('LOW');
  });

  it('classifies ALIGNED at <5', () => {
    expect(classifyDivergence(3)).toBe('ALIGNED');
    expect(classifyDivergence(0)).toBe('ALIGNED');
    expect(classifyDivergence(-2)).toBe('ALIGNED');
  });
});

describe('divergenceEmoji', () => {
  it('returns the correct emoji for each level', () => {
    expect(divergenceEmoji('EXTREME')).toBe('🔥');
    expect(divergenceEmoji('HIGH')).toBe('⚠️');
    expect(divergenceEmoji('MODERATE')).toBe('📊');
    expect(divergenceEmoji('LOW')).toBe('✅');
    expect(divergenceEmoji('ALIGNED')).toBe('🤝');
  });
});

describe('analyzeMarket', () => {
  it('produces a complete MarketAnalysis', () => {
    const market = makeMarket({ yes_price: 0.3 });
    const holders = [
      makeHolder({ position: 'YES', value_usd: 100_000 }),
      makeHolder({ position: 'YES', value_usd: 50_000 }),
      makeHolder({ position: 'NO', value_usd: 30_000 }),
    ];

    const result = analyzeMarket(market, holders, 50);

    expect(result.market).toBe(market);
    expect(result.divergence_score).toBeTypeOf('number');
    expect(result.divergence_level).toBeTypeOf('string');
    expect(result.sm_yes_ratio).toBeCloseTo(2 / 3, 1);
    expect(result.sm_total_capital_usd).toBe(180_000);
    expect(result.sm_holder_count).toBe(3);
    expect(result.total_holders_scanned).toBe(50);
    expect(result.analyzed_at).toBeTruthy();
  });
});

describe('sortByDivergence', () => {
  it('sorts by absolute divergence descending', () => {
    const a1 = analyzeMarket(makeMarket({ yes_price: 0.5 }), [], 10);  // score=0
    const a2 = analyzeMarket(
      makeMarket({ yes_price: 0.1 }),
      [makeHolder({ position: 'YES', value_usd: 100_000 })],
      10,
    ); // high positive
    const a3 = analyzeMarket(
      makeMarket({ yes_price: 0.9 }),
      [makeHolder({ position: 'NO', value_usd: 100_000 })],
      10,
    ); // high negative

    const sorted = sortByDivergence([a1, a2, a3]);
    expect(Math.abs(sorted[0].divergence_score)).toBeGreaterThanOrEqual(
      Math.abs(sorted[1].divergence_score),
    );
    expect(Math.abs(sorted[1].divergence_score)).toBeGreaterThanOrEqual(
      Math.abs(sorted[2].divergence_score),
    );
  });
});

describe('filterAlerts', () => {
  it('filters by threshold', () => {
    const analyses = [
      analyzeMarket(
        makeMarket({ yes_price: 0.1 }),
        [makeHolder({ position: 'YES', value_usd: 100_000 })],
        10,
      ),
      analyzeMarket(makeMarket({ yes_price: 0.5 }), [], 10),
    ];

    const alerts = filterAlerts(analyses, 30);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    for (const a of alerts) {
      expect(Math.abs(a.divergence_score)).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('buildSmLeaderboard', () => {
  it('aggregates SM appearances across markets', () => {
    const addr = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const holder1 = makeHolder({ position: 'YES', value_usd: 100_000, address: addr });
    const holder2 = makeHolder({ position: 'NO', value_usd: 50_000, address: addr });

    const analyses = [
      analyzeMarket(makeMarket({ market_id: 'm1', yes_price: 0.3 }), [holder1], 10),
      analyzeMarket(makeMarket({ market_id: 'm2', yes_price: 0.7 }), [holder2], 10),
    ];

    const leaderboard = buildSmLeaderboard(analyses);
    const entry = leaderboard.find(e => e.address === addr);

    expect(entry).toBeDefined();
    expect(entry!.markets_active).toBe(2);
    expect(entry!.total_capital_usd).toBe(150_000);
  });
});
