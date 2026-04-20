'use client';

import React, { Suspense, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import {
  EXPLORATION_DIRECTIONAL_SHADOW_BIAS,
  EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS,
  EXPLORATION_SHADOW_MAP_DESKTOP,
} from '@/lib/explorationShadowConstants';
import { EffectComposer, Vignette, ChromaticAberration, Bloom, Noise } from '@react-three/postprocessing';
import { Vector2 } from 'three';

// Типы
import type { SceneId } from '@/data/types';
import type { PlayerPosition, NPCState } from '@/data/rpgTypes';

// Компоненты сцены
import { PhysicsSceneColliders } from './PhysicsSceneColliders';
import { PhysicsPlayer } from './PhysicsPlayer';
import FollowCamera from './FollowCamera';
import { ThreeCanvasSuspenseFallback } from '@/components/3d/ThreeCanvasSuspenseFallback';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { NPCSystem } from './NPC';
import { InteractiveObject, PhysicsExplorationRoomVisual } from './RoomEnvironment';
import { useGameStore } from '@/store/gameStore';
import { getExplorationCharacterModelScale, getExplorationLocomotionScale } from '@/config/scenes';
import { isExplorationRapierColliderDebugEnabled } from '@/lib/explorationDiagnostics';

const PhysicsWorldClock = memo(function PhysicsWorldClock() {
  const advanceTime = useGameStore((s) => s.advanceTime);
  useFrame((_, delta) => {
    advanceTime(delta / 48);
  });
  return null;
});

interface NPCConfig {
  id: string;
  name: string;
  model: string;
  modelPath?: string;
  scale?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  basePersonalSpace?: number;
  dialogueTree?: string;
  condition?: { flag: string; value: boolean };
  relationScore?: number;
}
interface InteractiveObjectConfig {
  id: string;
  type: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  poemId?: string;
  pages?: number;
  canBeRead?: boolean;
  hasWheels?: boolean;
}

// ============================================
// ПОСТОБРАБОТКА
// ============================================
const PostProcessingEffects = memo(
  ({
    visualParams,
    panicMode = false,
  }: {
    visualParams: {
      glitchIntensity?: number;
      creativity?: number;
      stability?: number;
    };
    panicMode?: boolean;
  }) => {
    const { glitchIntensity = 0, creativity = 50, stability = 50 } = visualParams;
    const panic = panicMode ? 0.35 : 0;
    const g = Math.min(1.2, glitchIntensity + panic);
    return (
      <EffectComposer>
        <Vignette darkness={0.3 + (1 - stability / 100) * 0.5 + (panicMode ? 0.12 : 0)} eskil={false} />
        <ChromaticAberration offset={new Vector2(g * 0.03, g * 0.012)} />
        <Bloom luminanceThreshold={0.7} intensity={creativity / 100 * 0.8} radius={0.5} />
        <Noise premultiply opacity={Math.max(0, (50 - stability) / 100) * 0.15 + (panicMode ? 0.06 : 0)} />
      </EffectComposer>
    );
  }
);

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================
interface PhysicsGameModeSwitcherProps {
  sceneId: SceneId;
  isExplorationMode: boolean;
  stressLevel?: number;
  panicMode?: boolean;
  visualParams?: {
    glitchIntensity?: number;
    creativity?: number;
    stability?: number;
  };
  playerPosition?: PlayerPosition;
  npcs?: NPCConfig[];
  interactiveObjects?: InteractiveObjectConfig[];
  onNPCRelationChange?: (npcId: string, delta: number) => void;
  onObjectInteract?: (objectId: string, action: string) => void;
  onPlayerPositionChange?: (pos: { x: number; y: number; z: number; rotation?: number }) => void;
  onNPCInteraction?: (npcId: string) => void;
  children?: React.ReactNode;
}

export const PhysicsGameModeSwitcher = memo(function PhysicsGameModeSwitcher({
  sceneId,
  isExplorationMode,
  stressLevel = 0,
  panicMode = false,
  visualParams = {},
  playerPosition = { x: 0, y: 1, z: 3, rotation: 0 },
  npcs = [],
  interactiveObjects = [],
  onObjectInteract,
  onPlayerPositionChange,
  onNPCInteraction,
  children,
}: PhysicsGameModeSwitcherProps) {
  const [npcStates, setNPCStates] = React.useState<Record<string, NPCState>>({});
  const setNPCState = useGameStore((s) => s.setNPCState);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);

  /** Гравитация от стресса/паники — через проп `<Physics gravity>`, без мутации world (совместимо с ESLint). */
  const gravity = useMemo((): [number, number, number] => {
    const s = Math.max(0, Math.min(100, stressLevel));
    const stressFactor = 1 + (s / 100) * 0.22;
    const panicMul = panicMode ? 1.1 : 1;
    return [0, -9.81 * stressFactor * panicMul, 0];
  }, [stressLevel, panicMode]);

  const showPhysicsDebugHelpers = process.env.NEXT_PUBLIC_PHYSICS_DEBUG_HELPERS === '1';
  const rapierColliderDebug = isExplorationRapierColliderDebugEnabled();

  const explorationCharacterModelScale = useMemo(
    () => getExplorationCharacterModelScale(sceneId),
    [sceneId],
  );

  const explorationLocomotionScale = useMemo(
    () => getExplorationLocomotionScale(sceneId),
    [sceneId],
  );

  const handleObjectInteract = React.useCallback((objectId: string) => {
    onObjectInteract?.(objectId, 'interact');
  }, [onObjectInteract]);

  const npcDefinitions = useMemo(() => {
    return npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      model: npc.model as 'elder' | 'barista' | 'colleague' | 'shadow' | 'generic',
      modelPath: npc.modelPath,
      scale: npc.scale,
      defaultPosition: { x: npc.position[0], y: npc.position[1], z: npc.position[2] },
      defaultRotation: npc.rotation ? npc.rotation[1] : 0,
      waypoints: [],
      dialogueTree: npc.dialogueTree || '',
      interactions: [],
      schedule: [],
      sceneId: sceneId,
    }));
  }, [npcs, sceneId]);

  const handleNPCStateChange = React.useCallback(
    (npcId: string, state: NPCState) => {
      setNPCStates((prev) => ({ ...prev, [npcId]: state }));
      setNPCState(npcId, state);
    },
    [setNPCState],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        stencil: false,
        logarithmicDepthBuffer: false,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <PerformanceMonitor />
      <Suspense fallback={<ThreeCanvasSuspenseFallback />}>
        {/* Усиленное освещение */}
        <ambientLight intensity={1.0} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
          castShadow
          shadow-mapSize={[EXPLORATION_SHADOW_MAP_DESKTOP, EXPLORATION_SHADOW_MAP_DESKTOP]}
          shadow-bias={EXPLORATION_DIRECTIONAL_SHADOW_BIAS}
          shadow-normalBias={EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS}
          shadow-camera-far={50}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <pointLight position={[0, 3, 0]} intensity={1.5} />
        <pointLight position={[-3, 2, 2]} intensity={1} />
        <pointLight position={[3, 2, -2]} intensity={1} />

        {showPhysicsDebugHelpers && (
          <>
            <gridHelper args={[20, 20]} position={[0, 0.01, 0]} />
            <axesHelper args={[5]} />
          </>
        )}

        <Physics timeStep={1 / 60} debug={rapierColliderDebug} gravity={gravity}>
          <PhysicsWorldClock />
          <PhysicsSceneColliders sceneId={sceneId} />

          <PhysicsExplorationRoomVisual sceneId={sceneId} />

          {interactiveObjects.map(obj => (
            <InteractiveObject
              key={obj.id}
              position={obj.position}
              size={obj.size || [0.5, 0.5, 0.5]}
              color={obj.color || '#aabbcc'}
              name={obj.id}
              onInteract={() => handleObjectInteract(obj.id)}
              isInteractable={true}
            />
          ))}

          {npcDefinitions.length > 0 && (
            <NPCSystem
              npcs={npcDefinitions as any}
              npcStates={npcStates}
              playerPosition={playerPosition}
              onNPCInteraction={onNPCInteraction || (() => {})}
              onNPCStateChange={handleNPCStateChange}
              isDialogueActive={false}
              currentSceneId={sceneId}
              timeOfDay={timeOfDay}
              locationModelScale={explorationCharacterModelScale}
              locationLocomotionScale={explorationLocomotionScale}
              enableNpcPhysics
            />
          )}

          {isExplorationMode && (
            <>
              <PhysicsPlayer
                position={[playerPosition.x, playerPosition.y, playerPosition.z]}
                modelPath={getDefaultPlayerModelPath()}
                visualModelScale={explorationCharacterModelScale}
                locomotionScale={explorationLocomotionScale}
                onPositionChange={onPlayerPositionChange}
              />
              <FollowCamera
                targetPosition={playerPosition}
                distance={4}
                height={3}
                smoothness={0.08}
                isLocked={false}
                enableCollision={false}
                enableZoom
              />
            </>
          )}

          {children}
        </Physics>

        <PostProcessingEffects visualParams={visualParams} panicMode={panicMode} />
      </Suspense>
    </Canvas>
  );
});

export default PhysicsGameModeSwitcher;
