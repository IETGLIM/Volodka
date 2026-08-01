import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { SCENE_CONFIG } from '@/config/scenes';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { SCENE_OVERLAY_MS, TRANSITION_MILESTONES } from '@/shared/constants/transitionTimings';
import type { SceneId, SceneConfig } from '@/shared/types/game';
import type { SceneTransitionStyle } from '@/engine/exploration/explorationUxPresentation';

export type TransitionOverlayPhase =
  | 'idle'
  | 'glitch'
  | 'flash'
  | 'darken'
  | 'ripple-in'
  | 'dissolve-in'
  | 'film-burn-in'
  | 'glitch-cut-in'
  | 'breathe-in'
  | 'wipe-in'
  | 'hold'
  | 'wipe-out'
  | 'reveal';

const GLITCH_DURATION = SCENE_OVERLAY_MS.GLITCH;
const FLASH_DURATION = SCENE_OVERLAY_MS.FLASH;
const DARKEN_DURATION = SCENE_OVERLAY_MS.DARKEN;
const RIPPLE_DURATION = SCENE_OVERLAY_MS.RIPPLE;
const DISSOLVE_DURATION = SCENE_OVERLAY_MS.DISSOLVE;
const FILM_BURN_DURATION = SCENE_OVERLAY_MS.FILM_BURN;
const GLITCH_CUT_DURATION = SCENE_OVERLAY_MS.GLITCH_CUT;
const BREATHE_DURATION = SCENE_OVERLAY_MS.BREATHE;
const WIPE_IN_DURATION = SCENE_OVERLAY_MS.WIPE_IN;
const WIPE_OUT_DURATION = SCENE_OVERLAY_MS.WIPE_OUT;
const REVEAL_DURATION = SCENE_OVERLAY_MS.REVEAL;

/* ─── Weighted random transition selection ─── */
/** Original 5 styles at weight 3 each, new 3 at weight 1 each. Total weight = 18. */
const WEIGHTED_TRANSITIONS: Array<{ style: SceneTransitionStyle; weight: number }> = [
  { style: 'wipe', weight: 3 },
  { style: 'flash', weight: 3 },
  { style: 'darken', weight: 3 },
  { style: 'ripple', weight: 3 },
  { style: 'dissolve', weight: 3 },
  { style: 'film_burn', weight: 1 },
  { style: 'glitch_cut', weight: 1 },
  { style: 'breathe', weight: 1 },
];

const TOTAL_WEIGHT = WEIGHTED_TRANSITIONS.reduce((sum, e) => sum + e.weight, 0);

function pickRandomTransition(): SceneTransitionStyle {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const entry of WEIGHTED_TRANSITIONS) {
    r -= entry.weight;
    if (r <= 0) return entry.style;
  }
  return 'wipe'; // fallback
}

function getTransitionStyle(sceneId: SceneId): SceneConfig['transitionStyle'] {
  const explicit = SCENE_CONFIG[sceneId]?.transitionStyle;
  if (explicit) return explicit;
  return pickRandomTransition();
}

function getInitialPhase(style: SceneConfig['transitionStyle']): TransitionOverlayPhase {
  switch (style) {
    case 'flash':
      return 'flash';
    case 'darken':
      return 'darken';
    case 'ripple':
      return 'ripple-in';
    case 'dissolve':
      return 'dissolve-in';
    case 'film_burn':
      return 'film-burn-in';
    case 'glitch_cut':
      return 'glitch-cut-in';
    case 'breathe':
      return 'breathe-in';
    default:
      return 'glitch';
  }
}

function introDurationMs(style: SceneConfig['transitionStyle']): number {
  switch (style) {
    case 'flash':
      return FLASH_DURATION;
    case 'darken':
      return DARKEN_DURATION;
    case 'ripple':
      return RIPPLE_DURATION;
    case 'dissolve':
      return DISSOLVE_DURATION;
    case 'film_burn':
      return FILM_BURN_DURATION;
    case 'glitch_cut':
      return GLITCH_CUT_DURATION;
    case 'breathe':
      return BREATHE_DURATION;
    default:
      return GLITCH_DURATION + WIPE_IN_DURATION;
  }
}

function isRevealPhase(phase: TransitionOverlayPhase): boolean {
  return phase === 'wipe-out' || phase === 'reveal';
}

/** Drives cinematic overlay phases from TransitionDirector milestones (not store timers alone). */
export function useSceneTransitionOverlayController() {
  const { phase: directorPhase, progress, targetScene } = useTransitionDirector();
  const [overlayPhase, setOverlayPhase] = useState<TransitionOverlayPhase>('idle');
  const [transitionStyle, setTransitionStyle] = useState<SceneConfig['transitionStyle']>('wipe');
  const [targetSceneId, setTargetSceneId] = useState<SceneId>('volodka_room');

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const overlayGenRef = useRef(0);
  const [introComplete, setIntroComplete] = useState(false);
  const activeTargetRef = useRef<SceneId | null>(null);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const finishOverlay = useCallback(
    (gen: number) => {
      if (gen !== overlayGenRef.current) return;
      setOverlayPhase('idle');
      activeTargetRef.current = null;
      setIntroComplete(false);
    },
    [],
  );

  const scheduleRevealFinish = useCallback(
    (style: SceneConfig['transitionStyle'], gen: number) => {
      const delay = style === 'wipe' ? WIPE_OUT_DURATION : REVEAL_DURATION;
      const timer = setTimeout(() => finishOverlay(gen), delay);
      timersRef.current.push(timer);
    },
    [finishOverlay],
  );

  const beginReveal = useCallback(
    (style: SceneConfig['transitionStyle'], sceneId: SceneId, gen: number) => {
      if (gen !== overlayGenRef.current) return;
      const next = style === 'wipe' ? 'wipe-out' : 'reveal';
      setOverlayPhase(next);
      eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });
      scheduleRevealFinish(style, gen);
    },
    [scheduleRevealFinish],
  );

  const scheduleIntro = useCallback(
    (style: SceneConfig['transitionStyle'], sceneId: SceneId, gen: number) => {
      if (style === 'wipe') {
        const glitchTimer = setTimeout(() => {
          if (gen !== overlayGenRef.current) return;
          setOverlayPhase('wipe-in');
          eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });
          const wipeTimer = setTimeout(() => {
            if (gen !== overlayGenRef.current) return;
            setIntroComplete(true);
          }, WIPE_IN_DURATION);
          timersRef.current.push(wipeTimer);
        }, GLITCH_DURATION);
        timersRef.current.push(glitchTimer);
        return;
      }

      const duration = introDurationMs(style);
      const timer = setTimeout(() => {
        if (gen !== overlayGenRef.current) return;
        setIntroComplete(true);
      }, duration);
      timersRef.current.push(timer);
    },
    [],
  );

  const startTransition = useCallback(
    (sceneId: SceneId) => {
      overlayGenRef.current += 1;
      const gen = overlayGenRef.current;
      clearTimers();
      setIntroComplete(false);
      activeTargetRef.current = sceneId;

      const style = getTransitionStyle(sceneId);
      setTransitionStyle(style);
      setTargetSceneId(sceneId);
      eventBus.emit('camera:cinematic_transition', { phase: 'fadeOut', sceneId });
      setOverlayPhase(getInitialPhase(style));
      scheduleIntro(style, sceneId, gen);
    },
    [clearTimers, scheduleIntro],
  );

  useEffect(() => {
    if (directorPhase !== 'loading' || !targetScene) return;
    if (activeTargetRef.current === targetScene && overlayPhase !== 'idle') return;
    startTransition(targetScene);
  }, [directorPhase, targetScene, overlayPhase, startTransition]);

  useEffect(() => {
    if (!introComplete) return;
    if (directorPhase !== 'loading' && directorPhase !== 'complete') return;
    if (overlayPhase === 'hold' || isRevealPhase(overlayPhase)) return;

    const readyForHold =
      directorPhase === 'complete' || progress >= TRANSITION_MILESTONES.entered;

    if (!readyForHold) return;

    setOverlayPhase('hold');
    eventBus.emit('camera:cinematic_transition', {
      phase: 'hold',
      sceneId: targetSceneId,
    });
  }, [directorPhase, progress, overlayPhase, targetSceneId, introComplete]);

  useEffect(() => {
    if (directorPhase !== 'complete') return;
    if (overlayPhase === 'idle' || isRevealPhase(overlayPhase)) return;

    if (!introComplete) {
      setIntroComplete(true);
    }

    beginReveal(transitionStyle, targetSceneId, overlayGenRef.current);
  }, [directorPhase, overlayPhase, transitionStyle, targetSceneId, introComplete, beginReveal]);

  useEffect(() => {
    if (directorPhase !== 'idle') return;
    if (overlayPhase === 'idle') return;
    clearTimers();
    setOverlayPhase('idle');
    activeTargetRef.current = null;
    setIntroComplete(false);
  }, [directorPhase, overlayPhase, clearTimers]);

  useEffect(() => {
    return eventBus.on('scene:transition_failed', () => {
      overlayGenRef.current += 1;
      clearTimers();
      setOverlayPhase('idle');
      activeTargetRef.current = null;
      setIntroComplete(false);
    });
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    overlayPhase,
    transitionStyle,
    targetSceneId,
    isActive: overlayPhase !== 'idle',
  };
}
