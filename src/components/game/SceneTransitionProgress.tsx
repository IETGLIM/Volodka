
/* ─── Volodka RPG – Scene Transition Progress Bar ─── */
/* Thin cyberpunk progress bar at the top of the screen that shows
 * loading progress during scene transitions. Listens to EventBus
 * events `scene:transition` (start) and `scene:enter` (end).
 * Uses simulated progress: jumps to 30% quickly, then increments
 * slowly until the transition completes. */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { SceneId } from '@/shared/types/game';

/* ─── Types ─── */

type TransitionPhase = 'idle' | 'loading' | 'complete';

/* ─── Constants ─── */

/** Initial jump progress — reaches this quickly after transition starts */
const INITIAL_JUMP_PCT = 30;
/** Duration of the initial jump animation (ms) */
const INITIAL_JUMP_MS = 200;
/** Slow increment interval (ms) */
const SLOW_TICK_MS = 300;
/** Slow increment amount per tick (percentage points) */
const SLOW_INCREMENT = 3;
/** Maximum progress during slow phase (never hits 100% until transition ends) */
const SLOW_CAP_PCT = 90;
/** Duration to show "complete" state before fading out (ms) */
const COMPLETE_HOLD_MS = 500;
/** Progress bar height in pixels */
const BAR_HEIGHT_PX = 3;

/* ─── Accent colours ─── */

const CYAN = 'var(--cyber-cyan)';
const EMERALD = '#34d399';
const CYAN_GLOW = 'rgb(var(--cyber-cyan-rgb) / 0.35)';
const EMERALD_GLOW = 'rgba(52, 211, 153, 0.35)';

/* ─── Component ─── */

export function SceneTransitionProgress() {
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [sceneId, setSceneId] = useState<SceneId | null>(null);

  /* ── Refs for timers (avoid stale closures) ── */
  const slowTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialJumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const phaseRef = useRef<TransitionPhase>('idle');
  const loadingTransitionRef = useRef(false);
  /** scene:enter can nest inside scene:transition when the handler runs performSceneTransition first */
  const pendingEnterSceneRef = useRef<SceneId | null>(null);

  /** Clear all pending timers */
  const clearTimers = useCallback(() => {
    if (slowTickRef.current) { clearInterval(slowTickRef.current); slowTickRef.current = null; }
    if (completeTimerRef.current) { clearTimeout(completeTimerRef.current); completeTimerRef.current = null; }
    if (initialJumpTimerRef.current) { clearTimeout(initialJumpTimerRef.current); initialJumpTimerRef.current = null; }
  }, []);

  const completeTransition = useCallback((sceneId: SceneId) => {
    if (!loadingTransitionRef.current) {
      pendingEnterSceneRef.current = sceneId;
      return;
    }
    pendingEnterSceneRef.current = null;
    loadingTransitionRef.current = false;

    if (slowTickRef.current) { clearInterval(slowTickRef.current); slowTickRef.current = null; }
    if (initialJumpTimerRef.current) { clearTimeout(initialJumpTimerRef.current); initialJumpTimerRef.current = null; }

    setSceneId(sceneId);
    progressRef.current = 100;
    setProgress(100);
    phaseRef.current = 'complete';
    setPhase('complete');

    completeTimerRef.current = setTimeout(() => {
      phaseRef.current = 'idle';
      setPhase('idle');
      setProgress(0);
      progressRef.current = 0;
    }, COMPLETE_HOLD_MS);
  }, []);

  /* ── Listen for scene:transition (start) — Engine priority so latch is set before performSceneTransition emits scene:enter ── */
  useEffect(() => {
    const unsub = eventBus.on('scene:transition', (payload) => {
      clearTimers();
      loadingTransitionRef.current = true;

      const pendingEnter = pendingEnterSceneRef.current;
      if (pendingEnter) {
        pendingEnterSceneRef.current = null;
        completeTransition(pendingEnter);
        return;
      }

      setSceneId(payload.targetScene);
      phaseRef.current = 'loading';
      setPhase('loading');
      progressRef.current = 0;
      setProgress(0);

      initialJumpTimerRef.current = setTimeout(() => {
        if (!loadingTransitionRef.current) return;
        progressRef.current = INITIAL_JUMP_PCT;
        setProgress(INITIAL_JUMP_PCT);

        slowTickRef.current = setInterval(() => {
          if (!loadingTransitionRef.current) return;
          if (progressRef.current < SLOW_CAP_PCT) {
            const next = Math.min(progressRef.current + SLOW_INCREMENT, SLOW_CAP_PCT);
            progressRef.current = next;
            setProgress(next);
          }
        }, SLOW_TICK_MS);
      }, INITIAL_JUMP_MS);
    }, EventBusPriority.Engine);

    return () => {
      unsub();
      clearTimers();
    };
  }, [clearTimers, completeTransition]);

  /* ── Listen for scene:enter (fires synchronously after scene:transition) ── */
  useEffect(() => {
    const unsub = eventBus.on('scene:enter', (payload) => {
      completeTransition(payload.sceneId);
    });

    return () => {
      unsub();
      if (completeTimerRef.current) { clearTimeout(completeTimerRef.current); completeTimerRef.current = null; }
    };
  }, [completeTransition]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  /* ── Derived values ── */
  const sceneName = sceneId ? (SCENE_CONFIG[sceneId]?.name ?? sceneId) : '';
  const isComplete = phase === 'complete';
  const barColor = isComplete ? EMERALD : CYAN;
  const barGlow = isComplete ? EMERALD_GLOW : CYAN_GLOW;

  /* ── Render ── */
  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          key="scene-transition-progress"
          className="fixed inset-x-0 top-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.HUD + 3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Subtle dark gradient behind the bar */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${BAR_HEIGHT_PX + 28}px`,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)',
            }}
          />

          {/* Hex-grid pattern overlay */}
          <div
            className="absolute inset-x-0 top-0 overflow-hidden"
            style={{ height: `${BAR_HEIGHT_PX + 28}px`, opacity: 0.04 }}
          >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hex-grid-progress" width="12" height="10.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                  <polygon
                    points="6,0 12,3 12,8 6,10.4 0,8 0,3"
                    fill="none"
                    stroke={barColor}
                    strokeWidth="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hex-grid-progress)" />
            </svg>
          </div>

          {/* Progress bar track */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${BAR_HEIGHT_PX}px`,
              background: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            {/* Progress fill with gradient */}
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{
                background: `linear-gradient(90deg, ${CYAN}, ${isComplete ? EMERALD : CYAN}88, ${EMERALD})`,
                boxShadow: `0 0 8px ${barGlow}, 0 0 20px ${barGlow}`,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={
                isComplete
                  ? { duration: 0.3, ease: 'easeOut' }
                  : progress <= INITIAL_JUMP_PCT
                    ? { duration: 0.2, ease: 'easeOut' }
                    : { duration: 0.25, ease: 'linear' }
              }
            >
              {/* Shimmer / sweep animation on the fill */}
              <div
                className="absolute inset-0 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)`,
                    backgroundSize: '250% 100%',
                  }}
                  animate={{ backgroundPosition: ['250% 0', '-250% 0'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {/* Leading edge glow dot */}
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                style={{
                  width: '6px',
                  height: `${BAR_HEIGHT_PX + 4}px`,
                  borderRadius: '50%',
                  background: barColor,
                  boxShadow: `0 0 6px ${barColor}, 0 0 12px ${barGlow}`,
                }}
              />
            </motion.div>
          </div>

          {/* Scene name text below the bar */}
          <AnimatePresence>
            {sceneName && (
              <motion.div
                key={`scene-label-${sceneName}`}
                className="absolute top-1 left-0 inset-x-0 flex items-center px-3"
                style={{ height: '20px' }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <span
                  className="text-[10px] font-mono tracking-wider select-none"
                  style={{
                    color: isComplete ? EMERALD : CYAN,
                    textShadow: `0 0 8px ${barGlow}`,
                  }}
                >
                  {isComplete ? '✓ ' : ''}
                  Загрузка: {sceneName}
                </span>

                {/* Percentage indicator */}
                <span
                  className="ml-auto text-[9px] font-mono tabular-nums select-none"
                  style={{
                    color: isComplete ? EMERALD : CYAN,
                    opacity: 0.7,
                  }}
                >
                  {Math.round(progress)}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete state: emerald pulse effect */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                key="complete-pulse"
                className="absolute inset-x-0 top-0"
                style={{
                  height: `${BAR_HEIGHT_PX}px`,
                  background: EMERALD,
                  boxShadow: `0 0 12px ${EMERALD_GLOW}, 0 0 24px ${EMERALD_GLOW}`,
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
