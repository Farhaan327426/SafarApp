/**
 * SAFAR — Pure Statutory Fare Engine
 * Evaluates machine-readable statutory fare models per J&K Transport Department notifications.
 * Implements S.O. 126 discriminated calculation models with pro-rata fractional distance policy.
 */

/**
 * Calculates the statutory maximum chargeable fare.
 *
 * @param {import('../types/transit').FareCalculation} calculation
 * @param {number} distanceKm - Road network distance in kilometres.
 * @param {import('../types/transit').StatutoryTerrainRegion | string} [terrain='kashmir-plain'] - Corridor statutory tariff terrain.
 * @returns {number | null} Total calculated statutory fare in INR rounded to nearest Rupee, or null if inputs invalid.
 */
export function calculateStatutoryFare(calculation, distanceKm, terrain = 'kashmir-plain') {
  if (
    calculation == null ||
    typeof distanceKm !== 'number' ||
    isNaN(distanceKm) ||
    distanceKm <= 0
  ) {
    return null;
  }

  switch (calculation.calculationType) {
    case 'PER_KM': {
      if (typeof calculation.perKm !== 'number') return null;
      return Math.round(distanceKm * calculation.perKm);
    }

    case 'FIRST_KM_PLUS_SUBSEQUENT': {
      const { firstKm, subsequentKm } = calculation;
      if (typeof firstKm !== 'number' || typeof subsequentKm !== 'number') return null;
      if (distanceKm <= 1.0) {
        return firstKm;
      }
      // S.O. 126 rule: first kilometre flat rate + subsequent distance pro-rata
      return Math.round(firstKm + (distanceKm - 1.0) * subsequentKm);
    }

    case 'BASE_PLUS_PER_KM': {
      const { baseFare, perKm } = calculation;
      if (typeof baseFare !== 'number' || typeof perKm !== 'number') return null;
      return Math.round(baseFare + distanceKm * perKm);
    }

    case 'MIN_PLUS_PER_KM': {
      const { minFare, perKm } = calculation;
      if (typeof minFare !== 'number' || typeof perKm !== 'number') return null;
      const calculated = Math.round(distanceKm * perKm);
      return Math.max(minFare, calculated);
    }

    case 'TERRAIN_RATE': {
      const { minFare, ratesByTerrain } = calculation;
      if (typeof minFare !== 'number' || !ratesByTerrain) return null;
      const rate = /** @type {Record<string, number>} */ (ratesByTerrain)[terrain];
      if (typeof rate !== 'number') {
        throw new Error(
          `[FARE_ENGINE] No statutory terrain rate for '${terrain}'.`
        );
      }
      return Math.max(
        Math.round(minFare),
        Math.round(distanceKm * rate)
      );
    }

    default:
      return null;
  }
}
