/**
 * Migrates inline <meshStandardMaterial> in *Visual.tsx files to registry-backed
 * module-level constants + mesh material={} props.
 *
 * Skips: ref=, dynamic color={expr}, map={runtimeTexture}.
 * Run repeatedly until counts stabilize.
 *
 * Usage: node scripts/migrate-inline-materials.mjs src/components/3d/FooVisual.tsx
 */

import { readFileSync, writeFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/migrate-inline-materials.mjs <path-to-Visual.tsx>');
  process.exit(1);
}

/** Skip duplicate constant blocks on re-runs. */
function stripExistingMatConstants(source) {
  return source.replace(/\nconst mat_\d+ = getSharedStandardMaterial\([^;]+\);\n/g, '\n');
}

let src = stripExistingMatConstants(readFileSync(filePath, 'utf8'));
const beforeCount = (src.match(/<meshStandardMaterial/g) || []).length;

/** Skip only truly runtime-driven material props (refs, variable colors, texture maps). */
const DYNAMIC_SKIP = /\bref=|\bcolor=\{|\bmap=\{|\bside=\{(?!THREE\.)/;

function parseProps(raw) {
  const props = {};
  const text = raw.replace(/\s+/g, ' ').trim();
  let i = 0;
  while (i < text.length) {
    const nameMatch = text.slice(i).match(/^(\w+)/);
    if (!nameMatch) break;
    const name = nameMatch[1];
    i += name.length;
    if (text[i] === '=') {
      i++;
      if (text[i] === '"') {
        const end = text.indexOf('"', i + 1);
        props[name] = { type: 'string', value: text.slice(i + 1, end) };
        i = end + 1;
      } else if (text[i] === '{') {
        let depth = 1;
        let j = i + 1;
        while (j < text.length && depth > 0) {
          if (text[j] === '{') depth++;
          if (text[j] === '}') depth--;
          j++;
        }
        props[name] = { type: 'expr', value: text.slice(i + 1, j - 1).trim() };
        i = j;
      } else {
        break;
      }
    } else if (name === 'polygonOffset' || name === 'toneMapped' || name === 'transparent') {
      props[name] = { type: 'bool', value: true };
      i += 0;
    } else {
      break;
    }
    while (text[i] === ' ') i++;
  }
  return props;
}

function propsToLiteral(props) {
  const parts = [];
  for (const [key, val] of Object.entries(props)) {
    if (val.type === 'bool') {
      parts.push(`${key}: true`);
    } else if (val.type === 'string') {
      parts.push(`${key}: '${val.value}'`);
    } else if (val.type === 'expr') {
      if (key === 'map') return null;
      if (
        key === 'roughness' ||
        key === 'metalness' ||
        key === 'emissiveIntensity' ||
        key === 'opacity' ||
        key === 'polygonOffsetFactor' ||
        key === 'polygonOffsetUnits'
      ) {
        parts.push(`${key}: ${val.value}`);
      } else if (key === 'side' && val.value === 'THREE.DoubleSide') {
        parts.push('side: THREE.DoubleSide');
      } else if (key === 'toneMapped' && val.value === 'false') {
        parts.push('toneMapped: false');
      } else {
        return null;
      }
    }
  }
  return `{ ${parts.join(', ')} }`;
}

const materials = new Map();
let nextId = 1;

function resolveMat(literal) {
  const key = literal.replace(/\s+/g, ' ');
  if (!materials.has(key)) {
    materials.set(key, `mat_${nextId++}`);
  }
  return materials.get(key);
}

const meshBlockRe =
  /<mesh\b([^>]*)>(\s*<(?:box|plane|cylinder|sphere|torus)Geometry[^/]*\/>)?\s*<meshStandardMaterial\s+([\s\S]*?)\/>\s*<\/mesh>/g;

src = src.replace(meshBlockRe, (full, meshAttrs, geoChild, matInner) => {
  if (DYNAMIC_SKIP.test(matInner)) return full;
  const props = parseProps(matInner);
  const literal = propsToLiteral(props);
  if (!literal) return full;
  const matName = resolveMat(literal);
  const geo = geoChild ?? '';
  return `<mesh${meshAttrs} material={${matName}}>${geo}</mesh>`;
});

if (materials.size === 0) {
  console.log('No migratable static materials found.');
  process.exit(0);
}

if (!src.includes('getSharedStandardMaterial')) {
  src = src.replace(
    /(import \* as THREE from 'three';)/,
    `$1\nimport { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';`,
  );
}

const staticBlock = [...materials.entries()]
  .map(([literal, name]) => `const ${name} = getSharedStandardMaterial(${literal});`)
  .join('\n');

const insertAfter = src.match(/registerModuleGeometries\(\[[\s\S]*?\]\);/);
if (insertAfter) {
  const pos = insertAfter.index + insertAfter[0].length;
  src = src.slice(0, pos) + '\n\n' + staticBlock + src.slice(pos);
} else {
  const exportFn = src.indexOf('export function');
  src = src.slice(0, exportFn) + staticBlock + '\n\n' + src.slice(exportFn);
}

writeFileSync(filePath, src, 'utf8');
const afterCount = (src.match(/<meshStandardMaterial/g) || []).length;
console.log(
  `${filePath}: ${beforeCount} -> ${afterCount} inline (${materials.size} new shared constants)`,
);
