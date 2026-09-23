/**
 * SAFAR — Statutory Fare Calculator Hook
 * Integrates statutory fareEngine with route viability and commuter price modes.
 * Enforces hard-disable contract: returns displayFare: null when enabled is false.
 * Fully supports direct invocation in pure test environments and React component renders.
 */

import React, { useMemo, useState } from 'react';
import { getVehicleRouteViability } from '../data/transitZones.js';
import { calculateStatutoryFare } from '../services/fareEngine.js';

/**
 * Pure fare computation engine.
 * @param {Object} params
 * @param {any} [params.vehicle]
 * @param {number|string} [params.distance]
 * @param {string} [params.terrainRegion]
 * @param {string} [params.from]
 * @param {string} [params.to]
 * @param {any[] | null} [params.eligibleVehicles]
 * @param {boolean} [params.enabled]
 * @param {import('../types/transit').TariffEntry | null} [params.tariffEntry]
 * @param {string} [params.priceMode]
 * @returns {{ fareParts: Record<string, any>, displayFare: number | null, priceMode: string }}
 */
export function calculateFareQuote({
  vehicle,
  distance,
  terrainRegion = 'kashmir-plain',
  from = '',
  to = '',
  eligibleVehicles = null,
  enabled = true,
  tariffEntry = null,
  priceMode = 'per-seat'
}) {
  if (!enabled) {
    return {
      fareParts: {
        isViable: false,
        isZeroEligible: false,
        viability: { isViable: false, reason: 'Calculation disabled', maxKm: 0 },
        base: 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: 'Fare calculation disabled',
        perKmRate: 0
      },
      displayFare: null,
      priceMode
    };
  }

  const km = Number(distance) || 0;
  const hasRoute = Boolean(from?.trim() && to?.trim());

  // If zero vehicles are eligible for a selected corridor
  if (hasRoute && (!vehicle || (Array.isArray(eligibleVehicles) && eligibleVehicles.length === 0))) {
    return {
      fareParts: {
        isViable: false,
        isZeroEligible: true,
        viability: {
          isViable: false,
          reason: 'No registered vehicle category operates this route.',
          maxKm: 0
        },
        base: 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: 'No registered vehicle category operates this route.',
        perKmRate: 0
      },
      displayFare: null,
      priceMode
    };
  }

  if (!vehicle) {
    return {
      fareParts: {
        isViable: false,
        isZeroEligible: false,
        viability: { isViable: false, reason: 'No vehicle selected', maxKm: 0 },
        base: 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: 'Please select a vehicle',
        perKmRate: 0
      },
      displayFare: null,
      priceMode
    };
  }

  const viability = getVehicleRouteViability(vehicle.key || vehicle.id, km, from, to);

  if (km <= 0) {
    return {
      fareParts: {
        isViable: true,
        isZeroEligible: false,
        viability,
        base: vehicle.base || 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: `Official statutory rate: ₹${vehicle.perKm || 0}/km`,
        perKmRate: vehicle.perKm || 0
      },
      displayFare: null,
      priceMode
    };
  }

  if (!viability.isViable) {
    return {
      fareParts: {
        isViable: false,
        isZeroEligible: false,
        viability,
        base: 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: `No Fare Available — Route not serviced by ${vehicle.name || vehicle.label || 'this vehicle'}`,
        perKmRate: 0
      },
      displayFare: null,
      priceMode
    };
  }

  // If formal S.O. 126 discriminated tariffEntry is provided, evaluate via pure fareEngine
  if (tariffEntry) {
    const terrain = terrainRegion.includes('hill') ? 'hilly' : 'plain';
    const statutoryTotal = calculateStatutoryFare(tariffEntry, km, terrain) ?? 0;

    const fullCabCost =
      (vehicle.key || vehicle.id) === 'force-traveler'
        ? Math.max(1200, Math.round(km * 29.0))
        : vehicle.isPerSeat
        ? statutoryTotal * (vehicle.seatsMultiplier || vehicle.capacity || 1)
        : statutoryTotal;

    const totalSingle = statutoryTotal;
    const displayFare = !vehicle.isPerSeat
      ? totalSingle
      : priceMode === 'full-cab'
      ? fullCabCost
      : totalSingle;

    const tAny = /** @type {any} */ (tariffEntry);
    const base = tAny.baseFare || tAny.minFare || tAny.firstKm || 0;
    const perKmRate = tAny.perKm || 0;

    return {
      fareParts: {
        isViable: true,
        viability,
        base,
        distanceCost: statutoryTotal,
        localAdjustment: 0,
        totalSingle,
        fullCabCost,
        formulaDesc: `Statutory S.O. 126 Rate (${tariffEntry.calculationType})`,
        perKmRate
      },
      displayFare,
      priceMode
    };
  }

  let base = vehicle.base || 0;
  let distanceCost = 0;
  let localAdjustment = 0;
  let totalSingle = 0;
  let formulaDesc = '';

  switch (vehicle.calcType) {
    case 'e-rickshaw':
      base = 15;
      distanceCost = Math.round(km * 15);
      totalSingle = Math.max(15, distanceCost);
      formulaDesc = `Flat ₹15/km (${km} km × ₹15)`;
      break;

    case 'e-auto':
      base = 25;
      distanceCost = km <= 1 ? 0 : Math.round((km - 1) * 20);
      totalSingle = km <= 1 ? 25 : 25 + distanceCost;
      formulaDesc = km <= 1 ? '1st KM Base (₹25)' : `₹25 (1st km) + ${(km - 1)} km × ₹20/km`;
      break;

    case 'stage-slab':
      if (km <= 3) {
        totalSingle = 9;
        base = 9;
        formulaDesc = 'Stage Slab: 0 to 3 KM (₹9)';
      } else if (km <= 5) {
        totalSingle = 14;
        base = 14;
        formulaDesc = 'Stage Slab: 3 to 5 KM (₹14)';
      } else if (km <= 10) {
        totalSingle = 17;
        base = 17;
        formulaDesc = 'Stage Slab: 5 to 10 KM (₹17)';
      } else if (km <= 15) {
        totalSingle = 20;
        base = 20;
        formulaDesc = 'Stage Slab: 10 to 15 KM (₹20)';
      } else if (km <= 20) {
        totalSingle = 26;
        base = 26;
        formulaDesc = 'Stage Slab: 15 to 20 KM (₹26)';
      } else {
        base = 26;
        const extraKm = km - 20;
        distanceCost = Math.round(extraKm * 1.40);
        totalSingle = 26 + distanceCost;
        formulaDesc = `₹26 (20km slab) + ${extraKm} km @ 50% Concession (₹1.40/km)`;
      }
      break;

    case 'stage-carriage':
      {
        const ratePerKm =
          terrainRegion === 'kashmir-plain'
            ? 1.64
            : terrainRegion === 'kashmir-hill'
            ? 1.88
            : terrainRegion === 'jammu-plain'
            ? 1.12
            : 1.59;
        base = 10;
        distanceCost = Math.round(km * ratePerKm);
        totalSingle = Math.max(10, distanceCost);
        formulaDesc = `${km} km × ₹${ratePerKm}/km (SRO-97 Gazetted)`;
      }
      break;

    case 'stage-carriage-big':
      {
        const ratePerKm =
          terrainRegion === 'kashmir-plain'
            ? 1.40
            : terrainRegion === 'kashmir-hill'
            ? 1.64
            : terrainRegion === 'jammu-plain'
            ? 1.12
            : 1.59;
        base = 10;
        distanceCost = Math.round(km * ratePerKm);
        totalSingle = Math.max(10, distanceCost);
        formulaDesc = `${km} km × ₹${ratePerKm}/km (SRO-97 Gazetted)`;
      }
      break;

    case 'tourist-group':
      {
        const seatCost = Math.max(25, Math.round(km * 2.25));
        totalSingle = seatCost;
        formulaDesc = `${km} km × ₹2.25/km (Per Seat) · ₹29/km (Charter)`;
      }
      break;

    case 'urban-stage':
      if (km <= 3) {
        totalSingle = 8;
        base = 8;
        formulaDesc = 'Urban Stage: 0 to 3 KM (₹8)';
      } else if (km <= 6) {
        totalSingle = 12;
        base = 12;
        formulaDesc = 'Urban Stage: 3 to 6 KM (₹12)';
      } else if (km <= 10) {
        totalSingle = 15;
        base = 15;
        formulaDesc = 'Urban Stage: 6 to 10 KM (₹15)';
      } else {
        totalSingle = 18;
        base = 18;
        formulaDesc = 'Urban Stage: 10 to 15 KM (₹18)';
      }
      break;

    case 'metered-auto':
      base = 45;
      distanceCost = km <= 2 ? 0 : Math.round((km - 2) * 7.4);
      totalSingle = km <= 2 ? 45 : 45 + distanceCost;
      formulaDesc = km <= 2 ? 'First 2 KM Meter (₹45)' : `₹45 (First 2 km) + ${(km - 2)} km × ₹7.40/km`;
      break;

    default:
      base = vehicle.base || 35;
      distanceCost = Math.round(km * (vehicle.perKm || 5.2));
      localAdjustment = (vehicle.key || vehicle.id) === 'suv-taxi' ? 20 : 0;
      totalSingle = Math.max(15, base + distanceCost + localAdjustment);
      formulaDesc = `${km} km × ₹${vehicle.perKm || 5.2}/km`;
      break;
  }

  const fullCabCost =
    (vehicle.key || vehicle.id) === 'force-traveler'
      ? Math.max(1200, Math.round(km * 29.0))
      : vehicle.isPerSeat
      ? totalSingle * (vehicle.seatsMultiplier || 1)
      : totalSingle;

  const displayFare = !vehicle.isPerSeat
    ? totalSingle
    : priceMode === 'full-cab'
    ? fullCabCost
    : totalSingle;

  return {
    fareParts: {
      isViable: true,
      viability,
      base,
      distanceCost,
      localAdjustment,
      totalSingle,
      fullCabCost,
      formulaDesc,
      perKmRate: vehicle.perKm || 0
    },
    displayFare,
    priceMode
  };
}

/**
 * Hook for statutory fare computations per J&K Motor Vehicles Gazette & S.O. 126
 *
 * @param {Object} params
 * @param {any} params.vehicle - Active vehicle object
 * @param {number|string} params.distance - Distance in kilometers
 * @param {string} [params.terrainRegion='kashmir-plain'] - Region string
 * @param {string} [params.from=''] - Origin location
 * @param {string} [params.to=''] - Destination location
 * @param {any[] | null} [params.eligibleVehicles=null] - Array of route-eligible vehicles
 * @param {boolean} [params.enabled=true] - Guard contract: hard-disable fare calculation when false
 * @param {import('../types/transit').TariffEntry | null} [params.tariffEntry=null] - S.O. 126 tariff entry
 * @returns {{ fareParts: Record<string, any>, displayFare: number | null, priceMode: string, setPriceMode: Function }}
 */
export function useFareCalculator(params) {
  // If executed outside of a React render tree (e.g. pure Node unit test runner)
  // return direct computation without attempting to invoke React hooks.
  const reactAny = /** @type {any} */ (React);
  const isInsideReact = Boolean(
    reactAny?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current
  );

  if (!isInsideReact) {
    const quote = calculateFareQuote({ ...params, priceMode: 'per-seat' });
    return {
      fareParts: quote.fareParts,
      displayFare: quote.displayFare,
      priceMode: quote.priceMode,
      setPriceMode: () => {}
    };
  }

  const [priceMode, setPriceMode] = useState('per-seat'); // 'per-seat' | 'full-cab'

  const quote = useMemo(() => {
    return calculateFareQuote({ ...params, priceMode });
  }, [
    params.vehicle,
    params.distance,
    params.terrainRegion,
    params.from,
    params.to,
    params.eligibleVehicles,
    params.enabled,
    params.tariffEntry,
    priceMode
  ]);

  return {
    fareParts: quote.fareParts,
    displayFare: quote.displayFare,
    priceMode,
    setPriceMode
  };
}
