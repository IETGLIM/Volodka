/** Canonical shipped player GLB — single source: ASSET_MANIFEST.player_volodka. */
import { getAssetDefinition, getAssetLod0Url } from './assetManifest';

export const PLAYER_VOLODKA_MANIFEST_ID = 'player_volodka' as const;

const FALLBACK_LOD0 = '/models/characters/volodka/volodka_lod0.glb';

/** Runtime player mesh URL (LOD0 / best available). */
export function getPlayerVolodkaModelUrl(): string {
  return getAssetLod0Url(PLAYER_VOLODKA_MANIFEST_ID) ?? FALLBACK_LOD0;
}

/** Full LOD + compression variant URLs from the manifest (preload / RPM bridge). */
export function getPlayerVolodkaManifestUrls(): readonly string[] {
  const def = getAssetDefinition(PLAYER_VOLODKA_MANIFEST_ID);
  if (!def) return [FALLBACK_LOD0];
  const urls = new Set<string>();
  for (const lod of def.lods) urls.add(lod.url);
  if (def.variants) {
    for (const url of Object.values(def.variants)) {
      if (url) urls.add(url);
    }
  }
  return [...urls];
}

export function getDefaultPlayerGlbFilename(): string {
  const url = getPlayerVolodkaModelUrl();
  const slash = url.lastIndexOf('/');
  return slash >= 0 ? url.slice(slash + 1) : 'volodka_lod0.glb';
}
