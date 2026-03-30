#!/usr/bin/env bash
#
# 🔮 Nansen Polymarket Oracle — Quick Demo
#
# Runs the full CLI pipeline using real recorded API data (no API key required).
# Data source: nansen-record.log (captured from a live Nansen API session).
#
# Modes:
#   bash demo.sh          → Replay real data from nansen-record.log
#   bash demo.sh mock     → Use synthetic mock data
#   bash demo.sh live     → Hit the live Nansen API (requires API key)
#

set -euo pipefail

MODE="${1:-replay}"

case "$MODE" in
  mock)
    export NANSEN_MOCK=true
    LABEL="Mock Data"
    ;;
  live)
    # No env var — uses real API
    LABEL="Live API"
    ;;
  *)
    export NANSEN_REPLAY=true
    LABEL="Recorded Real Data"
    ;;
esac

clear

# Set terminal window/tab title
echo -ne "\033]0;🔮 Nansen Polymarket Oracle\007"

# ─── ASCII Art Splash ───────────────────────────────────────────────
echo ""
echo "  ███╗   ██╗ █████╗ ███╗   ██╗███████╗███████╗███╗   ██╗"
echo "  ████╗  ██║██╔══██╗████╗  ██║██╔════╝██╔════╝████╗  ██║"
echo "  ██╔██╗ ██║███████║██╔██╗ ██║███████╗█████╗  ██╔██╗ ██║"
echo "  ██║╚██╗██║██╔══██║██║╚██╗██║╚════██║██╔══╝  ██║╚██╗██║"
echo "  ██║ ╚████║██║  ██║██║ ╚████║███████║███████╗██║ ╚████║"
echo "  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═══╝"
echo ""
echo "  ██████╗ ██████╗  █████╗  ██████╗██╗     ███████╗"
echo "  ██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝"
echo "  ██║   ██║██████╔╝███████║██║     ██║     █████╗  "
echo "  ██║   ██║██╔══██╗██╔══██║██║     ██║     ██╔══╝  "
echo "  ╚██████╔╝██║  ██║██║  ██║╚██████╗███████╗███████╗"
echo "   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝"
echo ""
echo "  🔮 Polymarket × Smart Money Intelligence  [$LABEL]"
echo ""

sleep 1

# ─── 1. Scan ────────────────────────────────────────────────────────
echo "━━━ 1/3: Scanning Active Markets ━━━"
echo ""
nansen-oracle scan --limit 10
echo ""

# ─── 2. Analyze ─────────────────────────────────────────────────────
if [ "$MODE" = "mock" ]; then
  MARKET_ID="pm_btc_200k_june"
  MARKET_LABEL="Will Bitcoin hit \$200K by June 2026?"
else
  # Use a real market ID from the recorded data
  MARKET_ID="558978"
  MARKET_LABEL="Will Curaçao win the 2026 FIFA World Cup?"
fi

echo "━━━ 2/3: Deep Analysis → '$MARKET_LABEL' ━━━"
echo ""
nansen-oracle analyze "$MARKET_ID"
echo ""

# ─── 3. Report ──────────────────────────────────────────────────────
echo "━━━ 3/3: Generating Alpha Report ━━━"
echo ""
nansen-oracle report --format md --output reports/demo-report.md --limit 10
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ Demo Complete — All 3 commands executed successfully  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📄 Report saved: reports/demo-report.md"
echo ""
echo "💡 Usage:"
echo "   bash demo.sh          # Replay recorded real data (default)"
echo "   bash demo.sh mock     # Use synthetic mock data"
echo "   bash demo.sh live     # Hit the live Nansen API"
echo ""
