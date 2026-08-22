"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
exports.requireAuth = requireAuth;
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("../auth/jwt");
function requestIdMiddleware(req, res, next) {
    const reqId = `req-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
    req.requestId = reqId;
    res.setHeader('X-Request-ID', reqId);
    next();
}
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    let userPayload = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        userPayload = (0, jwt_1.verifyAccessToken)(token);
    }
    // Fallback to session user if JWT not provided
    if (!userPayload && req.session?.user) {
        const sUser = req.session.user;
        userPayload = {
            userId: sUser.id,
            username: sUser.username,
            role: sUser.role,
            tenantId: sUser.tenantId
        };
    }
    if (!userPayload) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required. Valid access token or active session required.'
            },
            requestId: req.requestId
        });
    }
    req.user = {
        id: userPayload.userId,
        username: userPayload.username,
        role: userPayload.role,
        tenantId: userPayload.tenantId
    };
    next();
}
