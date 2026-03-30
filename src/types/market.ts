/**
 * Prediction Market types — based on nansen research prediction-market endpoints.
 */

/** Market from the screener endpoint */
export interface PredictionMarket {
  market_id: string;
  market_slug?: string;
  question: string;
  category?: string;
  end_date?: string;
  yes_price: number;           // 0.0–1.0 (current odds)
  no_price?: number;
  volume_usd: number;
  liquidity_usd?: number;
  num_traders?: number;
  active?: boolean;
  image_url?: string;
  event_slug?: string;
  event_title?: string;
}

/** Event from the event-screener endpoint */
export interface PredictionEvent {
  event_slug: string;
  event_title: string;
  category?: string;
  markets?: PredictionMarket[];
  total_volume_usd?: number;
}

/** Holder/position from top-holders endpoint */
export interface MarketHolder {
  address: string;
  address_label?: string;
  position: 'YES' | 'NO';
  shares: number;
  value_usd: number;
  entry_price?: number;
  pnl_usd?: number;
  timestamp?: string;
}

/** Trade from trades-by-market endpoint */
export interface MarketTrade {
  address: string;
  address_label?: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  shares: number;
  price: number;
  value_usd: number;
  timestamp: string;
  tx_hash?: string;
}

/** PnL entry from pnl-by-market endpoint */
export interface MarketPnL {
  address: string;
  address_label?: string;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  total_pnl_usd: number;
  total_trades: number;
  win_rate?: number;
}

/** OHLCV data point */
export interface MarketOHLCV {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Orderbook snapshot */
export interface MarketOrderbook {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  spread?: number;
  midpoint?: number;
}

/** PnL by address in prediction markets */
export interface AddressPredictionPnL {
  address: string;
  market_id: string;
  question?: string;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  total_pnl_usd: number;
  position?: 'YES' | 'NO';
}

/** Category metadata */
export interface MarketCategory {
  slug: string;
  name: string;
  market_count?: number;
}
