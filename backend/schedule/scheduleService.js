/**
 * Safar AI - Schedule Lookup Service (Stage 4)
 *
 * Implements static timetable lookup against database/schedules.json.
 * Strict Data Safety: All schedule data is marked DEMO.
 * Mandatory disclaimer: "This is the listed schedule, not live vehicle information."
 * Unsupported schedules strictly return: "I don't have verified schedule information for this route yet."
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeLocation, getLocations, normalizeVehicleType } from '../fare/fareService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DB_DIR = path.join(ROOT_DIR, 'database');

let cachedSchedules = null;

export function getSchedules() {
  if (!cachedSchedules) {
    const schedulesPath = path.join(DB_DIR, 'schedules.json');
    cachedSchedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));
  }
  return cachedSchedules;
}

/**
 * Looks up listed static schedule for a corridor
 */
export function getSchedule({
  origin,
  destination,
  vehicleType = null,
  locationsList = null,
  schedulesList = null
}) {
  const DISCLAIMER_TEXT = "This is the listed schedule, not live vehicle information.";

  // Missing origin or destination
  if (!origin || !destination) {
    return {
      success: false,
      type: "SCHEDULE",
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
  const schedules = schedulesList || getSchedules();

  const normOrigin = normalizeLocation(origin, locations);
  const normDest = normalizeLocation(destination, locations);

  // Unknown location
  if (!normOrigin || !normDest) {
    return {
      success: false,
      type: "SCHEDULE",
      message: "I don't have verified schedule information for this route yet.",
      source_type: "DEMO",
      disclaimer: DISCLAIMER_TEXT,
      details: {
        originResolved: !!normOrigin,
        destinationResolved: !!normDest
      }
    };
  }

  // 1. Direct forward match
  let matched = schedules.find(s =>
    s.origin.toLowerCase() === normOrigin.name.toLowerCase() &&
    s.destination.toLowerCase() === normDest.name.toLowerCase()
  );

  // 2. Reverse match fallback
  if (!matched) {
    matched = schedules.find(s =>
      s.origin.toLowerCase() === normDest.name.toLowerCase() &&
      s.destination.toLowerCase() === normOrigin.name.toLowerCase()
    );
  }

  // Unsupported schedule corridor
  if (!matched) {
    return {
      success: false,
      type: "SCHEDULE",
      origin: normOrigin.name,
      destination: normDest.name,
      message: "I don't have verified schedule information for this route yet.",
      source_type: "DEMO",
      disclaimer: DISCLAIMER_TEXT
    };
  }

  // Check vehicle type compatibility if user requested a specific mode
  if (vehicleType) {
    const normVehicle = normalizeVehicleType(vehicleType);
    const modeString = (matched.mode || '').toLowerCase();
    
    let isCompatible = false;
    if (normVehicle) {
      isCompatible = modeString.includes(normVehicle.key) ||
        modeString.includes(normVehicle.displayName.toLowerCase()) ||
        normVehicle.aliases.some(a => modeString.includes(a));
    } else {
      isCompatible = modeString.includes(String(vehicleType).trim().toLowerCase());
    }

    if (!isCompatible) {
      return {
        success: false,
        type: "SCHEDULE",
        origin: normOrigin.name,
        destination: normDest.name,
        vehicleType: normVehicle ? normVehicle.displayName : vehicleType,
        message: "I don't have a listed schedule for that vehicle type on this route.",
        availableModes: matched.mode,
        source_type: "DEMO",
        disclaimer: DISCLAIMER_TEXT
      };
    }
  }

  const formattedText =
`${normOrigin.name} → ${normDest.name}

Listed Schedule:
First listed departure: ${matched.firstDeparture}
Typical frequency: ${matched.typicalFrequency}
Last listed departure: ${matched.lastDeparture}
Vehicle: ${matched.mode}

Status:
DEMO / ESTIMATE

Notice:
${DISCLAIMER_TEXT}`;

  return {
    success: true,
    type: "SCHEDULE",
    origin: normOrigin.name,
    destination: normDest.name,
    vehicleType: matched.mode,
    firstDeparture: matched.firstDeparture,
    frequency: matched.typicalFrequency,
    lastDeparture: matched.lastDeparture,
    status: "DEMO / ESTIMATE",
    source_type: "DEMO",
    disclaimer: DISCLAIMER_TEXT,
    notice: DISCLAIMER_TEXT,
    formattedText
  };
}
