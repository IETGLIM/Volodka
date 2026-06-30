import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

// Eagerly preload Mixamo walk + idle clips at module load so they are ready
// BEFORE the wake-up cutscene starts. useMixamoAnimationClips loads clips
// asynchronously via scheduleGltfPreload, which is paused while UI overlays
// are open (isUiOverlayBlockingDeferredAssets). During the wake-up cutscene
// the story overlay is open → clip loading is paused → the walk clip is not
// available when the 'walking' phase starts → the avatar slides in idle pose.
// Preloading here ensures the GLB is in the browser cache; useMixamoAnimationClips
// then resolves from cache instantly without waiting for the scheduler.
const ANIMATIONS_BASE = '/models/animations';
const PLAYER_CRITICAL_ANIM_URLS = [
  `${ANIMATIONS_BASE}/idle.glb`,
  `${ANIMATIONS_BASE}/walking.glb`,
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

  useEffect(() => {
    if (!ready) return;
    const bounds = measureCharacterGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      scaleMultiplier: modelScale,
    });
    setFit({ scale, rotX, y: footY });
  }, [scene, modelScale, ready]);

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
