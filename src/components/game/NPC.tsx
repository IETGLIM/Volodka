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
  type RefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import * as THREE from 'three';
import type { AnimationMapping, NPCDefinition, NPCState } from '@/data/rpgTypes';
import type { SceneId } from '@/data/types';
import type { ScheduleEntry } from '@/shared/types/schedule';
import { rewriteLegacyModelPath } from '@/config/modelUrls';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { useGameStore } from '@/store/gameStore';
import { getNpcQuestMarkerForExploration } from '@/lib/npcQuestMarker';
import { retainGltfModelUrl, releaseGltfModelUrl } from '@/lib/gltfModelCache';
import type { FindNavPathXZ } from '@/lib/explorationNavMesh';

/** Дальше — упрощённая болванка вместо GLB (меньше полигоналки и скинов). */
const NPC_LOD_FULL_IN_M = 12;
const NPC_LOD_IMPOSTOR_OUT_M = 17;

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

interface GLTFModelProps {
  modelPath: string;
  scale?: number;
  isNearPlayer: boolean;
  isDialogueActive: boolean;
  /** `mid` — дальше порога: меши GLB не отбрасывают тень (дешевле для GPU). */
  shadowTier: 'near' | 'mid';
  fallback: React.ReactNode;
  npcAnimation: 'idle' | 'walk' | 'talk';
  animations?: AnimationMapping;
}

const DEFAULT_ANIMATIONS = {
  idle: 'Idle',
  walk: 'Walk',
  talk: 'Talk',
};

function resolveNpcAnimationClip(
  actionKeys: string[],
  mapping?: AnimationMapping
): { idle: string; walk: string | null; talk: string | null } {
  const has = (name?: string) => Boolean(name && actionKeys.includes(name));

  const idle =
    (has(mapping?.idle) ? mapping!.idle : undefined) ??
    (actionKeys.includes(DEFAULT_ANIMATIONS.idle) ? DEFAULT_ANIMATIONS.idle : undefined) ??
    actionKeys.find((k) => k.toLowerCase().includes('idle')) ??
    actionKeys[0];

  const walk =
    (has(mapping?.walk) ? mapping!.walk : undefined) ??
    (has(mapping?.run) ? mapping!.run : undefined) ??
    (actionKeys.includes(DEFAULT_ANIMATIONS.walk) ? DEFAULT_ANIMATIONS.walk : undefined) ??
    actionKeys.find((k) => {
      const l = k.toLowerCase();
      return l.includes('walk') || l.includes('run');
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

  return { idle, walk, talk };
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

/** Клон сцены из `loadedScene.clone(true)` — освобождаем GPU при смене URL или размонтировании. */
function disposeNpcGltfCloneResources(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh & { isMesh?: boolean };
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      for (const m of mat) m.dispose();
    } else if (mat && typeof (mat as THREE.Material).dispose === 'function') {
      (mat as THREE.Material).dispose();
    }
  });
}

// Внутренний компонент для рендера загруженной модели
const GLTFModelInner = memo(function GLTFModelInner({
  groupRef,
  scene,
  scale,
  isNearPlayer,
  isDialogueActive,
  shadowTier,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  scene: THREE.Group;
  scale: number | undefined;
  isNearPlayer: boolean;
  isDialogueActive: boolean;
  shadowTier: 'near' | 'mid';
}) {
  useLayoutEffect(() => {
    const cast = shadowTier === 'near';
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = cast;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, shadowTier]);

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
  scale,
  isNearPlayer,
  isDialogueActive,
  shadowTier,
  fallback,
  npcAnimation,
  animations: animMapping,
}: Omit<GLTFModelProps, 'fallback'> & { fallback: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: loadedScene, animations } = useGLTF(modelPath) as {
    scene: THREE.Group;
    animations?: THREE.AnimationClip[];
  };
  const { actions } = useAnimations(animations ?? [], groupRef);
  const [currentClipName, setCurrentClipName] = useState<string | null>(null);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    retainGltfModelUrl(modelPath);
    return () => releaseGltfModelUrl(modelPath);
  }, [modelPath]);

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

  const scene = useMemo(() => {
    if (!loadedScene) return null;
    try {
      const clone = loadedScene.clone(true);
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return clone;
    } catch {
      return null;
    }
  }, [loadedScene]);

  useEffect(() => {
    if (!scene) return;
    return () => {
      disposeNpcGltfCloneResources(scene);
    };
  }, [scene]);

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    const actionKeys = Object.keys(actions).filter((k) => actions[k]);
    if (actionKeys.length === 0) return;

    const resolved = resolveNpcAnimationClip(actionKeys, animMapping);
    const targetClip =
      npcAnimation === 'walk'
        ? resolved.walk || resolved.idle
        : npcAnimation === 'talk'
          ? resolved.talk || resolved.idle
          : resolved.idle;

    if (!targetClip || !actions[targetClip] || currentClipName === targetClip) return;

    if (currentClipName && actions[currentClipName]) {
      actions[currentClipName].fadeOut(0.2);
    }
    actions[targetClip].reset().fadeIn(0.2).play();
    const timer = setTimeout(() => setCurrentClipName(targetClip), 0);
    return () => clearTimeout(timer);
  }, [actions, animMapping, npcAnimation, currentClipName]);

  if (!scene) {
    return <>{fallback}</>;
  }

  return (
    <GLTFModelInner
      groupRef={groupRef}
      scene={scene}
      scale={scale}
      isNearPlayer={isNearPlayer}
      isDialogueActive={isDialogueActive}
      shadowTier={shadowTier}
    />
  );
});

const GLTFModel = memo(function GLTFModel({
  modelPath,
  scale = 1,
  isNearPlayer,
  isDialogueActive,
  shadowTier,
  fallback,
  npcAnimation,
  animations,
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
        scale={scale}
        isNearPlayer={isNearPlayer}
        isDialogueActive={isDialogueActive}
        shadowTier={shadowTier}
        fallback={fallback}
        npcAnimation={npcAnimation}
        animations={animations}
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
      const t = clock.getElapsedTime();
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
      const t = clock.getElapsedTime();
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
      const t = clock.getElapsedTime();
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
      const t = clock.getElapsedTime();
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
      const t = clock.getElapsedTime();
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
  /** Множитель из `getExplorationCharacterModelScale(currentSceneId)` — адаптация под локацию. */
  locationModelScale?: number;
  /** Множитель скорости патруля; `getExplorationLocomotionScale`. */
  locationLocomotionScale?: number;
  /** Текущее окно расписания для этого NPC (если есть в `ScheduleEngine`). */
  scheduleEntry?: ScheduleEntry | null;
  /** Кинематический RigidBody для телепорта в Rapier-сцене. */
  enableNpcPhysics?: boolean;
  /** Путь по navmesh (three-pathfinding); если нет — прямой бег к waypoint. */
  findNavPath?: FindNavPathXZ | null;
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
}: NPCProps) {
  const effectiveModelScale = useMemo(
    () => (definition.scale ?? 1) * locationModelScale,
    [definition.scale, locationModelScale],
  );

  const groupRef = useRef<THREE.Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'walk' | 'talk'>('idle');

  // Используем ref для позиции вместо useState - avoids re-renders every frame
  const currentPositionRef = useRef(state.position);
  const currentTargetIndex = useRef(state.currentWaypoint);
  const waitTime = useRef(0);
  const isWaiting = useRef(false);
  const lastStateChangeTime = useRef(0);
  const wasNearPlayer = useRef(false);
  const lodFullModelRef = useRef(true);
  const [useFullModel, setUseFullModel] = useState(true);
  const npcShadowTierRef = useRef<'near' | 'mid'>('near');
  const [npcShadowTier, setNpcShadowTier] = useState<'near' | 'mid'>('near');
  // Ref для текущей анимации - чтобы не вызывать setState каждый кадр
  const currentAnimationRef = useRef<'idle' | 'walk' | 'talk'>('idle');
  const navCornersRef = useRef<{ x: number; z: number }[]>([]);
  const navCornerIdxRef = useRef(0);
  const navGoalKeyRef = useRef('');

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
    rigidBodyRef.current.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
  }, [enableNpcPhysics, scheduleEntry, state.position.x, state.position.y, state.position.z]);

  const syncWorldPosition = useCallback(
    (p: { x: number; y: number; z: number }) => {
      if (enableNpcPhysics && rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
      } else if (groupRef.current) {
        groupRef.current.position.set(p.x, p.y, p.z);
      }
    },
    [enableNpcPhysics],
  );

  useFrame((_, delta) => {
    const live = playerPositionRef?.current;
    const px = live?.x ?? playerPosition.x;
    const pz = live?.z ?? playerPosition.z;

    const posForLod = scheduleEntry ? scheduleEntry.position : currentPositionRef.current;
    const dLod = Math.hypot(px - posForLod.x, pz - posForLod.z);
    let nextLodFull = lodFullModelRef.current;
    if (isDialogueActive || !definition.modelPath) {
      nextLodFull = true;
    } else if (dLod < NPC_LOD_FULL_IN_M) {
      nextLodFull = true;
    } else if (dLod > NPC_LOD_IMPOSTOR_OUT_M) {
      nextLodFull = false;
    }
    if (nextLodFull !== lodFullModelRef.current) {
      lodFullModelRef.current = nextLodFull;
      setUseFullModel(nextLodFull);
    }

    let nextShadow: 'near' | 'mid' = npcShadowTierRef.current;
    if (isDialogueActive) {
      nextShadow = 'near';
    } else if (definition.modelPath && lodFullModelRef.current) {
      if (dLod < 4.5) nextShadow = 'near';
      else if (dLod > 6.5) nextShadow = 'mid';
    } else {
      nextShadow = 'near';
    }
    if (nextShadow !== npcShadowTierRef.current) {
      npcShadowTierRef.current = nextShadow;
      setNpcShadowTier(nextShadow);
    }

    if (scheduleEntry) {
      const p = scheduleEntry.position;
      currentPositionRef.current = { x: p.x, y: p.y, z: p.z };
      syncWorldPosition(p);

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
          position: currentPositionRef.current,
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

        currentPositionRef.current = {
          x: pos.x + vx,
          y: pos.y,
          z: pos.z + vz,
        };

        setAnimation('walk');

        if (modelRef.current) {
          const targetRotation = Math.atan2(dirX, dirZ);
          modelRef.current.rotation.y = THREE.MathUtils.lerp(
            modelRef.current.rotation.y,
            targetRotation,
            0.1
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

        // Обновляем позицию напрямую через ref (без setState)
        currentPositionRef.current = {
          x: pos.x + vx,
          y: pos.y,
          z: pos.z + vz,
        };

        setAnimation('walk');

        if (modelRef.current) {
          const targetRotation = Math.atan2(distX, distZ);
          modelRef.current.rotation.y = THREE.MathUtils.lerp(
            modelRef.current.rotation.y,
            targetRotation,
            0.1
          );
        }
      } else {
        isWaiting.current = true;
        waitTime.current = 1 + Math.random() * 2;
        setAnimation('idle');
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
        position: currentPositionRef.current,
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

  const nameplate = (
    <Html
      position={[0, 2.0, 0]}
      center
      style={{
        opacity: isNearPlayer ? 1 : 0.7,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0, 0, 0, 0.7)',
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
        <span>{definition.name}</span>
      </div>
    </Html>
  );

  const body = (
    <>
      <group ref={modelRef}>
        {definition.modelPath && useFullModel ? (
          <Suspense fallback={fallbackModel}>
            <ModelErrorBoundary fallback={fallbackModel}>
              <GLTFModel
                modelPath={definition.modelPath}
                scale={effectiveModelScale}
                isNearPlayer={isNearPlayer}
                isDialogueActive={isDialogueActive}
                shadowTier={npcShadowTier}
                fallback={fallbackModel}
                npcAnimation={currentAnimation}
                animations={definition.animations}
              />
            </ModelErrorBoundary>
          </Suspense>
        ) : definition.modelPath && !useFullModel ? (
          <NpcDistanceImpostor scale={effectiveModelScale} />
        ) : (
          <group scale={effectiveModelScale}>{fallbackModel}</group>
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

      {questMarker !== 'none' && (
        <Html
          position={[0, 2.55, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <motion.div
            animate={{ scale: [1, 1.14, 1] }}
            transition={{ repeat: Infinity, duration: 1.35, ease: 'easeInOut' }}
            style={{
              fontSize: 22,
              fontWeight: 900,
              lineHeight: 1,
              color:
                questMarker === 'turn_in'
                  ? '#fbbf24'
                  : questMarker === 'in_progress'
                    ? '#9ca3af'
                    : '#facc15',
              textShadow: '0 0 8px rgba(0,0,0,0.95)',
              userSelect: 'none',
            }}
          >
            {questMarker === 'available' ? '!' : '?'}
          </motion.div>
        </Html>
      )}
    </>
  );

  if (enableNpcPhysics) {
    return (
      <RigidBody
        ref={rigidBodyRef}
        type="kinematicPosition"
        colliders={false}
        userData={{ isNPC: true }}
      >
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
  /** См. `getExplorationCharacterModelScale` в `config/scenes`. */
  locationModelScale?: number;
  /** См. `getExplorationLocomotionScale`. */
  locationLocomotionScale?: number;
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
          />
        );
      })}
    </>
  );
});

export default NPC;
