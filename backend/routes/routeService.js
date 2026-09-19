/**
 * Safar AI - Route Lookup Service (Stage 3)
 *
 * Implements deterministic waypoint and corridor lookup against database/routes.json.
 * Strict Data Safety: All route data is marked DEMO.
 * Unsupported routes strictly return: "I don't have a verified route for this journey yet."
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeLocation, getLocations } from '../fare/fareService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DB_DIR = path.join(ROOT_DIR, 'database');

let cachedRoutes = null;

export function getRoutes() {
  if (!cachedRoutes) {
    const routesPath = path.join(DB_DIR, 'routes.json');
    cachedRoutes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
  }
  return cachedRoutes;
}

/**
 * Looks up route waypoints between origin and destination
 */
export function getRoute({
  origin,
  destination,
  transportMode = null,
  locationsList = null,
  routesList = null
}) {
  const DISCLAIMER_TEXT = "Demo route information — actual route and stops may vary.";

  // Missing origin or destination
  if (!origin || !destination) {
    return {
      success: false,
      type: "ROUTE",
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
  const routes = routesList || getRoutes();

  const normOrigin = normalizeLocation(origin, locations);
  const normDest = normalizeLocation(destination, locations);

  // Unknown location
  if (!normOrigin || !normDest) {
    return {
      success: false,
      type: "ROUTE",
      message: "I don't have a verified route for this journey yet.",
      source_type: "DEMO",
      disclaimer: DISCLAIMER_TEXT,
      details: {
        originResolved: !!normOrigin,
        destinationResolved: !!normDest
      }
    };
  }

  // 1. Check exact forward route match
  let matched = routes.find(r => 
    r.origin.toLowerCase() === normOrigin.name.toLowerCase() &&
    r.destination.toLowerCase() === normDest.name.toLowerCase()
  );

  let isReversed = false;

  // 2. Check reverse direction if forward route not explicitly defined
  if (!matched) {
    matched = routes.find(r => 
      r.origin.toLowerCase() === normDest.name.toLowerCase() &&
      r.destination.toLowerCase() === normOrigin.name.toLowerCase()
    );
    if (matched) {
      isReversed = true;
    }
  }

  // Unsupported route
  if (!matched) {
    return {
      success: false,
      type: "ROUTE",
      origin: normOrigin.name,
      destination: normDest.name,
      message: "I don't have a verified route for this journey yet.",
      source_type: "DEMO",
      disclaimer: DISCLAIMER_TEXT
    };
  }

  // Build canonical waypoints: Origin -> Transit Point -> Destination
  const waypoints = [
    normOrigin.name,
    matched.majorTransitPoint || "Major Transit Hub",
    normDest.name
  ];

  const summaryPath = `${normOrigin.name} → ${matched.majorTransitPoint || 'Transit Point'} → ${normDest.name}`;

  const intermediates = isReversed && Array.isArray(matched.intermediates)
    ? [...matched.intermediates].reverse()
    : (matched.intermediates || []);

  const formattedText =
`${normOrigin.name} → ${normDest.name}

Route:
${waypoints.join('\n↓\n')}

Status:
DEMO / ESTIMATE

Notice:
${DISCLAIMER_TEXT}`;

  return {
    success: true,
    type: "ROUTE",
    origin: normOrigin.name,
    destination: normDest.name,
    majorTransitPoint: matched.majorTransitPoint,
    waypoints,
    intermediates,
    summaryPath,
    transportMode: transportMode || null,
    status: "DEMO / ESTIMATE",
    source_type: "DEMO",
    disclaimer: DISCLAIMER_TEXT,
    notice: DISCLAIMER_TEXT,
    formattedText
  };
}
