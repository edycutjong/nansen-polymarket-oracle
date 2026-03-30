"use strict";
/**
 * `nansen-oracle scan` command
 *
 * Scans active prediction markets, enriches holders with SM labels,
 * and ranks markets by divergence score.
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
exports.scanCommand = scanCommand;
var chalk_1 = require("chalk");
var ora_1 = require("ora");
var nansen_js_1 = require("../lib/nansen.js");
var enricher_js_1 = require("../lib/enricher.js");
var analyzer_js_1 = require("../lib/analyzer.js");
var formatter_js_1 = require("../lib/formatter.js");
function scanCommand(options) {
    return __awaiter(this, void 0, void 0, function () {
        var limit, minVolume, chain, spinner, marketsResult, markets, cat_1, analyses, _i, _a, _b, i, market, label, progressSpinner, holdersResult, holders, enrichedHolders, smHolders, analysis, err_1, sorted;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    limit = parseInt(options.limit || '20', 10);
                    minVolume = parseFloat(options.minVolume || '0');
                    chain = options.chain || 'ethereum';
                    console.log('');
                    console.log(chalk_1.default.cyan.bold('🔮 Nansen Polymarket Oracle'));
                    console.log(chalk_1.default.gray("Scanning top ".concat(limit, " markets by volume...")));
                    console.log('');
                    spinner = (0, ora_1.default)('Fetching active prediction markets...').start();
                    return [4 /*yield*/, (0, nansen_js_1.fetchMarketScreener)(limit)];
                case 1:
                    marketsResult = _c.sent();
                    if (!marketsResult.success || !marketsResult.data) {
                        spinner.fail('Failed to fetch markets');
                        console.error(chalk_1.default.red("Error: ".concat(marketsResult.error || 'Unknown error')));
                        return [2 /*return*/, []];
                    }
                    markets = marketsResult.data;
                    // Filter by minimum volume
                    if (minVolume > 0) {
                        markets = markets.filter(function (m) { return m.volume_usd >= minVolume; });
                    }
                    // Filter by category
                    if (options.category) {
                        cat_1 = options.category.toLowerCase();
                        markets = markets.filter(function (m) { var _a; return (_a = m.category) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(cat_1); });
                    }
                    spinner.succeed("Found ".concat(markets.length, " markets"));
                    if (markets.length === 0) {
                        console.log(chalk_1.default.yellow('No markets match your filters.'));
                        return [2 /*return*/, []];
                    }
                    analyses = [];
                    _i = 0, _a = markets.entries();
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    _b = _a[_i], i = _b[0], market = _b[1];
                    label = market.question.length > 50
                        ? market.question.slice(0, 47) + '...'
                        : market.question;
                    progressSpinner = (0, ora_1.default)("[".concat(i + 1, "/").concat(markets.length, "] Scanning: ").concat(label)).start();
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, (0, nansen_js_1.fetchTopHolders)(market.market_id, 50)];
                case 4:
                    holdersResult = _c.sent();
                    if (!holdersResult.success || !holdersResult.data) {
                        progressSpinner.warn("Skipped: ".concat(label, " (no holder data)"));
                        return [3 /*break*/, 7];
                    }
                    holders = holdersResult.data;
                    if (holders.length === 0) {
                        progressSpinner.warn("Skipped: ".concat(label, " (0 holders)"));
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, (0, enricher_js_1.enrichHolders)(holders, chain, 3)];
                case 5:
                    enrichedHolders = _c.sent();
                    smHolders = (0, enricher_js_1.filterSmartMoney)(enrichedHolders);
                    analysis = (0, analyzer_js_1.analyzeMarket)(market, smHolders, holders.length);
                    analyses.push(analysis);
                    if (smHolders.length > 0) {
                        progressSpinner.succeed("".concat(label, " \u2014 SM: ").concat(smHolders.length, "/").concat(holders.length, " holders, Divergence: ").concat(analysis.divergence_score > 0 ? '+' : '').concat(analysis.divergence_score));
                    }
                    else {
                        progressSpinner.info("".concat(label, " \u2014 No SM holders found (").concat(holders.length, " scanned)"));
                    }
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _c.sent();
                    progressSpinner.fail("Error scanning: ".concat(label));
                    console.error(chalk_1.default.gray("  ".concat(err_1 instanceof Error ? err_1.message : String(err_1))));
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    sorted = (0, analyzer_js_1.sortByDivergence)(analyses);
                    (0, formatter_js_1.printScanTable)(sorted);
                    console.log(chalk_1.default.gray("Total API calls: ".concat((0, nansen_js_1.getApiCallCount)())));
                    return [2 /*return*/, sorted];
            }
        });
    });
}
