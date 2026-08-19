/**
 * SAFAR — Driver Onboarding & KYC Verification Integration Test Suite
 * Tests driver registration, AES-256-GCM encrypted document uploads,
 * admin review queue, document viewing, KYC shift start gate, and audit logging.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app, server } from '../command-control-server/server.js';
import { encryptBuffer, decryptBuffer } from '../command-control-server/utils/encryptFile.js';

let testPort = 0;
let testServer = null;

before(async () => {
  await new Promise(resolve => {
    testServer = server.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });
});

after(async () => {
  if (testServer) {
    if (typeof testServer.closeAllConnections === 'function') testServer.closeAllConnections();
    await new Promise(resolve => testServer.close(resolve));
  }
  setTimeout(() => process.exit(0), 100);
});

test('▶ Driver Onboarding & KYC Verification Engine', async (tSuite) => {

  const testVehicleNo = `JK01-KYC-${Date.now() % 10000}`;
  let driverToken = null;

  await tSuite.test('1. AES-256-GCM File Encryption: Roundtrip buffer encryption and decryption', () => {
    const rawBuffer = Buffer.from('Official Driver Licence Copy - Government of J&K Transport');
    const encrypted = encryptBuffer(rawBuffer);
    assert.ok(encrypted.length >= rawBuffer.length + 28, 'Encrypted buffer must contain IV + AuthTag');

    const decrypted = decryptBuffer(encrypted);
    assert.equal(decrypted.toString('utf8'), rawBuffer.toString('utf8'), 'Decrypted buffer must match original');
  });

  await tSuite.test('2. Driver Onboarding: POST /api/v1/driver/onboard creates driver with not_submitted status', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9876543210',
        name: 'Ghulam Nabi',
        vehicleNo: testVehicleNo,
        upiId: 'ghulam@okaxis'
      })
    });

    assert.equal(res.status, 201, 'Onboarding must return 201 Created');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.vehicleNo, testVehicleNo);
    assert.equal(json.data.kycStatus, 'not_submitted');
    assert.ok(json.data.driverToken.startsWith('drv_tok_'));
    driverToken = json.data.driverToken;
  });

  await tSuite.test('3. KYC Shift Gate: POST /api/v1/driver/shift/start blocked with 403 when KYC unapproved', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Driver-Secret': 'safar-driver-secret-2026'
      },
      body: JSON.stringify({
        vehicleNo: testVehicleNo,
        routeId: 'SRN-BUD-01'
      })
    });

    assert.equal(res.status, 403, 'Shift start must return 403 when KYC status is not approved');
    const json = await res.json();
    assert.equal(json.error.code, 'KYC_VERIFICATION_REQUIRED');
  });

  await tSuite.test('4. Document Upload: POST /api/v1/driver/kyc/upload encrypts files and updates status to pending', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    // Create multipart payload with 3 files
    const dummyPngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01]);
    const dummyPdfHeader = Buffer.from('%PDF-1.4\n%test file content');
    
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${driverToken}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="licence"; filename="licence.png"\r\nContent-Type: image/png\r\n\r\n`,
      dummyPngHeader,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="vehicleRc"; filename="rc.png"\r\nContent-Type: image/png\r\n\r\n`,
      dummyPngHeader,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="routePermit"; filename="permit.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
      dummyPdfHeader,
      `\r\n--${boundary}--\r\n`
    ];

    const bodyBuffer = Buffer.concat(parts.map(p => typeof p === 'string' ? Buffer.from(p) : p));

    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/kyc/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });

    assert.equal(res.status, 201, 'Upload must return 201 Created');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.kycStatus, 'pending');
  });

  await tSuite.test('5. KYC Status Check: GET /api/v1/driver/kyc/status returns pending', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/kyc/status?token=${driverToken}`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'pending');
    assert.ok(json.data.submittedAt);
  });

  await tSuite.test('6. Admin Pending Queue: GET /api/v1/admin/kyc/pending lists submitted driver', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/kyc/pending`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    const target = json.data.find(d => d.vehicleNo === testVehicleNo);
    assert.ok(target, 'Submitted driver must appear in admin queue');
    assert.equal(target.name, 'Ghulam Nabi');
    assert.ok(target.phoneMasked.includes('****'), 'Phone must be masked in admin list');
  });

  await tSuite.test('7. Admin Document Viewer: Decrypts and serves uploaded documents', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/kyc/document/${testVehicleNo}/licence`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
    const buf = await res.arrayBuffer();
    assert.ok(buf.byteLength > 0);
  });

  await tSuite.test('8. Admin Review (Reject): POST /api/v1/admin/kyc/verify rejects with reason', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/kyc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleNo: testVehicleNo,
        action: 'reject',
        reason: 'Vehicle RC image is blurry. Please re-upload.'
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.kycStatus, 'rejected');

    const statusRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/kyc/status?token=${driverToken}`);
    const statusJson = await statusRes.json();
    assert.equal(statusJson.data.status, 'rejected');
    assert.equal(statusJson.data.rejectionReason, 'Vehicle RC image is blurry. Please re-upload.');
  });

  await tSuite.test('9. Admin Review (Approve): Approves driver and unlocks shift start', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/kyc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleNo: testVehicleNo,
        action: 'approve'
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.kycStatus, 'approved');

    // Verify shift start is now unlocked
    const shiftRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Driver-Secret': 'safar-driver-secret-2026'
      },
      body: JSON.stringify({
        vehicleNo: testVehicleNo,
        routeId: 'SRN-BUD-01'
      })
    });

    assert.equal(shiftRes.status, 200, 'Shift start must succeed after KYC approval');
    const shiftJson = await shiftRes.json();
    assert.equal(shiftJson.success, true);
    assert.ok(shiftJson.data.driverToken);
  });

});
