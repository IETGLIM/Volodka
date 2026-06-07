
/* ─── Volodka RPG – Interaction System Bridge ───
 *
 *  Refactored for kinematicPosition RigidBody.
 *  Instead of rb.setLinvel(), we set external velocity via
 *  PlayerRigidBodyState, which PhysicsPlayer incorporates
 *  into the KinematicCharacterController displacement.
 *  This ensures collision resolution works even during
 *  approach/align phases — no wall clipping!
 */
import { useRef, useEffect } from 'react';
import { devWarn } from '@/shared/utils/devLog';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { InteractionState, DEFAULT_CUTSCENE_DURATION } from '@/engine/interaction/interactionMachine';
import { getNPCCutscene } from '@/data/npcCutscenes';
import { eventBus } from '@/engine/EventBus';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { setPlayerExternalVelocity, clearPlayerExternalVelocity } from '@/engine/PlayerRigidBodyState';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';

/* ─── Module-level interaction state (accessible outside R3F canvas) ─── */

let currentInteractionState: InteractionState = InteractionState.Idle;
let currentTargetNPCId: string | null = null;

/** Get current interaction state (can be called from any component) */
export function getInteractionState(): InteractionState {
  return currentInteractionState;
}

/** Get current target NPC ID (can be called from any component) */
export function getInteractionTargetNPCId(): string | null {
  return currentTargetNPCId;
}

/** Check if the interaction system currently locks player controls */
export function isInteractionLocked(): boolean {
  const s = currentInteractionState;
  return (
    s === InteractionState.Approach ||
    s === InteractionState.Cutscene ||
    s === InteractionState.Align ||
    s === InteractionState.Lock ||
    s === InteractionState.Dialogue
  );
}

/* ─── Interaction system constants ─── */
const APPROACH_ARRIVAL_DISTANCE = 1.5;
const ALIGN_DURATION = 0.5;
const LOCK_DURATION = 0.2;
const EXIT_DURATION = 0.3;
const APPROACH_SPEED = 2.5;
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
 * All state is stored in module-level variables so it's accessible from
 * components outside the R3F tree (like GameOrchestrator and NPCSystem).
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

  // ── Global interaction timer (for safety timeout) ──
  const globalTimerRef = useRef(0);

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
        stateRef.current = InteractionState.Idle;
        targetNPCIdRef.current = null;
        phaseTimerRef.current = 0;
        globalTimerRef.current = 0;
        currentInteractionState = InteractionState.Idle;
        currentTargetNPCId = null;
        clearPlayerExternalVelocity();
        eventBus.emit('interaction:state_change', {
          state: InteractionState.Idle,
          npcId: undefined,
        });
      }

      if (stateRef.current !== InteractionState.Idle) return;

      stateRef.current = InteractionState.Approach;
      targetNPCIdRef.current = npcId;
      phaseTimerRef.current = 0;
      globalTimerRef.current = 0; // Reset global safety timer

      // Update module-level state
      currentInteractionState = InteractionState.Approach;
      currentTargetNPCId = npcId;

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

      stateRef.current = InteractionState.Exit;
      phaseTimerRef.current = 0;
      globalTimerRef.current = 0;

      currentInteractionState = InteractionState.Exit;

      eventBus.emit('interaction:state_change', {
        state: InteractionState.Exit,
        npcId: targetNPCIdRef.current ?? undefined,
      });
    });

    return unsub;
  }, []);

  // ── Cancel on scene change ──
  useEffect(() => {
    const unsub = eventBus.on('scene:enter', () => {
      if (stateRef.current === InteractionState.Idle) return;

      // Reset NPC animation
      if (targetNPCIdRef.current) {
        eventBus.emit('npc:animation', {
          npcId: targetNPCIdRef.current,
          state: 'idle',
        });
      }

      const prevNpcId = targetNPCIdRef.current;
      stateRef.current = InteractionState.Idle;
      targetNPCIdRef.current = null;
      phaseTimerRef.current = 0;

      currentInteractionState = InteractionState.Idle;
      currentTargetNPCId = null;

      // Clear external velocity when cancelling
      clearPlayerExternalVelocity();

      eventBus.emit('interaction:state_change', {
        state: InteractionState.Idle,
        npcId: prevNpcId ?? undefined,
      });
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
      const currentMode = readGamePhase(useGameStore.getState());
      const showStoryOverlay = useGameStore.getState().showStoryOverlay;
      shouldCheckTimeout = currentMode === 'exploration' && !showStoryOverlay;
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
      stateRef.current = InteractionState.Idle;
      targetNPCIdRef.current = null;
      phaseTimerRef.current = 0;
      globalTimerRef.current = 0;
      currentInteractionState = InteractionState.Idle;
      currentTargetNPCId = null;

      clearPlayerExternalVelocity();

      eventBus.emit('interaction:state_change', {
        state: InteractionState.Idle,
        npcId: prevNpcId ?? undefined,
      });

      const storeState = useGameStore.getState();
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
          if (phaseTimerRef.current > 2.0) {
            const prevNpcId = targetNPCIdRef.current;
            stateRef.current = InteractionState.Idle;
            targetNPCIdRef.current = null;
            phaseTimerRef.current = 0;
            currentInteractionState = InteractionState.Idle;
            currentTargetNPCId = null;
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

        if (dist <= APPROACH_ARRIVAL_DISTANCE) {
          // Arrived → transition to Cutscene (cinematic camera intro)
          const npcRelations = useGameStore.getState().npcRelations;
          const relation = npcRelations.find((r) => r.npcId === targetNPCIdRef.current);
          const relationLevel = relation?.value ?? 50;
          const cutsceneDef = getNPCCutscene(targetNPCIdRef.current ?? '', relationLevel);
          cutsceneDurationRef.current = cutsceneDef.durationSeconds;

          // Calculate angles for later alignment
          const angleToNPC = Math.atan2(dx, dz);
          targetPlayerRotRef.current = angleToNPC;
          targetNPCRotRef.current = angleToNPC + Math.PI;

          // Stop approach movement
          clearPlayerExternalVelocity();

          stateRef.current = InteractionState.Cutscene;
          phaseTimerRef.current = 0;

          currentInteractionState = InteractionState.Cutscene;

          eventBus.emit('interaction:state_change', {
            state: InteractionState.Cutscene,
            npcId: targetNPCIdRef.current ?? undefined,
          });

          // Emit event for camera cutscene
          eventBus.emit('camera:npc_cutscene_start', {
            npcId: targetNPCIdRef.current ?? '',
            waypoints: cutsceneDef.waypoints,
          });

          // Also emit cutscene overlay for text display
          if (cutsceneDef.textOverlay) {
            eventBus.emit('cutscene:overlay', {
              text: cutsceneDef.textOverlay,
              subtitle: cutsceneDef.subtitle,
              accentColor: cutsceneDef.textAccentColor ?? '',
              durationMs: cutsceneDef.textDurationMs ?? 1500,
            });
          }
        } else {
          // Set external velocity for approach movement
          // PhysicsPlayer will feed this through KinematicCharacterController
          // for collision-safe approach — no wall clipping!
          const dirX = dx / dist;
          const dirZ = dz / dist;
          setPlayerExternalVelocity(dirX * APPROACH_SPEED, dirZ * APPROACH_SPEED);

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

        // Wait for cutscene duration
        if (phaseTimerRef.current >= cutsceneDurationRef.current) {
          stateRef.current = InteractionState.Align;
          phaseTimerRef.current = 0;

          currentInteractionState = InteractionState.Align;

          // End camera cutscene
          eventBus.emit('camera:npc_cutscene_end', { npcId: targetNPCIdRef.current ?? '' });

          eventBus.emit('interaction:state_change', {
            state: InteractionState.Align,
            npcId: targetNPCIdRef.current ?? undefined,
          });
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
          stateRef.current = InteractionState.Lock;
          phaseTimerRef.current = 0;

          currentInteractionState = InteractionState.Lock;

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
          stateRef.current = InteractionState.Dialogue;
          phaseTimerRef.current = 0;
          // BUG FIX: Reset global timer when entering Dialogue state.
          // Dialogues can last arbitrarily long, so we don't want the
          // timeout to fire right after the dialogue ends.
          globalTimerRef.current = 0;

          currentInteractionState = InteractionState.Dialogue;

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
        if (phaseTimerRef.current >= 0.3) {
          const currentMode = readGamePhase(useGameStore.getState());
          const showStoryOverlay = useGameStore.getState().showStoryOverlay;
          if (currentMode !== 'cutscene' && !showStoryOverlay) {
            stateRef.current = InteractionState.Exit;
            phaseTimerRef.current = 0;
            globalTimerRef.current = 0;
            currentInteractionState = InteractionState.Exit;
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

          stateRef.current = InteractionState.Idle;
          targetNPCIdRef.current = null;
          phaseTimerRef.current = 0;
          globalTimerRef.current = 0; // Reset global timer on clean exit

          currentInteractionState = InteractionState.Idle;
          currentTargetNPCId = null;

          eventBus.emit('interaction:state_change', {
            state: InteractionState.Idle,
            npcId: prevNpcId ?? undefined,
          });
        }
        break;
      }
    }
    } catch (err) {
      // Unexpected error during interaction update — reset to Idle.
      devWarn('[InteractionSystemBridge] Update failed, resetting to Idle:', err);
      const prevNpcId = targetNPCIdRef.current;
      stateRef.current = InteractionState.Idle;
      targetNPCIdRef.current = null;
      phaseTimerRef.current = 0;
      currentInteractionState = InteractionState.Idle;
      currentTargetNPCId = null;
      clearPlayerExternalVelocity();
      eventBus.emit('interaction:state_change', {
        state: InteractionState.Idle,
        npcId: prevNpcId ?? undefined,
      });
    }
  }, { priority: -1, label: 'InteractionSystemBridge' });

  return null; // No visual output
}

/** Lerp angle with wraparound */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}
