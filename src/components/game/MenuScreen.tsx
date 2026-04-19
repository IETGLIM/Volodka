"use client";

import { memo, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '@/engine/AudioEngine';

// ============================================
// CANVAS MATRIX RAIN
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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1).map(() => Math.random() * -50);
    };

    resize();
    window.addEventListener('resize', resize);

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
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
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
// GRADIENT BACKGROUND - BLADE RUNNER STYLE
// ============================================

const GradientBackground = memo(function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a1f 20%, #0f1a2a 40%, #1a0f2a 60%, #0a0a1a 80%, #0f0a1f 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Neon cyan glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(0, 255, 255, 0.12) 0%, transparent 40%)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Neon magenta glow */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.15) 0%, transparent 45%)',
        }}
        animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
      />

      {/* Amber/Orange glow — Blade Runner cityscape */}
      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(circle, rgba(255, 165, 0, 0.12) 0%, transparent 45%)',
        }}
        animate={{ x: [0, 100, 0], y: [0, -80, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      {/* Purple accent */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-1/2 h-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
        }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Bottom amber haze — Blade Runner reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, rgba(255, 120, 0, 0.06) 0%, transparent 100%)',
        }}
      />
    </div>
  );
});

// ============================================
// ANIMATED PERSPECTIVE GRID — SYNTHWAVE
// ============================================

const AnimatedNeonGrid = memo(function AnimatedNeonGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, transparent, black 30%, black 70%, transparent)',
        animation: 'grid-scroll 1.5s linear infinite',
      }}
    />
  );
});

// ============================================
// FLOATING HOLOGRAPHIC ELEMENTS
// ============================================

const HOLO_FRAGMENTS = [
  { id: 0, x: '10%', y: '20%', text: 'Смерть есть лишь начало...', rotation: -2 },
  { id: 1, x: '75%', y: '15%', text: 'POEM_FRAGMENTS: 0/12', rotation: 1.5 },
  { id: 2, x: '80%', y: '60%', text: 'STRESS: NOMINAL', rotation: -1 },
  { id: 3, x: '15%', y: '70%', text: 'Верить бы в это хотелось...', rotation: 2 },
  { id: 4, x: '55%', y: '80%', text: 'SYS.STATUS: MEMORIAL', rotation: -1.5 },
  { id: 5, x: '40%', y: '35%', text: 'УФА // 54.7388° N', rotation: 0.5 },
];

const HolographicElements = memo(function HolographicElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {HOLO_FRAGMENTS.map((frag) => (
        <motion.div
          key={frag.id}
          className="absolute holo-rotate holo-flicker"
          style={{
            left: frag.x,
            top: frag.y,
            transform: `rotate(${frag.rotation}deg)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 + frag.id * 0.5, duration: 1 }}
        >
          <div
            className="px-3 py-1.5 bg-cyan-500/5 border border-cyan-500/15 rounded backdrop-blur-sm"
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.1), inset 0 0 10px rgba(0, 255, 255, 0.05)',
            }}
          >
            <p className="font-mono text-[10px] text-cyan-400/40 whitespace-nowrap">
              {frag.text}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// ============================================
// PARTICLE SYSTEM — CYAN/MAGENTA/AMBER EMBERS
// ============================================

const ParticleSystem = memo(function ParticleSystem() {
  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 4 + Math.random() * 6,
    size: 2 + Math.random() * 3,
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
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
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
  const bars = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    id: i,
    delay: i * 0.06,
    duration: 0.6 + Math.random() * 0.8,
  })), []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-6 flex items-end justify-center gap-px pointer-events-none z-40 px-2">
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="flex-1 bg-cyan-500/15 rounded-t"
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
// CYBER BUTTON — ENHANCED WITH BLADE RUNNER TOUCH
// ============================================

interface CyberButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  delay?: number;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Для скринридеров; если не задано и children — строка, подставляется она */
  ariaLabel?: string;
}

const CyberButton = memo(function CyberButton({
  children,
  onClick,
  primary = false,
  delay = 0,
  variant = primary ? 'primary' : 'secondary',
  ariaLabel,
}: CyberButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [hoverChars, setHoverChars] = useState(0);

  // Random glitch effect on primary
  useEffect(() => {
    if (variant !== 'primary') return;
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [variant]);

  // Typewriter reveal on hover
  useEffect(() => {
    if (!isHovered) {
      setHoverChars(0);
      return;
    }
    const text = typeof children === 'string' ? children : '';
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setHoverChars(count);
      if (count >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [isHovered, children]);

  const displayText = typeof children === 'string' && isHovered
    ? (children as string).slice(0, hoverChars) + (hoverChars < (children as string).length ? '_' : '')
    : children;

  const borderColor = variant === 'primary'
    ? 'border-cyan-400'
    : variant === 'danger'
    ? 'border-red-400/50'
    : 'border-slate-500/50';

  const bgGradient = variant === 'primary'
    ? 'bg-gradient-to-r from-black via-cyan-950/80 to-black'
    : variant === 'danger'
    ? 'bg-gradient-to-r from-black via-red-950/60 to-black'
    : 'bg-gradient-to-r from-black via-slate-900/80 to-black';

  const textColor = variant === 'primary'
    ? 'text-cyan-300'
    : variant === 'danger'
    ? 'text-red-300'
    : 'text-slate-300';

  const iconColor = variant === 'primary'
    ? 'text-cyan-400'
    : variant === 'danger'
    ? 'text-red-400'
    : 'text-slate-500';

  const glowColor = variant === 'primary'
    ? 'rgba(0, 255, 255, 0.4)'
    : variant === 'danger'
    ? 'rgba(239, 68, 68, 0.3)'
    : 'rgba(148, 163, 184, 0.15)';

  const cornerColor = variant === 'primary'
    ? 'border-cyan-400/60'
    : variant === 'danger'
    ? 'border-red-400/40'
    : 'border-slate-500/40';

  const icon = variant === 'primary' ? '▶' : variant === 'danger' ? '⚠' : '↻';

  const resolvedAria =
    ariaLabel ?? (typeof children === 'string' ? children : undefined);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full group game-fm-layer game-fm-layer-promote"
      aria-label={resolvedAria}
    >
      <div
        className={`
          relative w-full px-8 py-4 font-mono text-lg uppercase tracking-[0.2em]
          transition-all duration-300 overflow-hidden
          ${bgGradient} ${borderColor}
          border-2
        `}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
      >
        {/* Animated scan line */}
        <div
          className="absolute inset-0 pointer-events-none cyber-scan"
          style={{ opacity: isHovered ? 1 : 0.3 }}
        />

        {/* Glitch effect */}
        <AnimatePresence>
          {glitchActive && (
            <>
              <motion.div
                className="absolute inset-0 bg-red-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ transform: 'translateX(-2px)' }}
              />
              <motion.div
                className="absolute inset-0 bg-cyan-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ transform: 'translateX(2px)' }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Corner brackets */}
        <div className={`absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 ${cornerColor}`} />
        <div className={`absolute top-1 right-4 w-4 h-4 border-r-2 border-t-2 ${cornerColor}`} />
        <div className={`absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 ${cornerColor}`} />
        <div className={`absolute bottom-1 right-4 w-4 h-4 border-r-2 border-b-2 ${cornerColor}`} />

        {/* Button text */}
        <span className={`relative z-10 flex items-center justify-center gap-4 font-bold ${textColor}`}>
          <motion.span
            animate={{ x: isHovered ? [0, 5, 0] : 0 }}
            transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
            className={`text-xl ${iconColor}`}
          >
            {icon}
          </motion.span>
          <span className={glitchActive ? 'animate-pulse' : ''}>
            {displayText}
          </span>
        </span>

        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}, 0 0 60px ${glowColor}`
              : `0 0 15px ${glowColor}`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Animated underline */}
      <motion.div
        className="absolute -bottom-1 left-0 h-0.5"
        style={{
          background: variant === 'primary'
            ? 'linear-gradient(90deg, #00ffff, #00cc99, #ff00ff)'
            : variant === 'danger'
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : 'linear-gradient(90deg, #64748b, #94a3b8)',
        }}
        animate={{ width: isHovered ? '100%' : '0%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
});

// ============================================
// UFA BADGE — ENHANCED
// ============================================

const UfaBadge = memo(function UfaBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="relative"
    >
      <div
        className="relative px-6 py-3 bg-black/60 backdrop-blur-sm"
        style={{
          clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        }}
      >
        {/* Enhanced glowing border */}
        <motion.div
          className="absolute inset-0"
          animate={{
            boxShadow: [
              '0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.1)',
              '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 15px rgba(0, 255, 255, 0.3)',
              '0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.1)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            📍
          </motion.span>

          <div className="text-center">
            <motion.p
              className="font-mono text-sm tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-emerald-400 font-bold neon-pulse-cyan"
            >
              УФА
            </motion.p>
            <p className="font-mono text-xs tracking-widest text-cyan-500/80 mt-0.5">
              1992 — 2026
            </p>
          </div>

          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-xl"
          >
            ❤️
          </motion.span>
        </div>
      </div>

      {/* Decorative lines */}
      <motion.div
        className="absolute -left-8 top-1/2 w-6 h-px bg-gradient-to-r from-transparent to-cyan-500/60"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute -right-8 top-1/2 w-6 h-px bg-gradient-to-l from-transparent to-cyan-500/60"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />
    </motion.div>
  );
});

// ============================================
// SETTINGS PANEL
// ============================================

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel = memo(function SettingsPanel({ onClose }: SettingsPanelProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 game-fm-layer game-fm-layer-promote pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <motion.div
        className="relative z-10 w-full max-w-md game-fm-layer"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div
          className="p-6 bg-black/90 backdrop-blur-md"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-mono text-lg text-cyan-400 tracking-wider uppercase"
              style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.4)' }}
            >
              Настройки
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-cyan-500/60 hover:text-cyan-300 transition-colors"
              aria-label="Закрыть настройки"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          {/* Settings items */}
          <div className="space-y-4">
            {/* Sound */}
            <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
              <span className="font-mono text-sm text-slate-400">Звук</span>
              <span className="font-mono text-xs text-cyan-500/60">В РАЗРАБОТКЕ</span>
            </div>

            {/* Text speed */}
            <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
              <span className="font-mono text-sm text-slate-400">Скорость текста</span>
              <span className="font-mono text-xs text-cyan-500/60">НОРМА</span>
            </div>

            {/* CRT Effects */}
            <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
              <span className="font-mono text-sm text-slate-400">CRT эффекты</span>
              <span className="font-mono text-xs text-emerald-400/80">ВКЛ</span>
            </div>

            {/* Matrix rain */}
            <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
              <span className="font-mono text-sm text-slate-400">Matrix Rain</span>
              <span className="font-mono text-xs text-emerald-400/80">ВКЛ</span>
            </div>

            {/* Version info */}
            <div className="pt-4 space-y-1">
              <p className="font-mono text-[10px] text-cyan-500/30 tracking-wider">
                ВОЛОДЬКА v2.0.77 — MEMORIAL BUILD
              </p>
              <p className="font-mono text-[10px] text-cyan-500/20 tracking-wider">
                ENGINE: NEXT.JS + ZUSTAND + FRAMER-MOTION
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// ============================================
// MAIN MENU COMPONENT — ENHANCED
// ============================================

interface MenuScreenProps {
  titleText: string;
  subtitleText: string;
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}

export const MenuScreen = memo(function MenuScreen({
  titleText,
  subtitleText,
  hasSave,
  onNewGame,
  onContinue,
}: MenuScreenProps) {
  const [systemStatus, setSystemStatus] = useState('ИНИЦИАЛИЗАЦИЯ');
  const [titleGlitch, setTitleGlitch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSystemStatus('ГОТОВ'), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    audioEngine.playMusic('menu');
    return () => {
      audioEngine.stop();
    };
  }, []);

  // Periodic title glitch
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setTitleGlitch(true);
        setTimeout(() => setTitleGlitch(false), 200);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <GradientBackground />

      {/* Animated neon grid floor */}
      <AnimatedNeonGrid />

      {/* Canvas-based Matrix rain */}
      <CanvasMatrixRain />

      {/* Scanlines */}
      <Scanlines />

      {/* Particle system */}
      <ParticleSystem />

      {/* Holographic elements */}
      <HolographicElements />

      {/* Audio visualizer */}
      <AudioVisualizer />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* System status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 font-mono text-xs text-cyan-500/70"
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ●
            </motion.span>
            СИСТЕМА: {systemStatus}
          </div>
          <div className="text-emerald-500/50 mt-1">
            v2.0.77 | MEMORIAL BUILD
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="text-center mb-8"
        >
          {/* Glow effect */}
          <div
            className="absolute inset-0 blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.25) 0%, rgba(255, 140, 0, 0.08) 40%, transparent 60%)',
            }}
          />

          {/* Main title with glitch */}
          <motion.h1
            className={`relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.15em] ${titleGlitch ? 'title-glitch' : ''}`}
            style={{
              textShadow: titleGlitch
                ? '-2px 0 #ff0000, 2px 0 #00ffff, 0 0 60px rgba(0, 255, 255, 0.6)'
                : '0 0 60px rgba(0, 255, 255, 0.6), 0 0 120px rgba(0, 255, 255, 0.4), 0 0 180px rgba(255, 140, 0, 0.1)',
            }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-emerald-500 neon-pulse-cyan">
              {titleText}
            </span>
          </motion.h1>

          {/* Reflection effect */}
          <div
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.15em] pointer-events-none select-none -mt-2"
            style={{
              animation: 'neon-reflection 4s ease-in-out infinite',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%)',
            }}
            aria-hidden
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/20 to-transparent">
              {titleText}
            </span>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 font-mono text-sm md:text-base tracking-[0.3em] uppercase"
            style={{
              background: 'linear-gradient(90deg, rgba(0,255,255,0.8), rgba(255,140,0,0.6), rgba(0,255,255,0.8))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {subtitleText}
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-6 mx-auto w-48 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), rgba(255, 140, 0, 0.3), transparent)',
            }}
          />
        </motion.div>

        {/* UFA Badge */}
        <div className="mb-8">
          <UfaBadge />
        </div>

        {/* Menu buttons — терминальная рамка (pointer-events-auto: корень меню pointer-events-none, иначе INP цепляется за пустой min-h-screen) */}
        <div className="w-full max-w-xs rounded-sm border border-cyan-500/25 bg-black/55 px-3 py-4 shadow-[inset_0_1px_0_0_rgba(0,255,255,0.07)] pointer-events-auto">
          <pre
            className="mb-3 font-mono text-[10px] leading-snug text-cyan-500/45 select-none whitespace-pre"
            aria-hidden
          >
{`┌──────────────────────────┐
│ > BOOT_MENU              │
└──────────────────────────┘`}
          </pre>
          <div className="space-y-3">
            {hasSave && (
              <CyberButton
                onClick={onContinue}
                primary
                delay={0.3}
                ariaLabel="Продолжить сохранённую игру"
              >
                Продолжить
              </CyberButton>
            )}

            <CyberButton
              onClick={onNewGame}
              primary={!hasSave}
              delay={hasSave ? 0.4 : 0.3}
              variant={hasSave ? 'secondary' : 'primary'}
              ariaLabel={hasSave ? 'Начать новую игру' : 'Начать новую игру с главного меню'}
            >
              Новая игра
            </CyberButton>

            <CyberButton
              onClick={() => setShowSettings(true)}
              delay={0.5}
              variant="secondary"
              ariaLabel="Открыть настройки"
            >
              Настройки
            </CyberButton>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="font-mono text-xs text-slate-500 tracking-wider">
            СТИХИ ВЛАДИМИРА ЛЕБЕДЕВА
          </p>
          <p className="font-mono text-xs text-cyan-500/50 mt-1">
            ВИЗУАЛЬНАЯ НОВЕЛЛА | ПСИХОЛОГИЧЕСКАЯ ДРАМА
          </p>
        </motion.div>

        {/* Version */}
        <div className="absolute bottom-4 right-4 font-mono text-xs text-slate-600">
          BUILD_2025.06
        </div>
      </div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-cyan-500/20"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/20"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-amber-500/15"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-amber-500/15"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      />

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
});

export default MenuScreen;
