"use client";

/**
 * Связывает Rapier, игрока, NPC, триггеры и камеру для свободного 3D-обхода.
 * Ошибки загрузки GLB обрабатываются в `PhysicsPlayer` / `NPCSystem` — здесь дубли не нужны.
 * Ввод: клавиатура (WASD, E); для тач-устройств позже — виртуальный джойстик / кнопка действия.
 */

import { memo, useRef, useEffect, useMemo, useCallback, useState, Fragment, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
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
import {
  getInteractiveObjectsForScene,
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  type InteractiveObjectConfig,
} from '@/config/scenes';

// Components
import { PhysicsPlayer } from './PhysicsPlayer';
import FollowCamera from './FollowCamera';
import { NPCSystem } from './NPC';
import { SceneColliderSelector } from './SceneColliders';
import { PhysicsSceneColliders } from './PhysicsSceneColliders';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { TriggerSystem, isPlayerInTriggerZone } from './InteractiveTrigger';
import CameraEffects from '../CameraEffects';

// Store
import { useGameStore } from '../../store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { ExplorationPostFX } from '@/components/game/exploration/ExplorationPostFX';
import { ExplorationParticles } from '@/components/game/exploration/ExplorationParticles';
import { ExplorationFootprints } from '@/components/game/exploration/ExplorationFootprints';
import { PanelDistrictBuildings } from '@/components/game/exploration/PanelDistrictBuildings';
import { ExplorationFrameStats, useExplorationFrameStatsEnabled } from '@/components/game/exploration/ExplorationFrameStats';
import { ExplorationMobileHud } from './ExplorationMobileHud';
import { RadialMenu, type RadialMenuAction } from './RadialMenu';
import { getNearestInteractiveObject } from './InteractiveTriggers';
import type { PlayerControls } from '@/hooks/useGamePhysics';
import { createFloorNavPathfinder } from '@/lib/explorationNavMesh';
import { BattleClickLayer } from './BattleClickLayer';
import { VolodkaCorridorVisual } from './exploration/VolodkaCorridorVisual';
import { VolodkaRoomVisual } from './exploration/VolodkaRoomVisual';
import { HomeEveningVisual } from './exploration/HomeEveningVisual';

// ============================================
// TYPES
// ============================================

/** Пол: полные размеры `boxGeometry` [ширина X, толщина Y, глубина Z], центр сцены в начале координат. */
export type RpgGroundGeometryArgs = [number, number, number];

interface RPGGameCanvasProps {
  sceneId: SceneId;
  visualState: VisualState;
  isDialogueActive: boolean;
  onTriggerEnter: (triggerId: string, storyNodeId?: string, cutsceneId?: string) => void;
  onNPCInteraction: (npcId: string) => void;
  children?: React.ReactNode;
  /** Переопределить размер пола; иначе берётся из конфигурации по `sceneId`. */
  groundGeometryArgs?: RpgGroundGeometryArgs;
}

const GROUND_INDOOR: RpgGroundGeometryArgs = [20, 0.1, 20];
const GROUND_VOLODKA_ROOM: RpgGroundGeometryArgs = [14, 0.1, 10];
const GROUND_VOLODKA_CORRIDOR: RpgGroundGeometryArgs = [3.5, 0.1, 12];
const GROUND_PLAZA: RpgGroundGeometryArgs = [48, 0.1, 48];
const GROUND_OPEN: RpgGroundGeometryArgs = [40, 0.1, 40];

/** Тик игрового времени суток внутри `<Canvas>` (useFrame допустим только здесь). */
const ExplorationWorldClock = memo(function ExplorationWorldClock() {
  const advanceTime = useGameStore((s) => s.advanceTime);
  useFrame((_, delta) => {
    advanceTime(delta / 48);
  });
  return null;
});

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
  const narrow = useIsMobile();
  const visualLite = useMobileVisualPerf();
  const showExplorationStats = useExplorationFrameStatsEnabled();
  const virtualControlsRef = useRef<Partial<PlayerControls>>({});
  const [npcStates, setNPCStates] = useState<Record<string, NPCState>>({});
  const [triggerStates, setTriggerStates] = useState<Record<string, TriggerState>>({});
  const [radialObject, setRadialObject] = useState<InteractiveObjectConfig | null>(null);
  
  // Получаем ВСЁ состояние напрямую из store (единый источник истины)
  const playerState = useGameStore((state) => state.playerState);
  const shadowMap = narrow || visualLite ? 256 : 512;
  const playerPosition = useGameStore((state) => state.exploration.playerPosition);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const setNPCState = useGameStore((state) => state.setNPCState);
  const timeOfDay = useGameStore((state) => state.exploration.timeOfDay);
  
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
      case 'volodka_room':
        return { ambient: 0.38, light: '#c8dff0', fogColor: '#151a22', groundGeometryArgs: GROUND_VOLODKA_ROOM };
      case 'volodka_corridor':
        return { ambient: 0.34, light: '#e8dcc8', fogColor: '#16140f', groundGeometryArgs: GROUND_VOLODKA_CORRIDOR };
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
        return {
          ambient: 0.14,
          light: '#39ff9c',
          fogColor: '#020806',
          groundGeometryArgs: GROUND_PLAZA,
        };
      case 'memorial_park':
        return { ambient: 0.35, light: '#ffd9a0', fogColor: '#0a1510', groundGeometryArgs: GROUND_PLAZA };
      case 'zarema_albert_room':
        return { ambient: 0.38, light: '#e8dcc8', fogColor: '#120c0a', groundGeometryArgs: GROUND_INDOOR };
      default:
        return { ambient: 0.35, light: '#b2bec3', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR };
    }
  }, [sceneId]);

  const groundGeometryArgs = groundGeometryArgsProp ?? sceneConfig.groundGeometryArgs;

  const explorationCharacterModelScale = useMemo(
    () => getExplorationCharacterModelScale(sceneId),
    [sceneId],
  );

  const explorationLocomotionScale = useMemo(
    () => getExplorationLocomotionScale(sceneId),
    [sceneId],
  );

  const findNavPath = useMemo(() => {
    const [fw, , fd] = groundGeometryArgs;
    const api = createFloorNavPathfinder(fw, fd);
    return api?.findPathXZ ?? null;
  }, [groundGeometryArgs]);

  const isPanelDistrict = sceneId === 'street_night' || sceneId === 'street_winter';
  const isNarrowApartment =
    sceneId === 'volodka_room' || sceneId === 'volodka_corridor' || sceneId === 'home_evening';

  const followCameraProps = useMemo(() => {
    if (isNarrowApartment) {
      return { distance: 4.25 as const, height: 2.75 as const, smoothness: 0.1 as const };
    }
    return { distance: 8 as const, height: 5 as const, smoothness: 0.08 as const };
  }, [isNarrowApartment]);

  // Get NPCs and triggers for current scene
  const sceneNPCs = useMemo(
    () => getNPCsForScene(sceneId, timeOfDay),
    [sceneId, timeOfDay],
  );

  const sceneInteractiveObjects = useMemo(() => getInteractiveObjectsForScene(sceneId), [sceneId]);
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
    if (!trigger) return;
    if (trigger.storyNodeId || trigger.cutsceneId) {
      onTriggerEnter(triggerId, trigger.storyNodeId, trigger.cutsceneId);
    }
  }, [sceneTriggers, onTriggerEnter]);

  // Handle player interaction (E key) — сначала триггер с requiresInteraction в зоне, иначе ближайший NPC
  const handlePlayerInteraction = useCallback(() => {
    if (isDialogueActive) return;

    if (radialObject) {
      setRadialObject(null);
      return;
    }

    const currentPos = playerPositionRef.current;

    for (const trigger of sceneTriggers) {
      const st = triggerStates[trigger.id] || { id: trigger.id, triggered: false };
      if (st.triggered) continue;
      if (!trigger.requiresInteraction) continue;
      if (!isPlayerInTriggerZone(currentPos, trigger)) continue;
      handleTriggerEnter(trigger.id);
      if (trigger.oneTime) {
        handleTriggerStateChange(trigger.id, {
          id: trigger.id,
          triggered: true,
          triggeredAt: Date.now(),
        });
      }
      return;
    }

    const nearObj = getNearestInteractiveObject(
      { x: currentPos.x, z: currentPos.z },
      sceneInteractiveObjects,
    );
    if (nearObj) {
      setRadialObject(nearObj);
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
      const entry = getCurrentScheduleEntry(nearestNPC.id, timeOfDay);
      if (entry && !entry.dialogueAvailable) {
        eventBus.emit('ui:exploration_message', { text: 'Персонаж сейчас недоступен' });
        return;
      }
      onNPCInteraction(nearestNPC.id);
    }
  }, [
    isDialogueActive,
    sceneTriggers,
    triggerStates,
    handleTriggerEnter,
    handleTriggerStateChange,
    sceneNPCs,
    npcStates,
    onNPCInteraction,
    timeOfDay,
    radialObject,
    sceneInteractiveObjects,
  ]);

  return (
    <Fragment>
    <Canvas
      tabIndex={0}
      role="application"
      aria-label="Исследование локации"
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 5, 8] }}
      style={{ 
        background: sceneConfig.fogColor,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        outline: 'none',
      }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement | null)?.focus?.();
      }}
    >
      {/* Physics: Suspense — WASM Rapier; коллайдер пола в `PhysicsSceneColliders`. */}
      <Suspense fallback={null}>
      <Physics gravity={[0, -9.81, 0]} debug={false}>
        <ExplorationWorldClock />
        {/*
          Пол + стены Rapier — здесь же визуал пола в `PhysicsFloor` (`PhysicsSceneColliders`).
          Отдельный box-пол сверху убран: иначе z-fight и расхождение с реальными размерами пола по сцене.
        */}
        <PhysicsSceneColliders sceneId={sceneId} />

        {/* Интерьер квартиры в обходе (раньше был только в VN-слое — без стен сцена читалась как «чёрная дыра»). */}
        {sceneId === 'volodka_corridor' && <VolodkaCorridorVisual />}
        {sceneId === 'volodka_room' && <VolodkaRoomVisual />}
        {sceneId === 'home_evening' && <HomeEveningVisual />}

        {isPanelDistrict && <PanelDistrictBuildings />}
      
        {/* Fog — в узких комнатах был слишком короткий far: стены уходили в 100% тумана. */}
        <fog
          attach="fog"
          args={[
            sceneConfig.fogColor,
            isPanelDistrict ? 14 : isNarrowApartment ? 1.2 : 8,
            isPanelDistrict ? 48 : isNarrowApartment ? 42 : 25,
          ]}
        />

        {/* Lighting - Усиленное */}
        <ambientLight intensity={sceneConfig.ambient + 0.3} />
        <hemisphereLight color={sceneConfig.light} groundColor="#1a1a1a" intensity={0.8} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.6}
          color={visualState.colorTint !== 'transparent' ? visualState.colorTint : '#fff'}
          castShadow
          shadow-mapSize={[shadowMap, shadowMap]}
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
          key={sceneId}
          position={[playerPosition.x, playerPosition.y, playerPosition.z]}
          initialRotation={playerPosition.rotation ?? 0}
          modelPath={getDefaultPlayerModelPath()}
          visualModelScale={explorationCharacterModelScale}
          locomotionScale={explorationLocomotionScale}
          onPositionChange={handlePositionChange}
          onInteraction={handlePlayerInteraction}
          isLocked={isDialogueActive}
          virtualControlsRef={narrow ? virtualControlsRef : undefined}
        />

        {/* NPCs */}
        <NPCSystem
          npcs={sceneNPCs}
          npcStates={npcStates}
          playerPosition={playerPosition}
          onNPCInteraction={onNPCInteraction}
          onNPCStateChange={handleNPCStateChange}
          isDialogueActive={isDialogueActive}
          currentSceneId={sceneId}
          timeOfDay={timeOfDay}
          locationModelScale={explorationCharacterModelScale}
          locationLocomotionScale={explorationLocomotionScale}
          enableNpcPhysics
          findNavPath={findNavPath}
        />

        <BattleClickLayer key={sceneId} active={sceneId === 'battle'} />

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
          key={sceneId}
          targetPosition={playerPosition}
          distance={followCameraProps.distance}
          height={followCameraProps.height}
          smoothness={followCameraProps.smoothness}
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
        <ExplorationPostFX
          sceneId={sceneId}
          visualLite={visualLite}
          stress={playerState.stress}
          compactIndoor={isNarrowApartment}
        />
        <ExplorationParticles sceneId={sceneId} timeOfDay={timeOfDay} visualLite={visualLite} />
        <ExplorationFootprints key={sceneId} sceneId={sceneId} />
        {showExplorationStats && <ExplorationFrameStats />}
      </Suspense>
    </Canvas>
    {narrow && (
      <ExplorationMobileHud
        active={!isDialogueActive}
        virtualControlsRef={virtualControlsRef}
        onInteract={handlePlayerInteraction}
      />
    )}

    <RadialMenu
      open={radialObject !== null}
      anchorLabel={radialObject?.id}
      onClose={() => setRadialObject(null)}
      onSelect={(action: RadialMenuAction) => {
        if (!radialObject) return;
        eventBus.emit('object:interact', { objectId: radialObject.id, action });
        setRadialObject(null);
      }}
    />
    </Fragment>
  );
});

export { RPGGameCanvas };
export type { RPGGameCanvasProps };
