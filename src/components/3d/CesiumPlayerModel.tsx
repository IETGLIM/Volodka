import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getPlayerVolodkaModelUrl } from '@/config/playerModelUrl';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import {
  resolveLocomotionClipState,
  resolveRunWalkCrossfadeTarget,
} from '@/engine/player/playerLocomotionPresentation';
import {
  findPlayerAnimationClip,
  pickPlayerClipAction,
  pickSafeIdleClipAction,
  PLAYER_IDLE_CLIP_NAMES,
  PLAYER_RUN_CLIP_NAMES,
  PLAYER_WALK_CLIP_NAMES,
} from '@/engine/player/playerClipResolution';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';
import { fitCharacterGltf, measureCharacterGltfBounds } from '@/engine/assets/gltfScale';

function bindPlayerClipActions(
  mixer: THREE.AnimationMixer,
  actions: Record<string, THREE.AnimationAction> | null,
  animations: THREE.AnimationClip[],
): {
  idle: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  run: THREE.AnimationAction | null;
} {
  const pickAction = (names: readonly string[]): THREE.AnimationAction | null =>
    pickPlayerClipAction(actions, names);

  const idleAction =
    pickAction(PLAYER_IDLE_CLIP_NAMES) ?? pickSafeIdleClipAction(actions);

  const walkClip = findPlayerAnimationClip(
    animations,
    /walk/i,
    idleAction?.getClip(),
  );
  const walkAction =
    pickAction(PLAYER_WALK_CLIP_NAMES) ??
    (walkClip ? mixer.clipAction(walkClip) : idleAction);

  const runClip = findPlayerAnimationClip(
    animations,
    /run/i,
    walkAction?.getClip() ?? idleAction?.getClip(),
  );
  const runAction = runClip
    ? pickAction(PLAYER_RUN_CLIP_NAMES) ?? mixer.clipAction(runClip)
    : null;

  return { idle: idleAction, walk: walkAction, run: runAction };
}

const PLAYER_MODEL_URL = getPlayerVolodkaModelUrl();
useGLTF.preload(PLAYER_MODEL_URL);

/** Flip to Math.PI if the avatar faces backwards while walking. */
const FORWARD_OFFSET = 0;
const CLIP_CROSSFADE_SEC = 0.2;

interface Fit {
  scale: number;
  rotX: number;
  y: number;
}

function CesiumPlayerModelInner({ modelScale, currentAnimRef, rotationRef }: ProceduralPlayerModelProps) {
  const gltf = useGLTF(PLAYER_MODEL_URL);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: true });
  const yawRef = useRef<THREE.Group>(null);
  const fitRef = useRef<THREE.Group>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const prevLocomotionRef = useRef(false);
  const prevRunWeightRef = useRef(0);
  const [fit, setFit] = useState<Fit>({ scale: 1, rotX: 0, y: 0 });

  const embeddedActions = useMemo(() => {
    if (!mixer) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip);
    }
    return record;
  }, [mixer, gltf.animations]);

  const mixamoActions = useMixamoAnimationClips(mixer, scene, embeddedActions);

  useLayoutEffect(() => {
    if (!mixer) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
      return;
    }

    for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
      if (action) {
        action.stop();
        mixer.uncacheClip(action.getClip());
      }
    }
    idleActionRef.current = null;
    walkActionRef.current = null;
    runActionRef.current = null;

    const actions = mixamoActions ?? embeddedActions;
    const { idle: idleAction, walk: walkAction, run: runAction } = bindPlayerClipActions(
      mixer,
      actions,
      gltf.animations,
    );

    if (idleAction) {
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.reset();
      idleAction.play();
      idleActionRef.current = idleAction;
    }

    if (walkAction && walkAction !== idleAction) {
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      walkAction.reset();
      walkAction.play();
      walkAction.setEffectiveWeight(0);
      walkActionRef.current = walkAction;
    }

    if (runAction) {
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      runAction.reset();
      runAction.play();
      runAction.setEffectiveWeight(0);
      runActionRef.current = runAction;
    }

    prevLocomotionRef.current = false;
    prevRunWeightRef.current = 0;
    mixer.update(0);
    scene.updateMatrixWorld(true);

    return () => {
      for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
        if (action) {
          action.stop();
          mixer.uncacheClip(action.getClip());
        }
      }
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
    };
  }, [mixer, gltf.animations, mixamoActions, embeddedActions, scene]);

  useEffect(() => {
    const bounds = measureCharacterGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      scaleMultiplier: modelScale,
    });
    setFit({ scale, rotX, y: footY });
  }, [scene, modelScale]);

  useFrameTick('player', ({ delta }) => {
    if (yawRef.current) yawRef.current.rotation.y = rotationRef.current + FORWARD_OFFSET;
    if (!mixer) return;

    const clipState = resolveLocomotionClipState(currentAnimRef.current);
    const idleAction = idleActionRef.current;
    const walkAction = walkActionRef.current;
    const runAction = runActionRef.current;

    if (!idleAction && !walkAction) return;

    const locomotionActive = clipState.locomotionActive && !!walkAction;

    if (locomotionActive !== prevLocomotionRef.current) {
      if (locomotionActive && walkAction && idleAction) {
        idleAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
      } else if (!locomotionActive && idleAction && walkAction) {
        walkAction.crossFadeTo(idleAction, CLIP_CROSSFADE_SEC, false);
        prevRunWeightRef.current = 0;
      }
      prevLocomotionRef.current = locomotionActive;
    }

    if (locomotionActive && walkAction) {
      walkAction.timeScale = clipState.walkTimeScale;
      if (runAction) {
        runAction.timeScale = clipState.runTimeScale;
        const crossfadeTarget = resolveRunWalkCrossfadeTarget(
          prevRunWeightRef.current,
          clipState.runWeight,
        );
        if (crossfadeTarget === 'walk_to_run') {
          walkAction.crossFadeTo(runAction, CLIP_CROSSFADE_SEC, false);
        } else if (crossfadeTarget === 'run_to_walk') {
          runAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
        }
        prevRunWeightRef.current = clipState.runWeight;
      } else {
        walkAction.timeScale = clipState.runWeight > 0
          ? clipState.runTimeScale
          : clipState.walkTimeScale;
      }
    } else if (idleAction) {
      idleAction.timeScale = 1;
    }

    mixer.update(delta);
  });

  return (
    <group ref={yawRef}>
      <group
        ref={fitRef}
        rotation={[fit.rotX, 0, 0]}
        position={[0, fit.y, 0]}
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
