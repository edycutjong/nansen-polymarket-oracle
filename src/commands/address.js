"use strict";
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
exports.addressCommand = addressCommand;
var ora_1 = require("ora");
var chalk_1 = require("chalk");
var nansen_js_1 = require("../lib/nansen.js");
var formatter_js_1 = require("../lib/formatter.js");
function addressCommand(address) {
    return __awaiter(this, void 0, void 0, function () {
        var spinner, labelsRes, summaryRes, pmPnlRes, tradesRes, labels, data, positions, trades, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(chalk_1.default.cyan("\n\uD83D\uDD2E Nansen Polymarket Oracle \u2014 Address Analysis"));
                    console.log(chalk_1.default.gray("Target: ".concat(address, "\n")));
                    spinner = (0, ora_1.default)('Fetching address profile and labels from Nansen...').start();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, nansen_js_1.fetchProfilerLabels)(address)];
                case 2:
                    labelsRes = _a.sent();
                    // 2. Fetch general Pnl Summary
                    spinner.text = 'Fetching generic wallet PnL summary...';
                    return [4 /*yield*/, (0, nansen_js_1.fetchPnlSummary)(address)];
                case 3:
                    summaryRes = _a.sent();
                    // 3. Fetch Prediction Market specific PNL
                    spinner.text = 'Fetching prediction market PnL history...';
                    return [4 /*yield*/, (0, nansen_js_1.fetchPnlByAddress)(address)];
                case 4:
                    pmPnlRes = _a.sent();
                    // 4. Fetch recent trades
                    spinner.text = 'Fetching recent prediction market trades...';
                    return [4 /*yield*/, (0, nansen_js_1.fetchTradesByAddress)(address, 10)];
                case 5:
                    tradesRes = _a.sent();
                    spinner.stop();
                    // --- RENDER LABELS ---
                    if (labelsRes.success && labelsRes.data && labelsRes.data.length > 0) {
                        labels = labelsRes.data.map(function (l) { return l.label || l.name || String(l); }).join(', ');
                        console.log("".concat(chalk_1.default.bold('Labels:'), " ").concat(chalk_1.default.green(labels)));
                    }
                    else {
                        console.log("".concat(chalk_1.default.bold('Labels:'), " ").concat(chalk_1.default.gray('None / Unclassified')));
                    }
                    // --- RENDER OVERALL SUMMARY ---
                    if (summaryRes.success && summaryRes.data) {
                        data = summaryRes.data;
                        console.log("\n".concat(chalk_1.default.bold.underline('Overall Wallet PnL (All Chains)')));
                        console.log("Realized PnL:   ".concat((0, formatter_js_1.formatCurrency)(data.total_realized_pnl_usd || 0)));
                        console.log("Unrealized PnL: ".concat((0, formatter_js_1.formatCurrency)(data.total_unrealized_pnl_usd || 0)));
                        if (data.win_rate !== undefined) {
                            console.log("Win Rate:       ".concat((0, formatter_js_1.formatPercent)(data.win_rate)));
                        }
                        console.log("Best Trade:     ".concat((0, formatter_js_1.formatCurrency)(data.best_trade_usd || 0)));
                        console.log("Worst Trade:    ".concat((0, formatter_js_1.formatCurrency)(data.worst_trade_usd || 0)));
                    }
                    // --- RENDER PM PNL ---
                    console.log("\n".concat(chalk_1.default.bold.underline('Top Prediction Market Positions')));
                    if (pmPnlRes.success && pmPnlRes.data && Array.isArray(pmPnlRes.data)) {
                        positions = pmPnlRes.data;
                        if (positions.length === 0) {
                            console.log(chalk_1.default.gray('  No active or historical prediction market positions found.'));
                        }
                        else {
                            positions.slice(0, 5).forEach(function (p) {
                                var color = p.total_pnl_usd >= 0 ? chalk_1.default.green : chalk_1.default.red;
                                console.log("  ".concat(chalk_1.default.bold(p.question || p.market_id)));
                                console.log("    Position: ".concat(p.position || 'Unknown', " | PnL: ").concat(color((0, formatter_js_1.formatCurrency)(p.total_pnl_usd))));
                            });
                        }
                    }
                    else {
                        console.log(chalk_1.default.gray('  Could not load prediction market PnL.'));
                    }
                    // --- RENDER TRADES ---
                    console.log("\n".concat(chalk_1.default.bold.underline('Recent Prediction Market Trades')));
                    if (tradesRes.success && tradesRes.data && Array.isArray(tradesRes.data)) {
                        trades = tradesRes.data;
                        if (trades.length === 0) {
                            console.log(chalk_1.default.gray('  No recent trades.'));
                        }
                        else {
                            trades.slice(0, 10).forEach(function (t) {
                                var _a;
                                var sideColor = ((_a = t.side) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'BUY' ? chalk_1.default.green : chalk_1.default.red;
                                var date = t.timestamp ? new Date(t.timestamp).toLocaleDateString() : 'Unknown Date';
                                console.log("  ".concat(sideColor(t.side), " ").concat(t.outcome, " \u2014 ").concat((0, formatter_js_1.formatCurrency)(t.value_usd), " @ ").concat(date));
                            });
                        }
                    }
                    else {
                        console.log(chalk_1.default.gray('  Could not load recent trades.'));
                    }
                    console.log();
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    spinner.fail('Failed to analyze address');
                    console.error(chalk_1.default.red(err_1.message || String(err_1)));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
