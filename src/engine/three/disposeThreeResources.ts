import { AnimationMixer, BufferGeometry, InstancedMesh, Light, Line, LineSegments, Material, Mesh, Object3D, Points, Scene, ShaderMaterial, Skeleton, SkinnedMesh, Sprite, Texture, WebGLRenderer, WebGLShadowMap } from 'three';
import { isRegistryManagedGeometry } from '@/engine/three/moduleGeometryRegistry';
import { isRegistryManagedMaterial } from '@/engine/three/moduleMaterialRegistry';

/** Texture-bearing keys on MeshStandardMaterial and kin (Three r152+). */
const MATERIAL_TEXTURE_KEYS = [
  'map',
  'lightMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'normalMap',
  'displacementMap',
  'roughnessMap',
  'metalnessMap',
  'alphaMap',
  'envMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'specularMap',
  'specularColorMap',
  'specularIntensityMap',
  'transmissionMap',
  'thicknessMap',
  'anisotropyMap',
] as const;

export interface DisposeThreeSkipSets {
  geometries?: ReadonlySet<BufferGeometry>;
  materials?: ReadonlySet<Material>;
  textures?: ReadonlySet<Texture>;
}

export interface DisposeThreeOptions {
  /** Shared module-level assets — never disposed (procedural NPC/player caches). */
  skip?: DisposeThreeSkipSets;
  /** Dispose textures referenced by materials (default true). */
  disposeTextures?: boolean;
  /** Dispose light shadow map textures (default true). */
  disposeShadowMaps?: boolean;
}

interface DisposeContext {
  skip: DisposeThreeSkipSets;
  disposeTextures: boolean;
  disposeShadowMaps: boolean;
  disposedGeometries: Set<BufferGeometry>;
  disposedMaterials: Set<Material>;
  disposedTextures: Set<Texture>;
  disposedSkeletons: Set<Skeleton>;
}

function createContext(options?: DisposeThreeOptions): DisposeContext {
  return {
    skip: options?.skip ?? {},
    disposeTextures: options?.disposeTextures !== false,
    disposeShadowMaps: options?.disposeShadowMaps !== false,
    disposedGeometries: new Set(),
    disposedMaterials: new Set(),
    disposedTextures: new Set(),
    disposedSkeletons: new Set(),
  };
}

function shouldSkipGeometry(ctx: DisposeContext, geometry: BufferGeometry): boolean {
  return (ctx.skip.geometries?.has(geometry) ?? false) || isRegistryManagedGeometry(geometry);
}

function shouldSkipMaterial(ctx: DisposeContext, material: Material): boolean {
  return (ctx.skip.materials?.has(material) ?? false) || isRegistryManagedMaterial(material);
}

function shouldSkipTexture(ctx: DisposeContext, texture: Texture): boolean {
  return ctx.skip.textures?.has(texture) ?? false;
}

function disposeTexture(ctx: DisposeContext, texture: Texture | null | undefined): void {
  if (!texture || !ctx.disposeTextures) return;
  if (shouldSkipTexture(ctx, texture)) return;
  if (ctx.disposedTextures.has(texture)) return;
  ctx.disposedTextures.add(texture);
  texture.dispose();
}

function disposeMaterialTextures(ctx: DisposeContext, material: Material): void {
  if (!ctx.disposeTextures) return;

  for (const key of MATERIAL_TEXTURE_KEYS) {
    const tex = (material as Material & Record<string, unknown>)[key];
    if (tex instanceof Texture) {
      disposeTexture(ctx, tex);
    }
  }

  if (material instanceof ShaderMaterial) {
    for (const uniform of Object.values(material.uniforms)) {
      const value = uniform?.value;
      if (value instanceof Texture) {
        disposeTexture(ctx, value);
      }
    }
  }
}

function disposeMaterial(ctx: DisposeContext, material: Material | Material[] | undefined): void {
  if (!material) return;

  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    if (shouldSkipMaterial(ctx, mat)) continue;
    if (ctx.disposedMaterials.has(mat)) continue;
    ctx.disposedMaterials.add(mat);
    disposeMaterialTextures(ctx, mat);
    mat.dispose();
  }
}

function disposeGeometry(ctx: DisposeContext, geometry: BufferGeometry | undefined): void {
  if (!geometry) return;
  if (shouldSkipGeometry(ctx, geometry)) return;
  if (ctx.disposedGeometries.has(geometry)) return;
  ctx.disposedGeometries.add(geometry);
  geometry.dispose();
}

function disposeShadowMap(ctx: DisposeContext, object: Object3D): void {
  if (!ctx.disposeShadowMaps) return;

  const light = object as Light;
  const shadow = light.shadow;
  const shadowMap = shadow?.map;
  if (!shadow || !shadowMap) return;
  if (shadowMap instanceof Texture) {
    disposeTexture(ctx, shadowMap);
  } else {
    if (shadowMap.texture) disposeTexture(ctx, shadowMap.texture);
    shadowMap.dispose();
  }
  shadow.map = null;
}

function disposeSkeleton(ctx: DisposeContext, skeleton: Skeleton | null | undefined): void {
  if (!skeleton || ctx.disposedSkeletons.has(skeleton)) return;
  ctx.disposedSkeletons.add(skeleton);
  if (skeleton.boneTexture) {
    disposeTexture(ctx, skeleton.boneTexture);
    skeleton.boneTexture = null;
  }
}

function disposeSkinnedMeshExtras(ctx: DisposeContext, mesh: SkinnedMesh): void {
  disposeSkeleton(ctx, mesh.skeleton);
  // Do NOT assign null. three WebGLObjects.update() calls skeleton.update() with
  // no null guard; EffectComposer/RenderPass can still visit the mesh for one
  // more frame after dispose → "Cannot read properties of null (reading 'update')".
  mesh.skeleton = new Skeleton([]);
  mesh.bindMatrix.identity();
  mesh.visible = false;
}

function disposeDrawable(
  ctx: DisposeContext,
  object: Object3D & {
    geometry?: BufferGeometry;
    material?: Material | Material[];
    skeleton?: Skeleton;
  },
): void {
  disposeGeometry(ctx, object.geometry);
  disposeMaterial(ctx, object.material);

  if (object instanceof SkinnedMesh) {
    disposeSkinnedMeshExtras(ctx, object);
  }
}

/** Stop and uncache an AnimationMixer (call before disposing its root scene). */
export function disposeAnimationMixer(mixer: AnimationMixer | null | undefined): void {
  if (!mixer) return;
  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
}

/** Dispose GPU resources under `root` (geometries, materials, textures, shadow maps). */
export function disposeObject3DTree(
  root: Object3D | null | undefined,
  options?: DisposeThreeOptions,
): void {
  if (!root) return;

  const ctx = createContext(options);

  root.traverse((child) => {
    disposeShadowMap(ctx, child);

    if (
      child instanceof Mesh
      || child instanceof SkinnedMesh
      || child instanceof InstancedMesh
      || child instanceof Points
      || child instanceof Line
      || child instanceof LineSegments
      || child instanceof Sprite
    ) {
      disposeDrawable(ctx, child);
    }
  });
}

/**
 * Build a skip-set of GPU resources (geometries, materials, textures) referenced
 * by a source scene — typically the cached `useGLTF` root. When disposing a
 * shallow clone (one produced via `Object3D.clone(true)` or
 * `deepCloneWithSkeletons`), the clone's meshes share geometry/material/texture
 * references with the cached source. Disposing the clone would corrupt the
 * cache and cause shader recompiles + GPU re-uploads on the next scene visit.
 *
 * Pass the returned object as `options.skip` to `disposeClonedScene` to dispose
 * ONLY resources unique to the clone (e.g., procedurally-added materials).
 */
export function createSourceSkipSet(sourceScene: Object3D | null | undefined): DisposeThreeSkipSets {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  if (!sourceScene) return { geometries, materials, textures };

  sourceScene.traverse((child) => {
    const mesh = child as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        materials.add(mat);
        for (const key of MATERIAL_TEXTURE_KEYS) {
          const tex = (mat as Material & Record<string, unknown>)[key];
          if (tex instanceof Texture) textures.add(tex);
        }
        if (mat instanceof ShaderMaterial) {
          for (const uniform of Object.values(mat.uniforms)) {
            const value = (uniform as { value?: unknown } | undefined)?.value;
            if (value instanceof Texture) textures.add(value);
          }
        }
      }
    }
  });

  return { geometries, materials, textures };
}

/** Dispose a cloned GLTF scene (never the cached loader root). */
export function disposeClonedScene(scene: Object3D, options?: DisposeThreeOptions): void {
  disposeObject3DTree(scene, options);
}

/** Dispose a deepCloneWithSkeletons instance — meshes, skeleton bone textures, materials. */
export function disposeSkinnedClone(
  scene: Object3D,
  mixer?: AnimationMixer | null,
  options?: DisposeThreeOptions,
): void {
  disposeAnimationMixer(mixer);
  disposeClonedScene(scene, options);
}

/** Marks composer instances we already tore down (idempotent dispose). */
const EFFECT_COMPOSER_DISPOSED = Symbol('volodkaEffectComposerDisposed');

export interface PostprocessingComposerLike {
  dispose?: () => void;
  removeAllPasses?: () => void;
  removePass?: (pass: { dispose?: () => void }) => void;
  passes?: Array<{ dispose?: () => void }>;
}

function disposeComposerPasses(composer: PostprocessingComposerLike): void {
  if (!Array.isArray(composer.passes)) return;

  const snapshot = [...composer.passes];
  for (const pass of snapshot) {
    try {
      composer.removePass?.(pass);
    } catch {
      // Pass may already be detached by @react-three/postprocessing.
    }
    try {
      pass?.dispose?.();
    } catch {
      // Best-effort pass teardown.
    }
  }

  try {
    composer.removeAllPasses?.();
  } catch {
    composer.passes.length = 0;
  }
}

function isEffectComposerDisposed(composer: PostprocessingComposerLike): boolean {
  return (composer as Record<symbol, boolean>)[EFFECT_COMPOSER_DISPOSED] === true;
}

function markEffectComposerDisposed(composer: PostprocessingComposerLike): void {
  (composer as Record<symbol, boolean>)[EFFECT_COMPOSER_DISPOSED] = true;
}

/**
 * postprocessing EffectComposer + pass render targets.
 *
 * Removes and disposes every pass before composer.dispose() — required because
 * @react-three/postprocessing never calls dispose() and removeAllPasses() alone
 * does not free pass GPU resources.
 */
export function disposeEffectComposer(
  composer: PostprocessingComposerLike | null | undefined,
): void {
  if (!composer || isEffectComposerDisposed(composer)) return;

  markEffectComposerDisposed(composer);
  disposeComposerPasses(composer);

  try {
    composer.dispose?.();
  } catch {
    // disposeComposerPasses already ran per-pass cleanup.
  }
}

/** Release shadow map RTs on lights and internal shadowMap state when available. */
export function disposeRendererShadowMaps(
  renderer: WebGLRenderer,
  scene?: Scene | null,
): void {
  const shadowMapApi = renderer.shadowMap as WebGLShadowMap & { dispose?: () => void };
  if (typeof shadowMapApi.dispose === 'function') {
    shadowMapApi.dispose();
  }

  if (scene) {
    scene.traverse((child) => {
      const light = child as Light;
      const shadow = light.shadow;
      const map = shadow?.map;
      if (!shadow || !map) return;

      if ('dispose' in map && typeof map.dispose === 'function') {
        map.dispose();
      }
      shadow.map = null;
    });
  }

  renderer.shadowMap.needsUpdate = true;
}

/**
 * Component-owned (non-registry) GPU resources — clones, canvas atlases, etc.
 * Module shared caches must use sceneGpuOwnership + releaseSceneGpuOnUnload instead.
 */
export function disposeEphemeralGpuResources(
  ...resources: Array<{ dispose: () => void } | null | undefined>
): void {
  for (const resource of resources) {
    try {
      resource?.dispose();
    } catch {
      // Already freed or context lost — ignore.
    }
  }
}
