/**
 * SAFAR — Regulated Fare Engine Integration
 */

export async function computeOfficialFare(vehicleType, distance, passengerCategory = 'General') {
  if (typeof window !== "undefined" && window.FareEngine && typeof window.FareEngine.getOfficialFare === "function") {
    try {
      return await window.FareEngine.getOfficialFare(vehicleType, distance, passengerCategory);
    } catch (e) {
      console.warn('[computeOfficialFare] FareEngine calculation error:', e);
    }
  } else if (typeof window !== "undefined" && typeof window.getOfficialFare === "function") {
    return window.getOfficialFare(vehicleType, distance, passengerCategory);
  }

  // Basic SRO slab fallback if external FareEngine library not yet initialized
  const baseSlabs = [
    { maxKm: 3, fare: 9 },
    { maxKm: 5, fare: 14 },
    { maxKm: 10, fare: 17 },
    { maxKm: 15, fare: 20 },
    { maxKm: 20, fare: 26 }
  ];

  let fare = 26;
  for (const slab of baseSlabs) {
    if (distance <= slab.maxKm) {
      fare = slab.fare;
      break;
    }
  }

  if (distance > 20) {
    fare = 26 + (distance - 20) * 1.40;
  }

  let discountMult = 1.0;
  if (passengerCategory === 'Student' || passengerCategory === 'Specially Abled') discountMult = 0.5;
  else if (passengerCategory === 'Senior Citizen') discountMult = 0.75;

  return {
    fare: Math.max(5, Math.round(fare * discountMult)),
    source: {
      authority: "J&K Transport Department",
      notification: "SRO-97",
      date: "2021-08-10"
    }
  };
}
