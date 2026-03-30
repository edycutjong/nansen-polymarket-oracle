# 🔮 Nansen Polymarket Oracle

**Smart Money × Prediction Market Intelligence**

> *"Don't bet against Smart Money. See what they see."*

Cross-reference on-chain whale positions with prediction market odds to identify mispriced outcomes. Built for **Week 3** of the [Nansen CLI Build Challenge](https://x.com/nansen_ai).

<p align="center">
  <img src="docs/demo.gif" alt="Nansen Oracle Demo" />
</p>

---

## What It Does

The Oracle answers one question: **"Where is Smart Money silently betting against the crowd?"**

```
Market Odds say:     12% YES on "Will Bitcoin hit $200K by June 2026?"
Smart Money says:    67% positioned on YES ($6.0M deployed)
Divergence:          🔥 +55 pts — SM is massively bullish vs. crowd
```

When Smart Money conviction diverges significantly from market odds, it signals a potential mispricing that can be exploited.

### Core Pipeline: `scan` → `enrich` → `analyze`

1. **Scan** — Fetches active prediction markets from the Nansen CLI `research prediction-market` endpoints
2. **Enrich** — Cross-references holder addresses against Nansen's `profiler labels` to identify Smart Money wallets (Funds, Smart Traders, 90D Traders, etc.)
3. **Analyze** — Calculates a capital-weighted **SM Divergence Score** (-100 to +100):
   - **Positive** = SM is more bullish than market odds
   - **Negative** = SM is more bearish than market odds
   - Markets with |score| ≥ 40 are flagged as **🔥 EXTREME** alpha opportunities

## 🚀 Quick Start

Get up and running with the Nansen Polymarket Oracle in seconds.

### 1. Installation & Setup

```bash
# Install local dependencies
npm install

# Build and link the CLI globally (Now you don't need to type file paths!)
npm run build
npm link

# Install and configure Nansen CLI
npm install -g nansen-cli
nansen auth login
```

### 2. Run the Oracle

The Oracle supports three data modes — no API key is needed for the default demo.

**🎬 Quick Demo (Recommended — No API Key Required):**
```bash
# Uses real recorded API data from nansen-record.log
bash demo.sh
```

<p align="center">
  <img src="docs/screenshots/splash.png" alt="Nansen Oracle Splash" width="640" />
</p>

```
  ███╗   ██╗ █████╗ ███╗   ██╗███████╗███████╗███╗   ██╗
  ████╗  ██║██╔══██╗████╗  ██║██╔════╝██╔════╝████╗  ██║
  ██╔██╗ ██║███████║██╔██╗ ██║███████╗█████╗  ██╔██╗ ██║
  ██║╚██╗██║██╔══██║██║╚██╗██║╚════██║██╔══╝  ██║╚██╗██║
  ██║ ╚████║██║  ██║██║ ╚████║███████║███████╗██║ ╚████║
  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═══╝

  ██████╗ ██████╗  █████╗  ██████╗██╗     ███████╗
  ██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝
  ██║   ██║██████╔╝███████║██║     ██║     █████╗
  ██║   ██║██╔══██╗██╔══██║██║     ██║     ██╔══╝
  ╚██████╔╝██║  ██║██║  ██║╚██████╗███████╗███████╗
   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝

  🔮 Polymarket × Smart Money Intelligence
```

**Data Modes:**

| Mode | Command | Description |
|------|---------|-------------|
| 🔁 Replay (default) | `bash demo.sh` | Uses real recorded API data from `nansen-record.log` — no API key needed |
| 🧪 Mock | `bash demo.sh mock` | Uses synthetic data for development |
| 🔴 Live | `bash demo.sh live` | Hits the live Nansen API (requires `nansen auth login`) |

You can also set the mode per-command:

```bash
# Replay mode — real recorded data, zero API calls
NANSEN_REPLAY=true nansen-oracle scan --limit 10

# Mock mode — synthetic test data
NANSEN_MOCK=true nansen-oracle scan --limit 8

# Live mode — real-time API (default when no env var is set)
nansen-oracle scan

# Record mode — perform live API calls AND record the raw JSON output
NANSEN_RECORD=true nansen-oracle scan --limit 5
```

> 💡 **`nansen-record.log`** contains captured responses from a real Nansen API session. This enables high-fidelity demonstrations with actual Polymarket data (real markets, real whale addresses) without consuming API credits. You can generate your own recordings by running any command with `NANSEN_RECORD=true`.

## Screenshots

### Scan — Market Discovery & Divergence Table
<p align="center">
  <img src="docs/screenshots/scan-results.png" alt="Scan Results" width="720" />
</p>

### Analyze — Deep Market Intel
<p align="center">
  <img src="docs/screenshots/analyze-deep.png" alt="Deep Analysis" width="720" />
</p>

### Report — Alpha Export
<p align="center">
  <img src="docs/screenshots/report-final.png" alt="Report Output" width="720" />
</p>

## Commands

| Command | Description |
|---------|-------------|
| `scan` | Discover prediction markets ranked by SM divergence |
| `analyze <id>` | Deep analysis of a specific market: holders, trades, PnL |
| `report` | Full alpha report exported as Markdown or JSON |
| `watch <id>` | Live monitoring with Smart Money position change alerts |

### Options

```
scan:
  -c, --category <cat>     Filter by market category
  -v, --min-volume <usd>   Minimum volume (default: 10000)
  -l, --limit <n>          Markets to scan (default: 20)
  --chain <chain>          Chain for profiler (default: ethereum)

analyze:
  --chain <chain>          Chain for profiler (default: ethereum)

report:
  -f, --format <fmt>       Output: md, json, table (default: md)
  -o, --output <path>      File path for report
  -l, --limit <n>          Markets to include (default: 20)

watch:
  -i, --interval <secs>    Refresh interval in seconds (default: 60)
  --chain <chain>          Chain for profiler (default: ethereum)
```

## The SM Divergence Score

The core algorithm computes how much Smart Money positioning differs from market consensus:

```typescript
// SM Divergence Score: -100 to +100
// Positive = SM more bullish than market
// Negative = SM more bearish than market

function calculateDivergence(smHolders, allHolders, marketOdds):
  1. Capital-weight each SM holder's position (YES = +weight, NO = -weight)
  2. Normalize weighted conviction from [-1, 1] to [0, 1]
  3. Divergence = (SM_conviction - market_odds) × 100
```

| Score | Level | Signal |
|-------|-------|--------|
| ±40+ | 🔥 EXTREME | SM strongly disagrees with market |
| ±25+ | ⚠️ HIGH | Notable divergence worth monitoring |
| ±10+ | 📊 MODERATE | Mild divergence |
| <±10 | ✅ LOW/🤝 ALIGNED | SM agrees with market consensus |

## Sample Report Output

The Oracle generates comprehensive alpha reports:

```markdown
# 🔮 Nansen Polymarket Oracle Report

## 🚨 High Divergence Alerts (SM ≠ Market)

### 1. "Will Bitcoin hit $200K by June 2026?"
| Metric | Value |
|--------|-------|
| Market Odds | 12% YES |
| SM Position | 100% YES (7 SM wallets) |
| **Divergence Score** | **+88 pts (EXTREME)** |
| SM Capital Deployed | $7.9M |
| Top SM Holder | 0xA1B2...ABCD (Paradigm Capital) |

> 🧠 Smart Money is **bullish** despite low market odds. 7 SM wallets identified.

## 📊 Market Overview
| Market | Odds | SM Position | Divergence | Volume |
...

## 🏦 Smart Money Leaderboard
| Rank | Address | Label | Markets | Capital |
...
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
│   ├── formatter.ts      # Terminal + Markdown output
│   └── mock.ts           # Mock data generator
└── types/
    ├── market.ts         # Prediction market types
    ├── smartmoney.ts     # SM labels + enriched holders
    └── report.ts         # Analysis output types
```

## Nansen CLI Endpoints Used (15+)

<p align="center">
  <img src="docs/screenshots/nansen-usage-analytic.png" alt="Nansen API Usage Analytics" width="720" />
</p>

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `research prediction-market market-screener` | Discover active markets |
| 2 | `research prediction-market event-screener` | Event-level overview |
| 3 | `research prediction-market top-holders` | Who holds positions |
| 4 | `research prediction-market trades-by-market` | Trading activity |
| 5 | `research prediction-market pnl-by-market` | PnL leaderboard |
| 6 | `research prediction-market ohlcv` | Price history |
| 7 | `research prediction-market orderbook` | Liquidity depth |
| 8 | `research profiler labels` | Wallet classification |
| 9 | `research profiler pnl-summary` | Wallet performance |
| 10 | `research smart-money netflow` | Cross-chain flow context |
| 11 | `research token info` | Related token context |
| 12 | `research prediction-market pnl-by-address` | SM prediction accuracy |
| 13 | `research prediction-market trades-by-address` | SM trading patterns |
| 14 | `research prediction-market categories` | Market categorization |
| 15 | `research prediction-market position-detail` | Position breakdown |

## Testing

```bash
# Run all tests (44 tests across 4 suites)
npm test

# Tests cover:
# - Divergence algorithm (capital-weighting, edge cases, score bounds)
# - SM enrichment (label matching, batch processing)
# - TTL cache (expiry, invalidation)
# - Mock data generation (market count, SM placement)
```

## Development

The project includes a full mock data system for offline development:

```bash
# Set NANSEN_MOCK=true to avoid API calls
export NANSEN_MOCK=true

# All commands work identically with mock data
nansen-oracle scan --limit 5
```

Mock data is generated deterministically with strategically placed Smart Money wallets to ensure meaningful divergence scores.

## Built For

🏆 **Nansen CLI Build Challenge — Week 3** • *Build Something Real*

| Criteria | How Oracle Delivers |
|----------|---------------------|
| **Creativity** | First prediction market × Smart Money cross-reference tool |
| **Usefulness** | Directly actionable: "SM says this market is mispriced, here's why" |
| **Technical Depth** | 15+ endpoints, cross-referencing, divergence algorithm, TypeScript |
| **Presentation** | Output IS the pitch — "SM bets $7.9M that BTC hits $200K" |

---

> 📊 Data by [Nansen](https://nansen.ai) | `#NansenCLI` `@nansen_ai`
