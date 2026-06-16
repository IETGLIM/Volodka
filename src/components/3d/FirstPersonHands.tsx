import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { usePlayerPresentationState } from '@/store/selectors';
import { shouldUseFirstPersonHands } from '@/engine/camera/cinematicPresentation';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { eventBus } from '@/engine/EventBus';
import { FpsFingerEnhancement, armMeshHasFingerDetail } from './fpsFingerEnhancement';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { measureGltfBounds } from '@/engine/assets/gltfScale';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import {
  pickPlayerClipAction,
  PLAYER_IDLE_CLIP_NAMES,
  PLAYER_WALK_CLIP_NAMES,
} from '@/engine/player/playerClipResolution';

const FPS_ARMS_URL = '/models/fps/fps_arms.glb';
/** Khronos / Soldier interim rigs use ~100–200 unit height; real FPS arm GLBs are <3 m. */
const FULL_BODY_INTERIM_MIN_HEIGHT_UNITS = 8;
/** Scale for Khronos-style FPS arm rigs (procedural finger coords). */
const FPS_PROCEDURAL_RIG_SCALE = 0.012;
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

useGLTF.preload(FPS_ARMS_URL, true, true, extendLoader);

interface FirstPersonHandsProps {
  moveBlendRef?: MutableRefObject<number>;
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

  const proceduralOnly = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    const bounds = measureGltfBounds(scene);
    return bounds.size.y > FULL_BODY_INTERIM_MIN_HEIGHT_UNITS || !armMeshHasFingerDetail(scene);
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
        obj.visible = !proceduralOnly;
      }
    });
  }, [scene, proceduralOnly]);

  const actions = useMemo(() => {
    if (!mixer || proceduralOnly) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip);
    }
    return record;
  }, [mixer, gltf.animations, proceduralOnly]);

  useEffect(() => {
    if (!actions) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      return;
    }
    idleActionRef.current = pickPlayerClipAction(actions, PLAYER_IDLE_CLIP_NAMES);
    walkActionRef.current =
      pickPlayerClipAction(actions, PLAYER_WALK_CLIP_NAMES) ?? idleActionRef.current;
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
      -0.2 + Math.sin(bob) * 0.012 * moveBob * (1 - guard * 0.8) + lunge * 0.04 - guard * 0.03,
      -0.34 + lunge * 0.12 - guard * 0.05,
    );
    mount.rotation.set(
      0.04 + Math.sin(bob * 0.4) * 0.02 * moveBob * (1 - guard) - lunge * 0.3 - guard * 0.18,
      lunge * 0.06,
      guard * 0.03,
    );

    const idle = idleActionRef.current;
    const walk = walkActionRef.current;
    if (idle && walk && idle !== walk) {
      idle.setEffectiveWeight(1 - move);
      walk.setEffectiveWeight(move);
      if (!idle.isRunning()) idle.play();
      if (!walk.isRunning()) walk.play();
    }

    if (mixer && !proceduralOnly) mixer.update(delta);
  });

  return (
    <group ref={rigRef}>
      <group ref={armsMountRef}>
        <group scale={FPS_PROCEDURAL_RIG_SCALE}>
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
