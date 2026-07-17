
/* ─── Volodka RPG – Interactive triggers with god-ray highlight, particle burst, pulse tooltip,
     NPC staged interaction routing, and centralized prompt stacking ─── */

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useInteractionOverlay, useTimeOfDay, useSceneExitState, useScheduleContext } from '@/store/selectors';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';
import { useEKeyInteraction } from '@/hooks/useEKeyInteraction';
import { TRIGGER_ZONES, INTERACTION_LABELS, isTriggerZoneAvailable } from '@/data/triggerZones';
import { findNpcById, findNpcByDialogueNodeId } from '@/data/allNpcDefinitions';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { formatNpcActivityHint } from '@/engine/npc/npcActivityPresentation';
import { eventBus } from '@/engine/EventBus';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getSceneExits } from '@/config/scenes';
import {
  queryInteractionTargets,
  type InteractionTargetHit,
  type NpcQueryTarget,
  type ExitQueryTarget,
} from '@/engine/interaction/interactionTargetQuery';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { resetEKeyConsumption } from '@/engine/input/eKeyConsumption';
import { NPC_INTERACTION_RANGE } from '@/engine/player/playerConstants';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import {
  resolvePoemExplorationHighlight,
  shouldHighlightZoneForPoemMode,
} from '@/engine/poemWorld/poemExplorationHighlight';
import {
  createNpcProximityRuntime,
  createZoneProximityRuntime,
  EXIT_PROXIMITY_RANGE,
  getTopPrompts,
  reconcileProximityPrompt,
  updateZoneParticles,
  type NpcProximityRuntime,
  type PromptData,
  type ZoneProximityRuntime,
} from '@/engine/interaction/interactiveTriggerProximity';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { resolveNpcBarkForRelation } from '@/shared/npcBark';
import { NPCProximityTriggers } from './interactiveTriggers/NpcProximityMarkers';
import { TriggerZoneComponent } from './interactiveTriggers/TriggerZoneComponent';

interface InteractiveTriggersProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

/** Trigger zones and "Press E" indicators with centralized prompt management */
export function InteractiveTriggers({
  livePlayerPositionRef,
  livePlayerRotationRef: _livePlayerRotationRef,
}: InteractiveTriggersProps) {
  const { sceneId, gameMode, showStoryOverlay, currentNodeId, diegeticNarrativeOpen } =
    useInteractionOverlay();
  const {
    playerFlags,
    playerKarma,
    playerSkills,
    collectedPoems,
    currentAct,
    timeOfDay: exitTimeOfDay,
  } = useSceneExitState();
  const activeTTLFlags = useGameStore((s) => s.activeTTLFlags);
  const timeOfDay = useTimeOfDay();
  const scheduleCtx = useScheduleContext();
  const zones = useMemo(
    () =>
      TRIGGER_ZONES.filter(
        (z) =>
          z.sceneId === sceneId &&
          isTriggerZoneAvailable(z, playerFlags, currentAct, activeTTLFlags),
      ),
    [sceneId, playerFlags, currentAct, activeTTLFlags],
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
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

  const isOverlayBlocking =
    gameMode !== 'exploration' ||
    diegeticNarrativeOpen ||
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId);

  const allowedIdsRef = useRef<Set<string>>(new Set());
  const promptsMapRef = useRef<Map<string, PromptData>>(new Map());
  const [interactTargetActive, setInteractTargetActive] = useState(false);
  const frameCountRef = useRef(0);
  const lastHintIdRef = useRef<string | null>(null);
  const proximityTempVecRef = useRef(new THREE.Vector3());
  const zoneRuntimeRef = useRef(new Map<string, ZoneProximityRuntime>());
  const npcRuntimeRef = useRef(new Map<string, NpcProximityRuntime>());
  /** Track NPCs that already barked on proximity this scene — one bark per NPC per scene entry. */
  const barkedNpcIdsRef = useRef(new Set<string>());

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
    resetEKeyConsumption();
    lastHintIdRef.current = null;
    barkedNpcIdsRef.current.clear();
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

    if (zone.linkedDialogueNodeId || zone.linkedNpcId) {
      const npcDef = zone.linkedNpcId
        ? findNpcById(zone.linkedNpcId)
        : findNpcByDialogueNodeId(zone.linkedDialogueNodeId!);
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

  useLayoutEffect(() => {
    isOverlayBlockingRef.current = isOverlayBlocking;
    sceneExitsRef.current = sceneExits;
    zonesRef.current = zones;
    sceneIdRef.current = sceneId;
    npcQueryTargetsRef.current = npcQueryTargets;
    overlappedExitIndicesRef.current = overlappedExitIndices;
    executeInteractionHitRef.current = executeInteractionHit;
  });

  useEKeyInteraction({
    livePlayerPositionRef,
    isOverlayBlockingRef,
    sceneExitsRef,
    zonesRef,
    sceneIdRef,
    npcQueryTargetsRef,
    executeInteractionHitRef,
  });

  const registerPrompt = useCallback((data: PromptData) => {
    promptsMapRef.current.set(data.id, data);
  }, []);

  const unregisterPrompt = useCallback((id: string) => {
    promptsMapRef.current.delete(id);
  }, []);

  useFrameTick('interaction', ({ delta }) => {
    if (isOverlayBlocking) {
      if (promptsMapRef.current.size > 0) {
        promptsMapRef.current.clear();
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

    const activeTTLFlags = useGameStore.getState().activeTTLFlags ?? {};
    const poemHighlight = resolvePoemExplorationHighlight(
      activeTTLFlags,
      playerFlags,
      { reducedMotion: isEffectiveReducedMotion() },
    );

    for (const zone of zonesRef.current) {
      const runtime = zoneRuntimeRef.current.get(zone.id);
      if (!runtime) continue;

      tempVec.set(zone.position[0], zone.position[1], zone.position[2]);
      const dist = playerPos.distanceTo(tempVec);
      const range = Math.max(zone.size[0], zone.size[2]) / 2 + 1.0;
      const isNear = dist < range;
      const isAllowed = allowedIdsRef.current.has(zone.id);
      const shouldShow = isNear && isAllowed;
      const poemApplies =
        poemHighlight.mode !== 'none' &&
        shouldHighlightZoneForPoemMode(zone, poemHighlight.mode);
      runtime.poemHighlightRef.current = poemApplies;
      runtime.poemHighlightColorRef.current = poemHighlight.color;
      runtime.poemStaticHighlightRef.current = poemApplies && !poemHighlight.pulse;
      runtime.zoneColorRef.current = poemApplies ? poemHighlight.color : '#88eeff';
      runtime.zoneGlowActiveRef.current = shouldShow || poemApplies;
      runtime.proximityRef.current = shouldShow
        ? Math.max(0.35, 1 - dist / (range + 1.2))
        : poemApplies
          ? 0.62
          : 0;

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

      if (shouldShow || (poemApplies && poemHighlight.pulse)) {
        runtime.pulsePhaseRef.current += delta * 3.6;
      }

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

    for (const npc of npcQueryTargetsRef.current) {
      const runtime = npcRuntimeRef.current.get(npc.npcId);
      if (!runtime) continue;

      tempVec.set(npc.position[0], npc.position[1], npc.position[2]);
      const dist = playerPos.distanceTo(tempVec);
      const isNear = dist < NPC_INTERACTION_RANGE;
      const promptId = `npc_${npc.npcId}`;
      const isAllowed = allowedIdsRef.current.has(promptId);
      const shouldShow = isNear && isAllowed;
      runtime.proximityRef.current = shouldShow ? Math.max(0.4, 1 - dist / (NPC_INTERACTION_RANGE + 0.5)) : 0;
      if (shouldShow) runtime.pulsePhaseRef.current += delta * 3.8;

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

      // ── Proximity bark: one bark per NPC on first approach per scene ──
      if (isNear && !barkedNpcIdsRef.current.has(npc.npcId)) {
        barkedNpcIdsRef.current.add(npc.npcId);
        const npcDef = findNpcById(npc.npcId);
        if (npcDef?.barkTexts) {
          const npcRelations = getGameSnapshot().npcRelations;
          const relation = npcRelations.find((r) => r.npcId === npc.npcId);
          const relationValue = relation?.value ?? 50;
          const barkText = resolveNpcBarkForRelation(npcDef.barkTexts, relationValue);
          if (barkText) {
            eventBus.emit('npc:no_dialogue', { npcId: npc.npcId, barkText });
          }
        }
      }
    }

    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return;

    const hasTarget = topHits.length > 0;
    setInteractTargetActive((prev) => (prev === hasTarget ? prev : hasTarget));
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

      <NPCProximityTriggers
        npcQueryTargets={npcQueryTargets}
        npcRuntimeRef={npcRuntimeRef}
        unregisterPrompt={unregisterPrompt}
      />

      {interactTargetActive && !isOverlayBlocking && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'fixed',
              inset: '0',
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 80px 15px rgba(0, 255, 238, 0.04)',
              zIndex: UI_LAYERS.WORLD_LABELS,
            }}
          />
        </Html>
      )}
    </group>
  );
}

export { WorldItem } from './WorldItem';
