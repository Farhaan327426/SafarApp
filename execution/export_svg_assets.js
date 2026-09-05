import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jsPath = path.join(rootDir, 'frontend', 'js', 'vehicle-illustrations.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Match keys and template strings
const regex = /"([a-z0-9-]+)":\s*`(<svg[\s\S]*?<\/svg>)`/g;
let match;
const count = { exported: 0 };

const outDirs = [
  path.join(rootDir, 'frontend', 'images', 'vehicles'),
  path.join(rootDir, 'public', 'vehicles')
];

outDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

while ((match = regex.exec(jsContent)) !== null) {
  const key = match[1];
  let svg = match[2].trim();
  
  // Clean up svg by ensuring standard xml headers / namespace
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  }
  
  outDirs.forEach(dir => {
    const filePath = path.join(dir, `${key}.svg`);
    fs.writeFileSync(filePath, svg, 'utf8');
  });
  
  console.log(`Saved vehicle asset: ${key}.svg`);
  count.exported++;
}

console.log(`Successfully exported ${count.exported} vehicle SVG images to frontend/images/vehicles and public/vehicles.`);
