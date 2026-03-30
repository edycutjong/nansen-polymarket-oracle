"use strict";
/**
 * Formatter — Terminal and Markdown output rendering.
 * Uses Chalk for beautiful terminal colors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPercent = formatPercent;
exports.formatCurrency = formatCurrency;
exports.printScanTable = printScanTable;
exports.printMarketDetail = printMarketDetail;
exports.generateMarkdownReport = generateMarkdownReport;
var chalk_1 = require("chalk");
// ---------------------------------------------------------------------------
// Color Helpers
// ---------------------------------------------------------------------------
var colors = {
    EXTREME: chalk_1.default.red.bold,
    HIGH: chalk_1.default.yellow.bold,
    MODERATE: chalk_1.default.blue,
    LOW: chalk_1.default.green,
    ALIGNED: chalk_1.default.gray,
};
function colorScore(score, level, width) {
    if (width === void 0) { width = 0; }
    var prefix = score > 0 ? '+' : '';
    var text = width > 0 ? padEnd("".concat(prefix).concat(score), width) : "".concat(prefix).concat(score);
    return colors[level](text);
}
function emoji(level) {
    var map = {
        EXTREME: '🔥', HIGH: '⚠️', MODERATE: '📊', LOW: '✅', ALIGNED: '🤝',
    };
    return map[level];
}
function formatPercent(value) {
    return "".concat(Math.round(value * 100), "%");
}
function formatCurrency(value) {
    if (value >= 1000000)
        return "$".concat((value / 1000000).toFixed(1), "M");
    if (value >= 1000)
        return "$".concat((value / 1000).toFixed(1), "K");
    return "$".concat(value.toFixed(0));
}
function truncAddr(address) {
    if (address.length <= 12)
        return address;
    return "".concat(address.slice(0, 6), "...").concat(address.slice(-4));
}
// ---------------------------------------------------------------------------
// Terminal Table Output
// ---------------------------------------------------------------------------
/**
 * Print the scan summary table to terminal.
 */
function printScanTable(analyses) {
    console.log('');
    console.log(chalk_1.default.cyan.bold('🔮 Nansen Polymarket Oracle — Scan Results'));
    console.log(chalk_1.default.gray('─'.repeat(90)));
    console.log(chalk_1.default.gray(padEnd('Market', 40) +
        padEnd('Odds', 8) +
        padEnd('SM Pos', 10) +
        padEnd('Diverg.', 10) +
        padEnd('SM $', 10) +
        padEnd('SM #', 6) +
        'Level'));
    console.log(chalk_1.default.gray('─'.repeat(90)));
    for (var _i = 0, analyses_1 = analyses; _i < analyses_1.length; _i++) {
        var a = analyses_1[_i];
        var question = a.market.question.length > 38
            ? a.market.question.slice(0, 35) + '...'
            : a.market.question;
        console.log(padEnd(question, 40) +
            padEnd(formatPercent(a.market.yes_price) + ' YES', 8) +
            padEnd(formatPercent(a.sm_yes_ratio) + ' YES', 10) +
            colorScore(a.divergence_score, a.divergence_level, 10) +
            padEnd(formatCurrency(a.sm_total_capital_usd), 10) +
            padEnd(String(a.sm_holder_count), 6) +
            "".concat(emoji(a.divergence_level), " ").concat(a.divergence_level));
    }
    console.log(chalk_1.default.gray('─'.repeat(90)));
    console.log('');
}
/**
 * Print a detailed market analysis to terminal.
 */
function printMarketDetail(analysis) {
    var a = analysis;
    console.log('');
    console.log(chalk_1.default.cyan.bold("\uD83D\uDD2E ".concat(a.market.question)));
    console.log(chalk_1.default.gray('─'.repeat(70)));
    var rows = [
        ['Market Odds', "".concat(formatPercent(a.market.yes_price), " YES")],
        ['SM Position', "".concat(formatPercent(a.sm_yes_ratio), " YES (").concat(a.sm_holder_count, " of ").concat(a.total_holders_scanned, " holders)")],
        ['Divergence Score', "".concat(colorScore(a.divergence_score, a.divergence_level), " ").concat(emoji(a.divergence_level), " ").concat(a.divergence_level)],
        ['SM Capital Deployed', formatCurrency(a.sm_total_capital_usd)],
        ['Volume', formatCurrency(a.market.volume_usd)],
        ['Category', a.market.category || 'N/A'],
    ];
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var _a = rows_1[_i], label = _a[0], value = _a[1];
        console.log("  ".concat(chalk_1.default.white.bold(padEnd(label, 22)), " ").concat(value));
    }
    if (a.sm_holders.length > 0) {
        console.log('');
        console.log(chalk_1.default.white.bold('  Smart Money Holders:'));
        console.log(chalk_1.default.gray('  ' + padEnd('Address', 16) + padEnd('Label', 22) + padEnd('Pos', 6) + padEnd('Value', 12)));
        for (var _b = 0, _c = a.sm_holders.slice(0, 10); _b < _c.length; _b++) {
            var h = _c[_b];
            console.log("  ".concat(padEnd(truncAddr(h.address), 16)) +
                "".concat(padEnd(h.label_summary.slice(0, 20), 22)) +
                "".concat(padEnd(h.position, 6)) +
                "".concat(formatCurrency(h.value_usd)));
        }
        if (a.sm_holders.length > 10) {
            console.log(chalk_1.default.gray("  ... and ".concat(a.sm_holders.length - 10, " more")));
        }
    }
    console.log(chalk_1.default.gray('─'.repeat(70)));
    console.log('');
}
// ---------------------------------------------------------------------------
// Markdown Report
// ---------------------------------------------------------------------------
/**
 * Generate a full Markdown report.
 */
function generateMarkdownReport(report) {
    var lines = [];
    lines.push('# 🔮 Nansen Polymarket Oracle Report');
    lines.push('');
    lines.push("Generated: ".concat(new Date(report.generated_at).toLocaleString()));
    lines.push("Markets Scanned: ".concat(report.total_markets_scanned, " | API Calls: ").concat(report.total_api_calls));
    lines.push('');
    // Alerts section
    if (report.alerts.length > 0) {
        lines.push('## 🚨 High Divergence Alerts (SM ≠ Market)');
        lines.push('');
        for (var _i = 0, _a = report.alerts.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], i = _b[0], a = _b[1];
            lines.push("### ".concat(i + 1, ". \"").concat(a.market.question, "\""));
            lines.push('');
            lines.push('| Metric | Value |');
            lines.push('|--------|-------|');
            lines.push("| Market Odds | ".concat(formatPercent(a.market.yes_price), " YES |"));
            lines.push("| SM Position | ".concat(formatPercent(a.sm_yes_ratio), " YES (").concat(a.sm_holder_count, " SM wallets) |"));
            lines.push("| **Divergence Score** | **".concat(a.divergence_score > 0 ? '+' : '').concat(a.divergence_score, " pts (").concat(a.divergence_level, ")** |"));
            lines.push("| SM Capital Deployed | ".concat(formatCurrency(a.sm_total_capital_usd), " |"));
            lines.push("| Volume | ".concat(formatCurrency(a.market.volume_usd), " |"));
            if (a.sm_holders.length > 0) {
                var topHolder = a.sm_holders[0];
                lines.push("| Top SM Holder | ".concat(truncAddr(topHolder.address), " (").concat(topHolder.label_summary, ") |"));
            }
            lines.push('');
            var direction = a.divergence_score > 0 ? 'bullish' : 'bearish';
            lines.push("> \uD83E\uDDE0 **Insight**: Smart Money is **".concat(direction, "** on this outcome despite ") +
                "".concat(a.divergence_score > 0 ? 'low' : 'high', " market odds. ") +
                "".concat(a.sm_holder_count, " SM wallets identified."));
            lines.push('');
        }
    }
    // Market Overview Table
    lines.push('## 📊 Market Overview');
    lines.push('');
    lines.push('| Market | Odds | SM Position | Divergence | Volume |');
    lines.push('|--------|------|-------------|------------|--------|');
    for (var _c = 0, _d = report.analyses; _c < _d.length; _c++) {
        var a = _d[_c];
        var scoreStr = "".concat(a.divergence_score > 0 ? '+' : '').concat(a.divergence_score);
        var emojiStr = a.divergence_level === 'EXTREME' || a.divergence_level === 'HIGH'
            ? '🔥' : a.divergence_level === 'MODERATE' ? '📊' : '✅';
        var question = a.market.question.length > 35
            ? a.market.question.slice(0, 32) + '...'
            : a.market.question;
        lines.push("| ".concat(question, " | ").concat(formatPercent(a.market.yes_price), " YES | ").concat(formatPercent(a.sm_yes_ratio), " YES | ").concat(emojiStr, " ").concat(scoreStr, " | ").concat(formatCurrency(a.market.volume_usd), " |"));
    }
    lines.push('');
    // SM Leaderboard
    if (report.sm_leaderboard.length > 0) {
        lines.push('## 🏦 Smart Money Leaderboard');
        lines.push('');
        lines.push('| Rank | Address | Label | Markets | Capital |');
        lines.push('|------|---------|-------|---------|---------|');
        for (var _e = 0, _f = report.sm_leaderboard.slice(0, 15).entries(); _e < _f.length; _e++) {
            var _g = _f[_e], i = _g[0], entry = _g[1];
            lines.push("| ".concat(i + 1, " | ").concat(truncAddr(entry.address), " | ").concat(entry.label_summary.slice(0, 20), " | ").concat(entry.markets_active, " | ").concat(formatCurrency(entry.total_capital_usd), " |"));
        }
        lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('> 📊 Data by [Nansen](https://nansen.ai) | Built for #NansenCLI Week 3');
    lines.push('');
    return lines.join('\n');
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function padEnd(str, length) {
    return str.padEnd(length);
}
