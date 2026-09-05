/**
 * SafarApp - Dispute & Voice Assistant Engine (dispute-engine.js)
 * Implements SRO-97 Statutory Tariff Validation, Speech I/O, and Conductor Cards.
 */

const SafarDisputeEngine = (() => {
  // Official J&K Gazetted Stage Tariff Matrix (Base rates + Stage slabs)
  const STATUTORY_TARIFFS = {
    matador_minibus: { baseKm: 3, baseFare: 10, perKmAfter: 2.2, label: "Minibus / Matador (Stage Carriage)" },
    shared_sumo:     { baseKm: 4, baseFare: 15, perKmAfter: 3.5, label: "Shared Cab / Sumo / Tavera" },
    e_rickshaw:      { baseKm: 2, baseFare: 10, perKmAfter: 5.0, label: "E-Rickshaw (Short-Hop Point-to-Point)" },
    auto_rickshaw:   { baseKm: 1.5, baseFare: 18, perKmAfter: 12.0, label: "Metered Auto Rickshaw" }
  };

  // Known corridor distance cache (km) for instant offline dispute checks
  const CORRIDORS = {
    "lal chowk-batamaloo": { dist: 3.2, mode: "matador_minibus" },
    "lal chowk-dalgate": { dist: 2.8, mode: "matador_minibus" },
    "lal chowk-hazratbal": { dist: 10.5, mode: "matador_minibus" },
    "pantha chowk-lal chowk": { dist: 8.4, mode: "matador_minibus" },
    "jahangir chowk-budgam": { dist: 14.0, mode: "shared_sumo" },
    "jewel chowk-talab tillo": { dist: 4.1, mode: "matador_minibus" },
    "jewel chowk-rs pura": { dist: 22.0, mode: "shared_sumo" }
  };

  /**
   * Calculate statutory legal fare based on vehicle category and distance
   */
  function calculateLegalFare(vehicleType, distanceKm, isNight = false) {
    const tariff = STATUTORY_TARIFFS[vehicleType] || STATUTORY_TARIFFS.matador_minibus;
    let fare = tariff.baseFare;

    if (distanceKm > tariff.baseKm) {
      const extraKm = distanceKm - tariff.baseKm;
      fare += Math.ceil(extraKm * tariff.perKmAfter);
    }

    if (isNight) {
      fare = Math.round(fare * 1.20); // 20% statutory night allowance
    }

    return {
      legalFare: fare,
      breakdown: `${tariff.label}: Base ₹${tariff.baseFare} for ${tariff.baseKm}km + ₹${tariff.perKmAfter}/km thereafter${isNight ? ' (+20% night tariff)' : ''}`
    };
  }

  /**
   * Evaluate overcharging discrepancy
   */
  function verifyFare(origin, destination, demandedFare, vehicleType = "matador_minibus") {
    const key = `${origin.toLowerCase().trim()}-${destination.toLowerCase().trim()}`;
    const reverseKey = `${destination.toLowerCase().trim()}-${origin.toLowerCase().trim()}`;
    const corridor = CORRIDORS[key] || CORRIDORS[reverseKey] || { dist: 4.0, mode: vehicleType };

    const now = new Date();
    const isNight = now.getHours() >= 19 || now.getHours() < 6;
    const { legalFare, breakdown } = calculateLegalFare(corridor.mode || vehicleType, corridor.dist, isNight);

    const demanded = Number(demandedFare);
    const overcharge = Math.max(0, demanded - legalFare);

    return {
      origin,
      destination,
      distanceKm: corridor.dist,
      demandedFare: demanded,
      legalFare,
      overcharge,
      isViolation: overcharge > 0,
      breakdown,
      mvaSection: "Section 192A / SRO-97",
      penaltyNotice: "Permit Violation: fine up to ₹10,000 and suspension of route authorization."
    };
  }

  /**
   * Natural Language / Voice Intent Extractor
   */
  function parseDisputeQuery(rawText) {
    const text = rawText.toLowerCase();
    const fareMatch = text.match(/(?:charging|manga|demand|rupees|rs\.?|₹)\s*(\d+)/i) || text.match(/(\d+)\s*(?:rupees|rs|churge|le raha)/i);
    const fare = fareMatch ? parseInt(fareMatch[1], 10) : null;

    let origin = "Lal Chowk";
    let destination = "Batamaloo";

    if (text.includes("to")) {
      const parts = text.split("to");
      origin = parts[0].replace(/.*from/i, "").trim();
      destination = parts[1].replace(/(?:charging|for|\d+|rupees).*/gi, "").trim();
    }

    return {
      origin: origin || "Lal Chowk",
      destination: destination || "Batamaloo",
      demandedFare: fare || 30
    };
  }

  /**
   * Speech Synthesis: Speaks legal rate to the conductor in Urdu/Hindustani
   */
  function verbalNegotiationTTS(legalFare, origin, destination) {
    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const text = `محکمہ ٹرانسپورٹ کے سرکاری نوٹیفکیشن کے مطابق، ${origin} سے ${destination} تک کا قانونی کرایہ صرف ${legalFare} روپے ہے۔ اس سے زیادہ طلب کرنا قانوناً جرم ہے۔`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ur-IN";
    utterance.rate = 0.92;

    const voices = window.speechSynthesis.getVoices();
    const urduVoice = voices.find(v => v.lang.includes("ur") || v.lang.includes("hi"));
    if (urduVoice) utterance.voice = urduVoice;

    window.speechSynthesis.speak(utterance);
  }

  return {
    STATUTORY_TARIFFS,
    CORRIDORS,
    calculateLegalFare,
    verifyFare,
    parseDisputeQuery,
    verbalNegotiationTTS
  };
})();

// Attach to global scope
if (typeof window !== "undefined") {
  window.SafarDisputeEngine = SafarDisputeEngine;
}
if (typeof globalThis !== "undefined") {
  globalThis.SafarDisputeEngine = SafarDisputeEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SafarDisputeEngine;
}
