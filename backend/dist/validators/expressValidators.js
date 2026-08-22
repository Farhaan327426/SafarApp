"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeIdParamValidator = exports.stopValidators = exports.routeValidators = exports.passwordChangeValidators = exports.loginValidators = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorList = errors.array().map(err => err.msg);
        return res.status(400).json({
            success: false,
            error: {
                code: 'ERR_VALIDATION_FAILED',
                message: errorList[0] || 'Validation failed for request parameters.',
                details: errorList
            },
            requestId: req.requestId
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.loginValidators = [
    (0, express_validator_1.body)('username')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Username is required.')
        .isLength({ max: 64 })
        .withMessage('Username must not exceed 64 characters.'),
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required.'),
    exports.handleValidationErrors
];
exports.passwordChangeValidators = [
    (0, express_validator_1.body)('currentPassword')
        .trim()
        .notEmpty()
        .withMessage('Current password is required.'),
    (0, express_validator_1.body)('newPassword')
        .trim()
        .isLength({ min: 8 })
        .withMessage('Validation Failed [ERR_PASSWORD_WEAK]: New password must be at least 8 characters long.'),
    exports.handleValidationErrors
];
exports.routeValidators = [
    (0, express_validator_1.body)('routeNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Route number is required.'),
    (0, express_validator_1.body)('origin')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Origin location is required.'),
    (0, express_validator_1.body)('destination')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Destination location is required.'),
    (0, express_validator_1.body)('distanceKm')
        .isFloat({ min: 0.1 })
        .withMessage('Route total distance must be a positive number.'),
    (0, express_validator_1.body)('region')
        .optional()
        .isIn(['Kashmir', 'Jammu', 'Ladakh', 'Inter-Region'])
        .withMessage('Invalid region specified.'),
    (0, express_validator_1.body)('terrain')
        .optional()
        .isIn(['Plain', 'Hilly', 'High-Altitude', 'Mixed'])
        .withMessage('Invalid terrain specified.'),
    exports.handleValidationErrors
];
exports.stopValidators = [
    (0, express_validator_1.body)('stopName')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Stop name is required.')
        .isLength({ max: 100 })
        .withMessage('Stop name must be under 100 characters.'),
    (0, express_validator_1.body)('latitude')
        .isFloat({ min: 32.0, max: 37.0 })
        .withMessage('Validation Failed [ERR_STOP_BOUNDS]: Latitude must be between 32.0° and 37.0° N (J&K region).'),
    (0, express_validator_1.body)('longitude')
        .isFloat({ min: 73.0, max: 79.0 })
        .withMessage('Validation Failed [ERR_STOP_BOUNDS]: Longitude must be between 73.0° and 79.0° E (J&K region).'),
    (0, express_validator_1.body)('stopSequence')
        .isInt({ min: 1 })
        .withMessage('Validation Failed [ERR_STOP_INVALID_SEQ]: Stop sequence must be a positive integer starting at 1.'),
    exports.handleValidationErrors
];
exports.routeIdParamValidator = [
    (0, express_validator_1.param)('routeId')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Route ID parameter is required.'),
    exports.handleValidationErrors
];
