/* ─── Volodka RPG – Interaction System Bridge ───
 *
 *  Refactored for kinematicPosition RigidBody.
 *  Instead of rb.setLinvel(), we set external velocity via
 *  PlayerRigidBodyState, which PhysicsPlayer incorporates
 *  into the KinematicCharacterController displacement.
 *  This ensures collision resolution works even during
 *  approach/align phases — no wall clipping!
 */
/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { useRef, useEffect } from 'react';
import { devWarn } from '@/shared/utils/devLog';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { InteractionState, DEFAULT_CUTSCENE_DURATION } from '@/engine/interaction/interactionMachine';
import { resolveNpcInteractionSplash, deriveZoneRepeatSkipFlag } from '@/engine/interaction/resolveInteractionSplash';
import {
  emitInteractionSplashStart,
  emitInteractionSplashEnd,
  splashTimelineId,
} from '@/engine/interaction/playInteractionSplash';
import { stopCinematicTimeline } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { findTriggerZoneByNpcId } from '@/data/triggerZones';
import { getTriggerZones } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { setPlayerExternalVelocity, clearPlayerExternalVelocity } from '@/engine/PlayerRigidBodyState';
import { getGameSnapshot } from "@/engine/GameActionDispatcher";
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { preloadNpcModel } from '@/engine/scene/sceneGpuLifecycle';
import { getSceneConfig } from '@/config/scenes';
import {
  getInteractionState,
  getInteractionTargetNPCId,
  writeInteractionSession,
} from '@/engine/interaction/interactionSession';

export { getInteractionState, getInteractionTargetNPCId };

function publishInteraction(
  stateRef: React.MutableRefObject<InteractionState>,
  targetRef: React.MutableRefObject<string | null>,
  state: InteractionState,
  targetNpcId?: string | null,
): boolean {
  const nextTarget = targetNpcId !== undefined ? targetNpcId : targetRef.current;
  if (!writeInteractionSession(state, nextTarget)) {
    return false;
  }
  stateRef.current = state;
  if (targetNpcId !== undefined) {
    targetRef.current = targetNpcId;
  }
  return true;
}

/* ─── Interaction system constants ─── */
const APPROACH_ARRIVAL_DISTANCE = 1.5;
const APPROACH_NPC_MISSING_TIMEOUT = 2.0;
const ALIGN_DURATION = 0.5;
const LOCK_DURATION = 0.2;
const EXIT_DURATION = 0.3;
/** Peak approach speed — close to player walk speed (4.0) for a natural feel. */
const APPROACH_SPEED_MAX = 3.8;
/** Minimum speed near the NPC for smooth deceleration. */
const APPROACH_SPEED_MIN = 1.2;
/** Distance at which deceleration easing begins (world units from arrival point). */
const APPROACH_EASE_DISTANCE = 3.0;
/** If the NPC moves more than this far during approach, cancel — prevents infinite chasing. */
const APPROACH_MAX_DISTANCE = 8.0;
const ALIGN_LERP_SPEED = 8;

/** Global interaction timeout: force-reset to Idle after this many seconds
 *  to prevent the player from being permanently frozen if the interaction
 *  state machine gets stuck (e.g. NPC has no dialogue, race condition). */
const GLOBAL_INTERACTION_TIMEOUT = 5.0;

interface InteractionSystemBridgeProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

/**
 * Bridge component that runs the interaction state machine inside the R3F canvas.
 * Uses useFrame for the per-frame update loop.
 *
 * All state is published through interactionSession (single writer).
 *
 * Movement: Uses setPlayerExternalVelocity() instead of rb.setLinvel().
 * PhysicsPlayer reads this and feeds it through KinematicCharacterController
 * for proper collision resolution.
 */
export function InteractionSystemBridge({
  livePlayerPositionRef,
  livePlayerRotationRef,
}: InteractionSystemBridgeProps) {
  const stateRef = useRef<InteractionState>(InteractionState.Idle);
  const targetNPCIdRef = useRef<string | null>(null);
  const phaseTimerRef = useRef(0);
  const targetPlayerRotRef = useRef(0);
  const targetNPCRotRef = useRef(0);
  const cutsceneDurationRef = useRef(DEFAULT_CUTSCENE_DURATION);
  const activeNpcSplashRef = useRef<ReturnType<typeof resolveNpcInteractionSplash>>(null);
  const wasNarrativeInteractionRef = useRef(false);

  const emitExplorationResumeHint = (): void => {
    const sceneId = getGameSnapshot().exploration.currentSceneId;
    const sceneName = getSceneConfig(sceneId).name;
    eventBus.emit('ui:exploration_message', {
      text: `· ${sceneName} · свободное исследование`,
    });
  };

  const advanceFromSplashCutscene = (): void => {
    if (stateRef.current !== InteractionState.Cutscene) return;

    phaseTimerRef.current = 0;
    const splash = activeNpcSplashRef.current;
    if (splash) {
      emitInteractionSplashEnd(splash, {
        npcId: targetNPCIdRef.current ?? undefined,
      });
      activeNpcSplashRef.current = null;
    }

    publishInteraction(stateRef, targetNPCIdRef, InteractionState.Align);

    eventBus.emit('interaction:state_change', {
      state: InteractionState.Align,
      npcId: targetNPCIdRef.current ?? undefined,
    });
  };

  /**
   * Force-reset all interaction refs to Idle. Used by both scene:transition_start
   * and scene:enter to keep the component's stateRef in sync with the module-level
   * interactionSession (which resets on scene:transition_start).
   */
  const forceResetToIdle = (): void => {
    if (stateRef.current === InteractionState.Idle) return;

    if (stateRef.current === InteractionState.Cutscene) {
      const splash = activeNpcSplashRef.current;
      if (splash) {
        stopCinematicTimeline(splashTimelineId(splash));
        activeNpcSplashRef.current = null;
      }
    }

    // Reset NPC animation
    if (targetNPCIdRef.current) {
      eventBus.emit('npc:animation', {
        npcId: targetNPCIdRef.current,
        state: 'idle',
      });
    }

    const prevNpcId = targetNPCIdRef.current;
    phaseTimerRef.current = 0;
    globalTimerRef.current = 0;

    // Use force=true because the module-level session may already be Idle
    // (reset by scene:transition_start handler in interactionSession.ts).
    // Without force, Idle→Idle is valid, but Approach→Idle would fail if
    // the module-level session was already reset before this runs.
    writeInteractionSession(InteractionState.Idle, null, { force: true });
    stateRef.current = InteractionState.Idle;
    targetNPCIdRef.current = null;

    clearPlayerExternalVelocity();
    wasNarrativeInteractionRef.current = false;

    eventBus.emit('interaction:state_change', {
      state: InteractionState.Idle,
      npcId: prevNpcId ?? undefined,
    });
  };

  // ── Global interaction timer (for safety timeout) ──
  const globalTimerRef = useRef(0);

  useEffect(() => {
    const unsub = eventBus.on('interaction:state_change', ({ state }) => {
      if (
        state === InteractionState.Cutscene
        || state === InteractionState.Dialogue
        || state === InteractionState.Lock
        || state === InteractionState.Align
      ) {
        wasNarrativeInteractionRef.current = true;
      }
    });
    return unsub;
  }, []);

  // ── Listen for interaction:start event ──
  useEffect(() => {
    const unsub = eventBus.on('interaction:start', ({ npcId }) => {
      // Allow starting interaction from Idle OR Exit state.
      // Exit state occurs during the 0.3s transition back to Idle after
      // a previous interaction ended. If we reject interaction:start
      // during Exit, the player has to wait for Exit to complete before
      // they can interact again — this makes E feel "broken" because
      // rapid re-interaction doesn't work.
      if (stateRef.current === InteractionState.Exit) {
        // Force-complete the Exit phase immediately
        if (targetNPCIdRef.current) {
          eventBus.emit('npc:animation', {
            npcId: targetNPCIdRef.current,
            state: 'idle',
          });
        }
        phaseTimerRef.current = 0;
        globalTimerRef.current = 0;
        publishInteraction(stateRef, targetNPCIdRef, InteractionState.Idle, null);
        clearPlayerExternalVelocity();
        eventBus.emit('interaction:state_change', {
          state: InteractionState.Idle,
          npcId: undefined,
        });
      }

      if (stateRef.current !== InteractionState.Idle) return;

      preloadNpcModel(npcId);

      phaseTimerRef.current = 0;
      globalTimerRef.current = 0; // Reset global safety timer

      publishInteraction(stateRef, targetNPCIdRef, InteractionState.Approach, npcId);

      eventBus.emit('interaction:state_change', {
        state: InteractionState.Approach,
        npcId,
      });
    });

    return unsub;
  }, []);

  // ── Listen for interaction:end event ──
  // Handles ALL non-Idle states (not just Dialogue/Lock) to prevent the
  // interaction from getting stuck if a trigger zone or other system
  // changes the game mode while the NPC interaction is still in Approach/Align.
  useEffect(() => {
    const unsub = eventBus.on('interaction:end', () => {
      const s = stateRef.current;
      if (s === InteractionState.Idle || s === InteractionState.Exit) return;

      // Reset NPC animation if still targeting one
      if (targetNPCIdRef.current) {
        eventBus.emit('npc:animation', {
          npcId: targetNPCIdRef.current,
          state: 'idle',
        });
      }

      phaseTimerRef.current = 0;
      globalTimerRef.current = 0;

      publishInteraction(stateRef, targetNPCIdRef, InteractionState.Exit);

      eventBus.emit('interaction:state_change', {
        state: InteractionState.Exit,
        npcId: targetNPCIdRef.current ?? undefined,
      });
    });

    return unsub;
  }, []);

  // ── Advance NPC approach when splash timeline completes (before timer fallback) ──
  useEffect(() => {
    const unsub = eventBus.on('cinematic:timeline_complete', ({ timelineId }) => {
      if (!timelineId.startsWith('splash_')) return;
      const splash = activeNpcSplashRef.current;
      if (!splash || splashTimelineId(splash) !== timelineId) return;
      advanceFromSplashCutscene();
    });

    return unsub;
  }, []);

  // ── Cancel on scene transition start (syncs stateRef with module-level session) ──
  // The module-level interactionSession resets to Idle on scene:transition_start.
  // Without this handler, stateRef.current stays in the old state (e.g. Approach)
  // while the module-level session is Idle. This desync causes:
  //   1. publishInteraction to reject valid transitions (Idle → Cutscene not valid)
  //   2. Spurious interaction:state_change events emitted for rejected transitions
  //   3. Splash timeline leaks (started but never completed because stateRef != Cutscene)
  // By resetting here, stateRef stays in sync with the module-level session for the
  // entire transition window (scene:transition_start → scene:enter).
  useEffect(() => {
    const unsub = eventBus.on('scene:transition_start', () => {
      forceResetToIdle();
    });

    return unsub;
  }, []);

  // ── Cancel on scene enter (defensive — also catches transitions without transition_start) ──
  useEffect(() => {
    const unsub = eventBus.on('scene:enter', () => {
      forceResetToIdle();
    });

    return unsub;
  }, []);

  // ── Per-frame state machine update ──
  // Priority -1: runs BEFORE PhysicsPlayer's useFrame (default priority 0)
  // so that external velocity is set before PhysicsPlayer reads it.
  useFrameTick('interaction', ({ delta }) => {
    const dt = Math.min(delta, 0.05);

    if (stateRef.current === InteractionState.Idle) return;

    phaseTimerRef.current += dt;
    globalTimerRef.current += dt;

    // ── Global interaction timeout safety ──
    // Dialogue can last arbitrarily long for conversations, but we still
    // need a failsafe: if the dialogue system crashes/leaves without cleanup,
    // force-reset after 8s. In exploration mode without active story overlay,
    // the timeout is shorter (4s) since there shouldn't be any dialogue.
    let shouldCheckTimeout: boolean;
    let timeoutDuration: number;
    if (stateRef.current === InteractionState.Dialogue) {
      // Only timeout Dialogue in exploration mode without story overlay
      const snap = getGameSnapshot();
      // Use pre-computed mode from snapshot (already accounts for mainMenu/intro/combat/cutscene)
      const currentMode = snap.mode;
      const showStoryOverlay = snap.showStoryOverlay;
      shouldCheckTimeout = currentMode === 'exploration' && !showStoryOverlay && !snap.diegeticNarrative;
      timeoutDuration = 4.0;
    } else if (stateRef.current === InteractionState.Exit) {
      // Exit is a short cleanup phase (0.3s) — phaseTimer handles it; don't race globalTimer
      shouldCheckTimeout = false;
      timeoutDuration = GLOBAL_INTERACTION_TIMEOUT;
    } else {
      shouldCheckTimeout = true;
      timeoutDuration = GLOBAL_INTERACTION_TIMEOUT;
    }

    if (shouldCheckTimeout && globalTimerRef.current >= timeoutDuration) {
      devWarn(
        `[InteractionSystemBridge] Global timeout (${timeoutDuration}s) reached ` +
        `in state ${stateRef.current}. Force-resetting to Idle.`,
      );

      if (targetNPCIdRef.current) {
        eventBus.emit('npc:animation', {
          npcId: targetNPCIdRef.current,
          state: 'idle',
        });
      }

      const prevNpcId = targetNPCIdRef.current;
      phaseTimerRef.current = 0;
      globalTimerRef.current = 0;
      publishInteraction(stateRef, targetNPCIdRef, InteractionState.Idle, null);

      clearPlayerExternalVelocity();

      eventBus.emit('interaction:state_change', {
        state: InteractionState.Idle,
        npcId: prevNpcId ?? undefined,
      });

      const storeState = getGameSnapshot();
      if (storeState.showStoryOverlay) {
        closeNarrativeOverlay();
      }
      return;
    }

    // State machine uses livePlayerPositionRef + external velocity — no RigidBody calls here.
    try {
    const npcGroup = targetNPCIdRef.current
      ? getNPCGroup(targetNPCIdRef.current)
      : undefined;

    switch (stateRef.current) {
      /* ── Approach: auto-walk player toward NPC ── */
      case InteractionState.Approach: {
        // Safety: if NPC group doesn't exist after 2 seconds, cancel interaction
        if (!npcGroup) {
          if (phaseTimerRef.current > APPROACH_NPC_MISSING_TIMEOUT) {
            const prevNpcId = targetNPCIdRef.current;
            phaseTimerRef.current = 0;
            publishInteraction(stateRef, targetNPCIdRef, InteractionState.Idle, null);
            clearPlayerExternalVelocity();
            eventBus.emit('interaction:state_change', {
              state: InteractionState.Idle,
              npcId: prevNpcId ?? undefined,
            });
          } else {
            // NPC not yet loaded — stop movement, wait
            clearPlayerExternalVelocity();
          }
          break;
        }

        const playerPos = livePlayerPositionRef.current;
        const npcPos = npcGroup.position;
        const dx = npcPos.x - playerPos.x;
        const dz = npcPos.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > APPROACH_MAX_DISTANCE) {
          const prevNpcId = targetNPCIdRef.current;
          eventBus.emit('npc:no_dialogue', { npcId: prevNpcId ?? '', barkText: 'Подожди...' });
          phaseTimerRef.current = 0;
          globalTimerRef.current = 0;
          publishInteraction(stateRef, targetNPCIdRef, InteractionState.Idle, null);
          clearPlayerExternalVelocity();
          eventBus.emit('interaction:state_change', {
            state: InteractionState.Idle,
            npcId: prevNpcId ?? undefined,
          });
          break;
        }

        if (dist <= APPROACH_ARRIVAL_DISTANCE) {
          const npcId = targetNPCIdRef.current ?? '';
          const store = getGameSnapshot();
          const sceneId = store.exploration.currentSceneId;
          const npcZone = findTriggerZoneByNpcId(getTriggerZones(), npcId, sceneId);
          const metFlag = npcZone ? deriveZoneRepeatSkipFlag(npcZone) : undefined;

          const splash = resolveNpcInteractionSplash(npcId, {
            flags: store.playerState.flags,
          }, { metFlag });

          // Calculate angles for later alignment
          const angleToNPC = Math.atan2(dx, dz);
          targetPlayerRotRef.current = angleToNPC;
          targetNPCRotRef.current = angleToNPC + Math.PI;

          // Stop approach movement
          clearPlayerExternalVelocity();

          phaseTimerRef.current = 0;
          activeNpcSplashRef.current = splash;

          if (splash) {
            cutsceneDurationRef.current = splash.durationMs / 1000;
            publishInteraction(stateRef, targetNPCIdRef, InteractionState.Cutscene);

            eventBus.emit('interaction:state_change', {
              state: InteractionState.Cutscene,
              npcId,
            });

            emitInteractionSplashStart(splash, { anchorIsNpc: true, npcId });
          } else {
            cutsceneDurationRef.current = 0;
            activeNpcSplashRef.current = null;
            publishInteraction(stateRef, targetNPCIdRef, InteractionState.Align);

            eventBus.emit('interaction:state_change', {
              state: InteractionState.Align,
              npcId,
            });
          }
        } else {
          // Adaptive approach speed: decelerate smoothly near the NPC
          // using an ease-out curve so the arrival feels natural.
          const distFromArrival = Math.max(0, dist - APPROACH_ARRIVAL_DISTANCE);
          const easeT = Math.min(distFromArrival / APPROACH_EASE_DISTANCE, 1);
          // Smoothstep ease-out for natural deceleration
          const smoothT = easeT * easeT * (3 - 2 * easeT);
          const speed = APPROACH_SPEED_MIN + (APPROACH_SPEED_MAX - APPROACH_SPEED_MIN) * smoothT;

          const dirX = dx / dist;
          const dirZ = dz / dist;
          setPlayerExternalVelocity(dirX * speed, dirZ * speed);

          livePlayerRotationRef.current = Math.atan2(dirX, dirZ);

          if (targetNPCIdRef.current) {
            eventBus.emit('npc:animation', {
              npcId: targetNPCIdRef.current,
              state: 'idle',
            });
          }
        }
        break;
      }

      /* ── Cutscene: cinematic camera animation before dialogue ── */
      case InteractionState.Cutscene: {
        // Stop movement during cutscene
        clearPlayerExternalVelocity();

        // Timer fallback if timeline_complete was missed
        if (phaseTimerRef.current >= cutsceneDurationRef.current) {
          advanceFromSplashCutscene();
        }
        break;
      }

      /* ── Align: smoothly rotate player and NPC ── */
      case InteractionState.Align: {
        livePlayerRotationRef.current = lerpAngle(
          livePlayerRotationRef.current,
          targetPlayerRotRef.current,
          ALIGN_LERP_SPEED * dt,
        );

        if (npcGroup) {
          npcGroup.rotation.y = lerpAngle(
            npcGroup.rotation.y,
            targetNPCRotRef.current,
            ALIGN_LERP_SPEED * dt,
          );
        }

        // No movement during alignment
        clearPlayerExternalVelocity();

        if (phaseTimerRef.current >= ALIGN_DURATION) {
          phaseTimerRef.current = 0;
          publishInteraction(stateRef, targetNPCIdRef, InteractionState.Lock);

          eventBus.emit('interaction:state_change', {
            state: InteractionState.Lock,
            npcId: targetNPCIdRef.current ?? undefined,
          });
        }
        break;
      }

      /* ── Lock: disable controls, prepare for dialogue ── */
      case InteractionState.Lock: {
        clearPlayerExternalVelocity();

        if (phaseTimerRef.current >= LOCK_DURATION) {
          phaseTimerRef.current = 0;
          // BUG FIX: Reset global timer when entering Dialogue state.
          // Dialogues can last arbitrarily long, so we don't want the
          // timeout to fire right after the dialogue ends.
          globalTimerRef.current = 0;

          publishInteraction(stateRef, targetNPCIdRef, InteractionState.Dialogue);

          eventBus.emit('interaction:state_change', {
            state: InteractionState.Dialogue,
            npcId: targetNPCIdRef.current ?? undefined,
          });

          // Trigger the actual dialogue for this NPC
          eventBus.emit('npc:interact_staged', {
            npcId: targetNPCIdRef.current ?? '',
          });
        }
        break;
      }

      /* ── Dialogue: conversation is active ── */
      case InteractionState.Dialogue: {
        // No movement during dialogue
        clearPlayerExternalVelocity();

        // Safety: if we're in Dialogue state but the narrative overlay
        // is NOT showing (dialogue closed without emitting interaction:end),
        // force the interaction to end.
        // Grace is long enough for async dialogue pack load (ensureDialogueNode)
        // after npc:interact_staged — 300ms was exiting before the overlay opened.
        if (phaseTimerRef.current >= 2.5) {
          const snap2 = getGameSnapshot();
          // Use pre-computed mode from snapshot (already accounts for mainMenu/intro/combat/cutscene)
          const currentMode = snap2.mode;
          const showStoryOverlay = snap2.showStoryOverlay;
          if (currentMode !== 'cutscene' && !showStoryOverlay && !snap2.diegeticNarrative) {
            phaseTimerRef.current = 0;
            globalTimerRef.current = 0;
            publishInteraction(stateRef, targetNPCIdRef, InteractionState.Exit);
            eventBus.emit('interaction:state_change', {
              state: InteractionState.Exit,
              npcId: targetNPCIdRef.current ?? undefined,
            });
          }
        }
        break;
      }

      /* ── Exit: re-enable controls, return to Idle ── */
      case InteractionState.Exit: {
        clearPlayerExternalVelocity();

        if (phaseTimerRef.current >= EXIT_DURATION) {
          const prevNpcId = targetNPCIdRef.current;

          if (prevNpcId) {
            eventBus.emit('npc:animation', {
              npcId: prevNpcId,
              state: 'idle',
            });
          }

          phaseTimerRef.current = 0;
          globalTimerRef.current = 0; // Reset global timer on clean exit
          publishInteraction(stateRef, targetNPCIdRef, InteractionState.Idle, null);

          eventBus.emit('interaction:state_change', {
            state: InteractionState.Idle,
            npcId: prevNpcId ?? undefined,
          });

          if (wasNarrativeInteractionRef.current) {
            wasNarrativeInteractionRef.current = false;
            emitExplorationResumeHint();
          }
        }
        break;
      }
    }
    } catch (err) {
      // Unexpected error during interaction update — reset to Idle.
      devWarn('[InteractionSystemBridge] Update failed, resetting to Idle:', err);
      const prevNpcId = targetNPCIdRef.current;
      phaseTimerRef.current = 0;
      publishInteraction(stateRef, targetNPCIdRef, InteractionState.Idle, null);
      clearPlayerExternalVelocity();
      eventBus.emit('interaction:state_change', {
        state: InteractionState.Idle,
        npcId: prevNpcId ?? undefined,
      });
    }
  }, { priority: -1, label: 'InteractionSystemBridge', phase: 'pre_physics' });

  return null; // No visual output
}

/** Lerp angle with wraparound */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}