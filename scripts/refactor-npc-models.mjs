/**
 * Transforms ProceduralNPCModels.tsx:
 * 1. Converts inline <meshStandardMaterial> to material={npcMat(...)} props
 * 2. Converts inline geometry children to geometry={boxGeo(...)} props
 * 3. Removes <pointLight> elements
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/components/3d/ProceduralNPCModels.tsx');
let src = fs.readFileSync(filePath, 'utf8');

// Remove pointLights
src = src.replace(/\s*\{?\/\*[^*]*Point light[^*]*\*\/\}?\s*\n\s*<pointLight[^/]*\/>\s*/g, '\n');
src = src.replace(/\s*<pointLight[^/]*\/>\s*/g, '\n');

// Map geometry tag to factory function
const geoMap = {
  boxGeometry: 'boxGeo',
  sphereGeometry: 'sphereGeo',
  cylinderGeometry: 'cylinderGeo',
  capsuleGeometry: 'capsuleGeo',
  torusGeometry: 'torusGeo',
  circleGeometry: 'circleGeo',
};

function parseMaterialProps(matStr) {
  const props = {};
  // Handle multiline
  const clean = matStr.replace(/\s+/g, ' ').trim();
  
  const colorMatch = clean.match(/color=\{?([^}\s]+)\}?/);
  if (colorMatch) props.color = colorMatch[1];
  else {
    const colorStr = clean.match(/color="([^"]+)"/);
    if (colorStr) props.color = `"${colorStr[1]}"`;
  }

  const roughMatch = clean.match(/roughness=\{?([0-9.]+)\}?/);
  if (roughMatch) props.roughness = roughMatch[1];

  const metalMatch = clean.match(/metalness=\{?([0-9.]+)\}?/);
  if (metalMatch) props.metalness = metalMatch[1];

  const emissiveMatch = clean.match(/emissive=\{?([^}\s]+)\}?/);
  if (emissiveMatch) props.emissive = emissiveMatch[1];

  const emIntMatch = clean.match(/emissiveIntensity=\{?([0-9.]+)\}?/);
  if (emIntMatch) props.emissiveIntensity = emIntMatch[1];

  if (clean.includes('transparent')) props.transparent = true;
  const opMatch = clean.match(/opacity=\{?([0-9.]+)\}?/);
  if (opMatch) props.opacity = opMatch[1];

  if (clean.includes('side={THREE.DoubleSide}')) props.side = 'THREE.DoubleSide';

  return props;
}

function buildMatExpr(props) {
  const color = props.color;
  if (!color) return 'sharedMat.skinLight';

  // Static color shortcuts
  if (color === 'SKIN_LIGHT' || color === 'skinColor' && false) {}
  if (color === '"#888"' && props.metalness === '0.8' && !props.emissive) return 'sharedMat.metalGray';
  if (color === '"#888"' && props.metalness === '0.7') return 'metalMat("#888", 0.7, 0.3)';
  if (color === '"#555"') return 'sharedMat.metalDark';
  if (color === '"#ccc"') return 'sharedMat.drawstring';
  if (color === '"#ffffff"') return 'sharedMat.nameTag';
  if (color === '"#f0ece0"') return 'sharedMat.bookPages';
  if (color === 'HAIR_DARK') return 'sharedMat.hairDark';
  if (color === 'HAIR_BROWN') return 'sharedMat.hairBrown';
  if (color === 'HAIR_GRAY') return 'sharedMat.hairGray';
  if (color === 'HAIR_BLACK') return 'sharedMat.hairBlack';
  if (color === 'SKIN_LIGHT') return 'sharedMat.skinLight';
  if (color === 'SKIN_MEDIUM') return 'sharedMat.skinMedium';

  // skinColor with roughness 0.7
  if (color === 'skinColor' && props.roughness === '0.7' && !props.emissive && !props.transparent) {
    return 'skinMat(skinColor)';
  }
  if (color === 'skinShadow' && props.transparent) {
    const op = props.opacity ?? '0.2';
    return `stubbleMat(skinShadow, ${op})`;
  }

  // hairColor
  if (color === 'hairColor' && props.roughness === '0.9') return 'hairMat(hairColor)';

  // Emissive glow patterns
  if (props.emissive && props.emissiveIntensity) {
    const parts = [`color: ${color}`, `emissive: ${props.emissive}`, `emissiveIntensity: ${props.emissiveIntensity}`];
    if (props.roughness) parts.push(`roughness: ${props.roughness}`);
    if (props.metalness) parts.push(`metalness: ${props.metalness}`);
    if (props.transparent) parts.push('transparent: true');
    if (props.opacity) parts.push(`opacity: ${props.opacity}`);
    if (props.side) parts.push(`side: ${props.side}`);
    return `npcMat({ ${parts.join(', ')} })`;
  }

  // Clothing with glow - detect emissive patterns in clothingMat calls
  if (props.emissive && !props.emissiveIntensity) {
    const parts = [`color: ${color}`, `emissive: ${props.emissive}`];
    if (props.roughness) parts.push(`roughness: ${props.roughness}`);
    return `npcMat({ ${parts.join(', ')} })`;
  }

  // clothingMat pattern - body colors with glow
  const parts = [`color: ${color}`];
  if (props.roughness) parts.push(`roughness: ${props.roughness}`);
  if (props.metalness) parts.push(`metalness: ${props.metalness}`);
  if (props.transparent) parts.push('transparent: true');
  if (props.opacity) parts.push(`opacity: ${props.opacity}`);
  if (props.side) parts.push(`side: ${props.side}`);
  return `npcMat({ ${parts.join(', ')} })`;
}

function parseGeoArgs(geoTag, argsStr) {
  const args = argsStr.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
  const fn = geoMap[geoTag];
  if (!fn) return null;
  return `${fn}(${args.join(', ')})`;
}

// Transform mesh blocks with geometry + material children
const meshPattern = /<mesh([^>]*)>\s*(?:<!--[^>]*-->\s*)?\n?\s*<(\w+Geometry)\s+args=\{(\[[^\]]*\])\}\s*\/>\s*\n?\s*<meshStandardMaterial\s+([^/]*)\/>\s*\n?\s*<\/mesh>/g;

src = src.replace(meshPattern, (match, meshAttrs, geoTag, geoArgs, matProps) => {
  const geoExpr = parseGeoArgs(geoTag, geoArgs);
  const matExpr = buildMatExpr(parseMaterialProps(matProps));
  if (!geoExpr) return match;
  const castShadow = meshAttrs.includes('castShadow') ? ' castShadow' : '';
  return `<mesh${meshAttrs.replace(/\s*castShadow/, '')}${castShadow} geometry={${geoExpr}} material={${matExpr}} />`;
});

// Single-line variant
const meshPattern2 = /<mesh([^>]*)>\s*<(\w+Geometry)\s+args=\{(\[[^\]]*\])\}\s*\/>\s*<meshStandardMaterial\s+([^/]*)\/>\s*<\/mesh>/g;
src = src.replace(meshPattern2, (match, meshAttrs, geoTag, geoArgs, matProps) => {
  const geoExpr = parseGeoArgs(geoTag, geoArgs);
  const matExpr = buildMatExpr(parseMaterialProps(matProps));
  if (!geoExpr) return match;
  const castShadow = meshAttrs.includes('castShadow') ? ' castShadow' : '';
  return `<mesh${meshAttrs.replace(/\s*castShadow/, '')}${castShadow} geometry={${geoExpr}} material={${matExpr}} />`;
});

// Multiline meshStandardMaterial
const meshPattern3 = /<mesh([^>]*)>\s*<(\w+Geometry)\s+args=\{(\[[^\]]*\])\}\s*\/>\s*<meshStandardMaterial\s+([\s\S]*?)\/>\s*<\/mesh>/g;
src = src.replace(meshPattern3, (match, meshAttrs, geoTag, geoArgs, matProps) => {
  if (match.includes('geometry={')) return match; // already transformed
  const geoExpr = parseGeoArgs(geoTag, geoArgs);
  const matExpr = buildMatExpr(parseMaterialProps(matProps));
  if (!geoExpr) return match;
  const castShadow = meshAttrs.includes('castShadow') ? ' castShadow' : '';
  return `<mesh${meshAttrs.replace(/\s*castShadow/, '')}${castShadow} geometry={${geoExpr}} material={${matExpr}} />`;
});

// Update imports
if (!src.includes('boxGeo')) {
  src = src.replace(
    /from '\.\/proceduralNpcShared';/,
    `from './proceduralNpcShared';
import {
  boxGeo,
  sphereGeo,
  cylinderGeo,
  capsuleGeo,
  torusGeo,
  circleGeo,
  hairMat,
  metalMat,
  glowScreenMat,
  stubbleMat,
  emissiveMat,
  buildMerged,
} from './proceduralNpcShared';`
  );
  // Fix duplicate import - merge into single import block
  src = src.replace(
    /import \{\n  sharedGeo,\n  sharedMat,\n  mergedGeo,\n  npcMat,\n  skinMat,\n  skinShadowMat,\n  clothingMat,\n  DEFAULT_ARM_WIDTH,\n  DEFAULT_FOREARM_WIDTH,\n  DEFAULT_LEG_WIDTH,\n  DEFAULT_LOWER_LEG_WIDTH,\n\} from '\.\/proceduralNpcShared';\nimport \{\n  boxGeo,\n  sphereGeo,\n  cylinderGeo,\n  capsuleGeo,\n  torusGeo,\n  circleGeo,\n  hairMat,\n  metalMat,\n  glowScreenMat,\n  stubbleMat,\n  emissiveMat,\n  buildMerged,\n\} from '\.\/proceduralNpcShared';/,
    `import {
  sharedGeo,
  sharedMat,
  mergedGeo,
  npcMat,
  skinMat,
  skinShadowMat,
  clothingMat,
  hairMat,
  metalMat,
  glowScreenMat,
  stubbleMat,
  emissiveMat,
  buildMerged,
  boxGeo,
  sphereGeo,
  cylinderGeo,
  capsuleGeo,
  torusGeo,
  circleGeo,
  DEFAULT_ARM_WIDTH,
  DEFAULT_FOREARM_WIDTH,
  DEFAULT_LEG_WIDTH,
  DEFAULT_LOWER_LEG_WIDTH,
} from './proceduralNpcShared';`
  );
}

// Count remaining
const remainingMat = (src.match(/meshStandardMaterial/g) || []).length;
const remainingGeo = (src.match(/<(box|sphere|cylinder|capsule|torus|circle)Geometry/g) || []).length;
const remainingLights = (src.match(/pointLight/g) || []).length;

console.log(`Remaining meshStandardMaterial: ${remainingMat}`);
console.log(`Remaining inline geometry: ${remainingGeo}`);
console.log(`Remaining pointLight: ${remainingLights}`);

fs.writeFileSync(filePath, src);
console.log('Done.');
