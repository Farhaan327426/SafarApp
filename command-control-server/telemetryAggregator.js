// command-control-server/telemetryAggregator.js
const db = require('./db');
const { insertGpsPing, upsertAggregatedTelemetry, deleteOldGpsPings, queryAggregatedTelemetry } = db;

const BIN_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RETENTION_DAYS = 7;

function fuzzCoordinate(lat, lng, gridSizeMeters = 200) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return { lat: 0, lng: 0 };
  }
  const latStep = gridSizeMeters / 111000;
  const latCellIndex = Math.floor(lat / latStep);
  const cellCenterLat = latCellIndex * latStep + latStep / 2;

  const rad = (cellCenterLat * Math.PI) / 180;
  const cosLat = Math.abs(Math.cos(rad));
  const lngStep = gridSizeMeters / (111000 * (cosLat > 0.0001 ? cosLat : 1));

  const lngCellIndex = Math.floor(lng / lngStep);
  const cellCenterLng = lngCellIndex * lngStep + lngStep / 2;

  return {
    lat: Number(cellCenterLat.toFixed(6)),
    lng: Number(cellCenterLng.toFixed(6))
  };
}

function timeBin(timestamp, binMs = BIN_MS) {
  return Math.floor(timestamp / binMs) * binMs;
}

function aggregateRoute(routeId, binStart, binEnd) {
  const pings = (db.stmts && db.stmts.getGpsPingsForRouteTime ? db.stmts.getGpsPingsForRouteTime.all(routeId, binStart, binEnd) : db.db.prepare(`
    SELECT lat, lng, speed, vehicle_no
    FROM gps_pings
    WHERE route_id = ? AND timestamp >= ? AND timestamp < ?
  `).all(routeId, binStart, binEnd));

  if (!pings.length) return null;

  const fuzzedCoords = pings.map(p => fuzzCoordinate(p.lat, p.lng));
  const avgLat = Number((fuzzedCoords.reduce((sum, c) => sum + c.lat, 0) / fuzzedCoords.length).toFixed(6));
  const avgLng = Number((fuzzedCoords.reduce((sum, c) => sum + c.lng, 0) / fuzzedCoords.length).toFixed(6));
  const avgSpeed = Number((pings.reduce((sum, p) => sum + (p.speed || 0), 0) / pings.length).toFixed(2));
  const busCount = new Set(pings.map(p => p.vehicle_no)).size;

  return {
    routeId,
    timeBin: binStart,
    busCount,
    avgSpeed,
    fuzzedCentroidLat: avgLat,
    fuzzedCentroidLng: avgLng,
  };
}

function runAggregator(targetBinStart = null) {
  const now = Date.now();
  const previousBinStart = targetBinStart !== null ? targetBinStart : timeBin(now - BIN_MS);
  const previousBinEnd = previousBinStart + BIN_MS;

  try {
    const routes = db.db.prepare(`
      SELECT DISTINCT route_id
      FROM gps_pings
      WHERE timestamp >= ? AND timestamp < ?
    `).all(previousBinStart, previousBinEnd);

    const results = [];
    for (const { route_id } of routes) {
      const agg = aggregateRoute(route_id, previousBinStart, previousBinEnd);
      if (agg) {
        upsertAggregatedTelemetry(agg);
        results.push(agg);
      }
    }
    return results;
  } catch (err) {
    console.error('[aggregator] aggregation failed', err);
    return [];
  }
}

function cleanupRawGpsPings(retentionDays = DEFAULT_RETENTION_DAYS) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const result = deleteOldGpsPings(cutoff);
  return result.changes;
}

function startAggregatorTimers() {
  // Run aggregation every 5 minutes
  setInterval(runAggregator, BIN_MS).unref();
  // Run raw cleanup daily at 03:00
  const now = new Date();
  const next3am = new Date(now);
  next3am.setHours(3, 0, 0, 0);
  if (next3am <= now) next3am.setDate(next3am.getDate() + 1);
  const msUntil3am = next3am - now;
  setTimeout(() => {
    cleanupRawGpsPings();
    setInterval(cleanupRawGpsPings, 24 * 60 * 60 * 1000).unref();
  }, msUntil3am).unref();
}

module.exports = {
  fuzzCoordinate,
  timeBin,
  aggregateRoute,
  runAggregator,
  cleanupRawGpsPings,
  startAggregatorTimers,
  insertGpsPing,
  upsertAggregatedTelemetry,
  queryAggregatedTelemetry,
  BIN_MS,
  DEFAULT_RETENTION_DAYS
};
