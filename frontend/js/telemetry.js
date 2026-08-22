/**
 * SAFAR — Low Bandwidth GPS Telemetry Parser & Formatter
 */
class TelemetryParser {
  /**
   * Expands compact low-bandwidth GPS ping payload into full readable telemetry structure.
   * @param {Object} ping - { t_id, lat, lng, sp, hd, ts }
   * @param {number} maxStaleMs - Threshold in ms for staleness (default 120000ms / 2 min)
   */
  static expand(ping, maxStaleMs = 120000) {
    if (!ping) return null;
    const tsMs = ping.ts * (ping.ts < 1e11 ? 1000 : 1);
    const pingDate = new Date(tsMs);
    const isStale = (Date.now() - tsMs) > maxStaleMs;

    return {
      tripId: ping.t_id,
      latitude: ping.lat,
      longitude: ping.lng,
      speedKmh: ping.sp,
      headingDegrees: ping.hd,
      timestamp: pingDate,
      isStale
    };
  }

  /**
   * Converts telemetry object to compact 6-field MQTT/REST JSON payload.
   */
  static compact(expanded) {
    if (!expanded) return null;
    const tsSeconds = expanded.timestamp 
      ? Math.floor(new Date(expanded.timestamp).getTime() / 1000) 
      : Math.floor(Date.now() / 1000);

    return {
      t_id: expanded.tripId || '',
      lat: Number((expanded.latitude || 0).toFixed(6)),
      lng: Number((expanded.longitude || 0).toFixed(6)),
      sp: Number((expanded.speedKmh || 0).toFixed(1)),
      hd: Math.round(expanded.headingDegrees || 0),
      ts: tsSeconds
    };
  }
}

if (typeof window !== 'undefined') {
  window.TelemetryParser = TelemetryParser;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TelemetryParser };
}
