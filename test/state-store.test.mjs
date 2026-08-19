/**
 * SAFAR — StateStore Pub/Sub & Snapshot Unit Test Suite
 * Tests memory adapter (publish, subscribe, unsubscribe, snapshot update, getSnapshot, removeSnapshot)
 * and optional Redis mode if REDIS_URL is provided in the environment.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import stateStore from '../command-control-server/stateStore.js';

test('▶ StateStore Pub/Sub & Snapshot Module', async (t) => {

  await t.test('1. Memory Mode: Publish & Subscribe delivering exact payload', async () => {
    stateStore.init(); // Memory mode
    assert.equal(stateStore.getMode(), 'memory');

    let receivedPayload = null;
    const unsub = stateStore.subscribe('test.channel', (payload) => {
      receivedPayload = payload;
    });

    const testEvent = {
      type: 'bus_position',
      vehicleNo: 'JK01-TEST-99',
      lat: 34.0837,
      lng: 74.7973,
      speed: 32,
      timestamp: Date.now()
    };

    await stateStore.publish('test.channel', testEvent);
    assert.deepEqual(receivedPayload, testEvent, 'Subscriber must receive exact published payload');

    // Test unsubscribe
    unsub();
    receivedPayload = null;
    await stateStore.publish('test.channel', { type: 'ignored' });
    assert.equal(receivedPayload, null, 'Unsubscribed handler must not receive subsequent messages');
  });

  await t.test('2. Memory Mode: Snapshot Update, Retrieval & Removal', async () => {
    stateStore.init();

    const trip1 = { vehicleNo: 'JK01-A-101', routeName: 'Srinagar - Budgam', speed: 28 };
    const trip2 = { vehicleNo: 'JK01-B-202', routeName: 'Lal Chowk - Hazratbal', speed: 15 };

    await stateStore.updateSnapshot('JK01-A-101', trip1);
    await stateStore.updateSnapshot('JK01-B-202', trip2);

    const snapshot = await stateStore.getSnapshot();
    assert.ok(snapshot['JK01-A-101'], 'Snapshot must contain first vehicle');
    assert.ok(snapshot['JK01-B-202'], 'Snapshot must contain second vehicle');
    assert.equal(snapshot['JK01-A-101'].routeName, 'Srinagar - Budgam');

    // Test remove
    await stateStore.removeSnapshot('JK01-A-101');
    const updatedSnapshot = await stateStore.getSnapshot();
    assert.equal(updatedSnapshot['JK01-A-101'], undefined, 'Removed vehicle must not be in snapshot');
    assert.ok(updatedSnapshot['JK01-B-202'], 'Other vehicles must remain intact');
  });

  await t.test('3. Redis Mode: Optional live broker test (skipped if REDIS_URL unset)', async () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('   ℹ Skipping Redis live test (REDIS_URL not set in environment)');
      return;
    }

    stateStore.init({ redisUrl });
    assert.equal(stateStore.getMode(), 'redis');

    let receivedRedisPayload = null;
    const unsub = stateStore.subscribe('telemetry.redis.test', (payload) => {
      receivedRedisPayload = payload;
    });

    // Wait 100ms for subscription handshake
    await new Promise(r => setTimeout(r, 100));

    const redisEvent = { vehicleNo: 'JK01-REDIS-999', speed: 45, timestamp: Date.now() };
    await stateStore.publish('telemetry.redis.test', redisEvent);

    // Wait up to 500ms for loopback message
    await new Promise(r => setTimeout(r, 300));
    assert.deepEqual(receivedRedisPayload, redisEvent, 'Redis subscriber must receive payload over pub/sub');

    unsub();
    await stateStore.close();
  });

});
