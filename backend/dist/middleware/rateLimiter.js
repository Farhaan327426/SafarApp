"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.perEndpointSessionRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Strict Rate Limiter Middleware: 10 requests/min per endpoint per session token (or IP)
 */
exports.perEndpointSessionRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: (req) => {
        const sessionToken = req.session?.id || req.headers['x-session-token'] || req.ip;
        return `${sessionToken}:${req.baseUrl}${req.path}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: (req, res) => {
        return res.status(429).json({
            success: false,
            error: {
                code: 'ERR_RATE_LIMIT_EXCEEDED',
                message: 'Rate Limit Exceeded [ERR_RATE_LIMIT_EXCEEDED]: Maximum 10 requests/min per endpoint. Please wait before retrying.'
            },
            requestId: req.requestId
        });
    }
});
