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
  sanitizeExplorationPlayerPositionAgainstSpawn,
  type InteractiveObjectConfig,
} from '@/config/scenes';

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
import { EXPLORATION_SCENE_FRAMELOOP, getExplorationSceneGlProps } from '@/ui/3d/Scene';
import { ExplorationLighting, getExplorationDirectionalShadowMapSize } from '@/ui/3d/Lighting';
import {
  clearExplorationLivePlayerPosition,
  updateExplorationLivePlayerPosition,
} from '@/lib/explorationLivePlayerBridge';
import { isExplorationCyberGradeScene } from '@/lib/explorationPostFxState';
import { explorationAmbientWithIbl, getExplorationIblProfile } from '@/lib/explorationIblProfiles';
import { ExplorationEnvironmentIbl } from '@/ui/3d/exploration/ExplorationEnvironmentIbl';
import { explorationInteractionRegistry, registerBaseInteractions } from '@/game/interactions/registerBaseInteractions';
import { InteractionHint } from '@/ui/primitives/InteractionHint';
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

/** Пресет `FollowCamera` по `sceneId` (опционально — лимит pitch, чтобы не «есть» ноги при отрицательном наклоне). */
interface ExplorationFollowCameraPreset {
  distance: number;
  height: number;
  smoothness: number;
  shoulderOffset: number;
  lookAtHeightOffset: number;
  collisionSpring: number;
  minDistance: number;
  maxDistance: number;
  collisionRayOriginY: number;
  collisionRadius: number;
  pitchMin?: number;
  pitchMax?: number;
}

const GROUND_INDOOR: RpgGroundGeometryArgs = [20, 0.1, 20];
const GROUND_VOLODKA_ROOM: RpgGroundGeometryArgs = [14, 0.1, 11.2];
const GROUND_VOLODKA_CORRIDOR: RpgGroundGeometryArgs = [3.5, 0.1, 13.2];
const GROUND_PLAZA: RpgGroundGeometryArgs = [48, 0.1, 48];
const GROUND_OPEN: RpgGroundGeometryArgs = [40, 0.1, 40];

/** Подбор лута по `E`: совпадает с подсказкой «рядом» у `WorldItem` (~1.5 м). */
const WORLD_LAYOUT_PICKUP_RADIUS = 1.42;

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
  const [radialObject, setRadialObject] = useState<InteractiveObjectConfig | null>(null);
  const [availableInteractionIds, setAvailableInteractionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [explorationBriefingOpen, setExplorationBriefingOpen] = useState(false);
  const explorationBriefingPendingRef = useRef(true);
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
  useInteractionAnticipation(availableInteractionIds.size > 0 && !playerInputLocked);

  useEffect(() => {
    registerBaseInteractions();
  }, []);

  useEffect(() => {
    return mountExplorationController();
  }, []);

  const {
    npcStates,
    cameraOrbitResyncNonce,
    triggerStates,
    setTriggerState,
    hasItem,
    playerState,
    setNPCState,
    setPlayerPosition,
    timeOfDay,
    explorationStorePosition,
    explorationWorldItems,
  } = useGameStore(
    useShallow((s) => ({
      npcStates: s.exploration.npcStates,
      cameraOrbitResyncNonce: s.exploration.cameraOrbitResyncNonce ?? 0,
      triggerStates: s.exploration.triggerStates,
      setTriggerState: s.setTriggerState,
      hasItem: s.hasItem,
      playerState: s.playerState,
      setNPCState: s.setNPCState,
      setPlayerPosition: s.setPlayerPosition,
      timeOfDay: s.exploration.timeOfDay,
      explorationStorePosition: s.exploration.playerPosition,
      explorationWorldItems: s.exploration.worldItems,
    })),
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

  /** Позиция игрока из физики каждый кадр; без подписки на стор в этом компоненте — меньше ре-рендеров Canvas/UI. */
  const livePlayerPositionRef = useRef(
    (() => {
      const p = useGameStore.getState().exploration.playerPosition;
      return { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    })(),
  );
  /** Снимок из стора: спавн `PhysicsPlayer` и бутстрап камеры/NPC при смене локации или телепорте из стора. */
  const explorationSpawnSnapshot = useMemo(() => {
    const p = explorationStorePosition;
    return sanitizeExplorationPlayerPositionAgainstSpawn(sceneId, {
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation ?? 0,
    });
  }, [sceneId, explorationStorePosition.x, explorationStorePosition.y, explorationStorePosition.z, explorationStorePosition.rotation]);

  /** Старые сейвы с `y: 1` в интерьерах с полом у ног — переписываем стор один раз, чтобы сейв не оставался «летающим». */
  useEffect(() => {
    const p = explorationStorePosition;
    const next = sanitizeExplorationPlayerPositionAgainstSpawn(sceneId, {
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation ?? 0,
    });
    if (next.x !== p.x || next.y !== p.y || next.z !== p.z) {
      setPlayerPosition(next);
    }
  }, [
    sceneId,
    explorationStorePosition.x,
    explorationStorePosition.y,
    explorationStorePosition.z,
    explorationStorePosition.rotation,
    setPlayerPosition,
  ]);

  const playerPositionRef = useRef(explorationSpawnSnapshot);
  useEffect(() => {
    playerPositionRef.current = explorationSpawnSnapshot;
  }, [explorationSpawnSnapshot]);

  useEffect(() => {
    const p = useGameStore.getState().exploration.playerPosition;
    livePlayerPositionRef.current = { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    updateExplorationLivePlayerPosition(livePlayerPositionRef.current);
  }, [sceneId]);

  /** Телепорты из 3D-интро без смены `sceneId`: синхронизируем ref камеры с стором. */
  useEffect(() => {
    if (!introCutsceneActive) return;
    const p = explorationStorePosition;
    const snap = { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    livePlayerPositionRef.current = snap;
    updateExplorationLivePlayerPosition(snap);
  }, [
    introCutsceneActive,
    explorationStorePosition.x,
    explorationStorePosition.y,
    explorationStorePosition.z,
    explorationStorePosition.rotation,
  ]);

  useEffect(() => {
    explorationBriefingPendingRef.current = true;
    setExplorationBriefingOpen(false);
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
      case 'zarema_albert_room':
        return {
          ambient: 0.46,
          light: '#fff0dc',
          fogColor: '#0c0806',
          groundGeometryArgs: GROUND_INDOOR,
        };
      case 'kitchen_dawn':
      case 'home_morning':
      case 'home_evening':
        return { ambient: 0.4, light: '#ffcc00', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR };
      case 'volodka_room':
        return {
          ambient: 0.4,
          light: '#7fe8d4',
          fogColor: '#060d10',
          groundGeometryArgs: GROUND_VOLODKA_ROOM,
        };
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
        return { ambient: 0.28, light: '#f97373', fogColor: '#140306', groundGeometryArgs: GROUND_OPEN };
      case 'street_winter':
      case 'street_night':
        return {
          ambient: 0.14,
          light: '#39ff9c',
          fogColor: '#020806',
          groundGeometryArgs: GROUND_PLAZA,
        };
      case 'district':
      case 'mvd':
        return {
          ambient: 0.2,
          light: '#dbeafe',
          fogColor: '#060912',
          groundGeometryArgs: GROUND_PLAZA,
        };
      case 'memorial_park':
        return { ambient: 0.35, light: '#ffd9a0', fogColor: '#0a1510', groundGeometryArgs: GROUND_PLAZA };
      default:
        return { ambient: 0.35, light: '#b2bec3', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR };
    }
  }, [sceneId]);

  const groundGeometryArgs = groundGeometryArgsProp ?? sceneConfig.groundGeometryArgs;

  const explorationCharacterModelScale = useMemo(
    () => getExplorationCharacterModelScale(playerSceneTuningId),
    [playerSceneTuningId],
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
  const narrowIndoorFog = useMemo(() => {
    if (sceneId === 'volodka_room') {
      if (introCutsceneActive) return { near: 4.2, far: 74 } as const;
      return { near: 1.92, far: 74 } as const;
    }
    if (sceneId === 'zarema_albert_room' || sceneId === 'kitchen_night') {
      if (introCutsceneActive) return { near: 3.9, far: 60 } as const;
      return { near: 2.15, far: 58 } as const;
    }
    if (introCutsceneActive) {
      return { near: 3.6, far: 56 } as const;
    }
    return { near: 2.65, far: 50 } as const;
  }, [introCutsceneActive, sceneId]);

  const explorationLightTuning = useMemo(() => {
    switch (sceneId) {
      case 'volodka_room':
        return {
          directionalPosition: [3.2, 7.5, 1.8] as [number, number, number],
          directionalIntensity: 0.76,
          hemisphereIntensity: 0.92,
          hemisphereGround: '#080f14',
        };
      case 'zarema_albert_room':
      case 'kitchen_night':
        return {
          directionalPosition: [-3.4, 7.9, 4.1] as [number, number, number],
          directionalIntensity: 0.52,
          hemisphereIntensity: 1.08,
          hemisphereGround: '#1a100c',
        };
      case 'district':
      case 'mvd':
        return {
          directionalPosition: [8.5, 14.5, 6.2] as [number, number, number],
          directionalIntensity: 0.74,
          hemisphereIntensity: 0.56,
          hemisphereGround: '#0b1018',
        };
      default:
        return null;
    }
  }, [sceneId]);

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

  const followCameraProps = useMemo((): ExplorationFollowCameraPreset => {
    if (sceneId === 'volodka_corridor') {
      return {
        distance: 1.82,
        height: 1.48,
        smoothness: 0.12,
        shoulderOffset: 0.05,
        lookAtHeightOffset: 0.98,
        collisionSpring: 12,
        minDistance: 1.05,
        maxDistance: 2.55,
        collisionRayOriginY: 1.05,
        collisionRadius: 0.2,
      };
    }
    if (sceneId === 'volodka_room') {
      return {
        distance: 2.38,
        height: 1.52,
        smoothness: 0.11,
        shoulderOffset: 0.1,
        lookAtHeightOffset: 1.22,
        collisionSpring: 12,
        minDistance: 1.52,
        maxDistance: 3.12,
        collisionRayOriginY: 1.42,
        collisionRadius: 0.2,
        pitchMin: -0.06,
        pitchMax: 0.38,
      };
    }
    if (sceneId === 'home_evening') {
      return {
        distance: 2.28,
        height: 1.78,
        smoothness: 0.11,
        shoulderOffset: 0.12,
        lookAtHeightOffset: 1.1,
        collisionSpring: 11,
        minDistance: 1.22,
        maxDistance: 3.05,
        collisionRayOriginY: 1.22,
        collisionRadius: 0.24,
      };
    }
    /** Узкая квартира 10×8: без пресета срабатывал дефолт с большой `height` — при отбое коллизий камера «ныряла» к ботинкам. */
    if (sceneId === 'zarema_albert_room' || sceneId === 'kitchen_night') {
      return {
        distance: 2.62,
        height: 1.58,
        smoothness: 0.11,
        shoulderOffset: 0.1,
        lookAtHeightOffset: 1.32,
        collisionSpring: 11,
        minDistance: 1.48,
        maxDistance: 3.15,
        collisionRayOriginY: 1.48,
        collisionRadius: 0.22,
        pitchMin: -0.12,
        pitchMax: 0.34,
      };
    }
    if (sceneId === 'blue_pit') {
      return {
        distance: 2.35,
        height: 1.55,
        smoothness: 0.12,
        shoulderOffset: 0.15,
        lookAtHeightOffset: 1.15,
        collisionSpring: 11,
        minDistance: 1.25,
        maxDistance: 3.25,
        collisionRayOriginY: 1.25,
        collisionRadius: 0.25,
        pitchMin: -0.1,
        pitchMax: 0.35,
      };
    }
    if (sceneId === 'battle') {
      return {
        distance: 4.35,
        height: 2.55,
        smoothness: 0.125,
        shoulderOffset: 0.22,
        lookAtHeightOffset: 1.22,
        collisionSpring: 12,
        minDistance: 2.1,
        maxDistance: 12,
        collisionRayOriginY: 1.45,
        collisionRadius: 0.28,
        pitchMin: -0.18,
        pitchMax: 0.42,
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
      smoothness: 0.115,
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

  const radialMenuActions = useMemo((): RadialMenuAction[] => {
    if (!radialObject) return [];
    return getExplorationRadialMenuActions(sceneId, radialObject, hasItem);
  }, [sceneId, radialObject, hasItem]);

  const radialMenuAnchorLabel = useMemo(() => {
    if (!radialObject) return undefined;
    const parts = [`${radialObject.type} · ${radialObject.id}`];
    if (radialObject.itemId) parts.push(`item: ${radialObject.itemId}`);
    return parts.join(' · ');
  }, [radialObject]);

  // Позиция только в ref + мост: не вызывать setPlayerPosition здесь (конфликт с kinematic / мерцание).
  const handlePositionChange = useCallback(
    (pos: { x: number; y: number; z: number; rotation: number }) => {
      const next = { x: pos.x, y: pos.y, z: pos.z, rotation: pos.rotation };
      livePlayerPositionRef.current = next;
      playerPositionRef.current = next;
      updateExplorationLivePlayerPosition(next);
      if (explorationBriefingPendingRef.current && !playerInputLocked) {
        explorationBriefingPendingRef.current = false;
        queueMicrotask(() => setExplorationBriefingOpen(true));
      }
    },
    [playerInputLocked],
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

  const onInteractionAvailabilityChange = useCallback((ids: ReadonlySet<string>) => {
    setAvailableInteractionIds(ids);
  }, []);

  const tryPickupNearestWorldLayoutItem = useCallback((): boolean => {
    const pos = playerPositionRef.current;
    if (!pos) return false;
    const st = useGameStore.getState();
    const defs = getWorldItemsForScene(sceneId);
    let best: (typeof defs)[0] | null = null;
    let bestD = WORLD_LAYOUT_PICKUP_RADIUS;
    for (const def of defs) {
      const row = st.exploration.worldItems.find((w) => w.id === def.id);
      if (row?.collected) continue;
      const dx = pos.x - def.position.x;
      const dy = pos.y - def.position.y;
      const dz = pos.z - def.position.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < bestD) {
        bestD = d;
        best = def;
      }
    }
    if (!best) return false;
    const hasRow = st.exploration.worldItems.some((w) => w.id === best.id);
    if (!hasRow) {
      st.addWorldItem({
        id: best.id,
        itemId: best.itemId,
        position: { x: best.position.x, y: best.position.y, z: best.position.z },
        sceneId: best.sceneId as SceneId,
        collected: false,
      });
    }
    st.collectWorldItem(best.id);
    st.addItem(best.itemId, 1);
    const meta = getItemById(best.itemId);
    eventBus.emit('ui:exploration_message', {
      text: meta ? `В инвентарь: ${meta.name}` : 'Предмет подобран.',
    });
    return true;
  }, [sceneId]);

  // Handle player interaction (E / тач) — `resolveExplorationInteractionPriority` (NPC / объект / триггеры по дистанции + тиры)
  const handlePlayerInteraction = useCallback(() => {
    if (playerInputLocked) return;
    if (explorationBriefingOpen) {
      setExplorationBriefingOpen(false);
      return;
    }

    if (tryPickupNearestWorldLayoutItem()) {
      emitInteractionFeedback('success', 'loot');
      return;
    }

    if (radialObject) {
      setRadialObject(null);
      return;
    }

    const currentPos = playerPositionRef.current;
    if (!currentPos) return;

    const target = resolveExplorationInteractionPriority({
      playerPosition: currentPos,
      sceneTriggers,
      triggerStates,
      sceneInteractiveObjects,
      sceneNPCs,
      npcStates,
      availableInteractionIds,
    });

    if (target.kind === 'registry') {
      const st = useGameStore.getState();
      const ran = explorationInteractionRegistry.tryExecute(target.interactionId, {
        setGameMode: st.setGameMode,
        onNPCInteraction,
        activateQuest: st.activateQuest,
        incrementQuestObjective: st.incrementQuestObjective,
        completeQuest: st.completeQuest,
        isQuestActive: st.isQuestActive,
        isQuestCompleted: st.isQuestCompleted,
        getQuestProgress: st.getQuestProgress,
      });
      if (ran) {
        emitInteractionFeedback('success', 'registry');
        return;
      }
      emitInteractionFeedback('fail', 'registry');
      return;
    }

    if (target.kind === 'story_trigger') {
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
      emitInteractionFeedback('success', 'trigger');
      return;
    }

    if (target.kind === 'world_object') {
      setRadialObject(target.object);
      emitInteractionFeedback('success', 'object');
      return;
    }

    if (target.kind === 'npc') {
      const nearestNPC = sceneNPCs.find((n) => n.id === target.npcId);
      if (!nearestNPC) return;
      const entry = getCurrentScheduleEntry(nearestNPC.id, timeOfDay);
      if (entry && !entry.dialogueAvailable) {
        eventBus.emit('ui:exploration_message', { text: 'Персонаж сейчас недоступен' });
        emitInteractionFeedback('fail', 'npc');
        return;
      }
      onNPCInteraction(nearestNPC.id);
      emitInteractionFeedback('success', 'npc');
      return;
    }

    emitInteractionFeedback('fail');
  }, [
    playerInputLocked,
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
    explorationBriefingOpen,
    tryPickupNearestWorldLayoutItem,
  ]);

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
      <Physics timeStep={1 / 60} gravity={[0, -9.81, 0]} debug={rapierColliderDebug}>
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
            visualModelScale={explorationCharacterModelScale}
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
            visualModelScale={explorationCharacterModelScale}
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
