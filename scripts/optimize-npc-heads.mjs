/**
 * Second pass: migrate skull/jaw/chin to sharedGeo, apply mergedGeo clusters.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/components/3d/ProceduralNPCModels.tsx');
let src = fs.readFileSync(filePath, 'utf8');

// Standard md head: skull 0.10 + jaw 0.14,0.05,0.10 + chin 0.024
const stdHead = `{/* Skull — slightly softer, more oval */}
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />`;

const stdHeadPattern = /\{\/\* Skull[^*]*\*\/\}\s*\n\s*<mesh castShadow geometry=\{sphereGeo\(0\.10, 8, 8\)\} material=\{skinMat\(skinColor\)\} \/>\s*\n\s*\{\/\* Jaw[^*]*\*\/\}\s*\n\s*<mesh position=\{\[0, -0\.05, 0\.025\]\} castShadow geometry=\{boxGeo\(0\.14, 0\.05, 0\.10\)\} material=\{skinMat\(skinColor\)\} \/>\s*\n\s*\{\/\* Chin[^*]*\*\/\}\s*\n\s*<mesh position=\{\[0, -0\.065, 0\.035\]\} geometry=\{sphereGeo\(0\.022, 4, 4\)\} material=\{skinMat\(skinColor\)\} \/>/g;
src = src.replace(stdHeadPattern, stdHead);

// Zarema chin delicate
src = src.replace(
  /<mesh position=\{\[0, -0\.07, 0\.04\]\} geometry=\{sphereGeo\(0\.022, 4, 4\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.07, 0.04]} geometry={sharedGeo.chinSphereSm} material={skinMat(skinColor)} />'
);

// Skull md only (no chin comment)
src = src.replace(
  /<mesh castShadow geometry=\{sphereGeo\(0\.10, 8, 8\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />'
);

// Jaw md
src = src.replace(
  /<mesh position=\{\[0, -0\.05, 0\.025\]\} castShadow geometry=\{boxGeo\(0\.14, 0\.05, 0\.10\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />'
);

// Chin md
src = src.replace(
  /<mesh position=\{\[0, -0\.065, 0\.035\]\} geometry=\{sphereGeo\(0\.024, 4, 4\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />'
);

// Neck cylinders → sharedGeo
const neckMap = [
  [/<mesh position=\{\[0, 0\.26, 0\]\} geometry=\{cylinderGeo\(0\.042, 0\.05, 0\.06, 6\)\}/g, 'sharedGeo.neckCylinderMd'],
  [/<mesh position=\{\[0, 0\.26, 0\]\} geometry=\{cylinderGeo\(0\.04, 0\.048, 0\.06, 6\)\}/g, 'sharedGeo.neckCylinderZarema'],
  [/<mesh position=\{\[0, 0\.28, 0\]\} geometry=\{cylinderGeo\(0\.06, 0\.065, 0\.07, 6\)\}/g, 'sharedGeo.neckCylinderLg'],
  [/<mesh position=\{\[0, 0\.27, 0\]\} geometry=\{cylinderGeo\(0\.048, 0\.055, 0\.06, 6\)\}/g, 'sharedGeo.neckCylinder'],
  [/<mesh position=\{\[0, 0\.24, 0\]\} geometry=\{cylinderGeo\(0\.035, 0\.040, 0\.04, 6\)\}/g, 'sharedGeo.neckCylinderSm'],
  [/<mesh position=\{\[0, 0\.26, 0\]\} geometry=\{cylinderGeo\(0\.038, 0\.045, 0\.06, 6\)\}/g, 'sharedGeo.neckCylinderSlim'],
];
for (const [pat, geo] of neckMap) {
  src = src.replace(pat, `<mesh position={[0, 0.26, 0]} geometry={${geo}}`.replace('0.26', pat.source.includes('0.28') ? '0.28' : pat.source.includes('0.27') ? '0.27' : pat.source.includes('0.24') ? '0.24' : '0.26'));
}

// Simpler neck replacements
src = src.replace(/geometry=\{cylinderGeo\(0\.042, 0\.05, 0\.06, 6\)\}/g, 'geometry={sharedGeo.neckCylinderMd}');
src = src.replace(/geometry=\{cylinderGeo\(0\.04, 0\.048, 0\.06, 6\)\}/g, 'geometry={sharedGeo.neckCylinderZarema}');
src = src.replace(/geometry=\{cylinderGeo\(0\.06, 0\.065, 0\.07, 6\)\}/g, 'geometry={sharedGeo.neckCylinderLg}');
src = src.replace(/geometry=\{cylinderGeo\(0\.048, 0\.055, 0\.06, 6\)\}/g, 'geometry={sharedGeo.neckCylinder}');
src = src.replace(/geometry=\{cylinderGeo\(0\.035, 0\.040, 0\.04, 6\)\}/g, 'geometry={sharedGeo.neckCylinderSm}');
src = src.replace(/geometry=\{cylinderGeo\(0\.038, 0\.045, 0\.06, 6\)\}/g, 'geometry={sharedGeo.neckCylinderSlim}');
src = src.replace(/geometry=\{cylinderGeo\(0\.05, 0\.055, 0\.07, 6\)\}/g, 'geometry={sharedGeo.neckCylinder}');
src = src.replace(/geometry=\{cylinderGeo\(0\.058, 0\.065, 0\.07, 6\)\}/g, 'geometry={sharedGeo.neckCylinderLg}');

// Hair color → hairMat
src = src.replace(/material=\{npcMat\(\{ color: hairColor, roughness: 0\.9 \}\)\}/g, 'material={hairMat(hairColor)}');
src = src.replace(/material=\{npcMat\(\{ color: HAIR_BROWN, roughness: 0\.9 \}\)\}/g, 'material={sharedMat.hairBrown}');
src = src.replace(/material=\{npcMat\(\{ color: HAIR_DARK, roughness: 0\.9 \}\)\}/g, 'material={sharedMat.hairDark}');
src = src.replace(/material=\{npcMat\(\{ color: HAIR_GRAY, roughness: 0\.9 \}\)\}/g, 'material={sharedMat.hairGray}');
src = src.replace(/material=\{npcMat\(\{ color: HAIR_BLACK, roughness: 0\.9 \}\)\}/g, 'material={sharedMat.hairBlack}');

// Metal #888
src = src.replace(/material=\{npcMat\(\{ color: "#888", roughness: 0\.3, metalness: 0\.8 \}\)\}/g, 'material={sharedMat.metalGray}');
src = src.replace(/material=\{npcMat\(\{ color: "#888", roughness: 0\.3, metalness: 0\.7 \}\)\}/g, 'material={metalMat("#888", 0.7, 0.3)}');
src = src.replace(/material=\{npcMat\(\{ color: "#555", roughness: 0\.3, metalness: 0\.8 \}\)\}/g, 'material={sharedMat.metalDark}');
src = src.replace(/material=\{npcMat\(\{ color: "#555", roughness: 0\.5, metalness: 0\.6 \}\)\}/g, 'material={sharedMat.metalDark}');

// Skin light heads
src = src.replace(
  /<mesh castShadow geometry=\{sphereGeo\(0\.105, 8, 8\)\} material=\{npcMat\(\{ color: SKIN_LIGHT, roughness: 0\.7 \}\)\} \/>/g,
  '<mesh castShadow geometry={sharedGeo.skullSphere} material={sharedMat.skinLight} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.055, 0\.025\]\} castShadow geometry=\{boxGeo\(0\.155, 0\.055, 0\.11\)\} material=\{npcMat\(\{ color: SKIN_LIGHT, roughness: 0\.7 \}\)\} \/>/g,
  '<mesh position={[0, -0.055, 0.025]} castShadow geometry={sharedGeo.jawBox} material={sharedMat.skinLight} />'
);

// Dmitry skull lg
src = src.replace(
  /<mesh castShadow geometry=\{sphereGeo\(0\.11, 8, 8\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh castShadow geometry={sharedGeo.skullSphereLg} material={skinMat(skinColor)} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.06, 0\.025\]\} castShadow geometry=\{boxGeo\(0\.17, 0\.06, 0\.12\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.06, 0.025]} castShadow geometry={sharedGeo.jawBoxLg} material={skinMat(skinColor)} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.08, 0\.035\]\} geometry=\{sphereGeo\(0\.03, 4, 4\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.08, 0.035]} geometry={sharedGeo.chinSphereXL} material={skinMat(skinColor)} />'
);

// Sergey skull
src = src.replace(
  /<mesh castShadow geometry=\{sphereGeo\(0\.105, 8, 8\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh castShadow geometry={sharedGeo.skullSphere} material={skinMat(skinColor)} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.055, 0\.025\]\} castShadow geometry=\{boxGeo\(0\.15, 0\.055, 0\.11\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.055, 0.025]} castShadow geometry={sharedGeo.jawBox} material={skinMat(skinColor)} />'
);

// Lena skull sm + jaw sm
src = src.replace(
  /<mesh castShadow geometry=\{sphereGeo\(0\.095, 8, 8\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh castShadow geometry={sharedGeo.skullSphereSm} material={skinMat(skinColor)} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.045, 0\.02\]\} castShadow geometry=\{boxGeo\(0\.12, 0\.04, 0\.08\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.045, 0.02]} castShadow geometry={sharedGeo.jawBoxSm} material={skinMat(skinColor)} />'
);

// Oleg jaw xl
src = src.replace(
  /<mesh position=\{\[0, -0\.06, 0\.025\]\} castShadow geometry=\{boxGeo\(0\.18, 0\.06, 0\.12\)\} material=\{skinMat\(skinColor\)\} \/>/g,
  '<mesh position={[0, -0.06, 0.025]} castShadow geometry={sharedGeo.jawBoxXL} material={skinMat(skinColor)} />'
);

// Stubble → stubbleMat
src = src.replace(
  /<mesh position=\{\[0, -0\.065, 0\.07\]\} geometry=\{boxGeo\(0\.15, 0\.05, 0\.005\)\} material=\{stubbleMat\(skinShadow, 0\.25\)\} \/>/g,
  '<mesh position={[0, -0.065, 0.07]} geometry={sharedGeo.stubblePlaneMd} material={stubbleMat(skinShadow, 0.25)} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.06, 0\.07\]\} geometry=\{boxGeo\(0\.16, 0\.05, 0\.005\)\} material=\{stubbleMat\(skinShadow, 0\.25\)\} \/>/g,
  '<mesh position={[0, -0.06, 0.07]} geometry={sharedGeo.stubblePlaneLg} material={stubbleMat(skinShadow, 0.25)} />'
);
src = src.replace(
  /<mesh position=\{\[0, -0\.055, 0\.065\]\} geometry=\{boxGeo\(0\.13, 0\.04, 0\.005\)\} material=\{stubbleMat\(skinShadow, 0\.2\)\} \/>/g,
  '<mesh position={[0, -0.055, 0.065]} geometry={sharedGeo.stubblePlaneSm} material={stubbleMat(skinShadow, 0.2)} />'
);

// Colleague earbud cords → merged
src = src.replace(
  /<mesh position=\{\[-0\.05, -0\.04, 0\.08\]\} rotation=\{\[0, 0, 0\.3\]\} material=\{sharedMat\.cord\}>\s*<boxGeometry args=\{\[0\.08, 0\.003, 0\.003\]\} \/>\s*<\/mesh>\s*<mesh position=\{\[0\.05, -0\.04, 0\.08\]\} rotation=\{\[0, 0, -0\.3\]\} material=\{sharedMat\.cord\}>\s*<boxGeometry args=\{\[0\.08, 0\.003, 0\.003\]\} \/>\s*<\/mesh>/g,
  '<mesh geometry={mergedGeo.earbudCords} material={sharedMat.cord} />'
);

const remainingInline = (src.match(/<(box|sphere|cylinder|capsule|torus|circle)Geometry/g) || []).length;
const remainingMat = (src.match(/meshStandardMaterial/g) || []).length;
console.log(`Inline geometry remaining: ${remainingInline}`);
console.log(`meshStandardMaterial remaining: ${remainingMat}`);

fs.writeFileSync(filePath, src);
console.log('Done.');
