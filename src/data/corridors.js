import corridorsData from './corridors.json' with { type: 'json' };

export const corridors = corridorsData;
export const JK_CORRIDORS = corridorsData;

export const OCCUPANCY_LABELS = {
  low: 'Seats Available',
  moderate: 'Filling Fast',
  high: 'High Rush'
};

export const OCCUPANCY_COLORS = {
  low: '#16a34a',
  moderate: '#d97706',
  high: '#dc2626'
};

export function searchCorridors(query) {
  if (!query || !query.trim()) return corridors;
  const q = query.toLowerCase().trim();
  return corridors.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.stages.some((s) => s.stopName.toLowerCase().includes(q))
  );
}

/**
 * Calculate the statutory fare delta between two stages on a corridor.
 * Corridors in J&K operate bidirectionally for stage carriages; reverse
 * boarding between intermediate stages is valid and charges the absolute delta.
 * If toStopId is omitted, returns the cumulative statutory fare for fromStopId from source.
 *
 * @param {string} corridorId - Corridor identifier (e.g. 'JK-SRI-01')
 * @param {string} fromStopId - Origin stop ID
 * @param {string} [toStopId] - Destination stop ID
 * @returns {number | null} - Cumulative statutory fare delta, or null if invalid
 */
export function getStageFare(corridorId, fromStopId, toStopId) {
  const corridor = corridors.find((c) => c.id === corridorId);
  if (!corridor) return null;
  if (!toStopId) {
    const stage = corridor.stages.find((s) => s.stopId === fromStopId);
    return stage ? stage.statutoryFare : null;
  }
  const fromStage = corridor.stages.find((s) => s.stopId === fromStopId);
  const toStage = corridor.stages.find((s) => s.stopId === toStopId);
  if (!fromStage || !toStage) return null;
  return Math.abs(toStage.statutoryFare - fromStage.statutoryFare);
}
