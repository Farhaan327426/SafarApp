"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.getSession = getSession;
exports.changePassword = changePassword;
exports.getCsrfToken = getCsrfToken;
exports.requestOtp = requestOtp;
exports.verifyOtp = verifyOtp;
const argon2_1 = __importDefault(require("argon2"));
const db_1 = require("../config/db");
const auditLogger_1 = require("../audits/auditLogger");
const jwt_1 = require("./jwt");
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
async function login(req, res) {
    const { username, password } = req.body;
    const requestId = req.requestId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Username and password are required.' },
            requestId
        });
    }
    try {
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username: username.trim() },
                    { phoneNumber: username.trim() }
                ]
            }
        });
        if (!user || !user.isActive) {
            await (0, auditLogger_1.logAuditEvent)({
                action: 'LOGIN_FAILURE',
                resourceType: 'USER',
                metadata: { reason: 'User not found or inactive', username },
                ipAddress,
                userAgent,
                requestId
            });
            return res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' },
                requestId
            });
        }
        // Account Lockout Verification
        const now = new Date();
        if (user.lockoutUntil && user.lockoutUntil > now) {
            const remainingMins = Math.ceil((user.lockoutUntil.getTime() - now.getTime()) / (60 * 1000));
            await (0, auditLogger_1.logAuditEvent)({
                actorId: user.id,
                actorRole: user.role,
                action: 'LOGIN_BLOCKED_LOCKOUT',
                resourceType: 'USER',
                resourceId: user.id,
                metadata: { remainingMins },
                ipAddress,
                userAgent,
                requestId
            });
            return res.status(423).json({
                success: false,
                error: {
                    code: 'ACCOUNT_LOCKED',
                    message: `Account is locked due to too many failed login attempts. Please try again in ${remainingMins} minutes.`
                },
                requestId
            });
        }
        const isValid = await argon2_1.default.verify(user.passwordHash, password);
        if (!isValid) {
            const updatedAttempts = (user.failedLoginAttempts || 0) + 1;
            let lockoutUntil = null;
            if (updatedAttempts >= MAX_FAILED_ATTEMPTS) {
                lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            }
            await db_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: updatedAttempts,
                    lockoutUntil
                }
            });
            await (0, auditLogger_1.logAuditEvent)({
                actorId: user.id,
                actorRole: user.role,
                action: 'LOGIN_FAILURE',
                resourceType: 'USER',
                resourceId: user.id,
                metadata: { failedAttempts: updatedAttempts, isLocked: Boolean(lockoutUntil) },
                ipAddress,
                userAgent,
                requestId
            });
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: lockoutUntil
                        ? 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.'
                        : 'Invalid username or password.'
                },
                requestId
            });
        }
        // Login Succeeded -> Reset lockout counter
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockoutUntil: null,
                lastLoginAt: new Date()
            }
        });
        const tokenPayload = {
            userId: user.id,
            username: user.username || user.phoneNumber || user.id,
            role: user.role,
            tenantId: user.tenantId
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        // Save refresh token session in database
        const tokenHash = (0, jwt_1.hashRefreshToken)(refreshToken);
        await db_1.prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: tokenHash,
                ipAddress: ipAddress || '127.0.0.1',
                userAgent: userAgent || 'Unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        // Set HttpOnly refresh cookie (7 days)
        (0, jwt_1.setRefreshTokenCookie)(res, refreshToken);
        await (0, auditLogger_1.logAuditEvent)({
            actorId: user.id,
            actorRole: user.role,
            action: 'LOGIN_SUCCESS',
            resourceType: 'USER',
            resourceId: user.id,
            ipAddress,
            userAgent,
            requestId
        });
        // Attach CSRF token if session exists
        const csrfToken = req.session ? req.session.csrfToken : null;
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username || user.phoneNumber,
                    fullName: user.fullName,
                    role: user.role
                },
                accessToken,
                expiresInSeconds: 900, // 15 minutes
                csrfToken
            },
            requestId
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message },
            requestId
        });
    }
}
async function refresh(req, res) {
    const requestId = req.requestId;
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token cookie missing.' },
            requestId
        });
    }
    const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    if (!payload) {
        (0, jwt_1.clearRefreshTokenCookie)(res);
        return res.status(401).json({
            success: false,
            error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalid or expired.' },
            requestId
        });
    }
    try {
        const tokenHash = (0, jwt_1.hashRefreshToken)(refreshToken);
        const session = await db_1.prisma.session.findFirst({
            where: {
                refreshTokenHash: tokenHash,
                revoked: false
            }
        });
        if (!session || session.expiresAt < new Date()) {
            (0, jwt_1.clearRefreshTokenCookie)(res);
            return res.status(401).json({
                success: false,
                error: { code: 'SESSION_REVOKED', message: 'Session revoked or expired.' },
                requestId
            });
        }
        // Revoke old session and issue new pair (Token Rotation)
        await db_1.prisma.session.update({
            where: { id: session.id },
            data: { revoked: true }
        });
        const user = await db_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || !user.isActive) {
            (0, jwt_1.clearRefreshTokenCookie)(res);
            return res.status(401).json({
                success: false,
                error: { code: 'USER_INACTIVE', message: 'User account disabled.' },
                requestId
            });
        }
        const tokenPayload = {
            userId: user.id,
            username: user.username || user.phoneNumber || user.id,
            role: user.role,
            tenantId: user.tenantId
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        await db_1.prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: (0, jwt_1.hashRefreshToken)(newRefreshToken),
                ipAddress: req.ip || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        (0, jwt_1.setRefreshTokenCookie)(res, newRefreshToken);
        return res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                expiresInSeconds: 900,
                user: {
                    id: user.id,
                    username: user.username || user.phoneNumber,
                    fullName: user.fullName,
                    role: user.role
                }
            },
            requestId
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message },
            requestId
        });
    }
}
async function logout(req, res) {
    const user = req.user;
    const requestId = req.requestId;
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        const tokenHash = (0, jwt_1.hashRefreshToken)(refreshToken);
        await db_1.prisma.session.updateMany({
            where: { refreshTokenHash: tokenHash },
            data: { revoked: true }
        }).catch(() => { });
    }
    (0, jwt_1.clearRefreshTokenCookie)(res);
    if (user) {
        await (0, auditLogger_1.logAuditEvent)({
            actorId: user.id,
            actorRole: user.role,
            action: 'LOGOUT',
            resourceType: 'USER',
            resourceId: user.id,
            requestId
        });
    }
    if (req.session) {
        req.session.destroy(() => { });
    }
    return res.json({
        success: true,
        data: { message: 'Logged out successfully.' },
        requestId
    });
}
async function getSession(req, res) {
    const user = req.user;
    const requestId = req.requestId;
    return res.json({
        success: true,
        data: {
            user,
            csrfToken: req.session?.csrfToken || 'active-session-csrf-token'
        },
        requestId
    });
}
async function changePassword(req, res) {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;
    const requestId = req.requestId;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'New password must be at least 8 characters long.' },
            requestId
        });
    }
    try {
        const dbUser = await db_1.prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User record not found.' },
                requestId
            });
        }
        const isValid = await argon2_1.default.verify(dbUser.passwordHash, currentPassword);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Current password incorrect.' },
                requestId
            });
        }
        const newHash = await argon2_1.default.hash(newPassword);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash }
        });
        await (0, auditLogger_1.logAuditEvent)({
            actorId: user.id,
            actorRole: user.role,
            action: 'PASSWORD_CHANGED',
            resourceType: 'USER',
            resourceId: user.id,
            requestId
        });
        return res.json({
            success: true,
            data: { message: 'Password changed successfully.' },
            requestId
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message },
            requestId
        });
    }
}
async function getCsrfToken(req, res) {
    const requestId = req.requestId;
    if (req.session && !req.session.csrfToken) {
        const crypto = require('crypto');
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    const csrfToken = req.session ? req.session.csrfToken : 'safar-csrf-token-2026';
    res.setHeader('X-CSRF-Token', csrfToken);
    return res.json({
        success: true,
        data: { csrfToken },
        requestId
    });
}
// ─── PHONE NUMBER + OTP AUTHENTICATION ENGINE (COMMUTER / DRIVER) ───────────
const crypto_1 = __importDefault(require("crypto"));
const OTP_PEPPER = process.env.OTP_SECRET_PEPPER || 'safar-otp-pepper-secure-salt-2026';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown
const MAX_OTP_VERIFY_ATTEMPTS = 3;
// In-memory OTP vault with cryptographic hashing (never stores plaintext OTPs)
const otpVault = new Map();
function hashOtp(rawOtp, phoneNumber) {
    return crypto_1.default.createHmac('sha256', OTP_PEPPER).update(`${phoneNumber}:${rawOtp}`).digest('hex');
}
/**
 * Request OTP for Commuters and Drivers
 * POST /api/v1/auth/otp/request
 */
async function requestOtp(req, res) {
    const { phoneNumber, role, deviceId } = req.body;
    const requestId = req.requestId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_PHONE', message: 'Valid phone number is required.' },
            requestId
        });
    }
    // Normalize phone number (standardize to 10-digit Indian MSISDN)
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_PHONE_FORMAT', message: 'Please enter a valid 10-digit mobile number.' },
            requestId
        });
    }
    const now = Date.now();
    const existing = otpVault.get(cleanPhone);
    // Enforce Resend Cooldown
    if (existing && (now - existing.lastSentAt) < OTP_RESEND_COOLDOWN_MS) {
        const waitSecs = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
        return res.status(429).json({
            success: false,
            error: {
                code: 'OTP_COOLDOWN_ACTIVE',
                message: `Please wait ${waitSecs} seconds before requesting a new OTP.`
            },
            requestId
        });
    }
    // Generate cryptographically random 6-digit OTP
    const rawOtp = crypto_1.default.randomInt(100000, 999999).toString();
    const hashedOtp = hashOtp(rawOtp, cleanPhone);
    otpVault.set(cleanPhone, {
        hashedOtp,
        expiresAt: now + OTP_EXPIRY_MS,
        attempts: 0,
        lastSentAt: now,
        targetRole: role || 'COMMUTER',
        deviceId: deviceId || 'unknown'
    });
    // Log audit event (never logs raw OTP)
    await (0, auditLogger_1.logAuditEvent)({
        action: 'OTP_REQUESTED',
        resourceType: 'AUTH',
        metadata: { phoneNumber: `XXXXXX${cleanPhone.slice(-4)}`, role: role || 'COMMUTER' },
        ipAddress,
        userAgent,
        requestId
    });
    // In development, log notification to secure debug console (never return raw OTP in API response)
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\x1b[36m[SECURE SMS GATEWAY SIMULATION]\x1b[0m OTP for +91-${cleanPhone}: \x1b[32m${rawOtp}\x1b[0m (Valid for 5 mins)`);
    }
    // Enumeration-resistant success response (never returns raw OTP in API payload)
    return res.json({
        success: true,
        data: {
            message: 'OTP sent successfully. Please enter the 6-digit code sent to your phone.',
            expiresInSeconds: 300,
            cooldownSeconds: 60
        },
        requestId
    });
}
/**
 * Verify OTP and Issue Authenticated JWT Session
 * POST /api/v1/auth/otp/verify
 */
async function verifyOtp(req, res) {
    const { phoneNumber, otp, deviceId } = req.body;
    const requestId = req.requestId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (!phoneNumber || !otp) {
        return res.status(400).json({
            success: false,
            error: { code: 'MISSING_FIELDS', message: 'Phone number and 6-digit OTP are required.' },
            requestId
        });
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const record = otpVault.get(cleanPhone);
    if (!record || Date.now() > record.expiresAt) {
        otpVault.delete(cleanPhone);
        return res.status(401).json({
            success: false,
            error: { code: 'OTP_EXPIRED', message: 'OTP is expired or invalid. Please request a new code.' },
            requestId
        });
    }
    // Verify Attempt Limit
    if (record.attempts >= MAX_OTP_VERIFY_ATTEMPTS) {
        otpVault.delete(cleanPhone);
        await (0, auditLogger_1.logAuditEvent)({
            action: 'OTP_EXCESSIVE_FAILURES',
            resourceType: 'AUTH',
            metadata: { phoneNumber: `XXXXXX${cleanPhone.slice(-4)}` },
            ipAddress,
            userAgent,
            requestId
        });
        return res.status(429).json({
            success: false,
            error: { code: 'TOO_MANY_ATTEMPTS', message: 'Maximum verification attempts exceeded. Please request a new OTP.' },
            requestId
        });
    }
    // Verify Cryptographic Hash
    const candidateHash = hashOtp(otp.trim(), cleanPhone);
    if (!crypto_1.default.timingSafeEqual(Buffer.from(record.hashedOtp), Buffer.from(candidateHash))) {
        record.attempts += 1;
        const remainingAttempts = MAX_OTP_VERIFY_ATTEMPTS - record.attempts;
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_OTP',
                message: `Incorrect OTP. ${remainingAttempts} attempts remaining.`
            },
            requestId
        });
    }
    // OTP is valid — Immediately invalidate to prevent replay
    const targetRole = record.targetRole || 'COMMUTER';
    otpVault.delete(cleanPhone);
    try {
        // Find or Provision Commuter / Driver User
        let user = await db_1.prisma.user.findFirst({
            where: { phoneNumber: cleanPhone }
        });
        if (!user) {
            // Provision user if commuter
            const defaultPasswordHash = await argon2_1.default.hash(crypto_1.default.randomBytes(32).toString('hex'));
            user = await db_1.prisma.user.create({
                data: {
                    username: `user_${cleanPhone}`,
                    phoneNumber: cleanPhone,
                    fullName: `Commuter (${cleanPhone.slice(-4)})`,
                    role: targetRole === 'DRIVER' ? 'DRIVER' : 'COMMUTER',
                    passwordHash: defaultPasswordHash,
                    isActive: true
                }
            });
        }
        // Role Verification: If user attempts driver login, ensure they have DRIVER role in DB
        if (targetRole === 'DRIVER' && user.role !== 'DRIVER' && user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'DRIVER_ROLE_UNAUTHORIZED',
                    message: 'This mobile number is not registered as an authorized transport driver.'
                },
                requestId
            });
        }
        // Issue JWT tokens and create server session with device tracking
        const tokenPayload = {
            userId: user.id,
            username: user.username || user.phoneNumber || user.id,
            role: user.role,
            tenantId: user.tenantId
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        await db_1.prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: (0, jwt_1.hashRefreshToken)(refreshToken),
                ipAddress: ipAddress || '127.0.0.1',
                userAgent: `${userAgent || 'Mobile'} [Device: ${deviceId || record.deviceId || 'unknown'}]`,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        (0, jwt_1.setRefreshTokenCookie)(res, refreshToken);
        await (0, auditLogger_1.logAuditEvent)({
            actorId: user.id,
            actorRole: user.role,
            action: 'OTP_LOGIN_SUCCESS',
            resourceType: 'USER',
            resourceId: user.id,
            metadata: { deviceId: deviceId || record.deviceId },
            ipAddress,
            userAgent,
            requestId
        });
        return res.json({
            success: true,
            data: {
                accessToken,
                expiresInSeconds: 900,
                user: {
                    id: user.id,
                    phoneNumber: `+91 ${cleanPhone}`,
                    fullName: user.fullName,
                    role: user.role
                }
            },
            requestId
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'AUTH_SESSION_ERROR', message: 'Failed to create authenticated session.' },
            requestId
        });
    }
}
