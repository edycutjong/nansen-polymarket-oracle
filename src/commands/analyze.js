"use strict";
/**
 * `nansen-oracle analyze` command
 *
 * Deep-dives into a specific market: enriched holder breakdown,
 * trading activity, PnL leaderboard, and price history.
 */
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
exports.analyzeCommand = analyzeCommand;
var chalk_1 = require("chalk");
var ora_1 = require("ora");
var nansen_js_1 = require("../lib/nansen.js");
var enricher_js_1 = require("../lib/enricher.js");
var analyzer_js_1 = require("../lib/analyzer.js");
var formatter_js_1 = require("../lib/formatter.js");
function analyzeCommand(options) {
    return __awaiter(this, void 0, void 0, function () {
        var marketId, _a, chain, infoSpinner, screenResult, market, holderSpinner, holdersResult, holders, enrichSpinner, enrichedHolders, smHolders, analysis, obSpinner, orderbookRes, ohlcvRes, ob, ohlcv, latest, oldest, change, trendColor, tradeSpinner, tradesResult, trades, smAddresses_1, smTrades, _i, _b, t, pnlSpinner, pnlResult, pnlEntries;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    marketId = options.marketId, _a = options.chain, chain = _a === void 0 ? 'ethereum' : _a;
                    console.log('');
                    console.log(chalk_1.default.cyan.bold('🔮 Nansen Polymarket Oracle — Deep Analysis'));
                    console.log(chalk_1.default.gray("Market ID: ".concat(marketId)));
                    console.log('');
                    infoSpinner = (0, ora_1.default)('Fetching market info...').start();
                    return [4 /*yield*/, (0, nansen_js_1.fetchMarketScreener)(100)];
                case 1:
                    screenResult = _c.sent();
                    if (screenResult.success && Array.isArray(screenResult.data)) {
                        market = screenResult.data.find(function (m) { return m.market_id === marketId || m.market_slug === marketId; });
                    }
                    if (!market) {
                        // Construct minimal market object if not found in screener
                        market = {
                            market_id: marketId,
                            question: "Market ".concat(marketId),
                            yes_price: 0.5,
                            volume_usd: 0,
                        };
                        infoSpinner.warn('Market not found in screener, using defaults');
                    }
                    else {
                        infoSpinner.succeed("Market: \"".concat(market.question, "\""));
                    }
                    holderSpinner = (0, ora_1.default)('Fetching top holders...').start();
                    return [4 /*yield*/, (0, nansen_js_1.fetchTopHolders)(marketId, 100)];
                case 2:
                    holdersResult = _c.sent();
                    if (!holdersResult.success || !holdersResult.data) {
                        holderSpinner.fail('Failed to fetch holders');
                        console.error(chalk_1.default.red("Error: ".concat(holdersResult.error)));
                        return [2 /*return*/];
                    }
                    holders = holdersResult.data;
                    holderSpinner.succeed("Found ".concat(holders.length, " holders"));
                    enrichSpinner = (0, ora_1.default)('Cross-referencing with Smart Money labels...').start();
                    return [4 /*yield*/, (0, enricher_js_1.enrichHolders)(holders, chain, 5)];
                case 3:
                    enrichedHolders = _c.sent();
                    smHolders = (0, enricher_js_1.filterSmartMoney)(enrichedHolders);
                    enrichSpinner.succeed("Identified ".concat(smHolders.length, " Smart Money holders"));
                    analysis = (0, analyzer_js_1.analyzeMarket)(market, smHolders, holders.length);
                    (0, formatter_js_1.printMarketDetail)(analysis);
                    obSpinner = (0, ora_1.default)('Fetching liquidity and trends...').start();
                    return [4 /*yield*/, (0, nansen_js_1.fetchMarketOrderbook)(marketId)];
                case 4:
                    orderbookRes = _c.sent();
                    return [4 /*yield*/, (0, nansen_js_1.fetchMarketOHLCV)(marketId)];
                case 5:
                    ohlcvRes = _c.sent();
                    obSpinner.stop();
                    if (orderbookRes.success && orderbookRes.data) {
                        ob = orderbookRes.data;
                        console.log(chalk_1.default.white.bold('  Liquidity & Spread:'));
                        console.log("    Spread: ".concat((ob.spread * 100).toFixed(2), "% | Midpoint: ").concat((ob.midpoint * 100).toFixed(1), "\u00A2"));
                    }
                    if (ohlcvRes.success && ohlcvRes.data && Array.isArray(ohlcvRes.data)) {
                        ohlcv = ohlcvRes.data;
                        if (ohlcv.length > 0) {
                            latest = ohlcv[ohlcv.length - 1];
                            oldest = ohlcv[0];
                            change = latest.close - oldest.close;
                            trendColor = change >= 0 ? chalk_1.default.green : chalk_1.default.red;
                            console.log(chalk_1.default.white.bold('  Price Trend (24h):'));
                            console.log("    ".concat(trendColor(change >= 0 ? 'UP' : 'DOWN'), " | Open: ").concat((oldest.open * 100).toFixed(1), "\u00A2 -> Close: ").concat((latest.close * 100).toFixed(1), "\u00A2"));
                        }
                    }
                    console.log(chalk_1.default.gray('─'.repeat(70)));
                    console.log('');
                    tradeSpinner = (0, ora_1.default)('Fetching recent trades...').start();
                    return [4 /*yield*/, (0, nansen_js_1.fetchTradesByMarket)(marketId, 20)];
                case 6:
                    tradesResult = _c.sent();
                    if (tradesResult.success && Array.isArray(tradesResult.data)) {
                        trades = tradesResult.data;
                        tradeSpinner.succeed("".concat(trades.length, " recent trades"));
                        smAddresses_1 = new Set(smHolders.map(function (h) { return h.address.toLowerCase(); }));
                        smTrades = trades.filter(function (t) { return typeof t.address === 'string' && smAddresses_1.has(t.address.toLowerCase()); });
                        if (smTrades.length > 0) {
                            console.log(chalk_1.default.white.bold('  Recent SM Trades:'));
                            for (_i = 0, _b = smTrades.slice(0, 5); _i < _b.length; _i++) {
                                t = _b[_i];
                                console.log(chalk_1.default.gray("    ".concat(t.side, " ").concat(t.outcome, " \u2014 $").concat(Number(t.value_usd || 0).toFixed(0), " @ ").concat(t.timestamp)));
                            }
                        }
                    }
                    else {
                        tradeSpinner.info('No trade data available');
                    }
                    pnlSpinner = (0, ora_1.default)('Fetching PnL leaderboard...').start();
                    return [4 /*yield*/, (0, nansen_js_1.fetchPnlByMarket)(marketId, 10)];
                case 7:
                    pnlResult = _c.sent();
                    if (pnlResult.success && Array.isArray(pnlResult.data)) {
                        pnlEntries = pnlResult.data;
                        pnlSpinner.succeed("PnL data for ".concat(pnlEntries.length, " traders"));
                    }
                    else {
                        pnlSpinner.info('No PnL data available');
                    }
                    console.log('');
                    console.log(chalk_1.default.gray("Total API calls: ".concat((0, nansen_js_1.getApiCallCount)())));
                    console.log('');
                    return [2 /*return*/];
            }
        });
    });
}
