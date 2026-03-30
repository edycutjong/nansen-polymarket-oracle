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
  market_slug: string;
  question: string;
  category: string;
  yes_price: number;
  volume_usd: number;
  liquidity_usd: number;
  num_traders: number;
  end_date: string;
  active: boolean;
}

const MARKETS: MockMarket[] = [
  {
    market_id: 'pm_btc_200k_june',
    market_slug: 'will-bitcoin-hit-200k-by-june-2026',
    question: 'Will Bitcoin hit $200K by June 2026?',
    category: 'Crypto',
    yes_price: 0.12,
    volume_usd: 18_200_000,
    liquidity_usd: 4_500_000,
    num_traders: 8432,
    end_date: '2026-06-30T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_eth_etf_staking',
    market_slug: 'ethereum-etf-staking-approval-q3',
    question: 'Ethereum ETF Staking Approval by Q3?',
    category: 'Crypto',
    yes_price: 0.45,
    volume_usd: 12_100_000,
    liquidity_usd: 3_200_000,
    num_traders: 5621,
    end_date: '2026-09-30T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_sol_firedancer',
    market_slug: 'solana-firedancer-mainnet-2026',
    question: 'Solana Firedancer Mainnet Launch in 2026?',
    category: 'Crypto',
    yes_price: 0.78,
    volume_usd: 5_400_000,
    liquidity_usd: 1_800_000,
    num_traders: 3100,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_fed_rate_cut_may',
    market_slug: 'fed-rate-cut-may-2026',
    question: 'Fed Rate Cut in May 2026?',
    category: 'Economics',
    yes_price: 0.65,
    volume_usd: 31_000_000,
    liquidity_usd: 8_200_000,
    num_traders: 14200,
    end_date: '2026-05-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_trump_crypto_reserve',
    market_slug: 'trump-signs-crypto-strategic-reserve',
    question: 'Trump Signs Crypto Strategic Reserve Executive Order?',
    category: 'Politics',
    yes_price: 0.34,
    volume_usd: 22_800_000,
    liquidity_usd: 6_100_000,
    num_traders: 11500,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_argentina_imf_deal',
    market_slug: 'argentina-reaches-imf-deal-q2',
    question: 'Argentina Reaches IMF Deal by Q2 2026?',
    category: 'Economics',
    yes_price: 0.58,
    volume_usd: 8_900_000,
    liquidity_usd: 2_300_000,
    num_traders: 4200,
    end_date: '2026-06-30T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_ai_agi_2026',
    market_slug: 'artificial-general-intelligence-achieved-2026',
    question: 'AGI Achieved by End of 2026?',
    category: 'Technology',
    yes_price: 0.05,
    volume_usd: 42_000_000,
    liquidity_usd: 11_000_000,
    num_traders: 23000,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_xrp_etf_approval',
    market_slug: 'xrp-spot-etf-approved-2026',
    question: 'XRP Spot ETF Approved in 2026?',
    category: 'Crypto',
    yes_price: 0.38,
    volume_usd: 15_600_000,
    liquidity_usd: 4_100_000,
    num_traders: 7800,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_uniswap_v4_launch',
    market_slug: 'uniswap-v4-mainnet-launch-q2',
    question: 'Uniswap V4 Launches on Mainnet by Q2 2026?',
    category: 'Crypto',
    yes_price: 0.72,
    volume_usd: 6_800_000,
    liquidity_usd: 2_000_000,
    num_traders: 2900,
    end_date: '2026-06-30T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_us_recession_2026',
    market_slug: 'us-recession-declared-2026',
    question: 'US Recession Declared in 2026?',
    category: 'Economics',
    yes_price: 0.22,
    volume_usd: 28_400_000,
    liquidity_usd: 7_500_000,
    num_traders: 16800,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_eth_10k',
    market_slug: 'will-eth-hit-10k-by-dec-2026',
    question: 'Will ETH hit $10K by December 2026?',
    category: 'Crypto',
    yes_price: 0.08,
    volume_usd: 9_200_000,
    liquidity_usd: 2_400_000,
    num_traders: 5100,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
  },
  {
    market_id: 'pm_openai_ipo',
    market_slug: 'openai-ipo-in-2026',
    question: 'OpenAI IPO Happens in 2026?',
    category: 'Technology',
    yes_price: 0.61,
    volume_usd: 16_300_000,
    liquidity_usd: 4_300_000,
    num_traders: 9200,
    end_date: '2026-12-31T23:59:59Z',
    active: true,
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

  const market = MARKETS.find(m => m.market_id === marketId || m.market_slug === marketId);
  const yesPrice = market?.yes_price ?? 0.5;

  // Decide SM bias: SM often disagrees with the crowd
  // If market says <40% YES, SM tends to lean YES (contrarian bullish)
  // If market says >70% YES, SM might lean NO (contrarian bearish)
  const smBullishBias = yesPrice < 0.4 ? 0.85 : yesPrice > 0.7 ? 0.3 : 0.6;

  // SM holders (use stable addresses so profiler labels will match)
  const smCount = 3 + Math.floor(Math.random() * 5); // 3-7 SM holders
  const smHolders = SM_WALLETS.slice(0, smCount).map(w => {
    const isYes = Math.random() < smBullishBias;
    const value = 50_000 + Math.random() * 2_000_000;
    return {
      address: w.address,
      address_label: w.fullname,
      position: isYes ? 'YES' as const : 'NO' as const,
      shares: Math.round(value / (isYes ? yesPrice : (1 - yesPrice))),
      value_usd: Math.round(value),
      entry_price: isYes
        ? yesPrice * (0.6 + Math.random() * 0.3)  // entered below current price
        : (1 - yesPrice) * (0.6 + Math.random() * 0.3),
      pnl_usd: Math.round((Math.random() - 0.3) * 50_000),
      timestamp: new Date(Date.now() - Math.random() * 30 * 86_400_000).toISOString(),
    };
  });

  // Regular holders (random addresses)
  const regularCount = 15 + Math.floor(Math.random() * 20);
  const regularHolders = REGULAR_WALLETS.slice(0, regularCount).map(addr => {
    const isYes = Math.random() < yesPrice; // Regular traders roughly follow market odds
    const value = 1_000 + Math.random() * 100_000;
    return {
      address: addr,
      position: isYes ? 'YES' as const : 'NO' as const,
      shares: Math.round(value / (isYes ? yesPrice : (1 - yesPrice))),
      value_usd: Math.round(value),
      entry_price: isYes
        ? yesPrice * (0.5 + Math.random() * 0.5)
        : (1 - yesPrice) * (0.5 + Math.random() * 0.5),
      pnl_usd: Math.round((Math.random() - 0.5) * 20_000),
      timestamp: new Date(Date.now() - Math.random() * 60 * 86_400_000).toISOString(),
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
      markets: MARKETS.filter(m => m.category === 'Crypto').slice(0, 4),
    },
    {
      event_slug: 'us-economic-outlook-2026',
      event_title: 'US Economic Outlook 2026',
      category: 'Economics',
      total_volume_usd: 68_300_000,
      markets: MARKETS.filter(m => m.category === 'Economics').slice(0, 3),
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
  const yesHolders = holders.filter(h => h.position === 'YES');
  const noHolders = holders.filter(h => h.position === 'NO');
  return {
    total_holders: holders.length,
    yes_holders: yesHolders.length,
    no_holders: noHolders.length,
    total_value_usd: holders.reduce((a, h) => a + h.value_usd, 0),
    yes_value_usd: yesHolders.reduce((a, h) => a + h.value_usd, 0),
    no_value_usd: noHolders.reduce((a, h) => a + h.value_usd, 0),
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

  // Account
  if (command.includes('account'))           return generateAccount();

  return null;
}

export const IS_MOCK = process.env['NANSEN_MOCK'] === 'true';
