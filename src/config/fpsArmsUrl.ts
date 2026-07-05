import { ASSET_MANIFEST } from './assetManifest';

const FALLBACK = '/models/fps/fps_arms.glb';

/** Canonical first-person arms GLB — asset manifest entry. */
export const FPS_ARMS_URL = ASSET_MANIFEST.fps_arms?.lods[0]?.url ?? FALLBACK;
