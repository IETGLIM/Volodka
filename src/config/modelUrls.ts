/* ─── Model URL configuration ───
 *
 * CDN / external models base (optional):
 *   VITE_MODELS_BASE=https://cdn.example.com/volodka-models
 *
 * When set at build time, all `/models-external/...` paths are rewritten to
 * `{VITE_MODELS_BASE}/...`. Leave unset for same-origin `/models-external/`.
 *
 * Player model override (dev / A-B art tests):
 *   VITE_DEFAULT_PLAYER_MODEL=/models-external/custom_player.glb
 */

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : ({} as ImportMetaEnv);

/** Trailing slash stripped; empty string = same-origin relative paths. */
const MODELS_BASE = (env.VITE_MODELS_BASE ?? '').replace(/\/$/, '');

/** CC0 Khronos placeholders — replace via art pipeline (see public/basis/README.md, DEPLOY.md). */
export interface ModelUrls {
  volodka: string;
  cc0KhronosCesiumMan: string;
  cc0KhronosRiggedFigure: string;
  cc0KhronosBrainStem: string;
  cc0Michelle: string;
  cc0Soldier: string;
  cc0Xbot: string;
  cc0KhronosFox: string;
  cc0KhronosBoomBox: string;
  cc0KhronosBoxVertexColors: string;
  cc0KhronosAnimatedMorphCube: string;
  cc0KhronosNormalTangentTest: string;
  [key: string]: string;
}

/** Raw same-origin paths — used by validate-gltf-assets and resolveModelUrl. */
export const LOCAL_MODEL_PATHS: ModelUrls = {
  volodka: '/models-external/khronos_cc0_RiggedFigure.glb',
  cc0KhronosCesiumMan: '/models-external/khronos_cc0_CesiumMan.glb',
  cc0KhronosRiggedFigure: '/models-external/khronos_cc0_RiggedFigure.glb',
  cc0KhronosBrainStem: '/models-external/khronos_cc0_BrainStem.glb',
  cc0Michelle: '/models-external/cc0_Michelle.glb',
  cc0Soldier: '/models-external/cc0_Soldier.glb',
  cc0Xbot: '/models-external/cc0_Xbot.glb',
  cc0KhronosFox: '/models-external/khronos_cc0_Fox.glb',
  cc0KhronosBoomBox: '/models-external/khronos_cc0_BoomBox.glb',
  cc0KhronosBoxVertexColors: '/models-external/khronos_cc0_BoxVertexColors.glb',
  cc0KhronosAnimatedMorphCube: '/models-external/khronos_cc0_AnimatedMorphCube.glb',
  cc0KhronosNormalTangentTest: '/models-external/khronos_cc0_NormalTangentTest.glb',
};

/** Canonical fallback when a requested GLB key/path is missing or invalid. */
export const MODEL_FALLBACK_PATH = LOCAL_MODEL_PATHS.cc0KhronosRiggedFigure;

export const DEFAULT_PLAYER_GLB_FILENAME = 'khronos_cc0_CesiumMan.glb';

export function getModelsPublicBase(): string {
  return MODELS_BASE || '/models-external';
}

/**
 * Resolve a public model path — applies CDN base and legacy `/models/` rewrite.
 * Absolute http(s) URLs pass through unchanged.
 */
export function resolveModelUrl(path: string): string {
  if (!path) return resolveModelUrl(MODEL_FALLBACK_PATH);
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = rewriteLegacyModelPath(path);
  if (MODELS_BASE && normalized.startsWith('/models-external/')) {
    const relative = normalized.slice('/models-external'.length);
    return `${MODELS_BASE}${relative}`;
  }
  return normalized;
}

/** Resolved URLs ready for loaders (use this instead of raw LOCAL_MODEL_PATHS in runtime). */
export const MODEL_URLS: ModelUrls = Object.fromEntries(
  Object.entries(LOCAL_MODEL_PATHS).map(([key, url]) => [key, resolveModelUrl(url)]),
) as ModelUrls;

export function getDefaultPlayerModelPath(): string {
  const override = env.VITE_DEFAULT_PLAYER_MODEL?.trim() ?? '';
  if (override) return resolveModelUrl(override);
  return resolveModelUrl(`/models-external/${DEFAULT_PLAYER_GLB_FILENAME}`);
}

export function rewriteLegacyModelPath(path: string): string {
  if (path.startsWith('/models/')) {
    const rewritten = path.replace('/models/', '/models-external/');
    if (rewritten.endsWith('/Volodka.glb') || rewritten.endsWith('Volodka.glb')) {
      return MODEL_FALLBACK_PATH;
    }
    return rewritten;
  }
  return path;
}

export function isValidPlayerGlbPath(path: string): boolean {
  if (!path) return false;
  const ext = path.toLowerCase().split('.').pop();
  return ext === 'glb' || ext === 'gltf';
}

/** Map unknown model keys to a safe fallback URL (never returns empty). */
export function resolveModelUrlWithFallback(path: string): string {
  if (!isValidPlayerGlbPath(path)) return resolveModelUrl(MODEL_FALLBACK_PATH);
  return resolveModelUrl(path);
}
