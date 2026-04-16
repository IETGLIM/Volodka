"use client";

import { memo, useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PoemReveal } from './PoemComponents';
import type { Poem } from '@/data/poems';

// ============================================
// CANVAS MATRIX RAIN — HIGH PERFORMANCE
// ============================================

const CanvasMatrixRain = memo(function CanvasMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const fontSize = 14;
    let columns: number;
    let drops: number[];

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const applyResize = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w));
      canvas.height = Math.max(1, Math.floor(h));
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns)
        .fill(1)
        .map(() => Math.random() * -50);
    };

    const scheduleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = undefined;
        applyResize();
      }, 120);
    };

    applyResize();

    const resize = () => scheduleResize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = '#00ff41';
        ctx.globalAlpha = 0.8;
        ctx.fillText(char, x, y);

        ctx.fillStyle = '#00cc33';
        ctx.globalAlpha = 0.3;
        if (y > fontSize) {
          const trailChar = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(trailChar, x, y - fontSize);
        }

        ctx.fillStyle = '#009922';
        ctx.globalAlpha = 0.1;
        if (y > fontSize * 2) {
          const farTrailChar = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(farTrailChar, x, y - fontSize * 2);
        }

        ctx.globalAlpha = 1;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
});

// ============================================
// SCANLINES
// ============================================

const Scanlines = memo(function Scanlines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-50"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.06) 2px, rgba(0, 0, 0, 0.06) 4px)',
      }}
    />
  );
});

// ============================================
// CRT SWEEP LINE
// ============================================

const CRTSweep = memo(function CRTSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.12), transparent)',
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.08)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
});

// ============================================
// FOG/MIST LAYERS — BLADE RUNNER ENHANCED
// ============================================

const FogLayers = memo(function FogLayers() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep amber/orange glow from below — Blade Runner cityscape */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2/5"
        style={{
          background: 'linear-gradient(to top, rgba(255, 120, 0, 0.12) 0%, rgba(255, 80, 0, 0.05) 50%, transparent 100%)',
        }}
      />
      {/* Cyan neon from upper left */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-1/3"
        style={{
          background: 'radial-gradient(ellipse, rgba(0, 255, 255, 0.07) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      {/* Magenta accent from upper right */}
      <motion.div
        className="absolute top-0 right-0 w-1/3 h-1/3"
        style={{
          background: 'radial-gradient(ellipse, rgba(255, 0, 128, 0.06) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, delay: 2 }}
      />
      {/* Fog layer 1 — slow drift with amber tones */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/4 fog-drift"
        style={{
          background: 'linear-gradient(to top, rgba(255, 140, 0, 0.07) 0%, rgba(255, 100, 0, 0.03) 50%, transparent 100%)',
        }}
      />
      {/* Fog layer 2 — cooler, delayed */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/6 fog-drift"
        style={{
          background: 'linear-gradient(to top, rgba(180, 160, 140, 0.04) 0%, transparent 100%)',
          animationDelay: '4s',
        }}
      />
      {/* Fog layer 3 — upper haze */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-1/6 fog-drift"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 200, 200, 0.03) 0%, transparent 100%)',
          animationDelay: '6s',
        }}
      />
    </div>
  );
});

// ============================================
// FLOATING PARTICLES — AMBER/CYAN/MAGENTA
// ============================================

const ParticleSystem = memo(function ParticleSystem() {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 4 + Math.random() * 6,
    size: 1 + Math.random() * 3,
    color: i % 3 === 0
      ? 'rgba(255, 0, 128, 0.5)'
      : i % 3 === 1
      ? 'rgba(255, 140, 0, 0.4)'
      : 'rgba(0, 255, 255, 0.5)',
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `ember-float ${p.duration}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// SOUND WAVE VISUALIZATION
// ============================================

const SoundWave = memo(function SoundWave() {
  const bars = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    id: i,
    delay: i * 0.05,
    duration: 0.6 + Math.random() * 0.8,
  })), []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-5 flex items-end justify-center gap-px pointer-events-none z-40 px-2">
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="flex-1 bg-cyan-500/10 rounded-t"
          style={{
            height: '100%',
            animation: `sound-wave ${bar.duration}s ease-in-out infinite`,
            animationDelay: `${bar.delay}s`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// CINEMATIC LETTERBOX BARS
// ============================================

const CinematicBars = memo(function CinematicBars() {
  const [staticBars, setStaticBars] = useState(false);

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const sync = () => setStaticBars(mqMotion.matches || mqCoarse.matches);
    sync();
    mqMotion.addEventListener('change', sync);
    mqCoarse.addEventListener('change', sync);
    return () => {
      mqMotion.removeEventListener('change', sync);
      mqCoarse.removeEventListener('change', sync);
    };
  }, []);

  if (staticBars) {
    return (
      <>
        <div className="absolute top-0 left-0 right-0 z-40 h-[8dvh] min-h-[32px] bg-black pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 z-40 h-[8dvh] min-h-[32px] bg-black pointer-events-none" />
      </>
    );
  }

  return (
    <>
      <motion.div
        className="absolute top-0 left-0 right-0 bg-black z-40 pointer-events-none"
        initial={{ height: '12vh' }}
        animate={{ height: ['12vh', '6vh', '12vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-black z-40 pointer-events-none"
        initial={{ height: '12vh' }}
        animate={{ height: ['12vh', '6vh', '12vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </>
  );
});

// ============================================
// SKIP BUTTON — CYBERPUNK
// ============================================

interface SkipButtonProps {
  onSkip: () => void;
}

const SkipButton = memo(function SkipButton({ onSkip }: SkipButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      onClick={onSkip}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed top-6 right-6 z-[60] group"
    >
      <div
        className="relative px-4 py-2 font-mono text-sm uppercase tracking-wider border border-cyan-500/40 rounded bg-black/80 backdrop-blur-sm overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 255, 255, 0.08) 50%, transparent 100%)',
            animation: 'scan-line 2s linear infinite',
            opacity: isHovered ? 0 : 0.5,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none holo-flicker"
          style={{
            boxShadow: isHovered
              ? '0 0 25px rgba(0, 255, 255, 0.5), inset 0 0 15px rgba(0, 255, 255, 0.15)'
              : '0 0 10px rgba(0, 255, 255, 0.15)',
          }}
        />
        <span className="relative z-10 flex items-center gap-2 text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Пропустить
        </span>
      </div>
    </motion.button>
  );
});

// ============================================
// BOOT SEQUENCE — ENHANCED
// ============================================

const BOOT_LINES = [
  { text: '> ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ...', delay: 0, status: 'info' },
  { text: '> ЗАГРУЗКА ЯДРА ПАМЯТИ......... OK', delay: 400, status: 'ok' },
  { text: '> ВОССТАНОВЛЕНИЕ VOLodka.exe... OK', delay: 800, status: 'ok' },
  { text: '> ПОИСК ФРАГМЕНТОВ СТИХОВ..... 0/12', delay: 1200, status: 'warn' },
  { text: '> УРОВЕНЬ СТРЕССА: КРИТИЧЕСКИЙ', delay: 1600, status: 'critical' },
  { text: '> КАРМА: НЕЙТРАЛЬНАЯ', delay: 1900, status: 'info' },
  { text: '> СИСТЕМА ГОТОВА К ЗАПУСКУ', delay: 2300, status: 'ready' },
];

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence = memo(function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });

    timers.push(setTimeout(() => {
      setShowCursor(false);
      onComplete();
    }, 3200));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="ml-3 font-mono text-[10px] text-cyan-500/40 tracking-wider">
          volodka://boot/intro
        </span>
      </div>

      {/* Terminal body */}
      <div
        className="relative p-5 bg-black/60 backdrop-blur-sm"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          border: '1px solid rgba(0, 255, 255, 0.15)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.05), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="font-mono text-left space-y-1">
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
              className={`text-sm md:text-base leading-relaxed ${
                line.status === 'critical'
                  ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                  : line.status === 'ready'
                  ? 'text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]'
                  : line.status === 'ok'
                  ? 'text-emerald-400/80'
                  : line.status === 'warn'
                  ? 'text-amber-400/80'
                  : 'text-cyan-500/60'
              }`}
            >
              {line.text}
            </motion.p>
          ))}
          {showCursor && (
            <span className="text-cyan-400 boot-cursor text-sm">█</span>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================
// GLITCH TITLE — ENHANCED CINEMATIC
// ============================================

interface GlitchTitleProps {
  text: string;
  subtitle: string;
}

const GlitchTitle = memo(function GlitchTitle({ text, subtitle }: GlitchTitleProps) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      {/* Cinematic bloom effect */}
      <div
        className="absolute inset-0 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.25) 0%, rgba(255, 140, 0, 0.08) 40%, transparent 60%)',
        }}
      />

      {/* Title */}
      <motion.h1
        className={`relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest ${glitching ? 'title-glitch' : ''}`}
        style={{
          textShadow: glitching
            ? '-2px 0 #ff0000, 2px 0 #00ffff, 0 0 80px rgba(0, 255, 255, 0.6)'
            : '0 0 60px rgba(0, 255, 255, 0.5), 0 0 120px rgba(0, 255, 255, 0.3), 0 0 200px rgba(255, 140, 0, 0.1)',
        }}
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500">
          {text}
        </span>
      </motion.h1>

      {/* Reflection */}
      <div
        className="relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest pointer-events-none select-none -mt-2"
        style={{
          animation: 'neon-reflection 4s ease-in-out infinite',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 35%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 35%)',
        }}
        aria-hidden
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/20 to-transparent">
          {text}
        </span>
      </div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-3 font-mono text-sm md:text-base tracking-[0.4em] uppercase"
        style={{
          background: 'linear-gradient(90deg, rgba(0,255,255,0.8), rgba(255,140,0,0.6), rgba(0,255,255,0.8))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
        }}
      >
        {subtitle}
      </motion.p>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
        className="mt-6 mx-auto w-48 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.6), rgba(255, 140, 0, 0.4), transparent)',
        }}
      />

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 flex items-center justify-center gap-2"
      >
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-cyan-500 font-mono text-sm"
        >
          ●
        </motion.span>
        <span className="text-cyan-500/50 font-mono text-xs tracking-[0.3em] uppercase">
          ВОССТАНОВЛЕНИЕ ПАМЯТИ
        </span>
      </motion.div>
    </div>
  );
});

// ============================================
// INTRO SCREEN COMPONENT — CINEMATIC ENHANCED
// ============================================

interface IntroScreenProps {
  titleText: string;
  subtitleText: string;
  gameIntro: string;
  poems: Poem[];
  onComplete: () => void;
}

/** Предложения как «лог» памяти: кинематографичнее, чем три целых абзаца подряд */
function splitIntroStoryBeats(src: string): { text: string; paragraphGap: boolean }[] {
  const paras = src.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const out: { text: string; paragraphGap: boolean }[] = [];
  for (let pi = 0; pi < paras.length; pi++) {
    const sentences = paras[pi]
      .split(/(?<=[.!?])\s+/u)
      .map((s) => s.trim())
      .filter(Boolean);
    for (let si = 0; si < sentences.length; si++) {
      out.push({
        text: sentences[si],
        paragraphGap: si === 0 && pi > 0,
      });
    }
  }
  return out;
}

export const IntroScreen = memo(function IntroScreen({
  titleText,
  subtitleText,
  gameIntro,
  poems,
  onComplete,
}: IntroScreenProps) {
  const storyBeats = useMemo(() => splitIntroStoryBeats(gameIntro), [gameIntro]);
  const [beatIndex, setBeatIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const [introPhase, setIntroPhase] = useState<'boot' | 'title' | 'prose' | 'poem' | 'done'>('boot');
  const [revealedPoem, setRevealedPoem] = useState<Poem | null>(null);
  const [collectedPoems, setCollectedPoems] = useState<string[]>([]);
  const proseScrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл лога памяти к последней строке / курсору
  useLayoutEffect(() => {
    if (introPhase !== 'prose') return;
    const el = proseScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [introPhase, beatIndex, charIndex]);

  // Skip intro handler
  const handleSkip = useCallback(() => {
    setIntroPhase('done');
    onComplete();
  }, [onComplete]);

  // Boot complete → Title
  const handleBootComplete = useCallback(() => {
    setIntroPhase('title');
  }, []);

  // Phase 2: Title (4 seconds)
  useEffect(() => {
    if (introPhase !== 'title') return;

    const timer = setTimeout(() => {
      setIntroPhase('prose');
      setBeatIndex(0);
      setCharIndex(0);
    }, 4500);

    return () => clearTimeout(timer);
  }, [introPhase]);

  // Phase 3: Prose — посимвольно внутри фразы, затем пауза и следующая фраза
  useEffect(() => {
    if (introPhase !== 'prose') return;

    if (beatIndex >= storyBeats.length) {
      const timer = setTimeout(() => {
        const firstPoem = poems.find(p => p.order === 1);
        if (firstPoem) {
          setRevealedPoem(firstPoem);
          setIntroPhase('poem');
        } else {
          setIntroPhase('done');
          onComplete();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    const full = storyBeats[beatIndex]?.text ?? '';

    if (reduceMotion) {
      const dwell = Math.max(520, Math.min(1400, full.length * 24));
      const timer = setTimeout(() => {
        setBeatIndex((b) => b + 1);
        setCharIndex(0);
      }, dwell);
      return () => clearTimeout(timer);
    }

    if (charIndex < full.length) {
      const msPerChar = full.length > 120 ? 16 : 22;
      const timer = setTimeout(() => setCharIndex((c) => c + 1), msPerChar);
      return () => clearTimeout(timer);
    }

    const dwell = Math.max(880, Math.min(2400, full.length * 32));
    const timer = setTimeout(() => {
      setBeatIndex((b) => b + 1);
      setCharIndex(0);
    }, dwell);
    return () => clearTimeout(timer);
  }, [introPhase, beatIndex, charIndex, storyBeats, poems, onComplete, reduceMotion]);

  // Phase 4: Poem closed
  useEffect(() => {
    if (introPhase !== 'poem' || revealedPoem) return;

    const firstPoem = poems.find(p => p.order === 1);
    if (firstPoem && !collectedPoems.includes(firstPoem.id)) {
      setTimeout(() => {
        setCollectedPoems(prev => [...prev, firstPoem!.id]);
      }, 0);
    }

    const timer = setTimeout(() => {
      setIntroPhase('done');
      onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [introPhase, revealedPoem, poems, collectedPoems, onComplete]);

  return (
    <div className="fixed inset-0 h-[100dvh] min-h-[100dvh] w-full bg-black overflow-hidden overscroll-none">
      {/* Canvas-based Matrix rain */}
      <CanvasMatrixRain />

      {/* Scanlines */}
      <Scanlines />

      {/* CRT sweep line */}
      <CRTSweep />

      {/* Blade Runner fog/mist */}
      <FogLayers />

      {/* Particle system */}
      <ParticleSystem />

      {/* Sound wave visualization */}
      <SoundWave />

      {/* Cinematic letterbox bars */}
      <CinematicBars />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />

      {/* Skip — скрываем на экране стиха, иначе z-60 перехватывает тап по ✕ */}
      {introPhase !== 'done' && introPhase !== 'poem' && (
        <SkipButton onSkip={handleSkip} />
      )}

      {/* Content */}
      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <AnimatePresence mode="wait">
          {/* Phase 1: Boot sequence */}
          {introPhase === 'boot' && (
            <motion.div
              key="boot"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <BootSequence onComplete={handleBootComplete} />
            </motion.div>
          )}

          {/* Phase 2: Title with glitch — cinematic */}
          {introPhase === 'title' && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <GlitchTitle text={titleText} subtitle={subtitleText} />
            </motion.div>
          )}

          {/* Phase 3: Prose — терминал, абзацы накапливаются без лишнего AnimatePresence */}
          {introPhase === 'prose' && (
            <motion.div
              key="prose"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mx-auto w-full max-w-2xl px-3 sm:px-6"
            >
              <div
                className="intro-recall-frame relative overflow-hidden border border-emerald-500/25 bg-black/80 p-0 shadow-[0_0_40px_rgba(0,255,65,0.08),0_0_80px_rgba(0,255,255,0.05)] backdrop-blur-md sm:p-0"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.85]"
                  aria-hidden
                  style={{
                    background: [
                      'linear-gradient(165deg, rgba(0,255,65,0.06) 0%, transparent 42%)',
                      'linear-gradient(345deg, rgba(255,0,128,0.04) 0%, transparent 38%)',
                      'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,255,65,0.04) 3px, rgba(0,255,65,0.04) 4px)',
                      'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,255,255,0.02) 20px, rgba(0,255,255,0.02) 21px)',
                    ].join(', '),
                  }}
                />
                <div className="pointer-events-none absolute top-2 left-2 z-[1] h-5 w-5 border-l border-t border-emerald-400/35" />
                <div className="pointer-events-none absolute top-2 right-2 z-[1] h-5 w-5 border-r border-t border-cyan-400/30" />
                <div className="pointer-events-none absolute bottom-2 left-2 z-[1] h-5 w-5 border-l border-b border-amber-400/25" />
                <div className="pointer-events-none absolute bottom-2 right-2 z-[1] h-5 w-5 border-r border-b border-fuchsia-500/20" />

                <div className="relative z-[2] border-b border-cyan-500/15 bg-gradient-to-r from-black/90 via-[#030806]/95 to-black/90 px-3 py-2.5 sm:px-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500/85 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.45)]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500/90 shadow-[0_0_8px_rgba(34,197,94,0.55)]" />
                    <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-400/50">
                      live
                    </span>
                  </div>
                  <div className="intro-recall-chrome-line flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10px] font-semibold sm:text-[11px]">
                    <span className="text-emerald-300/95 drop-shadow-[0_0_10px_rgba(0,255,65,0.35)]">
                      Volodka
                    </span>
                    <span className="intro-recall-glitch-pipe text-fuchsia-500/40">|</span>
                    <span className="text-cyan-300/90">Matrix</span>
                    <span className="intro-recall-glitch-pipe text-fuchsia-500/40">|</span>
                    <span className="text-amber-400/85">Cyberpunk</span>
                    <span className="intro-recall-glitch-pipe text-fuchsia-500/40">|</span>
                    <span className="bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,255,255,0.25)]">
                      Glitch
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1.5 font-mono sm:flex-row sm:items-center sm:justify-between">
                    <span className="intro-recall-blade-glow text-[9px] uppercase tracking-[0.22em] text-amber-500/70">
                      Running on the Blade
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 text-[9px] text-cyan-500/40">
                      <span className="tracking-[0.14em]">volodka://memory/recall</span>
                      <span className="tabular-nums text-cyan-500/50">
                        SEG{' '}
                        {storyBeats.length === 0
                          ? '—'
                          : `${Math.min(beatIndex + 1, storyBeats.length)}/${storyBeats.length}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  ref={proseScrollRef}
                  className="relative z-[2] max-h-[min(52dvh,520px)] overflow-y-auto px-3 py-3 pr-2 font-mono text-left game-scrollbar sm:px-4 sm:py-4"
                >
                  {storyBeats.slice(0, beatIndex).map((beat, i) => {
                    const line = beat.text;
                    return (
                      <motion.p
                        key={`prose-beat-${i}`}
                        initial={{ opacity: 0, x: -6, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        className={`mb-2 text-base leading-relaxed sm:text-lg ${
                          beat.paragraphGap ? 'mt-5 border-t border-cyan-500/10 pt-4 sm:mt-6 sm:pt-5' : ''
                        } ${
                          line.toLowerCase().includes('смерть')
                            ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.45)]'
                            : line.toLowerCase().includes('верить') || line.toLowerCase().includes('вспомнилось')
                            ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.45)]'
                            : line.toLowerCase().includes('одиночеств') || line.toLowerCase().includes('тьм')
                            ? 'text-amber-400/85 drop-shadow-[0_0_8px_rgba(255,140,0,0.28)]'
                            : line.toLowerCase().includes('уфа') || line.toLowerCase().includes('тридцать три')
                            ? 'text-cyan-100/90 drop-shadow-[0_0_12px_rgba(0,255,255,0.18)]'
                            : 'text-slate-300/90'
                        }`}
                      >
                        <span className="mr-2 inline-block w-5 select-none text-right text-cyan-500/35 tabular-nums">
                          {(i + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="text-cyan-500/40">&gt;</span>{' '}
                        {line}
                      </motion.p>
                    );
                  })}
                  {beatIndex < storyBeats.length && storyBeats[beatIndex] && (
                    <motion.p
                      key={`prose-typing-${beatIndex}`}
                      layout="position"
                      initial={{ opacity: 0.35, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28 }}
                      className={`motion-safe:animate-[intro-line-glow_3.5s_ease-in-out_infinite] relative mb-2 border-l-2 border-emerald-500/45 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent py-1 pl-2 text-base leading-relaxed sm:text-lg ${
                        storyBeats[beatIndex].paragraphGap
                          ? 'mt-5 border-t border-cyan-500/15 pt-4 sm:mt-6 sm:pt-5'
                          : ''
                      } text-slate-100/95`}
                    >
                      <span className="mr-2 inline-block w-5 select-none text-right font-mono text-[11px] text-emerald-400/55 tabular-nums sm:text-xs">
                        {(beatIndex + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="font-mono text-emerald-400/70">&gt;</span>{' '}
                      <span style={{ textShadow: '0 0 2px rgba(0,0,0,0.95), 0 0 12px rgba(0,40,30,0.4)' }}>
                        {reduceMotion
                          ? storyBeats[beatIndex].text
                          : storyBeats[beatIndex].text.slice(0, charIndex)}
                      </span>
                      <span className="ml-0.5 inline-block align-baseline font-mono text-emerald-300 motion-safe:animate-pulse drop-shadow-[0_0_6px_rgba(0,255,65,0.7)]">
                        █
                      </span>
                    </motion.p>
                  )}
                  <div className="h-2 shrink-0" aria-hidden />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {introPhase === 'poem' && revealedPoem && (
        <PoemReveal
          poem={revealedPoem}
          onClose={() => setRevealedPoem(null)}
          introTerminalChrome
        />
      )}

      {/* Corner decorations */}
      <motion.div
        className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-cyan-500/20 z-30"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-cyan-500/20 z-30"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-amber-500/15 z-30"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-amber-500/15 z-30"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      />
    </div>
  );
});

export default IntroScreen;
