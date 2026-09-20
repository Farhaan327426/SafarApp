/**
 * Safar AI - Unified AI Orchestration & Chat Router (Stage 6)
 *
 * Implements the unified conversational pipeline:
 * USER MESSAGE
 *     ↓
 * Language / text normalization
 *     ↓
 * Intent detection (Priority: Live Tracking Guard → Multi-Intent → Complaint → Schedule → Route → Fare → General)
 *     ↓
 * Entity extraction & Context resolution
 *     ↓
 * Intent-specific service execution
 *     ↓
 * Unified structured response with preserved DEMO provenance
 */

import { normalizeQuery } from './languageNormalizer.js';
import { getSession } from './conversationService.js';
import {
  INTENTS,
  isLiveTrackingQuery,
  isMultiIntentQuery,
  detectComplaintIntent,
  detectScheduleIntent,
  detectRouteIntent,
  detectFareIntent,
  extractLocationsFromText,
  resolveOriginAndDestination
} from './intentService.js';
import { calculateFare, normalizeVehicleType } from '../fare/fareService.js';
import { getRoute } from '../routes/routeService.js';
import { getSchedule } from '../schedule/scheduleService.js';
import { draftComplaint } from '../complaints/complaintService.js';

/**
 * Handles ambiguous single-word or under-specified transport queries.
 */
function handleAmbiguousQuery(clean, session, detectedScript = 'en') {
  // Pure fare inquiry without endpoints
  if (/^(?:how much\??|cost\??|price\??|kitna(?:\s+hai)?\??|fare\??|kiraya\??|कितना(?:\s+है)?\??|लागत\??|کتنا(?:\s+ہے)?\??)$/i.test(clean)) {
    const reply = detectedScript === 'ur'
      ? 'آپ کس روٹ کا کرایہ چیک کرنا چاہتے ہیں؟ برائے مہربانی آغاز اور منزل بتائیں۔'
      : (detectedScript === 'hi'
        ? 'आप किस रूट की जानकारी चाहते हैं? कृपया शुरुआती स्थान और गंतव्य बताएं।'
        : 'Which route would you like to check? Please provide the starting point and destination.');
    return {
      reply,
      source_type: 'DEMO',
      disclaimer: 'Demo / Estimated data — actual fare may vary by operator.',
      type: 'FARE_PROMPT',
      context: session.getContext()
    };
  }

  // Pure vehicle type without question
  if (/^(?:bus\??|minibus\??|taxi\??|shared taxi\??|gaadi\??|matador\??|बस\??|मिनीबस\??|ٹیکسی\??|بس\??)$/i.test(clean)) {
    const reply = detectedScript === 'ur'
      ? 'کیا آپ کرایہ، راستہ، یا شیڈول چیک کرنا چاہتے ہیں؟'
      : (detectedScript === 'hi'
        ? 'क्या आप किराया, रूट या शेड्यूल चेक करना चाहते हैं?'
        : 'Would you like to check a fare, route, or listed schedule?');
    return {
      reply,
      source_type: 'DEMO',
      type: 'AMBIGUOUS_PROMPT',
      context: session.getContext()
    };
  }

  // Incomplete origin-only inquiry: e.g., "From Srinagar?" or "Srinagar se?"
  const matchedLocs = extractLocationsFromText(clean);
  if (matchedLocs.length === 1 && (/^(?:from\s+|se\s+|سے\s+)/i.test(clean) || /(?:\s+se|\s+سے)\??$/i.test(clean) || clean.startsWith('from '))) {
    const locName = matchedLocs[0].location.name;
    const reply = detectedScript === 'ur'
      ? `آپ ${locName} سے کہاں جانا چاہتے ہیں؟`
      : (detectedScript === 'hi'
        ? `आप ${locName} से कहाँ जाना चाहते हैं?`
        : `Where would you like to go from ${locName}?`);
    return {
      reply,
      source_type: 'DEMO',
      type: 'ROUTE_PROMPT',
      context: session.getContext()
    };
  }

  // Pure route without endpoints
  if (/^(?:route\??|rasta\??|directions\??|रास्ता\??|روٹ\??|راستہ\??)$/i.test(clean)) {
    const reply = detectedScript === 'ur'
      ? 'آپ کس روٹ کی معلومات چاہتے ہیں؟ برائے مہربانی آغاز اور منزل بتائیں۔'
      : (detectedScript === 'hi'
        ? 'आप किस रूट की जानकारी चाहते हैं? कृपया शुरुआती स्थान और गंतव्य बताएं।'
        : 'Which route would you like to check? Please provide the starting point and destination.');
    return {
      reply,
      source_type: 'DEMO',
      disclaimer: 'Demo route information — actual route and stops may vary.',
      type: 'ROUTE_PROMPT',
      context: session.getContext()
    };
  }

  // Pure schedule without endpoints
  if (/^(?:schedule\??|timing\??|timings\??|timetable\??|समय सारिणी\??|شیڈول\??)$/i.test(clean)) {
    const reply = detectedScript === 'ur'
      ? 'آپ کس روٹ کا شیڈول چیک کرنا چاہتے ہیں؟ برائے مہربانی آغاز اور منزل بتائیں۔'
      : (detectedScript === 'hi'
        ? 'आप किस रूट का शेड्यूल चेक करना चाहते हैं? कृपया शुरुआती स्थान और गंतव्य बताएं।'
        : 'Which route would you like to check? Please provide the starting point and destination.');
    return {
      reply,
      source_type: 'DEMO',
      disclaimer: 'This is the listed schedule, not live vehicle information.',
      type: 'SCHEDULE_PROMPT',
      context: session.getContext()
    };
  }

  return null;
}

/**
 * Handles GENERAL intent queries (greetings, capabilities, transit facts)
 */
function handleGeneralIntent(clean, userMessage, session) {
  // Exact backward compatibility for Stage 1 test 6: "Hello Safar AI"
  if (clean === 'hello safar ai') {
    return {
      reply: 'Safar AI is ready to help with fares, routes, schedules, and complaints.',
      source_type: 'DEMO',
      notice: 'Demo Mode: All transport data is illustrative and not official.',
      type: 'GENERAL',
      stage: 7,
      receivedMessage: userMessage,
      context: session.getContext()
    };
  }

  // Greetings like "Hello"
  if (
    /^(?:hello|hi|hey|salam|assalam|namaste|adab|good morning|good afternoon|good evening)\??$/i.test(clean)
  ) {
    return {
      reply: "Hello! I'm Safar AI. I can help with fares, routes, listed schedules, and transport complaints.",
      source_type: 'DEMO',
      type: 'GENERAL',
      stage: 7,
      context: session.getContext()
    };
  }

  // Capabilities
  if (
    clean.includes('what can you do') ||
    clean.includes('what can safar ai do') ||
    clean.includes('what are your features') ||
    clean.includes('how to use') ||
    clean === 'help' ||
    clean === 'help?' ||
    clean.includes('who are you')
  ) {
    return {
      reply: 'I can help you check demo fare estimates, listed schedules, available demo routes, and prepare transport complaint drafts.',
      source_type: 'DEMO',
      type: 'GENERAL',
      stage: 7,
      context: session.getContext()
    };
  }

  // General Transit knowledge
  if (
    clean.includes('what is public transport') ||
    clean.includes('how does public transport work') ||
    clean.includes('how does public transportation work') ||
    clean.includes('what is transit')
  ) {
    return {
      reply: 'Public transportation provides shared transit options—such as buses, minibuses, and shared taxis—operating along fixed corridors between key regional transport hubs.',
      source_type: 'DEMO',
      type: 'GENERAL',
      stage: 7,
      context: session.getContext()
    };
  }

  // Default General fallback
  return {
    reply: 'Safar AI is ready to help with fares, routes, schedules, and complaints.',
    source_type: 'DEMO',
    notice: 'Demo Mode: All transport data is illustrative and not official.',
    type: 'GENERAL',
    stage: 7,
    receivedMessage: userMessage,
    context: session.getContext()
  };
}

/**
 * Main unified chat processor.
 *
 * @param {Object} options
 * @param {string} options.message - Incoming user message
 * @param {string} [options.sessionId] - Client session identifier
 * @param {Object} options.database - In-memory demo transport database
 * @returns {Object} Standardized unified response
 */
export function processChatQuery({ message, sessionId = 'default', database }) {
  const userMessage = (message || '').trim();
  const session = getSession(sessionId);

  if (!userMessage) {
    return {
      reply: 'Please enter a message to ask Safar AI.',
      source_type: 'DEMO',
      type: 'GENERAL',
      stage: 7,
      context: session.getContext()
    };
  }

  // 1. Language & text normalization
  const normalized = normalizeQuery(userMessage);
  const clean = normalized.normalized;

  // 2. Critical Safety Check: Live Tracking Guard
  if (isLiveTrackingQuery(clean)) {
    return {
      reply: 'Live tracking is not available in the current version.',
      source_type: 'DEMO',
      disclaimer: 'This is the listed schedule, not live vehicle information.',
      stage: 7,
      type: 'GENERAL',
      context: session.getContext()
    };
  }

  // 3. Multi-Intent Handling (e.g. Fare + Schedule in one prompt)
  if (isMultiIntentQuery(clean)) {
    const matchedLocs = extractLocationsFromText(userMessage);
    const vehicle = normalizeVehicleType(userMessage);
    let { origin, destination } = resolveOriginAndDestination(clean, matchedLocs);

    if (!origin && session.lastOrigin) origin = session.lastOrigin;
    if (!destination && session.lastDestination) destination = session.lastDestination;

    if (origin && destination) {
      const vType = vehicle ? vehicle.displayName : session.lastTransportMode;
      session.updateContext({ origin, destination, transportMode: vType, intent: 'MULTI_INTENT' });

      const fareResult = calculateFare({
        origin,
        destination,
        vehicleType: vType,
        locationsList: database.locations,
        faresList: database.fares
      });

      const scheduleResult = getSchedule({
        origin,
        destination,
        vehicleType: vType,
        locationsList: database.locations,
        schedulesList: database.schedules
      });

      const combinedReply = `FARE:\n${fareResult.formattedText || fareResult.message}\n\nSCHEDULE:\n${scheduleResult.formattedText || scheduleResult.message}`;

      return {
        reply: combinedReply,
        fareData: fareResult.success ? fareResult : null,
        scheduleData: scheduleResult.success ? scheduleResult : null,
        source_type: 'DEMO',
        disclaimer: fareResult.disclaimer || scheduleResult.disclaimer,
        type: 'MULTI_INTENT',
        stage: 7,
        context: session.getContext()
      };
    }
  }

  // 4. Ambiguous / Incomplete prompt handling
  const ambiguousPrompt = handleAmbiguousQuery(clean, session, normalized.detectedScript);
  if (ambiguousPrompt) {
    return ambiguousPrompt;
  }

  // 5. PRIORITY 1: COMPLAINT INTENT
  const complaintDetection = detectComplaintIntent(userMessage, session);
  if (complaintDetection && complaintDetection.intent === 'COMPLAINT') {
    if (complaintDetection.route) {
      const parts = complaintDetection.route.split('→').map(s => s.trim());
      if (parts.length === 2) {
        session.updateContext({
          origin: parts[0],
          destination: parts[1],
          transportMode: complaintDetection.vehicleType,
          intent: 'COMPLAINT'
        });
      }
    } else {
      session.updateContext({
        intent: 'COMPLAINT'
      });
    }

    const complaintResult = draftComplaint({
      route: complaintDetection.route,
      location: complaintDetection.location,
      vehicleType: complaintDetection.vehicleType,
      issue: complaintDetection.issue,
      amountCharged: complaintDetection.amountCharged,
      expectedFare: complaintDetection.expectedFare,
      description: userMessage
    });

    return {
      reply: 'I have prepared a draft complaint summary for you. This has not been filed with any authority.',
      complaintData: complaintResult,
      source_type: 'DEMO',
      disclaimer: complaintResult.disclaimer,
      type: 'COMPLAINT',
      stage: 7,
      context: session.getContext()
    };
  }

  // 6. PRIORITY 2: SCHEDULE INTENT
  const scheduleDetection = detectScheduleIntent(userMessage, session);
  if (scheduleDetection && scheduleDetection.intent === 'SCHEDULE') {
    if (!scheduleDetection.origin || !scheduleDetection.destination) {
      return {
        reply: 'Which route would you like to check? Please provide the starting point and destination.',
        source_type: 'DEMO',
        disclaimer: 'This is the listed schedule, not live vehicle information.',
        type: 'SCHEDULE_PROMPT',
        context: session.getContext()
      };
    }

    session.updateContext({
      origin: scheduleDetection.origin,
      destination: scheduleDetection.destination,
      transportMode: scheduleDetection.vehicleType,
      intent: 'SCHEDULE'
    });

    const scheduleResult = getSchedule({
      origin: scheduleDetection.origin,
      destination: scheduleDetection.destination,
      vehicleType: scheduleDetection.vehicleType,
      locationsList: database.locations,
      schedulesList: database.schedules
    });

    return {
      reply: scheduleResult.formattedText || scheduleResult.message,
      scheduleData: scheduleResult.success ? scheduleResult : null,
      source_type: 'DEMO',
      disclaimer: scheduleResult.disclaimer,
      type: 'SCHEDULE',
      stage: 7,
      context: session.getContext()
    };
  }

  // 7. PRIORITY 3: ROUTE INTENT
  const routeDetection = detectRouteIntent(userMessage, session);
  if (routeDetection && routeDetection.intent === 'ROUTE') {
    if (!routeDetection.origin || !routeDetection.destination) {
      return {
        reply: 'Which route would you like to check? Please provide the starting point and destination.',
        source_type: 'DEMO',
        disclaimer: 'Demo route information — actual route and stops may vary.',
        type: 'ROUTE_PROMPT',
        context: session.getContext()
      };
    }

    session.updateContext({
      origin: routeDetection.origin,
      destination: routeDetection.destination,
      intent: 'ROUTE'
    });

    const routeResult = getRoute({
      origin: routeDetection.origin,
      destination: routeDetection.destination,
      locationsList: database.locations,
      routesList: database.routes
    });

    return {
      reply: routeResult.formattedText || routeResult.message,
      routeData: routeResult.success ? routeResult : null,
      source_type: 'DEMO',
      disclaimer: routeResult.disclaimer,
      type: 'ROUTE',
      stage: 7,
      context: session.getContext()
    };
  }

  // 8. PRIORITY 4: FARE INTENT
  const fareDetection = detectFareIntent(userMessage, session);
  if (fareDetection && fareDetection.intent === 'FARE') {
    if (!fareDetection.origin || !fareDetection.destination) {
      return {
        reply: 'Which route would you like to check? Please provide the starting point and destination.',
        source_type: 'DEMO',
        disclaimer: 'Demo / Estimated data — actual fare may vary by operator.',
        type: 'FARE_PROMPT',
        context: session.getContext()
      };
    }

    session.updateContext({
      origin: fareDetection.origin,
      destination: fareDetection.destination,
      transportMode: fareDetection.vehicleType,
      intent: 'FARE'
    });

    const fareResult = calculateFare({
      origin: fareDetection.origin,
      destination: fareDetection.destination,
      vehicleType: fareDetection.vehicleType,
      locationsList: database.locations,
      faresList: database.fares
    });

    return {
      reply: fareResult.formattedText || fareResult.message,
      fareData: fareResult.success ? fareResult : null,
      source_type: 'DEMO',
      disclaimer: fareResult.disclaimer,
      type: 'FARE',
      stage: 7,
      context: session.getContext()
    };
  }

  // 9. PRIORITY 5: GENERAL INTENT
  return handleGeneralIntent(clean, userMessage, session);
}
