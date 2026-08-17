/**
 * Prune Vite's copied public assets down to the deployable runtime set.
 *
 * Vite copies all of public/ into dist/. The repo keeps source/workbench assets
 * under public/models too, so production deploys must remove files that are not
 * reachable from the shipped registries or static runtime asset catalogs.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST } from '../src/config/assetManifest';
import { getNpcModelUrls } from '../src/config/npcModelRegistry';
import { getPropModelUrls } from '../src/config/propModelRegistry';
import { MODEL_URLS } from '../src/config/modelUrls';
import {
  getPolyHavenMapUrl,
  POLYHAVEN_HDRI,
  POLYHAVEN_MENU_PLATE,
  POLYHAVEN_MODELS,
  type PolyHavenMapKind,
  type PolyHavenMaterialId,
} from '../src/config/polyhavenAssets';
import { MIXAMO_ANIMATION_CATALOG } from '../src/config/mixamoAnimationCatalog';
import { MIXAMO_CLIP_IDS_ON_DISK } from '../src/config/mixamoClipsOnDisk';
import { collectAssetOwnershipPublicUrls } from '../src/config/assetOwnership';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const VERCEL_GLB_EXTERNAL_TEXTURES = [
  'models/interiors/Textures/colormap.png',
  'models/props/citykit/Textures/colormap.png',
] as const;

const MANAGED_ROOTS = new Set(['hdri', 'menu', 'models', 'textures']);
const PRESERVED_PREFIXES = ['assets/', 'basis/', 'draco/'];

const POLYHAVEN_MATERIALS: PolyHavenMaterialId[] = [
  'asphalt_02',
  'concrete_floor_painted',
  'wood_floor',
  'plastered_wall',
  'metal_plate',
];
const POLYHAVEN_MAPS: PolyHavenMapKind[] = ['diff', 'nor_gl', 'rough', 'ao'];
const TEXTURE_SCALES = [0.25, 0.5, 1] as const;

function normalizePublicPath(url: string): string {
  return url.replace(/^\//, '').replaceAll('\\', '/');
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function addUrl(keep: Set<string>, url: string | undefined): void {
  if (!url) return;
  if (/^(?:https?:)?\/\//.test(url) || url.startsWith('data:')) return;
  keep.add(normalizePublicPath(url));
}

function collectRuntimePublicPaths(): Set<string> {
  const keep = new Set<string>(['index.html', 'models/fps/fps_arms.glb']);

  for (const asset of Object.values(ASSET_MANIFEST)) {
    if (asset.shipped !== true) continue;
    for (const lod of asset.lods) addUrl(keep, lod.url);
    if (asset.variants) {
      for (const url of Object.values(asset.variants)) addUrl(keep, url);
    }
    addUrl(keep, asset.impostor?.url);
    addUrl(keep, asset.bakedLightmap);
  }

  for (const url of getNpcModelUrls()) addUrl(keep, url);
  for (const url of getPropModelUrls()) addUrl(keep, url);
  for (const url of Object.values(MODEL_URLS)) addUrl(keep, url);
  for (const url of Object.values(POLYHAVEN_MODELS)) addUrl(keep, url);
  for (const url of Object.values(POLYHAVEN_HDRI)) addUrl(keep, url);
  for (const url of collectAssetOwnershipPublicUrls()) addUrl(keep, url);
  for (const rel of VERCEL_GLB_EXTERNAL_TEXTURES) addUrl(keep, rel);
  addUrl(keep, POLYHAVEN_MENU_PLATE);

  const mixamoOnDisk = new Set(MIXAMO_CLIP_IDS_ON_DISK);
  for (const clip of MIXAMO_ANIMATION_CATALOG) {
    if (mixamoOnDisk.has(clip.id)) addUrl(keep, clip.publicUrl);
  }

  for (const material of POLYHAVEN_MATERIALS) {
    for (const map of POLYHAVEN_MAPS) {
      for (const scale of TEXTURE_SCALES) {
        addUrl(keep, getPolyHavenMapUrl(material, map, scale));
      }
    }
  }

  return keep;
}

function addGltfSidecars(keep: Set<string>): void {
  const queue = [...keep].filter((rel) => rel.toLowerCase().endsWith('.gltf'));
  const seen = new Set<string>();

  while (queue.length > 0) {
    const rel = queue.pop();
    if (!rel || seen.has(rel)) continue;
    seen.add(rel);

    const full = path.join(DIST, rel);
    if (!existsSync(full)) continue;

    const gltf = JSON.parse(readFileSync(full, 'utf8')) as {
      buffers?: Array<{ uri?: string }>;
      images?: Array<{ uri?: string }>;
    };
    const base = path.dirname(rel);
    const addSidecar = (uri: string | undefined): void => {
      if (!uri || uri.startsWith('data:') || /^(?:https?:)?\/\//.test(uri)) return;
      const sidecar = path.posix
        .normalize(path.posix.join(base.replaceAll('\\', '/'), uri))
        .replace(/^\.\//, '');
      if (!keep.has(sidecar)) keep.add(sidecar);
      if (sidecar.toLowerCase().endsWith('.gltf')) queue.push(sidecar);
    };

    for (const buffer of gltf.buffers ?? []) addSidecar(buffer.uri);
    for (const image of gltf.images ?? []) addSidecar(image.uri);
  }
}

function listFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else out.push(full);
  }
  return out;
}

function removeEmptyDirs(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name));
  }
  if (dir !== DIST && readdirSync(dir).length === 0) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function shouldPreserve(rel: string, keep: Set<string>): boolean {
  if (keep.has(rel)) return true;
  if (PRESERVED_PREFIXES.some((prefix) => rel.startsWith(prefix))) return true;
  const [root] = rel.split('/');
  return !MANAGED_ROOTS.has(root);
}

if (!existsSync(DIST)) {
  console.warn('prune-deploy-assets: dist/ missing, skipping');
  process.exit(0);
}

const keep = collectRuntimePublicPaths();
addGltfSidecars(keep);

let strippedFiles = 0;
let strippedBytes = 0;

for (const file of listFiles(DIST)) {
  const rel = path.relative(DIST, file).replaceAll('\\', '/');
  if (shouldPreserve(rel, keep)) continue;
  const bytes = statSync(file).size;
  rmSync(file, { force: true });
  strippedFiles += 1;
  strippedBytes += bytes;
}

removeEmptyDirs(DIST);

console.log(
  `prune-deploy-assets: kept ${keep.size} runtime paths, stripped ${strippedFiles} files (${formatMb(strippedBytes)})`,
);
