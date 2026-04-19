// src/app/GameClient.tsx
'use client';

import { ensureThreeClientPrep } from '@/lib/threeClientPrep';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FamilyWelcomeGate } from '@/components/game/FamilyWelcomeGate';

// Dynamic import with SSR disabled — uses the new 2D GameOrchestrator
const GameOrchestrator = dynamic(
  () => import('@/components/game/GameOrchestrator'),
  {
    ssr: false,
    loading: () => <CyberpunkLoadingFallback />,
  }
);

// ============================================
// CYBERPUNK LOADING FALLBACK — Matrix/Blade Runner style
// ============================================

/** Canvas-based Matrix digital rain — high performance */
const MiniMatrixRain = memo(function MiniMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const fontSize = 13;
    let columns: number;
    let drops: number[];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1).map(() => Math.random() * -40);
    };

    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFВОЛОДЬКА';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Bright lead character — cyan
        ctx.fillStyle = '#00ffcc';
        ctx.globalAlpha = 0.85;
        ctx.fillText(char, x, y);

        // Medium trail
        ctx.fillStyle = '#00cc88';
        ctx.globalAlpha = 0.35;
        if (y > fontSize) {
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
        }

        // Faint far trail
        ctx.fillStyle = '#009966';
        ctx.globalAlpha = 0.12;
        if (y > fontSize * 2) {
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize * 2);
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
      style={{ opacity: 0.25 }}
    />
  );
});

/** Scanning horizontal sweep line */
const SweepLine = memo(function SweepLine() {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent)',
          boxShadow: '0 0 25px rgba(0, 255, 255, 0.12)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
});

/** CRT scanlines overlay */
const Scanlines = memo(function Scanlines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-50"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.05) 2px, rgba(0, 0, 0, 0.05) 4px)',
      }}
    />
  );
});

/** Blade Runner atmosphere — amber glow + cyan neon */
const Atmosphere = memo(function Atmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Amber/orange glow from below — city reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2/5"
        style={{
          background: 'linear-gradient(to top, rgba(255, 140, 0, 0.12) 0%, rgba(255, 100, 0, 0.05) 50%, transparent 100%)',
        }}
      />
      {/* Cyan neon from upper left */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(ellipse, rgba(0, 255, 255, 0.1) 0%, transparent 50%)',
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
        animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    </div>
  );
});

/** Floating particles — cyan/magenta/amber embers */
const Particles = memo(function Particles() {
  const particles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 3 + Math.random() * 7,
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

/** Audio visualizer bars */
const AudioBars = memo(function AudioBars() {
  const bars = useMemo(() => Array.from({ length: 56 }, (_, i) => ({
    id: i,
    delay: i * 0.04,
    duration: 0.5 + Math.random() * 0.7,
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

/** Hex memory dump — scrolling terminal data */
const HexDump = memo(function HexDump() {
  const lines = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const addr = (0x7FFE0000 + i * 16).toString(16).toUpperCase();
    const bytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')
    ).join(' ');
    return `${addr}: ${bytes}`;
  }), []);

  return (
    <div className="absolute left-4 bottom-14 pointer-events-none z-30 overflow-hidden h-28 w-64 opacity-15">
      <motion.div
        animate={{ y: [0, -250] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        {lines.map((line, i) => (
          <div key={i} className="font-mono text-[8px] text-cyan-500/60 leading-tight whitespace-nowrap">
            {line}
          </div>
        ))}
      </motion.div>
    </div>
  );
});

/** Pulsating cyberpunk progress indicator */
const CyberProgressIndicator = memo(function CyberProgressIndicator() {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  const [glitchOffset, setGlitchOffset] = useState(0);

  // Progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const inc = prev < 30 ? 5 : prev < 70 ? 2 : prev < 90 ? 3 : 1;
        return Math.min(prev + inc, 100);
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Glitch jitter
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
      {/* Progress bar container */}
      <div
        className="relative h-3 bg-slate-900/80 overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          border: '1px solid rgba(0, 255, 255, 0.2)',
        }}
      >
        {/* Gradient fill */}
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

        {/* Internal scan line */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
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

      {/* Status line */}
      <div className="flex justify-between items-center mt-2">
        <motion.span
          className="font-mono text-[10px] text-cyan-500/40 tracking-wider"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ЗАГРУЗКА МОДУЛЕЙ{dots}
        </motion.span>
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

/** Corner bracket decorations */
const CornerBrackets = memo(function CornerBrackets() {
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

/** Main cyberpunk loading fallback component */
function CyberpunkLoadingFallback() {
  const [titleGlitch, setTitleGlitch] = useState(false);

  // Periodic title glitch effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.75) {
        setTitleGlitch(true);
        setTimeout(() => setTitleGlitch(false), 200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden pointer-events-none">
      {/* Matrix rain */}
      <MiniMatrixRain />

      {/* Scanlines */}
      <Scanlines />

      {/* CRT sweep line */}
      <SweepLine />

      {/* Blade Runner atmosphere */}
      <Atmosphere />

      {/* Particles */}
      <Particles />

      {/* Audio bars */}
      <AudioBars />

      {/* Hex dump */}
      <HexDump />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />

      {/* Corner decorations */}
      <CornerBrackets />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Cinematic bloom */}
        <div
          className="absolute inset-0 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.2) 0%, rgba(255, 140, 0, 0.06) 40%, transparent 60%)',
          }}
        />

        {/* Title — ЗАГРУЗКА ВОЛОДЬКИ */}
        <motion.h1
          className={`relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.12em] ${titleGlitch ? 'title-glitch' : ''}`}
          style={{
            textShadow: titleGlitch
              ? '-2px 0 #ff0000, 2px 0 #00ffff, 0 0 60px rgba(0, 255, 255, 0.6)'
              : '0 0 50px rgba(0, 255, 255, 0.5), 0 0 100px rgba(0, 255, 255, 0.3), 0 0 160px rgba(255, 140, 0, 0.08)',
          }}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500 neon-pulse-cyan">
            ВОЛОДЬКА
          </span>
        </motion.h1>

        {/* Title reflection */}
        <div
          className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.12em] pointer-events-none select-none -mt-1"
          style={{
            animation: 'neon-reflection 4s ease-in-out infinite',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
          }}
          aria-hidden
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/15 to-transparent">
            ВОЛОДЬКА
          </span>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-1 font-mono text-sm md:text-base tracking-[0.35em] uppercase"
          style={{
            background: 'linear-gradient(90deg, rgba(0,255,255,0.8), rgba(255,140,0,0.6), rgba(0,255,255,0.8))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ЗАГРУЗКА
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-5 mx-auto w-40 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), rgba(255, 140, 0, 0.3), transparent)',
          }}
        />

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8"
        >
          <CyberProgressIndicator />
        </motion.div>

        {/* Bottom version info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-14 font-mono text-[10px] text-cyan-500/25 tracking-wider"
        >
          v2.0.77 | MEMORIAL BUILD | УФА 1992—2026
        </motion.div>

        {/* System status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-cyan-500/40 font-mono text-xs"
          >
            ●
          </motion.span>
          <span className="font-mono text-[10px] text-cyan-500/30 tracking-widest uppercase">
            VOLodka.exe LOADING
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// Error boundary wrapper component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">💥</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Что-то пошло не так...
          </h1>
          <p className="text-slate-400 mb-6">
            {error?.message || 'Неизвестная ошибка'}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Перезапустить
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Main GameClient — just wraps GameOrchestrator with error boundary
export default function GameClient() {
  ensureThreeClientPrep();
  return (
    <ErrorBoundary>
      <FamilyWelcomeGate>
        <GameOrchestrator />
      </FamilyWelcomeGate>
    </ErrorBoundary>
  );
}
