import { test } from 'node:test';
import assert from 'node:assert/strict';

// Load browser globals
globalThis.window = globalThis;
import '../frontend/js/safar-data.js';
import '../frontend/js/safar-ai-engine.js';

test('SafarAIEngine: Budgam to Lal Chowk via Matador fare query', async (t) => {
  const query = 'what is the fare rate between Budgam to Lal Chowk via Matador';
  
  const understanding = await globalThis.SafarAIEngine.understandUserSpeech(query);
  assert.equal(understanding.intent, 'fare_check', 'Should classify intent as fare_check');
  assert.equal(understanding.entities.origin, 'Budgam', 'Should extract origin Budgam');
  assert.equal(understanding.entities.destination, 'Lal Chowk', 'Should extract destination Lal Chowk');
  assert.equal(understanding.entities.vehicleType, 'matador', 'Should extract vehicleType matador');

  const answer = await globalThis.SafarAIEngine.generateConversationalAnswer(query, understanding.entities);
  assert.equal(answer.intent, 'fare_check');
  assert(answer.voiceText.includes('Budgam') && answer.voiceText.includes('Lal Chowk'), 'Voice text should name route');
  assert(answer.voiceText.includes('Matador') || answer.voiceText.includes('Minibus'), 'Voice text should name vehicle');
  assert(answer.voiceText.includes('₹25') || answer.voiceText.includes('₹30'), 'Voice text should contain official fare range');
  assert(answer.displayText.includes('14 km'), 'Display text should mention distance');
  assert(answer.fareCardData, 'Should have structured fareCardData');
  assert.equal(answer.fareCardData.origin, 'Budgam');
  assert.equal(answer.fareCardData.destination, 'Lal Chowk');
  assert.equal(answer.fareCardData.distanceKm, 14);
  assert.equal(answer.fareCardData.vehicleMode, 'matador');
});

test('SafarAIEngine: General transit knowledge & SRO-97 queries', async (t) => {
  const luggageQ = 'How much luggage is allowed free under SRO-97?';
  const luggageAns = await globalThis.SafarAIEngine.generateConversationalAnswer(luggageQ);
  assert(luggageAns.voiceText.includes('15 kilograms') || luggageAns.voiceText.includes('15 kg'));

  const autoQ = 'What are the meter rules for auto rickshaws?';
  const autoAns = await globalThis.SafarAIEngine.generateConversationalAnswer(autoQ);
  assert(autoAns.voiceText.includes('45') && autoAns.voiceText.includes('7.40'));

  const highwayQ = 'What is the helpline for NH-44 highway status?';
  const highwayAns = await globalThis.SafarAIEngine.generateConversationalAnswer(highwayQ);
  assert(highwayAns.voiceText.includes('1033') || highwayAns.voiceText.includes('0194-2450022'));
});
