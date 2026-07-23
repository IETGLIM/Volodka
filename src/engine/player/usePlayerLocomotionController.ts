import { useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  resolveLocomotionClipState,
} from '@/engine/player/playerLocomotionPresentation';
import {
  bindPlayerClipActions,
} from '@/engine/player/playerLocomotionClips';
import {
  PLAYER_IDLE_CLIP_NAMES,
  PLAYER_WALK_CLIP_NAMES,
  PLAYER_RUN_CLIP_NAMES,
} from '@/engine/player/playerClipResolution';

// ── Blend speeds for weight-based locomotion blending ──
// Exponential damping: newWeight = prevWeight + (targetWeight - prevWeight) * (1 - exp(-blendSpeed * delta))
const BLEND_ACCEL = 6;       // Idle→Walk: fast but smooth acceleration
const BLEND_WALK_RUN = 4;    // Walk→Run: slightly slower for natural feel
const BLEND_DECEL = 3;       // Walk→Idle / Run→Walk: natural deceleration
const BLEND_CINEMATIC = 8;   // Cinematic entry/exit: fast (~0.35s equivalent)

const CLIP_CROSSFADE_SEC = 0.2;
const CINEMATIC_CROSSFADE_SEC = 0.35;

/** Weight threshold — below this, clamp to 0 to allow the mixer to deactivate the action. */
const WEIGHT_EPSILON = 0.001;

const LOCOMOTION_CLIP_NAMES = new Set<string>([
  ...PLAYER_IDLE_CLIP_NAMES,
  ...PLAYER_WALK_CLIP_NAMES,
  ...PLAYER_RUN_CLIP_NAMES,
]);

/**
 * Non-locomotion clip states played during cinematics (cutscenes, dialogue).
 * These map 1:1 to Mixamo canonical clip names registered by
 * `useMixamoAnimationClips`. The embedded Quaternius GLB does NOT ship
 * these states, so they require the Mixamo clips to be loaded.
 */
const CINEMATIC_CLIP_NAMES = new Set<string>([
  'sitting',
  'sleeping',
  'talking',
  'working',
]);

/**
 * Build a bind-key that ONLY changes when the locomotion-relevant actions
 * (idle/walk/run) change. Loading a non-locomotion Mixamo clip (e.g.
 * 'sitting', 'sleeping') does NOT change this key, so the locomotion
 * actions are not needlessly re-bound (which would reset the blend weights
 * and cause the walk animation to flicker/restart).
 */
function computeLocomotionBindKey(
  animations: THREE.AnimationClip[],
  actions: Record<string, THREE.AnimationAction>,
): string {
  const locomotionKeys = Object.keys(actions)
    .filter((k) => LOCOMOTION_CLIP_NAMES.has(k))
    .sort()
    .join(',');
  return `${animations.length}:${locomotionKeys}`;
}

export interface UsePlayerLocomotionControllerOptions {
  mixer: THREE.AnimationMixer | null;
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
  /** Merged embedded + optional Mixamo clip actions. */
  actions: Record<string, THREE.AnimationAction> | null;
  currentAnimRef: MutableRefObject<string>;
}

/**
 * AAA weight-based locomotion blend tree for the hero GLB — idle / walk / run
 * clips play simultaneously with varying weights, eliminating the pose-restart
 * stutter caused by crossFadeTo. Cinematic clips (sitting / sleeping / talking /
 * working) still use fadeOut/fadeIn for transitions.
 *
 * Binds once per mixer+actions identity; updates after physics sets currentAnimRef.
 */
export function usePlayerLocomotionController({
  mixer,
  root,
  animations,
  actions,
  currentAnimRef,
}: UsePlayerLocomotionControllerOptions): void {
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const cinematicActionRef = useRef<THREE.AnimationAction | null>(null);
  const prevCinematicClipRef = useRef<string | null>(null);

  // ── Weight tracking refs for blend tree ──
  const currentIdleWeightRef = useRef(1);
  const currentWalkWeightRef = useRef(0);
  const currentRunWeightRef = useRef(0);

  const boundKeyRef = useRef<string | null>(null);
  // Track the latest actions object so the frame tick can look up
  // cinematic clips by name without re-registering the tick callback
  // each time a new Mixamo clip loads.
  const actionsRef = useRef<Record<string, THREE.AnimationAction> | null>(actions);
  actionsRef.current = actions;

  useLayoutEffect(() => {
    // Read the latest actions from the ref — NOT from the `actions` prop.
    // The `actions` object is recreated (via useMemo in useMixamoAnimationClips)
    // every time a Mixamo clip loads. If `actions` were in the dep array,
    // this effect would re-run 6 times during initial load (once per clip),
    // each time stopping + re-binding idle/walk/run. The re-bind calls
    // `idleAction.reset()` which restarts the idle animation from time 0,
    // causing a visible hitch 6 times in ~2 seconds.
    //
    // By reading `actionsRef.current` and excluding `actions` from deps,
    // the effect only re-runs when mixer/root/animations change (rare events
    // that genuinely require re-binding). The frame tick reads
    // `actionsRef.current` for cinematic clip lookups, so newly loaded
    // Mixamo clips are picked up without re-binding locomotion.
    const currentActions = actionsRef.current;
    if (!mixer || !currentActions || animations.length === 0) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
      cinematicActionRef.current = null;
      prevCinematicClipRef.current = null;
      boundKeyRef.current = null;
      return;
    }

    // Only re-bind when the LOCOMOTION-relevant actions change, not when
    // non-locomotion Mixamo clips (sitting, sleeping, etc.) load.
    const bindKey = computeLocomotionBindKey(animations, currentActions);
    if (boundKeyRef.current === bindKey) return;
    boundKeyRef.current = bindKey;

    for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
      action?.stop();
    }

    const { idle: idleAction, walk: walkAction, run: runAction } = bindPlayerClipActions(
      mixer,
      currentActions,
      animations,
      root,
    );

    if (idleAction) {
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.reset();
      idleAction.play();
      idleActionRef.current = idleAction;
    } else {
      idleActionRef.current = null;
    }

    if (walkAction && walkAction !== idleAction) {
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      walkAction.reset();
      walkAction.play();
      walkActionRef.current = walkAction;
    } else {
      walkActionRef.current = null;
    }

    if (runAction && runAction !== walkAction && runAction !== idleAction) {
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      runAction.reset();
      runAction.play();
      runActionRef.current = runAction;
    } else {
      runActionRef.current = null;
    }

    // ── Initialize blend weights based on current locomotion state ──
    // This preserves the locomotion state across re-binds, so the blend
    // tree doesn't restart from idle when a Mixamo clip loads.
    const clipState = resolveLocomotionClipState(currentAnimRef.current);
    const locomotionActive = clipState.locomotionActive && !!walkActionRef.current;

    if (locomotionActive) {
      if (clipState.runWeight >= 1 && runActionRef.current) {
        currentIdleWeightRef.current = 0;
        currentWalkWeightRef.current = 0;
        currentRunWeightRef.current = 1;
      } else {
        currentIdleWeightRef.current = 0;
        currentWalkWeightRef.current = 1;
        currentRunWeightRef.current = 0;
      }
    } else {
      currentIdleWeightRef.current = 1;
      currentWalkWeightRef.current = 0;
      currentRunWeightRef.current = 0;
    }

    // Apply initial weights on actions
    if (idleAction) idleAction.setEffectiveWeight(currentIdleWeightRef.current);
    if (walkAction && walkAction !== idleAction) walkAction.setEffectiveWeight(currentWalkWeightRef.current);
    if (runAction && runAction !== walkAction && runAction !== idleAction) runAction.setEffectiveWeight(currentRunWeightRef.current);

    mixer.update(0);

    return () => {
      for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
        action?.stop();
      }
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
      boundKeyRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentAnimRef is a stable ref; actions read via actionsRef to avoid re-binding on every Mixamo clip load
  }, [mixer, root, animations]);

  useFrameTick(
    'player',
    ({ delta }) => {
      if (!mixer) return;

      const idleAction = idleActionRef.current;
      const walkAction = walkActionRef.current;
      const runAction = runActionRef.current;
      const currentActions = actionsRef.current;

      // Always call mixer.update(delta) so the mixer advances even if
      // actions aren't bound yet (e.g., during the brief window between
      // useSkinnedGltfClone commit and useLayoutEffect bind). Without this,
      // the model would freeze in a static pose until the bind completes.
      if (!idleAction && !walkAction) {
        mixer.update(delta);
        return;
      }

      const animName = currentAnimRef.current;
      const isCinematic = CINEMATIC_CLIP_NAMES.has(animName);

      // ── Cinematic clip handling (sitting, sleeping, talking, working) ──
      // These states require the Mixamo clip to be loaded. If not yet
      // available, fall through to idle/locomotion as a graceful fallback.
      if (isCinematic) {
        const targetAction = currentActions?.[animName] ?? null;

        if (targetAction && prevCinematicClipRef.current !== animName) {
          // Transitioning into a new cinematic clip: fade out previous
          // cinematic, fade in the target. Locomotion weights will be
          // damped to 0 by the blend tree below.
          if (cinematicActionRef.current && cinematicActionRef.current !== targetAction) {
            cinematicActionRef.current.fadeOut(CINEMATIC_CROSSFADE_SEC);
          }

          targetAction.setLoop(THREE.LoopRepeat, Infinity);
          targetAction.reset();
          targetAction.setEffectiveWeight(0);
          targetAction.play();
          targetAction.fadeIn(CINEMATIC_CROSSFADE_SEC);

          cinematicActionRef.current = targetAction;
          prevCinematicClipRef.current = animName;
        }

        // During cinematic: damp locomotion weights toward 0 with fast
        // cinematic blend speed. This creates a smooth hand-off to the
        // cinematic clip's fadeIn without pose-restart stutter.
        const cinematicDamp = 1 - Math.exp(-BLEND_CINEMATIC * delta);
        currentIdleWeightRef.current += (0 - currentIdleWeightRef.current) * cinematicDamp;
        currentWalkWeightRef.current += (0 - currentWalkWeightRef.current) * cinematicDamp;
        currentRunWeightRef.current += (0 - currentRunWeightRef.current) * cinematicDamp;

        // Clamp negligible weights to 0 so the mixer can deactivate actions
        if (currentIdleWeightRef.current < WEIGHT_EPSILON) currentIdleWeightRef.current = 0;
        if (currentWalkWeightRef.current < WEIGHT_EPSILON) currentWalkWeightRef.current = 0;
        if (currentRunWeightRef.current < WEIGHT_EPSILON) currentRunWeightRef.current = 0;

        if (idleAction) idleAction.setEffectiveWeight(currentIdleWeightRef.current);
        if (walkAction) walkAction.setEffectiveWeight(currentWalkWeightRef.current);
        if (runAction) runAction.setEffectiveWeight(currentRunWeightRef.current);

        mixer.update(delta);
        return;
      }

      // ── Exiting cinematic state back to locomotion ──
      if (prevCinematicClipRef.current !== null) {
        if (cinematicActionRef.current) {
          cinematicActionRef.current.fadeOut(CINEMATIC_CROSSFADE_SEC);
          cinematicActionRef.current = null;
        }
        prevCinematicClipRef.current = null;
        // Reset weight refs to 0 — the blend tree will ramp them up
        // from 0 to the target weights, creating a smooth transition
        // from cinematic back to locomotion. The cinematic fadeOut
        // and locomotion weight ramp together produce a seamless crossfade.
        currentIdleWeightRef.current = 0;
        currentWalkWeightRef.current = 0;
        currentRunWeightRef.current = 0;
      }

      // ── Weight-based locomotion blend tree (idle / walk / run) ──
      const clipState = resolveLocomotionClipState(animName);
      const locomotionActive = clipState.locomotionActive && !!walkAction;

      // Compute target weights based on locomotion state
      let targetIdleWeight: number;
      let targetWalkWeight: number;
      let targetRunWeight: number;

      if (!locomotionActive) {
        targetIdleWeight = 1;
        targetWalkWeight = 0;
        targetRunWeight = 0;
      } else if (clipState.runWeight >= 1 && runAction) {
        targetIdleWeight = 0;
        targetWalkWeight = 0;
        targetRunWeight = 1;
      } else {
        targetIdleWeight = 0;
        targetWalkWeight = 1;
        targetRunWeight = 0;
      }

      // ── Choose blend speed based on transition direction ──
      // Using a single blend speed per frame keeps weights normalized
      // (sum ≈ 1) when starting from a normalized state, which ensures
      // the character pose is always fully driven by the blend tree.
      const currentIntensity = currentWalkWeightRef.current + currentRunWeightRef.current;
      const targetIntensity = targetWalkWeight + targetRunWeight;

      let blendSpeed: number;
      if (currentIntensity < targetIntensity - 0.01) {
        // Accelerating (idle→walk or idle→run)
        blendSpeed = targetRunWeight > 0.5 ? BLEND_WALK_RUN : BLEND_ACCEL;
      } else if (currentIntensity > targetIntensity + 0.01) {
        // Decelerating (walk→idle, run→idle, run→walk)
        blendSpeed = BLEND_DECEL;
      } else {
        // Same intensity level — walk↔run redistribution
        if (targetRunWeight > currentRunWeightRef.current + 0.01) {
          blendSpeed = BLEND_WALK_RUN;  // walk→run
        } else if (targetRunWeight < currentRunWeightRef.current - 0.01) {
          blendSpeed = BLEND_DECEL;     // run→walk
        } else {
          // No significant change — maintain current weights with gentle blend
          blendSpeed = BLEND_DECEL;
        }
      }

      // ── Apply exponential damping ──
      // Frame-rate-independent: newWeight = prevWeight + (targetWeight - prevWeight) * (1 - exp(-blendSpeed * delta))
      const dampFactor = 1 - Math.exp(-blendSpeed * delta);
      currentIdleWeightRef.current += (targetIdleWeight - currentIdleWeightRef.current) * dampFactor;
      currentWalkWeightRef.current += (targetWalkWeight - currentWalkWeightRef.current) * dampFactor;
      currentRunWeightRef.current += (targetRunWeight - currentRunWeightRef.current) * dampFactor;

      // Clamp negligible weights to 0 so the mixer can deactivate actions
      if (currentIdleWeightRef.current < WEIGHT_EPSILON && targetIdleWeight === 0) currentIdleWeightRef.current = 0;
      if (currentWalkWeightRef.current < WEIGHT_EPSILON && targetWalkWeight === 0) currentWalkWeightRef.current = 0;
      if (currentRunWeightRef.current < WEIGHT_EPSILON && targetRunWeight === 0) currentRunWeightRef.current = 0;

      // ── Set effective weights and time scales on actions ──
      if (idleAction) idleAction.setEffectiveWeight(currentIdleWeightRef.current);
      if (walkAction) {
        walkAction.setEffectiveWeight(currentWalkWeightRef.current);
        walkAction.timeScale = locomotionActive ? clipState.walkTimeScale : 1;
      }
      if (runAction) {
        runAction.setEffectiveWeight(currentRunWeightRef.current);
        runAction.timeScale = locomotionActive ? clipState.runTimeScale : 1;
      }

      // When no walk clip is available, adjust idle timeScale as a
      // fallback so the character doesn't slide at idle speed while moving.
      if (!walkAction && clipState.locomotionActive && idleAction) {
        idleAction.timeScale = clipState.runWeight > 0 ? clipState.runTimeScale : clipState.walkTimeScale;
      } else if (idleAction && !clipState.locomotionActive) {
        idleAction.timeScale = 1;
      }

      mixer.update(delta);
    },
    { phase: 'post_physics', label: 'PlayerLocomotionMixer' },
  );
}
