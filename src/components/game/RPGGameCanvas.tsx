"use client";

/**
 * Связывает Rapier, игрока, NPC, триггеры и камеру для свободного 3D-обхода.
 * Ошибки загрузки GLB обрабатываются в `PhysicsPlayer` / `NPCSystem` — здесь дубли не нужны.
 * Ввод: клавиатура (WASD, Shift бег, E); тач — `ExplorationMobileHud` (в т.ч. Run) при узком экране или `(pointer: coarse)`.
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
import { TriggerSystem } from './InteractiveTrigger';
import CameraEffects from '../CameraEffects';

// Store
import { useGameStore } from '../../store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { useIsMobile, useTouchGameControls } from '@/hooks/use-mobile';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { ExplorationPostFX } from '@/components/game/exploration/ExplorationPostFX';
import { ExplorationParticles } from '@/components/game/exploration/ExplorationParticles';
import { ExplorationFootprints } from '@/components/game/exploration/ExplorationFootprints';
import { PanelDistrictBuildings } from '@/components/game/exploration/PanelDistrictBuildings';
import { ExplorationFrameStats, useExplorationFrameStatsEnabled } from '@/components/game/exploration/ExplorationFrameStats';
import { ExplorationMobileHud } from './ExplorationMobileHud';
import { RadialMenu, type RadialMenuAction } from './RadialMenu';
import { resolveExplorationPrimaryInteraction } from '@/lib/explorationPrimaryInteraction';
import type { PlayerControls } from '@/hooks/useGamePhysics';
import { createFloorNavPathfinder } from '@/lib/explorationNavMesh';
import {
  RAPIER_EXPLORATION_TIMESTEP_DEFAULT,
  RAPIER_EXPLORATION_TIMESTEP_VISUAL_LITE,
} from '@/lib/rapierExplorationTimestep';
import { BattleClickLayer } from './BattleClickLayer';
import { VolodkaCorridorVisual } from './exploration/VolodkaCorridorVisual';
import { VolodkaRoomVisual } from './exploration/VolodkaRoomVisual';
import { HomeEveningVisual } from './exploration/HomeEveningVisual';
import { NpcProximityBarks } from './NpcProximityBarks';

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

/** Тик суток в обходе: глобальный `advanceTime` из стора (остальной `useFrame` — в дочерних компонентах). */
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
  const showTouchHud = useTouchGameControls();
  const showExplorationStats = useExplorationFrameStatsEnabled();
  const virtualControlsRef = useRef<Partial<PlayerControls>>({});
  const [radialObject, setRadialObject] = useState<InteractiveObjectConfig | null>(null);

  const npcStates = useGameStore((s) => s.exploration.npcStates);
  const triggerStates = useGameStore((s) => s.exploration.triggerStates);
  const setTriggerState = useGameStore((s) => s.setTriggerState);

  const playerState = useGameStore((state) => state.playerState);
  const shadowMap = narrow || visualLite ? 256 : 512;
  const simplifyLights = narrow || visualLite;
  const canvasDpr = useMemo((): [number, number] => {
    if (visualLite) return [1, 1.25];
    if (narrow) return [1, 1.5];
    return [1, 2];
  }, [visualLite, narrow]);

  const rapierTimeStep = useMemo(
    () => (visualLite ? RAPIER_EXPLORATION_TIMESTEP_VISUAL_LITE : RAPIER_EXPLORATION_TIMESTEP_DEFAULT),
    [visualLite],
  );
  const playerPosition = useGameStore((state) => state.exploration.playerPosition);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  /** Позиция для камеры каждый кадр без коммита Zustand ~60 Гц (см. `FollowCamera` + throttle store). */
  const livePlayerPositionRef = useRef({
    x: playerPosition.x,
    y: playerPosition.y,
    z: playerPosition.z,
    rotation: playerPosition.rotation ?? 0,
  });
  const lastStorePositionFlushRef = useRef(0);
  const setNPCState = useGameStore((state) => state.setNPCState);
  const timeOfDay = useGameStore((state) => state.exploration.timeOfDay);
  
  // Ref для актуального значения playerPosition (избегаем устаревших замыканий)
  const playerPositionRef = useRef(playerPosition);
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  useEffect(() => {
    const p = useGameStore.getState().exploration.playerPosition;
    livePlayerPositionRef.current = { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
  }, [sceneId]);

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
      return {
        distance: 4.25 as const,
        height: 2.75 as const,
        smoothness: 0.1 as const,
        shoulderOffset: 0.2 as const,
        lookAtHeightOffset: 1.22 as const,
        collisionSpring: 11 as const,
      };
    }
    return {
      distance: 8 as const,
      height: 5 as const,
      smoothness: 0.08 as const,
      shoulderOffset: 0.32 as const,
      lookAtHeightOffset: 1.38 as const,
      collisionSpring: 9 as const,
    };
  }, [isNarrowApartment]);

  // Get NPCs and triggers for current scene
  const sceneNPCs = useMemo(
    () => getNPCsForScene(sceneId, timeOfDay),
    [sceneId, timeOfDay],
  );

  const sceneInteractiveObjects = useMemo(() => getInteractiveObjectsForScene(sceneId), [sceneId]);
  const sceneTriggers = useMemo(() => getTriggersForScene(sceneId), [sceneId]);

  // Handle player position changes - сохраняем в store напрямую
  const handlePositionChange = useCallback(
    (pos: { x: number; y: number; z: number; rotation: number }) => {
      livePlayerPositionRef.current = { x: pos.x, y: pos.y, z: pos.z, rotation: pos.rotation };
      playerPositionRef.current = { x: pos.x, y: pos.y, z: pos.z, rotation: pos.rotation };

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastStorePositionFlushRef.current < 90) return;
      lastStorePositionFlushRef.current = now;
      setPlayerPosition({ x: pos.x, y: pos.y, z: pos.z, rotation: pos.rotation });
    },
    [setPlayerPosition],
  );

  // Handle NPC state changes
  const handleNPCStateChange = useCallback(
    (npcId: string, state: NPCState) => {
      setNPCState(npcId, state);
    },
    [setNPCState],
  );

  const handleTriggerStateChange = useCallback(
    (triggerId: string, state: TriggerState) => {
      setTriggerState(triggerId, state);
    },
    [setTriggerState],
  );

  // Handle trigger enter
  const handleTriggerEnter = useCallback((triggerId: string) => {
    const trigger = sceneTriggers.find(t => t.id === triggerId);
    if (!trigger) return;
    if (trigger.storyNodeId || trigger.cutsceneId) {
      onTriggerEnter(triggerId, trigger.storyNodeId, trigger.cutsceneId);
    }
  }, [sceneTriggers, onTriggerEnter]);

  // Handle player interaction (E / тач) — единый резолвер: триггер → объект vs NPC по дистанции
  const handlePlayerInteraction = useCallback(() => {
    if (isDialogueActive) return;

    if (radialObject) {
      setRadialObject(null);
      return;
    }

    const currentPos = playerPositionRef.current;
    const target = resolveExplorationPrimaryInteraction({
      playerPosition: currentPos,
      sceneTriggers,
      triggerStates,
      sceneInteractiveObjects,
      sceneNPCs,
      npcStates,
    });

    if (target.kind === 'trigger') {
      const trigger = sceneTriggers.find((t) => t.id === target.triggerId);
      if (!trigger) return;
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

    if (target.kind === 'world_object') {
      setRadialObject(target.object);
      return;
    }

    if (target.kind === 'npc') {
      const nearestNPC = sceneNPCs.find((n) => n.id === target.npcId);
      if (!nearestNPC) return;
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
      dpr={canvasDpr}
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
        touchAction: 'none',
      }}
      gl={{
        antialias: !visualLite,
        alpha: false,
        stencil: false,
        powerPreference: visualLite || narrow ? 'default' : 'high-performance',
      }}
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement | null)?.focus?.();
      }}
    >
      {/*
        Порядок внутри Suspense: Rapier (пол/стены) → визуалы интерьера (userData.noCameraCollision для raycast камеры)
        → SceneColliderSelector (невидимые меши слоя камеры) → игрок/NPC → триггеры → FollowCamera → эффекты.
        PostFX вне Physics, но в Canvas — отдельный render pass.
      */}
      <Suspense fallback={null}>
      <Physics
        gravity={[0, -9.81, 0]}
        debug={false}
        timeStep={rapierTimeStep}
        interpolate
      >
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
        <pointLight position={[0, 4, 3]} intensity={simplifyLights ? 1.05 : 1.2} color={sceneConfig.light} distance={20} />
        {!simplifyLights && (
          <>
            <pointLight position={[-3, 2, 0]} intensity={0.6} color={sceneConfig.light} distance={15} />
            <pointLight position={[3, 2, 0]} intensity={0.6} color={sceneConfig.light} distance={15} />
          </>
        )}

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
          virtualControlsRef={virtualControlsRef}
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

        <NpcProximityBarks
          sceneId={sceneId}
          timeOfDay={timeOfDay}
          npcs={sceneNPCs}
          npcStates={npcStates}
          playerPositionRef={playerPositionRef}
          isDialogueActive={isDialogueActive}
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
          targetPositionRef={livePlayerPositionRef}
          distance={followCameraProps.distance}
          height={followCameraProps.height}
          smoothness={followCameraProps.smoothness}
          shoulderOffset={followCameraProps.shoulderOffset}
          lookAtHeightOffset={followCameraProps.lookAtHeightOffset}
          collisionSpring={followCameraProps.collisionSpring}
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
    <ExplorationMobileHud
      active={showTouchHud && !isDialogueActive}
      virtualControlsRef={virtualControlsRef}
      onInteract={handlePlayerInteraction}
    />

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
