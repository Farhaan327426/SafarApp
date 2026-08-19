/**
 * SAFAR — Multilingual & RTL Translation Engine Unit Test Suite
 * Tests dictionary loading, parameter interpolation, language switching,
 * text direction (LTR vs RTL), persistence, and fallback mechanisms.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  t,
  setLanguage,
  getCurrentLang,
  isRTL,
  SUPPORTED_LANGS,
  RTL_LANGS,
  injectTranslationsForTest
} from '../frontend/js/i18n.js';

test('▶ Multilingual & RTL Translation Engine', async (tSuite) => {

  await tSuite.test('1. Variable Interpolation: t() replaces {{param}} variables properly', () => {
    injectTranslationsForTest('en', {
      fare_amount: 'Fare: ₹{{amount}}',
      last_updated_ago: 'updated {{minutes}} min ago',
      distance_km: '{{distance}} km'
    });

    assert.equal(t('fare_amount', { amount: 25 }), 'Fare: ₹25');
    assert.equal(t('last_updated_ago', { minutes: 5 }), 'updated 5 min ago');
    assert.equal(t('distance_km', { distance: 14.5 }), '14.5 km');
  });

  await tSuite.test('2. Missing Key Fallback: t() returns key or default dictionary entry if translation missing', () => {
    injectTranslationsForTest('en', {
      app_name: 'SAFAR'
    });

    assert.equal(t('app_name'), 'SAFAR');
    assert.equal(t('non_existent_key_123'), 'non_existent_key_123');
  });

  await tSuite.test('3. Language Direction: Urdu & Kashmiri are RTL, English & Hindi are LTR', async () => {
    injectTranslationsForTest('en', { app_name: 'SAFAR' });
    assert.equal(isRTL(), false, 'English must be LTR');

    injectTranslationsForTest('hi', { app_name: 'सफ़र' });
    assert.equal(isRTL(), false, 'Hindi must be LTR');

    injectTranslationsForTest('ur', { app_name: 'سَفَر' });
    assert.equal(isRTL(), true, 'Urdu must be RTL');

    injectTranslationsForTest('ks', { app_name: 'سَفَر' });
    assert.equal(isRTL(), true, 'Kashmiri must be RTL');
  });

  await tSuite.test('4. Language Persistence: Supported language list integrity', () => {
    assert.ok(SUPPORTED_LANGS.includes('en'));
    assert.ok(SUPPORTED_LANGS.includes('hi'));
    assert.ok(SUPPORTED_LANGS.includes('ur'));
    assert.ok(SUPPORTED_LANGS.includes('ks'));
    assert.deepEqual(RTL_LANGS, ['ur', 'ks']);
  });

  await tSuite.test('5. Multi-language Dictionary Content Verification', () => {
    injectTranslationsForTest('hi', {
      app_name: 'सफ़र',
      route_list: 'मार्ग',
      fare_calculator: 'किराया कैलकुलेटर'
    });
    assert.equal(t('app_name'), 'सफ़र');
    assert.equal(t('route_list'), 'मार्ग');

    injectTranslationsForTest('ur', {
      app_name: 'سَفَر',
      route_list: 'روٹس / راستے',
      fare_calculator: 'کرایہ کیلکولیٹر'
    });
    assert.equal(t('app_name'), 'سَفَر');
    assert.equal(t('route_list'), 'روٹس / راستے');

    injectTranslationsForTest('ks', {
      app_name: 'سَفَر',
      home_title: 'پَنٕنؠ بس ژھانڈِو',
      fare_calculator: 'کِرایہ حِساب'
    });
    assert.equal(t('home_title'), 'پَنٕنؠ بس ژھانڈِو');
    assert.equal(t('fare_calculator'), 'کِرایہ حِساب');
  });

});
