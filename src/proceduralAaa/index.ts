/**
 * Procedural AAA pipeline — Unity Assets/Scripts/*.cs → TypeScript/Three.js/Web Audio.
 *
 * | Unity | Volodka |
 * |---|---|
 * | SDF world + Burst | ProceduralSdfWorld (+ worker textures) |
 * | ProceduralCharacter | ProceduralCharacter.tsx |
 * | ComputeShader textures | DynamicTextureGenerator + textureGen.worker |
 * | AAA surface shader | AaaSurfaceShader |
 * | FABRIK | ProceduralFabrikIk |
 * | Volumetrics / LUT | ProceduralAtmosphere |
 * | NAudio | ProceduralSoundscapes |
 * | Scene manager | generateProceduralAaaScene / ProceduralAaaSceneRoot |
 */

export {
  getProceduralAaaParams,
  setProceduralAaaParams,
  resetProceduralAaaParams,
  onProceduralAaaParamsChange,
  isProceduralAaaFlagActive,
  setProceduralAaaFlag,
  resolveTextureSizeForQuality,
  resolveSdfResolutionForQuality,
  resolveParallaxLayersForQuality,
  resolveSoftWorkForQuality,
  DEFAULT_PROCEDURAL_AAA_PARAMS,
  type ProceduralAaaParams,
  type TextureResolutionTier,
} from './params';

export {
  buildSdfWorldGeometry,
  buildSdfWorldLod,
  generateWorldLayout,
  sampleWorldSdf,
  smin,
  smax,
  hardMin,
  hardMax,
  sdArch,
  sdBridge,
} from './ProceduralSdfWorld';
export { ProceduralSdfWorldMesh } from './ProceduralSdfWorldMesh';
export { ProceduralCharacter } from './ProceduralCharacter';
export {
  generateDynamicTexturesSync,
  applyDynamicTexturesToMaterial,
  clearDynamicTextureCache,
  type DynamicTextureKind,
  type DynamicTextureSet,
} from './DynamicTextureGenerator';
export { createAaaSurfaceMaterial, updateAaaSurfaceFromParams, ensureTangents } from './AaaSurfaceShader';
export {
  solveFabrik,
  updateWalkCycle,
  createWalkState,
  createChain,
  raycastGroundY,
  updateIdleBreathe,
} from './ProceduralFabrikIk';
export {
  applyHeightDistanceFog,
  buildAtmosphereState,
  computeAutoLutTarget,
  createVolumetricRayPlanes,
} from './ProceduralAtmosphere';
export { ProceduralAtmosphereLayer } from './ProceduralAtmosphereLayer';
export { createProceduralSoundscape, renderOfflineAmbience } from './ProceduralSoundscapes';
export {
  generateProceduralAaaScene,
  ProceduralAaaSceneRoot,
  onProceduralAaaRegenerate,
  getProceduralAaaGenerationKey,
} from './ProceduralAaaManager';
export { ProceduralAaaHybridOverlay } from './ProceduralAaaHybridOverlay';
export { ProceduralAaaGlbLandmarks, StreetHybridGlbLandmarks } from './HybridGlbLandmarks';
export { ProceduralAaaTweakPanel } from './ProceduralAaaTweakPanel';
