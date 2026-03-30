import { vi, describe, it, expect, beforeEach } from 'vitest';
import { addressCommand } from '../src/commands/address.js';
import * as nansen from '../src/lib/nansen.js';

vi.mock('../src/lib/nansen.js', () => ({
  fetchPnlByAddress: vi.fn(),
  fetchTradesByAddress: vi.fn(),
  fetchPnlSummary: vi.fn(),
  fetchProfilerLabels: vi.fn(),
  getApiCallCount: vi.fn().mockReturnValue(1),
}));

vi.mock('ora', () => {
  return {
    default: vi.fn(() => ({
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      warn: vi.fn().mockReturnThis(),
      info: vi.fn().mockReturnThis()
    }))
  };
});

describe('Address Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAddress = '0x123';

  it('runs successful address analysis flow with all data', async () => {
    vi.mocked(nansen.fetchProfilerLabels).mockResolvedValue({
      success: true,
      data: [{ label: 'Smart Money' }]
    });
    vi.mocked(nansen.fetchPnlSummary).mockResolvedValue({
      success: true,
      data: { total_realized_pnl_usd: 1000, total_unrealized_pnl_usd: 500, win_rate: 0.6 }
    });
    vi.mocked(nansen.fetchPnlByAddress).mockResolvedValue({
      success: true,
      data: [{ market_id: 'm1', question: 'Will X?', total_pnl_usd: 100, position: 'YES' }]
    });
    vi.mocked(nansen.fetchTradesByAddress).mockResolvedValue({
      success: true,
      data: [{ side: 'BUY', outcome: 'YES', value_usd: 500, timestamp: '2023-01-01' }]
    });

    await addressCommand(mockAddress);

    expect(nansen.fetchProfilerLabels).toHaveBeenCalledWith(mockAddress);
    expect(nansen.fetchPnlSummary).toHaveBeenCalledWith(mockAddress);
    expect(nansen.fetchPnlByAddress).toHaveBeenCalledWith(mockAddress);
    expect(nansen.fetchTradesByAddress).toHaveBeenCalledWith(mockAddress, 10);
  });

  it('handles missing data gracefully', async () => {
    vi.mocked(nansen.fetchProfilerLabels).mockResolvedValue({ success: false });
    vi.mocked(nansen.fetchPnlSummary).mockResolvedValue({ success: false });
    vi.mocked(nansen.fetchPnlByAddress).mockResolvedValue({ success: false });
    vi.mocked(nansen.fetchTradesByAddress).mockResolvedValue({ success: false });

    await addressCommand(mockAddress);
    
    expect(nansen.fetchProfilerLabels).toHaveBeenCalledWith(mockAddress);
    expect(nansen.fetchPnlSummary).toHaveBeenCalledWith(mockAddress);
  });

  it('handles empty data gracefully', async () => {
    vi.mocked(nansen.fetchProfilerLabels).mockResolvedValue({ success: true, data: [] });
    vi.mocked(nansen.fetchPnlSummary).mockResolvedValue({ success: true, data: {} });
    vi.mocked(nansen.fetchPnlByAddress).mockResolvedValue({ success: true, data: [] });
    vi.mocked(nansen.fetchTradesByAddress).mockResolvedValue({ success: true, data: [] });

    await addressCommand(mockAddress);
    expect(nansen.fetchProfilerLabels).toHaveBeenCalledWith(mockAddress);
  });

  it('handles API failure gently', async () => {
    vi.mocked(nansen.fetchProfilerLabels).mockRejectedValue(new Error('Network drop'));

    await addressCommand(mockAddress);
    
    expect(nansen.fetchProfilerLabels).toHaveBeenCalledWith(mockAddress);
    expect(nansen.fetchPnlSummary).not.toHaveBeenCalled();
  });
});
