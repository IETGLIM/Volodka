import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';

import { useFrameTick } from '@/engine/frame/useFrameTick';

import { useGLTF } from '@react-three/drei';

import { AnimationAction, Group, MathUtils, Mesh, SkinnedMesh } from 'three';

import { getGameSnapshot } from "@/engine/GameActionDispatcher";
import { readGamePhase } from '@/shared/gamePhase';

import { usePlayerPresentationState } from '@/store/selectors';

import { shouldUseFirstPersonHands } from '@/engine/camera/cinematicPresentation';

import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

import { eventBus } from '@/engine/EventBus';

import { FpsFingerEnhancement } from './fpsFingerEnhancement';

import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { scheduleGltfPreload, GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';

import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';

import {

  pickPlayerClipAction,

  PLAYER_IDLE_CLIP_NAMES,

  PLAYER_WALK_CLIP_NAMES,

} from '@/engine/player/playerClipResolution';

import { FPS_ARMS_URL } from '@/config/fpsArmsUrl';

import { resolveFpsArmsPresentation } from '@/engine/player/fpsArmsPresentation';



const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;



// Session 9 perf: routed through gltfPreloadScheduler (Deferred priority — FPS arms
// are only needed when first-person mode is toggled, which is currently disabled).
scheduleGltfPreload(
  FPS_ARMS_URL,
  () => useGLTF.preload(FPS_ARMS_URL, true, true, extendLoader),
  GltfPreloadPriority.Deferred,
);



interface FirstPersonHandsProps {

  moveBlendRef?: MutableRefObject<number>;

}



function FirstPersonHandsInner({ moveBlendRef }: FirstPersonHandsProps) {

  const rigRef = useRef<Group>(null);

  const armsMountRef = useRef<Group>(null);

  const bobPhaseRef = useRef(0);

  const combatLungeRef = useRef(0);

  const combatGuardRef = useRef(0);

  const idleActionRef = useRef<AnimationAction | null>(null);

  const walkActionRef = useRef<AnimationAction | null>(null);



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



  const { proceduralOnly, glbScale, fingerScale } = useMemo(

    () => resolveFpsArmsPresentation(scene),

    [scene],

  );



  useEffect(() => {

    scene.traverse((obj) => {

      if (obj instanceof Mesh || obj instanceof SkinnedMesh) {

        obj.visible = !proceduralOnly;

      }

    });

  }, [scene, proceduralOnly]);



  const actions = useMemo(() => {

    if (!mixer || proceduralOnly) return null;

    const record: Record<string, AnimationAction> = {};

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



    const move = MathUtils.clamp(moveBlendRef?.current ?? 0, 0, 1) * (1 - combatGuardRef.current * 0.85);

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



    const phase = readGamePhase({ mainMenuOpen: false, introActive: false, combatActive: false, activeCutsceneId: getGameSnapshot().activeCutsceneId });

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

        <group scale={glbScale}>

          <primitive object={scene} />

        </group>

        {proceduralOnly ? (

          <group scale={fingerScale}>

            <FpsFingerEnhancement />

          </group>

        ) : null}

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

