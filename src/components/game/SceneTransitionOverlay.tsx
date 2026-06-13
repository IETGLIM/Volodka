
/* ─── Volodka RPG – Scene Transition Overlay (Enhanced v2) ───
 *  Cyberpunk cinematic transition effect when the player moves between scenes.
 *  Supports multiple transition styles based on scene config:
 *
 *  - 'wipe'    (default): Glitch → Wipe-in → Hold → Wipe-out
 *  - 'flash'   (indoor→outdoor): Bright flash → Wipe
 *  - 'darken'  (outdoor→indoor): Slow darkening → Reveal
 *  - 'ripple'  (dream→reality): Circular ripple expansion
 *  - 'dissolve': Blur dissolve with noise overlay
 *
 *  Each transition type uses the scene name display during hold phase.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { SCENE_OVERLAY_MS } from '@/shared/constants/transitionTimings';
import { SCENE_CONFIG } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import type { SceneId, SceneConfig } from '@/shared/types/game';

/* ─── Phase timing (milliseconds) — from shared transitionTimings ─── */
const GLITCH_DURATION = SCENE_OVERLAY_MS.GLITCH;
const FLASH_DURATION = SCENE_OVERLAY_MS.FLASH;
const DARKEN_DURATION = SCENE_OVERLAY_MS.DARKEN;
const RIPPLE_DURATION = SCENE_OVERLAY_MS.RIPPLE;
const DISSOLVE_DURATION = SCENE_OVERLAY_MS.DISSOLVE;
const WIPE_IN_DURATION = SCENE_OVERLAY_MS.WIPE_IN;
const HOLD_DURATION = SCENE_OVERLAY_MS.HOLD;
const WIPE_OUT_DURATION = SCENE_OVERLAY_MS.WIPE_OUT;
const REVEAL_DURATION = SCENE_OVERLAY_MS.REVEAL;

type TransitionPhase = 'idle' | 'glitch' | 'flash' | 'darken' | 'ripple-in' | 'dissolve-in' | 'wipe-in' | 'hold' | 'wipe-out' | 'reveal';

/* ─── Diagonal offset for the wipe edge ─── */
const DIAGONAL_OFFSET = 3;

/* ─── Shared easing curves ─── */
const WIPE_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const SMOOTH_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Get transition style from scene config ─── */
function getTransitionStyle(sceneId: SceneId): SceneConfig['transitionStyle'] {
  return SCENE_CONFIG[sceneId]?.transitionStyle ?? 'wipe';
}

/* ─── Get accent color based on scene type ─── */
function getTransitionAccent(style: SceneConfig['transitionStyle']): string {
  switch (style) {
    case 'flash': return 'rgba(255, 200, 100, 1)';     // warm amber
    case 'darken': return 'rgba(100, 130, 180, 1)';     // muted blue
    case 'ripple': return 'rgba(180, 100, 255, 1)';     // purple/violet
    case 'dissolve': return 'rgba(200, 180, 255, 1)';   // lavender
    default: return 'rgba(0, 255, 255, 1)';             // cyan
  }
}

export function SceneTransitionOverlay() {
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [targetSceneId, setTargetSceneId] = useState<SceneId>('volodka_room');
  const [transitionStyle, setTransitionStyle] = useState<SceneConfig['transitionStyle']>('wipe');
  const [glitchOffset, setGlitchOffset] = useState(0);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const rafRef = useRef<number | null>(null);
  const overlayGenRef = useRef(0);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ── Determine initial phase for each transition style ── */
  const getInitialPhase = useCallback((style: SceneConfig['transitionStyle']): TransitionPhase => {
    switch (style) {
      case 'flash': return 'flash';
      case 'darken': return 'darken';
      case 'ripple': return 'ripple-in';
      case 'dissolve': return 'dissolve-in';
      default: return 'glitch';
    }
  }, []);

  /* ── Schedule full transition sequence ── */
  const scheduleTransition = useCallback((style: SceneConfig['transitionStyle'], sceneId: SceneId, gen: number) => {
    const go = (fn: () => void) => {
      if (gen !== overlayGenRef.current) return;
      fn();
    };

    switch (style) {
      case 'flash': {
        // Flash → Hold → Reveal
        const t1 = setTimeout(() => {
          go(() => {
            setPhase('hold');
            eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });
            const t2 = setTimeout(() => {
              go(() => {
                setPhase('reveal');
                eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });
                const t3 = setTimeout(() => go(() => setPhase('idle')), REVEAL_DURATION);
                timersRef.current.push(t3);
              });
            }, HOLD_DURATION);
            timersRef.current.push(t2);
          });
        }, FLASH_DURATION);
        timersRef.current.push(t1);
        break;
      }
      case 'darken': {
        // Darken → Hold → Reveal
        const t1 = setTimeout(() => {
          go(() => {
            setPhase('hold');
            eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });
            const t2 = setTimeout(() => {
              go(() => {
                setPhase('reveal');
                eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });
                const t3 = setTimeout(() => go(() => setPhase('idle')), REVEAL_DURATION);
                timersRef.current.push(t3);
              });
            }, HOLD_DURATION);
            timersRef.current.push(t2);
          });
        }, DARKEN_DURATION);
        timersRef.current.push(t1);
        break;
      }
      case 'ripple': {
        // Ripple expand → Hold → Reveal
        const t1 = setTimeout(() => {
          go(() => {
            setPhase('hold');
            eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });
            const t2 = setTimeout(() => {
              go(() => {
                setPhase('reveal');
                eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });
                const t3 = setTimeout(() => go(() => setPhase('idle')), REVEAL_DURATION);
                timersRef.current.push(t3);
              });
            }, HOLD_DURATION);
            timersRef.current.push(t2);
          });
        }, RIPPLE_DURATION);
        timersRef.current.push(t1);
        break;
      }
      case 'dissolve': {
        // Dissolve in → Hold → Reveal
        const t1 = setTimeout(() => {
          go(() => {
            setPhase('hold');
            eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });
            const t2 = setTimeout(() => {
              go(() => {
                setPhase('reveal');
                eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });
                const t3 = setTimeout(() => go(() => setPhase('idle')), REVEAL_DURATION);
                timersRef.current.push(t3);
              });
            }, HOLD_DURATION);
            timersRef.current.push(t2);
          });
        }, DISSOLVE_DURATION);
        timersRef.current.push(t1);
        break;
      }
      default: {
        // Original wipe: Glitch → Wipe-in → Hold → Wipe-out
        const t1 = setTimeout(() => {
          go(() => {
            setPhase('wipe-in');
            eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });
            const t2 = setTimeout(() => {
              go(() => {
                setPhase('hold');
                const t3 = setTimeout(() => {
                  go(() => {
                    setPhase('wipe-out');
                    eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });
                    const t4 = setTimeout(() => go(() => setPhase('idle')), WIPE_OUT_DURATION);
                    timersRef.current.push(t4);
                  });
                }, HOLD_DURATION);
                timersRef.current.push(t3);
              });
            }, WIPE_IN_DURATION);
            timersRef.current.push(t2);
          });
        }, GLITCH_DURATION);
        timersRef.current.push(t1);
        break;
      }
    }
  }, []);

  /* ── Glitch jitter animation via requestAnimationFrame ── */
  useEffect(() => {
    if (phase !== 'glitch') return;

    let elapsed = 0;
    const jitter = () => {
      elapsed += 16;
      const decay = Math.max(0, 1 - elapsed / GLITCH_DURATION);
      const offset = (Math.random() - 0.5) * 30 * decay;
      setGlitchOffset(offset);

      if (elapsed < GLITCH_DURATION) {
        rafRef.current = requestAnimationFrame(jitter);
      } else {
        setGlitchOffset(0);
      }
    };
    rafRef.current = requestAnimationFrame(jitter);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  /* ── Watch for scene ID changes and trigger transition ── */
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      const newSceneId = state.exploration.currentSceneId;
      const oldSceneId = prevState.exploration.currentSceneId;

      if (newSceneId !== oldSceneId && oldSceneId !== undefined) {
        overlayGenRef.current += 1;
        const gen = overlayGenRef.current;
        clearTimers();
        setTargetSceneId(newSceneId);

        const style = getTransitionStyle(newSceneId);
        setTransitionStyle(style);

        // Emit camera freeze
        eventBus.emit('camera:cinematic_transition', { phase: 'fadeOut', sceneId: newSceneId });

        // Choose initial phase based on transition style
        const initialPhase = getInitialPhase(style);
        setPhase(initialPhase);

        // Schedule the transition sequence based on style
        scheduleTransition(style, newSceneId, gen);
      }
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [clearTimers, getInitialPhase, scheduleTransition]);

  /* ── Resolve scene display name from config ── */
  const sceneName = SCENE_CONFIG[targetSceneId]?.name ?? targetSceneId;
  const accent = getTransitionAccent(transitionStyle);

  /* ── Determine if overlay is visible ── */
  const isActive = phase !== 'idle';

  /* ── Render scene name display (shared across all transition styles) ── */
  const SceneNameDisplay = (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="w-16 sm:w-24 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
        <motion.h2
          className="text-xl sm:text-2xl md:text-3xl tracking-widest text-center px-6"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(200, 220, 240, 0.85)',
            textShadow: `0 0 20px ${accent}4D, 0 0 40px ${accent}1A`,
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
        >
          {sceneName}
        </motion.h2>
        <motion.div
          className="w-12 sm:w-16 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}4D, transparent)` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="scene-transition-overlay"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }}
        >
          {/* Black backdrop during hold/reveal/wipe-out phases */}
          {(phase === 'hold' || phase === 'wipe-out' || phase === 'reveal') && (
            <div className="absolute inset-0 bg-black" />
          )}

          {/* ═══════════════════════════════════════════════════════════
              WIPE STYLE: Glitch Phase
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'glitch' && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0" style={{ background: 'rgba(255, 0, 0, 0.08)', mixBlendMode: 'screen', transform: `translateX(${glitchOffset * 1.5}px)` }} />
              <div className="absolute inset-0" style={{ background: 'rgba(0, 100, 255, 0.08)', mixBlendMode: 'screen', transform: `translateX(${-glitchOffset * 1.2}px)` }} />
              <div className="absolute inset-0" style={{ background: 'rgba(0, 255, 100, 0.04)', mixBlendMode: 'screen', transform: `translateX(${glitchOffset * 0.7}px)` }} />
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)',
                transform: `translateX(${glitchOffset * 0.5}px) skewX(${glitchOffset * 0.1}deg)`,
              }} />
              <motion.div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.12)' }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.15, ease: 'easeOut' }} />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(transparent 0%, transparent 30%, rgba(0,255,255,0.02) 30%, rgba(0,255,255,0.02) 32%, transparent 32%, transparent 55%, rgba(255,0,100,0.03) 55%, rgba(255,0,100,0.03) 57%, transparent 57%, transparent 78%, rgba(0,100,255,0.02) 78%, rgba(0,100,255,0.02) 80%, transparent 80%)',
                transform: `translateX(${glitchOffset * 2}px)`,
              }} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              FLASH STYLE: Bright white flash for indoor→outdoor
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'flash' && (
            <div className="absolute inset-0">
              {/* White flash overlay with amber tint */}
              <motion.div
                className="absolute inset-0"
                style={{ background: `radial-gradient(ellipse at center, rgba(255,220,150,0.9) 0%, rgba(255,255,255,0.7) 50%, rgba(0,0,0,0.3) 100%)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.8, 1] }}
                transition={{ duration: FLASH_DURATION / 1000, ease: 'easeOut' }}
              />
              {/* Bright horizontal line sweep */}
              <motion.div
                className="absolute left-0 right-0 h-2"
                style={{
                  top: '50%',
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  boxShadow: `0 0 40px 10px ${accent}80`,
                }}
                initial={{ scaleX: 0, opacity: 1 }}
                animate={{ scaleX: 1, opacity: 0.5 }}
                transition={{ duration: FLASH_DURATION / 1000, ease: SMOOTH_EASE }}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              DARKEN STYLE: Slow darkening for outdoor→indoor
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'darken' && (
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DARKEN_DURATION / 1000, ease: 'easeInOut' }}
            >
              {/* Subtle blue vignette */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, rgba(50,60,100,0.15) 0%, rgba(0,0,0,0.8) 80%)',
              }} />
              {/* Scanlines */}
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(100,130,180,0.02) 1px, rgba(100,130,180,0.02) 2px)',
              }} />
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              RIPPLE STYLE: Circular ripple for dream→reality
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'ripple-in' && (
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ clipPath: 'circle(0% at 50% 50%)' }}
              animate={{ clipPath: 'circle(75% at 50% 50%)' }}
              transition={{ duration: RIPPLE_DURATION / 1000, ease: SMOOTH_EASE }}
            >
              {/* Purple glow ring at the edge of the ripple */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="rounded-full"
                  style={{
                    width: '20vw',
                    height: '20vw',
                    border: `2px solid ${accent}`,
                    boxShadow: `0 0 30px ${accent}60, inset 0 0 30px ${accent}30`,
                  }}
                  animate={{
                    width: ['10vw', '80vw'],
                    height: ['10vw', '80vw'],
                    opacity: [1, 0.3],
                  }}
                  transition={{ duration: RIPPLE_DURATION / 1000, ease: SMOOTH_EASE }}
                />
              </div>
              {/* Dream-like distortion lines */}
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(180,100,255,0.015) 4px, rgba(180,100,255,0.015) 8px)',
              }} />
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              DISSOLVE STYLE: Blur dissolve with noise
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'dissolve-in' && (
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DISSOLVE_DURATION / 1000, ease: 'easeInOut' }}
            >
              {/* Blur-like noise overlay */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 30% 40%, rgba(200,180,255,0.08) 0%, transparent 50%),
                    radial-gradient(circle at 70% 60%, rgba(200,180,255,0.06) 0%, transparent 50%)`,
                }}
                animate={{
                  opacity: [0, 0.5, 0],
                }}
                transition={{ duration: DISSOLVE_DURATION / 1000 }}
              />
              {/* Horizontal noise bars */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(200,180,255,0.01) 3px, rgba(200,180,255,0.01) 4px)',
                }}
                animate={{ opacity: [0, 0.8, 0.3] }}
                transition={{ duration: DISSOLVE_DURATION / 1000 }}
              />
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              WIPE-IN Phase (original wipe style only)
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'wipe-in' && (
            <>
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)' }}
                animate={{ clipPath: `polygon(0% 0%, 100% 0%, ${DIAGONAL_OFFSET}% 100%, 0% 100%)` }}
                transition={{ duration: WIPE_IN_DURATION / 1000, ease: WIPE_EASE }}
              />
              <motion.div
                className="absolute top-0 bottom-0"
                style={{ width: '3px', background: `linear-gradient(180deg, ${accent}E6, ${accent}66, ${accent}E6)`, boxShadow: `0 0 15px 4px ${accent}99, 0 0 35px 10px ${accent}33` }}
                initial={{ left: '100%' }}
                animate={{ left: '0%' }}
                transition={{ duration: WIPE_IN_DURATION / 1000, ease: WIPE_EASE }}
              >
                <motion.div className="absolute inset-0" style={{ background: accent, boxShadow: `0 0 20px 8px ${accent}CC` }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.25, repeat: Infinity, ease: 'easeInOut' }} />
              </motion.div>
              <motion.div
                className="absolute top-0 bottom-0"
                style={{ width: '30px', background: `linear-gradient(90deg, ${accent}1F, ${accent}08, transparent)` }}
                initial={{ left: 'calc(100% - 30px)' }}
                animate={{ left: '-30px' }}
                transition={{ duration: WIPE_IN_DURATION / 1000, ease: WIPE_EASE }}
              />
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════
              HOLD Phase: Black screen with scene name
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'hold' && (
            <div className="absolute inset-0 bg-black">
              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,255,255,0.015) 1px, rgba(0,255,255,0.015) 2px)' }} />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.95) 80%)' }} />
              {SceneNameDisplay}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              WIPE-OUT Phase (original wipe style)
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'wipe-out' && (
            <>
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ clipPath: `polygon(0% 0%, 100% 0%, ${100 + DIAGONAL_OFFSET}% 100%, 0% 100%)` }}
                animate={{ clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)' }}
                transition={{ duration: WIPE_OUT_DURATION / 1000, ease: WIPE_EASE }}
              />
              <motion.div
                className="absolute top-0 bottom-0"
                style={{ width: '3px', background: `linear-gradient(180deg, ${accent}E6, ${accent}66, ${accent}E6)`, boxShadow: `0 0 15px 4px ${accent}99, 0 0 35px 10px ${accent}33` }}
                initial={{ left: '0%' }}
                animate={{ left: '100%' }}
                transition={{ duration: WIPE_OUT_DURATION / 1000, ease: WIPE_EASE }}
              >
                <motion.div className="absolute inset-0" style={{ background: accent, boxShadow: `0 0 20px 8px ${accent}CC` }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.25, repeat: Infinity, ease: 'easeInOut' }} />
              </motion.div>
              <motion.div
                className="absolute top-0 bottom-0"
                style={{ width: '30px', background: `linear-gradient(270deg, ${accent}1F, ${accent}08, transparent)` }}
                initial={{ left: '-30px' }}
                animate={{ left: 'calc(100% - 30px)' }}
                transition={{ duration: WIPE_OUT_DURATION / 1000, ease: WIPE_EASE }}
              />
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════
              REVEAL Phase (for flash/darken/ripple/dissolve styles)
              Smooth fade-out revealing the new scene
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'reveal' && (
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: REVEAL_DURATION / 1000, ease: 'easeInOut' }}
            >
              {/* Brief accent-colored edge glow during reveal */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, ${accent}0A 0%, transparent 70%)`,
                }}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: REVEAL_DURATION / 1000 }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
