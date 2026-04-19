"use client";

/**
 * Связывает Rapier, игрока, NPC, триггеры и камеру для свободного 3D-обхода.
 * Ошибки загрузки GLB обрабатываются в `PhysicsPlayer` / `NPCSystem` — здесь дубли не нужны.
 * Ввод: клавиатура (WASD, Shift бег, E); тач — `ExplorationMobileHud` (в т.ч. Run) при узком экране или `(pointer: coarse)`.
 *
 * Canvas: **`camera.near` / `far`**, GL — **`getExplorationSceneGlProps`** (`Scene.tsx`). Игрок: **`spawnSyncKey={sceneId}`**
 * вместо **`key`** на дереве GLB; камера — **`useFrame(..., FOLLOW_CAMERA_R3F_PRIORITY)`** после физики Rapier.
 *
 * Доп. флаги (`.env.local`, пересборка): **`NEXT_PUBLIC_EXPLORATION_RAPIER_DEBUG_COLLIDERS`** — проволочные коллайдеры (`<Physics debug>`);
 * **`NEXT_PUBLIC_EXPLORATION_MESH_AUDIT`** — `console.table` мешей и мировых позиций; **`NEXT_PUBLIC_EXPLORATION_NOCLIP`** — игрок без `RigidBody`;
 * **`NEXT_PUBLIC_EXPLORATION_WEBGL_CONTEXT_LOG`** — `webglcontextlost` / `restored` в консоль.
 */

import { memo, useRef, useEffect, useMemo, useCallback, useState, Fragment, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import {
  isExplorationMeshAuditEnabled,
  isExplorationNoclipEnabled,
  isExplorationRapierColliderDebugEnabled,
  isExplorationWebGlContextLogEnabled,
} from '@/lib/explorationDiagnostics';
import { ExplorationMeshWorldAudit, ExplorationWebGlContextLog } from '@/components/game/exploration/ExplorationSceneDiagnostics';
import { ThreeCanvasSuspenseFallback } from '@/components/3d/ThreeCanvasSuspenseFallback';
import { ExplorationNoclipPlayer } from '@/components/game/exploration/ExplorationNoclipPlayer';
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
import { BattleClickLayer } from './BattleClickLayer';
import { VolodkaCorridorVisual } from './exploration/VolodkaCorridorVisual';
import { VolodkaRoomVisual } from './exploration/VolodkaRoomVisual';
import { HomeEveningVisual } from './exploration/HomeEveningVisual';
import { NpcProximityBarks } from './NpcProximityBarks';
import { EXPLORATION_SCENE_FRAMELOOP, getExplorationSceneGlProps } from '@/components/3d/Scene';
import { ExplorationLighting, getExplorationDirectionalShadowMapSize } from '@/components/3d/Lighting';
import {
  clearExplorationLivePlayerPosition,
  updateExplorationLivePlayerPosition,
} from '@/lib/explorationLivePlayerBridge';
import { resolveNearest, type InteractionCandidate } from '@/core/interaction/InteractionResolver';
import { explorationInteractionRegistry, registerBaseInteractions } from '@/game/interactions/registerBaseInteractions';
import { InteractionHint, EXPLORATION_INTERACTION_HINT_MAX_DISTANCE } from '@/components/ui/InteractionHint';
import { useExplorationLivePlayerTick } from '@/hooks/useExplorationLivePlayerTick';

// ============================================
// TYPES
// ============================================

/** Пол: полные размеры `boxGeometry` [ширина X, толщина Y, глубина Z], центр сцены в начале координат. */
export type RpgGroundGeometryArgs = [number, number, number];

interface RPGGameCanvasProps {
  sceneId: SceneId;
  visualState: VisualState;
  isDialogueActive: boolean;
  /** Мировая позиция собеседника для кадра камеры в диалоге из обхода. */
  dialogueSubjectPosition?: { x: number; y: number; z: number } | null;
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
  dialogueSubjectPosition = null,
  onTriggerEnter,
  onNPCInteraction,
  children,
  groundGeometryArgs: groundGeometryArgsProp,
}: RPGGameCanvasProps) {
  const narrow = useIsMobile();
  const visualLite = useMobileVisualPerf();
  const showTouchHud = useTouchGameControls();
  const showExplorationStats = useExplorationFrameStatsEnabled();
  const rapierColliderDebug = isExplorationRapierColliderDebugEnabled();
  const explorationMeshAudit = isExplorationMeshAuditEnabled();
  const explorationNoclip = isExplorationNoclipEnabled();
  const explorationWebGlLog = isExplorationWebGlContextLogEnabled();
  const virtualControlsRef = useRef<Partial<PlayerControls>>({});
  const [radialObject, setRadialObject] = useState<InteractiveObjectConfig | null>(null);
  const [availableInteractionIds, setAvailableInteractionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const interactionHintTick = useExplorationLivePlayerTick(!isDialogueActive, 120);

  useEffect(() => {
    registerBaseInteractions();
  }, []);

  const npcStates = useGameStore((s) => s.exploration.npcStates);
  const triggerStates = useGameStore((s) => s.exploration.triggerStates);
  const setTriggerState = useGameStore((s) => s.setTriggerState);

  const playerState = useGameStore((state) => state.playerState);
  const shadowMapSize = useMemo(
    () => getExplorationDirectionalShadowMapSize(narrow, visualLite),
    [narrow, visualLite],
  );
  const simplifyLights = narrow || visualLite;

  const explorationGl = useMemo(
    () => ({
      ...getExplorationSceneGlProps(visualLite, narrow),
      powerPreference: 'high-performance' as const,
    }),
    [visualLite, narrow],
  );

  /** Позиция игрока из физики каждый кадр; без подписки на стор в этом компоненте — меньше ре-рендеров Canvas/UI. */
  const livePlayerPositionRef = useRef(
    (() => {
      const p = useGameStore.getState().exploration.playerPosition;
      return { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    })(),
  );
  const setNPCState = useGameStore((state) => state.setNPCState);
  const timeOfDay = useGameStore((state) => state.exploration.timeOfDay);

  /** Снимок из стора при смене сцены: спавн `PhysicsPlayer`, бутстрап камеры/NPC без подписки на каждый шаг. */
  const explorationSpawnSnapshot = useMemo(() => {
    const p = useGameStore.getState().exploration.playerPosition;
    return { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
  }, [sceneId]);

  const playerPositionRef = useRef(explorationSpawnSnapshot);
  useEffect(() => {
    playerPositionRef.current = explorationSpawnSnapshot;
  }, [explorationSpawnSnapshot]);

  useEffect(() => {
    const p = useGameStore.getState().exploration.playerPosition;
    livePlayerPositionRef.current = { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    updateExplorationLivePlayerPosition(livePlayerPositionRef.current);
  }, [sceneId]);

  useEffect(() => {
    return () => {
      clearExplorationLivePlayerPosition();
    };
  }, []);

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
    if (sceneId === 'volodka_corridor') {
      return {
        distance: 2.68,
        height: 1.72,
        smoothness: 0.12,
        shoulderOffset: 0.06,
        lookAtHeightOffset: 1.02,
        collisionSpring: 12,
        minDistance: 1.38,
        maxDistance: 3.4,
        collisionRayOriginY: 1.18,
        collisionRadius: 0.2,
      };
    }
    if (sceneId === 'volodka_room') {
      return {
        distance: 3.12,
        height: 1.96,
        smoothness: 0.11,
        shoulderOffset: 0.1,
        lookAtHeightOffset: 1.08,
        collisionSpring: 12,
        minDistance: 1.52,
        maxDistance: 4.0,
        collisionRayOriginY: 1.3,
        collisionRadius: 0.24,
      };
    }
    if (sceneId === 'home_evening') {
      return {
        distance: 3.35,
        height: 2.1,
        smoothness: 0.11,
        shoulderOffset: 0.14,
        lookAtHeightOffset: 1.14,
        collisionSpring: 11,
        minDistance: 1.58,
        maxDistance: 4.25,
        collisionRayOriginY: 1.34,
        collisionRadius: 0.26,
      };
    }
    if (isPanelDistrict) {
      return {
        distance: 5.25,
        height: 3.05,
        smoothness: 0.11,
        shoulderOffset: 0.26,
        lookAtHeightOffset: 1.3,
        collisionSpring: 10,
        minDistance: 2,
        maxDistance: 15,
        collisionRayOriginY: 1.5,
        collisionRadius: 0.3,
      };
    }
    return {
      distance: 4.75,
      height: 2.9,
      smoothness: 0.11,
      shoulderOffset: 0.24,
      lookAtHeightOffset: 1.28,
      collisionSpring: 11,
      minDistance: 2,
      maxDistance: 15,
      collisionRayOriginY: 1.5,
      collisionRadius: 0.3,
    };
  }, [sceneId, isPanelDistrict]);

  // Get NPCs and triggers for current scene
  const sceneNPCs = useMemo(
    () => getNPCsForScene(sceneId, timeOfDay),
    [sceneId, timeOfDay],
  );

  const sceneInteractiveObjects = useMemo(() => getInteractiveObjectsForScene(sceneId), [sceneId]);
  const sceneTriggers = useMemo(() => getTriggersForScene(sceneId), [sceneId]);

  // Позиция только в ref + мост: не вызывать setPlayerPosition здесь (конфликт с kinematic / мерцание).
  const handlePositionChange = useCallback((pos: { x: number; y: number; z: number; rotation: number }) => {
    const next = { x: pos.x, y: pos.y, z: pos.z, rotation: pos.rotation };
    livePlayerPositionRef.current = next;
    playerPositionRef.current = next;
    updateExplorationLivePlayerPosition(next);
  }, []);

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

  const onInteractionAvailabilityChange = useCallback((ids: ReadonlySet<string>) => {
    setAvailableInteractionIds(ids);
  }, []);

  // Handle player interaction (E / тач) — единый резолвер: триггер → объект vs NPC по дистанции
  const handlePlayerInteraction = useCallback(() => {
    if (isDialogueActive) return;

    if (radialObject) {
      setRadialObject(null);
      return;
    }

    const currentPos = playerPositionRef.current;
    if (currentPos) {
      const byInteractionId = new Map<string, number>();
      for (const trigger of sceneTriggers) {
        if (!trigger.interactionId) continue;
        if (!availableInteractionIds.has(trigger.interactionId)) continue;
        if (!isPlayerInTriggerZone(currentPos, trigger)) continue;
        const dx = currentPos.x - trigger.position.x;
        const dy = currentPos.y - trigger.position.y;
        const dz = currentPos.z - trigger.position.z;
        const distance = Math.hypot(dx, dy, dz);
        if (distance > EXPLORATION_INTERACTION_HINT_MAX_DISTANCE) continue;
        const prev = byInteractionId.get(trigger.interactionId);
        if (prev === undefined || distance < prev) {
          byInteractionId.set(trigger.interactionId, distance);
        }
      }
      const registryCandidates: InteractionCandidate[] = [...byInteractionId.entries()].map(
        ([id, distance]) => ({ id, distance }),
      );
      const nearestRegistry = resolveNearest(registryCandidates);
      if (nearestRegistry) {
        const st = useGameStore.getState();
        const ran = explorationInteractionRegistry.tryExecute(nearestRegistry.id, {
          setGameMode: st.setGameMode,
          onNPCInteraction,
          activateQuest: st.activateQuest,
          incrementQuestObjective: st.incrementQuestObjective,
          completeQuest: st.completeQuest,
          isQuestActive: st.isQuestActive,
          isQuestCompleted: st.isQuestCompleted,
          getQuestProgress: st.getQuestProgress,
        });
        if (ran) return;
      }
    }

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
    availableInteractionIds,
  ]);

  return (
    <Fragment>
    <Canvas
      className="block h-full w-full touch-none"
      tabIndex={0}
      role="application"
      aria-label="Исследование локации"
      frameloop={EXPLORATION_SCENE_FRAMELOOP}
      dpr={[1, 1.5]}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 60, near: 0.5, far: 50, position: [0, 5, 8] }}
      style={{ 
        background: sceneConfig.fogColor,
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        outline: 'none',
        touchAction: 'none',
      }}
      gl={explorationGl}
      onPointerDown={(e) => {
        (e.target as HTMLCanvasElement | null)?.focus?.();
      }}
    >
      <PerformanceMonitor />
      {/*
        Порядок внутри Suspense: Rapier (пол/стены) → визуалы интерьера (userData.noCameraCollision для raycast камеры)
        → SceneColliderSelector (невидимые меши слоя камеры) → игрок/NPC → триггеры → FollowCamera → эффекты.
        PostFX вне Physics, но в Canvas — отдельный render pass.
      */}
      <Suspense fallback={<ThreeCanvasSuspenseFallback />}>
        {explorationWebGlLog && <ExplorationWebGlContextLog />}
        {explorationMeshAudit && <ExplorationMeshWorldAudit sceneId={sceneId} />}
      <Physics timeStep={1 / 60} gravity={[0, -9.81, 0]} debug={rapierColliderDebug}>
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

        <ExplorationLighting
          ambientIntensity={sceneConfig.ambient + 0.3}
          hemisphereSky={sceneConfig.light}
          directionalColor={visualState.colorTint !== 'transparent' ? visualState.colorTint : '#fff'}
          pointColor={sceneConfig.light}
          simplifyLights={simplifyLights}
          shadowMapSize={shadowMapSize}
        />

        {/* Scene Colliders */}
        <SceneColliderSelector sceneId={sceneId} />

        {/* Visual Scene Elements */}
        {children}

        {explorationNoclip ? (
          <ExplorationNoclipPlayer
            spawnSyncKey={sceneId}
            position={[
              explorationSpawnSnapshot.x,
              explorationSpawnSnapshot.y,
              explorationSpawnSnapshot.z,
            ]}
            initialRotation={explorationSpawnSnapshot.rotation ?? 0}
            modelPath={getDefaultPlayerModelPath()}
            visualModelScale={explorationCharacterModelScale}
            locomotionScale={explorationLocomotionScale}
            onPositionChange={handlePositionChange}
            onInteraction={handlePlayerInteraction}
            isLocked={isDialogueActive}
            virtualControlsRef={virtualControlsRef}
          />
        ) : (
          <PhysicsPlayer
            spawnSyncKey={sceneId}
            position={[
              explorationSpawnSnapshot.x,
              explorationSpawnSnapshot.y,
              explorationSpawnSnapshot.z,
            ]}
            initialRotation={explorationSpawnSnapshot.rotation ?? 0}
            modelPath={getDefaultPlayerModelPath()}
            visualModelScale={explorationCharacterModelScale}
            locomotionScale={explorationLocomotionScale}
            onPositionChange={handlePositionChange}
            onInteraction={handlePlayerInteraction}
            isLocked={isDialogueActive}
            virtualControlsRef={virtualControlsRef}
          />
        )}

        {/* NPCs */}
        <NPCSystem
          npcs={sceneNPCs}
          npcStates={npcStates}
          playerPosition={explorationSpawnSnapshot}
          playerPositionRef={livePlayerPositionRef}
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

        <BattleClickLayer active={sceneId === 'battle'} />

        {/* Triggers */}
        <TriggerSystem
          triggers={sceneTriggers}
          triggerStates={triggerStates}
          playerPositionRef={playerPositionRef}
          currentSceneId={sceneId}
          onTriggerEnter={handleTriggerEnter}
          onTriggerStateChange={handleTriggerStateChange}
          onInteractionAvailabilityChange={onInteractionAvailabilityChange}
        />

        <FollowCamera
          targetPosition={explorationSpawnSnapshot}
          targetPositionRef={livePlayerPositionRef}
          distance={followCameraProps.distance}
          height={followCameraProps.height}
          smoothness={followCameraProps.smoothness}
          shoulderOffset={followCameraProps.shoulderOffset}
          lookAtHeightOffset={followCameraProps.lookAtHeightOffset}
          collisionSpring={followCameraProps.collisionSpring}
          collisionRayOriginY={followCameraProps.collisionRayOriginY}
          collisionRadius={followCameraProps.collisionRadius}
          minDistance={followCameraProps.minDistance}
          maxDistance={followCameraProps.maxDistance}
          orbitResyncKey={sceneId}
          isLocked={isDialogueActive}
          dialogueFraming={Boolean(isDialogueActive && dialogueSubjectPosition)}
          dialogueSubjectPosition={dialogueSubjectPosition}
          enableCollision={!isDialogueActive}
          enableZoom={!isDialogueActive}
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
        <ExplorationFootprints sceneId={sceneId} />
        {showExplorationStats && <ExplorationFrameStats />}
      </Suspense>
    </Canvas>
    <InteractionHint
      enabled={!isDialogueActive}
      tick={interactionHintTick}
      sceneTriggers={sceneTriggers}
      availableInteractionIds={availableInteractionIds}
      playerPositionRef={playerPositionRef}
    />
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
