/**
 * SAFAR — useFareCalculator Hook
 * Extracts fare computation logic from App.jsx into a focused, testable hook.
 */
import { useMemo, useState } from "react";

export function calculateFare({ vehicle, km, terrainRegion }) {
  if (!vehicle || km <= 0) {
    return {
      isViable: true,
      base: vehicle?.base ?? 0,
      distanceCost: 0,
      localAdjustment: 0,
      totalSingle: 0,
      fullCabCost: 0,
      formulaDesc: vehicle ? `Official rate: ₹${vehicle.perKm}/km` : "Select a vehicle",
      perKmRate: vehicle?.perKm ?? 0,
    };
  }

  let base = vehicle.base;
  let distanceCost = 0;
  let localAdjustment = 0;
  let totalSingle = 0;
  let formulaDesc = "";

  switch (vehicle.calcType) {
    case "e-rickshaw":
      base = 15;
      distanceCost = Math.round(km * 15);
      totalSingle = Math.max(15, distanceCost);
      formulaDesc = `Flat ₹15/km (${km} km × ₹15)`;
      break;

    case "e-auto":
      base = 25;
      distanceCost = km <= 1 ? 0 : Math.round((km - 1) * 20);
      totalSingle = km <= 1 ? 25 : 25 + distanceCost;
      formulaDesc = km <= 1 ? "1st KM Base (₹25)" : `₹25 (1st km) + ${(km - 1)} km × ₹20/km`;
      break;

    case "stage-slab":
      if (km <= 3)       { totalSingle = 9;  base = 9;  formulaDesc = "Stage Slab: 0–3 KM (₹9)";   }
      else if (km <= 5)  { totalSingle = 14; base = 14; formulaDesc = "Stage Slab: 3–5 KM (₹14)";  }
      else if (km <= 10) { totalSingle = 17; base = 17; formulaDesc = "Stage Slab: 5–10 KM (₹17)"; }
      else if (km <= 15) { totalSingle = 20; base = 20; formulaDesc = "Stage Slab: 10–15 KM (₹20)";}
      else if (km <= 20) { totalSingle = 26; base = 26; formulaDesc = "Stage Slab: 15–20 KM (₹26)";}
      else {
        const extra = km - 20;
        distanceCost = Math.round(extra * 1.40);
        totalSingle = 26 + distanceCost;
        formulaDesc = `₹26 (20km slab) + ${extra} km @ 50% Concession (₹1.40/km)`;
      }
      break;

    case "stage-carriage": {
      const ratePerKm = terrainRegion === "kashmir-plain" ? 1.64
        : terrainRegion === "kashmir-hill" ? 1.88
        : terrainRegion === "jammu-plain" ? 1.12
        : 1.59;
      base = 10;
      distanceCost = Math.round(km * ratePerKm);
      totalSingle = Math.max(10, distanceCost);
      formulaDesc = `${km} km × ₹${ratePerKm}/km`;
      break;
    }

    case "stage-carriage-big": {
      const ratePerKm = terrainRegion === "kashmir-plain" ? 1.40
        : terrainRegion === "kashmir-hill" ? 1.64
        : terrainRegion === "jammu-plain" ? 1.12
        : 1.59;
      base = 10;
      distanceCost = Math.round(km * ratePerKm);
      totalSingle = Math.max(10, distanceCost);
      formulaDesc = `${km} km × ₹${ratePerKm}/km`;
      break;
    }

    case "tourist-group":
      totalSingle = Math.max(25, Math.round(km * 2.25));
      formulaDesc = `${km} km × ₹2.25/km (Per Seat) · ₹29/km (Charter)`;
      break;

    case "urban-stage":
      if (km <= 3)  { totalSingle = 8;  base = 8;  formulaDesc = "Urban Stage: 0–3 KM (₹8)";  }
      else if (km <= 6)  { totalSingle = 12; base = 12; formulaDesc = "Urban Stage: 3–6 KM (₹12)"; }
      else if (km <= 10) { totalSingle = 15; base = 15; formulaDesc = "Urban Stage: 6–10 KM (₹15)";}
      else { totalSingle = 18; base = 18; formulaDesc = "Urban Stage: 10–15 KM (₹18)"; }
      break;

    case "metered-auto":
      base = 45;
      distanceCost = km <= 2 ? 0 : Math.round((km - 2) * 7.4);
      totalSingle = km <= 2 ? 45 : 45 + distanceCost;
      formulaDesc = km <= 2 ? "First 2 KM Meter (₹45)" : `₹45 (First 2 km) + ${(km - 2)} km × ₹7.40/km`;
      break;

    default:
      base = vehicle.base;
      distanceCost = Math.round(km * vehicle.perKm);
      localAdjustment = vehicle.key === "suv-taxi" ? 20 : 0;
      totalSingle = Math.max(15, base + distanceCost + localAdjustment);
      formulaDesc = `${km} km × ₹${vehicle.perKm}/km`;
      break;
  }

  const fullCabCost = vehicle.key === "force-traveler"
    ? Math.max(1200, Math.round(km * 29.0))
    : vehicle.isPerSeat
    ? totalSingle * vehicle.seatsMultiplier
    : totalSingle;

  return {
    isViable: true,
    base,
    distanceCost,
    localAdjustment,
    totalSingle,
    fullCabCost,
    formulaDesc,
    perKmRate: vehicle.perKm,
  };
}

/**
 * Hook: useFareCalculator
 * Computes statutory fare and manages per-seat / full-cab price mode.
 */
export function useFareCalculator({ vehicle, distance, terrainRegion }) {
  const [priceMode, setPriceMode] = useState("per-seat");

  const fareParts = useMemo(() => {
    const km = Number(distance) || 0;
    return calculateFare({ vehicle, km, terrainRegion });
  }, [vehicle, distance, terrainRegion]);

  const displayFare = useMemo(() => {
    if (!fareParts.isViable) return 0;
    if (!vehicle?.isPerSeat) return fareParts.totalSingle;
    return priceMode === "full-cab" ? fareParts.fullCabCost : fareParts.totalSingle;
  }, [vehicle, fareParts, priceMode]);

  return { fareParts, displayFare, priceMode, setPriceMode };
}
