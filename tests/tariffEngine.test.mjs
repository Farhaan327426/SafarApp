/**
 * SAFAR — Tariff Engine & Validator Integration Tests
 * Validates canonical tariffs.json against schema, negative contract cases, and comparator logic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateTariffSchedule } from '../src/services/tariffValidator.js';
import { compareTariffSchedules, resolvePrecedence } from '../src/services/tariffComparator.js';

const canonicalTariffs = JSON.parse(
  readFileSync(new URL('../public/data/tariffs.json', import.meta.url), 'utf-8')
);

test('Tariff Schedule Schema & Data Integrity', async (t) => {
  await t.test('Canonical public/data/tariffs.json passes validation cleanly', () => {
    const result = validateTariffSchedule(canonicalTariffs);
    assert.equal(result.isValid, true, `Validation failed: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
  });

  await t.test('All 11 canonical vehicles are present with INR currency and provenance', () => {
    const expected = [
      'e-rickshaw',
      'e-auto',
      'auto',
      'tata-magic',
      'mini-bus',
      'private-bus',
      'shared-cab',
      'taxi-sedan',
      'taxi-suv',
      'force-traveler',
      'vikram-tempo'
    ];

    for (const vId of expected) {
      const entry = canonicalTariffs.tariffs[vId];
      assert.ok(entry, `Missing vehicle: ${vId}`);
      assert.equal(entry.currency, 'INR');
      assert.ok(entry.provenance, `Missing provenance for: ${vId}`);
      assert.ok(typeof entry.provenance.calculationBasis === 'string');
      assert.ok(typeof entry.provenance.sourceReference === 'string');
      assert.ok(typeof entry.provenance.absoluteFareSource === 'string');
    }
  });

  await t.test('Validator catches invalid calculation models and negative rates', () => {
    const malformed = structuredClone(canonicalTariffs);
    malformed.tariffs['e-auto'].firstKm = -10;

    const res = validateTariffSchedule(malformed);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('positive firstKm')));
  });

  await t.test('Validator rejects missing vehicle entries', () => {
    const incomplete = structuredClone(canonicalTariffs);
    delete incomplete.tariffs['taxi-suv'];

    const res = validateTariffSchedule(incomplete);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('missing entry for vehicle: taxi-suv')));
  });
});

test('Tariff Comparator & Precedence Resolution', async (t) => {
  const baseSchedule = structuredClone(canonicalTariffs);
  const amendedSchedule = structuredClone(canonicalTariffs);
  amendedSchedule.activeScheduleId = 'SO-126-2026-AMEND-1';
  amendedSchedule.amendmentSequence = 2;
  amendedSchedule.effectiveFrom = '2026-06-01T00:00:00Z';
  amendedSchedule.tariffs['e-rickshaw'].perKm = 16;

  await t.test('Precedence: later effective date supersedes earlier schedule', () => {
    const precedence = resolvePrecedence(baseSchedule, amendedSchedule);
    assert.equal(precedence, 'INCOMING_SUPERSEDES');
  });

  await t.test('Comparator detects CALCULATION_MODEL_CHANGED when rate structure changes', () => {
    const structuralChangeSchedule = structuredClone(canonicalTariffs);
    structuralChangeSchedule.tariffs['taxi-sedan'] = {
      calculationType: 'MIN_PLUS_PER_KM',
      currency: 'INR',
      minFare: 120,
      perKm: 18,
      derivation: {
        legalBasis: 'S.O. 126 of 2026',
        baseline: 'SRO-97 dated 19 March 2021',
        adjustment: '18%',
        absoluteRateSource: 'TC_ORDER'
      }
    };

    const comparison = compareTariffSchedules(baseSchedule, structuralChangeSchedule);
    const sedanDelta = comparison.deltas['taxi-sedan'];
    assert.equal(sedanDelta.type, 'CALCULATION_MODEL_CHANGED');
    assert.equal(sedanDelta.oldCalculationType, 'BASE_PLUS_PER_KM');
    assert.equal(sedanDelta.newCalculationType, 'MIN_PLUS_PER_KM');
  });
});
