"use strict";
/**
 * `nansen-oracle report` command
 *
 * Generates a full alpha report: scans markets, enriches, analyzes,
 * and outputs as a formatted Markdown or JSON file.
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
exports.reportCommand = reportCommand;
var chalk_1 = require("chalk");
var node_fs_1 = require("node:fs");
var scan_js_1 = require("./scan.js");
var analyzer_js_1 = require("../lib/analyzer.js");
var formatter_js_1 = require("../lib/formatter.js");
var nansen_js_1 = require("../lib/nansen.js");
function reportCommand(options) {
    return __awaiter(this, void 0, void 0, function () {
        var format, outputPath, analyses, sorted, alerts, leaderboard, report, json, markdown;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    format = (options.format || 'md');
                    outputPath = options.output || "oracle-report-".concat(Date.now(), ".").concat(format === 'json' ? 'json' : 'md');
                    console.log('');
                    console.log(chalk_1.default.cyan.bold('🔮 Nansen Polymarket Oracle — Full Report'));
                    console.log(chalk_1.default.gray("Output: ".concat(outputPath, " (").concat(format, ")")));
                    console.log('');
                    return [4 /*yield*/, (0, scan_js_1.scanCommand)({
                            category: options.category,
                            minVolume: options.minVolume,
                            limit: options.limit || '30',
                            chain: options.chain,
                        })];
                case 1:
                    analyses = _a.sent();
                    if (analyses.length === 0) {
                        console.log(chalk_1.default.yellow('No data to report.'));
                        return [2 /*return*/];
                    }
                    sorted = (0, analyzer_js_1.sortByDivergence)(analyses);
                    alerts = (0, analyzer_js_1.filterAlerts)(sorted, 30);
                    leaderboard = (0, analyzer_js_1.buildSmLeaderboard)(sorted);
                    report = {
                        generated_at: new Date().toISOString(),
                        total_markets_scanned: analyses.length,
                        total_api_calls: (0, nansen_js_1.getApiCallCount)(),
                        analyses: sorted,
                        alerts: alerts,
                        sm_leaderboard: leaderboard,
                    };
                    // Output
                    if (format === 'json') {
                        json = JSON.stringify(report, null, 2);
                        (0, node_fs_1.writeFileSync)(outputPath, json);
                        console.log(chalk_1.default.green("\u2705 JSON report saved to ".concat(outputPath)));
                    }
                    else if (format === 'table') {
                        (0, formatter_js_1.printScanTable)(sorted);
                    }
                    else {
                        markdown = (0, formatter_js_1.generateMarkdownReport)(report);
                        (0, node_fs_1.writeFileSync)(outputPath, markdown);
                        console.log(chalk_1.default.green("\u2705 Markdown report saved to ".concat(outputPath)));
                    }
                    // Summary
                    console.log('');
                    console.log(chalk_1.default.cyan.bold('📋 Report Summary'));
                    console.log("  Markets analyzed: ".concat(chalk_1.default.white(String(report.total_markets_scanned))));
                    console.log("  High divergence alerts: ".concat(chalk_1.default.yellow(String(report.alerts.length))));
                    console.log("  SM wallets identified: ".concat(chalk_1.default.white(String(report.sm_leaderboard.length))));
                    console.log("  API calls made: ".concat(chalk_1.default.gray(String(report.total_api_calls))));
                    console.log('');
                    return [2 /*return*/];
            }
        });
    });
}
