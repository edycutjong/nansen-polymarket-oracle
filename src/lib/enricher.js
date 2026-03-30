"use strict";
/**
 * Enricher — Cross-references market holder addresses against Nansen's
 * Smart Money labels. This is the core "secret sauce" of the Oracle.
 *
 * Flow:
 * 1. Take a list of market holders (addresses)
 * 2. For each address, call profiler labels
 * 3. Check if any label matches the SM label set
 * 4. Return enriched holders with SM classification
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
exports.isSmartMoney = isSmartMoney;
exports.summarizeLabels = summarizeLabels;
exports.enrichAddress = enrichAddress;
exports.enrichHolders = enrichHolders;
exports.filterSmartMoney = filterSmartMoney;
var nansen_js_1 = require("./nansen.js");
var cache_js_1 = require("./cache.js");
/** Labels that qualify an address as "Smart Money" */
var SM_LABELS = new Set([
    'Fund',
    'Smart Trader',
    '30D Smart Trader',
    '90D Smart Trader',
    '180D Smart Trader',
    'Smart HL Perps Trader',
]);
/**
 * Check if a set of labels contains any Smart Money label.
 */
function isSmartMoney(labels) {
    return labels.some(function (l) { return SM_LABELS.has(l.label); });
}
/**
 * Create a human-readable label summary.
 * e.g. "Fund, Smart Trader" or "Unknown"
 */
function summarizeLabels(labels) {
    if (labels.length === 0)
        return 'Unknown';
    var smLabels = labels.filter(function (l) { return SM_LABELS.has(l.label); });
    if (smLabels.length > 0) {
        return smLabels.map(function (l) { return l.fullname || l.label; }).join(', ');
    }
    return labels.map(function (l) { return l.fullname || l.label; }).join(', ');
}
/**
 * Enrich a single address with Nansen labels.
 * Uses cache to avoid redundant API calls.
 */
function enrichAddress(address_1) {
    return __awaiter(this, arguments, void 0, function (address, chain) {
        var cacheKey;
        var _this = this;
        if (chain === void 0) { chain = 'ethereum'; }
        return __generator(this, function (_a) {
            cacheKey = "labels:".concat(chain, ":").concat(address);
            return [2 /*return*/, cache_js_1.labelCache.getOrFetch(cacheKey, function () { return __awaiter(_this, void 0, void 0, function () {
                    var result, labels;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, (0, nansen_js_1.fetchProfilerLabels)(address, chain)];
                            case 1:
                                result = _a.sent();
                                if (!result.success || !result.data) {
                                    return [2 /*return*/, { labels: [], is_smart_money: false }];
                                }
                                labels = Array.isArray(result.data)
                                    ? result.data
                                    : [result.data];
                                return [2 /*return*/, {
                                        labels: labels,
                                        is_smart_money: isSmartMoney(labels),
                                    }];
                        }
                    });
                }); })];
        });
    });
}
/**
 * Enrich a batch of market holders with Smart Money labels.
 * This is the main enrichment pipeline.
 *
 * @param holders - Raw market holders from top-holders endpoint
 * @param chain - Chain to query labels on (default: ethereum for Polymarket)
 * @param concurrency - Max concurrent label lookups
 */
function enrichHolders(holders_1) {
    return __awaiter(this, arguments, void 0, function (holders, chain, concurrency) {
        var results, i, batch, enrichedBatch;
        var _this = this;
        if (chain === void 0) { chain = 'ethereum'; }
        if (concurrency === void 0) { concurrency = 5; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < holders.length)) return [3 /*break*/, 4];
                    batch = holders.slice(i, i + concurrency);
                    return [4 /*yield*/, Promise.all(batch.map(function (holder) { return __awaiter(_this, void 0, void 0, function () {
                            var enrichment;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, enrichAddress(holder.address, chain)];
                                    case 1:
                                        enrichment = _a.sent();
                                        return [2 /*return*/, {
                                                address: holder.address,
                                                labels: enrichment.labels,
                                                position: holder.position,
                                                shares: holder.shares,
                                                value_usd: holder.value_usd,
                                                entry_price: holder.entry_price,
                                                pnl_usd: holder.pnl_usd,
                                                label_summary: summarizeLabels(enrichment.labels),
                                                is_smart_money: enrichment.is_smart_money,
                                            }];
                                }
                            });
                        }); }))];
                case 2:
                    enrichedBatch = _a.sent();
                    results.push.apply(results, enrichedBatch);
                    _a.label = 3;
                case 3:
                    i += concurrency;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, results];
            }
        });
    });
}
/**
 * Filter enriched holders to only Smart Money.
 */
function filterSmartMoney(holders) {
    return holders.filter(function (h) { return h.is_smart_money; });
}
