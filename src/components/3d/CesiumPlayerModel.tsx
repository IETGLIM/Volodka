import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MIXAMO_ANIMATION_CATALOG } from '@/config/mixamoAnimationCatalog';
import { SHIPPED_MIXAMO_CLIP_IDS } from '@/config/mixamoAnimationShipped';
import { getPlayerVolodkaModelUrl } from '@/config/playerModelUrl';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import { resolveLocomotionClipState } from '@/engine/player/playerLocomotionPresentation';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';
import { fitCharacterGltf, measureGltfBounds } from '@/engine/assets/gltfScale';

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

  const mixamoIdleName = MIXAMO_ANIMATION_CATALOG.find((c) => c.id === 'idle')?.canonicalClipName;
  const mixamoWalkName = MIXAMO_ANIMATION_CATALOG.find((c) => c.id === 'walking')?.canonicalClipName;
  const hasMixamoIdle = SHIPPED_MIXAMO_CLIP_IDS.includes('idle');
  const hasMixamoWalk = SHIPPED_MIXAMO_CLIP_IDS.includes('walking');

  useEffect(() => {
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

    const pickAction = (names: string[]): THREE.AnimationAction | null => {
      if (!mixamoActions) return null;
      for (const name of names) {
        const action = mixamoActions[name];
        if (action) return action;
      }
      return null;
    };

    const idleAction =
      (hasMixamoIdle && mixamoIdleName ? pickAction([mixamoIdleName, 'idle', 'Idle']) : null) ??
      pickAction(['idle', 'Idle', 'IDLE']) ??
      (gltf.animations[0] ? mixer.clipAction(gltf.animations[0]) : null);

    const walkAction =
      (hasMixamoWalk && mixamoWalkName ? pickAction([mixamoWalkName, 'walking', 'Walking']) : null) ??
      pickAction(['walking', 'Walking', 'walk', 'Walk']) ??
      gltf.animations.find((c) => /walk/i.test(c.name) && c !== idleAction?.getClip())
        ? mixer.clipAction(gltf.animations.find((c) => /walk/i.test(c.name))!)
        : idleAction;

    const runClip = gltf.animations.find(
      (c) => /run/i.test(c.name) && c !== walkAction?.getClip() && c !== idleAction?.getClip(),
    );

    if (idleAction) {
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.play();
      idleActionRef.current = idleAction;
    }

    if (walkAction && walkAction !== idleAction) {
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      walkAction.play();
      walkAction.setEffectiveWeight(0);
      walkActionRef.current = walkAction;
    }

    if (runClip) {
      const runAction = mixer.clipAction(runClip);
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      runAction.play();
      runAction.setEffectiveWeight(0);
      runActionRef.current = runAction;
    }

    prevLocomotionRef.current = false;

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
  }, [mixer, gltf.animations, mixamoActions, hasMixamoIdle, hasMixamoWalk, mixamoIdleName, mixamoWalkName]);

  useEffect(() => {
    const inner = fitRef.current;
    if (!inner) return;
    inner.rotation.set(0, 0, 0);
    inner.scale.set(1, 1, 1);
    inner.position.set(0, 0, 0);

    const bounds = measureGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      scaleMultiplier: modelScale,
    });

    inner.rotation.x = rotX;
    inner.scale.setScalar(scale);
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
      }
      prevLocomotionRef.current = locomotionActive;
    }

    if (locomotionActive && walkAction) {
      walkAction.timeScale = clipState.walkTimeScale;
      if (runAction) {
        runAction.timeScale = clipState.runTimeScale;
        if (clipState.runWeight >= 1) {
          walkAction.crossFadeTo(runAction, CLIP_CROSSFADE_SEC, false);
        } else if (clipState.runWeight === 0) {
          runAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
        }
      } else {
        walkAction.timeScale = clipState.runWeight > 0
          ? clipState.runTimeScale
          : clipState.walkTimeScale;
      }
      mixer.update(delta);
    } else if (idleAction) {
      idleAction.timeScale = 1;
      mixer.update(delta);
    }
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
    <Suspense fallback={<ProceduralPlayerModelAdaptive {...props} />}>
      <CesiumPlayerModelInner {...props} />
    </Suspense>
  );
}
