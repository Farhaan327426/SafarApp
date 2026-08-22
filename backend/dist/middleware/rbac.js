"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User session invalid.'
                },
                requestId: req.requestId
            });
        }
        if (!allowedRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Forbidden: Action requires role [${allowedRoles.join(', ')}]. User role is [${user.role}].`
                },
                requestId: req.requestId
            });
        }
        next();
    };
}
