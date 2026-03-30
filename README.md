# 🔮 Nansen Polymarket Oracle

**Smart Money × Prediction Market Intelligence**

Cross-reference on-chain whale positions with prediction market odds to identify mispriced outcomes.

## What It Does

The Oracle answers one question: **"Where is Smart Money silently betting against the crowd?"**

```
Market Odds say:     72% YES on "Will ETH hit $5K?"
Smart Money says:    92% positioned on YES ($12.4M deployed)
Divergence:          🔥 +20 pts — SM is more bullish than the market
```

### Core Pipeline: `scan` → `enrich` → `analyze`

1. **Scan** — Fetches active prediction markets from the Nansen CLI `research prediction-market` endpoints
2. **Enrich** — Cross-references holder addresses against Nansen's `profiler labels` to identify Smart Money wallets (Funds, Smart Traders, etc.)
3. **Analyze** — Calculates a capital-weighted **SM Divergence Score** (-100 to +100):
   - **Positive** = SM is more bullish than market odds
   - **Negative** = SM is more bearish than market odds
   - Markets with |score| ≥ 30 are flagged as **alpha opportunities**

## Quick Start

```bash
# Install deps
npm install

# Ensure Nansen CLI is configured
nansen auth login

# Scan all active markets
npx tsx src/index.ts scan

# Deep dive into a specific market
npx tsx src/index.ts analyze <market-id>

# Generate a full report
npx tsx src/index.ts report --format md

# Monitor a market in real-time
npx tsx src/index.ts watch <market-id> --interval 60
```

## Commands

| Command | Description |
|---------|-------------|
| `scan` | Discover prediction markets ranked by SM divergence |
| `analyze <id>` | Deep analysis of a specific market: holders, trades, PnL |
| `report` | Full alpha report exported as Markdown or JSON |
| `watch <id>` | Live monitoring with change alerts |

### Options

```
scan:
  -c, --category <cat>     Filter by market category
  -v, --min-volume <usd>   Minimum volume (default: 10000)
  -l, --limit <n>          Markets to scan (default: 20)
  --chain <chain>          Chain for profiler (default: ethereum)

report:
  -f, --format <fmt>       Output: md, json, table (default: md)
  -o, --output <path>      File path for report
```

## Architecture

```
src/
├── index.ts              # CLI entrypoint (Commander.js)
├── commands/
│   ├── scan.ts           # Market discovery + enrichment
│   ├── analyze.ts        # Single market deep-dive
│   ├── report.ts         # Full report generation
│   └── watch.ts          # Real-time monitoring
├── lib/
│   ├── nansen.ts         # CLI wrapper (exec → JSON)
│   ├── enricher.ts       # SM label cross-referencing
│   ├── analyzer.ts       # Divergence score algorithm
│   ├── cache.ts          # TTL cache for label lookups
│   └── formatter.ts      # Terminal + Markdown output
└── types/
    ├── market.ts         # Prediction market types
    ├── smartmoney.ts     # SM labels + enriched holders
    └── report.ts         # Analysis output types
```

## Nansen CLI Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `research prediction-market market-screener` | Discover active markets |
| `research prediction-market top-holders` | Get market positions |
| `research prediction-market trades-by-market` | Recent trades |
| `research prediction-market pnl-by-market` | PnL leaderboard |
| `research prediction-market ohlcv` | Price history |
| `research profiler labels` | Wallet classification |
| `research profiler pnl-summary` | Wallet performance |

## Built For

🏆 **Nansen CLI Build Challenge — Week 3** (Build Something Real)

> 📊 Data by [Nansen](https://nansen.ai)
