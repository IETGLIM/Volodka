import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getPlayerVolodkaModelUrl } from '@/config/playerModelUrl';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { fitCharacterGltf, measureCharacterGltfBounds } from '@/engine/assets/gltfScale';
import { usePlayerLocomotionController } from '@/engine/player/usePlayerLocomotionController';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;
const PLAYER_MODEL_URL = getPlayerVolodkaModelUrl();
useGLTF.preload(PLAYER_MODEL_URL, true, true, extendLoader);

// Eagerly preload ALL 6 Mixamo clips at module load so they are ready
// BEFORE the wake-up cutscene starts. useMixamoAnimationClips now marks
// all 6 clips as CRITICAL (bypassing the overlay gate), but the preload
// here ensures the GLB bytes are in the browser HTTP cache so the
// critical-clip loader resolves in ~1-2ms per clip from cache.
// Without this, the wake-up cutscene's 'sleeping' phase (lying in bed)
// and 'sitting' phases (at desk) would fall back to the embedded 'idle'
// clip and the avatar would slide in a standing pose.
const ANIMATIONS_BASE = '/models/animations';
const PLAYER_CRITICAL_ANIM_URLS = [
  `${ANIMATIONS_BASE}/idle.glb`,
  `${ANIMATIONS_BASE}/walking.glb`,
  `${ANIMATIONS_BASE}/talking.glb`,
  `${ANIMATIONS_BASE}/sitting.glb`,
  `${ANIMATIONS_BASE}/sleeping.glb`,
  `${ANIMATIONS_BASE}/working.glb`,
];
if (typeof window !== 'undefined') {
  for (const url of PLAYER_CRITICAL_ANIM_URLS) {
    // useGLTF.preload caches the GLB in drei's suspense cache
    useGLTF.preload(url, true, true, extendLoader);
  }
}

/**
 * Yaw offset for the avatar model. The Volodka hero GLB faces +Z by default
 * (front of the model points toward +Z), but facingYFromDirection assumes
 * humanoid forward = -Z (Three.js convention). Without this offset the avatar
 * walks backwards — facing away from its movement direction. Math.PI flips
 * the model 180° so it faces the direction it walks toward.
 */
const FORWARD_OFFSET = Math.PI;

interface Fit {
  scale: number;
  rotX: number;
  y: number;
}

function CesiumPlayerModelInner({ modelScale, currentAnimRef, rotationRef }: ProceduralPlayerModelProps) {
  const gltf = useGLTF(PLAYER_MODEL_URL, true, true, extendLoader);
  const { scene, mixer, ready } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: true });
  const yawRef = useRef<THREE.Group>(null);
  const [fit, setFit] = useState<Fit>({ scale: 1, rotX: 0, y: 0 });

  // CRITICAL: Measure bounds in a useLayoutEffect BEFORE usePlayerLocomotionController.
  // The locomotion controller's internal useLayoutEffect calls mixer.update(0) which
  // advances the idle animation past frame 0, overriding the bind pose. React runs
  // useLayoutEffects in call order, so placing this BEFORE the locomotion controller
  // ensures we measure the bind-pose skeleton before the mixer touches it.
  // Previously this was a useEffect (runs AFTER all useLayoutEffects) gated on
  // `ready`, which meant mixer.update(0) had already corrupted the bone matrices
  // → bounds.size.y ≈ 8.5m → scale = 0.206 (model 5x too small, invisible at 3m
  // camera distance). (Task 5-A/5-B #1, CRITICAL.)
  useLayoutEffect(() => {
    const bounds = measureCharacterGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      scaleMultiplier: modelScale,
    });

    if (import.meta.env.DEV) {
      console.log('[CesiumPlayerModel] fit:', {
        scale: scale.toFixed(3),
        rotX: rotX.toFixed(3),
        footY: footY.toFixed(3),
        boundsSize: bounds.size.toArray().map((v: number) => v.toFixed(3)),
        boundsMin: bounds.min.toArray().map((v: number) => v.toFixed(3)),
        boundsMax: bounds.max.toArray().map((v: number) => v.toFixed(3)),
        modelScale,
      });
    }

    // Defense-in-depth: if the bounds measurement produced an absurd scale
    // (e.g., model measured as >5m or <0.3m tall), fall back to a safe default.
    const safeScale = scale > 0.3 && scale < 3.0 ? scale : 1.0;
    // footY is the Y offset to place feet at y=0. Do NOT clamp to 0.5 — that
    // sinks models whose origin is >0.5m above the feet (normal for Mixamo rigs).
    const safeFootY = Number.isFinite(footY) ? footY : 0;
    setFit({ scale: safeScale, rotX, y: safeFootY });
  }, [scene, modelScale]);

  const embeddedActions = useMemo(() => {
    if (!mixer) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip, scene);
    }
    return record;
  }, [mixer, gltf.animations, scene]);

  const mixamoActions = useMixamoAnimationClips(mixer, scene, embeddedActions);
  const actions = mixamoActions ?? embeddedActions;

  usePlayerLocomotionController({
    mixer: ready ? mixer : null,
    root: scene,
    animations: gltf.animations,
    actions,
    currentAnimRef,
  });

  useFrameTick('player', () => {
    if (!ready) return;
    if (yawRef.current) yawRef.current.rotation.y = rotationRef.current + FORWARD_OFFSET;
  }, { label: 'PlayerAvatarYaw', phase: 'pre_render' });

  if (!ready) return null;

  return (
    <group ref={yawRef}>
      <group
        rotation={[fit.rotX, 0, 0]}
        position={[0, fit.y, 0]}
        scale={[fit.scale, fit.scale, fit.scale]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Cesium avatar with a procedural fallback while the GLB streams / on error. */
export function CesiumPlayerModel(props: ProceduralPlayerModelProps) {
  return (
    <Suspense fallback={null}>
      <CesiumPlayerModelInner {...props} />
    </Suspense>
  );
}
