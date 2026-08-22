const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const applySecurity = (app) => {
    app.use(helmet());
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }));
};

const ticketSchema = z.object({
    routeId: z.number().int(),
    amount: z.number().positive()
});

const validateTicketPayload = (req, res, next) => {
    const parsed = ticketSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error);
    }
    next();
};

module.exports = { applySecurity, validateTicketPayload };
