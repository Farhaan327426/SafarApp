/**
 * Safar AI - Intent Classification & Entity Extraction (Stages 2, 3, 4)
 *
 * Implements lightweight FARE, ROUTE & SCHEDULE intent detection and entity extraction.
 * Handles Live Tracking safety rejections.
 * Preserves the 5 MVP intents structure (COMPLAINT, GENERAL are stubs).
 */

import { getLocations, normalizeVehicleType } from '../fare/fareService.js';
import { classifyComplaintIssue } from '../complaints/complaintService.js';

export const INTENTS = {
  FARE: 'FARE',
  ROUTE: 'ROUTE',
  SCHEDULE: 'SCHEDULE',
  COMPLAINT: 'COMPLAINT',
  GENERAL: 'GENERAL'
};

const FARE_KEYWORDS = [
  'fare', 'kiraya', 'kiraye', 'kirayah', 'how much', 'cost', 'ticket', 'rate',
  'charges', 'charge', 'price', 'کرایہ', 'کرایا', 'کتنا کرایہ', 'کتنے پیسے', 'किराया', 'किराये', 'कितना किराया'
];

const ROUTE_KEYWORDS = [
  'route', 'rasta', 'rastah', 'travel', 'how do i go', 'how can i travel',
  'how do i get', 'how to go', 'how to travel', 'how to reach', 'way to',
  'directions', 'direction', 'path', 'via', 'how can we go', 'how can we travel',
  'راستہ', 'روٹ', 'کیسے جائیں', 'راستہ کیا ہے', 'کیسے پہنچیں',
  'रास्ता', 'रूट', 'कैसे जाएं', 'कैसे पहुंचे', 'का रास्ता', 'का रूट'
];

const SCHEDULE_KEYWORDS = [
  'schedule', 'timing', 'timings', 'time', 'when is the', 'when does the',
  'when is a', 'next bus', 'last bus', 'first bus', 'departure', 'depart',
  'frequency', 'first departure', 'last departure', 'timetable',
  'kab hai', 'kab aayegi', 'kab chalegi', 'bus kab', 'شیڈول', 'کب ہے', 'وقت',
  'समय', 'टाइम', 'कब है', 'कब आएगी', 'कब चलेगी', 'का समय'
];

const LIVE_TRACKING_KEYWORDS = [
  'where is the bus right now', 'where is the bus now', 'track the bus',
  'is the bus currently on the road', 'is the bus on the road', 'track bus',
  'live tracking', 'live bus', 'current location', 'gps', 'real time',
  'real-time', 'live location'
];

const COMPLAINT_KEYWORDS = [
  'complain', 'complaint', 'report', 'overcharge', 'overcharged', 'charged too much',
  'refused to take', 'refused me', 'refuse', 'overcrowded', 'overcrowding', 'overloading',
  'overloaded', 'behaved badly', 'bad behavior', 'rude', 'abused', 'abusive', 'misbehaved',
  'dangerous driving', 'rash driving', 'reckless', 'speeding', 'overspeeding',
  'more than the listed fare', 'more than expected', 'extra fare', 'extra money',
  'zyada paisay', 'zyada paise', 'zyada kiraya', 'mana kiya', 'nahi bithaya',
  'badtamiz', 'badtameez', 'bheed', 'rush', 'khatarnak driving', 'crowded',
  'شکایت', 'زیادہ پیسے', 'زیادہ کرایہ', 'انکار', 'بدتمیزی', 'بھیڑ', 'خطرناک ڈرائیونگ',
  'शिकायत', 'ज्यादा किराया', 'ज्यादा पैसे', 'मना कर दिया', 'नहीं बैठाया', 'बदतमीजी', 'भीड़', 'खतरनाक ड्राइविंग'
];

/**
 * Checks if query is requesting a transport complaint / report
 */
export function isComplaintQuery(text) {
  if (!text) return false;
  const clean = String(text).toLowerCase().trim();

  if (
    /(?:overcharg|charged?\s+(?:me\s+|us\s+)?(?:too\s+much|more|extra)|refus|overcrowd|crowded|overload|rude|abus|misbehav|danger|rash|reckless|badtamiz|badtameez|bheed|khatarnak|zyada\s+(?:paisa|paise|paisay|kiraya)|shikayat|شکایت|शिकायत)/i.test(clean)
  ) {
    return true;
  }

  return COMPLAINT_KEYWORDS.some(kw => clean.includes(kw)) ||
    clean.startsWith('i want to report') ||
    clean.startsWith('how can i complain') ||
    clean.includes('transport problem') ||
    clean.includes('driver ne');
}

/**
 * Checks if query is requesting live tracking
 */
export function isLiveTrackingQuery(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return LIVE_TRACKING_KEYWORDS.some(kw => clean.includes(kw));
}

/**
 * Extracts location mentions from text ordered by appearance
 */
export function extractLocationsFromText(text) {
  if (!text) return [];
  const clean = text.toLowerCase();
  const locations = getLocations();
  const matches = [];

  for (const loc of locations) {
    const allAliases = [
      loc.id,
      loc.name.toLowerCase(),
      ...(loc.aliases.en || []),
      ...(loc.aliases.ur || []),
      ...(loc.aliases.hi || []),
      ...(loc.aliases.romanized || [])
    ];

    for (const alias of allAliases) {
      const aliasLower = alias.toLowerCase();
      const idx = clean.indexOf(aliasLower);
      if (idx !== -1) {
        const existing = matches.find(m => m.location.id === loc.id);
        if (!existing || idx < existing.index) {
          if (existing) {
            existing.index = idx;
            existing.alias = alias;
          } else {
            matches.push({
              index: idx,
              length: aliasLower.length,
              alias,
              location: loc
            });
          }
        }
      }
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

/**
 * Helper to determine origin and destination order from text patterns
 */
export function resolveOriginAndDestination(clean, matchedLocations) {
  if (matchedLocations.length >= 2) {
    const loc0 = matchedLocations[0];
    const loc1 = matchedLocations[1];

    const reverseOrderPattern = new RegExp(`(?:get\\s+to|go\\s+to|reach|to)\\s+${loc0.alias}\\s+from\\s+${loc1.alias}`, 'i');
    if (reverseOrderPattern.test(clean)) {
      return {
        origin: loc1.location.name,
        destination: loc0.location.name
      };
    }

    return {
      origin: loc0.location.name,
      destination: loc1.location.name
    };
  }

  const fromToMatch = clean.match(/(?:from\s+)(.+?)\s+(?:to\s+)(.+?)(?:\?|\.|\!|\s+via|\s+in\s+a|\s+by|\s+fare|\s+route|\s+bus|\s+schedule|$)/i);
  if (fromToMatch) {
    return {
      origin: fromToMatch[1].trim(),
      destination: fromToMatch[2].trim()
    };
  }

  const toFromMatch = clean.match(/(?:(?:get|go)\s+to\s+)(.+?)\s+(?:from\s+)(.+?)(?:\?|\.|\!|$)/i);
  if (toFromMatch) {
    return {
      origin: toFromMatch[2].trim(),
      destination: toFromMatch[1].trim()
    };
  }

  const seMatch = clean.match(/(.+?)\s+(?:se|سے|से)\s+(.+?)(?:\s+(?:ka|کا|का))?(?:\s+(?:route|rasta|kiraya|fare|bus|schedule|کرایہ|راستہ|किराया|रास्ता))?(?:\?|\.|\!|$)/i);
  if (seMatch) {
    const orig = seMatch[1].replace(/^(?:how to travel|how can i travel|how do i go|when is the bus from|route|fare|kiraya|what is the fare for|kitna|how much)\s+/i, '').trim();
    const dest = seMatch[2].replace(/\s+(?:bus|schedule|timing|kab|hai)$/i, '').trim();
    return { origin: orig, destination: dest };
  }

  const arrowMatch = clean.match(/(?:^|\b)(.+?)\s+(?:→|->)\s+(.+?)(?:\?|\.|\!|$)/i);
  if (arrowMatch) {
    return {
      origin: arrowMatch[1].replace(/^(?:how to travel|how can i travel|how do i go|route|fare|kiraya|bus schedule)\s+/i, '').trim(),
      destination: arrowMatch[2].trim()
    };
  }

  return {
    origin: matchedLocations[0] ? matchedLocations[0].location.name : null,
    destination: null
  };
}

/**
 * Detects if a query is a FARE query and extracts entities
 */
export function detectFareIntent(query, session = null) {
  if (!query) return null;
  const clean = String(query).trim().toLowerCase();

  if (isComplaintQuery(clean) || isLiveTrackingQuery(clean) || hasScheduleKeyword(clean)) {
    return null;
  }

  const matchedLocations = extractLocationsFromText(query);
  const detectedVehicle = normalizeVehicleType(query);
  const hasFare = hasFareKeyword(clean);
  const hasExplicitRouteInQuery = /(?:from\s+.+?\s+to\s+|se\s+|→|->)/i.test(clean);

  if (session && session.lastOrigin && session.lastDestination && detectedVehicle && !hasScheduleKeyword(clean) && !hasExplicitRouteInQuery) {
    const isFollowUpPattern = matchedLocations.length === 0 || 
      clean.includes('what about') || 
      clean.includes('how about') || 
      clean.includes('and ') ||
      clean.startsWith(detectedVehicle.key) ||
      clean.includes(detectedVehicle.displayName.toLowerCase());

    if (isFollowUpPattern) {
      return {
        intent: INTENTS.FARE,
        isFollowUp: true,
        origin: session.lastOrigin,
        destination: session.lastDestination,
        vehicleType: detectedVehicle.displayName,
        confidence: 0.95
      };
    }
  }

  if (hasFare) {
    const { origin, destination } = resolveOriginAndDestination(clean, matchedLocations);

    return {
      intent: INTENTS.FARE,
      isFollowUp: false,
      origin,
      destination,
      vehicleType: detectedVehicle ? detectedVehicle.displayName : null,
      confidence: 0.9
    };
  }

  return null;
}

export function hasFareKeyword(clean) {
  return FARE_KEYWORDS.some(kw => clean.includes(kw));
}

export function hasRouteKeyword(clean) {
  return ROUTE_KEYWORDS.some(kw => clean.includes(kw));
}

export function hasScheduleKeyword(clean) {
  return SCHEDULE_KEYWORDS.some(kw => clean.includes(kw));
}

export function isMultiIntentQuery(text) {
  if (!text) return false;
  const clean = String(text).toLowerCase().trim();
  if (isComplaintQuery(clean) || isLiveTrackingQuery(clean)) return false;
  const fare = hasFareKeyword(clean) || clean.includes('fare') || clean.includes('kiraya') || clean.includes('cost');
  const sched = hasScheduleKeyword(clean) || clean.includes('schedule') || clean.includes('when') || clean.includes('timing') || clean.includes('bus');
  return (fare && sched && (clean.includes('and') || clean.includes('aur') || clean.includes('or')));
}

/**
 * Detects if a query is a ROUTE query and extracts entities (Stage 3)
 */
export function detectRouteIntent(query, session = null) {
  if (!query) return null;
  const clean = String(query).trim().toLowerCase();

  if (hasScheduleKeyword(clean) || isLiveTrackingQuery(clean) || isComplaintQuery(clean)) {
    return null;
  }

  const matchedLocations = extractLocationsFromText(query);
  const hasRouteKeyword = ROUTE_KEYWORDS.some(kw => clean.includes(kw));

  if (session && (session.lastDestination || session.lastOrigin)) {
    if (clean.includes('from here') || clean.includes('what about from here')) {
      const destination = matchedLocations[0] ? matchedLocations[0].location.name : null;
      if (destination) {
        return {
          intent: INTENTS.ROUTE,
          isFollowUp: true,
          origin: session.lastDestination || session.lastOrigin,
          destination,
          confidence: 0.9
        };
      }
    }

    if ((clean.startsWith('what about to ') || clean.startsWith('to ')) && matchedLocations.length === 1) {
      return {
        intent: INTENTS.ROUTE,
        isFollowUp: true,
        origin: session.lastOrigin,
        destination: matchedLocations[0].location.name,
        confidence: 0.85
      };
    }
  }

  if (hasRouteKeyword) {
    const { origin, destination } = resolveOriginAndDestination(clean, matchedLocations);

    return {
      intent: INTENTS.ROUTE,
      isFollowUp: false,
      origin,
      destination,
      confidence: 0.9
    };
  }

  if (clean.includes('→') || clean.includes('->') || clean.includes('travel from')) {
    const { origin, destination } = resolveOriginAndDestination(clean, matchedLocations);
    if (origin && destination) {
      return {
        intent: INTENTS.ROUTE,
        isFollowUp: false,
        origin,
        destination,
        confidence: 0.8
      };
    }
  }

  return null;
}

/**
 * Detects if a query is a SCHEDULE query and extracts entities (Stage 4)
 */
export function detectScheduleIntent(query, session = null) {
  if (!query) return null;
  const clean = String(query).trim().toLowerCase();

  if (isComplaintQuery(clean) || isLiveTrackingQuery(clean)) {
    return null;
  }

  const isScheduleMatch = hasScheduleKeyword(clean);
  const matchedLocations = extractLocationsFromText(query);
  const detectedVehicle = normalizeVehicleType(query);

  const hasExplicitRouteInQuery = /(?:from\s+.+?\s+to\s+|se\s+|→|->)/i.test(clean);

  // Follow-up context: e.g. "What about the last one?", "When is the last bus?"
  if (session && session.lastOrigin && session.lastDestination && !hasExplicitRouteInQuery) {
    const isFollowUp = clean.includes('last one') || clean.includes('last bus') ||
      clean.includes('first one') || clean.includes('next one') || clean.includes('what about the last') ||
      (matchedLocations.length === 0 && isScheduleMatch && !clean.includes('from') && !clean.includes('to'));

    if (isFollowUp) {
      return {
        intent: INTENTS.SCHEDULE,
        isFollowUp: true,
        origin: session.lastOrigin,
        destination: session.lastDestination,
        vehicleType: detectedVehicle ? detectedVehicle.displayName : session.lastTransportMode,
        confidence: 0.95
      };
    }
  }

  if (isScheduleMatch) {
    // Check if user specifies destination only e.g. "When is the last listed bus to Gulmarg?"
    const toMatch = clean.match(/(?:to\s+)(.+?)(?:\?|\.|\!|$|\s+bus|\s+schedule)/i);
    let { origin, destination } = resolveOriginAndDestination(clean, matchedLocations);

    if (!destination && toMatch) {
      destination = toMatch[1].trim();
      if (!origin && session && session.lastOrigin) {
        origin = session.lastOrigin;
      }
    }

    return {
      intent: INTENTS.SCHEDULE,
      isFollowUp: false,
      origin,
      destination,
      vehicleType: detectedVehicle ? detectedVehicle.displayName : null,
      confidence: 0.9
    };
  }

  return null;
}

/**
 * Helper to extract amounts from complaint query (e.g. charged 50 but expected 30)
 */
function extractComplaintAmounts(clean) {
  let amountCharged = null;
  let expectedFare = null;

  const chargedMatch = clean.match(/charged\s+(?:me\s+)?(?:₹|rs\.?\s*)?(\d+)/i);
  if (chargedMatch) {
    amountCharged = Number(chargedMatch[1]);
  }

  const expectedMatch = clean.match(/expected\s+(?:to pay\s+)?(?:fare\s+)?(?:₹|rs\.?\s*)?(\d+)/i);
  if (expectedMatch) {
    expectedFare = Number(expectedMatch[1]);
  }

  if (!amountCharged) {
    const insteadMatch = clean.match(/(?:took|paid|charged)\s+(?:₹|rs\.?\s*)?(\d+)\s+instead\s+of\s+(?:₹|rs\.?\s*)?(\d+)/i);
    if (insteadMatch) {
      amountCharged = Number(insteadMatch[1]);
      expectedFare = Number(insteadMatch[2]);
    }
  }

  return { amountCharged, expectedFare };
}

/**
 * Detects if a query is a COMPLAINT query and extracts entities (Stage 5)
 */
export function detectComplaintIntent(query, session = null) {
  if (!query) return null;
  const clean = String(query).trim().toLowerCase();

  if (isLiveTrackingQuery(clean)) return null;

  if (!isComplaintQuery(clean)) return null;

  const issue = classifyComplaintIssue(clean);
  const matchedLocations = extractLocationsFromText(query);
  const detectedVehicle = normalizeVehicleType(query);
  const { amountCharged, expectedFare } = extractComplaintAmounts(clean);

  let route = null;
  let location = null;

  if (matchedLocations.length >= 2) {
    route = `${matchedLocations[0].location.name} → ${matchedLocations[1].location.name}`;
  } else if (matchedLocations.length === 1) {
    location = matchedLocations[0].location.name;
    if (session && (session.lastOrigin || session.lastDestination)) {
      const other = session.lastOrigin || session.lastDestination;
      if (other && other !== location) {
        route = `${other} → ${location}`;
      }
    }
  } else if (session && session.lastOrigin && session.lastDestination) {
    route = `${session.lastOrigin} → ${session.lastDestination}`;
  }

  const vehicleType = detectedVehicle 
    ? detectedVehicle.displayName 
    : (session && session.lastTransportMode ? session.lastTransportMode : null);

  return {
    intent: INTENTS.COMPLAINT,
    issue,
    route,
    location,
    vehicleType,
    amountCharged,
    expectedFare,
    description: query.trim(),
    confidence: 0.95
  };
}

/**
 * General intent detector
 */
export function detectIntent(query, session = null) {
  if (isLiveTrackingQuery(query)) {
    return {
      intent: INTENTS.GENERAL,
      isLiveTracking: true,
      confidence: 1.0
    };
  }

  const complaintResult = detectComplaintIntent(query, session);
  if (complaintResult) {
    return complaintResult;
  }

  const scheduleResult = detectScheduleIntent(query, session);
  if (scheduleResult) {
    return scheduleResult;
  }

  const fareResult = detectFareIntent(query, session);
  if (fareResult) {
    return fareResult;
  }

  const routeResult = detectRouteIntent(query, session);
  if (routeResult) {
    return routeResult;
  }

  return {
    intent: INTENTS.GENERAL,
    confidence: 0.5,
    status: "foundation_fallback"
  };
}
