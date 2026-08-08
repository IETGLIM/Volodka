
/* ─── Volodka RPG – Scene Transition Overlay (Enhanced v3) ───
 *  Cyberpunk cinematic transition effect when the player moves between scenes.
 *  Supports 10 transition styles:
 *
 *  - 'wipe'         (default): Glitch → Wipe-in → Hold → Wipe-out
 *  - 'flash'        (indoor→outdoor): Bright flash → Wipe
 *  - 'darken'       (outdoor→indoor): Slow darkening → Reveal
 *  - 'ripple'       (dream→reality): Circular ripple expansion
 *  - 'dissolve':     Blur dissolve with noise overlay
 *  - 'film_burn':    Red-orange overlay with noise that burns in/out
 *  - 'glitch_cut':   Brief horizontal slice displacement + color channel split
 *  - 'breathe':      Smooth scale from 0.98 to 1.02 with opacity fade
 *  - 'breathe_zoom': Slow zoom with breathing opacity pulse (NewTransitionEffect)
 *  - 'data_stream':  Matrix-style data cascade effect (NewTransitionEffect)
 *
 *  Each transition type uses the scene name display during hold phase.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { SCENE_OVERLAY_MS } from '@/shared/constants/transitionTimings';
import { SCENE_CONFIG } from '@/config/scenes';
import { useSceneTransitionOverlayController } from '@/hooks/useSceneTransitionOverlayController';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getSceneTransitionAccent } from '@/engine/exploration/explorationUxPresentation';
import { CinematicShell, CinematicTitleCard } from '@/components/game/cinematic';
import { NewTransitionEffect } from './SceneTransitionNewEffects';

const GLITCH_DURATION = SCENE_OVERLAY_MS.GLITCH;
const FLASH_DURATION = SCENE_OVERLAY_MS.FLASH;
const DARKEN_DURATION = SCENE_OVERLAY_MS.DARKEN;
const RIPPLE_DURATION = SCENE_OVERLAY_MS.RIPPLE;
const DISSOLVE_DURATION = SCENE_OVERLAY_MS.DISSOLVE;
const FILM_BURN_DURATION = SCENE_OVERLAY_MS.FILM_BURN;
const GLITCH_CUT_DURATION = SCENE_OVERLAY_MS.GLITCH_CUT;
const BREATHE_DURATION = SCENE_OVERLAY_MS.BREATHE;
const BREATHE_ZOOM_DURATION = SCENE_OVERLAY_MS.BREATHE_ZOOM;
const DATA_STREAM_DURATION = SCENE_OVERLAY_MS.DATA_STREAM;
const CROSSFADE_DURATION = SCENE_OVERLAY_MS.CROSSFADE;
const WIPE_IN_DURATION = SCENE_OVERLAY_MS.WIPE_IN;
const WIPE_OUT_DURATION = SCENE_OVERLAY_MS.WIPE_OUT;
const REVEAL_DURATION = SCENE_OVERLAY_MS.REVEAL;

/* ─── Diagonal offset for the wipe edge ─── */
const DIAGONAL_OFFSET = 3;

/* ─── Shared easing curves ─── */
const WIPE_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const SMOOTH_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function SceneTransitionOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const { overlayPhase: phase, transitionStyle, targetSceneId, isActive } =
    useSceneTransitionOverlayController();
  const [glitchOffset, setGlitchOffset] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'glitch' || reducedMotion) {
      setGlitchOffset(0);
      return undefined;
    }

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
  }, [phase, reducedMotion]);

  const sceneName = SCENE_CONFIG[targetSceneId]?.name ?? targetSceneId;
  const accent = getSceneTransitionAccent(transitionStyle ?? 'wipe');
  const _motionDuration = (ms: number) => (reducedMotion ? 0 : ms / 1000);
  void _motionDuration;
  const transitionPresentation = {
    type: 'story_moment' as const,
    accentColor: accent,
    letterboxStyle: 'full' as const,
    showEmbers: false,
    glitchIntensity: 0.06,
  };

  const SceneNameDisplay = (
    <div className="absolute inset-0 flex items-center justify-center">
      <CinematicShell presentation={transitionPresentation} backdropVariant="transition">
        <CinematicTitleCard
          title={sceneName}
          subtitle="переход"
          accentColor={accent}
          reducedMotion={reducedMotion}
          size="location"
        />
      </CinematicShell>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="scene-transition-overlay"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
          data-testid="scene-transition-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }}
        >
        <AnimatePresence mode="sync">
          {/* Black backdrop during hold/reveal/wipe-out phases */}
          {(phase === 'hold' || phase === 'wipe-out' || phase === 'reveal') && (
            <motion.div
              key="backdrop"
              className="absolute inset-0 bg-black"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════
              WIPE STYLE: Glitch Phase
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'glitch' && (
            <motion.div
              key="glitch"
              className="absolute inset-0 overflow-hidden"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
              {reducedMotion ? (
                <motion.div
                  className="absolute inset-0 bg-black/90"
                  initial={false}
                  animate={{ opacity: 1 }}
                />
              ) : (
                <>
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
                </>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              FLASH STYLE: Bright white flash for indoor→outdoor
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'flash' && (
            <motion.div
              key="flash"
              className="absolute inset-0"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              DARKEN STYLE: Slow darkening for outdoor→indoor
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'darken' && (
            <motion.div
              key="darken"
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
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
              key="ripple-in"
              className="absolute inset-0 bg-black"
              initial={{ clipPath: 'circle(0% at 50% 50%)' }}
              animate={{ clipPath: 'circle(75% at 50% 50%)' }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
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
              key="dissolve-in"
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
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
              FILM_BURN STYLE: Red-orange overlay with noise burn
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'film-burn-in' && (
            <motion.div
              key="film-burn-in"
              className="absolute inset-0"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
              {/* Base red-orange burn gradient that intensifies from bottom-right */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 85% 90%, rgba(255,80,0,0.85) 0%, rgba(200,50,0,0.6) 30%, rgba(100,20,0,0.8) 60%, rgba(0,0,0,0.95) 100%)`,
                  filter: 'contrast(1.3) saturate(1.4)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 1] }}
                transition={{ duration: FILM_BURN_DURATION / 1000, ease: 'easeIn' }}
              />
              {/* Film grain noise overlay — randomized horizontal bands */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(255,120,40,0.04) 1px, rgba(255,120,40,0.04) 2px)',
                  mixBlendMode: 'screen',
                }}
                animate={{ opacity: [0, 0.8, 0.5] }}
                transition={{ duration: FILM_BURN_DURATION / 1000 }}
              />
              {/* Bright orange flash at burn origin */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 85% 90%, rgba(255,200,50,0.4) 0%, transparent 40%)`,
                  filter: 'blur(10px)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0.4] }}
                transition={{ duration: FILM_BURN_DURATION / 1000 }}
              />
              {/* Slight warm color shift on edges */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 15% 10%, rgba(255,150,50,0.15) 0%, transparent 50%)`,
                }}
                animate={{ opacity: [0, 0.6, 0.2] }}
                transition={{ duration: FILM_BURN_DURATION / 1000, delay: 0.05 }}
              />
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              GLITCH_CUT STYLE: Horizontal slice displacement + RGB split
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'glitch-cut-in' && (
            <motion.div
              key="glitch-cut-in"
              className="absolute inset-0 overflow-hidden"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
              {/* Red channel slice — shifted up */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'rgba(255, 0, 50, 0.35)',
                  mixBlendMode: 'screen',
                  clipPath: 'inset(20% 0% 40% 0%)',
                }}
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: [0, 25, -15, 20, 0], opacity: [0, 1, 0.8, 1, 0] }}
                transition={{ duration: GLITCH_CUT_DURATION / 1000, ease: 'easeOut' }}
              />
              {/* Blue channel slice — shifted down */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'rgba(0, 80, 255, 0.3)',
                  mixBlendMode: 'screen',
                  clipPath: 'inset(55% 0% 15% 0%)',
                }}
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: [0, -20, 30, -10, 0], opacity: [0, 1, 0.7, 1, 0] }}
                transition={{ duration: GLITCH_CUT_DURATION / 1000, ease: 'easeOut' }}
              />
              {/* Green channel slice — middle band */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'rgba(0, 255, 80, 0.2)',
                  mixBlendMode: 'screen',
                  clipPath: 'inset(38% 0% 42% 0%)',
                }}
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: [0, 15, -25, 10, 0], opacity: [0, 0.8, 1, 0.6, 0] }}
                transition={{ duration: GLITCH_CUT_DURATION / 1000, ease: 'easeOut' }}
              />
              {/* Thin white scan line that sweeps */}
              <motion.div
                className="absolute left-0 right-0"
                style={{ height: '3px', background: accent, boxShadow: `0 0 20px 6px ${accent}80` }}
                initial={{ y: '20%', opacity: 1 }}
                animate={{ y: ['20%', '45%', '70%', '80%'], opacity: [1, 0.8, 0.6, 0] }}
                transition={{ duration: GLITCH_CUT_DURATION / 1000, ease: 'linear' }}
              />
              {/* Quick full-screen flash */}
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0.15 }}
                animate={{ opacity: 0 }}
                transition={{ duration: GLITCH_CUT_DURATION / 1000 * 0.4 }}
              />
              {/* Horizontal displacement bars */}
              {[0.12, 0.35, 0.62, 0.78].map((y, i) => (
                <motion.div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${y * 100}%`,
                    height: `${2 + i}px`,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.08)' : accent,
                    transform: `translateX(${(i % 3 - 1) * 12}px)`,
                  }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 0.6, 0], scaleX: [0, 1, 0.8] }}
                  transition={{
                    duration: GLITCH_CUT_DURATION / 1000,
                    delay: i * 0.03,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              BREATHE STYLE: Smooth scale 0.98→1.02 with opacity fade
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'breathe-in' && (
            <motion.div
              key="breathe-in"
              className="absolute inset-0 overflow-hidden"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
              {/* Full-screen overlay that scales + fades */}
              <motion.div
                className="absolute inset-0 bg-black"
                style={{ transformOrigin: 'center center' }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: [0, 0.4, 0.8, 1], scale: [0.98, 1.0, 1.01, 1.02] }}
                transition={{
                  duration: BREATHE_DURATION / 1000,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Soft radial vignette that pulses with the breathe */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at center, ${accent}10 0%, transparent 60%, rgba(0,0,0,0.3) 100%)`,
                  }}
                  animate={{
                    opacity: [0, 0.5, 0.8, 0.6],
                    scale: [1.05, 1.0, 0.98, 0.97],
                  }}
                  transition={{
                    duration: BREATHE_DURATION / 1000,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                {/* Gentle light ring */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    className="rounded-full"
                    style={{
                      width: '60vw',
                      height: '60vw',
                      border: `1px solid ${accent}20`,
                      boxShadow: `0 0 60px 20px ${accent}08`,
                    }}
                    animate={{
                      scale: [0.8, 1.1, 1.3],
                      opacity: [0, 0.4, 0],
                    }}
                    transition={{ duration: BREATHE_DURATION / 1000, ease: 'easeOut' }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              CROSSFADE-IN Phase (smooth, no-cut transition — Session 9)
              A luxurious fade-to-black with a soft accent vignette and gentle
              blur lift. No glitch, no clip-path — the anti-abrupt-cut transition.
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'crossfade-in' && (
            <motion.div
              key="crossfade-in"
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
              transition={{ duration: CROSSFADE_DURATION / 1000, ease: SMOOTH_EASE }}
            >
              {/* Soft accent-colored vignette glow — reads as a graded fade, not a flat cut. */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, ${accent}14 0%, transparent 65%)`,
                  filter: 'blur(2px)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.4] }}
                transition={{ duration: CROSSFADE_DURATION / 1000, ease: 'easeInOut' }}
              />
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              BREATHE-ZOOM — Slow zoom with breathing opacity pulse
              Delegates to SceneTransitionNewEffects component.
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'breathe-zoom-in' && (
            <NewTransitionEffect
              type="breathe_zoom"
              accentColor={accent}
              duration={BREATHE_ZOOM_DURATION / 1000}
              reducedMotion={reducedMotion}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════
              DATA-STREAM — Matrix-style data cascade effect
              Delegates to SceneTransitionNewEffects component.
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'data-stream-in' && (
            <NewTransitionEffect
              type="data_stream"
              accentColor={accent}
              duration={DATA_STREAM_DURATION / 1000}
              reducedMotion={reducedMotion}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════
              WIPE-IN Phase (original wipe style only)
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'wipe-in' && (
            <motion.div
              key="wipe-in"
              className="absolute inset-0"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              HOLD Phase: Black screen with scene name
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'hold' && (
            <motion.div
              key="hold"
              className="absolute inset-0 bg-black"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,255,255,0.015) 1px, rgba(0,255,255,0.015) 2px)' }} />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.95) 80%)' }} />
              {SceneNameDisplay}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              WIPE-OUT Phase (original wipe style)
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'wipe-out' && (
            <motion.div
              key="wipe-out"
              className="absolute inset-0"
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
            >
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              REVEAL Phase (for flash/darken/ripple/dissolve/film_burn/glitch_cut/breathe)
              Smooth fade-out revealing the new scene
              ═══════════════════════════════════════════════════════════ */}
          {phase === 'reveal' && (
            <motion.div
              key="reveal"
              className="absolute inset-0 bg-black"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
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
        </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
