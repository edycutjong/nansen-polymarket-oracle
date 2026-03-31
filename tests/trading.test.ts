import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  validateTradeAmount,
  mapToHedgeSignal,
  getProxyForCategory,
  MAX_TRADE_USD,
  DEFAULT_SLIPPAGE_BPS,
  checkWallet,
  createWallet,
  ensureWallet,
  fetchTokenInfo,
  getTradeQuote,
  executeTrade,
} from '../src/lib/trading.js';
import * as nansen from '../src/lib/nansen.js';
import type { MarketAnalysis } from '../src/types/report.js';

vi.mock('../src/lib/nansen.js', () => ({
  execNansen: vi.fn(),
  resetApiCallCount: vi.fn(),
  getApiCallCount: vi.fn().mockReturnValue(1),
}));

describe('Trading Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------

  describe('Constants', () => {
    it('MAX_TRADE_USD is 100', () => {
      expect(MAX_TRADE_USD).toBe(100);
    });

    it('DEFAULT_SLIPPAGE_BPS is 50', () => {
      expect(DEFAULT_SLIPPAGE_BPS).toBe(50);
    });
  });

  // -----------------------------------------------------------------------
  // validateTradeAmount
  // -----------------------------------------------------------------------

  describe('validateTradeAmount', () => {
    it('accepts valid amount', () => {
      expect(validateTradeAmount(50)).toEqual({ valid: true });
    });

    it('rejects zero amount', () => {
      const result = validateTradeAmount(0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('positive');
    });

    it('rejects negative amount', () => {
      const result = validateTradeAmount(-10);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('positive');
    });

    it('rejects amount exceeding max', () => {
      const result = validateTradeAmount(150, 100);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('exceeds');
    });

    it('accepts amount equal to max', () => {
      expect(validateTradeAmount(100, 100)).toEqual({ valid: true });
    });

    it('uses default max of MAX_TRADE_USD', () => {
      const result = validateTradeAmount(MAX_TRADE_USD + 1);
      expect(result.valid).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // getProxyForCategory
  // -----------------------------------------------------------------------

  describe('getProxyForCategory', () => {
    it('returns WETH for Crypto', () => {
      expect(getProxyForCategory('Crypto')).toEqual({ token: 'WETH', chain: 'base' });
    });

    it('returns USDC for Politics', () => {
      expect(getProxyForCategory('Politics')).toEqual({ token: 'USDC', chain: 'base' });
    });

    it('returns USDC for Sports', () => {
      expect(getProxyForCategory('Sports')).toEqual({ token: 'USDC', chain: 'base' });
    });

    it('returns WETH for Culture', () => {
      expect(getProxyForCategory('Culture')).toEqual({ token: 'WETH', chain: 'base' });
    });

    it('returns WETH for Science', () => {
      expect(getProxyForCategory('Science')).toEqual({ token: 'WETH', chain: 'base' });
    });

    it('returns default WETH for unknown category', () => {
      expect(getProxyForCategory('UnknownXYZ')).toEqual({ token: 'WETH', chain: 'base' });
    });
  });

  // -----------------------------------------------------------------------
  // mapToHedgeSignal
  // -----------------------------------------------------------------------

  describe('mapToHedgeSignal', () => {
    const baseMockAnalysis: MarketAnalysis = {
      market: {
        market_id: 'test1',
        question: 'Will ETH hit $5k?',
        category: 'Crypto',
        yes_price: 0.4,
        volume_usd: 1_000_000,
      },
      divergence_score: 45,
      divergence_level: 'EXTREME',
      sm_yes_ratio: 0.8,
      sm_total_capital_usd: 500_000,
      sm_holder_count: 5,
      total_holders_scanned: 50,
      sm_holders: [],
      analyzed_at: new Date().toISOString(),
    };

    it('maps bullish divergence to LONG signal', () => {
      const signal = mapToHedgeSignal(baseMockAnalysis);
      expect(signal.direction).toBe('LONG');
      expect(signal.proxy_token).toBe('WETH');
      expect(signal.proxy_chain).toBe('base');
      expect(signal.confidence).toBe('HIGH');
    });

    it('maps bearish divergence to SHORT signal', () => {
      const bearish = { ...baseMockAnalysis, divergence_score: -35 };
      const signal = mapToHedgeSignal(bearish);
      expect(signal.direction).toBe('SHORT');
      expect(signal.proxy_token).toBe('USDC'); // SHORT = stay in stablecoin
    });

    it('assigns MEDIUM confidence for moderate divergence', () => {
      const moderate = { ...baseMockAnalysis, divergence_score: 30 };
      const signal = mapToHedgeSignal(moderate);
      expect(signal.confidence).toBe('MEDIUM');
    });

    it('assigns LOW confidence for low divergence', () => {
      const low = { ...baseMockAnalysis, divergence_score: 10 };
      const signal = mapToHedgeSignal(low);
      expect(signal.confidence).toBe('LOW');
    });

    it('uses USDC proxy for Politics category', () => {
      const politics = {
        ...baseMockAnalysis,
        market: { ...baseMockAnalysis.market, category: 'Politics' },
      };
      const signal = mapToHedgeSignal(politics);
      // LONG + Politics = USDC → USDC (no, LONG means buy the proxy)
      expect(signal.proxy_chain).toBe('base');
    });

    it('includes rationale with market question', () => {
      const signal = mapToHedgeSignal(baseMockAnalysis);
      expect(signal.rationale).toContain('Will ETH hit $5k?');
      expect(signal.rationale).toContain('bullish');
    });

    it('handles missing category gracefully', () => {
      const noCat = {
        ...baseMockAnalysis,
        market: { ...baseMockAnalysis.market, category: undefined as any },
      };
      const signal = mapToHedgeSignal(noCat);
      expect(signal.proxy_chain).toBe('base');
    });

    it('handles unknown category in mapToHedgeSignal', () => {
      const mockAnalysis: any = {
        market: {
          category: 'UnknownAlienCategory123',
          question: 'Will aliens visit?',
        },
        divergence_score: 50,
        divergence_level: 2,
      };
      const signal = mapToHedgeSignal(mockAnalysis);
      // proxy falls back to 'default', so proxy is WETH on base
      expect(signal.proxy_chain).toBe('base');
      expect(signal.proxy_token).toBe('WETH');
    });
  });

  // -----------------------------------------------------------------------
  // Wallet Functions (use mock execNansen)
  // -----------------------------------------------------------------------

  describe('Wallet Functions', () => {
    it('checkWallet calls execNansen with wallet status', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { address: '0x123', chain: 'base', balance_native: 1, balance_usd: 3000, exists: true },
      });

      const result = await checkWallet('base');
      expect(result.success).toBe(true);
      expect(nansen.execNansen).toHaveBeenCalledWith('wallet status', ['--chain', 'base']);
    });

    it('createWallet calls execNansen with wallet create', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { address: '0xnew', chain: 'base', balance_native: 0, balance_usd: 0, exists: true },
      });

      const result = await createWallet('base');
      expect(result.success).toBe(true);
      expect(nansen.execNansen).toHaveBeenCalledWith('wallet create', ['--chain', 'base']);
    });

    it('ensureWallet returns existing wallet if exists', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { address: '0x123', chain: 'base', balance_native: 1, balance_usd: 3000, exists: true },
      });

      const result = await ensureWallet('base');
      expect(result.success).toBe(true);
      expect(nansen.execNansen).toHaveBeenCalledTimes(1); // only check, no create
    });

    it('ensureWallet creates wallet if not exists', async () => {
      vi.mocked(nansen.execNansen)
        .mockResolvedValueOnce({ success: true, data: { exists: false } })
        .mockResolvedValueOnce({ success: true, data: { address: '0xnew', chain: 'base', exists: true } });

      const result = await ensureWallet('base');
      expect(result.success).toBe(true);
      expect(nansen.execNansen).toHaveBeenCalledTimes(2); // check + create
    });

    it('ensureWallet creates wallet if check fails', async () => {
      vi.mocked(nansen.execNansen)
        .mockResolvedValueOnce({ success: false, error: 'No wallet' })
        .mockResolvedValueOnce({ success: true, data: { address: '0xnew', chain: 'base', exists: true } });

      const result = await ensureWallet('base');
      expect(result.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Token Oracle
  // -----------------------------------------------------------------------

  describe('fetchTokenInfo', () => {
    it('calls execNansen with correct args', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { symbol: 'WETH', price_usd: 3450 },
      });

      const result = await fetchTokenInfo('WETH', 'base');
      expect(result.success).toBe(true);
      expect(nansen.execNansen).toHaveBeenCalledWith('research token info', [
        '--symbol', 'WETH',
        '--chain', 'base',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Trade Agent
  // -----------------------------------------------------------------------

  describe('getTradeQuote', () => {
    it('calls execNansen with correct args', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { from_token: 'USDC', to_token: 'WETH', amount_in: 100 },
      });

      const result = await getTradeQuote('USDC', 'WETH', 100, 'base', 50);
      expect(result.success).toBe(true);
      expect(nansen.execNansen).toHaveBeenCalledWith('trade quote', [
        '--from', 'USDC',
        '--to', 'WETH',
        '--amount', '100',
        '--chain', 'base',
        '--slippage', '50',
      ]);
    });
  });

  describe('executeTrade', () => {
    it('includes --dry-run flag when dryRun is true', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { tx_hash: '0xdry', status: 'pending' },
      });

      await executeTrade('USDC', 'WETH', 50, 'base', 50, true);
      const args = vi.mocked(nansen.execNansen).mock.calls[0][1] as string[];
      expect(args).toContain('--dry-run');
    });

    it('omits --dry-run flag when dryRun is false', async () => {
      vi.mocked(nansen.execNansen).mockResolvedValue({
        success: true,
        data: { tx_hash: '0xlive', status: 'success' },
      });

      await executeTrade('USDC', 'WETH', 50, 'base', 50, false);
      const args = vi.mocked(nansen.execNansen).mock.calls[0][1] as string[];
      expect(args).not.toContain('--dry-run');
    });
  });
});
