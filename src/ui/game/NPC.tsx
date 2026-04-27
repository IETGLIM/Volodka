"use client";

import React, {
  useRef,
  useState,
  useMemo,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  RigidBody,
  type RapierRigidBody,
  useRapier,
  useBeforePhysicsStep,
  CapsuleCollider,
} from '@react-three/rapier';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import {
  computePlayerCapsule,
  createExplorationKinematicCharacterController,
} from '@/engine/physics/CharacterController';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import * as THREE from 'three';
import type { AnimationMapping, NPCDefinition, NPCState } from '@/data/rpgTypes';
import type { SceneId } from '@/data/types';
import type { ScheduleEntry } from '@/shared/types/schedule';
import { rewriteLegacyModelPath } from '@/config/modelUrls';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { useGameStore } from '@/state';
import { getNpcQuestMarkerForExploration } from '@/lib/npcQuestMarker';
import {
  logGltfLoadedFootprintDev,
  recordGltfGpuByteEstimateFromScene,
  retainGltfModelUrl,
  releaseGltfModelUrl,
} from '@/lib/gltfModelCache';
import { applyGltfExplorationCharacterMaterialPolicies } from '@/lib/gltfCharacterMaterialPolicy';
import { applyExplorationPlayerGlobalVisualScale } from '@/lib/playerScaleConstants';
import { glbBasenameFromUrl, resolveCharacterMeshUniformScale } from '@/data/modelMeta';
import { cloneAnimationClipsWithoutExplorationPlayerRootMotion } from '@/lib/stripExplorationPlayerRootMotionFromClips';
import { isExplorationPlayerGlbScaleDebugEnabled } from '@/lib/explorationDiagnostics';
import { PLAYER_VISUAL_HEIGHT_M, validateCharacterScale } from '@/lib/characterScaleValidator';
import type { FindNavPathXZ } from '@/lib/explorationNavMesh';
import { resolveNpcModelLodUseFull, smoothNpcLodDistanceForHysteresis } from '@/lib/npcLodConstants';
import { isExplorationVolodkaRoomNpcGlbDisabled } from '@/lib/explorationDiagnostics';

function scheduleActivityIcon(entry: ScheduleEntry | null | undefined): string {
  if (!entry) return '💬';
  if (!entry.dialogueAvailable) return '😴';
  switch (entry.activity) {
    case 'walk':
      return '🚶';
    case 'work':
      return '💻';
    case 'read':
      return '📖';
    case 'rest':
      return '☕';
    default:
      return '💬';
  }
}

// ============================================
// ERROR BOUNDARY ДЛЯ МОДЕЛЕЙ
// ============================================

class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ============================================
// GLTF МОДЕЛЬ С FALLBACK
// ============================================

/** Номинальная скорость «ходьбы» в клипе (м/с) для подгонки `effectiveTimeScale` под фактическую скорость патруля. */
const NPC_WALK_CLIP_NOMINAL_MPS = 1.4;
/** Слот расписания: не дёргать `npcKccIntentRef` телепортом на полный вектор за кадр — KCC и коллизии иначе «дёргаются». */
const NPC_SCHEDULE_KCC_MAX_SPEED_MPS = 22;
/** В пределах этого расстояния до слота цель KCC = точная позиция расписания. */
const NPC_SCHEDULE_KCC_SNAP_M = 0.03;

interface GLTFModelProps {
  modelPath: string;
  /** Масштаб комнаты в обходе (`getExplorationCharacterModelScale`), как у игрока. */
  roomModelScale: number;
  /** Поле `definition.scale` карточки NPC (1 по умолчанию). */
  definitionModelScale?: number;
  explorationSceneId: SceneId;
  isNearPlayer: boolean;
  isDialogueActive: boolean;
  fallback: React.ReactNode;
  npcAnimation: 'idle' | 'walk' | 'talk';
  animations?: AnimationMapping;
  /** Плановая скорость по XZ (м/с); обновляется в `NPC.useFrame` при патруле. */
  planarSpeedMpsRef: MutableRefObject<number>;
}

const DEFAULT_ANIMATIONS = {
  idle: 'Idle',
  walk: 'Walk',
  talk: 'Talk',
};

function resolveNpcAnimationClip(
  actionKeys: string[],
  mapping?: AnimationMapping
): { idle: string; walk: string | null; run: string | null; talk: string | null } {
  const has = (name?: string) => Boolean(name && actionKeys.includes(name));

  const idle =
    (has(mapping?.idle) ? mapping!.idle : undefined) ??
    (actionKeys.includes(DEFAULT_ANIMATIONS.idle) ? DEFAULT_ANIMATIONS.idle : undefined) ??
    actionKeys.find((k) => k.toLowerCase().includes('idle')) ??
    actionKeys[0];

  const walk =
    (has(mapping?.walk) ? mapping!.walk : undefined) ??
    actionKeys.find((k) => k.toLowerCase().includes('walk')) ??
    (has(mapping?.run) ? mapping!.run : undefined) ??
    (actionKeys.includes(DEFAULT_ANIMATIONS.walk) ? DEFAULT_ANIMATIONS.walk : undefined) ??
    actionKeys.find((k) => {
      const l = k.toLowerCase();
      return l.includes('run');
    }) ??
    null;

  const run =
    (has(mapping?.run) ? mapping!.run : undefined) ??
    actionKeys.find((k) => {
      const l = k.toLowerCase();
      return l.includes('run') && !l.includes('walk');
    }) ??
    null;

  const talk =
    (has(mapping?.talk) ? mapping!.talk : undefined) ??
    (actionKeys.includes(DEFAULT_ANIMATIONS.talk) ? DEFAULT_ANIMATIONS.talk : undefined) ??
    actionKeys.find((k) => {
      const l = k.toLowerCase();
      return l.includes('talk') || l.includes('speak') || l.includes('gesture');
    }) ??
    null;

  return { idle, walk, run, talk };
}

function isValidNpcModelPath(p: string): boolean {
  const lower = p.toLowerCase();
  if (typeof p !== 'string' || p.length < 8 || p.includes('..')) return false;
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return lower.includes('.glb') || lower.includes('.gltf');
  }
  return (
    p.startsWith('/') &&
    (lower.endsWith('.glb') || lower.endsWith('.gltf')) &&
    (p.startsWith('/models/') || p.startsWith('/models-external/'))
  );
}

// Внутренний компонент для рендера загруженной модели (`castShadow` / `receiveShadow` — один раз в `GLTFLoader` при клоне).
const GLTFModelInner = memo(function GLTFModelInner({
  groupRef,
  scene,
  scale,
  isNearPlayer,
  isDialogueActive,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  scene: THREE.Group;
  scale: number | undefined;
  isNearPlayer: boolean;
  isDialogueActive: boolean;
}) {
  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={scale} />
      {isNearPlayer && !isDialogueActive && (
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
});

// Компонент загрузки GLTF - всегда вызывается с валидным путём
const GLTFLoader = memo(function GLTFLoader({
  modelPath,
  roomModelScale,
  definitionModelScale = 1,
  explorationSceneId,
  isNearPlayer,
  isDialogueActive,
  fallback,
  npcAnimation,
  animations: animMapping,
  planarSpeedMpsRef,
}: Omit<GLTFModelProps, 'fallback'> & { fallback: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: loadedScene, animations } = useGLTF(modelPath) as {
    scene: THREE.Group;
    animations?: THREE.AnimationClip[];
  };
  /** Mixamo-экспорты: root translation в клипе + статичный `RigidBody`/группа дают артефакты скина — как у игрока в `PhysicsPlayer`. */
  const npcMixerClips = useMemo(() => {
    const arr = animations ?? [];
    if (!arr.length) return arr;
    const b = glbBasenameFromUrl(modelPath);
    if (
      b === 'khronos_cc0_cesiumman.glb' ||
      b === 'khronos_cc0_riggedfigure.glb' ||
      b === 'khronos_cc0_fox.glb'
    ) {
      return cloneAnimationClipsWithoutExplorationPlayerRootMotion(arr);
    }
    return arr;
  }, [animations, modelPath]);
  const { actions } = useAnimations(npcMixerClips, groupRef);
  const actionsRef = useRef(actions);
  const prevNpcClipRef = useRef<string | null>(null);
  const walkClipNameRef = useRef<string | null>(null);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useLayoutEffect(() => {
    prevNpcClipRef.current = null;
  }, [modelPath]);

  const actionKeysSig = useMemo(() => {
    if (!actions) return '';
    return Object.keys(actions)
      .filter((k) => actions[k])
      .sort()
      .join('\0');
  }, [actions]);

  const animMappingSig = useMemo(() => {
    if (!animMapping) return '';
    const parts: string[] = [`idle:${animMapping.idle}`];
    if (animMapping.walk) parts.push(`walk:${animMapping.walk}`);
    if (animMapping.run) parts.push(`run:${animMapping.run}`);
    if (animMapping.talk) parts.push(`talk:${animMapping.talk}`);
    return parts.join('|');
  }, [animMapping]);

  useEffect(() => {
    retainGltfModelUrl(modelPath);
    return () => releaseGltfModelUrl(modelPath);
  }, [modelPath]);

  useEffect(() => {
    recordGltfGpuByteEstimateFromScene(modelPath, loadedScene);
    logGltfLoadedFootprintDev(modelPath, loadedScene);
  }, [modelPath, loadedScene]);

  /** Размонтирование / смена `actions`: останавливаем клипы, иначе mixer держит ссылки. */
  useEffect(() => {
    return () => {
      const act = actionsRef.current;
      if (!act) return;
      for (const key of Object.keys(act)) {
        const a = act[key];
        if (a) a.stop();
      }
    };
  }, []);

  const { scene, bakedVisualScale } = useMemo(() => {
    if (!loadedScene) return { scene: null, bakedVisualScale: 1 };
    try {
      const clone = cloneSkeleton(loadedScene) as THREE.Group;
      if (clone.scale.x !== 1 || clone.scale.y !== 1 || clone.scale.z !== 1) {
        console.warn('[NPC GLB] root had non-unit scale; reset to (1,1,1) before policies.', {
          modelPath,
          scale: [clone.scale.x, clone.scale.y, clone.scale.z],
        });
        clone.scale.set(1, 1, 1);
        clone.updateMatrixWorld(true);
      }
      /** Тени один раз при клоне; переключение LOD — только `visible` на родительских группах (`NPC` body). */
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      const rs = Number.isFinite(roomModelScale) ? roomModelScale : 1;
      const def = Number.isFinite(definitionModelScale) && definitionModelScale > 0 ? definitionModelScale : 1;
      const bakedVisualScale = resolveCharacterMeshUniformScale(modelPath, {
        roomModelScale: rs,
        definitionModelScale: def,
        introCutsceneActive: false,
        clampSceneId: explorationSceneId,
      });
      applyGltfExplorationCharacterMaterialPolicies(clone, {
        explorationVisualUniform: bakedVisualScale,
      });
      return { scene: clone, bakedVisualScale };
    } catch {
      return { scene: null, bakedVisualScale: 1 };
    }
  }, [loadedScene, roomModelScale, definitionModelScale, explorationSceneId, modelPath]);

  useEffect(() => {
    if (!loadedScene || !scene) return;
    if (!isExplorationPlayerGlbScaleDebugEnabled()) return;
    const u = bakedVisualScale;
    const bbox = scene.userData.characterBoundingVerticalM as number | undefined;
    const hM = scene.userData.characterHeightM as number | undefined;
    const scaleOk = bbox != null && Number.isFinite(bbox) ? validateCharacterScale(modelPath, bbox, u) : 'ok';
    const ok = scaleOk === 'ok';
    const detail = scaleOk === 'ok' ? {} : { validation: scaleOk };
    const rawLabel =
      hM != null && Number.isFinite(hM)
        ? `сырой bbox×uniform ${hM.toFixed(2)} (ориентир «~${PLAYER_VISUAL_HEIGHT_M} м» на экране — по политике сцены)`
        : '(нет оценки bbox×uniform)';
    console.info(
      `%c[NPC GLB scale debug]%c ${rawLabel} · uniform ${u.toFixed(4)}`,
      ok ? 'color:#16a34a;font-weight:bold' : 'color:#dc2626;font-weight:bold',
      'color:inherit;font-weight:normal',
      { modelPath, explorationSceneId, ...detail },
    );
  }, [modelPath, loadedScene, scene, explorationSceneId, bakedVisualScale]);

  useEffect(() => {
    const act = actionsRef.current;
    if (!act || Object.keys(act).length === 0) return;

    const actionKeys = Object.keys(act).filter((k) => act[k]);
    if (actionKeys.length === 0) return;

    const resolved = resolveNpcAnimationClip(actionKeys, animMapping);
    let idleClip = resolved.idle;
    if (!act[idleClip]) {
      idleClip =
        actionKeys.find((k) => k.toLowerCase().includes('idle')) ??
        actionKeys.find((k) => /armature\|/i.test(k)) ??
        actionKeys[0];
    }
    let walkClip = resolved.walk;
    if (walkClip && !act[walkClip]) {
      walkClip =
        actionKeys.find((k) => {
          const l = k.toLowerCase();
          return l.includes('walk') || l.includes('run');
        }) ?? null;
    }
    if (!walkClip || !act[walkClip]) walkClip = idleClip;
    let talkClip = resolved.talk;
    if (talkClip && !act[talkClip]) talkClip = null;

    walkClipNameRef.current = walkClip;

    const targetClip =
      npcAnimation === 'walk'
        ? walkClip
        : npcAnimation === 'talk'
          ? talkClip || idleClip
          : idleClip;

    if (!targetClip || !act[targetClip]) return;
    if (targetClip === prevNpcClipRef.current) return;

    const prevKey = prevNpcClipRef.current;
    const prevAction = prevKey && act[prevKey] ? act[prevKey]! : null;
    const nextAction = act[targetClip]!;
    /**
     * Быстрая смена `animMapping` / `npcAnimation`: без этого на микшере остаются «висящие» клипы
     * (несколько `play` + веса), что даёт конфликты и лишнюю работу. Партнёра кроссфейда (`prevAction`)
     * не гасим до `crossFadeFrom` — иначе Three.js не сможет плавно смешать.
     */
    for (const key of Object.keys(act)) {
      const a = act[key];
      if (!a || a === nextAction) continue;
      if (a === prevAction) continue;
      if (a.isRunning()) a.stop();
    }

    const duration = 0.3;
    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.play();
    if (prevAction && prevAction !== nextAction) {
      nextAction.crossFadeFrom(prevAction, duration, false);
    } else {
      nextAction.fadeIn(duration);
    }
    prevNpcClipRef.current = targetClip;
  }, [actionKeysSig, animMappingSig, npcAnimation]);

  useFrame(() => {
    const act = actionsRef.current;
    if (!act) return;
    const walkKey = walkClipNameRef.current;
    const walkAction = walkKey && act[walkKey] ? act[walkKey]! : null;
    if (!walkAction) return;
    if (npcAnimation === 'walk') {
      const v = Math.max(0, planarSpeedMpsRef.current);
      const ts = THREE.MathUtils.clamp(v / NPC_WALK_CLIP_NOMINAL_MPS, 0.42, 1.85);
      walkAction.setEffectiveTimeScale(ts);
    } else {
      walkAction.setEffectiveTimeScale(1);
    }
  });

  if (!scene) {
    return <>{fallback}</>;
  }

  return (
    <GLTFModelInner
      groupRef={groupRef}
      scene={scene}
      scale={bakedVisualScale}
      isNearPlayer={isNearPlayer}
      isDialogueActive={isDialogueActive}
    />
  );
});

const GLTFModel = memo(function GLTFModel({
  modelPath,
  roomModelScale,
  definitionModelScale = 1,
  explorationSceneId,
  isNearPlayer,
  isDialogueActive,
  fallback,
  npcAnimation,
  animations,
  planarSpeedMpsRef,
}: GLTFModelProps) {
  const resolvedPath = useMemo(() => rewriteLegacyModelPath(modelPath), [modelPath]);

  // Если путь не указан или заведомо неверный — не дергаем загрузчик (ошибки сети ловит boundary)
  if (
    !resolvedPath ||
    resolvedPath === 'undefined' ||
    resolvedPath === '/undefined' ||
    resolvedPath === '' ||
    !isValidNpcModelPath(resolvedPath)
  ) {
    return <>{fallback}</>;
  }

  return (
    <ModelErrorBoundary fallback={fallback}>
      <GLTFLoader
        modelPath={resolvedPath}
        roomModelScale={roomModelScale}
        definitionModelScale={definitionModelScale}
        explorationSceneId={explorationSceneId}
        isNearPlayer={isNearPlayer}
        isDialogueActive={isDialogueActive}
        fallback={fallback}
        npcAnimation={npcAnimation}
        animations={animations}
        planarSpeedMpsRef={planarSpeedMpsRef}
      />
    </ModelErrorBoundary>
  );
});

// ============================================
// СТИЛИЗОВАННЫЕ МОДЕЛИ ПЕРСОНАЖЕЙ
// ============================================

interface CharacterModelProps {
  modelType: NPCDefinition['model'];
  isNearPlayer: boolean;
  isDialogueActive: boolean;
}

const ElderModel = memo(function ElderModel({ isNearPlayer, isDialogueActive }: Omit<CharacterModelProps, 'modelType'>) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.015;
      groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 1.1, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.8} />
      </mesh>

      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 0.12, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.25, 0.08]} castShadow>
        <coneGeometry args={[0.1, 0.2, 6]} />
        <meshStandardMaterial color="#888888" roughness={0.9} />
      </mesh>

      <group position={[0.35, 0, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.025, 0.03, 1.4, 6]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
        </mesh>
      </group>

      {isNearPlayer && !isDialogueActive && (
        <mesh position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
});

const BaristaModel = memo(function BaristaModel({ isNearPlayer, isDialogueActive }: Omit<CharacterModelProps, 'modelType'>) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.012;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.65, 0.2]} castShadow>
        <boxGeometry args={[0.35, 0.5, 0.05]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>

      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.85} />
      </mesh>

      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.08, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>

      {isNearPlayer && !isDialogueActive && (
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
});

const ColleagueModel = memo(function ColleagueModel({ isNearPlayer, isDialogueActive }: Omit<CharacterModelProps, 'modelType'>) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 1.6) * 0.01;
      groupRef.current.rotation.z = Math.sin(t * 0.7) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.95, 0.15]} castShadow>
        <boxGeometry args={[0.2, 0.15, 0.08]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.85, 0.18]} castShadow>
        <boxGeometry args={[0.06, 0.25, 0.02]} />
        <meshStandardMaterial color="#8b0000" roughness={0.6} />
      </mesh>

      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.85} />
      </mesh>

      <mesh position={[0, 1.42, -0.02]} castShadow>
        <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>

      <group position={[0, 1.35, 0.15]}>
        <mesh position={[-0.07, 0, 0]}>
          <torusGeometry args={[0.04, 0.008, 8, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <torusGeometry args={[0.04, 0.008, 8, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {isNearPlayer && !isDialogueActive && (
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
});

const ShadowModel = memo(function ShadowModel({ isNearPlayer, isDialogueActive }: Omit<CharacterModelProps, 'modelType'>) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.elapsedTime;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0, 0.8, -0.1]} castShadow>
        <coneGeometry args={[0.4, 1.2, 8, 1, true]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.95} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </mesh>

      <mesh ref={glowRef} position={[0, 1.35, 0.05]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.2} />
      </mesh>

      <mesh position={[-0.06, 1.38, 0.15]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
      <mesh position={[0.06, 1.38, 0.15]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>

      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.1} />
      </mesh>

      {isNearPlayer && !isDialogueActive && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>
      )}
    </group>
  );
});

const GenericModel = memo(function GenericModel({ isNearPlayer, isDialogueActive }: Omit<CharacterModelProps, 'modelType'>) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.02;
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.7} />
      </mesh>

      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.85} />
      </mesh>

      <mesh position={[0, 1.42, -0.02]} castShadow>
        <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>

      {isNearPlayer && !isDialogueActive && (
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
});

const NpcDistanceImpostor = memo(function NpcDistanceImpostor({ scale = 1 }: { scale?: number }) {
  const r = 0.26 * scale;
  const len = 0.85 * scale;
  return (
    <mesh position={[0, 0.45 * scale + len * 0.5, 0]} castShadow={false}>
      <capsuleGeometry args={[r, len, 5, 10]} />
      <meshStandardMaterial color="#3d4f48" roughness={0.88} metalness={0.05} />
    </mesh>
  );
});

const FallbackNPCModel = memo(function FallbackNPCModel({
  modelType,
  isNearPlayer,
  isDialogueActive
}: CharacterModelProps) {
  switch (modelType) {
    case 'elder':
      return <ElderModel isNearPlayer={isNearPlayer} isDialogueActive={isDialogueActive} />;
    case 'barista':
      return <BaristaModel isNearPlayer={isNearPlayer} isDialogueActive={isDialogueActive} />;
    case 'colleague':
      return <ColleagueModel isNearPlayer={isNearPlayer} isDialogueActive={isDialogueActive} />;
    case 'shadow':
      return <ShadowModel isNearPlayer={isNearPlayer} isDialogueActive={isDialogueActive} />;
    default:
      return <GenericModel isNearPlayer={isNearPlayer} isDialogueActive={isDialogueActive} />;
  }
});

// ============================================
// УПРОЩЁННЫЙ КОМПОНЕНТ NPC (без физики)
// ============================================

interface NPCProps {
  definition: NPCDefinition;
  state: NPCState;
  playerPosition: { x: number; y: number; z: number };
  /** Актуальная позиция игрока без ре-рендера родителя (приоритет над `playerPosition` в `useFrame`). */
  playerPositionRef?: RefObject<{ x: number; y: number; z: number; rotation?: number } | null>;
  onInteraction: (npcId: string) => void;
  onStateChange: (state: NPCState) => void;
  isDialogueActive: boolean;
  /** Множитель из `getExplorationNpcModelScale(currentSceneId)` (совпадает с масштабом игрока в локации). */
  locationModelScale?: number;
  /** Множитель скорости патруля; `getExplorationLocomotionScale`. */
  locationLocomotionScale?: number;
  /**
   * Текущее окно расписания (`ScheduleEngine`). При `enableNpcPhysics` слот задаёт **цель** для KCC;
   * фактическая позиция и `currentPositionRef` следуют телу после `computeColliderMovement`, без
   * ежекадровой подмены ref идеальной точкой слота (иначе рассинхрон и дёрганье).
   */
  scheduleEntry?: ScheduleEntry | null;
  /**
   * Кинематический `RigidBody` + KCC в `useBeforePhysicsStep`. Для NPC **только** со слотом
   * расписания без патруля можно оставить `false` — позиция тогда жёстко из `scheduleEntry` в группе.
   */
  enableNpcPhysics?: boolean;
  /** Путь по navmesh (three-pathfinding); если нет — прямой бег к waypoint. */
  findNavPath?: FindNavPathXZ | null;
  /** Сцена обхода (для временных режимов отладки, напр. без GLB в `volodka_room`). */
  explorationSceneId?: SceneId;
}

export const NPC = memo(function NPC({
  definition,
  state,
  playerPosition,
  playerPositionRef,
  onInteraction,
  onStateChange,
  isDialogueActive,
  locationModelScale = 1,
  locationLocomotionScale = 1,
  scheduleEntry = null,
  enableNpcPhysics = false,
  findNavPath = null,
  explorationSceneId,
}: NPCProps) {
  const volodkaDebugHumanoidOnly = useMemo(
    () => explorationSceneId === 'volodka_room' && isExplorationVolodkaRoomNpcGlbDisabled(),
    [explorationSceneId],
  );

  /** `definition.scale` × масштаб локации; глобальный ÷5 уже в `resolveCharacterMeshUniformScale` → `bakedVisualScale` в `GLTFLoader`. */
  const effectiveModelScale = useMemo(
    () => (definition.scale ?? 1) * locationModelScale,
    [definition.scale, locationModelScale],
  );
  /** Fallback / impostor без таблицы по URL — тот же глобальный ÷5, что и у числового `effectiveModelScale` вне GLB. */
  const npcPrimitiveExplorationScale = useMemo(
    () => applyExplorationPlayerGlobalVisualScale(effectiveModelScale),
    [effectiveModelScale],
  );

  const { world } = useRapier();
  const npcCharacterControllerRef = useRef<KinematicCharacterController | null>(null);
  const npcCapsule = useMemo(
    () => computePlayerCapsule(Math.max(0.28, Math.min(1.25, effectiveModelScale))),
    [effectiveModelScale],
  );

  /** Без `position` на `RigidBody` Rapier создаёт тело в (0,0,0) — все NPC с физикой слипаются в центре комнаты. */
  const npcRigidSpawn = useMemo((): [number, number, number] => {
    const p = scheduleEntry ? scheduleEntry.position : state.position;
    return [p.x, p.y, p.z];
  }, [scheduleEntry, state.position.x, state.position.y, state.position.z]);

  const groupRef = useRef<THREE.Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'walk' | 'talk'>('idle');

  // Используем ref для позиции вместо useState - avoids re-renders every frame
  const currentPositionRef = useRef(state.position);
  /** Целевая позиция до KCC; `useBeforePhysicsStep` читает её до того, как `useFrame` успевает обновить `currentPositionRef`. */
  const npcKccIntentRef = useRef({
    x: state.position.x,
    y: state.position.y,
    z: state.position.z,
  });
  const currentTargetIndex = useRef(state.currentWaypoint);
  const waitTime = useRef(0);
  const isWaiting = useRef(false);
  const lastStateChangeTime = useRef(0);
  const wasNearPlayer = useRef(false);
  const lodFullModelRef = useRef(true);
  /** Сглаженная XZ-дистанция для `resolveNpcModelLodUseFull` (сбрасывается в `forceFull`). */
  const lodDistanceSmoothRef = useRef<number | null>(null);
  const [useFullModel, setUseFullModel] = useState(true);
  // Ref для текущей анимации - чтобы не вызывать setState каждый кадр
  const currentAnimationRef = useRef<'idle' | 'walk' | 'talk'>('idle');
  const navCornersRef = useRef<{ x: number; z: number }[]>([]);
  const navCornerIdxRef = useRef(0);
  const navGoalKeyRef = useRef('');
  const npcPlanarSpeedMpsRef = useRef(0);

  // Хелпер для установки анимации без лишних перерендеров
  const setAnimation = useCallback((anim: 'idle' | 'walk' | 'talk') => {
    if (currentAnimationRef.current !== anim) {
      currentAnimationRef.current = anim;
      setCurrentAnimation(anim);
    }
  }, []);

  useLayoutEffect(() => {
    if (!enableNpcPhysics || !rigidBodyRef.current) return;
    const p = scheduleEntry?.position ?? state.position;
    /** Снап расписания: только следующий kinematic-шаг — без `setTranslation` в KCC-петле. */
    rigidBodyRef.current.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
    npcKccIntentRef.current = { x: p.x, y: p.y, z: p.z };
    currentPositionRef.current = { x: p.x, y: p.y, z: p.z };
  }, [enableNpcPhysics, scheduleEntry, state.position.x, state.position.y, state.position.z]);

  useEffect(() => {
    if (!enableNpcPhysics) return;
    const cc = createExplorationKinematicCharacterController(world);
    npcCharacterControllerRef.current = cc;
    return () => {
      world.removeCharacterController(cc);
      npcCharacterControllerRef.current = null;
    };
  }, [world, enableNpcPhysics]);

  useBeforePhysicsStep(() => {
    if (!enableNpcPhysics) return;
    const rb = rigidBodyRef.current;
    const cc = npcCharacterControllerRef.current;
    if (!rb || !cc) return;
    const n = rb.numColliders();
    if (n < 1) return;
    const collider = rb.collider(0);
    const t0 = rb.translation();
    const target = npcKccIntentRef.current;
    const dx = target.x - t0.x;
    const dy = target.y - t0.y;
    const dz = target.z - t0.z;
    cc.computeColliderMovement(collider, { x: dx, y: dy, z: dz });
    const m = cc.computedMovement();
    const nx = t0.x + m.x;
    const ny = t0.y + m.y;
    const nz = t0.z + m.z;
    rb.setNextKinematicTranslation({ x: nx, y: ny, z: nz });
    currentPositionRef.current = { x: nx, y: ny, z: nz };
  });

  const syncWorldPosition = useCallback(
    (p: { x: number; y: number; z: number }) => {
      if (enableNpcPhysics) {
        // Целевая позиция в `currentPositionRef` выставляется в `useFrame`; сдвиг тела — KCC в `useBeforePhysicsStep`.
        return;
      }
      if (groupRef.current) {
        groupRef.current.position.set(p.x, p.y, p.z);
      }
    },
    [enableNpcPhysics],
  );

  useFrame((_, delta) => {
    npcPlanarSpeedMpsRef.current = 0;
    const live = playerPositionRef?.current;
    const px = live?.x ?? playerPosition.x;
    const pz = live?.z ?? playerPosition.z;

    if (enableNpcPhysics && rigidBodyRef.current) {
      const tr = rigidBodyRef.current.translation();
      currentPositionRef.current = { x: tr.x, y: tr.y, z: tr.z };
    }

    const posForLod = scheduleEntry ? scheduleEntry.position : currentPositionRef.current;
    const dLodRaw = Math.hypot(px - posForLod.x, pz - posForLod.z);
    const forceFullLod = Boolean(isDialogueActive || !definition.modelPath);
    if (forceFullLod) {
      lodDistanceSmoothRef.current = null;
    }
    const dLod = forceFullLod
      ? dLodRaw
      : (() => {
          const sm = smoothNpcLodDistanceForHysteresis(lodDistanceSmoothRef.current, dLodRaw, delta);
          lodDistanceSmoothRef.current = sm.store;
          return sm.value;
        })();
    const nextLodFull = resolveNpcModelLodUseFull({
      wasFull: lodFullModelRef.current,
      distanceXZ: dLod,
      forceFull: forceFullLod,
    });
    if (nextLodFull !== lodFullModelRef.current) {
      lodFullModelRef.current = nextLodFull;
      setUseFullModel(nextLodFull);
    }

    if (scheduleEntry) {
      const p = scheduleEntry.position;
      if (enableNpcPhysics) {
        const rb = rigidBodyRef.current;
        if (rb) {
          const t = rb.translation();
          const dx = p.x - t.x;
          const dy = p.y - t.y;
          const dz = p.z - t.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist <= NPC_SCHEDULE_KCC_SNAP_M) {
            npcKccIntentRef.current = { x: p.x, y: p.y, z: p.z };
          } else {
            const maxStep = NPC_SCHEDULE_KCC_MAX_SPEED_MPS * delta;
            const k = Math.min(1, maxStep / dist);
            npcKccIntentRef.current = {
              x: t.x + dx * k,
              y: t.y + dy * k,
              z: t.z + dz * k,
            };
          }
        } else {
          npcKccIntentRef.current = { x: p.x, y: p.y, z: p.z };
        }
      } else {
        currentPositionRef.current = { x: p.x, y: p.y, z: p.z };
        syncWorldPosition(p);
      }

      const dx = px - p.x;
      const dz = pz - p.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const near = distance < 3;
      if (near !== wasNearPlayer.current) {
        wasNearPlayer.current = near;
        setIsNearPlayer(near);
      }

      if (isDialogueActive) {
        setAnimation('talk');
        return;
      }

      if (near && modelRef.current) {
        const targetRotation = Math.atan2(dx, dz);
        modelRef.current.rotation.y = THREE.MathUtils.lerp(
          modelRef.current.rotation.y,
          targetRotation,
          0.1,
        );
        setAnimation('idle');
        return;
      }

      setAnimation('idle');
      const now = Date.now();
      if (onStateChange && now - lastStateChangeTime.current > 1000) {
        lastStateChangeTime.current = now;
        onStateChange({
          ...state,
          position:
            enableNpcPhysics && rigidBodyRef.current
              ? (() => {
                  const t = rigidBodyRef.current!.translation();
                  return { x: t.x, y: t.y, z: t.z };
                })()
              : currentPositionRef.current,
          currentWaypoint: currentTargetIndex.current,
        });
      }
      return;
    }

    const pos = currentPositionRef.current;
    syncWorldPosition(pos);

    // Проверка дистанции до игрока (без useEffect/setTimeout)
    const dx = px - pos.x;
    const dz = pz - pos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const near = distance < 3;

    // Обновляем isNearPlayer только при изменении
    if (near !== wasNearPlayer.current) {
      wasNearPlayer.current = near;
      setIsNearPlayer(near);
    }

    if (isDialogueActive) {
      setAnimation('talk');
      return;
    }

    // Поворот к игроку когда рядом
    if (near && modelRef.current) {
      const targetRotation = Math.atan2(dx, dz);

      modelRef.current.rotation.y = THREE.MathUtils.lerp(
        modelRef.current.rotation.y,
        targetRotation,
        0.1
      );

      setAnimation('idle');
      return;
    }

    // Патрулирование по точкам
    const waypoints = definition.waypoints;
    if (waypoints && waypoints.length > 0) {
      if (isWaiting.current) {
        waitTime.current -= delta;
        if (waitTime.current <= 0) {
          isWaiting.current = false;
          currentTargetIndex.current = (currentTargetIndex.current + 1) % waypoints.length;
        }
        setAnimation('idle');
        return;
      }

      const target = waypoints[currentTargetIndex.current];
      const distX = target.x - pos.x;
      const distZ = target.z - pos.z;
      const distanceToTarget = Math.sqrt(distX * distX + distZ * distZ);

      if (distanceToTarget < 0.5) {
        navCornersRef.current = [];
        navCornerIdxRef.current = 0;
        navGoalKeyRef.current = '';
        isWaiting.current = true;
        waitTime.current = 2 + Math.random() * 3;
        setAnimation('idle');
        if (enableNpcPhysics && rigidBodyRef.current) {
          const t = rigidBodyRef.current.translation();
          npcKccIntentRef.current = { x: t.x, y: t.y, z: t.z };
        }
      } else {
        const goalKey = `${currentTargetIndex.current}:${target.x}:${target.z}`;
        if (findNavPath && navGoalKeyRef.current !== goalKey) {
          navGoalKeyRef.current = goalKey;
          const path = findNavPath({ x: pos.x, z: pos.z }, { x: target.x, z: target.z }, pos.y);
          if (path && path.length > 0) {
            navCornersRef.current = path;
            navCornerIdxRef.current = 0;
          } else {
            navCornersRef.current = [];
            navCornerIdxRef.current = 0;
          }
        }

        let dirX = distX / distanceToTarget;
        let dirZ = distZ / distanceToTarget;

        if (findNavPath && navCornersRef.current.length > 0) {
          let idx = navCornerIdxRef.current;
          let corner = navCornersRef.current[idx];
          let dx2 = corner.x - pos.x;
          let dz2 = corner.z - pos.z;
          let d2 = Math.hypot(dx2, dz2);
          while (d2 < 0.38 && idx < navCornersRef.current.length - 1) {
            idx += 1;
            corner = navCornersRef.current[idx];
            dx2 = corner.x - pos.x;
            dz2 = corner.z - pos.z;
            d2 = Math.hypot(dx2, dz2);
          }
          navCornerIdxRef.current = idx;
          if (d2 > 1e-4) {
            dirX = dx2 / d2;
            dirZ = dz2 / d2;
          }
        }

        const npcSpeed = 1.5 * locationLocomotionScale * delta;
        const vx = dirX * npcSpeed;
        const vz = dirZ * npcSpeed;
        npcPlanarSpeedMpsRef.current = Math.hypot(vx, vz) / Math.max(delta, 1e-6);

        const nextPos = {
          x: pos.x + vx,
          y: pos.y,
          z: pos.z + vz,
        };
        if (enableNpcPhysics) {
          npcKccIntentRef.current = nextPos;
        } else {
          currentPositionRef.current = nextPos;
        }

        setAnimation('walk');

        if (modelRef.current) {
          const targetRotation = Math.atan2(dirX, dirZ);
          modelRef.current.rotation.y = THREE.MathUtils.lerp(
            modelRef.current.rotation.y,
            targetRotation,
            0.2
          );
        }
      }
    } else if (definition.patrolRadius) {
      if (isWaiting.current) {
        waitTime.current -= delta;
        if (waitTime.current <= 0) {
          isWaiting.current = false;
        }
        setAnimation('idle');
        return;
      }

      // Случайное движение в радиусе
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * definition.patrolRadius;
      const targetX = definition.defaultPosition.x + Math.cos(angle) * dist;
      const targetZ = definition.defaultPosition.z + Math.sin(angle) * dist;

      const distX = targetX - pos.x;
      const distZ = targetZ - pos.z;
      const distanceToTarget = Math.sqrt(distX * distX + distZ * distZ);

      if (distanceToTarget > 0.5) {
        const npcSpeed = 1.0 * locationLocomotionScale * delta;
        const vx = (distX / distanceToTarget) * npcSpeed;
        const vz = (distZ / distanceToTarget) * npcSpeed;
        npcPlanarSpeedMpsRef.current = Math.hypot(vx, vz) / Math.max(delta, 1e-6);

        const nextPos = {
          x: pos.x + vx,
          y: pos.y,
          z: pos.z + vz,
        };
        if (enableNpcPhysics) {
          npcKccIntentRef.current = nextPos;
        } else {
          currentPositionRef.current = nextPos;
        }

        setAnimation('walk');

        if (modelRef.current) {
          const targetRotation = Math.atan2(distX, distZ);
          modelRef.current.rotation.y = THREE.MathUtils.lerp(
            modelRef.current.rotation.y,
            targetRotation,
            0.2
          );
        }
      } else {
        isWaiting.current = true;
        waitTime.current = 1 + Math.random() * 2;
        setAnimation('idle');
        if (enableNpcPhysics && rigidBodyRef.current) {
          const t = rigidBodyRef.current.translation();
          npcKccIntentRef.current = { x: t.x, y: t.y, z: t.z };
        }
      }
    } else {
      setAnimation('idle');
    }

    // Вызываем onStateChange не каждый кадр, а раз в секунду
    const now = Date.now();
    if (onStateChange && now - lastStateChangeTime.current > 1000) {
      lastStateChangeTime.current = now;
      onStateChange({
        ...state,
        position:
          enableNpcPhysics && rigidBodyRef.current
            ? (() => {
                const t = rigidBodyRef.current!.translation();
                return { x: t.x, y: t.y, z: t.z };
              })()
            : currentPositionRef.current,
        currentWaypoint: currentTargetIndex.current,
      });
    }
  });

  const fallbackModel = useMemo(
    () => (
      <FallbackNPCModel
        modelType={definition.model}
        isNearPlayer={isNearPlayer}
        isDialogueActive={isDialogueActive}
      />
    ),
    [definition.model, isNearPlayer, isDialogueActive]
  );

  const activityIcon = scheduleActivityIcon(scheduleEntry);

  const questSlice = useGameStore(
    useShallow((s) => ({
      activeQuestIds: s.activeQuestIds,
      completedQuestIds: s.completedQuestIds,
      questProgress: s.questProgress,
      flags: s.playerState.flags,
    })),
  );

  const questMarker = useMemo(
    () => getNpcQuestMarkerForExploration(definition.id, questSlice),
    [definition.id, questSlice],
  );

  const questGlyph =
    questMarker === 'none'
      ? null
      : questMarker === 'available'
        ? '!'
        : questMarker === 'in_progress'
          ? '…'
          : '?';

  const nameplate = (
    <Html
      position={[0, 2.18, 0]}
      center
      distanceFactor={5.5}
      zIndexRange={[50, 200]}
      style={{
        opacity: isNearPlayer ? 1 : 0.92,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0, 0, 0, 0.78)',
          color: isDialogueActive ? '#fbbf24' : '#fff',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          border: isDialogueActive ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>
          {activityIcon}
        </span>
        {questGlyph != null &&
          (questMarker === 'available' ? (
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.35, ease: 'easeInOut' }}
              style={{
                fontSize: 15,
                fontWeight: 900,
                lineHeight: 1,
                color: '#facc15',
              }}
              aria-hidden
            >
              {questGlyph}
            </motion.span>
          ) : (
            <span
              style={{
                fontSize: 15,
                fontWeight: 900,
                lineHeight: 1,
                color:
                  questMarker === 'turn_in'
                    ? '#fbbf24'
                    : questMarker === 'in_progress'
                      ? '#9ca3af'
                      : '#e5e7eb',
              }}
              aria-hidden
            >
              {questGlyph}
            </span>
          ))}
        <span>{definition.name}</span>
      </div>
    </Html>
  );

  const body = (
    <>
      <group ref={modelRef}>
        {definition.modelPath && !volodkaDebugHumanoidOnly ? (
          <>
            {/*
              Не `{useFullModel && <GLB />}`: при каждом переключении LOD модель размонтировалась бы и монтировалась заново (useGLTF / скины).
              Оба варианта в сцене; видимость — через `visible` на группах.
            */}
            <group visible={useFullModel}>
              <Suspense fallback={fallbackModel}>
                <ModelErrorBoundary fallback={fallbackModel}>
                  <GLTFModel
                    modelPath={definition.modelPath}
                    roomModelScale={locationModelScale}
                    definitionModelScale={definition.scale ?? 1}
                    explorationSceneId={explorationSceneId ?? 'volodka_room'}
                    isNearPlayer={isNearPlayer}
                    isDialogueActive={isDialogueActive}
                    fallback={fallbackModel}
                    npcAnimation={currentAnimation}
                    animations={definition.animations}
                    planarSpeedMpsRef={npcPlanarSpeedMpsRef}
                  />
                </ModelErrorBoundary>
              </Suspense>
            </group>
            <group visible={!useFullModel}>
              <NpcDistanceImpostor scale={npcPrimitiveExplorationScale} />
            </group>
          </>
        ) : (
          <group scale={npcPrimitiveExplorationScale}>{fallbackModel}</group>
        )}
      </group>

      {isNearPlayer && !isDialogueActive && (
        <group position={[0, 2.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}

      {nameplate}
    </>
  );

  if (enableNpcPhysics) {
    return (
      <RigidBody
        ref={rigidBodyRef}
        position={npcRigidSpawn}
        type="kinematicPosition"
        colliders={false}
        userData={{ isNPC: true }}
      >
        <CapsuleCollider
          args={[npcCapsule.halfH, npcCapsule.r]}
          position={[0, npcCapsule.capCenterY, 0]}
        />
        {body}
      </RigidBody>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[state.position.x, state.position.y, state.position.z]}
      userData={{ isNPC: true }}
    >
      {body}
    </group>
  );
});

// ============================================
// СИСТЕМА NPC
// ============================================

interface NPCSystemProps {
  npcs: NPCDefinition[];
  npcStates: Record<string, NPCState>;
  playerPosition: { x: number; y: number; z: number };
  playerPositionRef?: RefObject<{ x: number; y: number; z: number; rotation?: number } | null>;
  onNPCInteraction: (npcId: string) => void;
  onNPCStateChange: (npcId: string, state: NPCState) => void;
  isDialogueActive: boolean;
  currentSceneId: SceneId;
  timeOfDay: number;
  /** См. `getExplorationNpcModelScale` в `config/scenes`. */
  locationModelScale?: number;
  /** См. `getExplorationLocomotionScale`. */
  locationLocomotionScale?: number;
  /**
   * Включить Rapier KCC для NPC. Со `scheduleEntry` цель к слоту сглаживается по скорости, чтобы не
   * конфликтовать с коллизиями; чисто статичные персонажи по расписанию можно оставить с `false`.
   */
  enableNpcPhysics?: boolean;
  findNavPath?: FindNavPathXZ | null;
}

export const NPCSystem = memo(function NPCSystem({
  npcs,
  npcStates,
  playerPosition,
  playerPositionRef,
  onNPCInteraction,
  onNPCStateChange,
  isDialogueActive,
  currentSceneId,
  timeOfDay,
  locationModelScale = 1,
  locationLocomotionScale = 1,
  enableNpcPhysics = false,
  findNavPath = null,
}: NPCSystemProps) {
  const visibleNpcs = useMemo(() => {
    return npcs.filter((npc) => {
      const entry = getCurrentScheduleEntry(npc.id, timeOfDay);
      if (!entry) return true;
      return entry.sceneId === currentSceneId;
    });
  }, [npcs, timeOfDay, currentSceneId]);

  return (
    <>
      {visibleNpcs.map((npcDef) => {
        const state = npcStates[npcDef.id] || {
          id: npcDef.id,
          position: npcDef.defaultPosition,
          rotation: 0,
          currentWaypoint: 0,
          isInteracting: false,
          dialogueHistory: [],
          lastInteractionTime: 0,
        };

        const scheduleEntry = getCurrentScheduleEntry(npcDef.id, timeOfDay);

        return (
          <NPC
            key={npcDef.id}
            definition={npcDef}
            state={state}
            playerPosition={playerPosition}
            playerPositionRef={playerPositionRef}
            onInteraction={onNPCInteraction}
            onStateChange={(newState) => onNPCStateChange(npcDef.id, newState)}
            isDialogueActive={isDialogueActive}
            locationModelScale={locationModelScale}
            locationLocomotionScale={locationLocomotionScale}
            scheduleEntry={scheduleEntry}
            enableNpcPhysics={enableNpcPhysics}
            findNavPath={findNavPath}
            explorationSceneId={currentSceneId}
          />
        );
      })}
    </>
  );
});

export default NPC;
