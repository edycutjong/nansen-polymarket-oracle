/**
 * Mock data for NANSEN_MOCK=true mode — no API calls, safe for local dev/testing.
 * All response shapes match the actual Nansen CLI prediction-market + profiler schema.
 *
 * Pattern follows NansenTerm/src/lib/mock.ts
 */

// ─── Helpers ───

const randomHex = (len: number) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const fakeEvmAddress = () => `0x${randomHex(40)}`;

// ─── Stable Mock Addresses (so SM hits are predictable) ───

const SM_WALLETS = [
  { address: '0xA1B2C3D4E5F6789012345678901234567890ABCD', label: 'Fund',              fullname: 'Paradigm Capital' },
  { address: '0xB2C3D4E5F67890123456789012345678901ABCDE', label: 'Smart Trader',       fullname: 'SM Trader Alpha' },
  { address: '0xC3D4E5F6789012345678901234567890123BCDEF', label: 'Fund',              fullname: 'Polychain Capital' },
  { address: '0xD4E5F6789012345678901234567890ABCDEF01234', label: '90D Smart Trader',  fullname: '90D Trader Whale' },
  { address: '0xE5F6789012345678901234567890ABCDEF0123456', label: '30D Smart Trader',  fullname: '30D Trader Degen' },
  { address: '0xF67890123456789012345678901234567890ABCDE', label: 'Smart HL Perps Trader', fullname: 'HL Perps King' },
  { address: '0x1234567890ABCDEF1234567890ABCDEF12345678',  label: 'Fund',              fullname: 'a16z Crypto' },
  { address: '0x2345678901ABCDEF2345678901ABCDEF23456789',  label: '180D Smart Trader', fullname: '180D Marathon' },
];

const REGULAR_WALLETS = Array.from({ length: 30 }, () => fakeEvmAddress());

// ─── Market Master Data ───

interface MockMarket {
  market_id: string;
  slug: string;
  question: string;
  tags: string[];
  event_id: string;
  event_title: string;
  active: boolean;
  closed: boolean;
  end_date: string;
  neg_risk: boolean;
  volume: number;
  volume_24hr: number;
  volume_1wk: number;
  volume_1mo: number;
  liquidity: number;
  volume_change_pct: number;
  open_interest: number;
  best_bid: number;
  best_ask: number;
  last_trade_price: number;
  one_day_price_change: number;
  unique_traders_24h: number;
  created_at: string;
  age_hours: number;
}

const MARKETS: MockMarket[] = [
  {
    market_id: 'pm_btc_200k_june',
    slug: 'will-bitcoin-hit-200k-by-june-2026',
    question: 'Will Bitcoin hit $200K by June 2026?',
    tags: ['Crypto', 'Bitcoin', 'Price Prediction'],
    event_id: 'evt_crypto_price_2026',
    event_title: 'Crypto Price Predictions 2026',
    active: true, closed: false, neg_risk: true,
    end_date: '2026-06-30T00:00:00',
    volume: 18_200_000, volume_24hr: 2_100_000, volume_1wk: 8_500_000, volume_1mo: 18_200_000,
    liquidity: 4_500_000, volume_change_pct: 15.2, open_interest: 12_000_000,
    best_bid: 0.115, best_ask: 0.125, last_trade_price: 0.12, one_day_price_change: -0.02,
    unique_traders_24h: 1200, created_at: '2025-01-15T10:00:00.000000', age_hours: 10000,
  },
  {
    market_id: 'pm_eth_etf_staking',
    slug: 'ethereum-etf-staking-approval-q3',
    question: 'Ethereum ETF Staking Approval by Q3?',
    tags: ['Crypto', 'Ethereum', 'ETF'],
    event_id: 'evt_eth_etf',
    event_title: 'Ethereum ETF Developments',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-09-30T00:00:00',
    volume: 12_100_000, volume_24hr: 1_800_000, volume_1wk: 5_200_000, volume_1mo: 12_100_000,
    liquidity: 3_200_000, volume_change_pct: 8.5, open_interest: 8_500_000,
    best_bid: 0.44, best_ask: 0.46, last_trade_price: 0.45, one_day_price_change: 0.01,
    unique_traders_24h: 850, created_at: '2025-03-01T12:00:00.000000', age_hours: 8500,
  },
  {
    market_id: 'pm_sol_firedancer',
    slug: 'solana-firedancer-mainnet-2026',
    question: 'Solana Firedancer Mainnet Launch in 2026?',
    tags: ['Crypto', 'Solana', 'Infrastructure'],
    event_id: 'evt_sol_upgrades',
    event_title: 'Solana Network Upgrades',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-12-31T00:00:00',
    volume: 5_400_000, volume_24hr: 620_000, volume_1wk: 2_100_000, volume_1mo: 5_400_000,
    liquidity: 1_800_000, volume_change_pct: 22.1, open_interest: 3_800_000,
    best_bid: 0.77, best_ask: 0.79, last_trade_price: 0.78, one_day_price_change: 0.03,
    unique_traders_24h: 420, created_at: '2025-06-15T08:00:00.000000', age_hours: 6800,
  },
  {
    market_id: 'pm_fed_rate_cut_may',
    slug: 'fed-rate-cut-may-2026',
    question: 'Fed Rate Cut in May 2026?',
    tags: ['Economics', 'Federal Reserve', 'Interest Rates'],
    event_id: 'evt_fed_policy_2026',
    event_title: 'Federal Reserve Policy Decisions',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-05-31T00:00:00',
    volume: 31_000_000, volume_24hr: 4_200_000, volume_1wk: 14_500_000, volume_1mo: 31_000_000,
    liquidity: 8_200_000, volume_change_pct: 32.8, open_interest: 22_000_000,
    best_bid: 0.64, best_ask: 0.66, last_trade_price: 0.65, one_day_price_change: -0.01,
    unique_traders_24h: 2800, created_at: '2025-02-01T09:00:00.000000', age_hours: 9500,
  },
  {
    market_id: 'pm_trump_crypto_reserve',
    slug: 'trump-signs-crypto-strategic-reserve',
    question: 'Trump Signs Crypto Strategic Reserve Executive Order?',
    tags: ['Politics', 'Crypto', 'Regulation'],
    event_id: 'evt_us_crypto_policy',
    event_title: 'US Crypto Policy',
    active: true, closed: false, neg_risk: true,
    end_date: '2026-12-31T00:00:00',
    volume: 22_800_000, volume_24hr: 3_100_000, volume_1wk: 10_200_000, volume_1mo: 22_800_000,
    liquidity: 6_100_000, volume_change_pct: 18.9, open_interest: 15_500_000,
    best_bid: 0.33, best_ask: 0.35, last_trade_price: 0.34, one_day_price_change: 0.02,
    unique_traders_24h: 1900, created_at: '2025-04-10T15:00:00.000000', age_hours: 8200,
  },
  {
    market_id: 'pm_argentina_imf_deal',
    slug: 'argentina-reaches-imf-deal-q2',
    question: 'Argentina Reaches IMF Deal by Q2 2026?',
    tags: ['Economics', 'Geopolitics', 'Latin America'],
    event_id: 'evt_argentina_econ',
    event_title: 'Argentina Economic Recovery',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-06-30T00:00:00',
    volume: 8_900_000, volume_24hr: 980_000, volume_1wk: 3_800_000, volume_1mo: 8_900_000,
    liquidity: 2_300_000, volume_change_pct: 11.4, open_interest: 6_200_000,
    best_bid: 0.57, best_ask: 0.59, last_trade_price: 0.58, one_day_price_change: 0,
    unique_traders_24h: 650, created_at: '2025-08-20T11:00:00.000000', age_hours: 5200,
  },
  {
    market_id: 'pm_ai_agi_2026',
    slug: 'artificial-general-intelligence-achieved-2026',
    question: 'AGI Achieved by End of 2026?',
    tags: ['Technology', 'AI', 'Science'],
    event_id: 'evt_ai_milestones',
    event_title: 'AI Milestones 2026',
    active: true, closed: false, neg_risk: true,
    end_date: '2026-12-31T00:00:00',
    volume: 42_000_000, volume_24hr: 5_800_000, volume_1wk: 19_000_000, volume_1mo: 42_000_000,
    liquidity: 11_000_000, volume_change_pct: 45.6, open_interest: 30_000_000,
    best_bid: 0.045, best_ask: 0.055, last_trade_price: 0.05, one_day_price_change: -0.005,
    unique_traders_24h: 3800, created_at: '2025-01-01T00:00:00.000000', age_hours: 10500,
  },
  {
    market_id: 'pm_xrp_etf_approval',
    slug: 'xrp-spot-etf-approved-2026',
    question: 'XRP Spot ETF Approved in 2026?',
    tags: ['Crypto', 'XRP', 'ETF', 'Regulation'],
    event_id: 'evt_crypto_etfs',
    event_title: 'Crypto ETF Approvals',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-12-31T00:00:00',
    volume: 15_600_000, volume_24hr: 2_200_000, volume_1wk: 7_100_000, volume_1mo: 15_600_000,
    liquidity: 4_100_000, volume_change_pct: 12.3, open_interest: 10_800_000,
    best_bid: 0.37, best_ask: 0.39, last_trade_price: 0.38, one_day_price_change: 0.01,
    unique_traders_24h: 1100, created_at: '2025-05-01T14:00:00.000000', age_hours: 7800,
  },
  {
    market_id: 'pm_uniswap_v4_launch',
    slug: 'uniswap-v4-mainnet-launch-q2',
    question: 'Uniswap V4 Launches on Mainnet by Q2 2026?',
    tags: ['Crypto', 'DeFi', 'Uniswap'],
    event_id: 'evt_defi_launches',
    event_title: 'DeFi Protocol Launches',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-06-30T00:00:00',
    volume: 6_800_000, volume_24hr: 780_000, volume_1wk: 2_900_000, volume_1mo: 6_800_000,
    liquidity: 2_000_000, volume_change_pct: 9.7, open_interest: 4_500_000,
    best_bid: 0.71, best_ask: 0.73, last_trade_price: 0.72, one_day_price_change: 0.02,
    unique_traders_24h: 380, created_at: '2025-07-10T16:00:00.000000', age_hours: 6200,
  },
  {
    market_id: 'pm_us_recession_2026',
    slug: 'us-recession-declared-2026',
    question: 'US Recession Declared in 2026?',
    tags: ['Economics', 'United States', 'Recession'],
    event_id: 'evt_us_economy',
    event_title: 'US Economic Outlook',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-12-31T00:00:00',
    volume: 28_400_000, volume_24hr: 3_600_000, volume_1wk: 12_800_000, volume_1mo: 28_400_000,
    liquidity: 7_500_000, volume_change_pct: 27.5, open_interest: 19_000_000,
    best_bid: 0.21, best_ask: 0.23, last_trade_price: 0.22, one_day_price_change: -0.01,
    unique_traders_24h: 2400, created_at: '2025-03-15T10:00:00.000000', age_hours: 9000,
  },
  {
    market_id: 'pm_eth_10k',
    slug: 'will-eth-hit-10k-by-dec-2026',
    question: 'Will ETH hit $10K by December 2026?',
    tags: ['Crypto', 'Ethereum', 'Price Prediction'],
    event_id: 'evt_crypto_price_2026',
    event_title: 'Crypto Price Predictions 2026',
    active: true, closed: false, neg_risk: true,
    end_date: '2026-12-31T00:00:00',
    volume: 9_200_000, volume_24hr: 1_100_000, volume_1wk: 4_000_000, volume_1mo: 9_200_000,
    liquidity: 2_400_000, volume_change_pct: 14.8, open_interest: 6_400_000,
    best_bid: 0.075, best_ask: 0.085, last_trade_price: 0.08, one_day_price_change: 0.005,
    unique_traders_24h: 720, created_at: '2025-04-01T12:00:00.000000', age_hours: 8600,
  },
  {
    market_id: 'pm_openai_ipo',
    slug: 'openai-ipo-in-2026',
    question: 'OpenAI IPO Happens in 2026?',
    tags: ['Technology', 'AI', 'IPO'],
    event_id: 'evt_tech_ipos',
    event_title: 'Tech IPOs 2026',
    active: true, closed: false, neg_risk: false,
    end_date: '2026-12-31T00:00:00',
    volume: 16_300_000, volume_24hr: 2_400_000, volume_1wk: 7_500_000, volume_1mo: 16_300_000,
    liquidity: 4_300_000, volume_change_pct: 19.2, open_interest: 11_200_000,
    best_bid: 0.60, best_ask: 0.62, last_trade_price: 0.61, one_day_price_change: 0.01,
    unique_traders_24h: 1500, created_at: '2025-02-15T08:00:00.000000', age_hours: 9200,
  },
];

// ─── Generators ───

/**
 * Generate holders for a specific market.
 * Strategically places SM wallets with positions that diverge from market odds
 * so the divergence score algorithm produces meaningful output.
 */
const generateTopHolders = (args: string[]) => {
  const marketIdIdx = args.indexOf('--market-id');
  const marketId = marketIdIdx >= 0 ? args[marketIdIdx + 1] || '' : '';

  const market = MARKETS.find(m => m.market_id === marketId || m.slug === marketId);
  const yesPrice = market?.last_trade_price ?? 0.5;

  // Decide SM bias: SM often disagrees with the crowd
  // If market says <40% YES, SM tends to lean YES (contrarian bullish)
  // If market says >70% YES, SM might lean NO (contrarian bearish)
  const smBullishBias = yesPrice < 0.4 ? 0.85 : yesPrice > 0.7 ? 0.3 : 0.6;

  // SM holders — owner_address is the real wallet, address is the Polymarket proxy
  const smCount = 3 + Math.floor(Math.random() * 5); // 3-7 SM holders
  const smHolders = SM_WALLETS.slice(0, smCount).map(w => {
    const isYes = Math.random() < smBullishBias;
    const price = isYes ? yesPrice : (1 - yesPrice);
    const posSize = Math.round((50_000 + Math.random() * 2_000_000) / price);
    return {
      market_id: market?.market_id || '',
      outcome_index: isYes ? 1 : 2,
      address: fakeEvmAddress(),       // Polymarket proxy contract
      owner_address: w.address,        // Real wallet (for profiler lookup)
      side: isYes ? 'Yes' : 'No',
      position_size: posSize,
      avg_entry_price: price * (0.6 + Math.random() * 0.3),
      current_price: price,
      unrealized_pnl_usd: Math.round((Math.random() - 0.3) * 50_000),
    };
  });

  // Regular holders (random addresses, no owner_address)
  const regularCount = 15 + Math.floor(Math.random() * 20);
  const regularHolders = REGULAR_WALLETS.slice(0, regularCount).map(addr => {
    const isYes = Math.random() < yesPrice; // Regular traders roughly follow market odds
    const price = isYes ? yesPrice : (1 - yesPrice);
    const posSize = Math.round((1_000 + Math.random() * 100_000) / price);
    return {
      market_id: market?.market_id || '',
      outcome_index: isYes ? 1 : 2,
      address: addr,
      owner_address: '0x',              // No known owner (like real API)
      side: isYes ? 'Yes' : 'No',
      position_size: posSize,
      avg_entry_price: price * (0.5 + Math.random() * 0.5),
      current_price: price,
      unrealized_pnl_usd: Math.round((Math.random() - 0.5) * 20_000),
    };
  });

  return [...smHolders, ...regularHolders];
};

const generateMarketScreener = (args: string[]) => {
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] || '20', 10) : 20;
  return MARKETS.slice(0, Math.min(limit, MARKETS.length));
};

const generateEventScreener = (_args: string[]) => {
  return [
    {
      event_slug: 'crypto-price-predictions-2026',
      event_title: 'Crypto Price Predictions 2026',
      category: 'Crypto',
      total_volume_usd: 52_000_000,
      markets: MARKETS.filter(m => m.tags.includes('Crypto')).slice(0, 4),
    },
    {
      event_slug: 'us-economic-outlook-2026',
      event_title: 'US Economic Outlook 2026',
      category: 'Economics',
      total_volume_usd: 68_300_000,
      markets: MARKETS.filter(m => m.tags.includes('Economics')).slice(0, 3),
    },
  ];
};

const generateTradesByMarket = (_args: string[]) => {
  const sides: Array<'BUY' | 'SELL'> = ['BUY', 'SELL'];
  const outcomes: Array<'YES' | 'NO'> = ['YES', 'NO'];
  const allAddresses = [...SM_WALLETS.map(w => w.address), ...REGULAR_WALLETS.slice(0, 10)];

  return Array.from({ length: 15 }).map(() => {
    const addr = allAddresses[Math.floor(Math.random() * allAddresses.length)]!;
    const smWallet = SM_WALLETS.find(w => w.address === addr);
    return {
      address: addr,
      address_label: smWallet?.fullname,
      side: sides[Math.floor(Math.random() * 2)]!,
      outcome: outcomes[Math.floor(Math.random() * 2)]!,
      shares: Math.round(100 + Math.random() * 50_000),
      price: 0.1 + Math.random() * 0.8,
      value_usd: Math.round(500 + Math.random() * 200_000),
      timestamp: new Date(Date.now() - Math.random() * 7 * 86_400_000).toISOString(),
      tx_hash: `0x${randomHex(64)}`,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generatePnlByMarket = (_args: string[]) => {
  const allAddresses = [...SM_WALLETS.map(w => w.address), ...REGULAR_WALLETS.slice(0, 5)];
  return allAddresses.slice(0, 10).map(addr => {
    const smWallet = SM_WALLETS.find(w => w.address === addr);
    const realized = (Math.random() - 0.3) * 100_000;
    const unrealized = (Math.random() - 0.4) * 50_000;
    return {
      address: addr,
      address_label: smWallet?.fullname,
      realized_pnl_usd: Math.round(realized),
      unrealized_pnl_usd: Math.round(unrealized),
      total_pnl_usd: Math.round(realized + unrealized),
      total_trades: Math.floor(5 + Math.random() * 50),
      win_rate: 0.3 + Math.random() * 0.5,
    };
  }).sort((a, b) => b.total_pnl_usd - a.total_pnl_usd);
};

const generateMarketOHLCV = (_args: string[]) => {
  let price = 0.3 + Math.random() * 0.4;
  return Array.from({ length: 48 }).map((_, i) => {
    price += (Math.random() - 0.48) * 0.02;
    price = Math.max(0.01, Math.min(0.99, price));
    return {
      timestamp: new Date(Date.now() - (48 - i) * 3_600_000).toISOString(),
      open: price,
      high: price + Math.random() * 0.03,
      low: price - Math.random() * 0.03,
      close: price + (Math.random() - 0.5) * 0.02,
      volume: Math.round(10_000 + Math.random() * 500_000),
    };
  });
};

const generateOrderbook = (_args: string[]) => {
  const mid = 0.3 + Math.random() * 0.4;
  const bids = Array.from({ length: 10 }).map((_, i) => ({
    price: +(mid - (i + 1) * 0.01).toFixed(3),
    size: Math.round(5_000 + Math.random() * 50_000),
  }));
  const asks = Array.from({ length: 10 }).map((_, i) => ({
    price: +(mid + (i + 1) * 0.01).toFixed(3),
    size: Math.round(5_000 + Math.random() * 50_000),
  }));
  return { bids, asks, spread: 0.02, midpoint: +mid.toFixed(3) };
};

const generateProfilerLabels = (args: string[]) => {
  const addressIdx = args.indexOf('--address');
  const address = addressIdx >= 0 ? args[addressIdx + 1] || '' : '';

  // Check if this address is one of our known SM wallets
  const smWallet = SM_WALLETS.find(w => w.address.toLowerCase() === address.toLowerCase());

  if (smWallet) {
    return [
      {
        label: smWallet.label,
        category: 'Smart Money',
        definition: `${smWallet.label} — Nansen-classified wallet`,
        fullname: smWallet.fullname,
        smEarnedDate: '2025-08-15',
      },
    ];
  }

  // Regular wallets get no SM labels (or random non-SM labels)
  if (Math.random() > 0.7) {
    return [
      {
        label: 'DEX Trader',
        category: 'Activity',
        definition: 'Active decentralized exchange participant',
        fullname: `Trader-${randomHex(4)}`,
      },
    ];
  }

  return []; // Most addresses have no labels
};

const generatePnlSummary = (_args: string[]) => {
  return {
    total_realized_pnl_usd: Math.round((Math.random() - 0.3) * 200_000),
    total_unrealized_pnl_usd: Math.round((Math.random() - 0.4) * 80_000),
    win_rate: 0.4 + Math.random() * 0.35,
    best_trade_usd: Math.round(5_000 + Math.random() * 50_000),
    worst_trade_usd: Math.round(-1_000 - Math.random() * 20_000),
  };
};

const generateCategories = () => [
  { slug: 'crypto',      name: 'Crypto',       market_count: 42 },
  { slug: 'politics',    name: 'Politics',     market_count: 28 },
  { slug: 'economics',   name: 'Economics',    market_count: 19 },
  { slug: 'technology',  name: 'Technology',   market_count: 15 },
  { slug: 'sports',      name: 'Sports',       market_count: 35 },
  { slug: 'culture',     name: 'Pop Culture',  market_count: 11 },
];

const generatePnlByAddress = (_args: string[]) => {
  return MARKETS.slice(0, 4).map(m => ({
    address: SM_WALLETS[0]!.address,
    market_id: m.market_id,
    question: m.question,
    realized_pnl_usd: Math.round((Math.random() - 0.3) * 50_000),
    unrealized_pnl_usd: Math.round((Math.random() - 0.4) * 30_000),
    total_pnl_usd: Math.round((Math.random() - 0.3) * 70_000),
    position: Math.random() > 0.4 ? 'YES' as const : 'NO' as const,
  }));
};

const generateTradesByAddress = (_args: string[]) => {
  const sides: Array<'BUY' | 'SELL'> = ['BUY', 'SELL'];
  const outcomes: Array<'YES' | 'NO'> = ['YES', 'NO'];
  return Array.from({ length: 8 }).map(() => ({
    address: SM_WALLETS[0]!.address,
    side: sides[Math.floor(Math.random() * 2)]!,
    outcome: outcomes[Math.floor(Math.random() * 2)]!,
    shares: Math.round(500 + Math.random() * 20_000),
    price: 0.1 + Math.random() * 0.8,
    value_usd: Math.round(1_000 + Math.random() * 100_000),
    timestamp: new Date(Date.now() - Math.random() * 14 * 86_400_000).toISOString(),
    tx_hash: `0x${randomHex(64)}`,
  }));
};

const generatePositionDetail = (args: string[]) => {
  const holders = generateTopHolders(args);
  const yesHolders = holders.filter(h => h.side === 'Yes');
  const noHolders = holders.filter(h => h.side === 'No');
  return {
    total_holders: holders.length,
    yes_holders: yesHolders.length,
    no_holders: noHolders.length,
    total_value_usd: holders.reduce((a, h) => a + h.position_size * h.current_price, 0),
    yes_value_usd: yesHolders.reduce((a, h) => a + h.position_size * h.current_price, 0),
    no_value_usd: noHolders.reduce((a, h) => a + h.position_size * h.current_price, 0),
    holders,
  };
};

const generateSmartMoneyNetflow = (_args: string[]) => {
  const tokens = ['ETH', 'WBTC', 'USDC', 'LINK', 'UNI', 'ARB'];
  return tokens.map(t => ({
    token_symbol: t,
    net_flow_24h_usd: (Math.random() - 0.5) * 10_000_000,
    net_flow_7d_usd: (Math.random() - 0.5) * 30_000_000,
    inflow_usd: Math.random() * 5_000_000,
    outflow_usd: Math.random() * 5_000_000,
  }));
};

const generateAccount = () => ({
  email: 'demo@nansen.ai',
  tier: 'VIP',
  credits_remaining: 50_000,
  credits_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
});

// ─── Trading Mock Data ───

const generateWalletStatus = (args: string[]) => {
  const chain = getArgValue(args, '--chain') || 'base';
  return {
    address: '0xTRADER' + randomHex(34),
    chain,
    balance_native: 0.5,
    balance_usd: 1250.00,
    exists: true,
  };
};

const generateWalletCreate = (args: string[]) => {
  const chain = getArgValue(args, '--chain') || 'base';
  return {
    address: '0xNEW' + randomHex(36),
    chain,
    balance_native: 0,
    balance_usd: 0,
    exists: true,
  };
};

const generateTokenInfo = (args: string[]) => {
  const symbol = getArgValue(args, '--symbol') || 'WETH';
  const chain = getArgValue(args, '--chain') || 'base';
  const prices: Record<string, number> = {
    WETH: 3450.00,
    USDC: 1.00,
    USDT: 1.00,
    WBTC: 67500.00,
  };
  return {
    symbol,
    name: symbol === 'WETH' ? 'Wrapped Ether' : symbol === 'USDC' ? 'USD Coin' : symbol,
    address: '0xTOKEN' + randomHex(34),
    chain,
    price_usd: prices[symbol] ?? 100.00,
    market_cap_usd: 415_000_000_000,
    liquidity_usd: 850_000_000,
    volume_24h_usd: 12_500_000_000,
  };
};

const generateTradeQuote = (args: string[]) => {
  const from = getArgValue(args, '--from') || 'USDC';
  const to = getArgValue(args, '--to') || 'WETH';
  const amount = parseFloat(getArgValue(args, '--amount') || '100');
  const chain = getArgValue(args, '--chain') || 'base';
  const ethPrice = 3450;
  const expectedOut = to === 'WETH' ? amount / ethPrice : amount * ethPrice;
  return {
    from_token: from,
    to_token: to,
    chain,
    amount_in: amount,
    expected_out: parseFloat(expectedOut.toFixed(6)),
    price_impact: 0.12,
    route: `${from} → ${to} via Uniswap V3`,
    gas_estimate_usd: 0.42,
    expires_at: new Date(Date.now() + 30_000).toISOString(),
  };
};

const generateTradeExecute = (args: string[]) => {
  const from = getArgValue(args, '--from') || 'USDC';
  const to = getArgValue(args, '--to') || 'WETH';
  const amount = parseFloat(getArgValue(args, '--amount') || '100');
  const chain = getArgValue(args, '--chain') || 'base';
  const isDryRun = args.includes('--dry-run');
  const ethPrice = 3450;
  const amountOut = to === 'WETH' ? amount / ethPrice : amount * ethPrice;
  return {
    tx_hash: isDryRun ? '0xDRYRUN_' + randomHex(56) : '0x' + randomHex(64),
    status: isDryRun ? 'pending' as const : 'success' as const,
    from_token: from,
    to_token: to,
    amount_in: amount,
    amount_out: parseFloat(amountOut.toFixed(6)),
    chain,
    gas_used_usd: isDryRun ? 0 : 0.38,
    executed_at: new Date().toISOString(),
  };
};

// ─── Arg Helper ───

function getArgValue(args: string[], flag: string): string {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return '';
  return args[idx + 1];
}

// ─── Router ───

/**
 * Returns mock data for a given command or null if not matched.
 * Same interface as NansenTerm's getMockData.
 */
export function getMockData(command: string, args: string[] = []): unknown | null {
  // Prediction Market endpoints
  if (command.includes('market-screener'))     return generateMarketScreener(args);
  if (command.includes('event-screener'))      return generateEventScreener(args);
  if (command.includes('top-holders'))         return generateTopHolders(args);
  if (command.includes('trades-by-market'))    return generateTradesByMarket(args);
  if (command.includes('pnl-by-market'))       return generatePnlByMarket(args);
  if (command.includes('ohlcv'))              return generateMarketOHLCV(args);
  if (command.includes('orderbook'))          return generateOrderbook(args);
  if (command.includes('pnl-by-address'))     return generatePnlByAddress(args);
  if (command.includes('trades-by-address'))  return generateTradesByAddress(args);
  if (command.includes('categories'))         return generateCategories();
  if (command.includes('position-detail'))    return generatePositionDetail(args);

  // Profiler endpoints
  if (command.includes('profiler labels'))    return generateProfilerLabels(args);
  if (command.includes('profiler pnl'))       return generatePnlSummary(args);
  if (command.includes('profiler batch'))     return generateProfilerLabels(args);

  // Smart Money endpoints
  if (command.includes('smart-money netflow'))   return generateSmartMoneyNetflow(args);
  if (command.includes('smart-money holdings'))  return generateSmartMoneyNetflow(args);

  // Trading endpoints
  if (command.includes('wallet status'))     return generateWalletStatus(args);
  if (command.includes('wallet create'))     return generateWalletCreate(args);
  if (command.includes('token info'))        return generateTokenInfo(args);
  if (command.includes('trade quote'))       return generateTradeQuote(args);
  if (command.includes('trade execute'))     return generateTradeExecute(args);

  // Account
  if (command.includes('account'))           return generateAccount();

  return null;
}

export const IS_MOCK = process.env['NANSEN_MOCK'] === 'true';
