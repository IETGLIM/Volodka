"use client";

import { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PoemReveal } from './PoemReveal';
import type { Poem } from '@/data/poems';

// ============================================
// MATRIX RAIN
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
// SKIP BUTTON
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
      className="fixed top-6 right-6 z-50 group"
    >
      <div className="relative px-4 py-2 font-mono text-sm uppercase tracking-wider border border-cyan-500/40 rounded bg-slate-900/80 backdrop-blur-sm overflow-hidden">
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isHovered
              ? 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.15) 50%, transparent 100%)'
              : 'transparent',
          }}
        />
        
        {/* Text */}
        <span className="relative z-10 flex items-center gap-2 text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
          Пропустить
        </span>
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? '0 0 15px rgba(0, 255, 255, 0.3)'
              : '0 0 5px rgba(0, 255, 255, 0.1)',
          }}
        />
      </div>
    </motion.button>
  );
});

// ============================================
// INTRO SCREEN COMPONENT
// ============================================

interface IntroScreenProps {
  titleText: string;
  subtitleText: string;
  gameIntro: string;
  poems: Poem[];
  onComplete: () => void;
}

export const IntroScreen = memo(function IntroScreen({
  titleText,
  subtitleText,
  gameIntro,
  poems,
  onComplete,
}: IntroScreenProps) {
  const introLines = useMemo(() => gameIntro.split('\n').filter(l => l.trim()), [gameIntro]);
  const [lineIndex, setLineIndex] = useState(0);
  const [showTitle, setShowTitle] = useState(true);
  const [introPhase, setIntroPhase] = useState<'title' | 'prose' | 'poem' | 'done'>('title');
  const [revealedPoem, setRevealedPoem] = useState<Poem | null>(null);
  const [collectedPoems, setCollectedPoems] = useState<string[]>([]);

  // Skip intro handler
  const handleSkip = useCallback(() => {
    setIntroPhase('done');
    onComplete();
  }, [onComplete]);

  // Phase 1: Title (4 seconds)
  useEffect(() => {
    if (introPhase !== 'title' || !showTitle) return;

    const timer = setTimeout(() => {
      setShowTitle(false);
      setIntroPhase('prose');
      setLineIndex(0);
    }, 4000);

    return () => clearTimeout(timer);
  }, [introPhase, showTitle]);

  // Phase 2: Prose
  useEffect(() => {
    if (introPhase !== 'prose') return;

    if (lineIndex < introLines.length) {
      const currentLine = introLines[lineIndex] || '';
      const readingTime = Math.max(2500, Math.min(5500, currentLine.length * 50));
      const timer = setTimeout(() => setLineIndex(lineIndex + 1), readingTime);
      return () => clearTimeout(timer);
    } else {
      // Transition to poem
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
  }, [introPhase, lineIndex, introLines, poems, onComplete]);

  // Phase 3: Poem closed
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
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Scanlines */}
      <Scanlines />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />

      {/* Skip button */}
      {introPhase !== 'done' && (
        <SkipButton onSkip={handleSkip} />
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {/* Phase 1: Title */}
          {introPhase === 'title' && showTitle && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 blur-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.2) 0%, transparent 60%)',
                }}
              />

              {/* Title */}
              <motion.h1
                className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest"
                style={{
                  textShadow: '0 0 60px rgba(0, 255, 255, 0.5), 0 0 120px rgba(0, 255, 255, 0.3)',
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
                className="mt-6 font-mono text-sm md:text-base tracking-[0.4em] text-cyan-500/80 uppercase"
              >
                {subtitleText}
              </motion.p>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 flex items-center justify-center gap-2"
              >
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-cyan-500 font-mono"
                >
                  ●
                </motion.span>
                <span className="text-cyan-500/60 font-mono text-sm tracking-wider">
                  ЗАГРУЗКА...
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* Phase 2: Prose */}
          {introPhase === 'prose' && (
            <motion.div
              key="prose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto px-6 text-center"
            >
              {/* Terminal-style container */}
              <div className="relative">
                {/* Terminal header */}
                <div className="flex items-center gap-2 mb-4 text-cyan-500/50 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="ml-2">volodka://memory/recall</span>
                </div>

                {/* Content */}
                <div className="font-mono text-left">
                  <AnimatePresence mode="wait">
                    {introLines.slice(0, lineIndex + 1).map((line, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`text-lg md:text-xl mb-4 leading-relaxed ${
                          line.toLowerCase().includes('смерть')
                            ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            : line.toLowerCase().includes('верить') || line.toLowerCase().includes('вспомнилось')
                            ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="text-cyan-500/50 mr-2">&gt;</span>
                        {line}
                      </motion.p>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Blinking cursor */}
                {lineIndex < introLines.length && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-cyan-400 font-mono"
                  >
                    █
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}

          {/* Phase 3: Poem */}
          {introPhase === 'poem' && revealedPoem && (
            <PoemReveal
              poem={revealedPoem}
              onClose={() => setRevealedPoem(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-cyan-500/20"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-cyan-500/20"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
});

export default IntroScreen;
