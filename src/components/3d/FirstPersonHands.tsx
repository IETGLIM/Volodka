/* ─── Volodka RPG – First-person hands (GLB) ───
 * CC0/community FPS arms attached to the active camera in useFrame.
 * Hidden during intro_wakeup cutscene and when FP mode is off. */

import type { MutableRefObject } from 'react';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { shouldUseFirstPersonExploration } from '@/engine/camera/cinematicPresentation';
import { FpsFingerEnhancement, armMeshHasFingerDetail } from './fpsFingerEnhancement';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';

const FPS_ARMS_URL = '/models/fps/fps_arms.glb';
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

/** Source: https://github.com/eraofjavascript/fps-arms.glb (community FPS rig; verify license in ATTRIBUTION.md) */
useGLTF.preload(FPS_ARMS_URL, true, true, extendLoader);

interface FirstPersonHandsProps {
  moveBlendRef?: MutableRefObject<number>;
}

const IDLE_CANDIDATES = ['relax', 'idle', 'Idle', 'guard_idle', 'finger_gun_idle'];
const WALK_CANDIDATES = ['walk', 'Walk', 'guard_draw'];

function pickAction(
  actions: Record<string, THREE.AnimationAction>,
  names: string[],
): THREE.AnimationAction | null {
  for (const name of names) {
    const action = actions[name];
    if (action) return action;
  }
  const first = Object.values(actions).find(Boolean);
  return first ?? null;
}

function FirstPersonHandsInner({ moveBlendRef }: FirstPersonHandsProps) {
  const rigRef = useRef<THREE.Group>(null);
  const armsMountRef = useRef<THREE.Group>(null);
  const bobPhaseRef = useRef(0);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const { camera } = useThree();

  const gltf = useGLTF(FPS_ARMS_URL, true, true, extendLoader);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: false });
  const showFingerEnhancement = useMemo(() => !armMeshHasFingerDetail(scene), [scene]);

  const actions = useMemo(() => {
    if (!mixer) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip);
    }
    return record;
  }, [mixer, gltf.animations]);

  useEffect(() => {
    if (!actions) return;
    idleActionRef.current = pickAction(actions, IDLE_CANDIDATES);
    walkActionRef.current = pickAction(actions, WALK_CANDIDATES) ?? idleActionRef.current;
    idleActionRef.current?.reset().fadeIn(0.2).play();
  }, [actions]);

  useFrame((_, delta) => {
    const rig = rigRef.current;
    const mount = armsMountRef.current;
    if (!rig || !mount) return;

    rig.position.copy(camera.position);
    rig.quaternion.copy(camera.quaternion);

    const move = THREE.MathUtils.clamp(moveBlendRef?.current ?? 0, 0, 1);
    bobPhaseRef.current += delta * (2 + move * 8);

    const bob = bobPhaseRef.current;
    mount.position.set(
      Math.sin(bob * 0.55) * 0.01 * move,
      -0.18 + Math.sin(bob) * 0.012 * move,
      -0.32,
    );
    mount.rotation.set(0.06 + Math.sin(bob * 0.4) * 0.02 * move, 0, 0);

    const idle = idleActionRef.current;
    const walk = walkActionRef.current;
    if (idle && walk && idle !== walk) {
      idle.setEffectiveWeight(1 - move);
      walk.setEffectiveWeight(move);
      if (!idle.isRunning()) idle.play();
      if (!walk.isRunning()) walk.play();
    }

    if (mixer) mixer.update(delta);
  });

  return (
    <group ref={rigRef}>
      <group ref={armsMountRef} scale={0.01}>
        <primitive object={scene} />
        {showFingerEnhancement && <FpsFingerEnhancement />}
      </group>
    </group>
  );
}

export function FirstPersonHands({ moveBlendRef }: FirstPersonHandsProps) {
  const activeCutsceneId = useGameStore((s) => s.activeCutsceneId);
  const gameMode = useGameStore((s) => readGamePhase(s));

  if (!shouldUseFirstPersonExploration(gameMode, activeCutsceneId)) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <FirstPersonHandsInner moveBlendRef={moveBlendRef} />
    </Suspense>
  );
}
