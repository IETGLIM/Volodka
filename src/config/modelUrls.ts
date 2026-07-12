/* ─── Model URL configuration ─── */
const MODELS_BASE = import.meta.env?.VITE_MODELS_BASE ?? '';

export interface ModelUrls {
  volodka: string;
  [key: string]: string;
}

export const MODEL_URLS: ModelUrls = {
  volodka: '/models/characters/volodka/volodka_lod0.glb',
};

export const DEFAULT_PLAYER_GLB_FILENAME = 'volodka_lod0.glb';

export function getDefaultPlayerModelPath(): string {
  const override = import.meta.env?.VITE_DEFAULT_PLAYER_MODEL ?? '';
  if (override) return override;
  return '/models/characters/volodka/volodka_lod0.glb';
}

export function getModelsPublicBase(): string {
  return MODELS_BASE || '/models';
}

export function rewriteLegacyModelPath(path: string): string {
  // Legacy Khronos placeholder paths are no longer shipped — redirect to the
  // canonical Volodka model so old saves / dev configs don't 404.
  if (path.startsWith('/models-external/')) {
    return '/models/characters/volodka/volodka_lod0.glb';
  }
  if (path.startsWith('/models/')) {
    if (path.endsWith('/Volodka.glb') || path.endsWith('Volodka.glb')) {
      return '/models/characters/volodka/volodka_lod0.glb';
    }
    return path;
  }
  return path;
}

export function isValidPlayerGlbPath(path: string): boolean {
  if (!path) return false;
  const ext = path.toLowerCase().split('.').pop();
  return ext === 'glb' || ext === 'gltf';
}
