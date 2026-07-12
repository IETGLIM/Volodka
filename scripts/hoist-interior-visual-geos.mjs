import fs from 'fs';
import path from 'path';

const typeMap = {
  boxGeometry: 'BoxGeometry',
  cylinderGeometry: 'CylinderGeometry',
  sphereGeometry: 'SphereGeometry',
  planeGeometry: 'PlaneGeometry',
  torusGeometry: 'TorusGeometry',
  circleGeometry: 'CircleGeometry',
};

const geoTagRe =
  /<(boxGeometry|cylinderGeometry|sphereGeometry|planeGeometry|torusGeometry|circleGeometry)\s+args=\{(\[[^\]]+\])\}\s*\/>/g;

/** Per-file room constants for resolving W/D/H in args */
const fileContext = {
  'HomeEveningVisual.tsx': { W: 14, D: 14, H: 3 },
  'ZaremaAlbertRoomVisual.tsx': { W: 8, D: 8, H: 3 },
  'VolodkaCorridorVisual.tsx': { W: 6, D: 16, H: 3 },
  'SolnyshRoomVisual.tsx': { W: 8, D: 8, H: 3 },
  'VolodkaRoomVisual.tsx': { W: 5, D: 7, H: 3 },
};

function evalArgs(argsStr, ctx) {
  const fn = new Function('W', 'D', 'H', 'Math', `return ${argsStr}`);
  return fn(ctx?.W ?? 0, ctx?.D ?? 0, ctx?.H ?? 0, Math);
}

function argsToCtor(type, args) {
  const cls = typeMap[type];
  return `new THREE.${cls}(${args.join(', ')})`;
}

function prefixFor(type) {
  return type
    .replace('boxGeometry', 'box')
    .replace('cylinderGeometry', 'cyl')
    .replace('sphereGeometry', 'sph')
    .replace('planeGeometry', 'pln')
    .replace('torusGeometry', 'tor')
    .replace('circleGeometry', 'cir');
}

function hoistFile(filePath, extraPools = '') {
  const baseName = path.basename(filePath);
  const ctx = fileContext[baseName] ?? null;
  let text = fs.readFileSync(filePath, 'utf8');

  const seen = new Map();
  let idx = 0;

  function getGeoName(type, argsStr) {
    const key = type + argsStr;
    if (!seen.has(key)) {
      idx += 1;
      seen.set(key, `geo_${prefixFor(type)}_${idx}`);
    }
    return seen.get(key);
  }

  // Dynamic book heights → pool
  text = text.replace(
    /<mesh(\s[^>]*)>\s*\n(\s*)<boxGeometry args=\{\[0\.08, 0\.18 \+ \(j % 3\) \* 0\.03, 0\.15\]\}\s*\/>\s*\n/g,
    '<mesh$1 geometry={BOOK_GEOS[j % 3]}>\n',
  );
  text = text.replace(
    /<mesh(\s[^>]*)>\s*\n(\s*)<boxGeometry args=\{\[0\.08, 0\.18 \+ \(j % 3\) \* 0\.02, 0\.18\]\}\s*\/>\s*\n/g,
    '<mesh$1 geometry={BOOK_GEOS[j % 3]}>\n',
  );

  // Photo frames with i index → pool
  text = text.replace(
    /<mesh>\s*\n(\s*)<boxGeometry args=\{\[0\.25 \+ i \* 0\.05, 0\.2 \+ i \* 0\.03, 0\.02\]\}\s*\/>\s*\n/g,
    '<mesh geometry={PHOTO_FRAME_GEOS[i]}>\n',
  );
  text = text.replace(
    /<mesh position=\{\[0, 0, 0\.011\]\}>\s*\n(\s*)<planeGeometry args=\{\[0\.2 \+ i \* 0\.04, 0\.15 \+ i \* 0\.02\]\}\s*\/>\s*\n/g,
    '<mesh position={[0, 0, 0.011]} geometry={PHOTO_PLANE_GEOS[i]}>\n',
  );

  // Solnysh wall planes: i < 2 ? W : D, H
  text = text.replace(
    /<mesh key=\{i\} position=\{\[x, y, z\]\} rotation-y=\{ry\}>\s*\n(\s*)<planeGeometry args=\{\[i < 2 \? W : D, H\]\}\s*\/>\s*\n/g,
    '<mesh key={i} position={[x, y, z]} rotation-y={ry} geometry={i < 2 ? geo_pln_wall_wh : geo_pln_wall_dh}>\n',
  );

  // Volodka room bookshelf spines with variable width
  text = text.replace(
    /<mesh([^>]*?)>\s*\n(\s*)<boxGeometry args=\{\[b\.w, (0\.2|0\.18), 0\.18\]\}\s*\/>\s*\n/g,
    '<mesh$1 geometry={bookSpineGeo(b.w, $2)}>\n',
  );

  let skipped = [];

  text = text.replace(geoTagRe, (full, type, argsStr) => {
    if (argsStr.includes('j % 3') || argsStr.includes('i * 0.05')) return full;

    let resolvedArgsStr = argsStr;
    if (ctx && /[WDH]/.test(argsStr)) {
      try {
        const vals = evalArgs(argsStr, ctx);
        resolvedArgsStr = `[${vals.join(', ')}]`;
      } catch {
        skipped.push(argsStr);
        return full;
      }
    }

    if (/[a-zA-Z_%?]/.test(resolvedArgsStr.replace(/Math\.PI/g, ''))) {
      skipped.push(argsStr);
      return full;
    }

    const name = getGeoName(type, resolvedArgsStr);
    return `__GEO_REF__${name}__`;
  });

  text = text.replace(
    /<mesh(\s[^>]*)?>\s*\n(\s*)__GEO_REF__(geo_[a-z0-9_]+)__/g,
    '<mesh$1 geometry={$3}>\n',
  );

  const remainingTags = (text.match(/<(boxGeometry|cylinderGeometry|sphereGeometry|planeGeometry|torusGeometry|circleGeometry)/g) || []).length;
  const remainingRefs = (text.match(/__GEO_REF__/g) || []).length;

  if (remainingTags > 0 || remainingRefs > 0) {
    console.error(`${baseName}: remaining inline=${remainingTags}, unreplaced=${remainingRefs}`);
    if (skipped.length) console.error('  skipped:', [...new Set(skipped)].slice(0, 5));
    const sample = text.match(/<(boxGeometry|cylinderGeometry)[^\n]+/);
    if (sample) console.error('  sample:', sample[0]);
    return false;
  }

  if (seen.size === 0 && !extraPools) {
    console.log(`${baseName}: nothing to hoist`);
    return true;
  }

  const lines = ['/* ─── Shared geometries (module-level, reused across renders) ─── */', ''];
  for (const [key, name] of seen) {
    const type = key.match(/^(boxGeometry|cylinderGeometry|sphereGeometry|planeGeometry|torusGeometry|circleGeometry)/)[1];
    const argsStr = key.slice(type.length);
    const args = Function(`return ${argsStr}`)();
    lines.push(`const ${name} = ${argsToCtor(type, args)};`);
  }
  if (extraPools) lines.push(extraPools);
  lines.push('');

  // Insert after imports / before first export or interface
  const insertMarkers = [
    '\nexport function ',
    '\nexport interface ',
    '\ninterface ',
  ];
  let insertAt = -1;
  for (const marker of insertMarkers) {
    const i = text.indexOf(marker);
    if (i !== -1) {
      insertAt = i;
      break;
    }
  }
  if (insertAt === -1) {
    console.error(`${baseName}: could not find insert point`);
    return false;
  }

  const newContent = `${text.slice(0, insertAt)}\n${lines.join('\n')}${text.slice(insertAt)}`;
  fs.writeFileSync(filePath, newContent);
  console.log(`${baseName}: hoisted ${seen.size} geometries`);
  return true;
}

const bookPool = `
const geo_box_book_h0 = new THREE.BoxGeometry(0.08, 0.18, 0.15);
const geo_box_book_h1 = new THREE.BoxGeometry(0.08, 0.21, 0.15);
const geo_box_book_h2 = new THREE.BoxGeometry(0.08, 0.24, 0.15);
const BOOK_GEOS = [geo_box_book_h0, geo_box_book_h1, geo_box_book_h2] as const;
`.trim();

const photoPool = `
const geo_box_photo_0 = new THREE.BoxGeometry(0.25, 0.2, 0.02);
const geo_box_photo_1 = new THREE.BoxGeometry(0.30, 0.23, 0.02);
const geo_box_photo_2 = new THREE.BoxGeometry(0.35, 0.26, 0.02);
const PHOTO_FRAME_GEOS = [geo_box_photo_0, geo_box_photo_1, geo_box_photo_2] as const;
const geo_pln_photo_0 = new THREE.PlaneGeometry(0.2, 0.15);
const geo_pln_photo_1 = new THREE.PlaneGeometry(0.24, 0.17);
const geo_pln_photo_2 = new THREE.PlaneGeometry(0.28, 0.19);
const PHOTO_PLANE_GEOS = [geo_pln_photo_0, geo_pln_photo_1, geo_pln_photo_2] as const;
`.trim();

const solnyshWallPool = `
const geo_pln_wall_wh = new THREE.PlaneGeometry(8, 3);
const geo_pln_wall_dh = new THREE.PlaneGeometry(8, 3);
`.trim();

const bookSpinePool = `
const bookSpineGeoCache = new Map<string, THREE.BoxGeometry>();
function bookSpineGeo(w: number, h: number, d = 0.18): THREE.BoxGeometry {
  const key = \`\${w}_\${h}_\${d}\`;
  let geo = bookSpineGeoCache.get(key);
  if (!geo) {
    geo = new THREE.BoxGeometry(w, h, d);
    bookSpineGeoCache.set(key, geo);
  }
  return geo;
}
`.trim();

const files = [
  ['G:/1O1O1/src/components/3d/HomeEveningVisual.tsx', `${bookPool}\n${photoPool}`],
  ['G:/1O1O1/src/components/3d/ZaremaAlbertRoomVisual.tsx', ''],
  ['G:/1O1O1/src/components/3d/VolodkaCorridorVisual.tsx', ''],
  ['G:/1O1O1/src/components/3d/SolnyshRoomVisual.tsx', solnyshWallPool],
  ['G:/1O1O1/src/components/3d/VolodkaRoomVisual.tsx', bookSpinePool],
  ['G:/1O1O1/src/components/3d/sceneChunks/homeEvening/HomeEveningPropsChunk.tsx', ''],
  ['G:/1O1O1/src/components/3d/sceneChunks/volodkaRoom/VolodkaRoomClutterChunk.tsx', ''],
];

let ok = true;
for (const [f, pools] of files) {
  if (!hoistFile(f, pools)) ok = false;
}
process.exit(ok ? 0 : 1);
