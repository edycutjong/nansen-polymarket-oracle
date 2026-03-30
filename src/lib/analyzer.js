"use strict";
/**
 * Analyzer — The divergence score calculator.
 *
 * SM Divergence Score: -100 to +100
 * - Positive = SM more bullish (weighted toward YES) than market odds
 * - Negative = SM more bearish (weighted toward NO) than market odds
 * - Zero = SM and market agree
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDivergence = calculateDivergence;
exports.classifyDivergence = classifyDivergence;
exports.divergenceEmoji = divergenceEmoji;
exports.analyzeMarket = analyzeMarket;
exports.sortByDivergence = sortByDivergence;
exports.filterAlerts = filterAlerts;
exports.buildSmLeaderboard = buildSmLeaderboard;
// ---------------------------------------------------------------------------
// Divergence Score
// ---------------------------------------------------------------------------
/**
 * Calculate the SM Divergence Score for a market.
 *
 * The score is capital-weighted: a whale holding $500K YES counts more
 * than a smart trader holding $5K YES.
 *
 * @param marketOdds - Current YES price (0.0 to 1.0)
 * @param smHolders - Enriched SM holders for this market
 * @returns Score from -100 to +100
 */
function calculateDivergence(marketOdds, smHolders) {
    if (smHolders.length === 0)
        return 0;
    var totalSmCapital = smHolders.reduce(function (sum, h) { return sum + h.value_usd; }, 0);
    if (totalSmCapital === 0)
        return 0;
    // Capital-weighted SM conviction
    var smConviction = smHolders.reduce(function (acc, holder) {
        var weight = holder.value_usd / totalSmCapital;
        return acc + (holder.position === 'YES' ? weight : -weight);
    }, 0);
    // Normalize convicton from [-1, 1] to [0, 1] for comparison
    var smOdds = (smConviction + 1) / 2;
    // Divergence = SM odds - Market odds (in percentage points)
    return Math.round((smOdds - marketOdds) * 100);
}
/**
 * Classify divergence level for display.
 */
function classifyDivergence(score) {
    var abs = Math.abs(score);
    if (abs >= 40)
        return 'EXTREME';
    if (abs >= 30)
        return 'HIGH';
    if (abs >= 15)
        return 'MODERATE';
    if (abs >= 5)
        return 'LOW';
    return 'ALIGNED';
}
/**
 * Get the emoji for a divergence level.
 */
function divergenceEmoji(level) {
    switch (level) {
        case 'EXTREME': return '🔥';
        case 'HIGH': return '⚠️';
        case 'MODERATE': return '📊';
        case 'LOW': return '✅';
        case 'ALIGNED': return '🤝';
    }
}
// ---------------------------------------------------------------------------
// Market Analysis
// ---------------------------------------------------------------------------
/**
 * Analyze a single market: compute divergence from enriched holders.
 */
function analyzeMarket(market, smHolders, totalHoldersScanned) {
    var score = calculateDivergence(market.yes_price, smHolders);
    var level = classifyDivergence(score);
    var yesHolders = smHolders.filter(function (h) { return h.position === 'YES'; });
    var smYesRatio = smHolders.length > 0
        ? yesHolders.length / smHolders.length
        : 0;
    var totalCapital = smHolders.reduce(function (sum, h) { return sum + h.value_usd; }, 0);
    return {
        market: market,
        divergence_score: score,
        divergence_level: level,
        sm_yes_ratio: smYesRatio,
        sm_total_capital_usd: totalCapital,
        sm_holder_count: smHolders.length,
        total_holders_scanned: totalHoldersScanned,
        sm_holders: smHolders,
        analyzed_at: new Date().toISOString(),
    };
}
/**
 * Sort analyses by absolute divergence score (highest first).
 */
function sortByDivergence(analyses) {
    return __spreadArray([], analyses, true).sort(function (a, b) { return Math.abs(b.divergence_score) - Math.abs(a.divergence_score); });
}
/**
 * Filter to only high-divergence alerts (|score| >= threshold).
 */
function filterAlerts(analyses, threshold) {
    if (threshold === void 0) { threshold = 30; }
    return analyses.filter(function (a) { return Math.abs(a.divergence_score) >= threshold; });
}
// ---------------------------------------------------------------------------
// SM Leaderboard
// ---------------------------------------------------------------------------
/**
 * Build an SM leaderboard aggregated across all analyzed markets.
 */
function buildSmLeaderboard(analyses) {
    var addressMap = new Map();
    for (var _i = 0, analyses_1 = analyses; _i < analyses_1.length; _i++) {
        var analysis = analyses_1[_i];
        for (var _a = 0, _b = analysis.sm_holders; _a < _b.length; _a++) {
            var holder = _b[_a];
            var existing = addressMap.get(holder.address);
            if (existing) {
                existing.markets++;
                existing.capital += holder.value_usd;
                existing.divergences.push(analysis.divergence_score);
            }
            else {
                addressMap.set(holder.address, {
                    label_summary: holder.label_summary,
                    markets: 1,
                    capital: holder.value_usd,
                    divergences: [analysis.divergence_score],
                });
            }
        }
    }
    return Array.from(addressMap.entries())
        .map(function (_a) {
        var address = _a[0], data = _a[1];
        return ({
            address: address,
            label_summary: data.label_summary,
            markets_active: data.markets,
            total_capital_usd: data.capital,
            avg_divergence: Math.round(data.divergences.reduce(function (a, b) { return a + b; }, 0) / data.divergences.length),
        });
    })
        .sort(function (a, b) { return b.total_capital_usd - a.total_capital_usd; });
}
