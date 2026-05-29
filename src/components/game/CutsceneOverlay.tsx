'use client';

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
import { getCutsceneReturnMode, type CutsceneDef } from '@/data/cutscenes';

// ════════════════════════════════════════════════════════════════
//  EMBER PARTICLES — drifting upward (reused from IntroScreen)
// ════════════════════════════════════════════════════════════════

const seededRand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

const CutsceneEmbers = memo(function CutsceneEmbers({ count = 20, accentColor = '#22d3ee' }: { count?: number; accentColor?: string }) {
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

const LetterboxBars = memo(function LetterboxBars({ style }: { style: 'full' | 'thin' | 'none' }) {
  if (style === 'none') return null;
  const h = style === 'full' ? 'h-[8dvh] min-h-[32px]' : 'h-[4dvh] min-h-[16px]';
  return (
    <>
      <motion.div
        className={`absolute top-0 left-0 right-0 ${h} bg-black pointer-events-none`}
        style={{ zIndex: 12 }}
        initial={{ scaleY: 0, transformOrigin: 'top' }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.div
        className={`absolute bottom-0 left-0 right-0 ${h} bg-black pointer-events-none`}
        style={{ zIndex: 12 }}
        initial={{ scaleY: 0, transformOrigin: 'bottom' }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
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
  const [active, setActive] = useState(false);
  const [text, setText] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [accentColor, setAccentColor] = useState('#22d3ee');
  const [cutsceneType, setCutsceneType] = useState<CutsceneDef['type']>('act_transition');
  const [letterboxStyle, setLetterboxStyle] = useState<'full' | 'thin' | 'none'>('full');
  const [showEmbers, setShowEmbers] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const skippedRef = useRef(false);

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
    skippedRef.current = true;

    // 1. Cancel the auto-dismiss timer
    clearTimer();
    clearSkipDelayTimer();

    // 2. Hide the overlay immediately
    setActive(false);
    setShowSkip(false);

    // 3. End cutscene in the store
    const store = useGameStore.getState();
    if (store.mode === 'cutscene') {
      const returnMode = getCutsceneReturnMode(cutsceneType);
      store.setCutscene(null, []);
      store.setMode(returnMode);
      if (returnMode === 'visual-novel') {
        store.setShowStoryOverlay(true);
      }
    }

    // 4. Emit events so camera system & other listeners clean up
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});
  }, [clearTimer, clearSkipDelayTimer, cutsceneType]);

  useEffect(() => {
    const unsub = eventBus.on('cutscene:overlay', (payload) => {
      // Cancel any in-progress overlay
      clearTimer();
      clearSkipDelayTimer();

      setText(payload.text);
      setSubtitle(payload.subtitle ?? '');
      setAccentColor(payload.accentColor);
      setCutsceneType(payload.type ?? 'act_transition');
      setLetterboxStyle(payload.letterboxStyle ?? 'full');
      setShowEmbers(payload.showEmbers ?? false);
      setGlitchIntensity(payload.glitchIntensity ?? 0);
      setActive(true);
      setShowSkip(false);
      skippedRef.current = false;

      // Show skip button after a 1-second delay to prevent accidental skips
      skipDelayTimerRef.current = setTimeout(() => {
        setShowSkip(true);
        skipDelayTimerRef.current = null;
      }, 1000);

      // Auto-dismiss after the specified duration
      timerRef.current = setTimeout(() => {
        setActive(false);
        setShowSkip(false);
        eventBus.emit('cutscene:overlay_end', {});

        // End cutscene in the store if we're still in cutscene mode
        const store = useGameStore.getState();
        if (store.mode === 'cutscene') {
          store.setCutscene(null, []);
          store.setMode('exploration');
        }
        eventBus.emit('camera:cutscene_end', {});

        timerRef.current = null;
      }, payload.durationMs);
    });

    return () => {
      unsub();
      clearTimer();
      clearSkipDelayTimer();
    };
  }, [clearTimer, clearSkipDelayTimer]);

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
    <AnimatePresence>
      {active && (
        <motion.div
          key="cutscene-text-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: UI_LAYERS.DIALOGUE }}
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
          <LetterboxBars style={letterboxStyle} />

          {/* Ember particles */}
          {showEmbers && <CutsceneEmbers count={cutsceneType === 'revelation' ? 30 : 15} accentColor={accentColor} />}

          {/* Glitch overlay */}
          <GlitchOverlay intensity={glitchIntensity} />

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
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />

          {/* Skip button – bottom-right corner */}
          <AnimatePresence>
            {showSkip && (
              <motion.button
                key="cutscene-skip-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={skipCutscene}
                className="fixed bottom-6 right-6 z-50 px-5 py-2.5 rounded-lg
                           bg-black/50 backdrop-blur-sm border border-white/10
                           text-white/80 text-sm tracking-wide
                           hover:bg-black/70 hover:text-white hover:border-white/20
                           active:bg-black/80 active:scale-95
                           transition-colors duration-200
                           pointer-events-auto cursor-pointer
                           select-none"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                Пропустить (ESC)
              </motion.button>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-4">

            {/* Decorative top line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
              className="w-20 sm:w-32 h-px origin-center"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
              }}
            />

            {/* Main text */}
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: typeStyles.fadeInDuration, delay: typeStyles.titleDelay, ease: 'easeOut' }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: typeStyles.subtitleDelay, ease: 'easeOut' }}
                className={`${typeStyles.subtitleSize} tracking-wide text-center px-6 max-w-lg`}
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: cutsceneType === 'character_intro'
                    ? 'rgba(220, 210, 200, 0.7)'
                    : 'rgba(200, 210, 230, 0.6)',
                  textShadow: `0 0 20px ${accentColor}20`,
                }}
              >
                {subtitle}
              </motion.p>
            )}

            {/* Decorative bottom line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
              className="w-12 sm:w-20 h-px origin-center"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
              }}
            />

            {/* Act transition: decorative type label */}
            {cutsceneType === 'act_transition' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
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
  );
}
