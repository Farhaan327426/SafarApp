/**
 * Safar AI - Intent Classification Service (Stage 1 Stub)
 * 5 MVP intents: FARE, ROUTE, SCHEDULE, COMPLAINT, GENERAL
 * Will be implemented in subsequent stage.
 */

export const INTENTS = {
  FARE: 'FARE',
  ROUTE: 'ROUTE',
  SCHEDULE: 'SCHEDULE',
  COMPLAINT: 'COMPLAINT',
  GENERAL: 'GENERAL'
};

export function detectIntent(query) {
  return {
    intent: INTENTS.GENERAL,
    confidence: 1.0,
    status: "stub"
  };
}
