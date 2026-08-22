const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { Client } = require('pg');

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const POSTGRES_URI = process.env.POSTGRES_URI || 'postgres://user:pass@localhost:5432/safar';

const redisConnection = new Redis(REDIS_URI, { maxRetriesPerRequest: null });
const pgClient = new Client({ connectionString: POSTGRES_URI });

pgClient.connect().catch((err) => {
    console.error('PostgreSQL Worker Connection Error:', err.message);
});

const sessionWorker = new Worker('transit-tasks', async (job) => {
    if (job.name === 'cleanup-stale-sessions') {
        const query = `
            UPDATE driver_sessions 
            SET status = 'EXPIRED', ended_at = NOW() 
            WHERE status = 'ACTIVE' 
            AND started_at < NOW() - INTERVAL '12 hours'
        `;
        const res = await pgClient.query(query);
        console.log(`[Worker] Expired ${res.rowCount} stale driver sessions.`);
    }
}, { connection: redisConnection });

sessionWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} (${job.name}) completed successfully.`);
});

sessionWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err);
});

module.exports = { sessionWorker };
