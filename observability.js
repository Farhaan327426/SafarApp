const winston = require('winston');
const Sentry = require('@sentry/node');
const client = require('prom-client');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

function initObservability(app) {
    if (process.env.SENTRY_DSN) {
        Sentry.init({ dsn: process.env.SENTRY_DSN });
    }
    client.collectDefaultMetrics();

    app.get('/metrics', async (req, res) => {
        try {
            res.set('Content-Type', client.register.contentType);
            res.end(await client.register.metrics());
        } catch (err) {
            res.status(500).end(err);
        }
    });
}

module.exports = { logger, initObservability };
