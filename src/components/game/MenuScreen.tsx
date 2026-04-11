"use client";

import { memo, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// MATRIX RAIN COMPONENT
// ============================================

const MatrixRain = memo(function MatrixRain() {
  const columns = useMemo(() => {
    const count = typeof window !== 'undefined' ? Math.floor(window.innerWidth / 25) : 40;
    return Array.from({ length: Math.min(count, 60) }, (_, i) => ({
      id: i,
      x: (i / Math.min(count, 60)) * 100,
      speed: 10 + Math.random() * 20,
      delay: Math.random() * 5,
      length: 5 + Math.random() * 12,
      opacity: 0.2 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute text-green-500 font-mono text-xs leading-none"
          style={{
            left: `${col.x}%`,
            top: 0,
            opacity: col.opacity,
            textShadow: '0 0 8px #00ff00',
          }}
          initial={{ y: '-100%' }}
          animate={{ y: '200vh' }}
          transition={{
            duration: col.speed,
            repeat: Infinity,
            delay: col.delay,
            ease: 'linear',
          }}
        >
          {Array.from({ length: Math.floor(col.length) }, (_, i) => (
            <div key={i} className="whitespace-nowrap">
              {String.fromCharCode(0x30A0 + Math.random() * 96)}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
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
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)',
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
      {/* Dark cyberpunk base */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a1f 20%, #0f1a2a 40%, #1a0f2a 60%, #0a0a1a 80%, #0f0a1f 100%)',
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
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />
      
      {/* Neon magenta/pink glow - Blade Runner style */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.15) 0%, transparent 45%)',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
        }}
      />
      
      {/* Neon orange/amber glow - retro future */}
      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(circle, rgba(255, 165, 0, 0.1) 0%, transparent 45%)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -80, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
        }}
      />
      
      {/* Purple accent */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-1/2 h-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />
    </div>
  );
});

// ============================================
// NEON GRID - RETRO FUTURE
// ============================================

const NeonGrid = memo(function NeonGrid() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, transparent, black 30%, black 70%, transparent)',
      }}
    />
  );
});

// ============================================
// CYBER BUTTON - MATRIX/BLADE RUNNER STYLE
// ============================================

interface CyberButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  delay?: number;
}

const CyberButton = memo(function CyberButton({ children, onClick, primary = false, delay = 0 }: CyberButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Random glitch effect
  useEffect(() => {
    if (!primary) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [primary]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full group"
    >
      {/* Button container */}
      <div
        className={`
          relative w-full px-8 py-5 font-mono text-lg uppercase tracking-[0.2em]
          transition-all duration-300 overflow-hidden
          ${primary
            ? 'bg-gradient-to-r from-black via-cyan-950/80 to-black border-cyan-400'
            : 'bg-gradient-to-r from-black via-slate-900/80 to-black border-slate-500/60'
          }
          border-2
        `}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
      >
        {/* Animated scan line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isHovered
              ? 'linear-gradient(180deg, transparent 0%, rgba(0, 255, 255, 0.2) 50%, transparent 100%)'
              : 'linear-gradient(180deg, transparent 0%, transparent 50%, transparent 100%)',
            backgroundPosition: ['0% 0%', '0% 200%'],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'linear',
          }}
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
        <div className="absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-cyan-400/60" />
        <div className="absolute top-1 right-4 w-4 h-4 border-r-2 border-t-2 border-cyan-400/60" />
        <div className="absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 border-cyan-400/60" />
        <div className="absolute bottom-1 right-4 w-4 h-4 border-r-2 border-b-2 border-cyan-400/60" />

        {/* Button text */}
        <span className={`relative z-10 flex items-center justify-center gap-4 font-bold ${primary ? 'text-cyan-300' : 'text-slate-300'}`}>
          {/* Arrow indicator */}
          <motion.span
            animate={{ x: isHovered ? [0, 5, 0] : 0 }}
            transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
            className={`text-xl ${primary ? 'text-cyan-400' : 'text-slate-500'}`}
          >
            {primary ? '▶' : '↻'}
          </motion.span>
          <span className={glitchActive ? 'animate-pulse' : ''}>
            {children}
          </span>
        </span>

        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.15), 0 0 60px rgba(0, 255, 255, 0.2)'
              : '0 0 15px rgba(0, 255, 255, 0.15)',
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Animated underline */}
      <motion.div
        className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400"
        animate={{
          width: isHovered ? '100%' : '0%',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
});

// ============================================
// UFA BADGE - LOCATION MARKER
// ============================================

const UfaBadge = memo(function UfaBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="relative"
    >
      {/* Main container */}
      <div 
        className="relative px-6 py-3 bg-black/60 backdrop-blur-sm"
        style={{
          clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        }}
      >
        {/* Glowing border */}
        <motion.div
          className="absolute inset-0"
          animate={{
            boxShadow: [
              '0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.1)',
              '0 0 20px rgba(0, 255, 255, 0.4), inset 0 0 15px rgba(0, 255, 255, 0.2)',
              '0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.1)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          {/* Location icon */}
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            📍
          </motion.span>
          
          {/* Text */}
          <div className="text-center">
            <motion.p
              className="font-mono text-sm tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-emerald-400 font-bold"
              animate={{
                textShadow: [
                  '0 0 10px rgba(0, 255, 255, 0.5)',
                  '0 0 20px rgba(0, 255, 255, 0.8)',
                  '0 0 10px rgba(0, 255, 255, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              УФА
            </motion.p>
            <p className="font-mono text-xs tracking-widest text-cyan-500/80 mt-0.5">
              1992 — 2026
            </p>
          </div>
          
          {/* Heart */}
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
// MAIN MENU COMPONENT
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

  useEffect(() => {
    const timer = setTimeout(() => setSystemStatus('ГОТОВ'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Animated gradient background */}
      <GradientBackground />
      
      {/* Neon grid floor */}
      <NeonGrid />
      
      {/* Matrix rain */}
      <MatrixRain />

      {/* Scanlines */}
      <Scanlines />

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
              background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.25) 0%, transparent 60%)',
            }}
          />

          {/* Main title */}
          <motion.h1
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.15em]"
            style={{
              textShadow: '0 0 60px rgba(0, 255, 255, 0.6), 0 0 120px rgba(0, 255, 255, 0.4), 0 0 180px rgba(0, 255, 255, 0.2)',
            }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-emerald-500">
              {titleText}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 font-mono text-sm md:text-base tracking-[0.3em] text-cyan-500/80 uppercase"
          >
            {subtitleText}
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-6 mx-auto w-48 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
          />
        </motion.div>

        {/* UFA Badge */}
        <div className="mb-8">
          <UfaBadge />
        </div>

        {/* Menu buttons */}
        <div className="w-full max-w-xs space-y-4">
          <CyberButton onClick={onNewGame} primary delay={0.4}>
            Начать игру
          </CyberButton>

          <AnimatePresence>
            {hasSave && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CyberButton onClick={onContinue} delay={0.5}>
                  Продолжить
                </CyberButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="font-mono text-xs text-slate-500 tracking-wider">
            📜 СТИХИ ВЛАДИМИРА ЛЕБЕДЕВА
          </p>
          <p className="font-mono text-xs text-cyan-500/50 mt-1">
            ВИЗУАЛЬНАЯ НОВЕЛЛА | ПСИХОЛОГИЧЕСКАЯ ДРАМА
          </p>
        </motion.div>

        {/* Version */}
        <div className="absolute bottom-4 right-4 font-mono text-xs text-slate-600">
          BUILD_2024.12
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
        className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-cyan-500/20"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-cyan-500/20"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      />
    </div>
  );
});

export default MenuScreen;
