/**
 * Safar — Sequential & Isolated Full Regression Test Runner
 * Prevents DB file race conditions across parallel test suites.
 * Executed via: node test/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const testSuites = [
  'test/driver-payout.test.mjs',
  'test/driver-kyc.test.mjs',
  'test/i18n.test.mjs',
  'test/offline-store.test.mjs',
  'test/anomaly-detection.test.mjs',
  'test/state-store.test.mjs',
  'test/sqlite-dual-write.test.mjs',
  'test/security-hardening.test.mjs',
  'test/security-audit.test.mjs',
  'test/upi-payment.test.mjs',
  'test/admin-dashboard.test.mjs',
  'test/load-test.test.mjs',
  'test/telemetry-stream.test.mjs',
  'test/ai-assistant-api.test.mjs',
  'test/fare-sro-versioning.test.mjs',
  'test/telemetry-anon.test.mjs',
  'test/production-pilot.test.mjs',
  'test/places-route-graph.test.mjs',
  'test/core-utilities.test.mjs',
  'test/branding-audit.test.mjs',
  'test/security-audit-report.test.mjs'
];

function runTestFile(file) {
  return new Promise((resolve) => {
    const isNodeTest = file.endsWith('.mjs');
    const normalizedPath = file.replace(/\\/g, '/');
    const args = isNodeTest ? ['--test', normalizedPath] : [normalizedPath];

    console.log('====================================================');
    console.log(`▶ Executing: node ${args.join(' ')}`);
    console.log('====================================================');

    const child = spawn('node', args, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✔ SUCCESS: ${file}\n`);
        resolve(true);
      } else {
        console.error(`✖ FAILED: ${file} (Exit code: ${code})\n`);
        resolve(false);
      }
    });
  });
}

async function runAll() {
  console.log('🚀 Starting Sequential & Isolated Full System Regression Execution...\n');
  let passedCount = 0;
  let failedCount = 0;
  const startTime = Date.now();

  for (const file of testSuites) {
    const success = await runTestFile(file);
    if (success) passedCount++;
    else failedCount++;
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('====================================================');
  console.log(`📊 SEQUENTIAL REGRESSION SUMMARY (${totalDuration}s)`);
  console.log(`   Passed Suites: ${passedCount}/${testSuites.length}`);
  console.log(`   Failed Suites: ${failedCount}/${testSuites.length}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL 20 SUITES PASSED! System is UAT & Production Pilot Ready.');
    process.exit(0);
  }
}

runAll();
