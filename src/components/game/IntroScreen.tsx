
import { memo, useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef } from 'react';
import { FilmGrain, Vignette, CinematicBars } from '@/components/game/cinematic';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GAME_INTRO_PARAGRAPHS, POEMS } from '@/data/poems';
import type { Poem } from '@/shared/types/game';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus } from '@/engine/EventBus';
import { getSharedAudioContext } from '@/engine/SharedAudioContext';
import { seededRand } from '@/shared/utils/seededRand';

// ════════════════════════════════════════════════════════════════
//  AAA CINEMATIC INTRO — VOLADKA RPG
//  6 Phases: BLACK → PROSE → TITLE → POEM → TRANSITION → WAKING
// ════════════════════════════════════════════════════════════════

// ─── Procedural Ambient Audio via Web Audio API ───

function useCinematicAudio(phase: CinematicPhase) {
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // FIX: Use shared AudioContext instead of creating a separate one.
    // Previously created `new AudioContext()` which violates the singleton
    // pattern and can cause "MaxListenersExceededWarning" / AudioContext
    // limit issues in Chrome (max 6 simultaneous contexts).
    const initAudio = () => {
      if (masterGainRef.current) return;
      try {
        const ctx = getSharedAudioContext();
        if (!ctx) return;
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        masterGainRef.current = master;
      } catch {
        // Audio not available
      }
    };

    const handleInteraction = () => {
      initAudio();
      // SharedAudioContext handles resume internally
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    // Mobile Safari requires touchstart for AudioContext unlock
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      // Cleanup oscillators
      for (const osc of nodesRef.current) {
        try { osc.stop(); } catch { /* ignore */ }
      }
      nodesRef.current = [];
      gainNodesRef.current = [];
      // Don't close the shared AudioContext — it's a singleton
      // Just disconnect our master gain node
      if (masterGainRef.current) {
        try { masterGainRef.current.disconnect(); } catch { /* ignore */ }
        masterGainRef.current = null;
      }
    };
  }, []);

  // Phase-driven ambient sound
  useEffect(() => {
    const ctx = getSharedAudioContext();
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;

    // Stop previous nodes
    for (const osc of nodesRef.current) {
      try { osc.stop(); } catch { /* ignore */ }
    }
    nodesRef.current = [];
    gainNodesRef.current = [];

    // Fade master in
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.35, now + 2);

    if (phase === 'black') {
      // Low sub-bass drone — barely audible, sets tension
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = 40;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.08;
      sub.connect(subGain);
      subGain.connect(master);
      sub.start(now);
      nodesRef.current.push(sub);
      gainNodesRef.current.push(subGain);

      // LFO for subtle pulsing
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      lfoGain.connect(sub.frequency);
      lfo.start(now);
      nodesRef.current.push(lfo);
      gainNodesRef.current.push(lfoGain);
    } else if (phase === 'prose') {
      // Brooding ambient pad — dark minor chord
      const drone1 = ctx.createOscillator();
      drone1.type = 'sawtooth';
      drone1.frequency.value = 55;
      const g1 = ctx.createGain();
      g1.gain.value = 0.03;
      drone1.connect(g1);
      g1.connect(master);
      drone1.start(now);
      nodesRef.current.push(drone1);
      gainNodesRef.current.push(g1);

      // Perfect fifth harmonic
      const drone2 = ctx.createOscillator();
      drone2.type = 'sine';
      drone2.frequency.value = 82.5;
      const g2 = ctx.createGain();
      g2.gain.value = 0.02;
      drone2.connect(g2);
      g2.connect(master);
      drone2.start(now);
      nodesRef.current.push(drone2);
      gainNodesRef.current.push(g2);

      // Minor third for darkness
      const drone3 = ctx.createOscillator();
      drone3.type = 'triangle';
      drone3.frequency.value = 65.5;
      const g3 = ctx.createGain();
      g3.gain.value = 0.015;
      drone3.connect(g3);
      g3.connect(master);
      drone3.start(now);
      nodesRef.current.push(drone3);
      gainNodesRef.current.push(g3);

      // Slow LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(drone1.frequency);
      lfo.start(now);
      nodesRef.current.push(lfo);
      gainNodesRef.current.push(lfoGain);
    } else if (phase === 'title') {
      // Swelling resonance — title reveal
      const pad1 = ctx.createOscillator();
      pad1.type = 'sine';
      pad1.frequency.value = 110;
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.02, now);
      g1.gain.linearRampToValueAtTime(0.06, now + 1.5);
      g1.gain.linearRampToValueAtTime(0.03, now + 3);
      pad1.connect(g1);
      g1.connect(master);
      pad1.start(now);
      nodesRef.current.push(pad1);
      gainNodesRef.current.push(g1);

      // High shimmer
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.value = 440;
      const gShimmer = ctx.createGain();
      gShimmer.gain.setValueAtTime(0, now);
      gShimmer.gain.linearRampToValueAtTime(0.015, now + 2);
      gShimmer.gain.linearRampToValueAtTime(0.005, now + 3.5);
      shimmer.connect(gShimmer);
      gShimmer.connect(master);
      shimmer.start(now);
      nodesRef.current.push(shimmer);
      gainNodesRef.current.push(gShimmer);
    } else if (phase === 'poem') {
      // Ethereal pad — slightly warmer
      const pad1 = ctx.createOscillator();
      pad1.type = 'sine';
      pad1.frequency.value = 73.4; // D2
      const g1 = ctx.createGain();
      g1.gain.value = 0.035;
      pad1.connect(g1);
      g1.connect(master);
      pad1.start(now);
      nodesRef.current.push(pad1);
      gainNodesRef.current.push(g1);

      const pad2 = ctx.createOscillator();
      pad2.type = 'triangle';
      pad2.frequency.value = 110; // A2
      const g2 = ctx.createGain();
      g2.gain.value = 0.02;
      pad2.connect(g2);
      g2.connect(master);
      pad2.start(now);
      nodesRef.current.push(pad2);
      gainNodesRef.current.push(g2);

      // Slow LFO for breathing effect
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(pad1.frequency);
      lfo.start(now);
      nodesRef.current.push(lfo);
      gainNodesRef.current.push(lfoGain);
    } else if (phase === 'transition') {
      // Fade out
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 2);
    } else if (phase === 'waking') {
      // Gentle awakening — soft ascending pad with warmth
      const pad1 = ctx.createOscillator();
      pad1.type = 'sine';
      pad1.frequency.value = 146.8; // D3 — gentle, warm
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(0.04, now + 2);
      g1.gain.linearRampToValueAtTime(0.02, now + 4);
      pad1.connect(g1);
      g1.connect(master);
      pad1.start(now);
      nodesRef.current.push(pad1);
      gainNodesRef.current.push(g1);

      // Breathing LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(pad1.frequency);
      lfo.start(now);
      nodesRef.current.push(lfo);
      gainNodesRef.current.push(lfoGain);

      // Subtle shimmer for awareness
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.value = 440;
      const gShimmer = ctx.createGain();
      gShimmer.gain.setValueAtTime(0, now);
      gShimmer.gain.linearRampToValueAtTime(0.008, now + 1.5);
      gShimmer.gain.linearRampToValueAtTime(0.003, now + 4);
      shimmer.connect(gShimmer);
      gShimmer.connect(master);
      shimmer.start(now);
      nodesRef.current.push(shimmer);
      gainNodesRef.current.push(gShimmer);

      // Slowly fade master
      master.gain.setValueAtTime(0.15, now);
      master.gain.linearRampToValueAtTime(0.25, now + 2);
      master.gain.linearRampToValueAtTime(0.1, now + 4);
    }
  }, [phase]);
}

// Film grain / vignette / bars — shared @/components/game/cinematic

const EmberParticles = memo(function EmberParticles({ count = 30, intensity = 1 }: { count?: number; intensity?: number }) {
  // All style values are pre-formatted as strings with explicit units and rounded precision
  // to avoid hydration mismatch (React SSR truncates numeric CSS values differently than client DOM).
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => {
    const x = (seededRand(i) * 100).toFixed(2);
    const delay = (seededRand(i + 100) * 10).toFixed(2);
    const duration = (5 + seededRand(i + 200) * 8).toFixed(2);
    const size = (1 + seededRand(i + 300) * 2.5).toFixed(1);
    const drift = ((seededRand(i + 400) - 0.5) * 40).toFixed(1);
    const glow1 = (parseFloat(size) * 4).toFixed(1);
    const glow2 = (parseFloat(size) * 8).toFixed(1);
    const color = i % 7 === 0
      ? 'rgba(0, 200, 220, 0.6)'
      : i % 5 === 0
      ? 'rgba(255, 200, 80, 0.7)'
      : i % 3 === 0
      ? 'rgba(255, 140, 50, 0.6)'
      : 'rgba(255, 100, 30, 0.5)';
    return { id: i, x, delay, duration, size, drift, glow1, glow2, color };
  }), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[15]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-5px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.glow1}px ${p.color}, 0 0 ${p.glow2}px ${p.color}`,
            opacity: 0,
            animation: `cinematic-ember ${p.duration}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            '--ember-drift': `${p.drift}px`,
            transform: `scale(${intensity})`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

// SKIP BUTTON — minimal, cinematic

interface SkipButtonProps {
  onSkip: () => void;
}

const SkipButton = memo(function SkipButton({ onSkip }: SkipButtonProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
      onClick={onSkip}
      onTouchStart={(e) => { e.preventDefault(); onSkip(); }}
      className="fixed top-8 right-8 z-[70] px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase
                 text-white/30 hover:text-white/70 border border-white/10 hover:border-white/30
                 bg-black/40 backdrop-blur-sm rounded transition-all duration-300
                 touch-manipulation select-none active:bg-white/10 active:scale-95"
      aria-label="Пропустить вступление"
    >
      Пропустить ▸▸
    </motion.button>
  );
});

// ════════════════════════════════════════════════════════════════
//  TYPEWRITER HOOK — variable speed (faster punctuation, slower at line breaks)
// ════════════════════════════════════════════════════════════════

function useTypewriter(
  text: string,
  baseSpeed: number,
  enabled: boolean,
  onComplete?: () => void,
) {
  const [charIndex, setCharIndex] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!enabled || charIndex >= text.length) return;

    const char = text[charIndex];
    let delay = baseSpeed;

    if (char === '.' || char === '!' || char === '?') {
      delay = baseSpeed * 6;
    } else if (char === ',') {
      delay = baseSpeed * 3;
    } else if (char === '—' || char === '–') {
      delay = baseSpeed * 4;
    } else if (char === ' ' || char === '\n') {
      delay = baseSpeed * 0.5;
    } else if (char === ':' || char === ';') {
      delay = baseSpeed * 3.5;
    } else {
      delay = baseSpeed * (0.7 + Math.random() * 0.6);
    }

    const timer = setTimeout(() => {
      setCharIndex((c) => c + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [charIndex, text, baseSpeed, enabled]);

  useEffect(() => {
    if (enabled && charIndex >= text.length && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [charIndex, text.length, enabled, onComplete]);

  // Reset when text changes
  useEffect(() => {
    const timer = setTimeout(() => { setCharIndex(0); }, 0);
    completedRef.current = false;
    return () => clearTimeout(timer);
  }, [text]);

  return charIndex;
}

// ════════════════════════════════════════════════════════════════
//  PHASE 1: BLACK — Pulsing light dot
// ════════════════════════════════════════════════════════════════

const PhaseBlack = memo(function PhaseBlack() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Pulsing light dot */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 0.3, 0.6, 1.2, 2, 3],
          opacity: [0, 0.3, 0.5, 0.7, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          ease: 'easeOut',
        }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.4) 40%, transparent 70%)',
            boxShadow: '0 0 20px rgba(200,220,255,0.5), 0 0 60px rgba(200,220,255,0.2), 0 0 120px rgba(150,180,255,0.1)',
          }}
        />
      </motion.div>

      {/* Outer glow pulse */}
      <motion.div
        className="absolute"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(150,180,255,0.1) 0%, transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
//  PHASE 2: CINEMATIC PROSE — styled paragraph-by-paragraph reveal
//  Each paragraph has its own style: greeting, default, emphasis, love
// ════════════════════════════════════════════════════════════════

type ProseStyle = 'greeting' | 'default' | 'emphasis' | 'spacer' | 'love';

/** Get visual style props for a paragraph based on its style type */
function getProseStyleProps(style: ProseStyle): {
  textColor: string;
  textShadow: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing: string;
  glowColor: string;
  extraClasses: string;
} {
  switch (style) {
    case 'greeting':
      return {
        textColor: 'rgba(200, 220, 255, 0.95)',
        textShadow: '0 0 30px rgba(150, 180, 255, 0.3), 0 0 60px rgba(100, 130, 200, 0.15)',
        fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
        fontSize: 'text-2xl sm:text-3xl md:text-4xl',
        fontWeight: 'font-light',
        letterSpacing: 'tracking-[0.08em]',
        glowColor: 'rgba(150, 180, 255, 0.12)',
        extraClasses: 'text-center',
      };
    case 'emphasis':
      return {
        textColor: 'rgba(255, 220, 160, 0.95)',
        textShadow: '0 0 25px rgba(255, 180, 80, 0.2), 0 0 50px rgba(255, 150, 50, 0.08)',
        fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
        fontSize: 'text-base sm:text-lg md:text-xl',
        fontWeight: 'font-normal',
        letterSpacing: 'tracking-[0.02em]',
        glowColor: 'rgba(255, 180, 80, 0.08)',
        extraClasses: '',
      };
    case 'love':
      return {
        textColor: 'rgba(255, 180, 200, 0.9)',
        textShadow: '0 0 25px rgba(255, 120, 160, 0.25), 0 0 50px rgba(255, 100, 140, 0.1)',
        fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
        fontSize: 'text-base sm:text-lg md:text-xl',
        fontWeight: 'font-normal italic',
        letterSpacing: 'tracking-[0.03em]',
        glowColor: 'rgba(255, 120, 160, 0.08)',
        extraClasses: 'text-center',
      };
    case 'spacer':
      return {
        textColor: '',
        textShadow: '',
        fontFamily: '',
        fontSize: '',
        fontWeight: '',
        letterSpacing: '',
        glowColor: '',
        extraClasses: '',
      };
    default: // 'default'
      return {
        textColor: 'rgba(200, 210, 230, 0.85)',
        textShadow: '0 0 20px rgba(150, 180, 255, 0.08)',
        fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
        fontSize: 'text-base sm:text-lg md:text-xl',
        fontWeight: 'font-normal',
        letterSpacing: 'tracking-[0.01em]',
        glowColor: 'rgba(150, 180, 255, 0.06)',
        extraClasses: '',
      };
  }
}

interface PhaseProseProps {
  onComplete: () => void;
  reduceMotion: boolean;
}

const PhaseProse = memo(function PhaseProse({ onComplete, reduceMotion }: PhaseProseProps) {
  const paragraphs = GAME_INTRO_PARAGRAPHS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedParagraphs, setRevealedParagraphs] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentParagraph = paragraphs[currentIndex] ?? null;
  const currentText = currentParagraph?.text ?? '';
  const currentStyle = currentParagraph?.style ?? 'default';

  const charIndex = useTypewriter(
    currentText,
    reduceMotion ? 8 : currentStyle === 'greeting' ? 50 : 25,
    currentIndex < paragraphs.length,
    useCallback(() => {
      // Dwell time depends on style
      let dwell = 600;
      if (currentStyle === 'greeting') dwell = 1800;
      else if (currentStyle === 'spacer') dwell = 300;
      else if (currentStyle === 'emphasis') dwell = 1400;
      else if (currentStyle === 'love') dwell = 1200;
      else dwell = Math.max(600, Math.min(1400, currentText.length * 18));

      setTimeout(() => {
        setRevealedParagraphs((prev) => [...prev, currentIndex]);
        setCurrentIndex((c) => c + 1);
      }, dwell);
    }, [currentText, currentStyle, currentIndex]),
  );

  // Auto-scroll
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [revealedParagraphs, charIndex]);

  // When all paragraphs done
  useEffect(() => {
    if (currentIndex >= paragraphs.length && revealedParagraphs.length >= paragraphs.length) {
      const timer = setTimeout(onComplete, 1800);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, paragraphs.length, revealedParagraphs.length, onComplete]);

  return (
    <motion.div
      className="relative z-[35] w-full max-w-2xl mx-auto px-4 sm:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1.2 }}
    >
      <div
        ref={scrollRef}
        className="max-h-[65dvh] overflow-y-auto custom-scrollbar py-4 space-y-0"
      >
        {/* Already revealed paragraphs */}
        {revealedParagraphs.map((idx) => {
          const para = paragraphs[idx];
          if (!para) return null;
          if (para.style === 'spacer') {
            return (
              <motion.div
                key={`prose-spacer-${idx}`}
                className="h-8 sm:h-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            );
          }
          const styleProps = getProseStyleProps(para.style);
          return (
            <motion.div
              key={`prose-line-${idx}`}
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`mb-3 sm:mb-4 ${styleProps.extraClasses}`}
            >
              {/* Soft glow behind the paragraph */}
              <div
                className="absolute inset-0 -z-10 pointer-events-none rounded-lg"
                style={{
                  background: `radial-gradient(ellipse at center, ${styleProps.glowColor} 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                  opacity: 0.6,
                }}
              />
              <p
                className={`${styleProps.fontSize} ${styleProps.fontWeight} ${styleProps.letterSpacing} leading-relaxed`}
                style={{
                  fontFamily: styleProps.fontFamily,
                  color: styleProps.textColor,
                  textShadow: styleProps.textShadow,
                }}
              >
                {para.text}
              </p>
              {/* Decorative divider after love paragraphs */}
              {para.style === 'love' && idx === paragraphs.length - 1 && (
                <motion.div
                  className="mt-4 mx-auto w-24 h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 150, 170, 0.4), rgba(200, 180, 255, 0.3), transparent)',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Currently typing paragraph */}
        {currentIndex < paragraphs.length && currentParagraph && currentStyle !== 'spacer' && (
          <motion.div
            className={`mb-3 sm:mb-4 ${getProseStyleProps(currentStyle).extraClasses}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {(() => {
              const styleProps = getProseStyleProps(currentStyle);
              const visibleText = reduceMotion ? currentText : currentText.slice(0, charIndex);
              return (
                <p
                  className={`${styleProps.fontSize} ${styleProps.fontWeight} ${styleProps.letterSpacing} leading-relaxed`}
                  style={{
                    fontFamily: styleProps.fontFamily,
                    color: styleProps.textColor,
                    textShadow: styleProps.textShadow,
                  }}
                >
                  {visibleText}
                  <span
                    className="inline-block ml-0.5 align-baseline"
                    style={{
                      animation: 'cursor-blink 1s step-end infinite',
                      color: currentStyle === 'emphasis' ? 'rgba(255, 200, 120, 0.8)'
                        : currentStyle === 'love' ? 'rgba(255, 160, 180, 0.8)'
                        : currentStyle === 'greeting' ? 'rgba(200, 220, 255, 0.9)'
                        : 'rgba(200, 220, 255, 0.8)',
                    }}
                  >
                    │
                  </span>
                  {/* Sparkle particles around cursor */}
                  <span className="inline-block relative" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          width: 1.5,
                          height: 1.5,
                          background: currentStyle === 'emphasis' ? 'rgba(255, 200, 120, 0.6)'
                            : currentStyle === 'love' ? 'rgba(255, 160, 180, 0.6)'
                            : 'rgba(200, 220, 255, 0.6)',
                          boxShadow: `0 0 3px ${currentStyle === 'emphasis' ? 'rgba(255,200,120,0.4)' : currentStyle === 'love' ? 'rgba(255,160,180,0.4)' : 'rgba(200,220,255,0.4)'}`,
                          left: `${(i - 1) * 4}px`,
                          top: `${-3 - i * 2}px`,
                          animation: `cinematic-ember ${1.5 + i * 0.5}s ease-out infinite`,
                          animationDelay: `${i * 0.2}s`,
                          opacity: 0.5,
                        }}
                      />
                    ))}
                  </span>
                </p>
              );
            })()}
          </motion.div>
        )}

        {/* Spacer animation */}
        {currentIndex < paragraphs.length && currentStyle === 'spacer' && (
          <motion.div
            className="h-8 sm:h-12"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </div>
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════
//  PHASE 3: TITLE REVEAL — metallic wipe effect
// ════════════════════════════════════════════════════════════════

interface PhaseTitleProps {
  onComplete: () => void;
}

const PhaseTitle = memo(function PhaseTitle({ onComplete }: PhaseTitleProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="relative z-[35] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      {/* Atmospheric glow behind title */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(150, 180, 255, 0.15) 0%, rgba(100, 120, 180, 0.05) 40%, transparent 60%)',
          filter: 'blur(40px)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      {/* Title with metallic reveal wipe */}
      <div className="relative inline-block overflow-hidden">
        {/* The title text */}
        <motion.h1
          className="relative text-7xl sm:text-8xl md:text-9xl font-bold tracking-[0.15em]"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            background: 'linear-gradient(180deg, #e8e8f0 0%, #b0b0c8 25%, #d0d0e0 50%, #9090a8 75%, #c0c0d0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 30px rgba(150, 180, 255, 0.3)) drop-shadow(0 0 60px rgba(100, 130, 200, 0.15))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          ВОЛОДЬКА
        </motion.h1>

        {/* Metallic wipe overlay — sweeps left to right to reveal */}
        <motion.div
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(200, 210, 230, 0.3) 40%, rgba(255, 255, 255, 0.6) 50%, rgba(200, 210, 230, 0.3) 60%, transparent 100%)',
          }}
          initial={{ x: '-110%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />

        {/* Dark mask that wipes away left to right */}
        <motion.div
          className="absolute inset-0 z-20"
          style={{ background: '#000' }}
          initial={{ scaleX: 1, transformOrigin: 'left' }}
          animate={{ scaleX: 0, transformOrigin: 'left' }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        />
      </div>

      {/* Subtitle */}
      <motion.p
        className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg tracking-[0.35em] uppercase"
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          background: 'linear-gradient(90deg, rgba(180,200,240,0.7), rgba(255,200,150,0.5), rgba(180,200,240,0.7))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1.2, ease: 'easeOut' }}
      >
        сказка между сменами
      </motion.p>

      {/* Decorative line */}
      <motion.div
        className="mt-6 sm:mt-8 mx-auto w-32 sm:w-48 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(150, 180, 255, 0.5), rgba(255, 200, 150, 0.3), transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
      />

      {/* Dedication — "Памяти Владимира Лебедева" */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
      >
        <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(210, 195, 180, 0.3), transparent)' }} />
        <p
          className="font-serif text-xs sm:text-sm md:text-base tracking-[0.12em] italic dedication-glow"
          style={{
            fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
            color: 'rgba(210, 195, 180, 0.7)',
            textShadow: '0 0 20px rgba(210, 195, 180, 0.15), 0 0 40px rgba(210, 195, 180, 0.08)',
          }}
        >
          Памяти Владимира Лебедева
        </p>
        <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(210, 195, 180, 0.3), transparent)' }} />
      </motion.div>
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════
//  PHASE 4: POEM — stanza-by-stanza reveal with vignette + glow
// ════════════════════════════════════════════════════════════════

interface PhasePoemProps {
  poem: Poem;
  onComplete: () => void;
  reduceMotion: boolean;
}

const PhasePoem = memo(function PhasePoem({ poem, onComplete, reduceMotion }: PhasePoemProps) {
  // Split poem into stanzas (groups of lines separated by empty strings)
  const stanzas = useMemo(() => {
    const result: string[][] = [];
    let current: string[] = [];
    for (const line of poem.lines) {
      if (line === '') {
        if (current.length > 0) {
          result.push(current);
          current = [];
        }
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) result.push(current);
    return result;
  }, [poem.lines]);

  const [visibleStanzas, setVisibleStanzas] = useState(0);
  const [currentStanzaCharIndex, setCurrentStanzaCharIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleStanzas, currentStanzaCharIndex]);

  // Stanza reveal logic
  useEffect(() => {
    if (visibleStanzas >= stanzas.length) {
      // More time to read the final stanza before transitioning (was 3000ms)
      const timer = setTimeout(onComplete, 6000);
      return () => clearTimeout(timer);
    }

    const currentStanza = stanzas[visibleStanzas];
    if (!currentStanza) return;

    const totalChars = currentStanza.join('\n').length;

    if (reduceMotion) {
      const timer = setTimeout(() => {
        setVisibleStanzas((v) => v + 1);
        setCurrentStanzaCharIndex(0);
      }, 800);
      return () => clearTimeout(timer);
    }

    if (currentStanzaCharIndex < totalChars) {
      // Slower typing for readability: 50ms per char (was 25ms)
      const delay = 50;
      const timer = setTimeout(() => {
        setCurrentStanzaCharIndex((c) => c + 1);
      }, delay);
      return () => clearTimeout(timer);
    }

    // Longer dwell so the reader can absorb each stanza (was 1200ms)
    const timer = setTimeout(() => {
      setVisibleStanzas((v) => v + 1);
      setCurrentStanzaCharIndex(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [visibleStanzas, currentStanzaCharIndex, stanzas, reduceMotion, onComplete]);

  return (
    <motion.div
      className="relative z-[35] w-full max-w-lg mx-auto px-4 sm:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Soft glow behind poem */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(150, 180, 255, 0.08) 0%, transparent 60%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Poem title */}
      <motion.div
        className="text-center mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2
          className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide mb-2"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(200, 215, 245, 0.9)',
            textShadow: '0 0 25px rgba(150, 180, 255, 0.2)',
          }}
        >
          {poem.title}
        </h2>
        <p
          className="text-xs sm:text-sm tracking-[0.2em] uppercase"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(180, 160, 140, 0.6)',
          }}
        >
          — {poem.author}
        </p>
        <div
          className="mt-4 mx-auto w-24 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(150, 180, 255, 0.3), transparent)',
          }}
        />
      </motion.div>

      {/* Poem stanzas */}
      <div
        ref={scrollRef}
        className="max-h-[50dvh] overflow-y-auto custom-scrollbar text-center"
      >
        {stanzas.slice(0, visibleStanzas).map((stanza, si) => (
          <motion.div
            key={`stanza-${si}`}
            initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-6 sm:mb-8"
          >
            {stanza.map((line, li) => (
              <p
                key={`line-${si}-${li}`}
                className="leading-relaxed text-sm sm:text-base md:text-lg italic"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(220, 225, 240, 0.85)',
                  textShadow: '0 0 15px rgba(150, 180, 255, 0.06)',
                }}
              >
                {line}
              </p>
            ))}
          </motion.div>
        ))}

        {/* Currently typing stanza */}
        {visibleStanzas < stanzas.length && stanzas[visibleStanzas] && (
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
          >
            {(() => {
              const stanza = stanzas[visibleStanzas];
              const fullText = stanza.join('\n');
              const visibleText = reduceMotion ? fullText : fullText.slice(0, currentStanzaCharIndex);
              const lines = visibleText.split('\n');

              return lines.map((line, li) => (
                <p
                  key={`typing-${li}`}
                  className="leading-relaxed text-sm sm:text-base md:text-lg italic"
                  style={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    color: 'rgba(230, 235, 250, 0.9)',
                    textShadow: '0 0 15px rgba(150, 180, 255, 0.1)',
                  }}
                >
                  {line}
                  {li === lines.length - 1 && (
                    <span
                      className="inline-block ml-0.5"
                      style={{
                        animation: 'cursor-blink 1s step-end infinite',
                        color: 'rgba(200, 220, 255, 0.8)',
                      }}
                    >
                      │
                    </span>
                  )}
                </p>
              ));
            })()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════
//  PHASE 5: TRANSITION — "Press any key" prompt
// ════════════════════════════════════════════════════════════════

interface PhaseTransitionProps {
  onContinue: () => void;
}

const PhaseTransition = memo(function PhaseTransition({ onContinue }: PhaseTransitionProps) {
  useEffect(() => {
    const handler = () => onContinue();
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, [onContinue]);

  return (
    <motion.div
      className="relative z-[35] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      {/* Cyberpunk teal glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 200, 180, 0.08) 0%, transparent 50%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Decorative em-dash */}
      <motion.div
        className="mb-6 mx-auto w-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 100, 0.4), transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Pulsing prompt */}
      <motion.p
        className="text-sm sm:text-base md:text-lg tracking-[0.2em] uppercase"
        style={{
          fontFamily: '"Courier New", "Consolas", "Monaco", monospace',
          color: 'rgba(0, 255, 100, 0.7)',
          textShadow: '0 0 15px rgba(0, 255, 100, 0.3)',
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        Нажми любую клавишу, чтобы начать
      </motion.p>
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════
//  PHASE 6: WAKING — AAA Cutscene: Volodka wakes up
//  5 Stages over ~10s:
//    1 (0-2s)  Eyes closed — deep black, breathing rhythm, "..."
//    2 (2-4s)  Consciousness stirring — warm light, "Где... я?"
//    3 (4-6s)  Opening eyes — blur clears, "Комната... Снова эта комната."
//    4 (6-8s)  Awareness — screen brightens, "Нужно вставать." + events
//    5 (8-10s) Rising — fade out to reveal 3D scene
// ════════════════════════════════════════════════════════════════

type WakingStage = 1 | 2 | 3 | 4 | 5;

interface PhaseWakingProps {
  onContinue: () => void;
  /** Called at stage 4 when the 3D canvas should become visible behind the overlay.
   *  This switches mode to 'cutscene' so the stand-up animation and camera pull-back
   *  are visible through the fading overlay. */
  onRevealCanvas: () => void;
}

const PhaseWaking = memo(function PhaseWaking({ onContinue, onRevealCanvas }: PhaseWakingProps) {
  const [stage, setStage] = useState<WakingStage>(1);
  const [fadeoutOpacity, setFadeoutOpacity] = useState(1); // 1 = full overlay, 0 = transparent (reveal 3D)

  // Typewriter texts for each stage
  const stageTexts: Record<WakingStage, string> = {
    1: '...',
    2: 'Где... я?',
    3: 'Комната... Снова эта комната.',
    4: 'Нужно вставать.',
    5: '',
  };

  // Typewriter speeds per stage (ms per char) — slower early, faster late
  const stageSpeeds: Record<WakingStage, number> = {
    1: 200,  // very slow for "..."
    2: 90,   // slow — just waking
    3: 55,   // moderate — gaining awareness
    4: 35,   // faster — determination
    5: 0,
  };

  // Typewriter state for current stage text
  const currentText = stage < 5 ? stageTexts[stage] : '';
  const charIndex = useTypewriter(currentText, stageSpeeds[stage], stage < 5);

  const hasEmittedRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  useEffect(() => { onContinueRef.current = onContinue; }, [onContinue]);

  // Stage progression via setTimeout chain
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stage 1 → 2 at 2s
    timers.push(setTimeout(() => setStage(2), 2000));
    // Stage 2 → 3 at 4s
    timers.push(setTimeout(() => setStage(3), 4000));
    // Stage 3 → 4 at 6s
    timers.push(setTimeout(() => setStage(4), 6000));
    // Stage 4 → 5 at 8s
    timers.push(setTimeout(() => setStage(5), 8000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Emit events at stage 4 (when "Нужно вставать" appears)
  // CRITICAL: First make the 3D canvas visible by switching to 'cutscene' mode,
  // THEN emit the stand-up + camera events. Without this, the canvas is hidden
  // during intro mode and the animations happen off-screen — the user never sees
  // Volodka stand up because by the time the canvas becomes visible, the animation
  // has already completed.
  useEffect(() => {
    if (stage >= 4 && !hasEmittedRef.current) {
      hasEmittedRef.current = true;
      // Step 1: Make canvas visible behind the overlay (mode='cutscene')
      onRevealCanvas();
      // Step 2: After a short delay for the canvas to render a frame,
      // trigger the stand-up animation and camera pull-back
      setTimeout(() => {
        eventBus.emit('player:stand_up', {});
        eventBus.emit('camera:intro_wake', {});
      }, 200);
    }
  }, [stage, onRevealCanvas]);

  // Stage 5: fade out the overlay to reveal the 3D scene, then call onContinue
  useEffect(() => {
    if (stage === 5) {
      // Start fading the overlay after a brief moment
      const fadeTimer = setTimeout(() => setFadeoutOpacity(0), 200);
      // Call onContinue after the fade completes (~1.8s transition + 200ms delay)
      const completeTimer = setTimeout(() => onContinueRef.current(), 2200);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [stage]);

  // ── Computed visual values based on stage ──

  // Blur: 8px → 0px across stages (CSS transition handles interpolation)
  const blurValue = stage <= 1 ? 8 : stage === 2 ? 5 : stage === 3 ? 2.5 : 0;

  // Vignette intensity: 0.95 → 0.5
  const vignetteIntensity = stage <= 1 ? 0.95 : stage === 2 ? 0.8 : stage === 3 ? 0.65 : stage === 4 ? 0.5 : 0.3;

  // Cyberpunk teal light opacity (replaces warm amber): 0 → 0.25
  const tealLightOpacity = stage <= 1 ? 0 : stage === 2 ? 0.06 : stage === 3 ? 0.12 : 0.25;

  // Teal light size (radial gradient spread)
  const tealLightSize = stage <= 1 ? 15 : stage === 2 ? 25 : stage === 3 ? 40 : 55;

  // Text opacity based on stage
  const textOpacity = stage <= 1 ? 0.15 : stage === 2 ? 0.5 : stage === 3 ? 0.7 : 0.9;

  // Ember intensity
  const emberIntensity = stage <= 2 ? 0.3 : stage === 3 ? 0.6 : 1;

  return (
    <div
      className="absolute inset-0 z-[35]"
      style={{
        opacity: fadeoutOpacity,
        transition: 'opacity 1.8s ease-out',
      }}
    >
      {/* ── Blur overlay — heavy at start, clears as eyes open ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[42]"
        style={{
          backdropFilter: `blur(${blurValue}px)`,
          WebkitBackdropFilter: `blur(${blurValue}px)`,
          transition: 'backdrop-filter 2s ease-out, -webkit-backdrop-filter 2s ease-out',
        }}
      />

      {/* ── Dynamic vignette — tight at start, opens gradually ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[40]"
        style={{
          background: `radial-gradient(ellipse at center, transparent 10%, rgba(0, 0, 0, ${vignetteIntensity}) 100%)`,
          transition: 'background 2s ease-out',
        }}
      />

      {/* ── Cyberpunk teal light growing from center ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[38]"
        style={{
          background: `radial-gradient(ellipse ${tealLightSize}% ${tealLightSize * 0.7}% at center, rgba(0, 200, 180, ${tealLightOpacity}) 0%, rgba(0, 150, 130, ${tealLightOpacity * 0.4}) 40%, transparent 70%)`,
          transition: 'background 2s ease-out',
        }}
      />

      {/* ── Breathing pulse overlay — subtle scale/opacity sync ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[37]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 200, 180, 0.04) 0%, transparent 50%)',
          animation: 'waking-breathe 4s ease-in-out infinite',
        }}
      />

      {/* ── Ember particles — intensity ramps up with awareness ── */}
      <EmberParticles count={25} intensity={emberIntensity} />

      {/* ── Text overlay — positioned at bottom third ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-[30dvh] z-[45]">
        {/* Stage text with typewriter */}
        {stage < 5 && currentText && (
          <motion.p
            key={`waking-text-${stage}`}
            className="text-base sm:text-lg md:text-xl tracking-[0.06em] text-center px-4"
            style={{
              fontFamily: '"Courier New", "Consolas", "Monaco", monospace',
              color: `rgba(0, 255, 100, ${textOpacity})`,
              textShadow: `0 0 20px rgba(0, 255, 100, ${textOpacity * 0.3}), 0 0 40px rgba(0, 180, 140, ${textOpacity * 0.1})`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {currentText.slice(0, charIndex)}
            {charIndex < currentText.length && (
              <span
                style={{
                  animation: 'cursor-blink 1s step-end infinite',
                  color: `rgba(0, 255, 100, ${textOpacity * 0.7})`,
                }}
              >
                █
              </span>
            )}
          </motion.p>
        )}

        {/* Previous stage texts (fade to dim) */}
        {stage >= 3 && (
          <motion.p
            key="prev-text-2"
            className="text-sm sm:text-base tracking-[0.06em] text-center px-4 mb-3"
            style={{
              fontFamily: '"Courier New", "Consolas", "Monaco", monospace',
              color: 'rgba(0, 255, 100, 0.25)',
              textShadow: '0 0 15px rgba(0, 200, 150, 0.05)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            {stageTexts[2]}
          </motion.p>
        )}
        {stage >= 4 && (
          <motion.p
            key="prev-text-3"
            className="text-sm sm:text-base tracking-[0.06em] text-center px-4 mb-3"
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              color: 'rgba(210, 195, 175, 0.25)',
              textShadow: '0 0 15px rgba(200, 160, 100, 0.04)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          >
            {stageTexts[3]}
          </motion.p>
        )}
      </div>
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
//  INTRO SCREEN — Main Cinematic Orchestrator
// ════════════════════════════════════════════════════════════════

type CinematicPhase = 'black' | 'prose' | 'title' | 'poem' | 'transition' | 'waking' | 'done';

/** No-props IntroScreen — reads data from store/imports, compatible with GameOrchestrator's <IntroScreen /> */
export function IntroScreen() {
  const setIntroActive = useGameStore((s) => s.setIntroActive);
  const setCurrentNodeId = useGameStore((s) => s.setCurrentNodeId);
  const setShowStoryOverlay = useGameStore((s) => s.setShowStoryOverlay);
  const collectPoem = useGameStore((s) => s.collectPoem);
  const setIntroSeen = useGameStore((s) => s.setIntroSeen);

  const poems = POEMS;
  const firstPoem = useMemo(() => poems.find(p => p.order === 1), [poems]);

  const [phase, setPhase] = useState<CinematicPhase>('black');
  const [bgGradient, setBgGradient] = useState(0); // 0 = black, 1 = dark blue-gray
  const [particleIntensity, setParticleIntensity] = useState(0.3);
  const [fadeInComplete, setFadeInComplete] = useState(false); // 2s fade-in from black
  const reduceMotion = useReducedMotion();

  // Procedural audio driven by phase
  useCinematicAudio(phase);

  const onComplete = useCallback(() => {
    collectPoem('poem_2');
    setCurrentNodeId('start');
    setShowStoryOverlay(false);
    setIntroSeen(true);

    // ── Wake-up 3D cinematic: Volodka gets up from bed, walks to desk ──
    // The WakeUpSequence component listens for this event and animates the
    // player model + camera through the wake-up sequence. When it finishes,
    // it emits 'intro:wakeup_complete' which triggers the game start below.
    eventBus.emit('intro:wakeup_sequence', {});

    // Set mode to exploration so the 3D canvas renders the wakeup scene.
    // The WakeUpSequence will animate inside the volodka_room scene.
    setIntroActive(false);

    // Auto-start the first quest from the golden path if no quests are active.
    const store = useGameStore.getState();
    if (store.quests.length === 0 || !store.quests.some((q) => q.status === 'active')) {
      store.activateQuest('first_reading');
    }
  }, [collectPoem, setCurrentNodeId, setShowStoryOverlay, setIntroSeen, setIntroActive]);

  const handleSkip = useCallback(() => {
    // Do NOT set introSeen here — that triggers IntroAutoSkip which
    // bypasses the story mode. Instead, go to waking phase so the
    // player still sees the dramatic wake-up cutscene.
    setPhase('waking');
  }, []);

  // 2-second fade-in from complete black on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeInComplete(true), reduceMotion ? 500 : 2000);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  // Phase 1: BLACK → PROSE after 2.5 seconds (after fade-in completes)
  useEffect(() => {
    if (phase !== 'black' || !fadeInComplete) return;
    const timer = setTimeout(() => {
      setPhase('prose');
      setBgGradient(0.5);
      setParticleIntensity(0.6);
    }, reduceMotion ? 500 : 2500);
    return () => clearTimeout(timer);
  }, [phase, reduceMotion, fadeInComplete]);

  // Background gradient animation
  useEffect(() => {
    if (phase === 'prose') {
      const timer = setTimeout(() => setBgGradient(1), 2000);
      return () => clearTimeout(timer);
    }
    if (phase === 'title') {
      setTimeout(() => { setBgGradient(0.8); setParticleIntensity(1); }, 0);
    }
    if (phase === 'poem') {
      setTimeout(() => { setBgGradient(0.6); setParticleIntensity(0.7); }, 0);
    }
    if (phase === 'transition') {
      setTimeout(() => { setBgGradient(0.3); setParticleIntensity(0.4); }, 0);
    }
    if (phase === 'waking') {
      setTimeout(() => { setBgGradient(0); setParticleIntensity(0); }, 0);
    }
  }, [phase]);

  // Handle transition to gameplay: enter waking phase where PhaseWaking
  // handles the dramatic eyes-opening cutscene, then calls handleWakingComplete
  const handleContinue = useCallback(() => {
    setPhase('waking');
  }, []);

  // Called when PhaseWaking cutscene completes — finalize transition to game
  const handleWakingComplete = useCallback(() => {
    setPhase('done');
    onComplete();
  }, [onComplete]);

  // Called at PhaseWaking stage 4 to reveal the 3D canvas behind the overlay.
  // IMPORTANT: We do NOT switch mode to 'cutscene' here anymore.
  // The canvas is already visible during intro mode (see GameOrchestrator),
  // so PhaseWaking can simply fade out its own overlay to reveal the 3D scene.
  // Previously, switching to cutscene unmounted IntroScreen, which cleared
  // PhaseWaking's stage-5 timer — the game got stuck forever in cutscene mode.
  const handleRevealCanvas = useCallback(() => {
    // Canvas is already visible — no mode change needed.
    // Just emit the stand-up and camera events so the 3D scene reacts.
    // (These are also emitted in PhaseWaking stage 4 with a 200ms delay,
    //  but emitting here too ensures they fire immediately on reveal.)
  }, []);

  // Background style based on gradient phase
  const bgStyle = useMemo(() => {
    const blueAmount = bgGradient;
    const base: React.CSSProperties = { zIndex: UI_LAYERS.LOADING };
    if (blueAmount <= 0) {
      return { ...base, background: '#000' };
    }
    return {
      ...base,
      background: `linear-gradient(180deg, 
        rgb(${Math.round(5 + 10 * blueAmount)}, ${Math.round(5 + 15 * blueAmount)}, ${Math.round(8 + 25 * blueAmount)}) 0%,
        rgb(${Math.round(2 + 5 * blueAmount)}, ${Math.round(3 + 8 * blueAmount)}, ${Math.round(5 + 15 * blueAmount)}) 100%
      )`,
    };
  }, [bgGradient]);

  return (
    <div
      className="game-critical-motion fixed inset-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden overscroll-none"
      style={bgStyle}
    >
      {/* ── 2-second fade-in from complete black ── */}
      <motion.div
        className="absolute inset-0 z-[90] bg-black pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: fadeInComplete ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0.5 : 2, ease: 'easeOut' }}
      />

      {/* ── Pulsing "ВОЛОДЬКА" in background at very low opacity ── */}
      {/* Hidden during 'title' phase to avoid double appearance with PhaseTitle */}
      {(phase === 'prose' || phase === 'poem' || phase === 'transition') && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-[5]"
          style={{
            opacity: 0.025,
          }}
        >
          <span
            className="text-[20vw] font-bold tracking-[0.15em]"
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              color: 'rgba(150, 180, 255, 1)',
              filter: 'blur(2px)',
            }}
          >
            ВОЛОДЬКА
          </span>
        </div>
      )}

      {/* ── Atmospheric layers ── */}
      <Vignette intensity={phase === 'black' ? 0.95 : 0.75} zIndex={55} />
      <FilmGrain opacity={0.045} zIndex={60} />
      <CinematicBars variant="intro" />
      <EmberParticles intensity={particleIntensity} />

      {/* ── Phase content ── */}
      <div className="absolute inset-0 flex items-center justify-center z-[30]">
        <AnimatePresence mode="wait">
          {phase === 'black' && <PhaseBlack key="black" />}
          {phase === 'prose' && (
            <PhaseProse
              key="prose"
              onComplete={() => setPhase('title')}
              reduceMotion={!!reduceMotion}
            />
          )}
          {phase === 'title' && (
            <PhaseTitle
              key="title"
              onComplete={() => setPhase('poem')}
            />
          )}
          {phase === 'poem' && firstPoem && (
            <PhasePoem
              key="poem"
              poem={firstPoem}
              onComplete={() => setPhase('transition')}
              reduceMotion={!!reduceMotion}
            />
          )}
          {phase === 'transition' && (
            <PhaseTransition
              key="transition"
              onContinue={handleContinue}
            />
          )}
          {phase === 'waking' && (
            <PhaseWaking
              key="waking"
              onContinue={handleWakingComplete}
              onRevealCanvas={handleRevealCanvas}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Skip button ── */}
      {phase !== 'done' && phase !== 'waking' && (
        <SkipButton onSkip={handleSkip} />
      )}

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes cinematic-grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -2%); }
          20% { transform: translate(2%, 1%); }
          30% { transform: translate(-1%, 2%); }
          40% { transform: translate(1%, -1%); }
          50% { transform: translate(-2%, 2%); }
          60% { transform: translate(2%, -2%); }
          70% { transform: translate(-1%, 1%); }
          80% { transform: translate(1%, 2%); }
          90% { transform: translate(-2%, -1%); }
        }

        @keyframes cinematic-ember {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          5% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) translateX(var(--ember-drift, 0px));
            opacity: 0;
          }
        }

        @keyframes waking-breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          35% { opacity: 0.7; transform: scale(1.02); }
          65% { opacity: 0.5; transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
