/* ─── Volodka RPG – Cesium player model ───
 * Main player avatar: the CC0 Khronos "CesiumMan" rigged GLB.
 *
 * That model is a COLLADA2GLTF export authored Z-up (its geometry height runs
 * along Z and it relies on a root "Z_UP" matrix to stand). To be robust against
 * however the loader/clone handles that, we MEASURE the clone at runtime and
 * adapt: detect lying-vs-standing, normalise to a target height, and drop the
 * feet to the floor. Falls back to the procedural model while the GLB streams.
 *
 * Drop-in replacement for ProceduralPlayerModelAdaptive (same props).
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_URLS } from '@/config/modelUrls';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';
useGLTF.preload(MODEL_URLS.cc0KhronosCesiumMan);

/** Target avatar height (metres) at modelScale = 1. */
const TARGET_HEIGHT = 1.7;
/** Flip to Math.PI if the avatar faces backwards while walking. */
const FORWARD_OFFSET = 0;

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
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  // Safe default until measured (≈1.5m model → ~1.65m). Refined in the effect.
  const [fit, setFit] = useState<Fit>({ scale: 1.1, rotX: 0, y: 0 });

  useEffect(() => {
    if (!mixer || gltf.animations.length === 0) return;
    const walkClip =
      gltf.animations.find((c) => /walk/i.test(c.name)) ?? gltf.animations[0];
    const action = mixer.clipAction(walkClip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset();
    action.play();
    actionRef.current = action;
    return () => {
      actionRef.current = null;
    };
  }, [mixer, gltf.animations]);

  // Adaptive orient + scale + foot-drop, measured from the actual clone.
  useEffect(() => {
    const inner = fitRef.current;
    if (!inner) return;
    inner.rotation.set(0, 0, 0);
    inner.scale.set(1, 1, 1);
    inner.position.set(0, 0, 0);

    const { size } = measure(scene);
    let rotX = 0;
    let heightDim = size.y;
    // Z-up / lying model → its longest vertical extent is along Z. Stand it up.
    if (size.z > size.y * 1.15) {
      rotX = -Math.PI / 2;
      heightDim = size.z;
    }
    if (!isFinite(heightDim) || heightDim < 0.2) heightDim = 1.5; // degenerate guard
    const scale = TARGET_HEIGHT / heightDim;

    // Apply, then re-measure to drop the feet exactly to y = 0.
    inner.rotation.x = rotX;
    inner.scale.setScalar(scale);
    const { min } = measure(scene);
    const y = isFinite(min.y) ? -min.y : 0;

    setFit({ scale, rotX, y });
  }, [scene]);

  useFrame((_, delta) => {
    if (yawRef.current) yawRef.current.rotation.y = rotationRef.current + FORWARD_OFFSET;
    if (!mixer) return;
    const anim = currentAnimRef.current;
    const moving = anim === 'walk' || anim === 'run';
    if (actionRef.current) {
      actionRef.current.timeScale = moving ? (anim === 'run' ? 1.45 : 1.05) : 0.3;
    }
    mixer.update(delta);
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
