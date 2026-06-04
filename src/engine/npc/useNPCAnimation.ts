
/* ─── Volodka RPG – NPC Animation State Hook ─── */

import { useRef, useEffect, useCallback } from 'react';
import { useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

/* ─── Animation name variants for each NPC animation state ─── */
const ANIM_MAP: Record<NPCAnimationState, string[]> = {
  idle: [
    'idle', 'Idle', 'IDLE', '0', 'animation_0',
    'Armature|idle', 'Cesium_Man_idles', 'idle_01',
  ],
  talk: [
    'talk', 'Talk', 'TALK', 'talking', 'Talking',
    'Armature|talk', 'Cesium_Man_talk', 'talk_01',
  ],
  listen: [
    'listen', 'Listen', 'idle', 'Idle', 'IDLE',
    'Armature|listen', 'Cesium_Man_idles', 'listen_01',
  ],
  gesture: [
    'gesture', 'Gesture', 'wave', 'Wave',
    'Armature|gesture', 'Cesium_Man_gesture', 'gesture_01',
  ],
};

/**
 * Hook that manages NPC animation state with crossfade.
 *
 * Listens to `npc:animation` events and smoothly transitions
 * between animation states.
 *
 * @param npcId - The NPC's unique identifier
 * @param actions - Animation actions from useAnimations
 * @param defaultIdleName - Optional idle animation name from NPC definition
 */
export function useNPCAnimation(
  npcId: string,
  actions: Record<string, THREE.AnimationAction> | null | undefined,
  defaultIdleName?: string,
) {
  const currentAnimRef = useRef<NPCAnimationState>('idle');
  const crossfadeDuration = 0.3;

  /** Find the best matching animation action for a given state */
  const findAction = useCallback(
    (state: NPCAnimationState): THREE.AnimationAction | null => {
      if (!actions) return null;

      // Try state-specific names first
      const candidates = ANIM_MAP[state] ?? [state];
      for (const name of candidates) {
        if (actions[name]) return actions[name];
      }

      // Fallback: for non-idle states, fall back to idle
      if (state !== 'idle') {
        const idleCandidates = ANIM_MAP.idle;
        if (defaultIdleName && actions[defaultIdleName]) {
          return actions[defaultIdleName];
        }
        for (const name of idleCandidates) {
          if (actions[name]) return actions[name];
        }
      }

      // Last resort: first available animation
      const firstKey = Object.keys(actions)[0];
      return firstKey ? actions[firstKey] ?? null : null;
    },
    [actions, defaultIdleName],
  );

  /** Crossfade to a new animation state */
  const crossfadeTo = useCallback(
    (newState: NPCAnimationState) => {
      if (newState === currentAnimRef.current) return;
      if (!actions) return;

      currentAnimRef.current = newState;

      const targetAction = findAction(newState);
      if (!targetAction) return;

      // Fade out all current actions, fade in target
      for (const action of Object.values(actions)) {
        if (action === targetAction) {
          action?.reset().fadeIn(crossfadeDuration).play();
        } else {
          action?.fadeOut(crossfadeDuration);
        }
      }
    },
    [actions, findAction],
  );

  // ── Listen for npc:animation events ──
  useEffect(() => {
    const unsub = eventBus.on('npc:animation', ({ npcId: targetNpcId, state }) => {
      if (targetNpcId !== npcId) return;
      crossfadeTo(state);
    });

    return unsub;
  }, [npcId, crossfadeTo]);

  // Play idle on mount
  useEffect(() => {
    crossfadeTo('idle');
  }, [crossfadeTo]);

  return {
    currentAnim: currentAnimRef,
    crossfadeTo,
  };
}
