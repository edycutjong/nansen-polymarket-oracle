import { vi, describe, it, expect, beforeEach } from 'vitest';
import { reportCommand } from '../src/commands/report.js';
import * as scan from '../src/commands/scan.js';
import * as analyzer from '../src/lib/analyzer.js';
import * as formatter from '../src/lib/formatter.js';
import * as nansen from '../src/lib/nansen.js';
import * as fs from 'node:fs';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('../src/commands/scan.js', () => ({
  scanCommand: vi.fn(),
}));

vi.mock('../src/lib/analyzer.js', () => ({
  sortByDivergence: vi.fn(),
  filterAlerts: vi.fn(),
  buildSmLeaderboard: vi.fn(),
}));

vi.mock('../src/lib/formatter.js', () => ({
  generateMarkdownReport: vi.fn(),
  printScanTable: vi.fn(),
}));

vi.mock('../src/lib/nansen.js', () => ({
  getApiCallCount: vi.fn().mockReturnValue(5),
}));

describe('Report Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAnalyses = [
    {
      market: { market_id: 'm1' } as any,
      sm_holders: [],
      divergence_score: 1.5,
    }
  ];

  it('exits early if scanCommand returns empty', async () => {
    vi.mocked(scan.scanCommand).mockResolvedValue([]);

    await reportCommand({});

    expect(scan.scanCommand).toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(formatter.generateMarkdownReport).not.toHaveBeenCalled();
  });

  it('generates markdown report by default', async () => {
    vi.mocked(scan.scanCommand).mockResolvedValue(mockAnalyses);
    vi.mocked(analyzer.sortByDivergence).mockReturnValue(mockAnalyses);
    vi.mocked(analyzer.filterAlerts).mockReturnValue([]);
    vi.mocked(analyzer.buildSmLeaderboard).mockReturnValue([]);
    vi.mocked(formatter.generateMarkdownReport).mockReturnValue('# Test Report');

    await reportCommand({ output: 'test.md' });

    expect(scan.scanCommand).toHaveBeenCalled();
    expect(analyzer.sortByDivergence).toHaveBeenCalledWith(mockAnalyses);
    expect(formatter.generateMarkdownReport).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith('test.md', '# Test Report');
  });

  it('generates json report when format is json', async () => {
    vi.mocked(scan.scanCommand).mockResolvedValue(mockAnalyses);
    vi.mocked(analyzer.sortByDivergence).mockReturnValue(mockAnalyses);
    vi.mocked(analyzer.filterAlerts).mockReturnValue([]);
    vi.mocked(analyzer.buildSmLeaderboard).mockReturnValue([]);

    await reportCommand({ format: 'json', output: 'test.json' });

    expect(scan.scanCommand).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // Check what was written
    const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
    expect(callArgs[0]).toBe('test.json');
    expect(typeof callArgs[1]).toBe('string');
    const parsed = JSON.parse(callArgs[1] as string);
    expect(parsed.total_markets_scanned).toBe(1);
    expect(parsed.total_api_calls).toBe(5);
  });

  it('prints table when format is table', async () => {
    vi.mocked(scan.scanCommand).mockResolvedValue(mockAnalyses);
    vi.mocked(analyzer.sortByDivergence).mockReturnValue(mockAnalyses);
    vi.mocked(analyzer.filterAlerts).mockReturnValue([]);
    vi.mocked(analyzer.buildSmLeaderboard).mockReturnValue([]);

    await reportCommand({ format: 'table' });

    expect(scan.scanCommand).toHaveBeenCalled();
    expect(formatter.printScanTable).toHaveBeenCalledWith(mockAnalyses);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
  
  it('default output path formats', async () => {
    vi.mocked(scan.scanCommand).mockResolvedValue(mockAnalyses);
    vi.mocked(analyzer.sortByDivergence).mockReturnValue(mockAnalyses);
    vi.mocked(analyzer.filterAlerts).mockReturnValue([]);
    vi.mocked(analyzer.buildSmLeaderboard).mockReturnValue([]);
    vi.mocked(formatter.generateMarkdownReport).mockReturnValue('# Test Report');

    // Default MD
    await reportCommand({});
    expect(vi.mocked(fs.writeFileSync).mock.calls[0][0]).toMatch(/oracle-report-\d+\.md/);
    
    // JSON
    await reportCommand({ format: 'json' });
    expect(vi.mocked(fs.writeFileSync).mock.calls[1][0]).toMatch(/oracle-report-\d+\.json/);
  });
});
