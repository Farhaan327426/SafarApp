import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const workspace = path.resolve('.');
const ignoreDirs = new Set(['node_modules', '.git', '.gemini', 'dist', 'build', 'scratch', '.agents']);
const pattern = /\bsafar[\s_-]+(pro|sathi|saathi)\b|\b(pro|sathi|saathi)[\s_-]+safar\b|\bsafarsaathi\b|\bsafarsathi\b|\bsafarpro\b/i;

test('SAFAR Brand Integrity: Zero legacy branding remnants in codebase', () => {
  const matches = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          scanDir(path.join(dir, entry.name));
        }
      } else {
        if (!/\.(js|ts|mjs|html|json|md|css|webmanifest|sql)$/i.test(entry.name)) continue;
        const filePath = path.join(dir, entry.name);
        if (filePath.includes('branding-audit.test.mjs')) continue;

        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (pattern.test(line)) {
              matches.push({ path: filePath, line: idx + 1, text: line.trim() });
            }
          });
        } catch (e) {}
      }
    }
  }

  scanDir(workspace);

  if (matches.length > 0) {
    console.error('Branding remnants found:', matches);
  }
  assert.strictEqual(matches.length, 0, `Expected 0 branding remnants but found ${matches.length}`);
});
