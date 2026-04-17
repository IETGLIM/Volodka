"use client";

/**
 * Связывает Rapier, игрока, NPC, триггеры и камеру для свободного 3D-обхода.
 * Ошибки загрузки GLB обрабатываются в `PhysicsPlayer` / `NPCSystem` — здесь дубли не нужны.
 * Ввод: клавиатура (WASD, E); для тач-устройств позже — виртуальный джойстик / кнопка действия.
 */

import { memo, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// Types
import type { 
  VisualState,
  SceneId 
} from '../../data/types';
import type { 
  NPCDefinition,
  NPCState, 
  TriggerState,
} from '../../data/rpgTypes';

// Data
import { getNPCsForScene } from '../../data/npcDefinitions';
import { getTriggersForScene } from '../../data/triggerZones';

// Components
import { PhysicsPlayer } from './PhysicsPlayer';
import FollowCamera from './FollowCamera';
import { NPCSystem } from './NPC';
import { SceneColliderSelector } from './SceneColliders';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { TriggerSystem, isPlayerInTriggerZone } from './InteractiveTrigger';
import CameraEffects from '../CameraEffects';

// Store
import { useGameStore } from '../../store/gameStore';

// ============================================
// TYPES
// ============================================

/** Пол: полные размеры `boxGeometry` [ширина X, толщина Y, глубина Z], центр сцены в начале координат. */
export type RpgGroundGeometryArgs = [number, number, number];

interface RPGGameCanvasProps {
  sceneId: SceneId;
  visualState: VisualState;
  isDialogueActive: boolean;
  onTriggerEnter: (triggerId: string, storyNodeId: string) => void;
  onNPCInteraction: (npcId: string) => void;
  children?: React.ReactNode;
  /** Переопределить размер пола; иначе берётся из конфигурации по `sceneId`. */
  groundGeometryArgs?: RpgGroundGeometryArgs;
}

const GROUND_INDOOR: RpgGroundGeometryArgs = [20, 0.1, 20];
const GROUND_PLAZA: RpgGroundGeometryArgs = [48, 0.1, 48];
const GROUND_OPEN: RpgGroundGeometryArgs = [40, 0.1, 40];

// ============================================
// COMPONENT
// ============================================

const RPGGameCanvas = memo(function RPGGameCanvas({
  sceneId,
  visualState,
  isDialogueActive,
  onTriggerEnter,
  onNPCInteraction,
  children,
  groundGeometryArgs: groundGeometryArgsProp,
}: RPGGameCanvasProps) {
  const [npcStates, setNPCStates] = useState<Record<string, NPCState>>({});
  const [triggerStates, setTriggerStates] = useState<Record<string, TriggerState>>({});
  
  // Получаем ВСЁ состояние напрямую из store (единый источник истины)
  const playerState = useGameStore((state) => state.playerState);
  const playerPosition = useGameStore((state) => state.exploration.playerPosition);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const setNPCState = useGameStore((state) => state.setNPCState);
  
  // Ref для актуального значения playerPosition (избегаем устаревших замыканий)
  const playerPositionRef = useRef(playerPosition);
  useEffect(() => { 
    playerPositionRef.current = playerPosition; 
  }, [playerPosition]);

  // Scene config (свет / туман + размер поля под тип локации; при необходимости — проп `groundGeometryArgs`)
  const sceneConfig = useMemo(() => {
    switch (sceneId) {
      case 'kitchen_night':
      case 'kitchen_dawn':
      case 'home_morning':
      case 'home_evening':
        return { ambient: 0.4, light: '#ffcc00', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR };
      case 'office_morning':
        return { ambient: 0.5, light: '#ffffff', fogColor: '#2a2a3a', groundGeometryArgs: GROUND_INDOOR };
      case 'cafe_evening':
        return { ambient: 0.35, light: '#ffa500', fogColor: '#1a1510', groundGeometryArgs: GROUND_INDOOR };
      case 'rooftop_night':
        return { ambient: 0.15, light: '#4a5568', fogColor: '#0a0a15', groundGeometryArgs: GROUND_OPEN };
      case 'dream':
        return { ambient: 0.3, light: '#a855f7', fogColor: '#1a0a2e', groundGeometryArgs: GROUND_OPEN };
      case 'battle':
        return { ambient: 0.25, light: '#ef4444', fogColor: '#1a0505', groundGeometryArgs: GROUND_OPEN };
      case 'street_winter':
      case 'street_night':
        return { ambient: 0.25, light: '#87ceeb', fogColor: '#0a1020', groundGeometryArgs: GROUND_PLAZA };
      case 'memorial_park':
        return { ambient: 0.35, light: '#ffd9a0', fogColor: '#0a1510', groundGeometryArgs: GROUND_PLAZA };
      default:
        return { ambient: 0.35, light: '#b2bec3', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR };
    }
  }, [sceneId]);

  const groundGeometryArgs = groundGeometryArgsProp ?? sceneConfig.groundGeometryArgs;

  // Get NPCs and triggers for current scene
  const sceneNPCs = useMemo(() => getNPCsForScene(sceneId), [sceneId]);
  const sceneTriggers = useMemo(() => getTriggersForScene(sceneId), [sceneId]);

  // Handle player position changes - сохраняем в store напрямую
  const handlePositionChange = useCallback((pos: { x: number; y: number; z: number }) => {
    setPlayerPosition({ ...pos, rotation: playerPositionRef.current.rotation });
  }, [setPlayerPosition]);

  // Handle NPC state changes
  const handleNPCStateChange = useCallback(
    (npcId: string, state: NPCState) => {
      setNPCStates((prev) => ({ ...prev, [npcId]: state }));
      setNPCState(npcId, state);
    },
    [setNPCState],
  );

  // Handle trigger state changes
  const handleTriggerStateChange = useCallback((triggerId: string, state: TriggerState) => {
    setTriggerStates(prev => ({ ...prev, [triggerId]: state }));
  }, []);

  // Handle trigger enter
  const handleTriggerEnter = useCallback((triggerId: string) => {
    const trigger = sceneTriggers.find(t => t.id === triggerId);
    if (trigger && trigger.storyNodeId) {
      onTriggerEnter(triggerId, trigger.storyNodeId);
    }
  }, [sceneTriggers, onTriggerEnter]);

  // Handle player interaction (E key) — сначала триггер с requiresInteraction в зоне, иначе ближайший NPC
  const handlePlayerInteraction = useCallback(() => {
    if (isDialogueActive) return;
    
    const currentPos = playerPositionRef.current;

    for (const trigger of sceneTriggers) {
      const st = triggerStates[trigger.id] || { id: trigger.id, triggered: false };
      if (st.triggered) continue;
      if (!trigger.requiresInteraction) continue;
      if (!isPlayerInTriggerZone(currentPos, trigger)) continue;
      handleTriggerEnter(trigger.id);
      return;
    }
    
    // Find nearest NPC
    let nearestNPC: NPCDefinition | null = null;
    let nearestDistance = Infinity;
    
    for (const npc of sceneNPCs) {
      const state = npcStates[npc.id];
      const npcPos = state?.position || npc.defaultPosition;
      const dx = currentPos.x - npcPos.x;
      const dz = currentPos.z - npcPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < 3 && distance < nearestDistance) {
        nearestDistance = distance;
        nearestNPC = npc;
      }
    }
    
    if (nearestNPC) {
      onNPCInteraction(nearestNPC.id);
    }
  }, [
    isDialogueActive,
    sceneTriggers,
    triggerStates,
    handleTriggerEnter,
    sceneNPCs,
    npcStates,
    onNPCInteraction,
  ]);

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 5, 8] }}
      style={{ 
        background: sceneConfig.fogColor,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      {/* Physics World */}
      <Physics gravity={[0, -9.81, 0]} debug={false}>
        {/* Пол: размер из sceneConfig или проп `groundGeometryArgs` */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <boxGeometry args={groundGeometryArgs} />
            <meshStandardMaterial color="#3d3436" roughness={0.9} />
          </mesh>
        </RigidBody>
      
        {/* Fog */}
        <fog attach="fog" args={[sceneConfig.fogColor, 8, 25]} />

        {/* Lighting - Усиленное */}
        <ambientLight intensity={sceneConfig.ambient + 0.3} />
        <hemisphereLight args={[sceneConfig.light, '#1a1a1a', 0.8]} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.6}
          color={visualState.colorTint !== 'transparent' ? visualState.colorTint : '#fff'}
          castShadow
          shadow-mapSize={[512, 512]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[0, 4, 3]} intensity={1.2} color={sceneConfig.light} distance={20} />
        <pointLight position={[-3, 2, 0]} intensity={0.6} color={sceneConfig.light} distance={15} />
        <pointLight position={[3, 2, 0]} intensity={0.6} color={sceneConfig.light} distance={15} />

        {/* Scene Colliders */}
        <SceneColliderSelector sceneId={sceneId} />

        {/* Visual Scene Elements */}
        {children}

        <PhysicsPlayer
          position={[playerPosition.x, playerPosition.y, playerPosition.z]}
          modelPath={getDefaultPlayerModelPath()}
          onPositionChange={handlePositionChange}
          onInteraction={handlePlayerInteraction}
          isLocked={isDialogueActive}
        />

        {/* NPCs */}
        <NPCSystem
          npcs={sceneNPCs}
          npcStates={npcStates}
          playerPosition={playerPosition}
          onNPCInteraction={onNPCInteraction}
          onNPCStateChange={handleNPCStateChange}
          isDialogueActive={isDialogueActive}
        />

        {/* Triggers */}
        <TriggerSystem
          triggers={sceneTriggers}
          triggerStates={triggerStates}
          playerPositionRef={playerPositionRef}
          currentSceneId={sceneId}
          onTriggerEnter={handleTriggerEnter}
          onTriggerStateChange={handleTriggerStateChange}
        />

        <FollowCamera
          targetPosition={playerPosition}
          distance={8}
          height={5}
          smoothness={0.08}
          isLocked={isDialogueActive}
          enableCollision
          enableZoom
        />

        {/* Camera Effects */}
        <CameraEffects
          stress={playerState.stress}
          panicMode={playerState.panicMode}
          stability={playerState.stability}
          creativity={playerState.creativity}
        />
      </Physics>
    </Canvas>
  );
});

export { RPGGameCanvas };
export type { RPGGameCanvasProps };
