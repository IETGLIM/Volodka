/* ─── Volodka RPG – NPC idle/walk weight blend (mirrors hero locomotion tree) ─── */

import { useLayoutEffect, useRef } from 'react';
import { LoopRepeat } from 'three';
import type * as THREE_NS from 'three';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import {
  resolveNpcClipAction,
  type NpcAnimationClipOverrides,
} from '@/engine/npc/npcClipResolution';

const BLEND_ACCEL = 5.2;
const BLEND_DECEL = 2.8;
const WEIGHT_EPSILON = 0.001;

/** Measured natural ground speed of the Quaternius Walk clip (0.88 m per 1.333 s cycle → 0.66 m/s at 1×). */
const QUATERNIUS_WALK_NATURAL_MPS = 0.66;
/** Gait-matched playback for patrolling NPCs: DEFAULT_WALK_SPEED (npcPatrol.ts) ÷ natural clip speed.
 *  Without this the patrol walk clip slid ~1.8× across the ground. */
const NPC_WALK_CLIP_TIME_SCALE = 1.2 / QUATERNIUS_WALK_NATURAL_MPS;

/**
 * Stable key for clip overrides — the merged overrides object identity may
 * change every render while its CONTENT stays the same, so the bind effect
 * must key on content, not identity (v4.33.0: stale sleep/sit poses fix).
 */
function serializeOverridesKey(overrides?: NpcAnimationClipOverrides): string {
  if (!overrides) return '';
  return Object.keys(overrides)
    .sort()
    .map((k) => `${k}=${overrides[k as keyof NpcAnimationClipOverrides] ?? ''}`)
    .join(',');
}

/**
 * Re-arm an action that an external stop left deactivated. Playing NPCs
 * whose idle/walk actions stopped but were never restarted froze mid-pose
 * (statues / ground sliding) — the tick below only sets weights, it cannot
 * reactivate a stopped action.
 */
function rearmStoppedAction(action: THREE_NS.AnimationAction | null, weight: number): void {
  if (!action || action.isRunning()) return;
  action.setLoop(LoopRepeat, Infinity);
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
  action.play();
}

/** States driven by simultaneous idle/walk weights instead of crossfade. */
const LOCOMOTION_STATES: ReadonlySet<NPCAnimationState> = new Set(['idle', 'walk', 'listen']);

function isLocomotionState(state: NPCAnimationState): boolean {
  return LOCOMOTION_STATES.has(state);
}

function targetWalkWeight(state: NPCAnimationState): number {
  return state === 'walk' ? 1 : 0;
}

function expBlend(current: number, target: number, speed: number, delta: number): number {
  const t = 1 - Math.exp(-speed * delta);
  return current + (target - current) * t;
}

export interface UseNpcLocomotionBlendOptions {
  npcId: string;
  actions: Record<string, THREE_NS.AnimationAction> | null | undefined;
  animState: NPCAnimationState;
  clipOverrides?: NpcAnimationClipOverrides;
  crossfadeTo: (state: NPCAnimationState) => void;
  enabled?: boolean;
}

/**
 * Weight-based idle↔walk blending for skinned NPC GLBs and composer rigs.
 * Non-locomotion states (talk, sit, …) still use crossfade from `useNPCAnimation`.
 */
export function useNpcLocomotionBlend({
  npcId,
  actions,
  animState,
  clipOverrides,
  crossfadeTo,
  enabled = true,
}: UseNpcLocomotionBlendOptions): void {
  const idleActionRef = useRef<THREE_NS.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE_NS.AnimationAction | null>(null);
  const currentIdleWeightRef = useRef(1);
  const currentWalkWeightRef = useRef(0);
  const locomotionActiveRef = useRef(false);
  const boundKeyRef = useRef<string | null>(null);
  const animStateRef = useRef(animState);
  animStateRef.current = animState;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const clipOverridesRef = useRef(clipOverrides);
  clipOverridesRef.current = clipOverrides;

  // Content-keyed overrides signature: re-binds when sleep/sit/idle-variant
  // overrides actually change (fixes NPCs that kept standing instead of
  // adopting their schedule pose), without re-binding on identity churn.
  const overridesKey = serializeOverridesKey(clipOverrides);

  useLayoutEffect(() => {
    const currentActions = actionsRef.current;
    if (!currentActions) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      boundKeyRef.current = null;
      locomotionActiveRef.current = false;
      return;
    }

    const idleAction = resolveNpcClipAction('idle', currentActions, clipOverridesRef.current);
    const walkAction = resolveNpcClipAction('walk', currentActions, clipOverridesRef.current);
    const bindKey = `${idleAction?.getClip().uuid ?? 'none'}:${walkAction?.getClip().uuid ?? 'none'}:${overridesKey}`;

    if (bindKey === boundKeyRef.current) {
      // The merged actions object changes identity as deferred staged clips
      // arrive while the bound idle/walk clips stay the same. If anything
      // stopped the actions in the meantime, re-arm them — otherwise the
      // NPC freezes mid-pose with the mixer still ticking (v4.33.0).
      rearmStoppedAction(idleAction, currentIdleWeightRef.current);
      if (walkAction && walkAction !== idleAction) {
        rearmStoppedAction(walkAction, currentWalkWeightRef.current);
      }
      if (idleAction || walkAction) locomotionActiveRef.current = true;
      return;
    }
    boundKeyRef.current = bindKey;

    idleActionRef.current = idleAction;
    walkActionRef.current = walkAction;

    if (!idleAction && !walkAction) {
      locomotionActiveRef.current = false;
      return;
    }

    locomotionActiveRef.current = true;
    currentIdleWeightRef.current = targetWalkWeight(animStateRef.current) > 0.5 ? 0 : 1;
    currentWalkWeightRef.current = 1 - currentIdleWeightRef.current;

    if (idleAction) {
      idleAction.reset();
      idleAction.setLoop(LoopRepeat, Infinity);
      idleAction.setEffectiveWeight(currentIdleWeightRef.current);
      idleAction.play();
    }
    if (walkAction && walkAction !== idleAction) {
      walkAction.reset();
      walkAction.setLoop(LoopRepeat, Infinity);
      // Gait-matched playback: patrol speed ÷ natural clip speed — feet
      // track the ground instead of sliding (v4.33.0).
      walkAction.setEffectiveTimeScale(NPC_WALK_CLIP_TIME_SCALE);
      walkAction.setEffectiveWeight(currentWalkWeightRef.current);
      walkAction.play();
    }
  }, [actions, overridesKey]);

  useLayoutEffect(() => {
    if (!isLocomotionState(animState)) {
      if (idleActionRef.current) idleActionRef.current.setEffectiveWeight(0);
      if (walkActionRef.current && walkActionRef.current !== idleActionRef.current) {
        walkActionRef.current.setEffectiveWeight(0);
      }
      crossfadeTo(animState);
      return;
    }

    const idleAction = idleActionRef.current;
    const walkAction = walkActionRef.current;
    if (idleAction) idleAction.enabled = true;
    if (walkAction && walkAction !== idleAction) walkAction.enabled = true;
  }, [animState, crossfadeTo]);

  useRegisterNpcFrame(
    `${npcId}:locomotion-blend`,
    'mixer',
    ({ delta }) => {
      if (!locomotionActiveRef.current || !isLocomotionState(animStateRef.current)) return;

      const idleAction = idleActionRef.current;
      const walkAction = walkActionRef.current;
      if (!idleAction && !walkAction) return;

      const dt = Math.min(delta, 0.05);
      const targetWalk = targetWalkWeight(animStateRef.current);
      const targetIdle = 1 - targetWalk;
      const speed = targetWalk > currentWalkWeightRef.current ? BLEND_ACCEL : BLEND_DECEL;

      currentWalkWeightRef.current = expBlend(currentWalkWeightRef.current, targetWalk, speed, dt);
      currentIdleWeightRef.current = expBlend(currentIdleWeightRef.current, targetIdle, speed, dt);

      if (currentWalkWeightRef.current < WEIGHT_EPSILON) currentWalkWeightRef.current = 0;
      if (currentIdleWeightRef.current < WEIGHT_EPSILON) currentIdleWeightRef.current = 0;

      if (idleAction) idleAction.setEffectiveWeight(currentIdleWeightRef.current);
      if (walkAction && walkAction !== idleAction) {
        walkAction.setEffectiveWeight(currentWalkWeightRef.current);
        // Keep the gait match across weight blending (the tick re-applies
        // weights every frame; enforce the patrol-matched rate too).
        walkAction.timeScale = NPC_WALK_CLIP_TIME_SCALE;
      }
    },
    { enabled },
  );
}

export { isLocomotionState as isNpcLocomotionAnimState };
