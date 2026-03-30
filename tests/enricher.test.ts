/**
 * Unit tests for the SM enrichment logic.
 */

import { describe, it, expect } from 'vitest';
import { isSmartMoney, summarizeLabels, filterSmartMoney } from '../src/lib/enricher.js';
import type { WalletLabel, SmartMoneyHolder } from '../src/types/smartmoney.js';

describe('isSmartMoney', () => {
  it('returns true for Fund label', () => {
    const labels: WalletLabel[] = [{ label: 'Fund', category: 'Smart Money' }];
    expect(isSmartMoney(labels)).toBe(true);
  });

  it('returns true for Smart Trader label', () => {
    const labels: WalletLabel[] = [{ label: 'Smart Trader' }];
    expect(isSmartMoney(labels)).toBe(true);
  });

  it('returns true for 30D/90D/180D Smart Trader', () => {
    expect(isSmartMoney([{ label: '30D Smart Trader' }])).toBe(true);
    expect(isSmartMoney([{ label: '90D Smart Trader' }])).toBe(true);
    expect(isSmartMoney([{ label: '180D Smart Trader' }])).toBe(true);
  });

  it('returns true for Smart HL Perps Trader', () => {
    expect(isSmartMoney([{ label: 'Smart HL Perps Trader' }])).toBe(true);
  });

  it('returns false for non-SM labels', () => {
    expect(isSmartMoney([{ label: 'DEX Trader' }])).toBe(false);
    expect(isSmartMoney([{ label: 'Whale' }])).toBe(false);
    expect(isSmartMoney([{ label: 'NFT Collector' }])).toBe(false);
  });

  it('returns false for empty labels', () => {
    expect(isSmartMoney([])).toBe(false);
  });

  it('returns true if at least one SM label present among mixed', () => {
    const labels: WalletLabel[] = [
      { label: 'DEX Trader' },
      { label: 'Fund', fullname: 'Paradigm' },
      { label: 'Heavy DEX Trader' },
    ];
    expect(isSmartMoney(labels)).toBe(true);
  });
});

describe('summarizeLabels', () => {
  it('returns "Unknown" for empty labels', () => {
    expect(summarizeLabels([])).toBe('Unknown');
  });

  it('returns SM labels when present', () => {
    const labels: WalletLabel[] = [
      { label: 'Fund', fullname: 'Paradigm Capital' },
      { label: 'DEX Trader' },
    ];
    expect(summarizeLabels(labels)).toBe('Paradigm Capital');
  });

  it('returns non-SM labels when no SM found', () => {
    const labels: WalletLabel[] = [
      { label: 'DEX Trader', fullname: 'Active Trader' },
    ];
    expect(summarizeLabels(labels)).toBe('Active Trader');
  });

  it('joins multiple SM labels with comma', () => {
    const labels: WalletLabel[] = [
      { label: 'Fund', fullname: 'a16z' },
      { label: 'Smart Trader', fullname: 'SM Alpha' },
    ];
    expect(summarizeLabels(labels)).toBe('a16z, SM Alpha');
  });

  it('falls back to label when fullname is absent', () => {
    const labels: WalletLabel[] = [{ label: 'Fund' }];
    expect(summarizeLabels(labels)).toBe('Fund');
  });
});

describe('filterSmartMoney', () => {
  it('keeps only SM holders', () => {
    const holders: SmartMoneyHolder[] = [
      {
        address: '0xA', labels: [{ label: 'Fund' }],
        position: 'YES', shares: 1000, value_usd: 50000,
        label_summary: 'Fund', is_smart_money: true,
      },
      {
        address: '0xB', labels: [{ label: 'DEX Trader' }],
        position: 'NO', shares: 500, value_usd: 20000,
        label_summary: 'DEX Trader', is_smart_money: false,
      },
      {
        address: '0xC', labels: [{ label: 'Smart Trader' }],
        position: 'YES', shares: 2000, value_usd: 80000,
        label_summary: 'Smart Trader', is_smart_money: true,
      },
    ];

    const filtered = filterSmartMoney(holders);
    expect(filtered).toHaveLength(2);
    expect(filtered.every(h => h.is_smart_money)).toBe(true);
  });

  it('returns empty for no SM holders', () => {
    const holders: SmartMoneyHolder[] = [
      {
        address: '0xA', labels: [], position: 'YES',
        shares: 100, value_usd: 5000, label_summary: 'Unknown',
        is_smart_money: false,
      },
    ];
    expect(filterSmartMoney(holders)).toHaveLength(0);
  });
});
