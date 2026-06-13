/* ─── Model URL configuration ─── */
const MODELS_BASE = import.meta.env?.VITE_MODELS_BASE ?? '';

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

export const MODEL_URLS: ModelUrls = {
  volodka: '/models-external/khronos_cc0_RiggedFigure.glb',
  cc0KhronosCesiumMan: '/models-external/khronos_cc0_CesiumMan.glb',
  cc0KhronosRiggedFigure: '/models-external/khronos_cc0_RiggedFigure.glb',
  cc0KhronosBrainStem: '/models-external/khronos_cc0_BrainStem.glb',
  cc0Michelle: '/models-external/cc0_Michelle.glb',
  cc0Soldier: '/models-external/cc0_Soldier.glb',
  cc0Xbot: '/models-external/cc0_Xbot.glb',
  cc0KhronosFox: '/models-external/khronos_cc0_Fox.glb',
  // Stand-ins (files not in repo, point to Fox)
  cc0KhronosBoomBox: '/models-external/khronos_cc0_Fox.glb',
  cc0KhronosBoxVertexColors: '/models-external/khronos_cc0_Fox.glb',
  cc0KhronosAnimatedMorphCube: '/models-external/khronos_cc0_Fox.glb',
  cc0KhronosNormalTangentTest: '/models-external/khronos_cc0_Fox.glb',
};

export const DEFAULT_PLAYER_GLB_FILENAME = 'khronos_cc0_CesiumMan.glb';

export function getDefaultPlayerModelPath(): string {
  const override = (typeof process !== 'undefined' && process.env?.VITE_DEFAULT_PLAYER_MODEL) || '';
  if (override) return override;
  return `/models-external/${DEFAULT_PLAYER_GLB_FILENAME}`;
}

export function getModelsPublicBase(): string {
  return MODELS_BASE || '/models-external';
}

export function rewriteLegacyModelPath(path: string): string {
  // /models/... → /models-external/...
  if (path.startsWith('/models/')) {
    const rewritten = path.replace('/models/', '/models-external/');
    // Redirect old Volodka.glb
    if (rewritten.endsWith('/Volodka.glb') || rewritten.endsWith('Volodka.glb')) {
      return '/models-external/khronos_cc0_RiggedFigure.glb';
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
