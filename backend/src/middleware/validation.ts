import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// J&K Geographic Boundaries (Lat: 32°–37° N, Lng: 73°–79° E)
export const JK_BOUNDS = {
  MIN_LAT: 32.0,
  MAX_LAT: 37.0,
  MIN_LNG: 73.0,
  MAX_LNG: 79.0
};

// Regex for stop_name: alphanumeric, spaces, hyphens, periods, commas, parentheses, Hindi & Urdu unicode
export const STOP_NAME_REGEX = /^[a-zA-Z0-9\s\-\.,()ँूंृेैोौािीुूएएऐऔॉ्यमनरलवशषसहक्षज्ञ\u0600-\u06FF]+$/;

export const PaymentTransactionSchema = z.object({
  userId: z.string().optional(),
  boardingStopId: z.string().optional(),
  deboardingStopId: z.string().optional(),
  distanceKm: z.number().min(0.1, { message: 'Distance must be at least 0.1 km' }),
  calculatedFareRupees: z.number().min(1, { message: 'Calculated fare must be >= ₹1' }),
  actualPaidRupees: z.number().min(1, { message: 'Actual paid rupees must be >= ₹1' }),
  vehicleType: z.enum(['matador', 'minibus', 'tatamagic', 'sharedvan', 'rickshaw', 'erickshaw', 'tavera']),
  concessionPct: z.number().int().min(0).max(100),
  paymentMethod: z.enum(['DIGITAL', 'CASH', 'PASS']),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional()
});

export const OverchargeAuditSchema = z.object({
  reportedBy: z.string().email().optional(),
  reportedAmount: z.number().min(1),
  regulatedAmount: z.number().min(1)
});


// Zod Schemas
export const stopSchema = z.object({
  stopName: z.string()
    .min(1, { message: 'Stop name is required.' })
    .max(100, { message: 'Stop name must be under 100 characters.' })
    .refine(val => STOP_NAME_REGEX.test(val.trim()), {
      message: 'Validation Failed [ERR_STOP_NAME_INVALID]: Stop name contains invalid characters. Only alphanumeric, spaces, hyphens, periods, commas, and parentheses are allowed.'
    }),
  latitude: z.number({ required_error: 'Latitude is required.' })
    .min(JK_BOUNDS.MIN_LAT, { message: `Validation Failed [ERR_STOP_BOUNDS]: Latitude must be between ${JK_BOUNDS.MIN_LAT}° and ${JK_BOUNDS.MAX_LAT}° N (J&K region).` })
    .max(JK_BOUNDS.MAX_LAT, { message: `Validation Failed [ERR_STOP_BOUNDS]: Latitude must be between ${JK_BOUNDS.MIN_LAT}° and ${JK_BOUNDS.MAX_LAT}° N (J&K region).` }),
  longitude: z.number({ required_error: 'Longitude is required.' })
    .min(JK_BOUNDS.MIN_LNG, { message: `Validation Failed [ERR_STOP_BOUNDS]: Longitude must be between ${JK_BOUNDS.MIN_LNG}° and ${JK_BOUNDS.MAX_LNG}° E (J&K region).` })
    .max(JK_BOUNDS.MAX_LNG, { message: `Validation Failed [ERR_STOP_BOUNDS]: Longitude must be between ${JK_BOUNDS.MIN_LNG}° and ${JK_BOUNDS.MAX_LNG}° E (J&K region).` }),
  stopSequence: z.number({ required_error: 'Stop sequence is required.' })
    .int({ message: 'Stop sequence must be an integer.' })
    .positive({ message: 'Validation Failed [ERR_STOP_INVALID_SEQ]: Stop sequence must be a positive integer starting at 1.' }),
  cumulativeDistanceKm: z.number().min(0, { message: 'Cumulative distance must be non-negative.' }).optional().default(0),
  version: z.number().int().positive().optional()
});

export const routeSchema = z.object({
  routeNumber: z.string().min(1, { message: 'Route number is required.' }),
  origin: z.string().min(1, { message: 'Origin location is required.' }),
  destination: z.string().min(1, { message: 'Destination location is required.' }),
  distanceKm: z.number().positive({ message: 'Route total distance must be positive.' }),
  region: z.enum(['Kashmir', 'Jammu', 'Ladakh', 'Inter-Region']).optional().default('Kashmir'),
  terrain: z.enum(['Plain', 'Hilly', 'High-Altitude', 'Mixed']).optional().default('Plain'),
  version: z.number().int().positive().optional()
});

export const csvRowSchema = z.object({
  route_code: z.string().min(1, { message: 'route_code is required' }),
  stop_sequence: z.union([z.number(), z.string()]).transform(val => parseInt(String(val), 10)),
  stop_name: z.string().min(1, { message: 'stop_name is required' }),
  latitude: z.union([z.number(), z.string()]).transform(val => parseFloat(String(val))),
  longitude: z.union([z.number(), z.string()]).transform(val => parseFloat(String(val)))
});

export const fareSlabSchema = z.object({
  slabs: z.record(z.string(), z.number()).refine(slabs => {
    const keys = Object.keys(slabs).map(k => parseFloat(k)).sort((a, b) => a - b);
    for (let i = 1; i < keys.length; i++) {
      if (keys[i] <= keys[i - 1]) return false;
    }
    return true;
  }, { message: 'Validation Failed [ERR_SLAB_INVALID_BAND]: Fare slab distance bands must be strictly monotonically increasing.' }),
  rates: z.record(z.string(), z.any()).optional(),
  version: z.number().int().positive().optional()
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'Validation Failed [ERR_PASSWORD_WEAK]: New password must be at least 8 characters long.' })
});

/**
 * Generic Middleware Generator for Zod Validation
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
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
        requestId: (req as any).requestId
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates array of stops for contiguous sequence (1..N) and monotonic cumulative KM
 */
export function validateStopSequenceAndMonotonicity(stops: Array<{ stopSequence: number; cumulativeDistanceKm?: number; stopName?: string }>): { valid: boolean; error?: string; errorCode?: string } {
  if (stops.length === 0) return { valid: true };

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
