'use client';

import React, { Suspense, useMemo, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { EffectComposer, Vignette, ChromaticAberration, Bloom, Noise } from '@react-three/postprocessing';
import { Vector2 } from 'three';

// Типы
import type { SceneId } from '@/data/types';
import type { PlayerPosition, NPCState } from '@/data/rpgTypes';

// Компоненты сцены
import { PhysicsSceneColliders } from './PhysicsSceneColliders';
import { Player } from './Player';
import FollowCamera from './FollowCamera';
import { NPCSystem } from './NPC';
import { InteractiveObject, ZaremaAlbertRoom } from './RoomEnvironment';

interface NPCConfig {
  id: string;
  name: string;
  model: string;
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
// ЭМОЦИОНАЛЬНАЯ ГРАВИТАЦИЯ
// ============================================

// Примечание: Компонент отключён из-за конфликта с ESLint правилом react-hooks/immutability
// Гравитация в Rapier world изменяется динамически, что требует прямого доступа к объекту
// из хука. Это легитимное использование, но ESLint считает это нарушением.

const EmotionalGravityController = memo(function EmotionalGravityController(_props: { 
  stressLevel: number 
}) {
  // TODO: Реализовать эмоциональную гравитацию через глобальный сервис
  // или использовать ref-based подход для обхода ESLint ограничений
  return null;
});

// ============================================
// ПОСТОБРАБОТКА
// ============================================
const PostProcessingEffects = memo(({ visualParams }: { visualParams: {
  glitchIntensity?: number;
  creativity?: number;
  stability?: number;
} }) => {
  const { glitchIntensity = 0, creativity = 50, stability = 50 } = visualParams;
  return (
    <EffectComposer>
      <Vignette darkness={0.3 + (1 - stability / 100) * 0.5} eskil={false} />
      <ChromaticAberration offset={new Vector2(glitchIntensity * 0.03, glitchIntensity * 0.01)} />
      <Bloom luminanceThreshold={0.7} intensity={creativity / 100 * 0.8} radius={0.5} />
      <Noise premultiply opacity={Math.max(0, (50 - stability) / 100) * 0.15} />
    </EffectComposer>
  );
});

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
  onPlayerPositionChange?: (pos: { x: number; y: number; z: number }) => void;
  onNPCInteraction?: (npcId: string) => void;
  children?: React.ReactNode;
}

export const PhysicsGameModeSwitcher = memo(function PhysicsGameModeSwitcher({
  sceneId,
  isExplorationMode,
  stressLevel = 0,
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

  const handleObjectInteract = React.useCallback((objectId: string) => {
    onObjectInteract?.(objectId, 'interact');
  }, [onObjectInteract]);

  const npcDefinitions = useMemo(() => {
    return npcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      model: npc.model as 'elder' | 'barista' | 'colleague' | 'shadow' | 'generic',
      defaultPosition: { x: npc.position[0], y: npc.position[1], z: npc.position[2] },
      defaultRotation: npc.rotation ? npc.rotation[1] : 0,
      waypoints: [],
      dialogueTree: npc.dialogueTree || '',
      interactions: [],
      schedule: [],
      sceneId: sceneId,
    }));
  }, [npcs, sceneId]);

  const handleNPCStateChange = React.useCallback((npcId: string, state: NPCState) => {
    setNPCStates(prev => ({ ...prev, [npcId]: state }));
  }, []);

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        {/* Усиленное освещение */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
        <pointLight position={[0, 3, 0]} intensity={1.5} />
        <pointLight position={[-3, 2, 2]} intensity={1} />
        <pointLight position={[3, 2, -2]} intensity={1} />

        {/* Отладочная сетка (можно удалить после проверки) */}
        <gridHelper args={[20, 20]} position={[0, 0.01, 0]} />
        <axesHelper args={[5]} />

        <Physics debug={false} gravity={[0, -9.81, 0]}>
          <EmotionalGravityController stressLevel={stressLevel} />
          <PhysicsSceneColliders sceneId={sceneId} />

          {/* ВРЕМЕННО: всегда рендерим комнату Заремы и Альберта */}
          <ZaremaAlbertRoom />

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
            />
          )}

          {isExplorationMode && (
            <>
              <Player
                position={[playerPosition.x, playerPosition.y, playerPosition.z]}
                onPositionChange={onPlayerPositionChange}
              />
              <FollowCamera
                targetPosition={playerPosition}
                distance={4}
                height={3}
                smoothness={0.08}
                isLocked={false}
                enableCollision={false}
              />
            </>
          )}

          {children}
        </Physics>

        <PostProcessingEffects visualParams={visualParams} />
      </Suspense>
    </Canvas>
  );
});

export default PhysicsGameModeSwitcher;
