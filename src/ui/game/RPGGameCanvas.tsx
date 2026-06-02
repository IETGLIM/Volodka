"use client";

/**
 * Связывает Rapier, игрока, NPC, триггеры и камеру для свободного 3D-обхода.
 * Ошибки загрузки GLB обрабатываются в `PhysicsPlayer` / `NPCSystem` — здесь дубли не нужны.
 * Ввод: клавиатура (WASD, Shift бег, E); тач — `ExplorationMobileHud` (в т.ч. Run) при узком экране или `(pointer: coarse)`.
 *
 * Canvas: **`camera.near` / `far`**, GL — **`getExplorationSceneGlProps`** (`Scene.tsx`). Игрок: **`spawnSyncKey={sceneId}`**
 * вместо **`key`** на дереве GLB; в **`gameplay`** камера — **`FollowCamera`** (`useFrame`, приоритет после Rapier).
 * В **`intro_cutscene`** орбиту **`FollowCamera`** не крутим (`cutsceneActive`) — позиция из **`IntroCutsceneCinematicDirector`** / **`INTRO_OPENING_CAM_KEYFRAMES`**.
 *
 * Доп. флаги (`.env.local`, пересборка): **`NEXT_PUBLIC_EXPLORATION_RAPIER_DEBUG_COLLIDERS`** — проволочные коллайдеры (`<Physics debug>`);
 * **`NEXT_PUBLIC_EXPLORATION_MESH_AUDIT`** — `console.table` мешей и мировых позиций; **`NEXT_PUBLIC_EXPLORATION_NOCLIP`** — игрок без `RigidBody`;
 * **`NEXT_PUBLIC_EXPLORATION_WEBGL_CONTEXT_LOG`** — `webglcontextlost` / `restored` в консоль.
 */

import { memo, useRef, useEffect, useMemo, useCallback, useState, Fragment, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { PHYSICS_CONSTANTS } from '@/engine/physics/constants';
import {
  isExplorationMeshAuditEnabled,
  isExplorationNoclipEnabled,
  isExplorationRapierColliderDebugEnabled,
  isExplorationWebGlContextLogEnabled,
} from '@/lib/explorationDiagnostics';
import { ExplorationMeshWorldAudit, ExplorationWebGlContextLog, StreamingDebugHUD } from '@/ui/3d/exploration/ExplorationSceneDiagnostics';
import { GltfDracoDecoderBootstrap } from '@/ui/3d/exploration/GltfDracoDecoderBootstrap';
import { ThreeCanvasSuspenseFallback } from '@/ui/3d/ThreeCanvasSuspenseFallback';
import { ExplorationNoclipPlayer } from '@/ui/3d/exploration/ExplorationNoclipPlayer';
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
import { getTriggersForScene, getWorldItemsForScene } from '../../data/triggerZones';
import { getItemById } from '@/data/items';
import {
  getInteractiveObjectsForScene,
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  getExplorationNpcModelScale,
  type InteractiveObjectConfig,
} from '@/config/scenes';
import {
  getExplorationFollowCameraPreset,
  getExplorationLightTuning,
  getExplorationScenePreset,
  getNarrowIndoorFogConfig,
  type ExplorationFollowCameraPreset,
} from '@/config/explorationScenePresets';

// Components
import { PhysicsPlayer } from './PhysicsPlayer';
import FollowCamera from './FollowCamera';
import { NPCSystem } from './NPC';
import { SceneColliderSelector } from './SceneColliders';
import { PhysicsSceneColliders } from './PhysicsSceneColliders';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { TriggerSystem, WorldItem } from './InteractiveTrigger';
import CameraEffects from '../CameraEffects';

// Store
import { useGameStore } from '@/state';
import { useGamePhaseStore } from '@/state/gamePhaseStore';
import { eventBus } from '@/engine/EventBus';
import { emitInteractionFeedback } from '@/lib/interactionFeedback';
import { InteractionFeedbackListener } from '@/ui/game/InteractionFeedbackListener';
import { InteractionHintListener } from '@/ui/game/InteractionHintListener';
import { InteractionHintOverlay } from '@/ui/game/InteractionHintOverlay';
import { useInteractionAnticipation } from '@/ui/game/useInteractionAnticipation';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { useIsMobile, useTouchGameControls } from '@/hooks/use-mobile';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { ExplorationPostFX } from '@/ui/3d/exploration/ExplorationPostFX';
import { ExplorationParticles } from '@/ui/3d/exploration/ExplorationParticles';
import { ExplorationFootprints } from '@/ui/3d/exploration/ExplorationFootprints';
import { PanelDistrictBuildings } from '@/ui/3d/exploration/PanelDistrictBuildings';
import { ExplorationFrameStats, useExplorationFrameStatsEnabled } from '@/ui/3d/exploration/ExplorationFrameStats';
import { ExplorationSystemsTick } from '@/ui/3d/exploration/ExplorationSystemsTick';
import { mountExplorationController } from '@/game/interactions/explorationController';
import { ExplorationMobileHud } from './ExplorationMobileHud';
import { RadialMenu, type RadialMenuAction } from './RadialMenu';
import { getExplorationRadialMenuActions } from '@/lib/explorationRadialMenuActions';
import { resolveExplorationInteractionPriority } from '@/lib/explorationPrimaryInteraction';
import type { PlayerControls } from '@/hooks/useGamePhysics';
import { createFloorNavPathfinder } from '@/lib/explorationNavMesh';
import { BattleClickLayer } from './BattleClickLayer';
import { VolodkaCorridorVisual } from '@/ui/3d/exploration/VolodkaCorridorVisual';
import { VolodkaRoomVisual } from '@/ui/3d/exploration/VolodkaRoomVisual';
import { ZaremaAlbertExplorationVisual } from '@/ui/3d/exploration/ZaremaAlbertExplorationVisual';
import { HomeEveningVisual } from '@/ui/3d/exploration/HomeEveningVisual';
import { ExplorationInteractionFocusOutline } from '@/ui/3d/exploration/ExplorationInteractionFocusOutline';
import { NpcProximityBarks } from './NpcProximityBarks';
import { ExplorationBriefingOverlay } from '@/ui/3d/exploration/ExplorationBriefingOverlay';
import { IntroCutsceneCinematicDirector } from '@/ui/cutscenes/IntroCutscene';
import { INTRO_OPENING_SCENE_ID } from '@/lib/introVolodkaOpeningCutscene';
import { applyExplorationLocationTrigger } from '@/lib/explorationLocationTrigger';
import { EXPLORATION_SCENE_FRAMELOOP, getExplorationSceneGlProps } from '@/ui/3d/Scene';
import { ExplorationLighting, getExplorationDirectionalShadowMapSize } from '@/ui/3d/Lighting';
import { isExplorationCyberGradeScene } from '@/lib/explorationPostFxState';
import { explorationAmbientWithIbl, getExplorationIblProfile } from '@/lib/explorationIblProfiles';
import { ExplorationEnvironmentIbl } from '@/ui/3d/exploration/ExplorationEnvironmentIbl';
import { explorationInteractionRegistry, registerBaseInteractions } from '@/game/interactions/registerBaseInteractions';
import { InteractionHint } from '@/ui/primitives/InteractionHint';
import { useExplorationLivePlayerTick } from '@/hooks/useExplorationLivePlayerTick';
import { useExplorationBootstrap } from './useExplorationBootstrap';
import { useExplorationInteraction } from './useExplorationInteraction';

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

const INTRO_PLAYER_VISUAL_SCALE_BOOST = 1.16;

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
  /** До гидрации `undefined` — для WebGL/теней безопасно считать широким экраном; тач-HUD см. `=== true` ниже. */
  const narrowForGpu = narrow ?? false;
  const showExplorationStats = useExplorationFrameStatsEnabled();
  const rapierColliderDebug = isExplorationRapierColliderDebugEnabled();
  const explorationMeshAudit = isExplorationMeshAuditEnabled();
  const explorationNoclip = isExplorationNoclipEnabled();
  const explorationWebGlLog = isExplorationWebGlContextLogEnabled();
  const virtualControlsRef = useRef<Partial<PlayerControls>>({});
  const explorationPhase = useGamePhaseStore((s) => s.phase);
  const introCutsceneActive = explorationPhase === 'intro_cutscene';
  /** Та же квартира 10×8: сюжет — `kitchen_night`, свободный хаб — `zarema_albert_room`. */
  const isZaremaAlbertApartmentInterior =
    sceneId === 'zarema_albert_room' || sceneId === 'kitchen_night';
  /** Один композер поста: `ExplorationPostFX` даёт bloom/виньетку; не дублировать вторым композером в `CameraEffects`. */
  const deferCameraEffectsPost =
    (sceneId === 'volodka_room' ||
      sceneId === 'blue_pit' ||
      sceneId === 'office_morning' ||
      isZaremaAlbertApartmentInterior) &&
    explorationPhase === 'gameplay' &&
    !introCutsceneActive;
  /** В 3D-интро игрок всегда в `volodka_room`; не тянуть множители с другого `sceneId` (иначе `m` может быть 1 и интро выглядит крупнее геймплея). */
  const playerSceneTuningId = introCutsceneActive ? INTRO_OPENING_SCENE_ID : sceneId;
  const playerInputLocked = isDialogueActive || introCutsceneActive;
  const interactionHintTick = useExplorationLivePlayerTick(!playerInputLocked, 120);

  useEffect(() => {
    registerBaseInteractions();
  }, []);

  useEffect(() => {
    return mountExplorationController();
  }, []);

  const { npcStates, setNPCState, timeOfDay } = useGameStore(
    useShallow((s) => ({
      npcStates: s.exploration.npcStates,
      setNPCState: s.setNPCState,
      timeOfDay: s.exploration.timeOfDay,
    })),
  );
  const { triggerStates, setTriggerState } = useGameStore(
    useShallow((s) => ({
      triggerStates: s.exploration.triggerStates,
      setTriggerState: s.setTriggerState,
    })),
  );
  const { cameraOrbitResyncNonce, explorationStorePosition } = useGameStore(
    useShallow((s) => ({
      cameraOrbitResyncNonce: s.exploration.cameraOrbitResyncNonce ?? 0,
      explorationStorePosition: s.exploration.playerPosition,
    })),
  );
  const { hasItem, playerState, setPlayerPosition, explorationWorldItems } = useGameStore(
    useShallow((s) => ({
      hasItem: s.hasItem,
      playerState: s.playerState,
      setPlayerPosition: s.setPlayerPosition,
      explorationWorldItems: s.exploration.worldItems,
    })),
  );
  const setExplorationPlayerPosition = useCallback(
    (position: { x: number; y: number; z: number; rotation?: number }) => {
      setPlayerPosition({
        x: position.x,
        y: position.y,
        z: position.z,
        rotation: position.rotation ?? 0,
      });
    },
    [setPlayerPosition],
  );
  const orbitResyncKey = useMemo(
    () => `${sceneId}:${cameraOrbitResyncNonce}`,
    [sceneId, cameraOrbitResyncNonce],
  );
  const shadowMapSize = useMemo(
    () => getExplorationDirectionalShadowMapSize(narrowForGpu, visualLite),
    [narrowForGpu, visualLite],
  );
  const simplifyLights = narrowForGpu || visualLite;

  const explorationGl = useMemo(
    () => ({
      ...getExplorationSceneGlProps(visualLite, narrowForGpu),
      powerPreference: 'high-performance' as const,
    }),
    [visualLite, narrowForGpu],
  );

  const {
    explorationSpawnSnapshot,
    playerPositionRef,
    livePlayerPositionRef,
    explorationBriefingOpen,
    setExplorationBriefingOpen,
    handlePositionChange,
  } = useExplorationBootstrap({
    sceneId,
    introCutsceneActive,
    playerInputLocked,
    explorationStorePosition,
    setPlayerPosition: setExplorationPlayerPosition,
  });

  // Scene config (свет / туман + размер поля под тип локации; при необходимости — проп `groundGeometryArgs`)
  const sceneConfig = useMemo(() => getExplorationScenePreset(sceneId), [sceneId]);

  const groundGeometryArgs = groundGeometryArgsProp ?? sceneConfig.groundGeometryArgs;

  const explorationCharacterModelScale = useMemo(
    () => getExplorationCharacterModelScale(playerSceneTuningId),
    [playerSceneTuningId],
  );
  const effectivePlayerVisualScale = useMemo(
    () =>
      introCutsceneActive
        ? Math.min(1.25, explorationCharacterModelScale * INTRO_PLAYER_VISUAL_SCALE_BOOST)
        : explorationCharacterModelScale,
    [introCutsceneActive, explorationCharacterModelScale],
  );

  const explorationLocomotionScale = useMemo(
    () => getExplorationLocomotionScale(playerSceneTuningId),
    [playerSceneTuningId],
  );

  const explorationNpcModelScale = useMemo(() => getExplorationNpcModelScale(sceneId), [sceneId]);

  /** В квартире Заремы/Альберта слоты статичны — без Rapier KCC меньше дрейфа к одной точке и z-борьбы визуалов. */
  const enableExplorationNpcPhysics = !isZaremaAlbertApartmentInterior;

  const findNavPath = useMemo(() => {
    const [fw, , fd] = groundGeometryArgs;
    const api = createFloorNavPathfinder(fw, fd);
    return api?.findPathXZ ?? null;
  }, [groundGeometryArgs]);

  const isPanelDistrict = sceneId === 'street_night' || sceneId === 'street_winter';
  const isNarrowApartment =
    sceneId === 'volodka_room' ||
    sceneId === 'volodka_corridor' ||
    sceneId === 'home_evening' ||
    sceneId === 'zarema_albert_room' ||
    sceneId === 'kitchen_night';

  /**
   * Узкие комнаты: линейный туман. Слишком близкий `near` + тёмный `fogColor` давали кадр «площадка в пустоте»
   * при низкой орбите (и в интро, и в геймплее — не только кат-сцена).
   * Интро — ещё мягче: кинокамера ближе к геометрии.
   */
  const narrowIndoorFog = useMemo(
    () => getNarrowIndoorFogConfig(sceneId, introCutsceneActive),
    [introCutsceneActive, sceneId],
  );

  const explorationLightTuning = useMemo(() => getExplorationLightTuning(sceneId), [sceneId]);

  const iblProfile = useMemo(
    () =>
      getExplorationIblProfile({
        sceneId,
        visualLite,
        introCutsceneActive: introCutsceneActive,
      }),
    [sceneId, visualLite, introCutsceneActive],
  );

  const iblActive = iblProfile.preset !== null;

  const explorationKeyLightLevels = useMemo(() => {
    const tun = explorationLightTuning;
    const dirBase = tun?.directionalIntensity ?? 0.6;
    const hemBase = tun?.hemisphereIntensity ?? 0.8;
    return {
      directionalIntensity: iblActive ? dirBase * 0.93 : dirBase,
      hemisphereIntensity: iblActive ? hemBase * 0.92 : hemBase,
    };
  }, [explorationLightTuning, iblActive]);

  const followCameraProps = useMemo(
    (): ExplorationFollowCameraPreset => getExplorationFollowCameraPreset(sceneId, isPanelDistrict),
    [sceneId, isPanelDistrict],
  );

  // Get NPCs and triggers for current scene
  const sceneNPCs = useMemo((): NPCDefinition[] => {
    if (explorationPhase === 'intro_cutscene') {
      return [];
    }
    return getNPCsForScene(sceneId, timeOfDay);
  }, [explorationPhase, sceneId, timeOfDay]);

  const sceneInteractiveObjects = useMemo(() => getInteractiveObjectsForScene(sceneId), [sceneId]);
  const sceneTriggers = useMemo(() => getTriggersForScene(sceneId), [sceneId]);

  const mergedScenePickups = useMemo(() => {
    const defs = getWorldItemsForScene(sceneId);
    return defs.map((def) => {
      const row = explorationWorldItems.find((w) => w.id === def.id);
      return {
        id: def.id,
        itemId: def.itemId,
        position: [def.position.x, def.position.y, def.position.z] as [number, number, number],
        collected: row?.collected ?? false,
      };
    });
  }, [sceneId, explorationWorldItems]);

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

  // Handle trigger enter (сюжет / кат-сцена / смена локации `type: 'location'`)
  const handleTriggerEnter = useCallback(
    (triggerId: string) => {
      const trigger = sceneTriggers.find((t) => t.id === triggerId);
      if (!trigger) return;

      if (trigger.type === 'location' && trigger.targetSceneId) {
        const now = Date.now();
        useGameStore.setState((s) => ({
          exploration: applyExplorationLocationTrigger(s.exploration, trigger, now),
        }));

        if (trigger.targetSceneId === 'dream') {
          eventBus.emit('ui:exploration_message', {
            text: 'Тишина смещает границы — ты в мире, где метафора держит пол под ногами.',
          });
        } else if (trigger.sceneId === 'dream') {
          eventBus.emit('ui:exploration_message', { text: 'Веки тяжелеют — ты снова там, где есть стены и расписание.' });
        }
        return;
      }

      if (trigger.storyNodeId || trigger.cutsceneId) {
        onTriggerEnter(triggerId, trigger.storyNodeId, trigger.cutsceneId);
      }
    },
    [sceneTriggers, onTriggerEnter],
  );

  const {
    radialObject,
    setRadialObject,
    radialMenuActions,
    radialMenuAnchorLabel,
    availableInteractionIds,
    onInteractionAvailabilityChange,
    handlePlayerInteraction,
  } = useExplorationInteraction({
    sceneId,
    playerInputLocked,
    explorationBriefingOpen,
    setExplorationBriefingOpen,
    playerPositionRef,
    sceneTriggers,
    triggerStates,
    sceneInteractiveObjects,
    sceneNPCs,
    npcStates,
    hasItem,
    timeOfDay,
    onNPCInteraction,
    handleTriggerEnter,
    handleTriggerStateChange,
  });
  useInteractionAnticipation(availableInteractionIds.size > 0 && !playerInputLocked);

  return (
    <Fragment>
    <InteractionFeedbackListener />
    <InteractionHintListener />
    <Canvas
      className="block h-full w-full touch-none"
      tabIndex={0}
      role="application"
      aria-label="Исследование локации"
      frameloop={EXPLORATION_SCENE_FRAMELOOP}
      dpr={[1, 1.5]}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{ fov: 60, near: 0.75, far: 96, position: [0, 5, 8] }}
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
      <GltfDracoDecoderBootstrap />
      <PerformanceMonitor />
      {/*
        Rapier **вне** Suspense: коллайдеры и шаг мира не зависят от загрузки GLB.
        Внутри Physics → Suspense только для ассетов/мешей, которые могут suspend.
        PostFX / частицы — в Canvas после Physics (без Rapier).
      */}
      {explorationWebGlLog && <ExplorationWebGlContextLog />}
      {explorationMeshAudit && <ExplorationMeshWorldAudit sceneId={sceneId} />}
      <StreamingDebugHUD />
      <Physics timeStep={1 / 60} gravity={[0, PHYSICS_CONSTANTS.GRAVITY, 0]} debug={rapierColliderDebug}>
        <ExplorationSystemsTick />
        <ExplorationWorldClock />
        {/*
          Пол + стены Rapier — вне Suspense: подвисший GLB не задерживает коллайдеры.
          Визуал пола в `PhysicsFloor` (`PhysicsSceneColliders`).
        */}
        <PhysicsSceneColliders sceneId={sceneId} />
        <Suspense fallback={<ThreeCanvasSuspenseFallback />}>
        {iblProfile.preset ? (
          <ExplorationEnvironmentIbl preset={iblProfile.preset} environmentIntensity={iblProfile.environmentIntensity} />
        ) : null}
        {/* Интерьер квартиры в обходе (раньше был только в VN-слое — без стен сцена читалась как «чёрная дыра»). */}
        {sceneId === 'volodka_corridor' && (
          <VolodkaCorridorVisual explorationCharacterModelScale={explorationCharacterModelScale} />
        )}
        {sceneId === 'volodka_room' && (
          <VolodkaRoomVisual explorationCharacterModelScale={explorationCharacterModelScale} />
        )}
        {isZaremaAlbertApartmentInterior && (
          <ZaremaAlbertExplorationVisual explorationCharacterModelScale={explorationCharacterModelScale} />
        )}
        {sceneId === 'home_evening' && <HomeEveningVisual />}

        {isPanelDistrict && <PanelDistrictBuildings />}
      
        {/* Fog — в узких комнатах был слишком короткий far: стены уходили в 100% тумана. */}
        <fog
          attach="fog"
          args={[
            sceneConfig.fogColor,
            isPanelDistrict ? 14 : isNarrowApartment ? narrowIndoorFog.near : 8,
            isPanelDistrict ? 48 : isNarrowApartment ? narrowIndoorFog.far : 25,
          ]}
        />

        <ExplorationLighting
          ambientIntensity={explorationAmbientWithIbl(sceneConfig.ambient + 0.3, iblActive)}
          hemisphereSky={sceneConfig.light}
          hemisphereGround={explorationLightTuning?.hemisphereGround}
          hemisphereIntensity={explorationKeyLightLevels.hemisphereIntensity}
          directionalPosition={explorationLightTuning?.directionalPosition}
          directionalIntensity={explorationKeyLightLevels.directionalIntensity}
          directionalColor={
            visualState.colorTint !== 'transparent'
              ? visualState.colorTint
              : isZaremaAlbertApartmentInterior
                ? '#fff6ed'
                : '#fff'
          }
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
            visualModelScale={effectivePlayerVisualScale}
            locomotionScale={explorationLocomotionScale}
            onPositionChange={handlePositionChange}
            onInteraction={handlePlayerInteraction}
            isLocked={playerInputLocked}
            virtualControlsRef={virtualControlsRef}
          />
        ) : (
          <PhysicsPlayer
            spawnSyncKey={sceneId}
            explorationGlbClampSceneId={playerSceneTuningId}
            playerScaleTuningSceneId={playerSceneTuningId}
            introCutsceneActive={introCutsceneActive}
            position={[
              explorationSpawnSnapshot.x,
              explorationSpawnSnapshot.y,
              explorationSpawnSnapshot.z,
            ]}
            initialRotation={explorationSpawnSnapshot.rotation ?? 0}
            modelPath={getDefaultPlayerModelPath()}
            visualModelScale={effectivePlayerVisualScale}
            locomotionScale={explorationLocomotionScale}
            onPositionChange={handlePositionChange}
            onInteraction={handlePlayerInteraction}
            isLocked={playerInputLocked}
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
          locationModelScale={explorationNpcModelScale}
          locationLocomotionScale={explorationLocomotionScale}
          enableNpcPhysics={enableExplorationNpcPhysics}
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

        {explorationPhase !== 'intro_cutscene' &&
          mergedScenePickups.map((row) => (
            <WorldItem
              key={row.id}
              itemId={row.itemId}
              position={row.position}
              collected={row.collected}
              playerPositionRef={livePlayerPositionRef}
            />
          ))}

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

        <ExplorationInteractionFocusOutline
          objects={sceneInteractiveObjects}
          playerPositionRef={livePlayerPositionRef}
          enabled={
            explorationPhase === 'gameplay' && !playerInputLocked && sceneInteractiveObjects.length > 0
          }
        />

        {introCutsceneActive && <IntroCutsceneCinematicDirector />}

        <FollowCamera
          targetPosition={explorationSpawnSnapshot}
          targetPositionRef={livePlayerPositionRef}
          distance={followCameraProps.distance}
          height={followCameraProps.height}
          smoothness={followCameraProps.smoothness}
          shoulderOffset={followCameraProps.shoulderOffset}
          lookAtHeightOffset={followCameraProps.lookAtHeightOffset}
          pitchMin={followCameraProps.pitchMin}
          pitchMax={followCameraProps.pitchMax}
          collisionSpring={followCameraProps.collisionSpring}
          collisionRayOriginY={followCameraProps.collisionRayOriginY}
          collisionRadius={followCameraProps.collisionRadius}
          minDistance={followCameraProps.minDistance}
          maxDistance={followCameraProps.maxDistance}
          orbitResyncKey={orbitResyncKey}
          isLocked={isDialogueActive}
          cutsceneActive={introCutsceneActive}
          dialogueFraming={Boolean(isDialogueActive && dialogueSubjectPosition)}
          dialogueSubjectPosition={dialogueSubjectPosition}
          enableCollision={!isDialogueActive && !introCutsceneActive}
          enableZoom={!isDialogueActive && !introCutsceneActive}
        />

        {/* Camera Effects */}
        <CameraEffects
          stress={playerState.stress}
          panicMode={playerState.panicMode}
          stability={playerState.stability}
          creativity={playerState.creativity}
          karma={playerState.karma}
          deferPostProcessing={deferCameraEffectsPost}
        />
        </Suspense>
      </Physics>
      <ExplorationPostFX
        sceneId={sceneId}
        visualLite={visualLite}
        stress={playerState.stress}
        panicMode={playerState.panicMode}
        compactIndoor={isNarrowApartment}
        enableSubtleDepthOfField={!narrowForGpu}
        cinematicIntro={introCutsceneActive}
        dialogueCinematic={isDialogueActive}
        explorationWarmInterior={
          isZaremaAlbertApartmentInterior && explorationPhase === 'gameplay' && !introCutsceneActive
        }
        explorationCyberGrade={
          isExplorationCyberGradeScene(sceneId) &&
          explorationPhase === 'gameplay' &&
          !introCutsceneActive
        }
      />
      <ExplorationParticles sceneId={sceneId} timeOfDay={timeOfDay} visualLite={visualLite} />
      <ExplorationFootprints sceneId={sceneId} />
      {showExplorationStats && <ExplorationFrameStats />}
    </Canvas>
    <InteractionHintOverlay />
    <InteractionHint
      enabled={!playerInputLocked}
      tick={interactionHintTick}
      sceneTriggers={sceneTriggers}
      availableInteractionIds={availableInteractionIds}
      playerPositionRef={playerPositionRef}
    />
    <ExplorationMobileHud
      active={showTouchHud === true && !playerInputLocked && !explorationBriefingOpen}
      virtualControlsRef={virtualControlsRef}
      onInteract={handlePlayerInteraction}
    />

    <ExplorationBriefingOverlay
      sceneId={sceneId}
      open={explorationBriefingOpen && !introCutsceneActive}
      onDismiss={() => setExplorationBriefingOpen(false)}
    />

    <RadialMenu
      open={radialObject !== null}
      anchorLabel={radialMenuAnchorLabel}
      allowedActions={radialMenuActions.length > 0 ? radialMenuActions : undefined}
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
