/**
 * Safar AI - Fare Calculation Service (Stage 2)
 *
 * Implements deterministic fare lookup against database/fares.json.
 * Strict Data Safety: All fare data is marked DEMO.
 * Unsupported routes strictly return: "I don't have verified information for this route yet."
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DB_DIR = path.join(ROOT_DIR, 'database');

// Lazy-loaded or cached database references
let cachedLocations = null;
let cachedFares = null;

export function getLocations() {
  if (!cachedLocations) {
    const locPath = path.join(DB_DIR, 'locations.json');
    cachedLocations = JSON.parse(fs.readFileSync(locPath, 'utf-8'));
  }
  return cachedLocations;
}

export function getFares() {
  if (!cachedFares) {
    const faresPath = path.join(DB_DIR, 'fares.json');
    cachedFares = JSON.parse(fs.readFileSync(faresPath, 'utf-8'));
  }
  return cachedFares;
}

/**
 * Standard vehicle modes supported in MVP
 */
export const VEHICLE_MODES = {
  minibus: {
    key: 'minibus',
    displayName: 'Minibus',
    aliases: ['minibus', 'mini-bus', 'mini bus', 'matador', 'mazda', 'van']
  },
  shared_taxi: {
    key: 'shared_taxi',
    displayName: 'Shared Taxi / Cab',
    aliases: ['shared taxi', 'shared cab', 'shared-taxi', 'shared-cab', 'sumo', 'tavera', 'cab', 'taxi', 'shared']
  },
  bus: {
    key: 'bus',
    displayName: 'Bus',
    aliases: ['bus', 'stage bus', 'srtc', 'jkrtc', 'e-bus', 'ebus']
  },
  auto_rickshaw: {
    key: 'auto_rickshaw',
    displayName: 'Auto Rickshaw',
    aliases: ['auto', 'auto rickshaw', 'autorickshaw', 'three wheeler', 'auto-rickshaw']
  },
  e_rickshaw: {
    key: 'e_rickshaw',
    displayName: 'E-Rickshaw',
    aliases: ['e-rickshaw', 'erickshaw', 'e rickshaw', 'toto']
  }
};

/**
 * Normalizes any string representation of vehicle type to standard key
 */
export function normalizeVehicleType(raw) {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase();

  for (const [key, meta] of Object.entries(VEHICLE_MODES)) {
    if (key === clean || meta.aliases.includes(clean)) {
      return meta;
    }
  }

  // Substring match for phrases like "in a shared taxi" or "via matador"
  for (const meta of Object.values(VEHICLE_MODES)) {
    for (const alias of meta.aliases) {
      if (clean.includes(alias)) {
        return meta;
      }
    }
  }

  return null;
}

/**
 * Normalizes location input against database/locations.json
 */
export function normalizeLocation(rawName, locationsList = null) {
  if (!rawName) return null;
  const list = locationsList || getLocations();
  const clean = String(rawName).trim().toLowerCase();

  for (const loc of list) {
    if (loc.id === clean || loc.name.toLowerCase() === clean) {
      return loc;
    }

    // Check multilingual aliases
    const aliases = [
      ...(loc.aliases.en || []),
      ...(loc.aliases.ur || []),
      ...(loc.aliases.hi || []),
      ...(loc.aliases.romanized || [])
    ].map(a => a.toLowerCase());

    if (aliases.includes(clean)) {
      return loc;
    }
  }

  return null;
}

/**
 * Calculates / looks up fare for origin and destination
 */
export function calculateFare({
  origin,
  destination,
  vehicleType = null,
  passengerType = null,
  luggageKg = null,
  locationsList = null,
  faresList = null
}) {
  const DISCLAIMER_TEXT = "Demo / Estimated data — actual fare may vary by operator.";

  // Missing origin or destination
  if (!origin || !destination) {
    return {
      success: false,
      type: "FARE",
      message: "Which route would you like to check? Please provide the starting point and destination.",
      disclaimer: DISCLAIMER_TEXT,
      source_type: "DEMO",
      missingFields: [
        ...(!origin ? ['origin'] : []),
        ...(!destination ? ['destination'] : [])
      ]
    };
  }

  const locations = locationsList || getLocations();
  const fares = faresList || getFares();

  const normOrigin = normalizeLocation(origin, locations);
  const normDest = normalizeLocation(destination, locations);

  // Unknown location
  if (!normOrigin || !normDest) {
    return {
      success: false,
      type: "FARE",
      message: "I don't have verified information for this route yet.",
      source_type: "DEMO",
      disclaimer: DISCLAIMER_TEXT,
      details: {
        originResolved: !!normOrigin,
        destinationResolved: !!normDest
      }
    };
  }

  // Search bidirectional fare record
  const fareRecord = fares.find(f => 
    (f.originId === normOrigin.id && f.destinationId === normDest.id) ||
    (f.originId === normDest.id && f.destinationId === normOrigin.id)
  );

  if (!fareRecord || !fareRecord.modes) {
    return {
      success: false,
      type: "FARE",
      origin: normOrigin.name,
      destination: normDest.name,
      message: "I don't have verified information for this route yet.",
      source_type: "DEMO",
      disclaimer: DISCLAIMER_TEXT
    };
  }

  // Determine vehicle mode
  const normalizedVehicle = normalizeVehicleType(vehicleType);
  const requestedKey = normalizedVehicle ? normalizedVehicle.key : null;

  let chosenModeKey = requestedKey;
  let vehicleInfo = normalizedVehicle;

  if (!chosenModeKey || !fareRecord.modes[chosenModeKey]) {
    // If requested vehicle is not in record, or none specified:
    if (requestedKey && !fareRecord.modes[requestedKey]) {
      // Requested vehicle mode is not available for this corridor
      const availableModesList = Object.keys(fareRecord.modes)
        .map(k => VEHICLE_MODES[k]?.displayName || k)
        .join(', ');
      
      return {
        success: false,
        type: "FARE",
        origin: normOrigin.name,
        destination: normDest.name,
        vehicleType: normalizedVehicle.displayName,
        message: `I don't have verified fare information for ${normalizedVehicle.displayName} on this route yet. Available modes: ${availableModesList}.`,
        source_type: "DEMO",
        disclaimer: DISCLAIMER_TEXT,
        availableModes: Object.keys(fareRecord.modes)
      };
    }

    // Default to minibus if present, otherwise first available mode
    if (fareRecord.modes.minibus) {
      chosenModeKey = 'minibus';
      vehicleInfo = VEHICLE_MODES.minibus;
    } else {
      chosenModeKey = Object.keys(fareRecord.modes)[0];
      vehicleInfo = VEHICLE_MODES[chosenModeKey] || { displayName: chosenModeKey };
    }
  }

  const modeFare = fareRecord.modes[chosenModeKey];

  // Passenger type advisory (preserve in request, no false statutory claims)
  let passengerNote = null;
  if (passengerType && String(passengerType).toLowerCase() !== 'regular') {
    passengerNote = `Note: Standard demo estimate shown. No official concession calculated for ${passengerType} in current MVP.`;
  }

  // Luggage advisory
  let luggageNote = null;
  if (luggageKg && Number(luggageKg) > 0) {
    luggageNote = "Note: MVP currently does not calculate additional luggage charges.";
  }

  const formattedText = 
`${normOrigin.name} → ${normDest.name}

Estimated Fare:
₹${modeFare.estimatedMin}–₹${modeFare.estimatedMax}

Vehicle:
${vehicleInfo.displayName}

Status:
DEMO / ESTIMATE

Notice:
${DISCLAIMER_TEXT}`;

  return {
    success: true,
    type: "FARE",
    origin: normOrigin.name,
    destination: normDest.name,
    vehicleType: vehicleInfo.displayName,
    distanceKm: fareRecord.distanceKm,
    fare: {
      min: modeFare.estimatedMin,
      max: modeFare.estimatedMax,
      note: modeFare.note || null
    },
    passengerType: passengerType || 'regular',
    passengerNote,
    luggageKg: luggageKg || null,
    luggageNote,
    status: "DEMO / ESTIMATE",
    source_type: "DEMO",
    disclaimer: DISCLAIMER_TEXT,
    notice: DISCLAIMER_TEXT,
    formattedText
  };
}
