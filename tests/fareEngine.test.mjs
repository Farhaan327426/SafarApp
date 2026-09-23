/**
 * SAFAR — Fare Engine Golden Tests
 * Validates pure statutory fare calculation against S.O. 126 and J&K statutory rules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStatutoryFare } from '../src/services/fareEngine.js';
import { useFareCalculator } from '../src/hooks/useFareCalculator.js';

test('Statutory Fare Engine — S.O. 126 Electric Vehicle Tariffs', async (t) => {
  const eAutoTariff = {
    calculationType: 'FIRST_KM_PLUS_SUBSEQUENT',
    firstKm: 25,
    subsequentKm: 20
  };

  const eRickshawTariff = {
    calculationType: 'PER_KM',
    perKm: 15
  };

  await t.test('E-Auto: integer kilometre milestones (₹25 1st km + ₹20 subsequent)', () => {
    assert.equal(calculateStatutoryFare(eAutoTariff, 1), 25);
    assert.equal(calculateStatutoryFare(eAutoTariff, 2), 45);
    assert.equal(calculateStatutoryFare(eAutoTariff, 3), 65);
    assert.equal(calculateStatutoryFare(eAutoTariff, 5), 105);
  });

  await t.test('E-Rickshaw: flat ₹15 per kilometre', () => {
    assert.equal(calculateStatutoryFare(eRickshawTariff, 1), 15);
    assert.equal(calculateStatutoryFare(eRickshawTariff, 2), 30);
    assert.equal(calculateStatutoryFare(eRickshawTariff, 3), 45);
    assert.equal(calculateStatutoryFare(eRickshawTariff, 10), 150);
  });

  await t.test('Fractional Distance Policy: pro-rata subsequent km rounded to nearest Rupee', () => {
    // E-Auto: 1.2 km -> ₹25 + 0.2 * 20 = ₹25 + ₹4 = ₹29
    assert.equal(calculateStatutoryFare(eAutoTariff, 1.2), 29);

    // E-Auto: 0.5 km (less than 1 km) -> firstKm minimum ₹25
    assert.equal(calculateStatutoryFare(eAutoTariff, 0.5), 25);

    // E-Rickshaw: 2.5 km -> 2.5 * 15 = 37.5 -> rounded to ₹38
    assert.equal(calculateStatutoryFare(eRickshawTariff, 2.5), 38);
  });
});

test('Statutory Fare Engine — Discriminated Rate Models', async (t) => {
  await t.test('BASE_PLUS_PER_KM: Contract Taxi Sedan (base ₹120 + ₹18/km)', () => {
    const sedanTariff = {
      calculationType: 'BASE_PLUS_PER_KM',
      baseFare: 120,
      perKm: 18
    };

    assert.equal(calculateStatutoryFare(sedanTariff, 10), 300);
    assert.equal(calculateStatutoryFare(sedanTariff, 25), 570);
  });

  await t.test('MIN_PLUS_PER_KM: Mini-Bus Matador (min ₹10, ₹2.2/km)', () => {
    const miniBusTariff = {
      calculationType: 'MIN_PLUS_PER_KM',
      minFare: 10,
      perKm: 2.2
    };

    // 2 km: 2 * 2.2 = 4.4 -> minimum ₹10 applies
    assert.equal(calculateStatutoryFare(miniBusTariff, 2), 10);
    // 10 km: 10 * 2.2 = 22 -> ₹22 applies
    assert.equal(calculateStatutoryFare(miniBusTariff, 10), 22);
  });

  await t.test('TERRAIN_RATE: Big Bus with authoritative statutory terrain rates', () => {
    const busTariff = {
      calculationType: 'TERRAIN_RATE',
      minFare: 12,
      ratesByTerrain: {
        'kashmir-plain': 1.65,
        'kashmir-hill': 1.95,
        'jammu-plain': 1.35,
        'jammu-hill': 1.90
      }
    };

    // 10 km on kashmir-plain: 10 * 1.65 = 16.5 -> ₹17
    assert.equal(calculateStatutoryFare(busTariff, 10, 'kashmir-plain'), 17);
    // 10 km on kashmir-hill: 10 * 1.95 = 19.5 -> ₹20
    assert.equal(calculateStatutoryFare(busTariff, 10, 'kashmir-hill'), 20);
    // 10 km on jammu-plain: 10 * 1.35 = 13.5 -> ₹14
    assert.equal(calculateStatutoryFare(busTariff, 10, 'jammu-plain'), 14);
    // 10 km on jammu-hill: 10 * 1.90 = 19 -> ₹19
    assert.equal(calculateStatutoryFare(busTariff, 10, 'jammu-hill'), 19);
    // Short trip triggers minimum fare
    assert.equal(calculateStatutoryFare(busTariff, 3, 'jammu-plain'), 12);

    // Unregistered/missing terrain strictly throws without falling back
    assert.throws(
      () => calculateStatutoryFare(busTariff, 10, 'unregistered-terrain'),
      /\[FARE_ENGINE\] No statutory terrain rate for 'unregistered-terrain'\./
    );
  });

  await t.test('Input Validation & Safety Contract: non-positive distance returns null', () => {
    const tariff = { calculationType: 'PER_KM', perKm: 15 };
    assert.equal(calculateStatutoryFare(tariff, 0), null);
    assert.equal(calculateStatutoryFare(tariff, -5), null);
    assert.equal(calculateStatutoryFare(tariff, NaN), null);
    assert.equal(calculateStatutoryFare(null, 10), null);
  });
});

test('Fare Calculator Safety Contract — Hard-Disable Guarantee', async (t) => {
  await t.test('Hard-disable contract: displayFare is strictly null when enabled is false', () => {
    const disabledResult = useFareCalculator({
      vehicle: { key: 'e-auto', name: 'E-Auto' },
      distance: 10,
      enabled: false
    });
    assert.equal(disabledResult.displayFare, null);
    assert.equal(disabledResult.fareParts.isViable, false);
  });

  await t.test('Hard-disable contract: displayFare is strictly null when route is not resolved or not viable', () => {
    const noVehicleResult = useFareCalculator({
      vehicle: null,
      distance: 10,
      enabled: true
    });
    assert.equal(noVehicleResult.displayFare, null);
  });
});
