"use strict";
/**
 * Simple in-memory TTL cache to reduce API calls during scans.
 * Labels rarely change, so caching for 5 minutes is safe.
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
exports.marketCache = exports.labelCache = exports.Cache = void 0;
var Cache = /** @class */ (function () {
    function Cache(defaultTtlMs) {
        if (defaultTtlMs === void 0) { defaultTtlMs = 5 * 60 * 1000; }
        this.store = new Map();
        this.defaultTtlMs = defaultTtlMs;
    }
    Cache.prototype.get = function (key) {
        var entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expires_at) {
            this.store.delete(key);
            return undefined;
        }
        return entry.data;
    };
    Cache.prototype.set = function (key, data, ttlMs) {
        this.store.set(key, {
            data: data,
            expires_at: Date.now() + (ttlMs !== null && ttlMs !== void 0 ? ttlMs : this.defaultTtlMs),
        });
    };
    Cache.prototype.has = function (key) {
        return this.get(key) !== undefined;
    };
    Cache.prototype.clear = function () {
        this.store.clear();
    };
    Object.defineProperty(Cache.prototype, "size", {
        get: function () {
            return this.store.size;
        },
        enumerable: false,
        configurable: true
    });
    /** Cache-through helper: returns cached value or calls the fetch fn */
    Cache.prototype.getOrFetch = function (key, fetchFn, ttlMs) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = this.get(key);
                        if (cached !== undefined)
                            return [2 /*return*/, cached];
                        return [4 /*yield*/, fetchFn()];
                    case 1:
                        data = _a.sent();
                        this.set(key, data, ttlMs);
                        return [2 /*return*/, data];
                }
            });
        });
    };
    return Cache;
}());
exports.Cache = Cache;
/** Global label cache — shared across commands */
exports.labelCache = new Cache(5 * 60 * 1000); // 5 min
/** Global market cache */
exports.marketCache = new Cache(2 * 60 * 1000); // 2 min
