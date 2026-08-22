/**
 * SAFAR — Core Utilities ESM Unit Test Suite
 */

import assert from 'assert';
import { escapeHtml } from '../frontend/js/core/dom.js';
import { calculateHaversineDistance } from '../frontend/js/core/network.js';
import { StateStore, DEFAULT_STATE } from '../frontend/js/core/state.js';
import { MINIMAL_FALLBACK_MINDMAP, VEHICLE_CAPACITIES } from '../frontend/js/core/constants.js';

console.log('🧪 Running Core Utilities ESM Unit Tests...');

// 1. Test escapeHtml
assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
assert.strictEqual(escapeHtml('Safar & Co.'), 'Safar &amp; Co.');
assert.strictEqual(escapeHtml(null), '');
assert.strictEqual(escapeHtml(123), '123');
console.log('  ✓ escapeHtml passed');

// 2. Test calculateHaversineDistance (Srinagar Lal Chowk ➔ Budgam Stand ~14km)
const dist = calculateHaversineDistance(34.0722, 74.8058, 34.0135, 74.7176);
assert(dist > 10 && dist < 20, `Expected distance ~14km, got ${dist}`);
assert.strictEqual(calculateHaversineDistance(0, 0, 0, 0), 0.1, 'Min clamped distance should be 0.1');
console.log(`  ✓ calculateHaversineDistance passed (${dist.toFixed(2)} km)`);

// 3. Test Constants
assert.strictEqual(VEHICLE_CAPACITIES.MINI_BUS, 22);
assert.strictEqual(MINIMAL_FALLBACK_MINDMAP.id, 'root');
console.log('  ✓ Constants passed');

// 4. Test StateStore (Instantiated & Singleton)
const testStore = new StateStore(DEFAULT_STATE);
assert.strictEqual(testStore.getState('commuter').boardingId, 'my_location');

let notificationReceived = false;
testStore.subscribe('commuter', state => {
  if (state.offlineCount === 5) {
    notificationReceived = true;
  }
});

testStore.setState('commuter', { offlineCount: 5 });
assert.strictEqual(testStore.getState('commuter').offlineCount, 5);
assert.strictEqual(notificationReceived, true, 'Subscriber callback should have fired');
console.log('  ✓ StateStore pub/sub passed');

console.log('\n✅ All Core Utility Unit Tests PASSED!');
