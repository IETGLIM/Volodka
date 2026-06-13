
/* ─── Volodka RPG – Interactive triggers with god-ray highlight, particle burst, pulse tooltip,
     NPC staged interaction routing, and centralized prompt stacking ─── */

import { useRef, useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useCurrentSceneId, useInteractionOverlay, useTimeOfDay, useSceneExitState, useScheduleContext } from '@/store/selectors';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';
import { TRIGGER_ZONES, type TriggerZone, INTERACTION_LABELS } from '@/data/triggerZones';
import { findNpcById, findNpcByDialogueNodeId } from '@/data/allNpcDefinitions';
import type { NPCDefinition } from '@/shared/types/game';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
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

/** Maximum number of sparkle particles per trigger zone (InstancedMesh pool size) */
const MAX_PARTICLES = 8;

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
  const { playerFlags, playerKarma } = useSceneExitState();
  const timeOfDay = useTimeOfDay();
  const scheduleCtx = useScheduleContext();
  const zones = TRIGGER_ZONES.filter((z) => z.sceneId === sceneId);

  const sceneExits = useMemo(
    () => getSceneExits(sceneId, playerFlags, playerKarma),
    [sceneId, playerFlags, playerKarma],
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

  // Compute allowed IDs and reconcile visible prompts every few frames
  useFrameTick('interaction', () => {
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
      return;
    }

    const playerPos = livePlayerPositionRef.current;
    const playerYaw = sharedCameraYawRef.current;

    if (isInteractionLocked()) {
      allowedIdsRef.current = new Set();
      if (promptsMapRef.current.size > 0) {
        promptsMapRef.current.clear();
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
        eventBus.emit('interaction:hint', {
          label: primaryHit.label,
          key: 'E',
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

  // Callbacks for children to register/unregister their prompt data
  const registerPrompt = useCallback((data: PromptData) => {
    promptsMapRef.current.set(data.id, data);
  }, []);

  const unregisterPrompt = useCallback((id: string) => {
    promptsMapRef.current.delete(id);
  }, []);

  return (
    <group key={`triggers:${sceneId}`}>
      {zones.map((zone) => (
        <TriggerZoneComponent
          key={zone.id}
          zone={zone}
          livePlayerPositionRef={livePlayerPositionRef}
          allowedIdsRef={allowedIdsRef}
          registerPrompt={registerPrompt}
          unregisterPrompt={unregisterPrompt}
        />
      ))}

      {/* NPC proximity triggers — separate from static trigger zones */}
      <NPCProximityTriggers
        livePlayerPositionRef={livePlayerPositionRef}
        allowedIdsRef={allowedIdsRef}
        registerPrompt={registerPrompt}
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
 * NPC proximity triggers that show [E] tooltip near NPCs
 * and start the staged interaction flow instead of instant dialogue.
 * Only shows NPCs that are in the current scene per the schedule engine.
 */
function NPCProximityTriggers({
  livePlayerPositionRef,
  allowedIdsRef,
  registerPrompt,
  unregisterPrompt,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  allowedIdsRef: React.MutableRefObject<Set<string>>;
  registerPrompt: (data: PromptData) => void;
  unregisterPrompt: (id: string) => void;
}) {
  // Get NPCs in current scene using schedule engine
  const sceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const scheduleCtx = useScheduleContext();
  const npcsInScene = useMemo(() => {
    const npcIds = getNPCsForScene(sceneId, timeOfDay, scheduleCtx);
    return npcIds
      .map((id) => {
        const def = findNpcById(id);
        if (!def) return null;
        const entry = getCurrentScheduleEntry(id, timeOfDay, scheduleCtx);
        return {
          definition: def,
          position: entry?.position ?? def.defaultPosition,
        };
      })
      .filter(Boolean) as Array<{
        definition: NPCDefinition;
        position: [number, number, number];
      }>;
  }, [sceneId, timeOfDay, scheduleCtx]);

  return (
    <group>
      {npcsInScene.map(({ definition, position }) => (
        <NPCProximityTrigger
          key={definition.id}
          npcId={definition.id}
          npcName={definition.name}
          position={position}
          dialogueNodeId={definition.dialogueNodeId}
          livePlayerPositionRef={livePlayerPositionRef}
          allowedIdsRef={allowedIdsRef}
          registerPrompt={registerPrompt}
          unregisterPrompt={unregisterPrompt}
        />
      ))}
    </group>
  );
}

/** Proximity trigger for a single NPC */
function NPCProximityTrigger({
  npcId,
  npcName,
  position,
  dialogueNodeId,
  livePlayerPositionRef,
  allowedIdsRef,
  registerPrompt,
  unregisterPrompt,
}: {
  npcId: string;
  npcName: string;
  position: [number, number, number];
  dialogueNodeId?: string;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  allowedIdsRef: React.MutableRefObject<Set<string>>;
  registerPrompt: (data: PromptData) => void;
  unregisterPrompt: (id: string) => void;
}) {
  const promptId = `npc_${npcId}`;
  const [showIndicator, setShowIndicator] = useState(false);
  const showIndicatorRef = useRef(false);
  const lastPromptDistanceRef = useRef<number | null>(null);
  const proximityRef = useRef(0);
  const pulsePhaseRef = useRef(0);

  // Pre-allocated temp Vector3 — avoids per-frame allocation (P0-2.2)
  const tempVecRef = useRef(new THREE.Vector3());

  useFrameTick('interaction', ({ delta }) => {
    const playerPos = livePlayerPositionRef.current;
    tempVecRef.current.set(...position);
    const dist = playerPos.distanceTo(tempVecRef.current);

    const isNear = dist < 3.0 && !isInteractionLocked();
    const isAllowed = allowedIdsRef.current.has(promptId);
    const shouldShow = isNear && isAllowed;
    proximityRef.current = shouldShow ? Math.max(0.4, 1 - dist / 3.5) : 0;
    if (shouldShow) pulsePhaseRef.current += delta * 3.2;

    const distanceChangedSignificantly =
      lastPromptDistanceRef.current === null ||
      Math.abs(dist - lastPromptDistanceRef.current) > 0.2;

    if (shouldShow !== showIndicatorRef.current) {
      showIndicatorRef.current = shouldShow;
      setShowIndicator(shouldShow);

      if (isNear) {
        registerPrompt({
          id: promptId,
          label: `Поговорить с ${npcName}`,
          distance: dist,
          type: 'npc' as const,
        });
        lastPromptDistanceRef.current = dist;
      } else {
        unregisterPrompt(promptId);
        lastPromptDistanceRef.current = null;
      }
    } else if (shouldShow && distanceChangedSignificantly) {
      registerPrompt({
        id: promptId,
        label: `Поговорить с ${npcName}`,
        distance: dist,
        type: 'npc' as const,
      });
      lastPromptDistanceRef.current = dist;
    }

  });

  // E-key routing is centralized in InteractiveTriggers (capture-phase listener).

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterPrompt(promptId);
    };
  }, [promptId, unregisterPrompt]);

  // Subtle proximity light when in range
  return (
    <group position={position}>
      <ProximityGodRay
        active={showIndicator}
        color="#ffb828"
        beamHeight={2.6}
        baseY={0.2}
        proximityRef={proximityRef}
        pulsePhaseRef={pulsePhaseRef}
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

// Pre-computed identity matrix for InstancedMesh reset
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

/** Single trigger zone with proximity detection and E-key interaction */
function TriggerZoneComponent({
  zone,
  livePlayerPositionRef,
  allowedIdsRef,
  registerPrompt,
  unregisterPrompt,
}: {
  zone: TriggerZone;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  allowedIdsRef: React.MutableRefObject<Set<string>>;
  registerPrompt: (data: PromptData) => void;
  unregisterPrompt: (id: string) => void;
}) {
  const showIndicatorRef = useRef(false);
  const lastPromptDistanceRef = useRef<number | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const triggeredRef = useRef(false);
  const triggerCooldown = useRef(0);

  // Particle burst state — stored in ref, not useState, to avoid per-frame re-renders (P0-2.3)
  const particlesRef = useRef<ParticleData[]>([]);

  // Pulse + proximity — updated imperatively, read by ProximityGodRay
  const pulsePhaseRef = useRef(0);
  const proximityRef = useRef(0);

  // Brief flash on E press
  const outlineFlashRef = useRef(false);
  const outlineFlashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pre-allocated temp Vector3 — avoids per-frame allocation (P0-2.2)
  const tempVecRef = useRef(new THREE.Vector3());

  // InstancedMesh refs for particles — one draw call for all 8 particles (P0-2.3)
  const particleInstanceRef = useRef<THREE.InstancedMesh>(null);
  const particleGeo = useMemo(() => new THREE.SphereGeometry(0.06, 4, 4), []);
  const particleMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#44ffff',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }), []);

  // Dispose particle geometry/material on unmount; hide stray instances
  useEffect(() => {
    const geo = particleGeo;
    const mat = particleMat;
    const mesh = particleInstanceRef;
    return () => {
      particlesRef.current = [];
      if (mesh.current) {
        for (let i = 0; i < MAX_PARTICLES; i++) {
          tempMatrix.makeScale(0, 0, 0);
          mesh.current!.setMatrixAt(i, tempMatrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
      }
      geo.dispose();
      mat.dispose();
    };
  }, [particleGeo, particleMat]);

  useFrameTick('interaction', ({ delta }) => {
    const playerPos = livePlayerPositionRef.current;
    tempVecRef.current.set(...zone.position);
    const dist = playerPos.distanceTo(tempVecRef.current);

    // Show "Press E" if player is within trigger range
    const range = Math.max(zone.size[0], zone.size[2]) / 2 + 1.0;
    const isNear = dist < range && !isInteractionLocked();
    const isAllowed = allowedIdsRef.current.has(zone.id);
    const shouldShow = isNear && isAllowed;
    proximityRef.current = shouldShow ? Math.max(0.35, 1 - dist / (range + 1.2)) : 0;

    const distanceChangedSignificantly =
      lastPromptDistanceRef.current === null ||
      Math.abs(dist - lastPromptDistanceRef.current) > 0.2;

    // Only update React state when value actually changes
    if (shouldShow !== showIndicatorRef.current) {
      showIndicatorRef.current = shouldShow;
      setShowIndicator(shouldShow);

      if (isNear) {
        registerPrompt({
          id: zone.id,
          label: zone.interactionLabel ?? INTERACTION_LABELS[zone.interactionType ?? 'default'],
          distance: dist,
          type: 'zone',
        });
        lastPromptDistanceRef.current = dist;
      } else {
        unregisterPrompt(zone.id);
        lastPromptDistanceRef.current = null;
      }
    } else if (shouldShow && distanceChangedSignificantly) {
      registerPrompt({
        id: zone.id,
        label: zone.interactionLabel ?? INTERACTION_LABELS[zone.interactionType ?? 'default'],
        distance: dist,
        type: 'zone',
      });
      lastPromptDistanceRef.current = dist;
    }

    // Cooldown timer while near interactables
    if (shouldShow) {
      pulsePhaseRef.current += delta * 3;
    }

    // Cooldown
    triggerCooldown.current = Math.max(0, triggerCooldown.current - delta);

    // Auto-trigger toast on proximity
    if (isNear && !triggeredRef.current && triggerCooldown.current <= 0) {
      triggeredRef.current = true;
      triggerCooldown.current = 10;
      if (zone.enterToast) {
        eventBus.emit('ui:exploration_message', { text: zone.enterToast });
      }
      // Auto-trigger effects for combat zones
      if (zone.autoTrigger && zone.effects && zone.effects.length > 0) {
        eventBus.emit('trigger:auto_execute', { triggerZoneId: zone.id });
      }
    }

    if (dist > range + 0.5) {
      triggeredRef.current = false;
    }

    // Update particles imperatively via InstancedMesh (P0-2.3)
    const particles = particlesRef.current;
    if (particles.length > 0) {
      let writeIdx = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += delta;
        if (p.life > 0.8) continue; // particle expired — skip

        p.position[0] += p.velocity[0] * delta;
        p.position[1] += p.velocity[1] * delta;
        p.position[2] += p.velocity[2] * delta;
        p.velocity[0] *= 0.95;
        p.velocity[1] = p.velocity[1] * 0.95 - delta * 2;
        p.velocity[2] *= 0.95;

        const opacity = Math.max(0, 1 - p.life / 0.8);
        const scale = 0.06 * opacity;

        // Update instance matrix — position + scale
        tempMatrix.makeScale(scale, scale, scale);
        tempMatrix.setPosition(p.position[0], p.position[1], p.position[2]);
        if (particleInstanceRef.current) {
          particleInstanceRef.current.setMatrixAt(writeIdx, tempMatrix);
        }

        // Update instance color with opacity baked into brightness
        tempColor.setRGB(0.27 * opacity, 1.0 * opacity, 1.0 * opacity);
        if (particleInstanceRef.current) {
          particleInstanceRef.current.setColorAt(writeIdx, tempColor);
        }

        // Compact: move surviving particle forward
        if (writeIdx !== i) {
          particles[writeIdx] = p;
        }
        writeIdx++;
      }
      // Trim dead particles
      particles.length = writeIdx;

      if (particleInstanceRef.current) {
        // Hide unused instances by setting scale to 0
        for (let i = writeIdx; i < MAX_PARTICLES; i++) {
          tempMatrix.makeScale(0, 0, 0);
          particleInstanceRef.current.setMatrixAt(i, tempMatrix);
        }
        particleInstanceRef.current.instanceMatrix.needsUpdate = true;
        if (particleInstanceRef.current.instanceColor) {
          particleInstanceRef.current.instanceColor.needsUpdate = true;
        }
      }
    }
  });

  // Spawn particle burst — writes to ref, no setState (P0-2.3)
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
    const current = particlesRef.current;
    particlesRef.current = [...current, ...newParticles].slice(-MAX_PARTICLES);

    // Initialize InstancedMesh with zero-scale for all instances
    if (particleInstanceRef.current) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        tempMatrix.makeScale(0, 0, 0);
        particleInstanceRef.current.setMatrixAt(i, tempMatrix);
      }
      particleInstanceRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [zone.size]);

  // Visual feedback when the centralized router fires this zone.
  useEffect(() => {
    const onObjectInteract = (payload: { triggerZoneId?: string }) => {
      if (payload.triggerZoneId !== zone.id) return;
      spawnParticles();
      outlineFlashRef.current = true;
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
      outlineFlashTimer.current = setTimeout(() => {
        outlineFlashRef.current = false;
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
  }, [zone.id, spawnParticles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterPrompt(zone.id);
    };
  }, [zone.id, unregisterPrompt]);

  return (
    <group position={zone.position}>
      <ProximityGodRay
        active={showIndicator}
        color="#88eeff"
        beamHeight={Math.max(zone.size[1] + 1.6, 2.2)}
        baseY={Math.max(zone.size[1] * 0.2, 0.35)}
        proximityRef={proximityRef}
        flashRef={outlineFlashRef}
        pulsePhaseRef={pulsePhaseRef}
      />

      {/* Sparkle particles — single InstancedMesh instead of 8 separate meshes (P0-2.3) */}
      <instancedMesh
        ref={particleInstanceRef}
        args={[particleGeo, particleMat, MAX_PARTICLES]}
        frustumCulled={false}
      />
    </group>
  );
}

export { WorldItem } from './WorldItem';
