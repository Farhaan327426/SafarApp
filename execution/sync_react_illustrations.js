import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jsPath = path.join(rootDir, 'frontend', 'js', 'vehicle-illustrations.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

const regex = /"([a-z0-9-]+)":\s*`(<svg[\s\S]*?<\/svg>)`/g;
let match;
const illustrations = {};

while ((match = regex.exec(jsContent)) !== null) {
  illustrations[match[1]] = match[2];
}

function svgToJsx(svgStr, compName) {
  let jsx = svgStr;

  // Convert HTML comments to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
  
  // Replace attributes
  const attrMap = {
    'stop-color': 'stopColor',
    'stop-opacity': 'stopOpacity',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-dasharray': 'strokeDasharray',
    'fill-opacity': 'fillOpacity',
    'font-size': 'fontSize',
    'font-family': 'fontFamily',
    'font-weight': 'fontWeight',
    'letter-spacing': 'letterSpacing',
    'text-anchor': 'textAnchor',
    'dominant-baseline': 'dominantBaseline',
    'class="vehicle-illustration-svg"': 'className={className}',
    'class="vehicle-svg"': 'className={className}',
    'class="vehicle-preview-svg"': 'className={className}'
  };

  for (const [k, v] of Object.entries(attrMap)) {
    jsx = jsx.replaceAll(k, v);
  }

  // Ensure className is in top svg
  if (!jsx.includes('className={className}')) {
    jsx = jsx.replace('<svg ', '<svg className={className} ');
  }

  return `export function ${compName}({ className = "w-full h-full" }) {
  return (
    ${jsx}
  );
}`;
}

const compMap = {
  'shared-cab': 'TataSumoIllustration',
  'mini-bus': 'MatadorIllustration',
  'vikram-tempo': 'VikramTempoIllustration',
  'e-rickshaw': 'ERickshawIllustration',
  'e-auto': 'EAutoIllustration',
  'auto': 'AutoRickshawIllustration',
  'tata-magic': 'TataMagicIllustration',
  'private-bus': 'PrivateBusIllustration',
  'force-traveler': 'ForceTravelerIllustration',
  'taxi': 'SedanTaxiIllustration',
  'suv-taxi': 'SUVTaxiIllustration'
};

const jsxFunctions = Object.entries(compMap).map(([key, compName]) => {
  return svgToJsx(illustrations[key], compName);
}).join('\n\n');

const reactFile = path.join(rootDir, 'src', 'components', 'VehicleIllustration.jsx');
const currentReactContent = fs.readFileSync(reactFile, 'utf8');

// Keep the VEHICLE_VISUAL_META header (lines 1 to 131)
const metaEndIndex = currentReactContent.indexOf('export function TataSumoIllustration');
const metaHeader = currentReactContent.substring(0, metaEndIndex);

const dispatcher = `/**
 * Universal Vehicle Illustration Dispatcher
 */
export default function VehicleIllustration({ vehicleKey, className = "w-full h-full" }) {
  switch (vehicleKey) {
    case "shared-cab":
      return <TataSumoIllustration className={className} />;
    case "mini-bus":
      return <MatadorIllustration className={className} />;
    case "vikram-tempo":
      return <VikramTempoIllustration className={className} />;
    case "e-rickshaw":
      return <ERickshawIllustration className={className} />;
    case "e-auto":
      return <EAutoIllustration className={className} />;
    case "auto":
      return <AutoRickshawIllustration className={className} />;
    case "tata-magic":
      return <TataMagicIllustration className={className} />;
    case "private-bus":
      return <PrivateBusIllustration className={className} />;
    case "force-traveler":
      return <ForceTravelerIllustration className={className} />;
    case "taxi":
      return <SedanTaxiIllustration className={className} />;
    case "suv-taxi":
      return <SUVTaxiIllustration className={className} />;
    default:
      return <TataSumoIllustration className={className} />;
  }
}
`;

const updatedContent = `${metaHeader}${jsxFunctions}\n\n${dispatcher}`;
fs.writeFileSync(reactFile, updatedContent, 'utf8');
console.log('Successfully synchronized updated illustrations into src/components/VehicleIllustration.jsx');
