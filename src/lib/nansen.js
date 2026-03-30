"use strict";
/**
 * Nansen CLI wrapper — evolved from NansenTerm's lib/nansen.ts.
 * Executes nansen-cli commands via child_process and parses JSON output.
 *
 * Supports NANSEN_MOCK=true for local dev/testing without live API.
 * Added prediction-market specific wrappers + profiler batch support.
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
exports.getApiCallCount = getApiCallCount;
exports.resetApiCallCount = resetApiCallCount;
exports.execNansen = execNansen;
exports.fetchMarketScreener = fetchMarketScreener;
exports.fetchEventScreener = fetchEventScreener;
exports.fetchTopHolders = fetchTopHolders;
exports.fetchTradesByMarket = fetchTradesByMarket;
exports.fetchPnlByMarket = fetchPnlByMarket;
exports.fetchMarketOHLCV = fetchMarketOHLCV;
exports.fetchMarketOrderbook = fetchMarketOrderbook;
exports.fetchPnlByAddress = fetchPnlByAddress;
exports.fetchTradesByAddress = fetchTradesByAddress;
exports.fetchMarketCategories = fetchMarketCategories;
exports.fetchPositionDetail = fetchPositionDetail;
exports.fetchProfilerLabels = fetchProfilerLabels;
exports.fetchPnlSummary = fetchPnlSummary;
exports.fetchProfilerBatch = fetchProfilerBatch;
exports.fetchSmartMoneyNetflow = fetchSmartMoneyNetflow;
exports.fetchSmartMoneyHoldings = fetchSmartMoneyHoldings;
exports.checkNansenInstalled = checkNansenInstalled;
exports.fetchAccountStatus = fetchAccountStatus;
var node_child_process_1 = require("node:child_process");
var mock_js_1 = require("./mock.js");
// ---------------------------------------------------------------------------
// API Call Counter
// ---------------------------------------------------------------------------
var apiCallCount = 0;
function getApiCallCount() {
    return apiCallCount;
}
function resetApiCallCount() {
    apiCallCount = 0;
}
// ---------------------------------------------------------------------------
// Core Executor
// ---------------------------------------------------------------------------
/**
 * Execute a nansen CLI command and parse the JSON output.
 * The command string is split by spaces and combined with args.
 *
 * @example
 * execNansen('research prediction-market market-screener', ['--limit', '20'])
 */
function execNansen(command, args, options) {
    if (args === void 0) { args = []; }
    if (options === void 0) { options = {}; }
    apiCallCount++;
    var _a = options.timeout, timeout = _a === void 0 ? 60000 : _a;
    // Mock mode — return synthetic data without CLI call
    if (mock_js_1.IS_MOCK) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                var mock = (0, mock_js_1.getMockData)(command, args);
                if (mock !== null) {
                    resolve({ success: true, data: mock });
                }
                else {
                    resolve({ success: false, error: '[MOCK] No data for: ' + command });
                }
            }, 300);
        });
    }
    return new Promise(function (resolve) {
        var fullArgs = __spreadArray(__spreadArray(__spreadArray([], command.split(' '), true), args, true), ['--pretty'], false);
        (0, node_child_process_1.execFile)('nansen', fullArgs, { maxBuffer: 10 * 1024 * 1024, timeout: timeout }, function (error, stdout, stderr) {
            if (error) {
                var errorText = stderr || stdout || error.message;
                try {
                    var parsed = JSON.parse(errorText);
                    resolve({
                        success: false,
                        error: parsed.error || error.message,
                        code: parsed.code,
                        status: parsed.status,
                    });
                }
                catch (_a) {
                    resolve({
                        success: false,
                        error: errorText.slice(0, 500),
                        code: 'EXEC_ERROR',
                    });
                }
                return;
            }
            try {
                var parsed = JSON.parse(stdout);
                resolve(parsed);
            }
            catch (_b) {
                resolve({
                    success: false,
                    error: "Failed to parse JSON: ".concat(stdout.slice(0, 200)),
                    code: 'PARSE_ERROR',
                });
            }
        });
    });
}
// ---------------------------------------------------------------------------
// Prediction Market Wrappers
// ---------------------------------------------------------------------------
/** Discover active prediction markets */
function fetchMarketScreener() {
    return __awaiter(this, arguments, void 0, function (limit) {
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market market-screener', [
                    '--limit', String(limit),
                ])];
        });
    });
}
/** Event-level overview */
function fetchEventScreener() {
    return __awaiter(this, arguments, void 0, function (limit) {
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market event-screener', [
                    '--limit', String(limit),
                ])];
        });
    });
}
/** Top holders for a specific market */
function fetchTopHolders(marketId_1) {
    return __awaiter(this, arguments, void 0, function (marketId, limit) {
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market top-holders', [
                    '--market-id', marketId,
                    '--limit', String(limit),
                ])];
        });
    });
}
/** Trades for a specific market */
function fetchTradesByMarket(marketId_1) {
    return __awaiter(this, arguments, void 0, function (marketId, limit) {
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market trades-by-market', [
                    '--market-id', marketId,
                    '--limit', String(limit),
                ])];
        });
    });
}
/** PnL leaderboard for a specific market */
function fetchPnlByMarket(marketId_1) {
    return __awaiter(this, arguments, void 0, function (marketId, limit) {
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market pnl-by-market', [
                    '--market-id', marketId,
                    '--limit', String(limit),
                ])];
        });
    });
}
/** OHLCV price history for a market */
function fetchMarketOHLCV(marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market ohlcv', [
                    '--market-id', marketId,
                ])];
        });
    });
}
/** Orderbook snapshot for a market */
function fetchMarketOrderbook(marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market orderbook', [
                    '--market-id', marketId,
                ])];
        });
    });
}
/** PnL for a specific address across prediction markets */
function fetchPnlByAddress(address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market pnl-by-address', [
                    '--address', address,
                ])];
        });
    });
}
/** Trades for a specific address across prediction markets */
function fetchTradesByAddress(address_1) {
    return __awaiter(this, arguments, void 0, function (address, limit) {
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market trades-by-address', [
                    '--address', address,
                    '--limit', String(limit),
                ])];
        });
    });
}
/** List prediction market categories */
function fetchMarketCategories() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market categories')];
        });
    });
}
/** Position detail for a market */
function fetchPositionDetail(marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research prediction-market position-detail', [
                    '--market-id', marketId,
                ])];
        });
    });
}
// ---------------------------------------------------------------------------
// Profiler Wrappers (for SM enrichment)
// ---------------------------------------------------------------------------
/** Get Nansen labels for an address */
function fetchProfilerLabels(address_1) {
    return __awaiter(this, arguments, void 0, function (address, chain) {
        if (chain === void 0) { chain = 'ethereum'; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research profiler labels', [
                    '--address', address,
                    '--chain', chain,
                ])];
        });
    });
}
/** Get PnL summary for an address */
function fetchPnlSummary(address_1) {
    return __awaiter(this, arguments, void 0, function (address, chain) {
        if (chain === void 0) { chain = 'ethereum'; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research profiler pnl-summary', [
                    '--address', address,
                    '--chain', chain,
                ])];
        });
    });
}
/** Batch profile multiple addresses */
function fetchProfilerBatch(addresses_1) {
    return __awaiter(this, arguments, void 0, function (addresses, chain, include) {
        if (chain === void 0) { chain = 'ethereum'; }
        if (include === void 0) { include = 'labels,balance'; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('profiler batch', [
                    '--addresses', addresses.join(','),
                    '--chain', chain,
                    '--include', include,
                ])];
        });
    });
}
// ---------------------------------------------------------------------------
// Smart Money Wrappers (for context)
// ---------------------------------------------------------------------------
/** Smart money netflow */
function fetchSmartMoneyNetflow(chain_1) {
    return __awaiter(this, arguments, void 0, function (chain, limit) {
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research smart-money netflow', [
                    '--chain', chain,
                    '--limit', String(limit),
                ])];
        });
    });
}
/** Smart money holdings */
function fetchSmartMoneyHoldings(chain_1) {
    return __awaiter(this, arguments, void 0, function (chain, limit) {
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('research smart-money holdings', [
                    '--chain', chain,
                    '--limit', String(limit),
                ])];
        });
    });
}
// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
/** Check if nansen CLI is available (always true in mock mode) */
function checkNansenInstalled() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (mock_js_1.IS_MOCK)
                return [2 /*return*/, true];
            return [2 /*return*/, new Promise(function (resolve) {
                    (0, node_child_process_1.execFile)('nansen', ['--version'], { timeout: 5000 }, function (error) {
                        resolve(!error);
                    });
                })];
        });
    });
}
/** Get account status */
function fetchAccountStatus() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execNansen('account')];
        });
    });
}
