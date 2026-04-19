"use client";

import { memo, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// CANVAS MATRIX RAIN — HIGH PERFORMANCE
// ============================================

const CanvasMatrixRain = memo(function CanvasMatrixRain({ opacity = 0.3 }: { opacity?: number }) {
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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1).map(() => Math.random() * -50);
    };

    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFВОЛОДЬКА';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Bright lead character
        ctx.fillStyle = '#00ff41';
        ctx.globalAlpha = 0.9;
        ctx.fillText(char, x, y);

        // Medium trail
        ctx.fillStyle = '#00cc33';
        ctx.globalAlpha = 0.4;
        if (y > fontSize) {
          const trailChar = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(trailChar, x, y - fontSize);
        }

        // Faint far trail
        ctx.fillStyle = '#009922';
        ctx.globalAlpha = 0.15;
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
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    />
  );
});

// ============================================
// SCANLINES OVERLAY
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
// CRT HORIZONTAL SWEEP LINE
// ============================================

const CRTSweep = memo(function CRTSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.15), transparent)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
});

// ============================================
// BLADE RUNNER ATMOSPHERE — FOG + AMBER GLOW
// ============================================

const BladeRunnerAtmosphere = memo(function BladeRunnerAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Amber/orange glow from below — city reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2/5"
        style={{
          background: 'linear-gradient(to top, rgba(255, 140, 0, 0.12) 0%, rgba(255, 100, 0, 0.05) 50%, transparent 100%)',
        }}
      />

      {/* Cyan neon glow from upper left */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(ellipse, rgba(0, 255, 255, 0.08) 0%, transparent 50%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Magenta accent from right */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.08) 0%, transparent 45%)',
        }}
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      {/* Fog layer 1 — slow drift */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/4 fog-drift"
        style={{
          background: 'linear-gradient(to top, rgba(255, 160, 0, 0.06) 0%, transparent 100%)',
        }}
      />

      {/* Fog layer 2 — delayed drift */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/6 fog-drift"
        style={{
          background: 'linear-gradient(to top, rgba(200, 180, 160, 0.04) 0%, transparent 100%)',
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
// SYNTHWAVE PERSPECTIVE GRID
// ============================================

const SynthwaveGrid = memo(function SynthwaveGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-15"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, transparent, black 20%, black 60%, transparent)',
        animation: 'grid-scroll 1.5s linear infinite',
      }}
    />
  );
});

// ============================================
// FLOATING PARTICLES — CYAN/MAGENTA/AMBER EMBERS
// ============================================

const ParticleSystem = memo(function ParticleSystem() {
  const particles = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 3 + Math.random() * 8,
    size: 1 + Math.random() * 3,
    color: i % 4 === 0
      ? 'rgba(255, 0, 128, 0.5)'
      : i % 4 === 1
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
// AUDIO VISUALIZER BARS
// ============================================

const AudioVisualizer = memo(function AudioVisualizer() {
  const bars = useMemo(() => Array.from({ length: 64 }, (_, i) => ({
    id: i,
    delay: i * 0.04,
    duration: 0.5 + Math.random() * 0.8,
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
// HEX MEMORY DUMP — SCROLLING TERMINAL
// ============================================

const HexDump = memo(function HexDump() {
  const lines = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const addr = (0x7FFE0000 + i * 16).toString(16).toUpperCase();
    const bytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')
    ).join(' ');
    return `${addr}: ${bytes}`;
  }), []);

  return (
    <div className="absolute left-4 bottom-16 pointer-events-none z-30 overflow-hidden h-36 w-72 opacity-20">
      <motion.div
        animate={{ y: [0, -350] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        {lines.map((line, i) => (
          <div key={i} className="font-mono text-[9px] text-cyan-500/60 leading-tight whitespace-nowrap">
            {line}
          </div>
        ))}
      </motion.div>
    </div>
  );
});

// ============================================
// SYSTEM DIAGNOSTICS — TERMINAL OUTPUT
// ============================================

const BOOT_DIAGNOSTICS = [
  { text: '> BIOS v2.0.77 — MEMORIAL SYSTEMS CORP.', delay: 0, status: 'info' },
  { text: '> Проверка памяти.................. OK [4096MB]', delay: 300, status: 'ok' },
  { text: '> Инициализация GPU................ OK [CYBER-R7]', delay: 600, status: 'ok' },
  { text: '> Загрузка ядер памяти............ OK [VOLodka.exe]', delay: 900, status: 'ok' },
  { text: '> Восстановление фрагментов....... 0/12 НАЙДЕНО', delay: 1200, status: 'warn' },
  { text: '> Мониторинг стресса.............. АКТИВЕН', delay: 1500, status: 'ok' },
  { text: '> Подключение к сети стихов....... ОЖИДАНИЕ', delay: 1800, status: 'warn' },
  { text: '> УРОВЕНЬ СТРЕССА: МИНИМАЛЬНЫЙ', delay: 2100, status: 'ok' },
  { text: '> СИСТЕМА ГОТОВА К ЗАПУСКУ', delay: 2500, status: 'ready' },
];

interface SystemDiagnosticsProps {
  onComplete: () => void;
}

const SystemDiagnostics = memo(function SystemDiagnostics({ onComplete }: SystemDiagnosticsProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_DIAGNOSTICS.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });

    timers.push(setTimeout(() => {
      setShowCursor(false);
      onComplete();
    }, 3500));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="font-mono text-left space-y-0.5">
      {BOOT_DIAGNOSTICS.slice(0, visibleLines).map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.1 }}
          className={`text-xs md:text-sm leading-relaxed ${
            line.status === 'ready'
              ? 'text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]'
              : line.status === 'warn'
              ? 'text-amber-400/80'
              : line.status === 'ok'
              ? 'text-emerald-400/70'
              : 'text-cyan-500/50'
          }`}
        >
          {line.text}
        </motion.p>
      ))}
      {showCursor && (
        <span className="text-cyan-400 boot-cursor text-sm">█</span>
      )}
    </div>
  );
});

// ============================================
// GLITCH PROGRESS BAR
// ============================================

interface GlitchProgressBarProps {
  progress: number;
}

const GlitchProgressBar = memo(function GlitchProgressBar({ progress }: GlitchProgressBarProps) {
  const [glitchOffset, setGlitchOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchOffset(Math.random() * 4 - 2);
        setTimeout(() => setGlitchOffset(0), 80);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-80 md:w-96">
      {/* Bar container */}
      <div
        className="relative h-3 bg-slate-900/80 overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          border: '1px solid rgba(0, 255, 255, 0.2)',
        }}
      >
        {/* Fill bar with glitch offset */}
        <motion.div
          className="h-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00ffff, #00cc99, #ff00ff, #00ffff)',
            backgroundSize: '300% 100%',
            animation: 'gradient-shift 3s linear infinite',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 5px rgba(0, 255, 255, 0.2)',
            transform: `translateX(${glitchOffset}px)`,
          }}
        />

        {/* Scan line inside progress */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
            backgroundSize: '50% 100%',
            animation: 'cyber-scan 1.5s linear infinite',
          }}
        />

        {/* Segment markers */}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-px h-full bg-black/30" />
          ))}
        </div>
      </div>

      {/* Percentage display */}
      <div className="flex justify-between items-center mt-1.5">
        <span className="font-mono text-[10px] text-cyan-500/40 tracking-wider">
          LOADING MODULES
        </span>
        <motion.span
          className="font-mono text-sm text-cyan-400 font-bold"
          style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {progress}%
        </motion.span>
      </div>
    </div>
  );
});

// ============================================
// STATUS MESSAGE CYCLER
// ============================================

const STATUS_MESSAGES = [
  'ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ',
  'ЗАГРУЗКА ЯДРА ПАМЯТИ',
  'ВОССТАНОВЛЕНИЕ VOLodka.exe',
  'ДОСТУП К АРХИВУ СТИХОВ',
  'СКАНИРОВАНИЕ ФРАГМЕНТОВ',
  'КОМПИЛЯЦИЯ ВОСПОМИНАНИЙ',
  'ПОДКЛЮЧЕНИЕ К СЕТИ',
  'ЗАПУСК VOLODYA KERNEL',
];

const StatusCycler = memo(function StatusCycler() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 1200);

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => {
      clearInterval(msgInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <motion.div
      className="font-mono text-lg md:text-xl tracking-[0.2em] text-cyan-400 uppercase"
      style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)' }}
      animate={{
        textShadow: [
          '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)',
          '0 0 20px rgba(255, 0, 128, 0.6), 0 0 40px rgba(255, 0, 128, 0.3)',
          '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)',
        ],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {STATUS_MESSAGES[messageIndex]}
      <span className="inline-block w-6 text-left">{dots}</span>
    </motion.div>
  );
});

// ============================================
// CORNER DECORATIONS
// ============================================

const CornerDecorations = memo(function CornerDecorations() {
  const corners = useMemo(() => [
    { pos: 'top-4 left-4', borders: 'border-l-2 border-t-2', delay: 0 },
    { pos: 'top-4 right-4', borders: 'border-r-2 border-t-2', delay: 0.5 },
    { pos: 'bottom-4 left-4', borders: 'border-l-2 border-b-2', delay: 1 },
    { pos: 'bottom-4 right-4', borders: 'border-r-2 border-b-2', delay: 1.5 },
  ], []);

  return (
    <>
      {corners.map((corner, i) => (
        <motion.div
          key={i}
          className={`absolute ${corner.pos} w-16 h-16 ${corner.borders} border-cyan-500/20`}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: corner.delay }}
        />
      ))}
    </>
  );
});

// ============================================
// GLITCH TITLE — ВОЛОДЬКА with neon reflection
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
        className={`relative text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest ${glitching ? 'title-glitch' : ''}`}
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
        className="relative text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest pointer-events-none select-none -mt-2"
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
    </div>
  );
});

// ============================================
// MAIN LOADING SCREEN COMPONENT
// ============================================

interface LoadingScreenProps {
  onReady?: () => void;
}

const LoadingScreen = memo(function LoadingScreen({ onReady }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'diagnostics' | 'title' | 'loading' | 'ready'>('diagnostics');
  const [bootComplete, setBootComplete] = useState(false);

  // Progress simulation
  useEffect(() => {
    if (phase !== 'loading') return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase('ready');
          return 100;
        }
        // Non-linear progress: fast at start, slow in middle, fast at end
        const increment = prev < 20 ? 4 : prev < 80 ? 2 : prev < 95 ? 3 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [phase]);

  // Notify parent when ready
  useEffect(() => {
    if (phase === 'ready' && onReady) {
      const t = setTimeout(onReady, 800);
      return () => clearTimeout(t);
    }
  }, [phase, onReady]);

  const handleDiagnosticsComplete = useCallback(() => {
    setBootComplete(true);
    setTimeout(() => setPhase('title'), 500);
  }, []);

  const handleTitleShown = useCallback(() => {
    setPhase('loading');
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden pointer-events-none">
      {/* Canvas Matrix rain */}
      <CanvasMatrixRain opacity={0.2} />

      {/* Scanlines */}
      <Scanlines />

      {/* CRT sweep line */}
      <CRTSweep />

      {/* Blade Runner atmosphere */}
      <BladeRunnerAtmosphere />

      {/* Synthwave grid */}
      <SynthwaveGrid />

      {/* Particle system */}
      <ParticleSystem />

      {/* Audio visualizer */}
      <AudioVisualizer />

      {/* Hex dump */}
      <HexDump />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />

      {/* Corner decorations */}
      <CornerDecorations />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {/* Phase 1: System diagnostics */}
          {phase === 'diagnostics' && (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto px-6"
            >
              {/* Terminal header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-[10px] text-cyan-500/40 tracking-wider">
                  volodka://boot/sequence
                </span>
              </div>

              {/* Terminal window */}
              <div
                className="relative p-4 bg-black/60 backdrop-blur-sm"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                  border: '1px solid rgba(0, 255, 255, 0.15)',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.05), inset 0 0 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                <SystemDiagnostics onComplete={handleDiagnosticsComplete} />
              </div>
            </motion.div>
          )}

          {/* Phase 2: Title reveal — ВОЛОДЬКА with glitch */}
          {phase === 'title' && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              onAnimationComplete={handleTitleShown}
            >
              <GlitchTitle text="ВОЛОДЬКА" subtitle="ЗАГРУЗКА СИСТЕМЫ" />
            </motion.div>
          )}

          {/* Phase 3: Loading with progress */}
          {(phase === 'loading' || phase === 'ready') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center flex flex-col items-center"
            >
              {/* Title echo — smaller during loading */}
              <motion.h2
                className="font-mono text-2xl md:text-3xl tracking-[0.3em] uppercase mb-8"
                style={{
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)',
                }}
                animate={{
                  textShadow: [
                    '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)',
                    '0 0 30px rgba(255, 0, 128, 0.5), 0 0 60px rgba(255, 0, 128, 0.3)',
                    '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-400">
                  ЗАГРУЗКА ВОЛОДЬКИ
                </span>
              </motion.h2>

              {/* Status cycler */}
              <StatusCycler />

              {/* Progress bar */}
              <div className="mt-8">
                <GlitchProgressBar progress={progress} />
              </div>

              {/* Ready state indicator */}
              <AnimatePresence>
                {phase === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-emerald-400 text-lg"
                    >
                      ●
                    </motion.span>
                    <span
                      className="font-mono text-sm text-emerald-400 tracking-widest uppercase"
                      style={{ textShadow: '0 0 10px rgba(52, 211, 153, 0.5)' }}
                    >
                      СИСТЕМА ЗАПУЩЕНА
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom info line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 font-mono text-[10px] text-cyan-500/30 tracking-wider"
              >
                v2.0.77 | MEMORIAL BUILD | УФА 1992—2026
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default LoadingScreen;
