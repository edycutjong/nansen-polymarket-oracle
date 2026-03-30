#!/usr/bin/env bash
#
# 🔮 Nansen Polymarket Oracle — Quick Demo
#
# Run all CLI commands with mock data (no API key required).
# Usage: bash demo.sh
#

set -euo pipefail

export NANSEN_MOCK=true

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  🔮 Nansen Polymarket Oracle — Live Mock Demo  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# ─── 1. Scan ────────────────────────────────────────────────────────
echo "━━━ 1/4: Scanning Active Markets ━━━"
echo ""
nansen-oracle scan --limit 8
echo ""

# ─── 2. Analyze ─────────────────────────────────────────────────────
echo "━━━ 2/4: Analyzing 'Will Bitcoin hit \$200K by June 2026?' ━━━"
echo ""
nansen-oracle analyze pm_btc_200k_june
echo ""

# ─── 3. Report (Markdown) ──────────────────────────────────────────
echo "━━━ 3/4: Generating Full Alpha Report ━━━"
echo ""
nansen-oracle report --format md --output reports/demo-report.md --limit 10
echo ""

echo "━━━ 4/4: Report saved! ━━━"
echo ""
echo "📄 Markdown report: reports/demo-report.md"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ Demo Complete — All 3 commands executed successfully  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "💡 Tip: Run 'NANSEN_MOCK=true nansen-oracle watch pm_btc_200k_june --interval 5'"
echo "   to try real-time monitoring (press Ctrl+C to stop)."
echo ""
