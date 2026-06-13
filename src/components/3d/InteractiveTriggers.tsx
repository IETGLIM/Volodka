
/* ─── Volodka RPG – Interactive triggers with god-ray highlight, particle burst, pulse tooltip,
     NPC staged interaction routing, and centralized prompt stacking ─── */

import { useRef, useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useCurrentSceneId, useInteractionOverlay, useTimeOfDay, useSceneExitState, useScheduleContext } from '@/store/selectors';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';
import { TRIGGER_ZONES, type TriggerZone, INTERACTION_LABELS, isTriggerZoneAvailable } from '@/data/triggerZones';
import { findNpcById, findNpcByDialogueNodeId } from '@/data/allNpcDefinitions';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { formatNpcActivityHint } from '@/engine/npc/npcActivityPresentation';
import { eventBus } from '@/engine/EventBus';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomInteractPromptPx } from '@/shared/constants/hudLayout';
import { getSceneExits } from '@/config/scenes';
import {
  queryInteractionTargets,
  type InteractionTargetHit,
  type NpcQueryTarget,
  type ExitQueryTarget,
} from '@/engine/interaction/interactionTargetQuery';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { ProximityGodRay } from './ProximityGodRay';

/** Maximum number of visible [E] prompts at once */
const MAX_VISIBLE_PROMPTS = 2;

/** Scene exit proximity — matches SceneExitIndicator */
const EXIT_PROXIMITY_RANGE = 2.5;

const LMB_CLICK_DRAG_THRESHOLD_PX = 12;

function isCanvasAreaTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement;
  if (!(el instanceof Element)) return false;
  if (el.tagName === 'CANVAS') return true;
  return !el.closest(
    '[data-exploration-ui], [data-panel], dialog, [role="dialog"], button, a, input, textarea',
  );
}

/** Runtime refs for a trigger zone — updated by the central interaction tick */
interface ZoneProximityRuntime {
  proximityRef: React.MutableRefObject<number>;
  pulsePhaseRef: React.MutableRefObject<number>;
  showIndicatorRef: React.MutableRefObject<boolean>;
  lastPromptDistanceRef: React.MutableRefObject<number | null>;
  triggeredRef: React.MutableRefObject<boolean>;
  triggerCooldown: React.MutableRefObject<number>;
  particlesRef: React.MutableRefObject<ParticleData[]>;
  particleInstanceRef: React.MutableRefObject<THREE.InstancedMesh | null>;
  outlineFlashRef: React.MutableRefObject<boolean>;
}

/** Runtime refs for an NPC proximity highlight */
interface NpcProximityRuntime {
  proximityRef: React.MutableRefObject<number>;
  pulsePhaseRef: React.MutableRefObject<number>;
  showIndicatorRef: React.MutableRefObject<boolean>;
  lastPromptDistanceRef: React.MutableRefObject<number | null>;
}

function createZoneProximityRuntime(): ZoneProximityRuntime {
  return {
    proximityRef: { current: 0 },
    pulsePhaseRef: { current: 0 },
    showIndicatorRef: { current: false },
    lastPromptDistanceRef: { current: null },
    triggeredRef: { current: false },
    triggerCooldown: { current: 0 },
    particlesRef: { current: [] },
    particleInstanceRef: { current: null },
    outlineFlashRef: { current: false },
  };
}

function createNpcProximityRuntime(): NpcProximityRuntime {
  return {
    proximityRef: { current: 0 },
    pulsePhaseRef: { current: 0 },
    showIndicatorRef: { current: false },
    lastPromptDistanceRef: { current: null },
  };
}

function reconcileProximityPrompt(
  id: string,
  label: string,
  type: 'zone' | 'npc',
  dist: number,
  shouldShow: boolean,
  isNear: boolean,
  runtime: { showIndicatorRef: React.MutableRefObject<boolean>; lastPromptDistanceRef: React.MutableRefObject<number | null> },
  registerPrompt: (data: PromptData) => void,
  unregisterPrompt: (id: string) => void,
): void {
  const distanceChangedSignificantly =
    runtime.lastPromptDistanceRef.current === null ||
    Math.abs(dist - runtime.lastPromptDistanceRef.current) > 0.2;

  if (shouldShow !== runtime.showIndicatorRef.current) {
    runtime.showIndicatorRef.current = shouldShow;
    if (isNear) {
      registerPrompt({ id, label, distance: dist, type });
      runtime.lastPromptDistanceRef.current = dist;
    } else {
      unregisterPrompt(id);
      runtime.lastPromptDistanceRef.current = null;
    }
  } else if (shouldShow && distanceChangedSignificantly) {
    registerPrompt({ id, label, distance: dist, type });
    runtime.lastPromptDistanceRef.current = dist;
  }
}

function updateZoneParticles(runtime: ZoneProximityRuntime, delta: number): void {
  const particles = runtime.particlesRef.current;
  const mesh = runtime.particleInstanceRef.current;
  if (particles.length === 0 || !mesh) return;

  let writeIdx = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.life += delta;
    if (p.life > 0.8) continue;

    p.position[0] += p.velocity[0] * delta;
    p.position[1] += p.velocity[1] * delta;
    p.position[2] += p.velocity[2] * delta;
    p.velocity[0] *= 0.95;
    p.velocity[1] = p.velocity[1] * 0.95 - delta * 2;
    p.velocity[2] *= 0.95;

    const opacity = Math.max(0, 1 - p.life / 0.8);
    const scale = 0.06 * opacity;

    tempMatrix.makeScale(scale, scale, scale);
    tempMatrix.setPosition(p.position[0], p.position[1], p.position[2]);
    mesh.setMatrixAt(writeIdx, tempMatrix);

    tempColor.setRGB(0.27 * opacity, 1.0 * opacity, 1.0 * opacity);
    mesh.setColorAt(writeIdx, tempColor);

    if (writeIdx !== i) particles[writeIdx] = p;
    writeIdx++;
  }
  particles.length = writeIdx;

  for (let i = writeIdx; i < MAX_PARTICLES; i++) {
    tempMatrix.makeScale(0, 0, 0);
    mesh.setMatrixAt(i, tempMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}


/** Prompt data for centralized overlay */
interface PromptData {
  id: string;
  label: string;
  distance: number;
  type: 'zone' | 'npc';
}

function getTopPrompts(hits: InteractionTargetHit[]): InteractionTargetHit[] {
  return hits.slice(0, MAX_VISIBLE_PROMPTS);
}

interface InteractiveTriggersProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

/** Trigger zones and "Press E" indicators with centralized prompt management */
export function InteractiveTriggers({
  livePlayerPositionRef,
  livePlayerRotationRef,
}: InteractiveTriggersProps) {
  const promptFadeInAnim = `promptFadeIn-${useId().replace(/:/g, '')}`;
  const { sceneId, gameMode, showStoryOverlay, currentNodeId } = useInteractionOverlay();
  const {
    playerFlags,
    playerKarma,
    playerSkills,
    collectedPoems,
    currentAct,
    timeOfDay: exitTimeOfDay,
  } = useSceneExitState();
  const timeOfDay = useTimeOfDay();
  const scheduleCtx = useScheduleContext();
  const zones = useMemo(
    () =>
      TRIGGER_ZONES.filter(
        (z) =>
          z.sceneId === sceneId &&
          isTriggerZoneAvailable(z, playerFlags, currentAct),
      ),
    [sceneId, playerFlags, currentAct],
  );

  const sceneExits = useMemo(
    () =>
      getSceneExits(sceneId, playerFlags, playerKarma, {
        skills: playerSkills,
        collectedPoems,
        currentAct,
        timeOfDay: exitTimeOfDay,
      }),
    [sceneId, playerFlags, playerKarma, playerSkills, collectedPoems, currentAct, exitTimeOfDay],
  );

  const overlappedExitIndices = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < sceneExits.length; i++) {
      const exit = sceneExits[i];
      const overlapped = zones.some(
        (z) =>
          z.sceneId === sceneId &&
          Math.abs(z.position[0] - exit.position[0]) < 1.5 &&
          Math.abs(z.position[2] - exit.position[2]) < 1.5,
      );
      if (overlapped) set.add(i);
    }
    return set;
  }, [zones, sceneExits]);

  const npcQueryTargets = useMemo((): NpcQueryTarget[] => {
    const npcIdsInScene = getNPCsForScene(sceneId, timeOfDay, scheduleCtx);
    return npcIdsInScene
      .map((npcId) => {
        const npc = findNpcById(npcId);
        if (!npc) return null;
        const entry = getCurrentScheduleEntry(npcId, timeOfDay, scheduleCtx);
        return {
          id: `npc_${npcId}`,
          npcId,
          position: (entry?.position ?? npc.defaultPosition) as [number, number, number],
          label: `Поговорить с ${npc.name}`,
          activity: entry?.activity,
        };
      })
      .filter(Boolean) as NpcQueryTarget[];
  }, [sceneId, timeOfDay, scheduleCtx]);

  const npcQueryTargetsRef = useRef(npcQueryTargets);
  const sceneExitsRef = useRef(sceneExits);
  const overlappedExitIndicesRef = useRef(overlappedExitIndices);
  const zonesRef = useRef(zones);
  const sceneIdRef = useRef(sceneId);
  const isOverlayBlockingRef = useRef(false);
  const executeInteractionHitRef = useRef<(hit: InteractionTargetHit) => boolean>(() => false);

  // Hide prompts when not exploring or when narrative overlay locks movement (non-hub nodes)
  const isOverlayBlocking =
    gameMode !== 'exploration' ||
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId);

  // Shared ref: which prompt IDs are allowed to show (closest MAX_VISIBLE_PROMPTS)
  const allowedIdsRef = useRef<Set<string>>(new Set());
  // Track all currently near prompt entries for centralized rendering
  const promptsMapRef = useRef<Map<string, PromptData>>(new Map());
  // React state for rendering the overlay (updated less frequently than frame)
  const [visiblePrompts, setVisiblePrompts] = useState<PromptData[]>([]);
  const frameCountRef = useRef(0);
  const lastHintIdRef = useRef<string | null>(null);
  const eKeyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const proximityTempVecRef = useRef(new THREE.Vector3());
  const zoneRuntimeRef = useRef(new Map<string, ZoneProximityRuntime>());
  const npcRuntimeRef = useRef(new Map<string, NpcProximityRuntime>());

  useEffect(() => {
    const map = zoneRuntimeRef.current;
    const ids = new Set(zones.map((z) => z.id));
    for (const zone of zones) {
      if (!map.has(zone.id)) map.set(zone.id, createZoneProximityRuntime());
    }
    for (const key of [...map.keys()]) {
      if (!ids.has(key)) map.delete(key);
    }
  }, [zones]);

  useEffect(() => {
    const map = npcRuntimeRef.current;
    const ids = new Set(npcQueryTargets.map((n) => n.npcId));
    for (const npc of npcQueryTargets) {
      if (!map.has(npc.npcId)) map.set(npc.npcId, createNpcProximityRuntime());
    }
    for (const key of [...map.keys()]) {
      if (!ids.has(key)) map.delete(key);
    }
  }, [npcQueryTargets]);

  useSceneEnterEffect(() => {
    promptsMapRef.current.clear();
    allowedIdsRef.current.clear();
    setVisiblePrompts([]);
    if (eKeyTimerRef.current) clearTimeout(eKeyTimerRef.current);
    eKeyTimerRef.current = undefined;
    window.__volodka_ekey_consumed = false;
    lastHintIdRef.current = null;
    eventBus.emit('interaction:end', {});
  });

  const executeInteractionHit = useCallback((hit: InteractionTargetHit): boolean => {
    if (hit.kind === 'npc' && hit.npcId) {
      eventBus.emit('interaction:start', { npcId: hit.npcId });
      return true;
    }

    if (hit.kind === 'exit') {
      const lastSep = hit.id.lastIndexOf('_');
      if (lastSep > 5 && hit.id.startsWith('exit_')) {
        const idx = Number.parseInt(hit.id.slice(lastSep + 1), 10);
        const exit = sceneExits[idx];
        if (exit) {
          requestSceneTransition(exit.targetScene, exit.spawnAt);
          return true;
        }
      }
      return false;
    }

    const zone = zones.find((z) => z.id === hit.triggerZoneId);
    if (!zone) return false;

    if (zone.linkedDialogueNodeId) {
      const npcDef = findNpcByDialogueNodeId(zone.linkedDialogueNodeId);
      if (npcDef) {
        eventBus.emit('interaction:start', { npcId: npcDef.id });
        return true;
      }
    }

    eventBus.emit('object:interact', {
      objectId: zone.id,
      sceneId,
      triggerZoneId: zone.id,
    });
    eventBus.emit('object:highlight', {
      triggerZoneId: zone.id,
      position: zone.position,
      size: zone.size,
    });
    return true;
  }, [sceneExits, sceneId, zones]);

  useEffect(() => {
    isOverlayBlockingRef.current = isOverlayBlocking;
    sceneExitsRef.current = sceneExits;
    zonesRef.current = zones;
    sceneIdRef.current = sceneId;
    npcQueryTargetsRef.current = npcQueryTargets;
    overlappedExitIndicesRef.current = overlappedExitIndices;
    executeInteractionHitRef.current = executeInteractionHit;
  });

  const firePrimaryInteraction = useCallback((): boolean => {
    if (isOverlayBlockingRef.current) return false;
    if (isInteractionLocked()) return false;
    if (window.__volodka_ekey_consumed) return false;

    const playerPos = livePlayerPositionRef.current;
    const lookYaw = sharedCameraYawRef.current;
    const sceneExits = sceneExitsRef.current;
    const zones = zonesRef.current;
    const sceneId = sceneIdRef.current;
    const npcQueryTargets = npcQueryTargetsRef.current;

    const exitTargets: ExitQueryTarget[] = [];
    for (let idx = 0; idx < sceneExits.length; idx++) {
      const exit = sceneExits[idx];
      const hasOverlap = zones.some(
        (z) =>
          z.sceneId === sceneId &&
          Math.abs(z.position[0] - exit.position[0]) < 1.5 &&
          Math.abs(z.position[2] - exit.position[2]) < 1.5,
      );
      if (hasOverlap) continue;
      exitTargets.push({
        id: `exit_${exit.targetScene}_${idx}`,
        position: exit.position,
        label: exit.label,
        maxRange: EXIT_PROXIMITY_RANGE,
      });
    }

    const hits = queryInteractionTargets({
      playerPos,
      playerYaw: lookYaw,
      zones,
      npcs: npcQueryTargets,
      exits: exitTargets,
      checkLineOfSight: true,
    });

    const primary = hits[0];
    if (!primary) return false;

    const handled = executeInteractionHitRef.current(primary);
    if (!handled) return false;

    if (eKeyTimerRef.current) clearTimeout(eKeyTimerRef.current);
    window.__volodka_ekey_consumed = true;
    eKeyTimerRef.current = setTimeout(() => {
      window.__volodka_ekey_consumed = false;
      eKeyTimerRef.current = undefined;
    }, 200);

    return true;
  }, [livePlayerPositionRef]);

  useEffect(() => {
    return () => {
      if (eKeyTimerRef.current) clearTimeout(eKeyTimerRef.current);
    };
  }, []);

  // Central E-key router — one code path instead of per-trigger duplicates.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      if (!firePrimaryInteraction()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    const onInteractPress = () => {
      firePrimaryInteraction();
    };

    window.addEventListener('keydown', onKeyDown, true);
    const unsub = eventBus.on('interact:press', onInteractPress);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      unsub();
    };
  }, [firePrimaryInteraction]);

  // Left-click on canvas — same interaction router as E (short click, not drag).
  useEffect(() => {
    let downX = 0;
    let downY = 0;
    let pointerDown = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!isCanvasAreaTarget(e.target)) return;
      pointerDown = true;
      downX = e.clientX;
      downY = e.clientY;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 0 || !pointerDown) return;
      pointerDown = false;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (dx * dx + dy * dy > LMB_CLICK_DRAG_THRESHOLD_PX * LMB_CLICK_DRAG_THRESHOLD_PX) return;
      if (firePrimaryInteraction()) {
        e.preventDefault();
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [firePrimaryInteraction]);

  const registerPrompt = useCallback((data: PromptData) => {
    promptsMapRef.current.set(data.id, data);
  }, []);

  const unregisterPrompt = useCallback((id: string) => {
    promptsMapRef.current.delete(id);
  }, []);

  // Compute allowed IDs, proximity highlights, and visible prompts in one pass
  useFrameTick('interaction', ({ delta }) => {
    // Don't show any prompts when overlays (dialogue/story/panels) are active
    if (isOverlayBlocking) {
      if (promptsMapRef.current.size > 0) {
        promptsMapRef.current.clear();
        setVisiblePrompts([]);
      }
      if (lastHintIdRef.current !== null) {
        lastHintIdRef.current = null;
        eventBus.emit('interaction:end', {});
      }
      for (const runtime of zoneRuntimeRef.current.values()) {
        runtime.showIndicatorRef.current = false;
        runtime.proximityRef.current = 0;
      }
      for (const runtime of npcRuntimeRef.current.values()) {
        runtime.showIndicatorRef.current = false;
        runtime.proximityRef.current = 0;
      }
      return;
    }

    const playerPos = livePlayerPositionRef.current;
    const playerYaw = sharedCameraYawRef.current;
    const tempVec = proximityTempVecRef.current;
    const interactionLocked = isInteractionLocked();

    if (interactionLocked) {
      allowedIdsRef.current = new Set();
      if (promptsMapRef.current.size > 0) {
        promptsMapRef.current.clear();
      }
      for (const runtime of zoneRuntimeRef.current.values()) {
        runtime.showIndicatorRef.current = false;
        runtime.proximityRef.current = 0;
      }
      for (const runtime of npcRuntimeRef.current.values()) {
        runtime.showIndicatorRef.current = false;
        runtime.proximityRef.current = 0;
      }
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0) {
        setVisiblePrompts((prev) => (prev.length === 0 ? prev : []));
      }
      return;
    }

    const exitTargets: ExitQueryTarget[] = [];
    for (let idx = 0; idx < sceneExitsRef.current.length; idx++) {
      if (overlappedExitIndicesRef.current.has(idx)) continue;
      const exit = sceneExitsRef.current[idx];

      exitTargets.push({
        id: `exit_${exit.targetScene}_${idx}`,
        position: exit.position,
        label: exit.label,
        maxRange: EXIT_PROXIMITY_RANGE,
      });
    }

    const hits = queryInteractionTargets({
      playerPos,
      playerYaw,
      zones,
      npcs: npcQueryTargetsRef.current,
      exits: exitTargets,
      checkLineOfSight: true,
    });

    const topHits = getTopPrompts(hits);
    allowedIdsRef.current = new Set(topHits.map((h) => h.id));

    const primaryHit = topHits[0];
    if (primaryHit) {
      if (lastHintIdRef.current !== primaryHit.id) {
        lastHintIdRef.current = primaryHit.id;
        const npcTarget =
          primaryHit.kind === 'npc'
            ? npcQueryTargetsRef.current.find((n) => n.id === primaryHit.id)
            : undefined;
        eventBus.emit('interaction:hint', {
          label: primaryHit.label,
          key: 'E',
          description: formatNpcActivityHint(npcTarget?.activity),
          type:
            primaryHit.kind === 'npc'
              ? 'npc'
              : primaryHit.kind === 'exit'
                ? 'exit'
                : 'object',
        });
      }
    } else if (lastHintIdRef.current !== null) {
      lastHintIdRef.current = null;
      eventBus.emit('interaction:end', {});
    }

    const activeExitIds = new Set<string>();
    for (const hit of hits) {
      if (hit.kind === 'exit') {
        activeExitIds.add(hit.id);
        promptsMapRef.current.set(hit.id, {
          id: hit.id,
          label: hit.label,
          distance: hit.distance,
          type: 'zone',
        });
      }
    }
    for (const key of promptsMapRef.current.keys()) {
      if (key.startsWith('exit_') && !activeExitIds.has(key)) {
        promptsMapRef.current.delete(key);
      }
    }

    // Zone proximity — god rays, prompts, enter toasts, particles
    for (const zone of zonesRef.current) {
      const runtime = zoneRuntimeRef.current.get(zone.id);
      if (!runtime) continue;

      tempVec.set(zone.position[0], zone.position[1], zone.position[2]);
      const dist = playerPos.distanceTo(tempVec);
      const range = Math.max(zone.size[0], zone.size[2]) / 2 + 1.0;
      const isNear = dist < range;
      const isAllowed = allowedIdsRef.current.has(zone.id);
      const shouldShow = isNear && isAllowed;
      runtime.proximityRef.current = shouldShow ? Math.max(0.35, 1 - dist / (range + 1.2)) : 0;

      reconcileProximityPrompt(
        zone.id,
        zone.interactionLabel ?? INTERACTION_LABELS[zone.interactionType ?? 'default'],
        'zone',
        dist,
        shouldShow,
        isNear,
        runtime,
        registerPrompt,
        unregisterPrompt,
      );

      if (shouldShow) runtime.pulsePhaseRef.current += delta * 3;

      runtime.triggerCooldown.current = Math.max(0, runtime.triggerCooldown.current - delta);
      if (isNear && !runtime.triggeredRef.current && runtime.triggerCooldown.current <= 0) {
        runtime.triggeredRef.current = true;
        runtime.triggerCooldown.current = 10;
        if (zone.enterToast) {
          eventBus.emit('ui:exploration_message', { text: zone.enterToast });
        }
        if (zone.autoTrigger && zone.effects && zone.effects.length > 0) {
          eventBus.emit('trigger:auto_execute', { triggerZoneId: zone.id });
        }
      }
      if (dist > range + 0.5) runtime.triggeredRef.current = false;

      updateZoneParticles(runtime, delta);
    }

    // NPC proximity — god rays and prompts
    for (const npc of npcQueryTargetsRef.current) {
      const runtime = npcRuntimeRef.current.get(npc.npcId);
      if (!runtime) continue;

      tempVec.set(npc.position[0], npc.position[1], npc.position[2]);
      const dist = playerPos.distanceTo(tempVec);
      const isNear = dist < 3.0;
      const promptId = `npc_${npc.npcId}`;
      const isAllowed = allowedIdsRef.current.has(promptId);
      const shouldShow = isNear && isAllowed;
      runtime.proximityRef.current = shouldShow ? Math.max(0.4, 1 - dist / 3.5) : 0;
      if (shouldShow) runtime.pulsePhaseRef.current += delta * 3.2;

      reconcileProximityPrompt(
        promptId,
        npc.label,
        'npc',
        dist,
        shouldShow,
        isNear,
        runtime,
        registerPrompt,
        unregisterPrompt,
      );
    }

    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return;

    const top3: PromptData[] = topHits.map((hit) => ({
      id: hit.id,
      label: hit.label,
      distance: hit.distance,
      type: hit.kind === 'npc' ? 'npc' : 'zone',
    }));

    setVisiblePrompts((prev) => {
      if (prev.length !== top3.length) return top3;
      if (prev.some((p, i) => p.id !== top3[i]?.id)) return top3;
      return prev;
    });
  });

  return (
    <group key={`triggers:${sceneId}`}>
      {zones.map((zone) => {
        let runtime = zoneRuntimeRef.current.get(zone.id);
        if (!runtime) {
          runtime = createZoneProximityRuntime();
          zoneRuntimeRef.current.set(zone.id, runtime);
        }
        return (
          <TriggerZoneComponent
            key={zone.id}
            zone={zone}
            runtime={runtime}
            unregisterPrompt={unregisterPrompt}
          />
        );
      })}

      {/* NPC proximity triggers — separate from static trigger zones */}
      <NPCProximityTriggers
        npcQueryTargets={npcQueryTargets}
        npcRuntimeRef={npcRuntimeRef}
        unregisterPrompt={unregisterPrompt}
      />

      {/* Centralized prompt overlay — limited to closest, cinematic style */}
      {/* Screen-edge indicator for off-screen interactables */}
      {visiblePrompts.length > 0 && !isOverlayBlocking && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          {/* Subtle screen-edge glow to indicate nearby interactables */}
          <div
            style={{
              position: 'fixed',
              inset: '0',
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 80px 15px rgba(0, 255, 238, 0.04)',
              zIndex: UI_LAYERS.WORLD_LABELS,
            }}
          />
          {/* Prompt container — bottom center, cinematic style */}
          <div
            style={{
              position: 'fixed',
              bottom: `${bottomInteractPromptPx()}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: UI_LAYERS.WORLD_LABELS,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'none',
            }}
          >
            {visiblePrompts.map((prompt, i) => {
              const isNPC = prompt.type === 'npc';
              const accentColor = isNPC ? '#ffb828' : '#00ffe8';
              const accentRgba = isNPC ? '255, 184, 40' : '0, 255, 232';
              const isPrimary = i === 0; // Closest prompt is primary
              return (
                <div
                  key={prompt.id}
                  style={{
                    background: isPrimary
                      ? `rgba(2, 4, 15, 0.94)`
                      : `rgba(2, 4, 15, 0.82)`,
                    color: isPrimary ? '#fff' : 'rgba(200, 210, 230, 0.9)',
                    padding: isPrimary ? '8px 20px' : '6px 14px',
                    borderRadius: '4px',
                    fontSize: isPrimary ? '15px' : '13px',
                    fontWeight: isPrimary ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    border: isPrimary
                      ? `1px solid rgba(${accentRgba}, 0.8)`
                      : `1px solid rgba(${accentRgba}, 0.35)`,
                    boxShadow: isPrimary
                      ? `0 0 20px rgba(${accentRgba}, 0.25), 0 0 6px rgba(${accentRgba}, 0.15), inset 0 0 8px rgba(${accentRgba}, 0.06)`
                      : `0 0 10px rgba(${accentRgba}, 0.12), 0 0 3px rgba(${accentRgba}, 0.08)`,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    letterSpacing: '0.04em',
                    opacity: 0,
                    animation: `${promptFadeInAnim} 0.25s ease ${i * 0.08}s forwards`,
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    color: accentColor,
                    marginRight: '6px',
                    textShadow: `0 0 8px rgba(${accentRgba}, 0.5)`,
                    fontWeight: 'bold',
                    fontSize: isPrimary ? '14px' : '12px',
                  }}>
                    [ЛКМ / E]
                  </span>
                  <span style={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    fontSize: isPrimary ? '14px' : '12px',
                    letterSpacing: '0.02em',
                  }}>
                    {prompt.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Inline keyframes for prompt fade-in */}
          <style>{`
            @keyframes ${promptFadeInAnim} {
              from { opacity: 0; transform: translateY(12px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}

/**
 * NPC proximity god-ray markers — proximity tick runs in InteractiveTriggers parent.
 */
function NPCProximityTriggers({
  npcQueryTargets,
  npcRuntimeRef,
  unregisterPrompt,
}: {
  npcQueryTargets: NpcQueryTarget[];
  npcRuntimeRef: React.MutableRefObject<Map<string, NpcProximityRuntime>>;
  unregisterPrompt: (id: string) => void;
}) {
  return (
    <group>
      {npcQueryTargets.map((npc) => {
        let runtime = npcRuntimeRef.current.get(npc.npcId);
        if (!runtime) {
          runtime = createNpcProximityRuntime();
          npcRuntimeRef.current.set(npc.npcId, runtime);
        }
        return (
          <NPCProximityMarker
            key={npc.npcId}
            npcId={npc.npcId}
            position={npc.position}
            runtime={runtime}
            unregisterPrompt={unregisterPrompt}
          />
        );
      })}
    </group>
  );
}

/** Visual marker for a single NPC proximity highlight */
function NPCProximityMarker({
  npcId,
  position,
  runtime,
  unregisterPrompt,
}: {
  npcId: string;
  position: [number, number, number];
  runtime: NpcProximityRuntime;
  unregisterPrompt: (id: string) => void;
}) {
  const promptId = `npc_${npcId}`;

  useEffect(() => {
    return () => {
      unregisterPrompt(promptId);
    };
  }, [promptId, unregisterPrompt]);

  return (
    <group position={position}>
      <ProximityGodRay
        activeRef={runtime.showIndicatorRef}
        color="#ffb828"
        beamHeight={2.6}
        baseY={0.2}
        proximityRef={runtime.proximityRef}
        pulsePhaseRef={runtime.pulsePhaseRef}
      />
    </group>
  );
}

/** Internal particle data stored in ref — not React state to avoid per-frame re-renders (P0-2.3) */
interface ParticleData {
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
}

/** Maximum number of sparkle particles per trigger zone (InstancedMesh pool size) */
const MAX_PARTICLES = 8;

// Pre-computed identity matrix for InstancedMesh reset (shared by zone particle tick)
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

/** Single trigger zone — proximity tick runs in InteractiveTriggers parent */
function TriggerZoneComponent({
  zone,
  runtime,
  unregisterPrompt,
}: {
  zone: TriggerZone;
  runtime: ZoneProximityRuntime;
  unregisterPrompt: (id: string) => void;
}) {
  const outlineFlashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const particleGeo = useMemo(() => new THREE.SphereGeometry(0.06, 4, 4), []);
  const particleMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#44ffff',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }), []);

  useEffect(() => {
    runtime.particleInstanceRef.current = null;
  }, [runtime]);

  useEffect(() => {
    const geo = particleGeo;
    const mat = particleMat;
    return () => {
      runtime.particlesRef.current = [];
      const mesh = runtime.particleInstanceRef.current;
      if (mesh) {
        for (let i = 0; i < MAX_PARTICLES; i++) {
          tempMatrix.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, tempMatrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      geo.dispose();
      mat.dispose();
    };
  }, [particleGeo, particleMat, runtime]);

  const spawnParticles = useCallback(() => {
    const newParticles: ParticleData[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / MAX_PARTICLES;
      newParticles.push({
        position: [0, zone.size[1] / 2, 0],
        velocity: [
          Math.cos(angle) * (1.5 + Math.random()),
          2 + Math.random() * 2,
          Math.sin(angle) * (1.5 + Math.random()),
        ],
        life: 0,
      });
    }
    runtime.particlesRef.current = [...runtime.particlesRef.current, ...newParticles].slice(-MAX_PARTICLES);

    const mesh = runtime.particleInstanceRef.current;
    if (mesh) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        tempMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, tempMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }, [runtime, zone.size]);

  useEffect(() => {
    const onObjectInteract = (payload: { triggerZoneId?: string }) => {
      if (payload.triggerZoneId !== zone.id) return;
      spawnParticles();
      runtime.outlineFlashRef.current = true;
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
      outlineFlashTimer.current = setTimeout(() => {
        runtime.outlineFlashRef.current = false;
      }, 200);
    };

    const onHighlight = (payload: { triggerZoneId?: string }) => {
      if (payload.triggerZoneId !== zone.id) return;
      spawnParticles();
    };

    const unsubInteract = eventBus.on('object:interact', onObjectInteract);
    const unsubHighlight = eventBus.on('object:highlight', onHighlight);
    return () => {
      unsubInteract();
      unsubHighlight();
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
    };
  }, [zone.id, spawnParticles, runtime]);

  useEffect(() => {
    return () => {
      unregisterPrompt(zone.id);
    };
  }, [zone.id, unregisterPrompt]);

  return (
    <group position={zone.position}>
      <ProximityGodRay
        activeRef={runtime.showIndicatorRef}
        color="#88eeff"
        beamHeight={Math.max(zone.size[1] + 1.6, 2.2)}
        baseY={Math.max(zone.size[1] * 0.2, 0.35)}
        proximityRef={runtime.proximityRef}
        flashRef={runtime.outlineFlashRef}
        pulsePhaseRef={runtime.pulsePhaseRef}
      />

      <instancedMesh
        ref={(node) => {
          runtime.particleInstanceRef.current = node;
        }}
        args={[particleGeo, particleMat, MAX_PARTICLES]}
        frustumCulled={false}
      />
    </group>
  );
}

export { WorldItem } from './WorldItem';
