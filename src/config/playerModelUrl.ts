/** Canonical shipped player GLB — asset manifest LOD0. */
import { getAssetDefinition } from './assetManifest';

const FALLBACK = '/models/characters/volodka/volodka_lod0.glb';

export function getPlayerVolodkaModelUrl(): string {
  return getAssetDefinition('player_volodka')?.lods[0]?.url ?? FALLBACK;
}
