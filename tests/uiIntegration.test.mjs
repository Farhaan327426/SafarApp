/**
 * SAFAR — React UI & Component Integration Tests
 * Validates OfflineStatusBanner, fare state transitions, and commuter safety guarantees.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OfflineStatusBanner } from '../src/components/OfflineStatusBanner.js';
import { useFareCalculator } from '../src/hooks/useFareCalculator.js';
import { VEHICLE_REGISTRY } from '../src/data/vehicleRegistry.js';

test('UI Integration — OfflineStatusBanner Component', async (t) => {
  await t.test('ONLINE + CACHE_FRESH renders nothing (clean state)', () => {
    const html = renderToString(
      React.createElement(OfflineStatusBanner, {
        networkCondition: 'ONLINE',
        dataFreshness: 'CACHE_FRESH'
      })
    );
    assert.equal(html, '', 'Online fresh state should not render a disruptive banner');
  });

  await t.test('OFFLINE + CACHE_FRESH renders offline status with schedule reference', () => {
    const html = renderToString(
      React.createElement(OfflineStatusBanner, {
        networkCondition: 'OFFLINE',
        dataFreshness: 'CACHE_FRESH',
        activeScheduleId: 'SO-126-2026'
      })
    );
    assert.ok(html.includes('Offline Mode'), 'Must display Offline Mode');
    assert.ok(html.includes('SO-126-2026'), 'Must display active schedule ID');
    assert.ok(html.includes('role="status"'), 'Must have accessible role="status"');
  });

  await t.test('UNREACHABLE + CACHE_FRESH renders sync warning with retry CTA', () => {
    const html = renderToString(
      React.createElement(OfflineStatusBanner, {
        networkCondition: 'UNREACHABLE',
        dataFreshness: 'CACHE_FRESH',
        activeScheduleId: 'SO-126-2026',
        onRetry: () => {}
      })
    );
    assert.ok(html.includes('Sync Unavailable'), 'Must display Sync Unavailable alert');
    assert.ok(html.includes('Retry'), 'Must render Retry button');
    assert.ok(html.includes('role="alert"'), 'Must have role="alert"');
  });

  await t.test('NO_DATA renders critical warning blocking fare calculation', () => {
    const html = renderToString(
      React.createElement(OfflineStatusBanner, {
        networkCondition: 'UNREACHABLE',
        dataFreshness: 'NO_DATA',
        onRetry: () => {}
      })
    );
    assert.ok(html.includes('No Tariff Data'), 'Must display No Tariff Data');
    assert.ok(html.includes('Fares cannot be calculated until connected'), 'Must display safety warning');
  });
});

test('UI Integration — Fare Calculation State Engine', async (t) => {
  const eAutoOption = VEHICLE_REGISTRY['e-auto'];
  const eAutoTariff = {
    calculationType: 'FIRST_KM_PLUS_SUBSEQUENT',
    currency: 'INR',
    firstKm: 25,
    subsequentKm: 20,
    provenance: {
      calculationBasis: 'STATUTORY_FIXED_IN_SO_126',
      sourceReference: 'S.O. 126',
      absoluteFareSource: 'S.O. 126'
    }
  };

  await t.test('NO_DATA / Disabled state: fare is hidden (displayFare === null)', () => {
    const result = useFareCalculator({
      vehicle: eAutoOption,
      distance: 10,
      enabled: false,
      tariffEntry: eAutoTariff
    });

    assert.equal(result.displayFare, null, 'displayFare must strictly be null when not enabled');
    assert.equal(result.fareParts.isViable, false);
  });

  await t.test('FARE_AVAILABLE: calculated fare is computed and exposed', () => {
    const result = useFareCalculator({
      vehicle: eAutoOption,
      distance: 10,
      enabled: true,
      tariffEntry: eAutoTariff,
      from: 'Lal Chowk',
      to: 'Hazratbal'
    });

    // 10 km on e-auto: 25 + 9 * 20 = 205
    assert.equal(result.displayFare, 205);
    assert.equal(result.fareParts.isViable, true);
  });

  await t.test('Selected vehicle not eligible: fare hidden, reason displayed, CTA active', () => {
    // E-rickshaw is restricted from high-distance corridors (> 10 km)
    const eRickshawOption = VEHICLE_REGISTRY['e-rickshaw'];
    const result = useFareCalculator({
      vehicle: eRickshawOption,
      distance: 54, // Srinagar to Baramulla is 54 km (exceeds e-rickshaw 10 km limit)
      from: 'Srinagar',
      to: 'Baramulla',
      enabled: true
    });

    assert.equal(result.displayFare, null, 'Non-viable vehicle must not display a calculated fare');
    assert.equal(result.fareParts.isViable, false);
    assert.ok(
      result.fareParts.formulaDesc.includes('No Fare Available'),
      'Must display commuter advisory reason'
    );
  });
});
