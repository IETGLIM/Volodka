
/* ─── Volodka RPG – Epic RPG Main Menu (Enhanced) ─── */

import { memo, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { FilmGrain, CinematicBars } from '@/components/game/cinematic';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useMenuScreenActions, useMenuVisualToggles } from '@/store/selectors';
import { useSyncExternalStore } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { POEMS } from '@/data/poems';
import { audioEngine } from '@/engine/AudioEngine';
import { useTypewriter } from '@/hooks/useTypewriter';
import { CanvasMatrixRain } from './shared/CanvasMatrixRain';
import { validateSaveData } from '@/shared/validation/saveSchema';

const TOTAL_POEMS = POEMS.length;
const VERSION = '3.0.0';

// ============================================
// MENU ITEM DEFINITIONS
// ============================================

interface MenuItemDef {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
  accent?: string; // 'cyan' | 'magenta' | 'amber'
}

// ============================================
// MENU PARTICLES (Ambient floating + data streams)
// ============================================

const MenuParticles = memo(function MenuParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount guard to prevent hydration mismatch
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    const items: Array<{
      id: string;
      x: string;
      y: string;
      size: string;
      color: string;
      opacity: number;
      delay: string;
      duration: string;
      boxShadow: string;
      type: 'drift' | 'stream';
    }> = [];

    // 20 drifting particles (cyan, amber, white)
    for (let i = 0; i < 20; i++) {
      const color = i % 3 === 0 ? 'rgba(0, 229, 255, 0.7)'
        : i % 3 === 1 ? 'rgba(255, 171, 0, 0.6)'
        : 'rgba(255, 255, 255, 0.5)';
      const size = 1 + seededRand(i * 3 + 500) * 2;
      items.push({
        id: `md${i}`,
        x: (seededRand(i * 7 + 300) * 100).toFixed(2),
        y: (seededRand(i * 11 + 400) * 100).toFixed(2),
        size: size.toFixed(1),
        color,
        opacity: +(0.2 + seededRand(i * 5 + 600) * 0.3).toFixed(3),
        delay: (seededRand(i * 13 + 700) * 6).toFixed(2),
        duration: (8 + seededRand(i * 9 + 800) * 12).toFixed(1),
        boxShadow: `0 0 ${(size * 2).toFixed(1)}px ${color}`,
        type: 'drift',
      });
    }

    // 10 data stream particles (vertical moving cyan dots)
    for (let i = 0; i < 10; i++) {
      const size = 1 + seededRand(i * 19 + 1000) * 1.5;
      const color = 'rgba(0, 229, 255, 0.5)';
      items.push({
        id: `ms${i}`,
        x: (seededRand(i * 17 + 900) * 100).toFixed(2),
        y: '0',
        size: size.toFixed(1),
        color,
        opacity: +(0.15 + seededRand(i * 23 + 1100) * 0.15).toFixed(3),
        delay: (seededRand(i * 29 + 1200) * 10).toFixed(2),
        duration: (6 + seededRand(i * 31 + 1300) * 8).toFixed(1),
        boxShadow: `0 0 ${(size * 2).toFixed(1)}px ${color}`,
        type: 'stream',
      });
    }

    return items;
  }, []);

  // Don't render during SSR to avoid hydration mismatch with floating point CSS values
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {particles.map((p) => {
        if (p.type === 'stream') {
          return (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                boxShadow: p.boxShadow,
                animation: `menu-particle-stream ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
                ['--mp-opacity' as string]: p.opacity,
              }}
            />
          );
        }
        return (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              boxShadow: p.boxShadow,
              animation: `menu-particle-drift ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              ['--mp-opacity' as string]: p.opacity,
            }}
          />
        );
      })}
    </div>
  );
});

// ============================================
// CIRCUIT GRID LINES (Pulsing cyan grid background)
// ============================================

const CircuitGridLines = memo(function CircuitGridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
      {/* Horizontal grid lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`}
            stroke="rgba(0, 229, 255, 0.6)"
            strokeWidth="0.5"
            style={{ animation: `menu-circuit-grid ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={`${(i + 1) * 6}%`} y1="0" x2={`${(i + 1) * 6}%`} y2="100%"
            stroke="rgba(0, 229, 255, 0.4)"
            strokeWidth="0.5"
            style={{ animation: `menu-circuit-grid ${4 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </svg>
      {/* Circuit flow accent lines */}
      <div
        className="absolute left-0 right-0 h-px circuit-flow"
        style={{ top: '35%', opacity: 0.08 }}
      />
      <div
        className="absolute left-0 right-0 h-px circuit-flow"
        style={{ top: '65%', opacity: 0.06, animationDelay: '2s' }}
      />
    </div>
  );
});

// ============================================
// FULL-SCREEN SCAN LINE OVERLAY
// ============================================

const FullScreenScanLine = memo(function FullScreenScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[45]">
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, 0.08) 20%, rgba(0, 229, 255, 0.12) 50%, rgba(0, 229, 255, 0.08) 80%, transparent 100%)',
          boxShadow: '0 0 6px rgba(0, 229, 255, 0.05)',
          animation: 'menu-fullscan 8s linear infinite',
        }}
      />
    </div>
  );
});

// ============================================
// DECORATIVE CORNER ELEMENTS (Terminal brackets with blinking dots)
// ============================================

const TerminalCorners = memo(function TerminalCorners() {
  const corners = useMemo(() => [
    { pos: 'top-3 left-3', bracket: 'border-t border-l', dotPos: 'top-0 left-0' },
    { pos: 'top-3 right-3', bracket: 'border-t border-r', dotPos: 'top-0 right-0' },
    { pos: 'bottom-3 left-3', bracket: 'border-b border-l', dotPos: 'bottom-0 left-0' },
    { pos: 'bottom-3 right-3', bracket: 'border-b border-r', dotPos: 'bottom-0 right-0' },
  ], []);

  return (
    <>
      {corners.map((c, i) => (
        <div key={`corner-${i}`} className={`absolute ${c.pos} w-5 h-5 border-cyan-400/20 ${c.bracket} z-30 pointer-events-none`}>
          <div
            className={`absolute ${c.dotPos} w-1 h-1 rounded-full bg-cyan-400/60`}
            style={{
              boxShadow: '0 0 4px rgba(0, 229, 255, 0.4)',
              animation: `menu-corner-dot-blink ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        </div>
      ))}
    </>
  );
});

// ============================================
// FOG LAYERS
// ============================================

const FogLayers = memo(function FogLayers() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{ background: 'linear-gradient(to top, rgba(255, 120, 0, 0.1) 0%, transparent 100%)' }} />
      <motion.div className="absolute top-0 left-0 w-1/2 h-1/3" style={{ background: 'radial-gradient(ellipse, rgba(0, 255, 255, 0.06) 0%, transparent 70%)' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute top-0 right-0 w-1/3 h-1/3" style={{ background: 'radial-gradient(ellipse, rgba(255, 0, 128, 0.05) 0%, transparent 70%)' }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} />
    </div>
  );
});

// ============================================
// PARTICLES
// ============================================

import { seededRand } from '@/shared/utils/seededRand';

const ParticleSystem = memo(function ParticleSystem() {
  const particles = useMemo(() => {
    const embers = Array.from({ length: 40 }, (_, i) => {
      const x = (seededRand(i) * 100).toFixed(2);
      const delay = (seededRand(i + 60) * 8).toFixed(2);
      const duration = (4 + seededRand(i + 120) * 6).toFixed(2);
      const size = (1 + seededRand(i + 180) * 3).toFixed(1);
      const glow = (parseFloat(size) * 3).toFixed(1);
      const color = i % 3 === 0 ? 'rgba(255, 0, 128, 0.5)' : i % 3 === 1 ? 'rgba(255, 140, 0, 0.4)' : 'rgba(0, 255, 255, 0.5)';
      return { id: `e${i}`, x, delay, duration, size, glow, color, type: 'ember' as const };
    });
    const sparkles = Array.from({ length: 20 }, (_, i) => {
      const idx = i + 200;
      const x = (seededRand(idx) * 100).toFixed(2);
      const y = (seededRand(idx + 50) * 100).toFixed(2);
      const delay = (seededRand(idx + 100) * 12).toFixed(2);
      const duration = (6 + seededRand(idx + 150) * 8).toFixed(2);
      const size = (0.5 + seededRand(idx + 200) * 1.5).toFixed(1);
      const color = i % 2 === 0 ? 'rgba(0, 255, 255, 0.8)' : 'rgba(255, 200, 100, 0.7)';
      return { id: `s${i}`, x, y, delay, duration, size, color, type: 'sparkle' as const };
    });
    return [...embers, ...sparkles];
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => {
        if (p.type === 'sparkle') {
          return (
            <div key={p.id} className="absolute rounded-full" style={{
              left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`,
              background: p.color, boxShadow: `0 0 ${p.size}px ${p.color}`,
              animation: `sparkle-float ${p.duration}s ease-out infinite`, animationDelay: `${p.delay}s`,
            }} />
          );
        }
        return (
          <div key={p.id} className="absolute rounded-full" style={{
            left: `${p.x}%`, bottom: '-10px', width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, boxShadow: `0 0 ${p.glow}px ${p.color}`,
            animation: `ember-float ${p.duration}s ease-out infinite`, animationDelay: `${p.delay}s`,
          }} />
        );
      })}
    </div>
  );
});

// CINEMATIC BARS — see @/components/game/cinematic/CinematicBars

// ============================================
// GLITCH TITLE
// ============================================

function GlitchTitle({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    let outerTimer: ReturnType<typeof setTimeout> | undefined;
    let innerTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleGlitch = () => {
      const delay = 5000 + Math.random() * 3000;
      outerTimer = setTimeout(() => {
        if (cancelled) return;
        setGlitching(true);
        innerTimer = setTimeout(() => {
          if (cancelled) return;
          setGlitching(false);
          scheduleGlitch();
        }, 250);
      }, delay);
    };

    scheduleGlitch();

    return () => {
      cancelled = true;
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = ((e.clientX - cx) / cx) * 8;
      const y = ((e.clientY - cy) / cy) * 4;
      setParallaxOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="text-center">
      <div className="absolute inset-0 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.2) 0%, rgba(255, 140, 0, 0.06) 40%, transparent 60%)' }} />

      <motion.h1
        className={`relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest menu-glitch-title glitch-text-hover ${glitching ? 'title-glitch glitch-skew' : ''} ${glitching ? 'menu-glitch-color-shift' : ''}`}
        data-text={text}
        style={{
          textShadow: glitching
            ? '-2px 0 #ff0000, 2px 0 #00ffff, 0 0 80px rgba(0, 255, 255, 0.6)'
            : '0 0 60px rgba(0, 255, 255, 0.5), 0 0 120px rgba(0, 255, 255, 0.3), 0 0 200px rgba(255, 140, 0, 0.1)',
          transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
          transition: 'transform 0.3s ease-out',
        }}
        initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500 menu-title-breathe neon-text-cyan">
          {text}
        </span>
      </motion.h1>

      <div
        className="relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest pointer-events-none select-none -mt-2"
        style={{
          animation: 'neon-reflection 4s ease-in-out infinite',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 35%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 35%)',
        }}
        aria-hidden
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/20 to-transparent">{text}</span>
      </div>
    </div>
  );
}

// ============================================
// TYPEWRITER SUBTITLE
// ============================================

function TypewriterSubtitle({ text, delay = 0 }: { text: string; delay?: number }) {
  // Wait for delay before starting typewriter (title animation must complete first)
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  const { displayed, done } = useTypewriter(started ? text : '', 35);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`mt-3 font-mono text-base md:text-lg tracking-[0.4em] uppercase ${done && started ? 'typing-cursor' : ''}`}
      style={{
        background: 'linear-gradient(90deg, rgba(0,255,255,0.8), rgba(255,140,0,0.6), rgba(0,255,255,0.8))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: 'none',
      }}
    >
      {displayed}
      <span
        className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
        style={{
          backgroundColor: done || !started ? 'transparent' : 'rgba(0, 255, 255, 0.8)',
          animation: done || !started ? 'none' : 'boot-cursor 0.8s step-end infinite',
        }}
      />
    </motion.div>
  );
}

// ============================================
// PULSING VIGNETTE
// ============================================

const PulsingVignette = memo(function PulsingVignette() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-30"
      animate={{
        background: [
          'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.75) 100%)',
          'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.85) 100%)',
          'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.75) 100%)',
        ],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
});

// ============================================
// ATMOSPHERIC CAMERA PAN
// ============================================

const AtmosphericPan = memo(function AtmosphericPan() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute"
        style={{
          width: '120%', height: '120%', top: '-10%', left: '-10%',
          background: 'radial-gradient(ellipse at 30% 50%, rgba(0,255,255,0.03) 0%, transparent 50%)',
        }}
        animate={{ x: ['-5%', '5%', '-5%'], y: ['-3%', '3%', '-3%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          width: '120%', height: '120%', top: '-10%', left: '-10%',
          background: 'radial-gradient(ellipse at 70% 40%, rgba(255,140,0,0.02) 0%, transparent 50%)',
        }}
        animate={{ x: ['3%', '-3%', '3%'], y: ['2%', '-2%', '2%'] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
    </div>
  );
});

// FILM GRAIN — see @/components/game/cinematic/FilmGrain

// ============================================
// ASCII ART DECORATION
// ============================================

const AsciiDecoration = memo(function AsciiDecoration() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.12 }}
      transition={{ delay: 2.5, duration: 2 }}
      className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 pointer-events-none hidden md:block"
    >
      <pre
        className="font-mono text-[6px] md:text-[8px] leading-tight text-cyan-400"
        style={{
          textShadow: '0 0 4px rgba(0, 255, 255, 0.3)',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        }}
      >
{`  ╔═══════════╗
  ║  ▓▓▓▓▓▓  ║
  ║  ▓  ◈  ▓  ║
  ║  ▓▓▓▓▓▓  ║
  ╠═══════════╣
  ║ VOL0DKA  ║
  ║ SYS://0x ║
  ║ ───────── ║
  ║ > RUN_   ║
  ║ > POEM   ║
  ║ > WAIT_  ║
  ╚═══════════╝`}
      </pre>
    </motion.div>
  );
});

// ============================================
// DATA STREAM DECORATION (left side)
// ============================================

const DataStream = memo(function DataStream() {
  const lines = useMemo(() => {
    const items = [
      'SYS:INIT_OK',
      'MEM:0xFF00',
      'NET:CONNECTED',
      'POEM:LOADED',
      'SCENE:READY',
      'NPC:ACTIVE',
      'CODE:COMPILED',
      'BUF:CLEAR',
    ];
    return items;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 0.08, x: 0 }}
      transition={{ delay: 2, duration: 1.5 }}
      className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 pointer-events-none hidden md:block"
    >
      <div className="flex flex-col gap-1">
        {lines.map((line, i) => (
          <motion.span
            key={line}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 + i * 0.15, duration: 0.4 }}
            className="font-mono text-[7px] md:text-[9px] tracking-wider text-cyan-400"
            style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
          >
            <span className="text-amber-500/60">{'>'}</span> {line}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
});

// ============================================
// ABOUT PANEL
// ============================================

function AboutPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4 border border-cyan-500/20 bg-black/90 backdrop-blur-md overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-red-500/80" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://about</span>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-xl font-mono tracking-wider text-cyan-300/90">Об авторе</h2>

          <div className="space-y-3 text-sm text-slate-300/80 font-mono leading-relaxed">
            <p>
              <span className="text-cyan-400/70">&gt;</span> ВОЛОДЬКА — это интерактивная поэтическая RPG, где код встречается со стихами в городе, который никогда не спит.
            </p>
            <p>
              <span className="text-amber-400/70">&gt;</span> Игра вдохновлена поэзией Владимира Лебедева — программиста, который видел красоту в строчках кода и в строчках стихов.
            </p>
            <p>
              <span className="text-fuchsia-400/70">&gt;</span> Каждый персонаж — это метафора. Каждая сцена — строфа. Каждый выбор — рифма.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/50">
            <p className="font-serif text-xs italic text-slate-400/50 leading-relaxed">
              &ldquo;Между сменами — сказка. Между строками — правда.&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="font-mono text-[9px] text-slate-600 tracking-wide">v{VERSION}</span>
            <span className="text-slate-700 text-[8px]">|</span>
            <span className="font-mono text-[9px] text-slate-600 tracking-wide">Next.js + Three.js</span>
            <span className="text-slate-700 text-[8px]">|</span>
            <span className="font-mono text-[9px] text-slate-600 tracking-wide">Procedural Audio</span>
          </div>
        </div>

        {/* Close button */}
        <div className="border-t border-cyan-500/10 px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider border border-cyan-500/25 hover:border-cyan-400/50 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300/70 hover:text-cyan-200 transition-all"
          >
            Закрыть [ESC]
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// SYSTEM STATUS READOUT (Top-left cycling data)
// ============================================

const SYSTEM_MESSAGES = ['SYS:ONLINE', 'MEM:OK', 'NET:READY', 'SCENE:ACTIVE'] as const;

const SystemStatusReadout = memo(function SystemStatusReadout() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % SYSTEM_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.5, duration: 0.8 }}
      className="absolute top-8 left-8 z-30 pointer-events-none flex items-center gap-2"
    >
      <span
        className="font-mono text-[8px] tracking-[0.15em] text-cyan-400/30 type-cursor"
        style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
      >
        {SYSTEM_MESSAGES[msgIndex]}
      </span>
    </motion.div>
  );
});

// ============================================
// MENU SCREEN (MAIN EXPORT)
// ============================================

export function MenuScreen() {
  const { setMode, loadGame, resetGame, musicEnabled, toggleMusic } = useMenuScreenActions();
  const reduceMotion = useReducedMotion();

  const hasSave = useSyncExternalStore(
    () => () => {},
    () => !!localStorage.getItem('volodka_save'),
    () => false,
  );

  // ── Panel states ──
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // ── Keyboard navigation ──
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItemDef[] = useMemo(() => [
    { id: 'new', label: 'Новая игра', icon: '▶', accent: 'cyan' },
    { id: 'continue', label: 'Продолжить', icon: '▸', disabled: !hasSave, accent: 'emerald' },
    { id: 'settings', label: 'Настройки', icon: '⚙', accent: 'amber' },
    { id: 'about', label: 'Об авторе', icon: '◈', accent: 'magenta' },
  ], [hasSave]);

  // ── Handlers ──
  const handleNewGame = useCallback(() => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    audioEngine.playSfx('confirm');
    // After fade animation, reset game state and show the cinematic intro
    setTimeout(() => {
      try {
        resetGame();
      } catch (e) {
        console.warn('[MenuScreen] resetGame error:', e);
      }
      // Go to intro mode — the cinematic intro will play, then auto-transition
      // to exploration with the first story node. Previously this skipped
      // the intro entirely which removed the narrative experience.
      const store = useGameStore.getState();
      store.setCurrentNodeId('start');
      store.setIntroSeen(false);
      store.setMode('intro');
    }, 800);
  }, [resetGame, isFadingOut]);

  const handleContinue = useCallback(() => {
    if (!hasSave) return;
    audioEngine.playSfx('confirm');
    loadGame();
  }, [loadGame, hasSave]);

  const handleSettings = useCallback(() => {
    audioEngine.playSfx('ui_open');
    setShowSettings(true);
  }, []);

  const handleAbout = useCallback(() => {
    audioEngine.playSfx('ui_open');
    setShowAbout(true);
  }, []);

  const handleMenuAction = useCallback((id: string) => {
    switch (id) {
      case 'new': handleNewGame(); break;
      case 'continue': handleContinue(); break;
      case 'settings': handleSettings(); break;
      case 'about': handleAbout(); break;
    }
  }, [handleNewGame, handleContinue, handleSettings, handleAbout]);

  // ── Keyboard navigation (arrow keys + Enter) ──
  useEffect(() => {
    const enabledItems = menuItems.filter(item => !item.disabled);
    const enabledIndices = menuItems.map((item, i) => !item.disabled ? i : -1).filter(i => i >= 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if panels are open
      if (showAbout || showSettings) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW': {
          e.preventDefault();
          const currentEnabledIdx = enabledIndices.indexOf(selectedIndex);
          const prevEnabledIdx = currentEnabledIdx > 0 ? currentEnabledIdx - 1 : enabledIndices.length - 1;
          const newIdx = enabledIndices[prevEnabledIdx];
          setSelectedIndex(newIdx);
          audioEngine.playSfx('click');
          break;
        }
        case 'ArrowDown':
        case 'KeyS': {
          e.preventDefault();
          const currentEnabledIdx2 = enabledIndices.indexOf(selectedIndex);
          const nextEnabledIdx = currentEnabledIdx2 < enabledIndices.length - 1 ? currentEnabledIdx2 + 1 : 0;
          const newIdx2 = enabledIndices[nextEnabledIdx];
          setSelectedIndex(newIdx2);
          audioEngine.playSfx('click');
          break;
        }
        case 'Enter':
        case 'Space': {
          e.preventDefault();
          if (!menuItems[selectedIndex]?.disabled) {
            handleMenuAction(menuItems[selectedIndex]?.id ?? '');
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, menuItems, handleMenuAction, showAbout, showSettings]);

  // ── Get accent color for menu item ──
  const getAccentColors = (accent?: string, isSelected?: boolean) => {
    switch (accent) {
      case 'cyan': return {
        border: isSelected ? 'border-cyan-400/70' : 'border-cyan-500/30',
        borderHover: 'hover:border-cyan-400/80',
        bg: isSelected ? 'bg-cyan-900/40' : 'bg-cyan-950/30',
        bgHover: 'hover:bg-cyan-900/50',
        text: isSelected ? 'text-cyan-100' : 'text-cyan-300/90',
        textHover: 'hover:text-cyan-100',
        glow: isSelected ? '0 0 20px rgba(0, 255, 255, 0.15), inset 0 0 15px rgba(0, 255, 255, 0.08)' : '0 0 8px rgba(0, 255, 255, 0.1)',
        glowHover: 'inset 0 0 30px rgba(0, 255, 255, 0.2), 0 0 25px rgba(0, 255, 255, 0.15)',
        scanColor: 'rgba(0, 255, 255, 0.08)',
      };
      case 'emerald': return {
        border: isSelected ? 'border-emerald-400/70' : 'border-emerald-500/25',
        borderHover: 'hover:border-emerald-400/50',
        bg: isSelected ? 'bg-emerald-900/30' : 'bg-emerald-950/20',
        bgHover: 'hover:bg-emerald-900/30',
        text: isSelected ? 'text-emerald-100' : 'text-emerald-300/80',
        textHover: 'hover:text-emerald-100',
        glow: isSelected ? '0 0 15px rgba(52, 211, 153, 0.12), inset 0 0 10px rgba(52, 211, 153, 0.06)' : 'none',
        glowHover: 'inset 0 0 20px rgba(52, 211, 153, 0.1), 0 0 15px rgba(52, 211, 153, 0.08)',
        scanColor: 'rgba(52, 211, 153, 0.06)',
      };
      case 'amber': return {
        border: isSelected ? 'border-amber-400/60' : 'border-amber-500/25',
        borderHover: 'hover:border-amber-400/50',
        bg: isSelected ? 'bg-amber-900/25' : 'bg-amber-950/15',
        bgHover: 'hover:bg-amber-900/25',
        text: isSelected ? 'text-amber-100' : 'text-amber-300/70',
        textHover: 'hover:text-amber-100',
        glow: isSelected ? '0 0 15px rgba(251, 191, 36, 0.1), inset 0 0 10px rgba(251, 191, 36, 0.05)' : 'none',
        glowHover: 'inset 0 0 20px rgba(251, 191, 36, 0.1), 0 0 15px rgba(251, 191, 36, 0.08)',
        scanColor: 'rgba(251, 191, 36, 0.06)',
      };
      case 'magenta': return {
        border: isSelected ? 'border-fuchsia-400/60' : 'border-fuchsia-500/25',
        borderHover: 'hover:border-fuchsia-400/50',
        bg: isSelected ? 'bg-fuchsia-900/20' : 'bg-fuchsia-950/15',
        bgHover: 'hover:bg-fuchsia-900/25',
        text: isSelected ? 'text-fuchsia-100' : 'text-fuchsia-300/70',
        textHover: 'hover:text-fuchsia-100',
        glow: isSelected ? '0 0 15px rgba(217, 70, 239, 0.1), inset 0 0 10px rgba(217, 70, 239, 0.05)' : 'none',
        glowHover: 'inset 0 0 20px rgba(217, 70, 239, 0.1), 0 0 15px rgba(217, 70, 239, 0.08)',
        scanColor: 'rgba(217, 70, 239, 0.06)',
      };
      default: return {
        border: 'border-cyan-500/30',
        borderHover: 'hover:border-cyan-400/80',
        bg: 'bg-cyan-950/30',
        bgHover: 'hover:bg-cyan-900/50',
        text: 'text-cyan-300/90',
        textHover: 'hover:text-cyan-100',
        glow: 'none',
        glowHover: 'inset 0 0 30px rgba(0, 255, 255, 0.2), 0 0 25px rgba(0, 255, 255, 0.15)',
        scanColor: 'rgba(0, 255, 255, 0.08)',
      };
    }
  };

  return (
    <div className="game-critical-motion digital-noise fixed inset-0 h-[100dvh] min-h-[100dvh] w-full bg-black overflow-hidden overscroll-none" style={{ zIndex: UI_LAYERS.LOADING }}>
      {/* Atmospheric camera pan layer */}
      <AtmosphericPan />

      {/* Circuit grid lines background */}
      <CircuitGridLines />

      <CanvasMatrixRain opacity={0.25} charOpacity={0.8} chars='アイウエオカキクケコ0123456789ABCDEF' />

      {/* Ambient menu particles */}
      <MenuParticles />

      {/* Film grain overlay */}
      <FilmGrain opacity={0.035} zIndex={49} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-50" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.07) 2px, rgba(0, 0, 0, 0.07) 4px)' }} />

      {/* Full-screen scan line overlay (8s sweep) */}
      <FullScreenScanLine />

      {/* CRT sweep */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        <motion.div className="absolute left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0, 255, 255, 0.15) 30%, rgba(0, 255, 255, 0.2) 50%, rgba(0, 255, 255, 0.15) 70%, transparent 95%)', boxShadow: '0 0 20px rgba(0, 255, 255, 0.12), 0 -4px 12px rgba(0, 255, 255, 0.04)', willChange: 'transform' }} animate={{ y: ['0vh', '100vh'] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
      </div>

      <FogLayers />
      <ParticleSystem />

      {/* CSS particle dust field */}
      <div className="menu-dust-field" />

      <CinematicBars />

      {/* Pulsing vignette overlay */}
      <PulsingVignette />

      {/* Atmospheric fog/vignette depth overlay */}
      <div className="menu-vignette-overlay" />

      {/* ASCII art decorations */}
      <AsciiDecoration />
      <DataStream />

      {/* Terminal corner decorations */}
      <TerminalCorners />

      {/* Corner data readout — top-left cycling system status */}
      <SystemStatusReadout />

      {/* Content */}
      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
        <GlitchTitle text="ВОЛОДЬКА" />

        {/* Subtitle with typewriter effect */}
        <TypewriterSubtitle text="сказка между сменами" delay={1.0} />

        {/* "Стихи Владимира Лебедева" subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 2.5, duration: 1.2 }}
          className="mt-2 font-serif text-xs md:text-sm tracking-[0.2em] italic text-slate-400/60"
        >
          Стихи Владимира Лебедева
        </motion.p>

        {/* Dedication */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0, duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-4 flex flex-col items-center gap-2"
        >
          <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 180, 160, 0.3), transparent)' }} />
          <p
            className="font-serif text-xs sm:text-sm md:text-base tracking-[0.15em] italic dedication-glow"
            style={{
              fontFamily: '"Georgia", "Times New Roman", "Palatino", serif',
              color: 'rgba(210, 195, 180, 0.75)',
              textShadow: '0 0 20px rgba(210, 195, 180, 0.15), 0 0 40px rgba(210, 195, 180, 0.08)',
            }}
          >
            Памяти Владимира Лебедева
          </p>
          <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 180, 160, 0.3), transparent)' }} />
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
          className="mt-6 mx-auto w-48 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.6), rgba(255, 140, 0, 0.4), transparent)' }}
        />

        {/* Menu items in terminal frame */}
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="mt-8 w-full max-w-xs"
        >
          <div
            className="relative border border-cyan-500/20 bg-black/60 backdrop-blur-md overflow-hidden hex-grid-bg menu-corner-brackets"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.05), inset 0 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Corner bracket pair (complements ::before/::after on parent) */}
            <div className="menu-corner-bracket-pair" />

            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
              <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/30">
                volodka://main
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3">
              {menuItems.map((item, i) => {
                const colors = getAccentColors(item.accent, selectedIndex === i);
                const isDisabled = item.disabled;
                const isSelected = selectedIndex === i && !isDisabled;

                return (
                  <motion.button
                    key={item.id}
                    data-testid={item.id === 'new' ? 'menu-new-game' : undefined}
                    onClick={() => {
                      if (!isDisabled) handleMenuAction(item.id);
                    }}
                    onTouchStart={(e) => {
                      if (!isDisabled) {
                        e.preventDefault();
                        handleMenuAction(item.id);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!isDisabled) {
                        setSelectedIndex(i);
                        audioEngine.playSfx('click');
                      }
                    }}
                    whileHover={!isDisabled ? { scale: 1.02, x: 4 } : undefined}
                    whileTap={!isDisabled ? { scale: 0.97 } : undefined}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 2.0 + i * 0.12,
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    disabled={isDisabled}
                    className={`
                      group relative w-full px-5 py-3.5 font-mono text-base uppercase tracking-wider
                      border ${colors.border} ${!isDisabled ? colors.borderHover : ''}
                      ${colors.bg} ${!isDisabled ? colors.bgHover : ''}
                      ${colors.text} ${!isDisabled ? colors.textHover : ''}
                      rounded transition-all duration-300 overflow-hidden
                      ${!isDisabled ? 'menu-btn-enhanced menu-btn-signal-line ripple-out' : ''}
                      ${isDisabled ? 'opacity-30 cursor-not-allowed menu-btn-disabled' : 'cursor-pointer'}
                      touch-manipulation select-none
                    `}
                  >
                    {/* Selection indicator (keyboard nav) — accent bar with breathing glow */}
                    {isSelected && (
                      <motion.div
                        layoutId="menu-selection-indicator"
                        className="absolute left-0 top-0 bottom-0 rounded-l"
                        style={{
                          width: '3px',
                          background: item.accent === 'cyan' ? 'rgba(0, 255, 255, 0.8)'
                            : item.accent === 'emerald' ? 'rgba(52, 211, 153, 0.8)'
                            : item.accent === 'amber' ? 'rgba(251, 191, 36, 0.8)'
                            : 'rgba(217, 70, 239, 0.8)',
                          boxShadow: `0 0 8px ${item.accent === 'cyan' ? 'rgba(0, 255, 255, 0.5)'
                            : item.accent === 'emerald' ? 'rgba(52, 211, 153, 0.5)'
                            : item.accent === 'amber' ? 'rgba(251, 191, 36, 0.5)'
                            : 'rgba(217, 70, 239, 0.5)'}, 0 0 16px ${item.accent === 'cyan' ? 'rgba(0, 255, 255, 0.25)'
                            : item.accent === 'emerald' ? 'rgba(52, 211, 153, 0.25)'
                            : item.accent === 'amber' ? 'rgba(251, 191, 36, 0.25)'
                            : 'rgba(217, 70, 239, 0.25)'}`,
                          animation: 'menu-accent-bar-breathe 2s ease-in-out infinite',
                          ['--accent-glow' as string]: item.accent === 'cyan' ? 'rgba(0, 255, 255, 0.4)'
                            : item.accent === 'emerald' ? 'rgba(52, 211, 153, 0.4)'
                            : item.accent === 'amber' ? 'rgba(251, 191, 36, 0.4)'
                            : 'rgba(217, 70, 239, 0.4)',
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Hover left border indicator — slides in on hover (2px bar, cyan) */}
                    {!isDisabled && !isSelected && (
                      <div
                        className="absolute left-0 top-1/4 bottom-1/4 rounded-l opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{
                          width: '0px',
                          background: item.accent === 'cyan' ? 'rgba(0, 255, 255, 0.7)'
                            : item.accent === 'emerald' ? 'rgba(52, 211, 153, 0.7)'
                            : item.accent === 'amber' ? 'rgba(251, 191, 36, 0.7)'
                            : 'rgba(217, 70, 239, 0.7)',
                          boxShadow: `0 0 6px ${item.accent === 'cyan' ? 'rgba(0, 255, 255, 0.4)'
                            : item.accent === 'emerald' ? 'rgba(52, 211, 153, 0.4)'
                            : item.accent === 'amber' ? 'rgba(251, 191, 36, 0.4)'
                            : 'rgba(217, 70, 239, 0.4)'}`,
                          animation: 'group-hover:menu-hover-indicator-in 0.3s ease-out forwards',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.width = '3px'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.width = '0px'; }}
                      />
                    )}

                    {/* Hover shimmer sweep — diagonal gradient one-shot */}
                    {!isDisabled && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(45deg, transparent 30%, rgba(0, 229, 255, 0.06) 50%, transparent 70%)',
                            backgroundSize: '300% 300%',
                            animation: 'menu-hover-shimmer 0.8s ease-out forwards',
                          }}
                        />
                      </div>
                    )}

                    {/* Glow ring for "Новая игра" */}
                    {item.id === 'new' && (
                      <div className="absolute inset-0 pointer-events-none rounded new-game-pulse" style={{ boxShadow: '0 0 8px rgba(0, 255, 255, 0.15), inset 0 0 12px rgba(0, 255, 255, 0.05)' }} />
                    )}

                    {/* Hover glow effect */}
                    {!isDisabled && (
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: colors.glowHover }}
                      />
                    )}

                    {/* Scan-line pass on hover */}
                    {!isDisabled && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute left-0 right-0 h-3 -top-3 group-hover:top-full"
                          style={{
                            background: `linear-gradient(180deg, transparent, ${colors.scanColor}, transparent)`,
                            transition: 'top 1.5s ease-in-out',
                          }}
                        />
                      </div>
                    )}

                    {/* Animated scan-line sweep for selected item */}
                    {isSelected && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: '30%',
                            background: `linear-gradient(180deg, transparent 0%, ${colors.scanColor} 40%, ${colors.scanColor} 60%, transparent 100%)`,
                            animation: 'menu-item-scan-sweep 3s ease-in-out infinite',
                          }}
                        />
                      </div>
                    )}

                    {/* Holographic flicker for "Новая игра" */}
                    {item.id === 'new' && (
                      <div className="absolute inset-0 pointer-events-none holo-flicker" style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.1)' }} />
                    )}

                    {/* Subtle gradient background that shifts on hover */}
                    {!isDisabled && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${colors.scanColor} 0%, transparent 50%, ${colors.scanColor} 100%)`,
                        }}
                      />
                    )}

                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span className={isSelected ? 'opacity-100' : 'opacity-60'}>{item.icon}</span>
                      <span>{item.label}</span>
                      {isDisabled && (
                        <span className="ml-2 text-[9px] text-slate-500/50 normal-case tracking-normal menu-continue-dots">нет сохранения</span>
                      )}
                    </span>

                    {/* Save metadata preview for Continue — enhanced with emerald glow indicator */}
                    {item.id === 'continue' && hasSave && (() => {
                      try {
                        const raw = localStorage.getItem('volodka_save');
                        if (!raw) return null;
                        const validation = validateSaveData(raw);
                        if (!validation.success) return null;
                        const data = validation.data;
                        const ps = data.playerState;
                        const expl = data.exploration;
                        const SCENE_LABELS: Record<string, string> = { volodka_room: 'Комната', volodka_corridor: 'Коридор', street_night: 'Улица', cafe_evening: 'Кафе', office_day: 'Офис', park_day: 'Парк', library_day: 'Библиотека' };
                        const sceneName = expl?.currentSceneId
                          ? SCENE_LABELS[expl.currentSceneId] ?? expl.currentSceneId
                          : '';
                        return (
                          <span className="relative z-10 flex items-center justify-center gap-1.5 mt-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80 continue-emerald-indicator" />
                            <span className="text-[11px] text-emerald-400/70 font-mono tracking-wide">
                              Ур.{ps.progression.level} • {sceneName} • 📖 {data.collectedPoems.length}/{TOTAL_POEMS}
                            </span>
                          </span>
                        );
                      } catch { return null; }
                    })()}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Controls hint — enhanced readability with cyan glow keys */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
        >
          <span className="text-[10px] text-slate-400/70 font-mono tracking-wide">
            <span className="text-cyan-400/60" style={{ textShadow: '0 0 6px rgba(0, 229, 255, 0.25)' }}>↑↓</span> Навигация
          </span>
          <span className="text-slate-600/40 text-[8px]">|</span>
          <span className="text-[10px] text-slate-400/70 font-mono tracking-wide">
            <span className="text-cyan-400/60" style={{ textShadow: '0 0 6px rgba(0, 229, 255, 0.25)' }}>Enter</span> Выбрать
          </span>
          <span className="text-slate-600/40 text-[8px]">|</span>
          <span className="text-[10px] text-slate-400/70 font-mono tracking-wide">
            <span className="text-cyan-400/60" style={{ textShadow: '0 0 6px rgba(0, 229, 255, 0.25)' }}>F1</span> Справка
          </span>
          <span className="text-slate-600/40 text-[8px]">|</span>
          <span className="text-[10px] text-slate-400/70 font-mono tracking-wide">
            <span className="text-cyan-400/60" style={{ textShadow: '0 0 6px rgba(0, 229, 255, 0.25)' }}>WASD</span> Движение
          </span>
          <span className="text-slate-600/40 text-[8px]">|</span>
          <span className="text-[10px] text-slate-400/70 font-mono tracking-wide">
            <span className="text-cyan-400/60" style={{ textShadow: '0 0 6px rgba(0, 229, 255, 0.25)' }}>E</span> Взаимодействие
          </span>
        </motion.div>

        {/* Music hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 4, duration: 1.5 }}
          className="mt-2 flex items-center gap-1.5"
        >
          <span className="text-[8px] font-mono text-slate-500/40 tracking-wide">♫ Процедурная музыка</span>
          <span className="text-slate-700/30 text-[7px]">•</span>
          <span className="text-[8px] font-mono text-slate-500/40 tracking-wide">Web Audio API</span>
        </motion.div>
      </div>

      {/* Ambient sound toggle — top-right */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        onClick={toggleMusic}
        className="absolute top-8 right-8 z-30 flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-500/20 bg-black/40 backdrop-blur-sm hover:border-cyan-400/40 transition-colors group"
        aria-label={musicEnabled ? 'Выключить звук' : 'Включить звук'}
        title={musicEnabled ? 'Выключить звук' : 'Включить звук'}
      >
        {musicEnabled ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400/60 group-hover:text-cyan-300 transition-colors">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500/60 group-hover:text-slate-400 transition-colors">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
        <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-500/40 group-hover:text-cyan-400/60 transition-colors">
          {musicEnabled ? 'on' : 'off'}
        </span>
      </motion.button>

      {/* Music toggle button — bottom-right corner */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.4, ease: 'easeOut' }}
        onClick={() => {
          toggleMusic();
          audioEngine.playSfx('click');
        }}
        className={`absolute bottom-4 right-4 z-50 pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-sm border backdrop-blur-md transition-all duration-300 group ${musicEnabled ? 'music-toggle-btn border-cyan-500/30 bg-black/50' : 'music-toggle-btn music-toggle-btn-muted border-slate-600/25 bg-black/40'}`}
        aria-label={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
        title={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
        whileTap={{ scale: 0.92 }}
      >
        {musicEnabled ? (
          <Volume2 className="w-4 h-4 text-cyan-400/70 group-hover:text-cyan-300 transition-colors" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-500/60 group-hover:text-slate-400 transition-colors" />
        )}
        <span className={`font-mono text-[9px] uppercase tracking-widest transition-colors ${musicEnabled ? 'text-cyan-500/50 group-hover:text-cyan-400/70' : 'text-slate-500/40 group-hover:text-slate-400/60'}`}>
          ♪ {musicEnabled ? 'ON' : 'OFF'}
        </span>
      </motion.button>

      {/* Version info — bottom-right cyberpunk tag with glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2"
      >
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 border border-cyan-500/15 bg-black/40 backdrop-blur-sm rounded-sm menu-version-tag breathe-glow-soft"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
          }}
        >
          <span
            className="font-mono text-[10px] tracking-[0.15em] text-cyan-400/50"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
            }}
          >
            v{VERSION}
          </span>
          <span className="w-px h-2.5 bg-cyan-500/20" />
          <span
            className="font-mono text-[8px] tracking-[0.1em] text-slate-500/40"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
            }}
          >
            build.2025
          </span>
        </div>
        <span
          className="font-mono text-[7px] tracking-[0.15em] text-slate-600/30"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
          }}
        >
          Z.AI ENGINE
        </span>
      </motion.div>

      {/* Copyright / credit — bottom-left with enhanced footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 3 }}
        className="absolute bottom-6 left-6 z-30 flex flex-col items-start gap-1.5"
      >
        <div className="w-24 h-px" style={{ background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.25), rgba(255, 171, 0, 0.15), transparent)' }} />
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-cyan-400/60 menu-footer-dot" style={{ boxShadow: '0 0 3px rgba(0, 229, 255, 0.4)' }} />
          <span
            className="font-mono text-[8px] tracking-[0.1em] text-cyan-500/35"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
            }}
          >
            volodka://main
          </span>
        </div>
        <span
          className="font-serif text-[10px] text-slate-500/30 tracking-wider italic"
        >
          © Владимир Лебедев
        </span>
      </motion.div>

      {/* Corner decorations */}
      <motion.div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-cyan-500/15 z-30" animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/15 z-30" animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
      <motion.div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-amber-500/10 z-30" animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
      <motion.div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-amber-500/10 z-30" animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} />

      {/* About panel overlay */}
      <AnimatePresence>
        {showAbout && <AboutPanel onClose={() => { setShowAbout(false); audioEngine.playSfx('ui_close'); }} />}
      </AnimatePresence>

      {/* Settings panel — reuse the existing one via the store */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[60]"
            onClick={() => { setShowSettings(false); audioEngine.playSfx('ui_close'); }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-80 bg-slate-950/95 border border-cyan-500/20 backdrop-blur-md overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                boxShadow: '0 0 40px rgba(0, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                <span className="h-2 w-2 rounded-full bg-red-500/80" />
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://settings</span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-slate-100 mb-1 font-mono tracking-wide">НАСТРОЙКИ</h2>

                {/* Music toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 font-mono">Музыка</span>
                  <button
                    onClick={() => {
                      toggleMusic();
                      audioEngine.playSfx('click');
                    }}
                    className={`px-3 py-1.5 text-xs font-mono border rounded transition-all ${
                      musicEnabled
                        ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
                        : 'border-slate-700/40 bg-slate-900/30 text-slate-500'
                    }`}
                  >
                    {musicEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                  </button>
                </div>

                {/* Matrix rain toggle */}
                <MatrixRainToggle />

                {/* Noir mode toggle */}
                <NoirModeToggle />

                {/* Controls reference */}
                <div className="pt-3 border-t border-slate-800/50 space-y-1.5">
                  <p className="text-[10px] font-mono text-slate-500 tracking-wide uppercase mb-2">Управление</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <span className="text-[10px] font-mono text-cyan-500/50">WASD</span>
                    <span className="text-[10px] font-mono text-slate-400/50">Движение</span>
                    <span className="text-[10px] font-mono text-cyan-500/50">E</span>
                    <span className="text-[10px] font-mono text-slate-400/50">Взаимодействие</span>
                    <span className="text-[10px] font-mono text-cyan-500/50">I / Tab</span>
                    <span className="text-[10px] font-mono text-slate-400/50">Инвентарь</span>
                    <span className="text-[10px] font-mono text-cyan-500/50">Q</span>
                    <span className="text-[10px] font-mono text-slate-400/50">Квесты</span>
                    <span className="text-[10px] font-mono text-cyan-500/50">P</span>
                    <span className="text-[10px] font-mono text-slate-400/50">Стихи</span>
                    <span className="text-[10px] font-mono text-cyan-500/50">ESC</span>
                    <span className="text-[10px] font-mono text-slate-400/50">Пауза</span>
                  </div>
                </div>
              </div>

              {/* Close */}
              <div className="border-t border-cyan-500/10 px-4 py-3 flex justify-end">
                <button
                  onClick={() => { setShowSettings(false); audioEngine.playSfx('ui_close'); }}
                  className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider border border-cyan-500/25 hover:border-cyan-400/50 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300/70 hover:text-cyan-200 transition-all"
                >
                  Закрыть [ESC]
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade-to-black transition overlay when starting new game */}
      <AnimatePresence>
        {isFadingOut && (
          <motion.div
            key="menu-fadeout"
            className="fixed inset-0 bg-black z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SETTINGS TOGGLE HELPER COMPONENTS
// ============================================

function MatrixRainToggle() {
  const { matrixRainEnabled, toggleMatrixRain } = useMenuVisualToggles();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300 font-mono">Матричный дождь</span>
      <button
        onClick={() => {
          toggleMatrixRain();
          audioEngine.playSfx('click');
        }}
        className={`px-3 py-1.5 text-xs font-mono border rounded transition-all ${
          matrixRainEnabled
            ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
            : 'border-slate-700/40 bg-slate-900/30 text-slate-500'
        }`}
      >
        {matrixRainEnabled ? 'ВКЛ' : 'ВЫКЛ'}
      </button>
    </div>
  );
}

function NoirModeToggle() {
  const { noirMode, toggleNoirMode } = useMenuVisualToggles();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300 font-mono">Нуар-режим</span>
      <button
        onClick={() => {
          toggleNoirMode();
          audioEngine.playSfx('click');
        }}
        className={`px-3 py-1.5 text-xs font-mono border rounded transition-all ${
          noirMode
            ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
            : 'border-slate-700/40 bg-slate-900/30 text-slate-500'
        }`}
      >
        {noirMode ? 'ВКЛ' : 'ВЫКЛ'}
      </button>
    </div>
  );
}
