import { Suspense, useEffect, useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_URLS } from '@/config/modelUrls';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { resolveLocomotionClipState } from '@/engine/player/playerLocomotionPresentation';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';
useGLTF.preload(MODEL_URLS.cc0KhronosCesiumMan);

/** Target avatar height (metres) at modelScale = 1. */
const TARGET_HEIGHT = 1.7;
/** Flip to Math.PI if the avatar faces backwards while walking. */
const FORWARD_OFFSET = 0;
const CLIP_CROSSFADE_SEC = 0.2;

interface Fit {
  scale: number;
  rotX: number;
  y: number;
}

function measure(obj: THREE.Object3D): { size: THREE.Vector3; min: THREE.Vector3 } {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  if (!box.isEmpty()) box.getSize(size);
  return { size, min: box.min.clone() };
}

function CesiumPlayerModelInner({ modelScale, currentAnimRef, rotationRef }: ProceduralPlayerModelProps) {
  const gltf = useGLTF(MODEL_URLS.cc0KhronosCesiumMan);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: true });
  const yawRef = useRef<THREE.Group>(null);
  const fitRef = useRef<THREE.Group>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const prevRunWeightRef = useRef(0);
  const [fit, setFit] = useState<Fit>({ scale: 1.1, rotX: 0, y: 0 });

  useEffect(() => {
    if (!mixer || gltf.animations.length === 0) {
      walkActionRef.current = null;
      runActionRef.current = null;
      return;
    }

    for (const action of [walkActionRef.current, runActionRef.current]) {
      if (action) {
        action.stop();
        mixer.uncacheClip(action.getClip());
      }
    }
    walkActionRef.current = null;
    runActionRef.current = null;

    const walkClip =
      gltf.animations.find((c) => /walk/i.test(c.name)) ?? gltf.animations[0];
    const runClip = gltf.animations.find((c) => /run/i.test(c.name) && c !== walkClip);

    const walkAction = mixer.clipAction(walkClip);
    walkAction.setLoop(THREE.LoopRepeat, Infinity);
    walkAction.play();
    walkActionRef.current = walkAction;

    if (runClip) {
      const runAction = mixer.clipAction(runClip);
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      runAction.play();
      runAction.setEffectiveWeight(0);
      runActionRef.current = runAction;
    }

    return () => {
      walkAction.stop();
      mixer.uncacheClip(walkClip);
      if (runClip && runActionRef.current) {
        runActionRef.current.stop();
        mixer.uncacheClip(runClip);
      }
      walkActionRef.current = null;
      runActionRef.current = null;
    };
  }, [mixer, gltf.animations]);

  useEffect(() => {
    const inner = fitRef.current;
    if (!inner) return;
    inner.rotation.set(0, 0, 0);
    inner.scale.set(1, 1, 1);
    inner.position.set(0, 0, 0);

    const { size } = measure(scene);
    let rotX = 0;
    let heightDim = size.y;
    if (size.z > size.y * 1.15) {
      rotX = -Math.PI / 2;
      heightDim = size.z;
    }
    if (!isFinite(heightDim) || heightDim < 0.2) heightDim = 1.5;
    const scale = TARGET_HEIGHT / heightDim;

    inner.rotation.x = rotX;
    inner.scale.setScalar(scale);
    const { min } = measure(scene);
    const y = isFinite(min.y) ? -min.y : 0;

    setFit({ scale, rotX, y });
  }, [scene]);

  useFrameTick('player', ({ delta }) => {
    if (yawRef.current) yawRef.current.rotation.y = rotationRef.current + FORWARD_OFFSET;
    if (!mixer) return;

    const clipState = resolveLocomotionClipState(currentAnimRef.current);
    const walkAction = walkActionRef.current;
    const runAction = runActionRef.current;

    if (!walkAction) return;

    if (clipState.locomotionActive) {
      walkAction.timeScale = clipState.walkTimeScale;
      if (runAction) {
        runAction.timeScale = clipState.runTimeScale;
        if (clipState.runWeight !== prevRunWeightRef.current) {
          if (clipState.runWeight >= 1) {
            walkAction.crossFadeTo(runAction, CLIP_CROSSFADE_SEC, false);
          } else {
            runAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
          }
          prevRunWeightRef.current = clipState.runWeight;
        }
      } else {
        walkAction.timeScale = clipState.runWeight > 0
          ? clipState.runTimeScale
          : clipState.walkTimeScale;
      }
      mixer.update(delta);
    } else {
      walkAction.timeScale = 0;
      if (runAction) runAction.timeScale = 0;
      prevRunWeightRef.current = 0;
    }
  });

  return (
    <group ref={yawRef}>
      <group
        ref={fitRef}
        rotation={[fit.rotX, 0, 0]}
        scale={fit.scale * modelScale}
        position={[0, fit.y * modelScale, 0]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Cesium avatar with a procedural fallback while the GLB streams / on error. */
export function CesiumPlayerModel(props: ProceduralPlayerModelProps) {
  return (
    <Suspense fallback={<ProceduralPlayerModelAdaptive {...props} />}>
      <CesiumPlayerModelInner {...props} />
    </Suspense>
  );
}
