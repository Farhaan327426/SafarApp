/**
 * Safar AI - Conversation Context Service (Stage 1 Stub)
 * Lightweight memory with exactly 4 fields:
 * - lastOrigin
 * - lastDestination
 * - lastTransportMode
 * - lastIntent
 */

export class ConversationSession {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.lastOrigin = null;
    this.lastDestination = null;
    this.lastTransportMode = null;
    this.lastIntent = null;
  }

  updateContext({ origin, destination, transportMode, intent }) {
    if (origin) this.lastOrigin = origin;
    if (destination) this.lastDestination = destination;
    if (transportMode) this.lastTransportMode = transportMode;
    if (intent) this.lastIntent = intent;
  }

  getContext() {
    return {
      lastOrigin: this.lastOrigin,
      lastDestination: this.lastDestination,
      lastTransportMode: this.lastTransportMode,
      lastIntent: this.lastIntent
    };
  }

  reset() {
    this.lastOrigin = null;
    this.lastDestination = null;
    this.lastTransportMode = null;
    this.lastIntent = null;
  }
}

const activeSessions = new Map();

export function getSession(sessionId = 'default') {
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, new ConversationSession(sessionId));
  }
  return activeSessions.get(sessionId);
}
