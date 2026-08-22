import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map(err => err.msg);
    return res.status(400).json({
      success: false,
      error: {
        code: 'ERR_VALIDATION_FAILED',
        message: errorList[0] || 'Validation failed for request parameters.',
        details: errorList
      },
      requestId: (req as any).requestId
    });
  }
  next();
};

export const loginValidators = [
  body('username')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Username is required.')
    .isLength({ max: 64 })
    .withMessage('Username must not exceed 64 characters.'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required.'),
  handleValidationErrors
];

export const passwordChangeValidators = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required.'),
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Validation Failed [ERR_PASSWORD_WEAK]: New password must be at least 8 characters long.'),
  handleValidationErrors
];

export const routeValidators = [
  body('routeNumber')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Route number is required.'),
  body('origin')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Origin location is required.'),
  body('destination')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Destination location is required.'),
  body('distanceKm')
    .isFloat({ min: 0.1 })
    .withMessage('Route total distance must be a positive number.'),
  body('region')
    .optional()
    .isIn(['Kashmir', 'Jammu', 'Ladakh', 'Inter-Region'])
    .withMessage('Invalid region specified.'),
  body('terrain')
    .optional()
    .isIn(['Plain', 'Hilly', 'High-Altitude', 'Mixed'])
    .withMessage('Invalid terrain specified.'),
  handleValidationErrors
];

export const stopValidators = [
  body('stopName')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Stop name is required.')
    .isLength({ max: 100 })
    .withMessage('Stop name must be under 100 characters.'),
  body('latitude')
    .isFloat({ min: 32.0, max: 37.0 })
    .withMessage('Validation Failed [ERR_STOP_BOUNDS]: Latitude must be between 32.0° and 37.0° N (J&K region).'),
  body('longitude')
    .isFloat({ min: 73.0, max: 79.0 })
    .withMessage('Validation Failed [ERR_STOP_BOUNDS]: Longitude must be between 73.0° and 79.0° E (J&K region).'),
  body('stopSequence')
    .isInt({ min: 1 })
    .withMessage('Validation Failed [ERR_STOP_INVALID_SEQ]: Stop sequence must be a positive integer starting at 1.'),
  handleValidationErrors
];

export const routeIdParamValidator = [
  param('routeId')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Route ID parameter is required.'),
  handleValidationErrors
];
