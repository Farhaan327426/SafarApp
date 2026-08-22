const { Pool } = require('pg');

const POSTGRES_URI = process.env.POSTGRES_URI || 'postgres://user:pass@localhost:5432/safar';
const pool = new Pool({ connectionString: POSTGRES_URI });

async function getRemainingETA(routeId, currentLng, currentLat) {
    const query = `
        SELECT 
            r.total_estimated_time_mins * (1 - ST_LineLocatePoint(r.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))) AS remaining_eta_mins
        FROM routes r
        WHERE r.id = $3;
    `;
    const { rows } = await pool.query(query, [currentLng, currentLat, routeId]);
    if (!rows || rows.length === 0 || rows[0].remaining_eta_mins === null) {
        return 0;
    }
    return Math.round(rows[0].remaining_eta_mins);
}

module.exports = { getRemainingETA };
