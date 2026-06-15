/* ─── Volodka RPG – First-person hands (GLB) ───
 * CC0/community FPS arms attached to the active camera via useFrameTick.
 * Hidden during intro_wakeup cutscene and when FP mode is off. */

import type { MutableRefObject } from 'react';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { usePlayerPresentationState } from '@/store/selectors';
import { shouldUseFirstPersonHands } from '@/engine/camera/cinematicPresentation';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { eventBus } from '@/engine/EventBus';
import { FpsFingerEnhancement } from './fpsFingerEnhancement';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';

const FPS_ARMS_URL = '/models/fps/fps_arms.glb';
/** Khronos-style FPS rig units — matches FpsFingerEnhancement coordinates */
const FPS_ARMS_RIG_SCALE = 0.012;
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
  const combatLungeRef = useRef(0);
  const combatGuardRef = useRef(0);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const scope = eventBus.createScope();
    scope.on('combat:start', () => {
      combatGuardRef.current = 1;
    });
    scope.on('combat:end', () => {
      combatGuardRef.current = 0;
    });
    scope.on('combat:action', ({ action }) => {
      if (action === 'attack' || action === 'poem_power') {
        combatLungeRef.current = 1;
      }
    });
    scope.on('combat:hit', ({ isPlayerHit }) => {
      if (isPlayerHit) combatLungeRef.current = -0.55;
    });
    return () => scope.dispose();
  }, []);

  const gltf = useGLTF(FPS_ARMS_URL, true, true, extendLoader);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: false });
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

  useFrameTick('player', ({ state, delta }) => {
    const rig = rigRef.current;
    const mount = armsMountRef.current;
    if (!rig || !mount) return;

    rig.position.copy(state.camera.position);
    rig.quaternion.copy(state.camera.quaternion);

    const move = THREE.MathUtils.clamp(moveBlendRef?.current ?? 0, 0, 1) * (1 - combatGuardRef.current * 0.85);
    const reducedMotion = isEffectiveReducedMotion();
    const moveBob = reducedMotion ? 0 : move;
    if (!reducedMotion) {
      bobPhaseRef.current += delta * (2 + moveBob * 8);
    }

    if (combatLungeRef.current > 0) {
      combatLungeRef.current = Math.max(0, combatLungeRef.current - delta * 5.5);
    } else if (combatLungeRef.current < 0) {
      combatLungeRef.current = Math.min(0, combatLungeRef.current + delta * 4);
    }

    const phase = readGamePhase(useGameStore.getState());
    if (phase === 'combat') {
      combatGuardRef.current = Math.max(combatGuardRef.current, 0.85);
    } else if (combatGuardRef.current > 0) {
      combatGuardRef.current = Math.max(0, combatGuardRef.current - delta * 2.5);
    }

    const lunge = combatLungeRef.current;
    const guard = combatGuardRef.current;
    const bob = bobPhaseRef.current;
    mount.position.set(
      Math.sin(bob * 0.55) * 0.012 * moveBob * (1 - guard * 0.8),
      -0.16 + Math.sin(bob) * 0.014 * moveBob * (1 - guard * 0.8) + lunge * 0.04 - guard * 0.03,
      -0.28 + lunge * 0.14 - guard * 0.06,
    );
    mount.rotation.set(
      0.06 + Math.sin(bob * 0.4) * 0.02 * moveBob * (1 - guard) - lunge * 0.35 - guard * 0.22,
      lunge * 0.08,
      guard * 0.04,
    );

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
      <group ref={armsMountRef}>
        <group scale={FPS_ARMS_RIG_SCALE}>
          <primitive object={scene} />
          <FpsFingerEnhancement />
        </group>
      </group>
    </group>
  );
}

export function FirstPersonHands({ moveBlendRef }: FirstPersonHandsProps) {
  const { activeCutsceneId, gameMode } = usePlayerPresentationState();

  if (!shouldUseFirstPersonHands(gameMode, activeCutsceneId)) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <FirstPersonHandsInner moveBlendRef={moveBlendRef} />
    </Suspense>
  );
}
