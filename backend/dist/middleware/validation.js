"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordChangeSchema = exports.fareSlabSchema = exports.csvRowSchema = exports.routeSchema = exports.stopSchema = exports.OverchargeAuditSchema = exports.PaymentTransactionSchema = exports.STOP_NAME_REGEX = exports.JK_BOUNDS = void 0;
exports.validateBody = validateBody;
exports.validateStopSequenceAndMonotonicity = validateStopSequenceAndMonotonicity;
const zod_1 = require("zod");
// J&K Geographic Boundaries (Lat: 32°–37° N, Lng: 73°–79° E)
exports.JK_BOUNDS = {
    MIN_LAT: 32.0,
    MAX_LAT: 37.0,
    MIN_LNG: 73.0,
    MAX_LNG: 79.0
};
// Regex for stop_name: alphanumeric, spaces, hyphens, periods, commas, parentheses, Hindi & Urdu unicode
exports.STOP_NAME_REGEX = /^[a-zA-Z0-9\s\-\.,()ँूंृेैोौािीुूएएऐऔॉ्यमनरलवशषसहक्षज्ञ\u0600-\u06FF]+$/;
exports.PaymentTransactionSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    boardingStopId: zod_1.z.string().optional(),
    deboardingStopId: zod_1.z.string().optional(),
    distanceKm: zod_1.z.number().min(0.1, { message: 'Distance must be at least 0.1 km' }),
    calculatedFareRupees: zod_1.z.number().min(1, { message: 'Calculated fare must be >= ₹1' }),
    actualPaidRupees: zod_1.z.number().min(1, { message: 'Actual paid rupees must be >= ₹1' }),
    vehicleType: zod_1.z.enum(['matador', 'minibus', 'tatamagic', 'sharedvan', 'rickshaw', 'erickshaw', 'tavera']),
    concessionPct: zod_1.z.number().int().min(0).max(100),
    paymentMethod: zod_1.z.enum(['DIGITAL', 'CASH', 'PASS']),
    gpsLatitude: zod_1.z.number().optional(),
    gpsLongitude: zod_1.z.number().optional()
});
exports.OverchargeAuditSchema = zod_1.z.object({
    reportedBy: zod_1.z.string().email().optional(),
    reportedAmount: zod_1.z.number().min(1),
    regulatedAmount: zod_1.z.number().min(1)
});
// Zod Schemas
exports.stopSchema = zod_1.z.object({
    stopName: zod_1.z.string()
        .min(1, { message: 'Stop name is required.' })
        .max(100, { message: 'Stop name must be under 100 characters.' })
        .refine(val => exports.STOP_NAME_REGEX.test(val.trim()), {
        message: 'Validation Failed [ERR_STOP_NAME_INVALID]: Stop name contains invalid characters. Only alphanumeric, spaces, hyphens, periods, commas, and parentheses are allowed.'
    }),
    latitude: zod_1.z.number({ required_error: 'Latitude is required.' })
        .min(exports.JK_BOUNDS.MIN_LAT, { message: `Validation Failed [ERR_STOP_BOUNDS]: Latitude must be between ${exports.JK_BOUNDS.MIN_LAT}° and ${exports.JK_BOUNDS.MAX_LAT}° N (J&K region).` })
        .max(exports.JK_BOUNDS.MAX_LAT, { message: `Validation Failed [ERR_STOP_BOUNDS]: Latitude must be between ${exports.JK_BOUNDS.MIN_LAT}° and ${exports.JK_BOUNDS.MAX_LAT}° N (J&K region).` }),
    longitude: zod_1.z.number({ required_error: 'Longitude is required.' })
        .min(exports.JK_BOUNDS.MIN_LNG, { message: `Validation Failed [ERR_STOP_BOUNDS]: Longitude must be between ${exports.JK_BOUNDS.MIN_LNG}° and ${exports.JK_BOUNDS.MAX_LNG}° E (J&K region).` })
        .max(exports.JK_BOUNDS.MAX_LNG, { message: `Validation Failed [ERR_STOP_BOUNDS]: Longitude must be between ${exports.JK_BOUNDS.MIN_LNG}° and ${exports.JK_BOUNDS.MAX_LNG}° E (J&K region).` }),
    stopSequence: zod_1.z.number({ required_error: 'Stop sequence is required.' })
        .int({ message: 'Stop sequence must be an integer.' })
        .positive({ message: 'Validation Failed [ERR_STOP_INVALID_SEQ]: Stop sequence must be a positive integer starting at 1.' }),
    cumulativeDistanceKm: zod_1.z.number().min(0, { message: 'Cumulative distance must be non-negative.' }).optional().default(0),
    version: zod_1.z.number().int().positive().optional()
});
exports.routeSchema = zod_1.z.object({
    routeNumber: zod_1.z.string().min(1, { message: 'Route number is required.' }),
    origin: zod_1.z.string().min(1, { message: 'Origin location is required.' }),
    destination: zod_1.z.string().min(1, { message: 'Destination location is required.' }),
    distanceKm: zod_1.z.number().positive({ message: 'Route total distance must be positive.' }),
    region: zod_1.z.enum(['Kashmir', 'Jammu', 'Ladakh', 'Inter-Region']).optional().default('Kashmir'),
    terrain: zod_1.z.enum(['Plain', 'Hilly', 'High-Altitude', 'Mixed']).optional().default('Plain'),
    version: zod_1.z.number().int().positive().optional()
});
exports.csvRowSchema = zod_1.z.object({
    route_code: zod_1.z.string().min(1, { message: 'route_code is required' }),
    stop_sequence: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform(val => parseInt(String(val), 10)),
    stop_name: zod_1.z.string().min(1, { message: 'stop_name is required' }),
    latitude: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform(val => parseFloat(String(val))),
    longitude: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform(val => parseFloat(String(val)))
});
exports.fareSlabSchema = zod_1.z.object({
    slabs: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).refine(slabs => {
        const keys = Object.keys(slabs).map(k => parseFloat(k)).sort((a, b) => a - b);
        for (let i = 1; i < keys.length; i++) {
            if (keys[i] <= keys[i - 1])
                return false;
        }
        return true;
    }, { message: 'Validation Failed [ERR_SLAB_INVALID_BAND]: Fare slab distance bands must be strictly monotonically increasing.' }),
    rates: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    version: zod_1.z.number().int().positive().optional()
});
exports.passwordChangeSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, { message: 'Current password is required.' }),
    newPassword: zod_1.z.string().min(8, { message: 'Validation Failed [ERR_PASSWORD_WEAK]: New password must be at least 8 characters long.' })
});
/**
 * Generic Middleware Generator for Zod Validation
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const formattedErrors = result.error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'ERR_VALIDATION_FAILED',
                    message: formattedErrors[0] || 'Validation failed for request payload.',
                    details: formattedErrors
                },
                requestId: req.requestId
            });
        }
        req.body = result.data;
        next();
    };
}
/**
 * Validates array of stops for contiguous sequence (1..N) and monotonic cumulative KM
 */
function validateStopSequenceAndMonotonicity(stops) {
    if (stops.length === 0)
        return { valid: true };
    const sorted = [...stops].sort((a, b) => a.stopSequence - b.stopSequence);
    // Check contiguous 1..N
    for (let i = 0; i < sorted.length; i++) {
        const expectedSeq = i + 1;
        if (sorted[i].stopSequence !== expectedSeq) {
            return {
                valid: false,
                errorCode: 'ERR_STOP_DUPLICATE_SEQ',
                error: `Validation Failed [ERR_STOP_DUPLICATE_SEQ]: Sequence numbers must be contiguous 1..N. Found sequence ${sorted[i].stopSequence} instead of ${expectedSeq}.`
            };
        }
    }
    // Check monotonic cumulative KM
    for (let i = 1; i < sorted.length; i++) {
        const prevDist = sorted[i - 1].cumulativeDistanceKm ?? 0;
        const currDist = sorted[i].cumulativeDistanceKm ?? 0;
        if (currDist < prevDist) {
            return {
                valid: false,
                errorCode: 'ERR_NON_MONOTONIC_KM',
                error: `Validation Failed [ERR_NON_MONOTONIC_KM]: Cumulative distance for stop "${sorted[i].stopName || sorted[i].stopSequence}" (${currDist} km) is less than previous stop (${prevDist} km).`
            };
        }
    }
    return { valid: true };
}
