'use client';

/* ─── Volodka RPG – Cascaded Shadow Maps (CSM) ───
 *  Improves outdoor shadow quality at distance by adding two shadow-only
 *  directional lights that cover mid (15-35m) and far (35-60m) ranges.
 *
 *  The main directional light in Lighting.tsx handles near-range (0-15m)
 *  shadows.  These cascade lights are intensity=0 — they only contribute
 *  shadow darkening, not illumination.
 *
 *  Gated on quality preset >= 'high', desktop only, outdoor scenes only.
 *  Uses the canonical shadow bias constants from Lighting.tsx.
 */

import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useThree } from '@react-three/fiber';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { CANONICAL_SHADOW_BIAS, CANONICAL_SHADOW_NORMAL_BIAS } from './Lighting';
import { DirectionalLight, Scene, Vector3 } from 'three';

/** Per-cascade configuration */
interface CascadeConfig {
  /** Shadow map resolution (square, in pixels) */
  mapSize: number;
  /** Orthographic frustum half-extent in meters */
  halfExtent: number;
  /** Shadow camera near clipping plane */
  camNear: number;
  /** Shadow camera far clipping plane */
  camFar: number;
}

/**
 * Cascade definitions for outdoor CSM.
 *  - Cascade 0 (0-15m) is handled by the main directional light in Lighting.tsx.
 *  - Cascade 1 (15-35m): 2048px map, tighter frustum for mid-range detail.
 *  - Cascade 2 (35-60m): 1024px map, wider frustum for far-range coverage.
 */
const CASCADE_CONFIGS: CascadeConfig[] = [
  { mapSize: 2048, halfExtent: 22, camNear: 0.5, camFar: 50 },
  { mapSize: 1024, halfExtent: 38, camNear: 0.5, camFar: 80 },
];

/** CSM requires 'high' or 'ultra' quality preset */
function isQualityAtLeastHigh(presetId: string): boolean {
  return presetId === 'high' || presetId === 'ultra';
}

/**
 * Cascaded Shadow Maps — two additional shadow-only directional lights
 * that follow the player for improved shadow quality at mid/far distances.
 * Only active in outdoor scenes, gated on quality >= 'high', desktop only.
 */
export function CascadedShadowMaps() {
  const isMobile = useIsMobileVisual();
  const { preset } = useGraphicsQuality();

  // Skip CSM on mobile or if quality / shadows are insufficient
  if (isMobile || !isQualityAtLeastHigh(preset.id) || !preset.shadows) return null;

  return (
    <>
      {CASCADE_CONFIGS.map((cfg, i) => (
        <CascadeShadowLight key={i} config={cfg} />
      ))}
    </>
  );
}

/**
 * Single cascade shadow light — follows the player each frame and
 * syncs its world-space direction with the main directional light.
 */
function CascadeShadowLight({ config }: { config: CascadeConfig }) {
  const lightRef = useRef<DirectionalLight>(null);
  const { scene } = useThree();
  const tmpVec = useRef(new Vector3());

  useFrameTick('misc', ({ game }) => {
    const light = lightRef.current;
    if (!light) return;

    // Find main directional light to sync sun direction
    const mainDir = findMainDirectionalLight(scene);
    if (!mainDir) return;

    // Copy light position so the cascade matches the sun angle
    light.position.copy(mainDir.position);

    // Shadow camera frustum setup
    const shadow = light.shadow;
    const cam = shadow.camera;
    const [px, , pz] = game.playerPosition;

    // Light direction for camera offset
    const lightDir = tmpVec.current
      .set(mainDir.position.x, mainDir.position.y, mainDir.position.z)
      .normalize();

    // Position shadow camera along light direction, centered on player
    const midDist = (config.camNear + config.camFar) * 0.5;
    cam.position.set(
      px - lightDir.x * midDist,
      mainDir.position.y,
      pz - lightDir.z * midDist,
    );

    // Orthographic frustum bounds
    cam.near = config.camNear;
    cam.far = config.camFar;
    cam.left = -config.halfExtent;
    cam.right = config.halfExtent;
    cam.top = config.halfExtent;
    cam.bottom = -config.halfExtent;

    // Target the light at the player's ground position
    light.target.position.set(px, 0, pz);
    light.target.updateMatrixWorld();

    cam.updateProjectionMatrix();
    shadow.updateMatrices(light);
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={0}
      castShadow
      shadow-mapSize-width={config.mapSize}
      shadow-mapSize-height={config.mapSize}
      shadow-camera-near={config.camNear}
      shadow-camera-far={config.camFar}
      shadow-camera-left={-config.halfExtent}
      shadow-camera-right={config.halfExtent}
      shadow-camera-top={config.halfExtent}
      shadow-camera-bottom={-config.halfExtent}
      shadow-bias={CANONICAL_SHADOW_BIAS}
      shadow-normalBias={CANONICAL_SHADOW_NORMAL_BIAS}
    />
  );
}

/** Find the first directional light with intensity > 0 (the main sun light) */
function findMainDirectionalLight(scene: Scene): DirectionalLight | null {
  for (const obj of scene.children) {
    if (obj instanceof DirectionalLight && obj.intensity > 0) {
      return obj;
    }
  }
  return null;
}
