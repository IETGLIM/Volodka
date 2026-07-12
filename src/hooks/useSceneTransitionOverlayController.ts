import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { SCENE_CONFIG } from '@/config/scenes';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { SCENE_OVERLAY_MS, TRANSITION_MILESTONES } from '@/shared/constants/transitionTimings';
import type { SceneId, SceneConfig } from '@/shared/types/game';

export type TransitionOverlayPhase =
  | 'idle'
  | 'glitch'
  | 'flash'
  | 'darken'
  | 'ripple-in'
  | 'dissolve-in'
  | 'wipe-in'
  | 'hold'
  | 'wipe-out'
  | 'reveal';

const GLITCH_DURATION = SCENE_OVERLAY_MS.GLITCH;
const FLASH_DURATION = SCENE_OVERLAY_MS.FLASH;
const DARKEN_DURATION = SCENE_OVERLAY_MS.DARKEN;
const RIPPLE_DURATION = SCENE_OVERLAY_MS.RIPPLE;
const DISSOLVE_DURATION = SCENE_OVERLAY_MS.DISSOLVE;
const WIPE_IN_DURATION = SCENE_OVERLAY_MS.WIPE_IN;
const WIPE_OUT_DURATION = SCENE_OVERLAY_MS.WIPE_OUT;
const REVEAL_DURATION = SCENE_OVERLAY_MS.REVEAL;

function getTransitionStyle(sceneId: SceneId): SceneConfig['transitionStyle'] {
  return SCENE_CONFIG[sceneId]?.transitionStyle ?? 'wipe';
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
    if (overlayPhase === 'idle' || isRevealPhase(overlayPhase)) return;
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
