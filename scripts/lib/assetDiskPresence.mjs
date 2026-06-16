import { closeSync, existsSync, openSync, readSync } from 'node:fs';
import path from 'node:path';

/** Binary glTF magic = ASCII "glTF". Text GLTF (JSON) starts with "{". */
export function hasGltfMagic(filePath) {
  const fd = openSync(filePath, 'r');
  const buf = Buffer.alloc(4);
  try {
    readSync(fd, buf, 0, 4, 0);
  } finally {
    closeSync(fd);
  }
  const head = buf.toString('ascii');
  return head === 'glTF' || head.trimStart().startsWith('{');
}

export function resolvePublicPath(root, url) {
  if (!url.startsWith('/')) return null;
  return path.join(root, 'public', url.replace(/^\//, ''));
}

export function isGlbPresentOnDisk(root, url) {
  const file = resolvePublicPath(root, url);
  if (!file || !existsSync(file)) return false;
  if (url.toLowerCase().endsWith('.glb')) return hasGltfMagic(file);
  return true;
}

/** True when every manifest-referenced URL for an asset exists and looks valid. */
export function isManifestAssetPresentOnDisk(root, asset) {
  for (const lod of asset.lods) {
    if (!isGlbPresentOnDisk(root, lod.url)) return false;
  }
  if (asset.variants) {
    for (const url of Object.values(asset.variants)) {
      if (url && !isGlbPresentOnDisk(root, url)) return false;
    }
  }
  if (asset.impostor?.url && !isGlbPresentOnDisk(root, asset.impostor.url)) return false;
  if (asset.bakedLightmap && !isGlbPresentOnDisk(root, asset.bakedLightmap)) return false;
  return true;
}
