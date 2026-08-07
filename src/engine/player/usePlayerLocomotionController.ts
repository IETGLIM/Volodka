import { useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  resolveLocomotionClipState,
  WALK_CLIP_TIME_SCALE,
  smoothstep,
} from '@/engine/player/playerLocomotionPresentation';
import { WALK_SPEED, RUN_SPEED } from '@/engine/player/playerConstants';
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
const BLEND_ACCEL = 5.2;     // Idle→Walk: slightly softer acceleration (less kit hitch)
const BLEND_WALK_RUN = 3.6;  // Walk→Run: natural weight transfer
const BLEND_DECEL = 2.8;     // Walk→Idle / Run→Walk: longer settle into idle
const BLEND_CINEMATIC = 6.5; // Cinematic entry/exit: filmic hand-off

const _CLIP_CROSSFADE_SEC = 0.28;
const CINEMATIC_CROSSFADE_SEC = 0.48;

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
    .map((key) => `${key}:${actions[key]?.getClip().uuid ?? 'missing'}`)
    .join(',');
  return `${animations.map((clip) => clip.uuid).join(',')}:${locomotionKeys}`;
}

export interface UsePlayerLocomotionControllerOptions {
  mixer: THREE.AnimationMixer | null;
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
  /** Merged embedded + optional Mixamo clip actions. */
  actions: Record<string, THREE.AnimationAction> | null;
  currentAnimRef: MutableRefObject<string>;
  /**
   * Latest player horizontal speed (m/s). Drives the continuous walk↔run
   * AnimationAction blend via smoothstep. Optional — defaults to 0 when
   * omitted (e.g. SimplePlayer fallback, cinematic-only mounts).
   */
  currentHSpeedRef?: MutableRefObject<number>;
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
  currentHSpeedRef,
}: UsePlayerLocomotionControllerOptions): void {
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const cinematicActionRef = useRef<THREE.AnimationAction | null>(null);
  const prevCinematicClipRef = useRef<string | null>(null);

  // Session 12-B: one-shot flag set when the blend tree transitions OUT of a
  // cinematic clip (sitting/sleeping/talking/working) back to locomotion
  // (idle/walk/run). While true, the locomotion weight ramp uses
  // BLEND_CINEMATIC (6.5) instead of BLEND_DECEL (2.8) so it reaches ~95%
  // in ~0.46s — matching the cinematic fadeOut (0.48s). Without this, the
  // locomotion weights ramp at BLEND_DECEL=2.8 (0.8s to 95%), which is
  // SLOWER than the cinematic fadeOut, creating a ~0.3s window where the
  // total weight dips to ~0.55 → pose dip / T-pose bleed. Cleared once the
  // locomotion total weight reaches ~0.95 (ramp essentially complete) or
  // when a new cinematic clip starts (the entry branch below resets it).
  const justExitedCinematicRef = useRef(false);

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
  const locomotionBindKey = actions
    ? computeLocomotionBindKey(animations, actions)
    : null;

  useLayoutEffect(() => {
    // The full actions object changes when any deferred cinematic clip loads.
    // locomotionBindKey changes only when an idle/walk/run action (or its clip)
    // changes, so staged locomotion overrides bind without restarting for
    // unrelated sitting/talking/working arrivals.
    const currentActions = actionsRef.current;
    if (!mixer || !currentActions || !locomotionBindKey) {
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
    if (boundKeyRef.current === locomotionBindKey) return;
    boundKeyRef.current = locomotionBindKey;

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
    // tree doesn't restart from idle when a Mixamo clip loads. Uses the
    // continuous runWeight (smoothstep over hSpeed) so a re-bind mid-sprint
    // doesn't snap back to walk-only.
    const clipState = resolveLocomotionClipState(
      currentAnimRef.current,
      currentHSpeedRef?.current ?? 0,
    );
    const locomotionActive = clipState.locomotionActive && !!walkActionRef.current;

    if (locomotionActive) {
      if (runActionRef.current) {
        const rw = clipState.runWeight;
        currentIdleWeightRef.current = 0;
        currentWalkWeightRef.current = 1 - rw;
        currentRunWeightRef.current = rw;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentAnimRef is stable; actions are represented by locomotionBindKey
  }, [mixer, root, animations, locomotionBindKey]);

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
      const targetCinematicAction = isCinematic
        ? currentActions?.[animName] ?? null
        : null;

      // ── Cinematic clip handling (sitting, sleeping, talking, working) ──
      // These states require the Mixamo clip to be loaded. If not yet
      // available, fall through to idle/locomotion as a graceful fallback.
      if (targetCinematicAction) {
        if (prevCinematicClipRef.current !== animName) {
          // Transitioning into a new cinematic clip: fade out previous
          // cinematic, fade in the target. Locomotion weights will be
          // damped to 0 by the blend tree below.
          if (
            cinematicActionRef.current &&
            cinematicActionRef.current !== targetCinematicAction
          ) {
            cinematicActionRef.current.fadeOut(CINEMATIC_CROSSFADE_SEC);
          }

          targetCinematicAction.setLoop(THREE.LoopRepeat, Infinity);
          targetCinematicAction.reset();
          targetCinematicAction.setEffectiveWeight(0);
          targetCinematicAction.play();
          targetCinematicAction.fadeIn(CINEMATIC_CROSSFADE_SEC);

          cinematicActionRef.current = targetCinematicAction;
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
        // Session 12-B: arm the fast-exit blend flag so the locomotion weight
        // ramp uses BLEND_CINEMATIC (6.5) — matches the 0.48s cinematic
        // fadeOut. Without this, the ramp uses BLEND_DECEL=2.8 (0.8s to 95%),
        // leaving a ~0.3s window where total weight dips to ~0.55 → pose dip.
        justExitedCinematicRef.current = true;
      }

      // ── Weight-based locomotion blend tree (idle / walk / run) ──
      const clipState = resolveLocomotionClipState(
        animName,
        currentHSpeedRef?.current ?? 0,
      );
      const locomotionActive = clipState.locomotionActive && !!walkAction;

      // Compute target weights based on locomotion state.
      // runWeight is CONTINUOUS (smoothstep over actual hSpeed) so the
      // walk↔run crossfade ramps naturally with acceleration instead of
      // snapping 0/1 on the binary `running` input flag.
      let targetIdleWeight: number;
      let targetWalkWeight: number;
      let targetRunWeight: number;

      if (!locomotionActive) {
        targetIdleWeight = 1;
        targetWalkWeight = 0;
        targetRunWeight = 0;
      } else if (runAction) {
        // Both walk + run clips present — continuous smoothstep blend.
        const rw = clipState.runWeight; // 0..1 continuous
        targetIdleWeight = 0;
        targetWalkWeight = 1 - rw;
        targetRunWeight = rw;
      } else {
        // No run clip — walk carries full locomotion weight regardless of hSpeed.
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
      if (justExitedCinematicRef.current) {
        // Session 12-B: cinematic→locomotion exit. Use the fast cinematic
        // blend speed so the locomotion weight ramp matches the 0.48s
        // cinematic fadeOut (reaches ~95% in ~0.46s). Otherwise the ramp
        // runs at BLEND_DECEL=2.8 (0.8s to 95%) — slower than the fadeOut —
        // creating a ~0.3s total-weight dip (T-pose bleed risk). This branch
        // takes priority over the accel/decel/walk↔run branches below; the
        // flag is cleared once the ramp is essentially complete.
        blendSpeed = BLEND_CINEMATIC;
      } else if (currentIntensity < targetIntensity - 0.01) {
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

      // Session 12-B: clear the cinematic-exit flag once the locomotion total
      // weight is essentially at target (≥0.95). This hands back to the normal
      // accel/decel/walk↔run blend speeds for subsequent movement. The check
      // is on the post-damp weights (computed below) — but reading the pre-damp
      // values here is fine because once the ramp reaches 0.95 it stays there
      // (the target is normalized to 1.0). Using a max-time fallback would also
      // work, but the threshold check is tighter and matches the actual ramp
      // completion regardless of frame rate.
      if (justExitedCinematicRef.current) {
        const totalLocomotionWeight =
          currentIdleWeightRef.current +
          currentWalkWeightRef.current +
          currentRunWeightRef.current;
        if (totalLocomotionWeight >= 0.95) {
          justExitedCinematicRef.current = false;
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
        // AAA Phase B: continuous speed-scaled timeScale across full walk→run band
        // (uses same smoothstep band as camera bob + blend weights).
        // Prevents moonwalk at low speed; gives rich cinematic stride acceleration.
        const hSpeed = currentHSpeedRef?.current ?? 0;
        const speedT = Math.min(1, Math.max(0, (hSpeed - WALK_SPEED * 0.25) / (RUN_SPEED - WALK_SPEED * 0.25)));
        const walkTimeScaleCont = WALK_CLIP_TIME_SCALE * (0.42 + 0.58 * speedT);
        walkAction.timeScale = locomotionActive
          ? walkTimeScaleCont
          : 1;
      }
      if (runAction) {
        runAction.setEffectiveWeight(currentRunWeightRef.current);
        // Continuous run timeScale already good, but add tiny speed-modulated boost for weight
        const hSpeed = currentHSpeedRef?.current ?? 0;
        const runSpeedT = smoothstep(WALK_SPEED, RUN_SPEED, hSpeed);
        runAction.timeScale = locomotionActive
          ? clipState.runTimeScale * (0.96 + 0.08 * runSpeedT)
          : 1;
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
