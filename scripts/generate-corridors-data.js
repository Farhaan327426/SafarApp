import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsonPath = resolve(__dirname, '../src/data/corridors.json');
const targetPath = resolve(__dirname, '../frontend/js/corridors-data.js');

const raw = readFileSync(jsonPath, 'utf-8');
const data = JSON.parse(raw);

const fileHeader = `/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Canonical Transit Corridor Dataset (Auto-generated from src/data/corridors.json)
 * DO NOT EDIT MANUALLY. Run 'npm run sync-corridors' to update.
 */
window.JK_CORRIDORS = ${JSON.stringify(data, null, 2)};
`;

writeFileSync(targetPath, fileHeader, 'utf-8');
console.log(`[sync-corridors] Successfully synchronized ${data.length} corridors to ${targetPath}`);
