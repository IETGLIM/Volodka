"use client";

import React, { useRef, useState, useMemo, memo, Suspense, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AnimationMapping, NPCDefinition, NPCState } from '@/data/rpgTypes';
import { rewriteLegacyModelPath } from '@/config/modelUrls';

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

// Внутренний компонент для рендера загруженной модели
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
  scale,
  isNearPlayer,
  isDialogueActive,
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
    return () => {
      useGLTF.clear(modelPath);
    };
  }, [modelPath]);

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
    />
  );
});

const GLTFModel = memo(function GLTFModel({
  modelPath,
  scale = 1,
  isNearPlayer,
  isDialogueActive,
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
  onInteraction: (npcId: string) => void;
  onStateChange: (state: NPCState) => void;
  isDialogueActive: boolean;
}

export const NPC = memo(function NPC({
  definition,
  state,
  playerPosition,
  onInteraction,
  onStateChange,
  isDialogueActive,
}: NPCProps) {
  const groupRef = useRef<THREE.Group>(null);
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
  // Ref для текущей анимации - чтобы не вызывать setState каждый кадр
  const currentAnimationRef = useRef<'idle' | 'walk' | 'talk'>('idle');

  // Хелпер для установки анимации без лишних перерендеров
  const setAnimation = useCallback((anim: 'idle' | 'walk' | 'talk') => {
    if (currentAnimationRef.current !== anim) {
      currentAnimationRef.current = anim;
      setCurrentAnimation(anim);
    }
  }, []);

  useFrame((_, delta) => {
    // Обновляем позицию группы напрямую через ref (без перерендера)
    const pos = currentPositionRef.current;
    if (groupRef.current) {
      groupRef.current.position.set(pos.x, pos.y, pos.z);
    }

    // Проверка дистанции до игрока (без useEffect/setTimeout)
    const dx = playerPosition.x - pos.x;
    const dz = playerPosition.z - pos.z;
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
        isWaiting.current = true;
        waitTime.current = 2 + Math.random() * 3;
        setAnimation('idle');
      } else {
        const npcSpeed = 1.5 * delta;
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
        const npcSpeed = 1.0 * delta;
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

  return (
    <group ref={groupRef} position={[state.position.x, state.position.y, state.position.z]}>
      <group ref={modelRef}>
        {definition.modelPath ? (
          <Suspense fallback={fallbackModel}>
            <ModelErrorBoundary fallback={fallbackModel}>
              <GLTFModel
                modelPath={definition.modelPath}
                scale={definition.scale || 1}
                isNearPlayer={isNearPlayer}
                isDialogueActive={isDialogueActive}
                fallback={fallbackModel}
                npcAnimation={currentAnimation}
                animations={definition.animations}
              />
            </ModelErrorBoundary>
          </Suspense>
        ) : (
          fallbackModel
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

      <Html
        position={[0, 2.0, 0]}
        center
        style={{
          opacity: isNearPlayer ? 1 : 0.7,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: isDialogueActive ? '#fbbf24' : '#fff',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          border: isDialogueActive ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
        }}>
          {definition.name}
        </div>
      </Html>
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
  onNPCInteraction: (npcId: string) => void;
  onNPCStateChange: (npcId: string, state: NPCState) => void;
  isDialogueActive: boolean;
}

export const NPCSystem = memo(function NPCSystem({
  npcs,
  npcStates,
  playerPosition,
  onNPCInteraction,
  onNPCStateChange,
  isDialogueActive,
}: NPCSystemProps) {
  return (
    <>
      {npcs.map((npcDef) => {
        const state = npcStates[npcDef.id] || {
          id: npcDef.id,
          position: npcDef.defaultPosition,
          rotation: 0,
          currentWaypoint: 0,
          isInteracting: false,
          dialogueHistory: [],
          lastInteractionTime: 0,
        };

        return (
          <NPC
            key={npcDef.id}
            definition={npcDef}
            state={state}
            playerPosition={playerPosition}
            onInteraction={onNPCInteraction}
            onStateChange={(newState) => onNPCStateChange(npcDef.id, newState)}
            isDialogueActive={isDialogueActive}
          />
        );
      })}
    </>
  );
});

export default NPC;
