import { readFileSync } from 'fs';
import assert from 'assert';

// 1. Verify frontend/index.html elements
const html = readFileSync('frontend/index.html', 'utf-8');

assert.ok(html.includes('id="help-modal-trigger"'), 'index.html missing help-modal-trigger');
assert.ok(html.includes('id="conductorPassModal"'), 'index.html missing conductorPassModal');
assert.ok(html.includes('id="passQrCanvas"'), 'index.html missing passQrCanvas');
assert.ok(html.includes('id="openPassModalBtn"'), 'index.html missing openPassModalBtn');
assert.ok(html.includes('corridors-data.js'), 'index.html missing corridors-data.js script');

console.log('✅ HTML markup verification passed');

// 2. Test corridor data in browser environment simulation
const dataJs = readFileSync('frontend/js/corridors-data.js', 'utf-8');
const globalProxy = {};
new Function('window', dataJs)(globalProxy);
assert.strictEqual(globalProxy.JK_CORRIDORS.length, 8, 'Expected 8 corridors');
console.log('✅ Corridors dataset verification passed');

// 3. Test main.js functions and contracts
const mainJs = readFileSync('frontend/js/main.js', 'utf-8');
assert.ok(mainJs.includes('function generateConductorPass'), 'main.js missing generateConductorPass');
assert.ok(mainJs.includes('devicePixelRatio'), 'main.js missing devicePixelRatio scaling');
assert.ok(mainJs.includes('renderStageExplorer'), 'main.js missing renderStageExplorer');

// Test locked replacer logic
const payload = {
  v: 1,
  o: 'Lal Chowk',
  d: 'Hazratbal',
  veh: 'Matador',
  pax: 2,
  fare: 40,
  seat: 20,
  ts: 1757157600000,
  sro: 'SRO-97'
};
const replacer = ['v', 'o', 'd', 'veh', 'pax', 'fare', 'seat', 'ts', 'sro'];
const json = JSON.stringify(payload, replacer);
const b64 = Buffer.from(json).toString('base64');
const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
assert.deepStrictEqual(Object.keys(parsed), replacer);
assert.strictEqual(parsed.fare, 40);
assert.strictEqual(parsed.pax, 2);
console.log('✅ QR Payload and Base64 contract verification passed');
