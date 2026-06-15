/* ─── Model URL configuration ─── */
const MODELS_BASE = import.meta.env?.VITE_MODELS_BASE ?? '';
const KHRONOS = '/models/khronos';

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
  volodka: `${KHRONOS}/RiggedFigure.glb`,
  cc0KhronosCesiumMan: `${KHRONOS}/CesiumMan.glb`,
  cc0KhronosRiggedFigure: `${KHRONOS}/RiggedFigure.glb`,
  cc0KhronosBrainStem: `${KHRONOS}/BrainStem.glb`,
  cc0Michelle: `${KHRONOS}/RiggedSimple.glb`,
  cc0Soldier: `${KHRONOS}/Soldier.glb`,
  cc0Xbot: `${KHRONOS}/RiggedSimple.glb`,
  cc0KhronosFox: `${KHRONOS}/Fox.glb`,
  cc0KhronosBoomBox: `${KHRONOS}/Fox.glb`,
  cc0KhronosBoxVertexColors: `${KHRONOS}/Fox.glb`,
  cc0KhronosAnimatedMorphCube: `${KHRONOS}/Fox.glb`,
  cc0KhronosNormalTangentTest: `${KHRONOS}/Fox.glb`,
};

export const DEFAULT_PLAYER_GLB_FILENAME = 'CesiumMan.glb';

export function getDefaultPlayerModelPath(): string {
  const override = import.meta.env?.VITE_DEFAULT_PLAYER_MODEL ?? '';
  if (override) return override;
  return `${KHRONOS}/${DEFAULT_PLAYER_GLB_FILENAME}`;
}

export function getModelsPublicBase(): string {
  return MODELS_BASE || '/models';
}

export function rewriteLegacyModelPath(path: string): string {
  if (path.startsWith('/models-external/')) {
    return path.replace('/models-external/', `${KHRONOS}/`);
  }
  if (path.startsWith('/models/')) {
    if (path.endsWith('/Volodka.glb') || path.endsWith('Volodka.glb')) {
      return `${KHRONOS}/RiggedFigure.glb`;
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
