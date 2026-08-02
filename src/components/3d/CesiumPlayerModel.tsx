import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getPlayerVolodkaModelUrl } from '@/config/playerModelUrl';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { fitCharacterGltf, measureCharacterGltfBounds } from '@/engine/assets/gltfScale';
import { usePlayerLocomotionController } from '@/engine/player/usePlayerLocomotionController';
import { deplasticizeCharacterMaterials } from '@/engine/graphics/materials/deplasticizeCharacterMaterials';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';
import { ProceduralPlayerModelLite } from './ProceduralPlayerModelLite';
import { ProceduralAviatorGlasses } from './sceneVisuals/volodkaRoom/AviatorGlasses';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;
const PLAYER_MODEL_URL = getPlayerVolodkaModelUrl();
useGLTF.preload(PLAYER_MODEL_URL, true, true, extendLoader);

const ANIMATIONS_BASE = '/models/animations';
/** Critical clips only — talking/working deferred to cut load hitch on New Game wake. */
const PLAYER_CRITICAL_ANIM_URLS = [
  `${ANIMATIONS_BASE}/idle.glb`,
  `${ANIMATIONS_BASE}/walking.glb`,
  `${ANIMATIONS_BASE}/sitting.glb`,
  `${ANIMATIONS_BASE}/sleeping.glb`,
];
const PLAYER_DEFERRED_ANIM_URLS = [
  `${ANIMATIONS_BASE}/talking.glb`,
  `${ANIMATIONS_BASE}/working.glb`,
];
if (typeof window !== 'undefined') {
  for (const url of PLAYER_CRITICAL_ANIM_URLS) {
    useGLTF.preload(url, true, true, extendLoader);
  }
  // Defer secondary clips off the first wake frame.
  queueMicrotask(() => {
    for (const url of PLAYER_DEFERRED_ANIM_URLS) {
      useGLTF.preload(url, true, true, extendLoader);
    }
  });
}

/**
 * Yaw for the avatar model. The Volodka hero GLB and procedural lite both face
 * +Z at rotation.y = 0. Movement / camera write `livePlayerRotationRef` as
 * `atan2(moveDir.x, moveDir.z)` — the world yaw that aims +Z toward the move
 * direction. Do NOT add π here: that double-flipped the GLB vs ProceduralLite
 * and made WASD look like moonwalking (спиной).
 */
const FORWARD_OFFSET = 0;

interface Fit {
  scale: number;
  rotX: number;
  y: number;
}

interface CesiumPlayerModelInnerProps extends ProceduralPlayerModelProps {
  onReadyChange?: (ready: boolean) => void;
}

function CesiumPlayerModelInner({
  modelScale,
  currentAnimRef,
  rotationRef,
  onReadyChange,
}: CesiumPlayerModelInnerProps) {
  const { preset } = useGraphicsQuality();
  const gltf = useGLTF(PLAYER_MODEL_URL, true, true, extendLoader);
  const { scene, mixer, ready } = useSkinnedGltfClone(gltf.scene, gltf.animations, {
    castShadow: preset.shadows,
  });
  const yawRef = useRef<THREE.Group>(null);
  const [fit, setFit] = useState<Fit>({ scale: 1, rotX: 0, y: 0 });

  useEffect(() => {
    onReadyChange?.(ready);
    return () => onReadyChange?.(false);
  }, [ready, onReadyChange]);

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

    const safeScale = scale > 0.3 && scale < 3.0 ? scale : 1.0;
    const safeFootY = Number.isFinite(footY) ? footY : 0;
    setFit({ scale: safeScale, rotX, y: safeFootY });
  }, [scene, modelScale]);

  useLayoutEffect(() => {
    deplasticizeCharacterMaterials(scene, {
      envMapIntensity: 0.58,
      minRoughness: 0.6,
      roughnessMul: 1.32,
      maxMetalness: 0.16,
    });
  }, [scene]);

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

  // Stay mounted (invisible) while mixer warms — parent keeps lite silhouette.
  if (!ready) return null;

  return (
    <group ref={yawRef}>
      <group
        rotation={[fit.rotX, 0, 0]}
        position={[0, fit.y, 0]}
        scale={[fit.scale, fit.scale, fit.scale]}
      >
        <primitive object={scene} />
        {/* Approx head height in character metres — GLB may lack a Head bone name. */}
        <group position={[0, 1.62, 0.08]} scale={1 / Math.max(fit.scale, 0.001)}>
          <ProceduralAviatorGlasses />
        </group>
      </group>
    </group>
  );
}

/** Cesium avatar with a lite procedural fallback while the GLB streams.
 *  Keeps the lite silhouette until the skinned clone is ready — avoids the
 *  mobile flash where Suspense resolves → null → GLB pop-in.
 */
export function CesiumPlayerModel(props: ProceduralPlayerModelProps) {
  const [glbReady, setGlbReady] = useState(false);

  return (
    <group>
      {!glbReady && <ProceduralPlayerModelLite {...props} />}
      <Suspense fallback={null}>
        <CesiumPlayerModelInner {...props} onReadyChange={setGlbReady} />
      </Suspense>
    </group>
  );
}
