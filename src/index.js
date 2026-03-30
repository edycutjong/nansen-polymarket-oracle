#!/usr/bin/env node
"use strict";
/**
 * Nansen Polymarket Oracle
 *
 * Smart Money × Prediction Market Intelligence
 * Cross-reference whale positions with market odds to find alpha.
 *
 * Usage:
 *   nansen-oracle scan              # Discover mispriced markets
 *   nansen-oracle analyze <market>  # Deep dive into a market
 *   nansen-oracle report            # Generate full alpha report
 *   nansen-oracle watch <market>    # Real-time monitoring
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var chalk_1 = require("chalk");
var scan_js_1 = require("./commands/scan.js");
var analyze_js_1 = require("./commands/analyze.js");
var report_js_1 = require("./commands/report.js");
var watch_js_1 = require("./commands/watch.js");
var address_js_1 = require("./commands/address.js");
var nansen_js_1 = require("./lib/nansen.js");
var program = new commander_1.Command();
program
    .name('nansen-oracle')
    .description('🔮 Smart Money × Prediction Market Intelligence\n' +
    'Cross-reference whale positions with market odds to find alpha.')
    .version('1.0.0');
// ─── scan ─────────────────────────────────────────────────────────────────────
program
    .command('scan')
    .description('Scan active prediction markets for SM divergence')
    .option('-c, --category <category>', 'Filter by market category')
    .option('-v, --min-volume <usd>', 'Minimum volume in USD', '10000')
    .option('-l, --limit <number>', 'Number of markets to scan', '20')
    .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ensureNansen()];
            case 1:
                _a.sent();
                (0, nansen_js_1.resetApiCallCount)();
                return [4 /*yield*/, (0, scan_js_1.scanCommand)(options)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// ─── analyze ──────────────────────────────────────────────────────────────────
program
    .command('analyze <market-id>')
    .description('Deep analysis of a specific prediction market')
    .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
    .action(function (marketId, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ensureNansen()];
            case 1:
                _a.sent();
                (0, nansen_js_1.resetApiCallCount)();
                return [4 /*yield*/, (0, analyze_js_1.analyzeCommand)(__assign({ marketId: marketId }, options))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// ─── report ───────────────────────────────────────────────────────────────────
program
    .command('report')
    .description('Generate a full alpha report (Markdown or JSON)')
    .option('-f, --format <format>', 'Output format: md, json, table', 'md')
    .option('-o, --output <path>', 'Output file path')
    .option('-c, --category <category>', 'Filter by market category')
    .option('-v, --min-volume <usd>', 'Minimum volume in USD', '10000')
    .option('-l, --limit <number>', 'Number of markets to scan', '30')
    .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ensureNansen()];
            case 1:
                _a.sent();
                (0, nansen_js_1.resetApiCallCount)();
                return [4 /*yield*/, (0, report_js_1.reportCommand)(options)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// ─── watch ────────────────────────────────────────────────────────────────────
program
    .command('watch <market-id>')
    .description('Real-time monitoring of a prediction market')
    .option('-i, --interval <seconds>', 'Scan interval in seconds', '60')
    .option('--chain <chain>', 'Chain for profiler lookups', 'ethereum')
    .action(function (marketId, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ensureNansen()];
            case 1:
                _a.sent();
                (0, nansen_js_1.resetApiCallCount)();
                return [4 /*yield*/, (0, watch_js_1.watchCommand)(__assign({ marketId: marketId }, options))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// ─── address ──────────────────────────────────────────────────────────────────
program
    .command('address <address>')
    .description('Investigate a specific trader address to show prediction market PnL, trades, and Smart Money profile')
    .action(function (address) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ensureNansen()];
            case 1:
                _a.sent();
                (0, nansen_js_1.resetApiCallCount)();
                return [4 /*yield*/, (0, address_js_1.addressCommand)(address)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// ─── Bootstrap ────────────────────────────────────────────────────────────────
function ensureNansen() {
    return __awaiter(this, void 0, void 0, function () {
        var installed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, nansen_js_1.checkNansenInstalled)()];
                case 1:
                    installed = _a.sent();
                    if (!installed) {
                        console.error(chalk_1.default.red('❌ Nansen CLI not found.'));
                        console.error(chalk_1.default.gray('   Install: npm install -g @anthropic-ai/nansen-cli'));
                        console.error(chalk_1.default.gray('   Then:    nansen auth login'));
                        process.exit(1);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
program.parse();
