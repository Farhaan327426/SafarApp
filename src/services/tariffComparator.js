/**
 * SAFAR — Tariff Schedule Comparator
 * Compares two tariff schedules, resolves statutory precedence, and computes fare deltas.
 */

/**
 * Resolves precedence between two schedules based on effectiveFrom and amendmentSequence.
 * @param {import('../types/transit').TariffSchedule} current
 * @param {import('../types/transit').TariffSchedule} incoming
 * @returns {'CURRENT_SUPERSEDES' | 'INCOMING_SUPERSEDES' | 'IDENTICAL_PRECEDENCE'}
 */
export function resolvePrecedence(current, incoming) {
  const currentEffective = new Date(current.effectiveFrom).getTime();
  const incomingEffective = new Date(incoming.effectiveFrom).getTime();

  if (incomingEffective > currentEffective) {
    return 'INCOMING_SUPERSEDES';
  }
  if (incomingEffective < currentEffective) {
    return 'CURRENT_SUPERSEDES';
  }

  // Same effective date: check amendmentSequence
  if (incoming.amendmentSequence > current.amendmentSequence) {
    return 'INCOMING_SUPERSEDES';
  }
  if (incoming.amendmentSequence < current.amendmentSequence) {
    return 'CURRENT_SUPERSEDES';
  }

  return 'IDENTICAL_PRECEDENCE';
}

/**
 * Compares two tariff schedules and produces a granular delta report.
 *
 * @param {import('../types/transit').TariffSchedule} current
 * @param {import('../types/transit').TariffSchedule} incoming
 * @returns {Record<string, any>}
 */
export function compareTariffSchedules(current, incoming) {
  const precedence = resolvePrecedence(current, incoming);
  /** @type {Record<string, any>} */
  const deltas = {};

  const vehicleIds = /** @type {import('../types/transit').VehicleId[]} */ (Object.keys(current.tariffs));

  for (const vId of vehicleIds) {
    const cur = /** @type {any} */ (current.tariffs[vId]);
    const inc = /** @type {any} */ (incoming.tariffs[vId]);

    if (!inc) {
      deltas[vId] = { status: 'REMOVED' };
      continue;
    }

    if (cur.calculationType !== inc.calculationType) {
      deltas[vId] = {
        type: 'CALCULATION_MODEL_CHANGED',
        status: 'MODEL_CHANGED',
        oldCalculationType: cur.calculationType,
        newCalculationType: inc.calculationType
      };
      continue;
    }

    const vehicleDelta = {
      status: 'MODIFIED',
      calculationType: cur.calculationType,
      changes: /** @type {Record<string, any>} */ ({})
    };

    let hasChange = false;

    if (cur.calculationType === 'PER_KM') {
      if (cur.perKm !== inc.perKm) {
        hasChange = true;
        vehicleDelta.changes.perKm = {
          old: cur.perKm,
          new: inc.perKm,
          diff: inc.perKm - cur.perKm,
          percentChange: Number((((inc.perKm - cur.perKm) / cur.perKm) * 100).toFixed(1))
        };
      }
    } else if (cur.calculationType === 'FIRST_KM_PLUS_SUBSEQUENT') {
      if (cur.firstKm !== inc.firstKm || cur.subsequentKm !== inc.subsequentKm) {
        hasChange = true;
        vehicleDelta.changes.firstKm = { old: cur.firstKm, new: inc.firstKm };
        vehicleDelta.changes.subsequentKm = { old: cur.subsequentKm, new: inc.subsequentKm };
      }
    } else if (cur.calculationType === 'BASE_PLUS_PER_KM') {
      if (cur.baseFare !== inc.baseFare || cur.perKm !== inc.perKm) {
        hasChange = true;
        vehicleDelta.changes.baseFare = { old: cur.baseFare, new: inc.baseFare };
        vehicleDelta.changes.perKm = { old: cur.perKm, new: inc.perKm };
      }
    } else if (cur.calculationType === 'MIN_PLUS_PER_KM') {
      if (cur.minFare !== inc.minFare || cur.perKm !== inc.perKm) {
        hasChange = true;
        vehicleDelta.changes.minFare = { old: cur.minFare, new: inc.minFare };
        vehicleDelta.changes.perKm = { old: cur.perKm, new: inc.perKm };
      }
    } else if (cur.calculationType === 'TERRAIN_RATE') {
      if (
        cur.minFare !== inc.minFare ||
        cur.ratesByTerrain?.plain !== inc.ratesByTerrain?.plain ||
        cur.ratesByTerrain?.hilly !== inc.ratesByTerrain?.hilly
      ) {
        hasChange = true;
        vehicleDelta.changes.minFare = { old: cur.minFare, new: inc.minFare };
        vehicleDelta.changes.plain = {
          old: cur.ratesByTerrain.plain,
          new: inc.ratesByTerrain.plain
        };
        vehicleDelta.changes.hilly = {
          old: cur.ratesByTerrain.hilly,
          new: inc.ratesByTerrain.hilly
        };
      }
    }

    deltas[vId] = hasChange ? vehicleDelta : { status: 'UNCHANGED' };
  }

  return {
    precedence,
    scheduleComparison: {
      currentScheduleId: current.activeScheduleId,
      incomingScheduleId: incoming.activeScheduleId,
      currentEffective: current.effectiveFrom,
      incomingEffective: incoming.effectiveFrom
    },
    deltas
  };
}
