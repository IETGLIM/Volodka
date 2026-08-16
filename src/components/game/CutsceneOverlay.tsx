
/* ─── Volodka RPG – Cutscene Text Overlay (AAA+ Enhanced) ───
   Full-screen text overlay that fades in/out during cutscenes.
   Renders as an HTML overlay on top of the 3D canvas.
   Shows dramatic Russian text during camera movements.
   Features:
   - Letterbox bars (full/thin/none per cutscene)
   - Ember particles for dramatic moments
   - Type-specific visual styles (act_transition, character_intro, revelation)
   - Skip button (ESC key / click) after 1s delay
   - Scene-reactive accent colors
*/

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase, clearGameplayPhaseFlags } from '@/shared/gamePhase';
import { setCinematicPresentationMode } from '@/engine/camera/cinematicPresentation';
import {
  isCinematicTimelineActive,
  skipCinematicTimeline,
} from '@/engine/cinematic/cinematicTimelineOrchestrator';
import type { CutsceneDef } from '@/data/cutscenes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { sanitizePlainText } from '@/shared/utils/sanitizePlainText';
import { FilmGrain } from '@/components/game/cinematic/FilmGrain';

function finishCutscenePresentation(): void {
  // easeMs: 600 — smooth the hard camera snap that ESC-skip would otherwise
  // produce when the camera hands back from the timeline to the exploration
  // strategy. FollowCamera lerps over 600ms with cubic-bezier(0.4, 0, 0.2, 1).
  setCinematicPresentationMode('third_person', { easeMs: 600 });
  eventBus.emit('camera:recenter', {});
}

// ════════════════════════════════════════════════════════════════
//  EMBER PARTICLES — drifting upward (reused from IntroScreen)
// ════════════════════════════════════════════════════════════════

const seededRand = (seed: number) => {
  const s = Number.isFinite(seed) ? seed : 0;
  const x = Math.sin(s * 9301 + 49297) * 49297;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
};

const CutsceneEmbers = memo(function CutsceneEmbers({ count = 20, accentColor = 'var(--cyber-cyan)' }: { count?: number; accentColor?: string }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => {
    const x = (seededRand(i) * 100).toFixed(2);
    const delay = (seededRand(i + 100) * 8).toFixed(2);
    const duration = (4 + seededRand(i + 200) * 6).toFixed(2);
    const size = (1 + seededRand(i + 300) * 2).toFixed(1);
    const drift = ((seededRand(i + 400) - 0.5) * 30).toFixed(1);
    const opacity = (0.3 + seededRand(i + 500) * 0.5).toFixed(2);
    return { id: i, x, delay, duration, size, drift, opacity };
  }), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-5px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: accentColor,
            boxShadow: `0 0 ${parseFloat(p.size) * 3}px ${accentColor}, 0 0 ${parseFloat(p.size) * 6}px ${accentColor}40`,
            opacity: 0,
            animation: `cinematic-ember ${p.duration}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            '--ember-drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
//  LETTERBOX BARS
// ════════════════════════════════════════════════════════════════

const LETTERBOX_GRADIENT =
  'linear-gradient(180deg, #000 0%, #050810 70%, #0a1420 100%)';

const LetterboxBars = memo(function LetterboxBars({
  style,
  reducedMotion = false,
}: {
  style: 'full' | 'thin' | 'none';
  reducedMotion?: boolean;
}) {
  if (style === 'none') return null;
  const h = style === 'full' ? 'h-[8dvh] min-h-[32px]' : 'h-[4dvh] min-h-[16px]';
  const barStyle: React.CSSProperties = {
    zIndex: 12,
    background: LETTERBOX_GRADIENT,
    boxShadow: 'inset 0 -1px 0 rgba(0, 255, 200, 0.06)',
  };
  const barTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const };
  return (
    <>
      <motion.div
        className={`absolute top-0 left-0 right-0 ${h} pointer-events-none`}
        style={barStyle}
        initial={reducedMotion ? false : { scaleY: 0, transformOrigin: 'top' }}
        animate={{ scaleY: 1 }}
        transition={barTransition}
      />
      <motion.div
        className={`absolute bottom-0 left-0 right-0 ${h} pointer-events-none`}
        style={{
          ...barStyle,
          background: 'linear-gradient(0deg, #000 0%, #050810 70%, #0a1420 100%)',
          boxShadow: 'inset 0 1px 0 rgba(0, 255, 200, 0.06)',
        }}
        initial={reducedMotion ? false : { scaleY: 0, transformOrigin: 'bottom' }}
        animate={{ scaleY: 1 }}
        transition={barTransition}
      />
    </>
  );
});

// ════════════════════════════════════════════════════════════════
//  GLITCH OVERLAY
// ════════════════════════════════════════════════════════════════

const GlitchOverlay = memo(function GlitchOverlay({ intensity = 0.3 }: { intensity?: number }) {
  if (intensity <= 0) return null;
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 11, opacity: intensity }}
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity }}
      transition={{ duration: 0.5 }}
    >
      {/* Scan lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          opacity: 0.5,
        }}
      />
      {/* Random color glitch bars */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          top: '30%',
          height: '2px',
          background: 'rgba(0, 255, 200, 0.4)',
        }}
        animate={{
          top: ['30%', '70%', '20%', '60%', '40%'],
          opacity: [0, 0.8, 0, 0.6, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute left-0 right-0"
        style={{
          top: '60%',
          height: '1px',
          background: 'rgba(255, 0, 100, 0.3)',
        }}
        animate={{
          top: ['60%', '25%', '80%', '45%', '15%'],
          opacity: [0, 0.5, 0, 0.7, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
          delay: 0.5,
        }}
      />
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════
//  TYPE-SPECIFIC TEXT STYLES
// ════════════════════════════════════════════════════════════════

function getTypeStyles(type: CutsceneDef['type'] = 'act_transition') {
  switch (type) {
    case 'character_intro':
      return {
        titleSize: 'text-4xl sm:text-5xl md:text-6xl',
        titleWeight: 'font-light',
        titleTracking: 'tracking-[0.12em]',
        subtitleSize: 'text-sm sm:text-base md:text-lg',
        fadeInDuration: 1.5,
        titleDelay: 0.3,
        subtitleDelay: 0.8,
      };
    case 'revelation':
      return {
        titleSize: 'text-3xl sm:text-5xl md:text-7xl',
        titleWeight: 'font-bold',
        titleTracking: 'tracking-[0.2em]',
        subtitleSize: 'text-sm sm:text-base md:text-lg italic',
        fadeInDuration: 2.0,
        titleDelay: 0.5,
        subtitleDelay: 1.2,
      };
    case 'story_moment':
      return {
        titleSize: 'text-2xl sm:text-3xl md:text-4xl',
        titleWeight: 'font-normal italic',
        titleTracking: 'tracking-[0.05em]',
        subtitleSize: 'text-xs sm:text-sm',
        fadeInDuration: 1.2,
        titleDelay: 0.2,
        subtitleDelay: 0.6,
      };
    case 'act_transition':
    default:
      return {
        titleSize: 'text-5xl sm:text-7xl md:text-8xl',
        titleWeight: 'font-bold',
        titleTracking: 'tracking-[0.3em]',
        subtitleSize: 'text-sm sm:text-base md:text-lg',
        fadeInDuration: 1.8,
        titleDelay: 0.5,
        subtitleDelay: 1.0,
      };
  }
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export function CutsceneOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [active, setActive] = useState(false);
  const [text, setText] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');
  const [accentColor, setAccentColor] = useState('var(--cyber-cyan)');
  const [cutsceneType, setCutsceneType] = useState<CutsceneDef['type']>('act_transition');
  const [letterboxStyle, setLetterboxStyle] = useState<'full' | 'thin' | 'none'>('full');
  const [showEmbers, setShowEmbers] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [fadeInMs, setFadeInMs] = useState(300);
  const [fadeOutMs, setFadeOutMs] = useState(500);
  const [overlayKey, setOverlayKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const skippedRef = useRef(false);
  /**
   * True when the current overlay was emitted by CinematicTimelineRunner.
   * When true, the auto-dismiss timer must NOT clear activeCutsceneId —
   * the timeline manages its own lifecycle (finishIntroWake/finishGenericTimeline).
   * Without this, the overlay's auto-dismiss would kill the 29-second
   * wake-up cinematic after the first phase's ~4s duration.
   */
  const managedByTimelineRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearSkipDelayTimer = useCallback(() => {
    if (skipDelayTimerRef.current !== null) {
      clearTimeout(skipDelayTimerRef.current);
      skipDelayTimerRef.current = null;
    }
  }, []);

  /** Shared skip logic: end the overlay + cutscene state in the store */
  const skipCutscene = useCallback(() => {
    if (skippedRef.current) return; // prevent double-fire

    // If a unified cinematic timeline is driving this overlay (splash
    // timelines managed by CinematicTimelineRunner), defer to the timeline
    // orchestrator's skip path. Otherwise we would dismiss the overlay but
    // the timeline would keep running (camera continues moving with no
    // text), and finishCutscenePresentation() would reset cinematic mode
    // mid-timeline. The orchestrator emits cinematic:timeline_skip →
    // runner.onSkip → completeCinematicTimeline(id, true) which fires
    // cutscene:overlay_end back to this overlay via the complete handler.
    if (managedByTimelineRef.current && isCinematicTimelineActive()) {
      skippedRef.current = true;
      clearTimer();
      clearSkipDelayTimer();
      skipCinematicTimeline();
      return;
    }

    skippedRef.current = true;

    // 1. Cancel the auto-dismiss timer
    clearTimer();
    clearSkipDelayTimer();

    // 2. Hide the overlay immediately
    setActive(false);
    setShowSkip(false);
    setAriaAnnouncement('');

    // 3. End cutscene in the store
    const store = useGameStore.getState();
    if (readGamePhase(store) === 'cutscene') {
      store.setCutscene(null, []);
      clearGameplayPhaseFlags(store);
    }

    // 4. Emit events so camera system & other listeners clean up
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});
    finishCutscenePresentation();
  }, [clearTimer, clearSkipDelayTimer]);

  const motionDuration = (seconds: number) => (reducedMotion ? 0 : seconds);
  const motionDelay = (seconds: number) => (reducedMotion ? 0 : seconds);

  useEffect(() => {
    const unsub = eventBus.on('cutscene:overlay', (payload) => {
      // Cancel any in-progress overlay
      clearTimer();
      clearSkipDelayTimer();

      const displayDurationMs = reducedMotion
        ? Math.min(payload.durationMs, 2_500)
        : payload.durationMs;

      setText(sanitizePlainText(payload.text));
      setSubtitle(payload.subtitle ? sanitizePlainText(payload.subtitle) : '');
      setAccentColor(payload.accentColor);
      setCutsceneType(payload.type ?? 'act_transition');
      setLetterboxStyle(reducedMotion ? 'thin' : (payload.letterboxStyle ?? 'full'));
      setShowEmbers(!reducedMotion && (payload.showEmbers ?? false));
      setGlitchIntensity(reducedMotion ? 0 : (payload.glitchIntensity ?? 0));
      setFadeInMs(payload.fadeInMs ?? 300);
      setFadeOutMs(payload.fadeOutMs ?? 500);
      setOverlayKey((k) => k + 1);
      // Track whether this overlay is managed by a cinematic timeline.
      // If so, the auto-dismiss timer must NOT clear activeCutsceneId.
      managedByTimelineRef.current = payload.managedByTimeline === true;
      setActive(true);
      setShowSkip(true);
      skippedRef.current = false;
      setAriaAnnouncement(
        payload.subtitle
          ? `${sanitizePlainText(payload.text)}. ${sanitizePlainText(payload.subtitle)}`
          : sanitizePlainText(payload.text),
      );

      // Show skip button after a 1-second delay to prevent accidental skips
      if (!reducedMotion) {
        skipDelayTimerRef.current = setTimeout(() => {
          setShowSkip(true);
          skipDelayTimerRef.current = null;
        }, 1000);
      }

      // Auto-dismiss after the specified duration
      timerRef.current = setTimeout(() => {
        setActive(false);
        setShowSkip(false);
        setAriaAnnouncement('');
        eventBus.emit('cutscene:overlay_end', {});

        // End cutscene in the store if we're still in cutscene mode —
        // UNLESS this overlay is managed by a cinematic timeline. The
        // timeline (CinematicTimelineRunner) emits a new overlay for each
        // phase; the timeline itself calls finishIntroWake / finishGenericTimeline
        // when it reaches the end. If we clear activeCutsceneId here for
        // a managed overlay, we kill the entire cinematic after the first phase.
        if (!managedByTimelineRef.current) {
          const store = useGameStore.getState();
          if (readGamePhase(store) === 'cutscene') {
            store.setCutscene(null, []);
            clearGameplayPhaseFlags(store);
          }
          eventBus.emit('camera:cutscene_end', {});
          finishCutscenePresentation();
        }

        timerRef.current = null;
      }, displayDurationMs);
    });

    return () => {
      unsub();
      clearTimer();
      clearSkipDelayTimer();
    };
  }, [clearTimer, clearSkipDelayTimer, reducedMotion]);

  // ESC key listener
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipCutscene();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, skipCutscene]);

  const typeStyles = getTypeStyles(cutsceneType);

  return (
    <>
      <AriaLiveRegion message={ariaAnnouncement} priority="assertive" />
      <AnimatePresence mode="sync">
      {active && (
        <motion.div
          key={`cutscene-overlay-${overlayKey}`}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, transition: { duration: Math.min(fadeOutMs / 1000, 0.2), ease: 'easeInOut' } }}
          transition={{
            duration: reducedMotion ? 0 : fadeInMs / 1000,
            ease: 'easeInOut',
          }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
        >
          {/* Dark vignette background for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: cutsceneType === 'revelation'
                ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 80%)'
                : cutsceneType === 'character_intro'
                ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 80%)'
                : 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 80%)',
            }}
          />

          {/* Letterbox bars */}
          <LetterboxBars style={letterboxStyle} reducedMotion={reducedMotion} />

          {/* Ember particles */}
          {showEmbers && <CutsceneEmbers count={cutsceneType === 'revelation' ? 30 : 15} accentColor={accentColor} />}

          {/* Glitch overlay */}
          <GlitchOverlay intensity={glitchIntensity} />

          {/* Film grain for the most cinematic cutscene types — gives act transitions
              and revelations a filmic texture instead of a flat digital overlay. */}
          {(cutsceneType === 'revelation' || cutsceneType === 'act_transition') && !reducedMotion && (
            <FilmGrain opacity={0.045} zIndex={6} />
          )}

          {/* Atmospheric glow behind text */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: reducedMotion ? 1 : 1.3 }}
            transition={{ duration: motionDuration(2), ease: 'easeOut' }}
          />

          {/* Skip button – bottom-right corner */}
          <AnimatePresence>
            {showSkip && (
              <motion.button
                key="cutscene-skip-btn"
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                transition={{ duration: motionDuration(0.3), ease: 'easeOut' }}
                onClick={skipCutscene}
                onTouchStart={(e) => { e.preventDefault(); skipCutscene(); }}
                className="fixed bottom-6 right-6 z-50 px-5 py-2.5 rounded-lg
                           bg-black/50 backdrop-blur-sm border border-white/10
                           text-white/80 text-sm tracking-wide
                           hover:bg-black/70 hover:text-white hover:border-white/20
                           active:bg-black/80 active:scale-95
                           transition-colors duration-200
                           pointer-events-auto cursor-pointer
                           select-none touch-manipulation"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                Пропустить
              </motion.button>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-4">

            {/* Decorative top line */}
            <motion.div
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: motionDuration(1.5), delay: motionDelay(0.2), ease: 'easeOut' }}
              className="w-20 sm:w-32 h-px origin-center"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
              }}
            />

            {/* Main text */}
            <motion.h1
              initial={reducedMotion ? false : { opacity: 0, y: 20, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: motionDuration(typeStyles.fadeInDuration), delay: motionDelay(typeStyles.titleDelay), ease: 'easeOut' }}
              className={`${typeStyles.titleSize} ${typeStyles.titleWeight} ${typeStyles.titleTracking} text-center px-6`}
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                color: 'rgba(255, 255, 255, 0.95)',
                textShadow: cutsceneType === 'revelation'
                  ? `0 0 60px ${accentColor}80, 0 0 120px ${accentColor}40, 0 2px 10px rgba(0,0,0,0.8)`
                  : cutsceneType === 'character_intro'
                  ? `0 0 30px ${accentColor}50, 0 0 60px ${accentColor}20, 0 2px 10px rgba(0,0,0,0.8)`
                  : `0 0 40px ${accentColor}60, 0 0 80px ${accentColor}30, 0 2px 10px rgba(0,0,0,0.8)`,
              }}
            >
              {text}
            </motion.h1>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionDuration(1.2), delay: motionDelay(typeStyles.subtitleDelay), ease: 'easeOut' }}
                className={`${typeStyles.subtitleSize} tracking-wide text-center px-6 max-w-lg`}
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: cutsceneType === 'character_intro'
                    ? 'rgba(220, 210, 200, 0.7)'
                    : 'rgba(200, 210, 230, 0.6)',
                  textShadow: `0 0 20px ${accentColor}20`,
                  // Accessibility: scale subtitle with the --subtitle-scale CSS var
                  // set by AccessibilityManager on <html> (default 1 = no scaling).
                  fontSize: 'calc(1rem * var(--subtitle-scale, 1))',
                }}
              >
                {subtitle}
              </motion.p>
            )}

            {/* Decorative bottom line */}
            <motion.div
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: motionDuration(1.5), delay: motionDelay(0.5), ease: 'easeOut' }}
              className="w-12 sm:w-20 h-px origin-center"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
              }}
            />

            {/* Act transition: decorative type label */}
            {cutsceneType === 'act_transition' && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: motionDuration(1), delay: motionDelay(1.5) }}
                className="mt-4"
              >
                <div className="w-8 h-px mx-auto mb-2" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)` }} />
                <p
                  className="text-[10px] tracking-[0.3em] uppercase"
                  style={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    color: `${accentColor}40`,
                  }}
                >
                  volodka rpg
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
