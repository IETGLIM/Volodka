import { useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  resolveLocomotionClipState,
  resolveRunWalkCrossfadeTarget,
} from '@/engine/player/playerLocomotionPresentation';
import {
  bindPlayerClipActions,
} from '@/engine/player/playerLocomotionClips';
import {
  PLAYER_IDLE_CLIP_NAMES,
  PLAYER_WALK_CLIP_NAMES,
  PLAYER_RUN_CLIP_NAMES,
} from '@/engine/player/playerClipResolution';

const CLIP_CROSSFADE_SEC = 0.2;
const CINEMATIC_CROSSFADE_SEC = 0.35;

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
 * actions are not needlessly re-bound (which would reset the crossfade
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
 * AAA locomotion blend tree for the hero GLB — idle / walk / run with crossfade,
 * PLUS cinematic clip support (sitting / sleeping / talking / working) for
 * cutscenes and dialogue. The cinematic clips crossfade in/out of the
 * locomotion blend tree based on `currentAnimRef.current`.
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
  const prevLocomotionRef = useRef(false);
  const prevRunWeightRef = useRef(0);
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
      idleAction.setEffectiveWeight(1);
      idleAction.play();
      idleActionRef.current = idleAction;
    } else {
      idleActionRef.current = null;
    }

    if (walkAction && walkAction !== idleAction) {
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      walkAction.reset();
      walkAction.setEffectiveWeight(0);
      walkAction.play();
      walkActionRef.current = walkAction;
    } else {
      walkActionRef.current = walkAction && walkAction !== idleAction ? walkAction : null;
    }

    if (runAction && runAction !== walkAction && runAction !== idleAction) {
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      runAction.reset();
      runAction.setEffectiveWeight(0);
      runAction.play();
      runActionRef.current = runAction;
    } else {
      runActionRef.current = null;
    }

    // Preserve the current locomotion state across re-binds. Previously
    // this was reset to false, which caused the walk crossfade to restart
    // every time a Mixamo clip loaded (6 clips = 6 restarts). Instead,
    // check the current anim and set prevLocomotionRef to match, so the
    // crossfade logic only fires when the anim ACTUALLY changes.
    const currentClipState = resolveLocomotionClipState(currentAnimRef.current);
    prevLocomotionRef.current = currentClipState.locomotionActive && !!walkAction;
    prevRunWeightRef.current = currentClipState.runWeight;
    // If the player is already walking, immediately start the crossfade
    // so there's no 1-frame gap where the walk action has weight 0.
    if (prevLocomotionRef.current && idleAction && walkAction) {
      idleAction.setEffectiveWeight(0);
      walkAction.setEffectiveWeight(1);
    }
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
          // Transitioning into a new cinematic clip: fade out everything
          // else (locomotion + previous cinematic), fade in the target.
          if (cinematicActionRef.current && cinematicActionRef.current !== targetAction) {
            cinematicActionRef.current.fadeOut(CINEMATIC_CROSSFADE_SEC);
          }
          if (idleAction) idleAction.fadeOut(CINEMATIC_CROSSFADE_SEC);
          if (walkAction) walkAction.fadeOut(CINEMATIC_CROSSFADE_SEC);
          if (runAction) runAction.fadeOut(CINEMATIC_CROSSFADE_SEC);

          targetAction.setLoop(THREE.LoopRepeat, Infinity);
          targetAction.reset();
          targetAction.setEffectiveWeight(0);
          targetAction.play();
          targetAction.fadeIn(CINEMATIC_CROSSFADE_SEC);

          cinematicActionRef.current = targetAction;
          prevCinematicClipRef.current = animName;
          // Reset locomotion tracking so when we exit cinematic, the
          // crossfade back to idle/walk fires correctly.
          prevLocomotionRef.current = false;
          prevRunWeightRef.current = 0;
        }

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
        // Fade locomotion back in. The crossfade logic below will set
        // the correct weights based on the current locomotion state.
        if (idleAction) {
          idleAction.reset();
          idleAction.setEffectiveWeight(0);
          idleAction.play();
          idleAction.fadeIn(CINEMATIC_CROSSFADE_SEC);
        }
        if (walkAction && currentAnimRef.current === 'walk') {
          walkAction.setEffectiveWeight(0);
          walkAction.play();
          walkAction.fadeIn(CINEMATIC_CROSSFADE_SEC);
        }
        // Symmetric fade-in for runAction — without this, if the player was
        // running when the cinematic started, runAction stays at weight 0 for
        // one frame after the cinematic ends, causing a brief walk→run stutter
        // as the locomotion blend tree re-balances the weights.
        if (runAction && currentAnimRef.current === 'run') {
          runAction.setEffectiveWeight(0);
          runAction.play();
          runAction.fadeIn(CINEMATIC_CROSSFADE_SEC);
        }
      }

      // ── Locomotion blend tree (idle / walk / run) ──
      const clipState = resolveLocomotionClipState(animName);
      const locomotionActive = clipState.locomotionActive && !!walkAction;

      if (locomotionActive !== prevLocomotionRef.current) {
        if (locomotionActive && walkAction && idleAction) {
          idleAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
        } else if (!locomotionActive && idleAction && walkAction) {
          walkAction.crossFadeTo(idleAction, CLIP_CROSSFADE_SEC, false);
          prevRunWeightRef.current = 0;
        }
        prevLocomotionRef.current = locomotionActive;
      }

      if (locomotionActive && walkAction) {
        walkAction.timeScale = clipState.walkTimeScale;
        if (runAction) {
          runAction.timeScale = clipState.runTimeScale;
          const crossfadeTarget = resolveRunWalkCrossfadeTarget(
            prevRunWeightRef.current,
            clipState.runWeight,
          );
          if (crossfadeTarget === 'walk_to_run') {
            walkAction.crossFadeTo(runAction, CLIP_CROSSFADE_SEC, false);
          } else if (crossfadeTarget === 'run_to_walk') {
            runAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
          }
          prevRunWeightRef.current = clipState.runWeight;
        } else {
          walkAction.timeScale = clipState.runWeight > 0
            ? clipState.runTimeScale
            : clipState.walkTimeScale;
        }
      } else if (idleAction) {
        idleAction.timeScale = 1;
      }

      mixer.update(delta);
    },
    { phase: 'post_physics', label: 'PlayerLocomotionMixer' },
  );
}
