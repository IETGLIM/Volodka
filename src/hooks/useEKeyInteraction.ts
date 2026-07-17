import { useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';
import { consumeEKey, isEKeyConsumed } from '@/engine/input/eKeyConsumption';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { forceResetAllInteractionState } from '@/engine/interaction/emergencyInteractionReset';
import { getGameStore } from '@/store/gameStore';
import {
  queryInteractionTargets,
  type ExitQueryTarget,
  type InteractionTargetHit,
  type NpcQueryTarget,
} from '@/engine/interaction/interactionTargetQuery';
import { isGameplayOverlayLocomotionLocked } from '@/engine/player/playerLocomotionGate';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import type { TriggerZone } from '@/data/triggerZones';
import type { SceneExit } from '@/shared/types/definitions/scene';
import {
  EXIT_PROXIMITY_RANGE,
  LMB_CLICK_DRAG_THRESHOLD_PX,
} from '@/engine/interaction/interactiveTriggerProximity';
import { isCanvasAreaTarget } from '@/engine/input/domUtils';

export interface UseEKeyInteractionOptions {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
  isOverlayBlockingRef: MutableRefObject<boolean>;
  sceneExitsRef: MutableRefObject<SceneExit[]>;
  zonesRef: MutableRefObject<TriggerZone[]>;
  sceneIdRef: MutableRefObject<string>;
  npcQueryTargetsRef: MutableRefObject<NpcQueryTarget[]>;
  executeInteractionHitRef: MutableRefObject<(hit: InteractionTargetHit) => boolean>;
}

export function useEKeyInteraction({
  livePlayerPositionRef,
  isOverlayBlockingRef,
  sceneExitsRef,
  zonesRef,
  sceneIdRef,
  npcQueryTargetsRef,
  executeInteractionHitRef,
}: UseEKeyInteractionOptions): { firePrimaryInteraction: () => boolean } {
  const firePrimaryInteraction = useCallback((): boolean => {
    if (isOverlayBlockingRef.current) return false;
    if (isGameplayOverlayLocomotionLocked()) return false;
    if (isInteractionLocked()) return false;
    if (isEKeyConsumed()) return false;

    // Hard gate: refuse interaction during any cutscene/cinematic.
    // isOverlayBlockingRef should already cover this, but the ref is synced
    // via useEffect which can lag by one frame — a fast E press or LMB click
    // during the intro wake-up cinematic could slip through and trigger a
    // scene transition or dialogue before the overlay gate propagates.
    try {
      if (getGameStore().activeCutsceneId) return false;
    } catch {
      /* store not ready — fall through */
    }

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

    consumeEKey(200);
    return true;
  }, [livePlayerPositionRef, isOverlayBlockingRef, sceneExitsRef, zonesRef, sceneIdRef, npcQueryTargetsRef, executeInteractionHitRef]);

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

  // ── Emergency escape hatch ──────────────────────────────────────
  // Pressing Escape while the interaction FSM is stuck (and no overlay
  // is handling the key) force-resets all interaction-related state.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Escape' || e.repeat) return;
      if (isOverlayBlockingRef.current) return;
      if (!isInteractionLocked()) return;

      try {
        if (getGameStore().mode !== 'exploration') return;
      } catch {
        /* store not ready */
        return;
      }

      forceResetAllInteractionState();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOverlayBlockingRef]);

  return { firePrimaryInteraction };
}
