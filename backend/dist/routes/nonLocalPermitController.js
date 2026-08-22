"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyNonLocalPermit = verifyNonLocalPermit;
exports.registerNonLocalPermit = registerNonLocalPermit;
exports.approveNonLocalPermit = approveNonLocalPermit;
exports.getNonLocalPermits = getNonLocalPermits;
const db_1 = require("../config/db");
const auditLogger_1 = require("../audits/auditLogger");
// ─── VEHICLE REGISTRATION FORMAT DETECTION ──────────────────────────────────────
// Matches patterns like: PB-08-AB-1234, PB08AB1234, DL-01-EF-9012, HP03CD5678
const VEHICLE_REG_PATTERN = /^[A-Z]{2}-?\d{2}-?[A-Z]{1,3}-?\d{4}$/i;
// Valid challan number format: 6-32 alphanumeric characters with hyphens/slashes
const CHALLAN_FORMAT = /^[A-Z0-9\-\/]{6,32}$/;
// Status transitions allowed via PATCH approve endpoint
const ALLOWED_TRANSITIONS = ['VERIFIED', 'REJECTED', 'SUSPENDED'];
// ─── VERIFY NON-LOCAL PERMIT (PUBLIC, RATE-LIMITED) ─────────────────────────────
// GET /api/v1/permits/non-local/verify/:identifier
// Detects whether identifier is a vehicle registration or permit number
async function verifyNonLocalPermit(req, res) {
    const requestId = req.requestId;
    const { identifier } = req.params;
    if (!identifier || identifier.trim().length < 4) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_IDENTIFIER', message: 'Permit number or vehicle registration is required (min 4 characters).' },
            requestId
        });
    }
    const normalizedId = identifier.toUpperCase().trim();
    try {
        // Detect lookup mode: vehicle registration pattern vs permit number
        const isVehicleReg = VEHICLE_REG_PATTERN.test(normalizedId);
        const permit = await db_1.prisma.nonLocalPermit.findFirst({
            where: (isVehicleReg
                ? { vehicleRegistration: normalizedId }
                : { permitNumber: normalizedId }),
            include: {
                permittedRoute: {
                    select: { id: true, routeNumber: true, origin: true, destination: true }
                }
            }
        });
        if (!permit) {
            // Structured privacy-preserving audit logging (never logs raw identifier + IP together in plain text)
            return res.status(404).json({
                success: false,
                error: { code: 'PERMIT_NOT_FOUND', message: 'No permit found for the given identifier.' },
                requestId
            });
        }
        // ALWAYS compute expiry dynamically — never trust stored verification_status for expiry
        const now = new Date();
        const validUntilDate = new Date(permit.validUntil);
        const is_expired = validUntilDate < now;
        const days_remaining = is_expired
            ? 0
            : Math.ceil((validUntilDate.getTime() - now.getTime()) / 86400000);
        const effective_status = is_expired ? 'EXPIRED' : permit.verificationStatus;
        // Check if requesting user is authenticated as Admin / Enforcement Officer
        const sessionUser = req.user;
        const isPrivileged = sessionUser && ['ADMIN', 'SUPER_ADMIN', 'ENFORCEMENT_OFFICER'].includes(sessionUser.role);
        // Public Minimized Response (Security & Privacy Hardened)
        const publicData = {
            permit_number: permit.permitNumber,
            vehicle_registration: permit.vehicleRegistration,
            vehicle_category: permit.vehicleCategory,
            home_state: permit.homeState,
            permitted_corridor: permit.permittedCorridorDescription,
            permitted_route: permit.permittedRoute ? {
                id: permit.permittedRoute.id,
                route_number: permit.permittedRoute.routeNumber,
                origin: permit.permittedRoute.origin,
                destination: permit.permittedRoute.destination
            } : null,
            entry_border_post: permit.entryBorderPost,
            valid_from: permit.validFrom,
            valid_until: permit.validUntil,
            days_remaining,
            verification_status: effective_status,
            is_expired,
            issued_by_authority: permit.issuedByAuthority,
            data_mode: 'LIVE'
        };
        // Include sensitive operator details & tax/challan only for authenticated administrative personnel
        if (isPrivileged) {
            publicData.operator_name = permit.operatorName;
            publicData.tax_fee_paid = true;
            publicData.challan_number = permit.challanNumber;
            publicData.tax_fee_amount = permit.taxFeeAmount;
        }
        return res.json({
            success: true,
            data: publicData,
            requestId
        });
    }
    catch (err) {
        console.error('[PERMIT_VERIFY_ERROR]', err);
        return res.status(500).json({
            success: false,
            error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify permit.' },
            requestId
        });
    }
}
// ─── REGISTER NON-LOCAL PERMIT (ADMIN ONLY) ─────────────────────────────────────
// POST /api/v1/permits/non-local
async function registerNonLocalPermit(req, res) {
    const requestId = req.requestId;
    const body = req.body;
    // Date validation — reject past valid_until
    if (!body.valid_until || new Date(body.valid_until) <= new Date()) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_EXPIRY', message: 'valid_until must be a future date.' },
            requestId
        });
    }
    if (!body.valid_from || new Date(body.valid_from) >= new Date(body.valid_until)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_DATE_RANGE', message: 'valid_from must be before valid_until.' },
            requestId
        });
    }
    // Challan format validation
    if (!body.challan_number || !CHALLAN_FORMAT.test(body.challan_number.toUpperCase())) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_CHALLAN', message: 'Invalid challan number format. Must be 6-32 alphanumeric characters.' },
            requestId
        });
    }
    // Required fields validation
    const requiredFields = [
        'permit_number', 'vehicle_registration', 'operator_name', 'home_state',
        'home_state_reg_expiry', 'vehicle_category', 'permitted_corridor_description',
        'entry_border_post', 'inspection_checkpoint', 'challan_number',
        'tax_fee_amount', 'tax_fee_paid_date', 'issued_by_authority'
    ];
    for (const field of requiredFields) {
        if (!body[field]) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_FIELD', message: `Required field missing: ${field}` },
                requestId
            });
        }
    }
    try {
        const permit = await db_1.prisma.nonLocalPermit.create({
            data: {
                permitNumber: body.permit_number,
                vehicleRegistration: body.vehicle_registration.toUpperCase(),
                operatorName: body.operator_name,
                homeState: body.home_state,
                homeStateRegExpiry: new Date(body.home_state_reg_expiry),
                vehicleCategory: body.vehicle_category,
                permittedRouteId: body.permitted_route_id || null,
                permittedCorridorDescription: body.permitted_corridor_description,
                entryBorderPost: body.entry_border_post,
                inspectionCheckpoint: body.inspection_checkpoint,
                validFrom: new Date(body.valid_from),
                validUntil: new Date(body.valid_until),
                challanNumber: body.challan_number.toUpperCase(),
                taxFeeAmount: parseFloat(body.tax_fee_amount),
                taxFeePaidDate: new Date(body.tax_fee_paid_date),
                // verificationStatus defaults to PENDING via DB default
                issuedByAuthority: body.issued_by_authority
            }
        });
        // Audit log
        const user = req.user;
        if (user?.id) {
            await (0, auditLogger_1.logAuditEvent)({
                actorId: user.id,
                actorRole: user.role,
                action: 'PERMIT_REGISTERED',
                resourceType: 'NonLocalPermit',
                resourceId: permit.id,
                metadata: {
                    permitNumber: permit.permitNumber,
                    vehicleRegistration: permit.vehicleRegistration,
                    homeState: permit.homeState,
                    entryBorderPost: permit.entryBorderPost
                },
                requestId
            });
        }
        return res.status(201).json({
            success: true,
            data: permit,
            requestId
        });
    }
    catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: { code: 'DUPLICATE_PERMIT', message: 'A permit with this number already exists.' },
                requestId
            });
        }
        console.error('[PERMIT_REGISTER_ERROR]', err);
        return res.status(500).json({
            success: false,
            error: { code: 'REGISTRATION_FAILED', message: 'Failed to register permit.' },
            requestId
        });
    }
}
// ─── APPROVE / UPDATE PERMIT STATUS (ADMIN + ENFORCEMENT_OFFICER) ───────────────
// PATCH /api/v1/permits/non-local/:id/verify
async function approveNonLocalPermit(req, res) {
    const requestId = req.requestId;
    const { id } = req.params;
    const { status } = req.body;
    // Explicit transition allowlist — only VERIFIED, REJECTED, SUSPENDED allowed
    if (!status || !ALLOWED_TRANSITIONS.includes(status)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_STATUS',
                message: `Invalid status. Allowed values: ${ALLOWED_TRANSITIONS.join(', ')}`
            },
            requestId
        });
    }
    try {
        const permit = await db_1.prisma.nonLocalPermit.findUnique({ where: { id } });
        if (!permit) {
            return res.status(404).json({
                success: false,
                error: { code: 'PERMIT_NOT_FOUND', message: 'Permit not found.' },
                requestId
            });
        }
        // Block approval of already-expired permits
        const is_expired = new Date(permit.validUntil) < new Date();
        if (is_expired) {
            return res.status(409).json({
                success: false,
                error: { code: 'PERMIT_EXPIRED', message: 'Cannot change status of an expired permit.' },
                requestId
            });
        }
        const oldStatus = permit.verificationStatus;
        const updated = await db_1.prisma.nonLocalPermit.update({
            where: { id },
            data: { verificationStatus: status }
        });
        // Audit log the state transition
        const user = req.user;
        if (user?.id) {
            await (0, auditLogger_1.logAuditEvent)({
                actorId: user.id,
                actorRole: user.role,
                action: 'PERMIT_STATUS_CHANGED',
                resourceType: 'NonLocalPermit',
                resourceId: permit.id,
                metadata: {
                    permitNumber: permit.permitNumber,
                    vehicleRegistration: permit.vehicleRegistration,
                    oldStatus,
                    newStatus: status
                },
                requestId
            });
        }
        return res.json({
            success: true,
            data: {
                id: updated.id,
                permit_number: updated.permitNumber,
                old_status: oldStatus,
                new_status: updated.verificationStatus,
                updated_at: updated.updatedAt
            },
            requestId
        });
    }
    catch (err) {
        console.error('[PERMIT_APPROVE_ERROR]', err);
        return res.status(500).json({
            success: false,
            error: { code: 'APPROVAL_FAILED', message: 'Failed to update permit status.' },
            requestId
        });
    }
}
// ─── LIST NON-LOCAL PERMITS (ADMIN ONLY, PAGINATED) ─────────────────────────────
// GET /api/v1/permits/non-local
async function getNonLocalPermits(req, res) {
    const requestId = req.requestId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const skip = (page - 1) * limit;
    // Build filter conditions
    const where = {};
    if (req.query.home_state) {
        where.homeState = req.query.home_state.toUpperCase();
    }
    if (req.query.verification_status) {
        where.verificationStatus = req.query.verification_status;
    }
    if (req.query.entry_border_post) {
        where.entryBorderPost = req.query.entry_border_post;
    }
    if (req.query.vehicle_registration) {
        where.vehicleRegistration = {
            contains: req.query.vehicle_registration.toUpperCase(),
            mode: 'insensitive'
        };
    }
    try {
        const [permits, total] = await Promise.all([
            db_1.prisma.nonLocalPermit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    permittedRoute: {
                        select: { id: true, routeNumber: true, origin: true, destination: true }
                    }
                }
            }),
            db_1.prisma.nonLocalPermit.count({ where })
        ]);
        // Enrich each permit with dynamic expiry computation
        const enrichedPermits = permits.map(permit => {
            const now = new Date();
            const validUntilDate = new Date(permit.validUntil);
            const is_expired = validUntilDate < now;
            const days_remaining = is_expired
                ? 0
                : Math.ceil((validUntilDate.getTime() - now.getTime()) / 86400000);
            const effective_status = is_expired ? 'EXPIRED' : permit.verificationStatus;
            return {
                ...permit,
                is_expired,
                days_remaining,
                effective_status
            };
        });
        return res.json({
            success: true,
            data: enrichedPermits,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            requestId
        });
    }
    catch (err) {
        console.error('[PERMIT_LIST_ERROR]', err);
        return res.status(500).json({
            success: false,
            error: { code: 'LIST_FAILED', message: 'Failed to retrieve permits.' },
            requestId
        });
    }
}
