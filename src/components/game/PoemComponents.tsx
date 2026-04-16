"use client";

import { memo, useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PoemLine, StoryEffect } from '@/data/types';
import type { Poem } from '@/data/poems';

// ============================================
// ОБЩИЙ CHROME — интро / меню / стих при introTerminalChrome
// ============================================

function IntroMemoryPoemChromeHeader({ uri, rightSlot }: { uri: string; rightSlot: ReactNode }) {
  return (
    <div className="relative z-[2] border-b border-cyan-500/15 bg-gradient-to-r from-black/90 via-[#030806]/95 to-black/90 px-3 py-2.5 sm:px-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500/85 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
        <span className="h-2 w-2 rounded-full bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.45)]" />
        <span className="h-2 w-2 rounded-full bg-emerald-500/90 shadow-[0_0_8px_rgba(34,197,94,0.55)]" />
        <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-400/50">live</span>
      </div>
      <div className="intro-recall-chrome-line flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10px] font-semibold sm:text-[11px]">
        <span className="text-emerald-300/95 drop-shadow-[0_0_10px_rgba(0,255,65,0.35)]">Volodka</span>
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
          <span className="max-w-[min(100%,220px)] truncate tracking-[0.12em] sm:max-w-none">{uri}</span>
          <span className="tabular-nums text-cyan-500/50">{rightSlot}</span>
        </div>
      </div>
    </div>
  );
}

/** Фон как у меню: тёмный базис + неон + сетка (без дублирования canvas-матрицы — её даёт IntroScreen под слоем) */
function IntroStylePoemBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[#020308]" />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          opacity: 0.65,
          background: [
            'radial-gradient(ellipse at 28% 12%, rgba(0,255,255,0.09) 0%, transparent 42%)',
            'radial-gradient(ellipse at 88% 88%, rgba(255,100,40,0.07) 0%, transparent 48%)',
            'radial-gradient(ellipse at 12% 72%, rgba(168,85,247,0.06) 0%, transparent 40%)',
            'linear-gradient(165deg, #050508 0%, #0c1018 45%, #040608 100%)',
          ].join(', '),
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage: [
            'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,255,65,0.045) 3px, rgba(0,255,65,0.045) 4px)',
            'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,255,255,0.028) 20px, rgba(0,255,255,0.028) 21px)',
          ].join(', '),
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        aria-hidden
        style={{
          opacity: 0.35,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.07) 2px, rgba(0, 0, 0, 0.07) 4px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 32%, rgba(0, 0, 0, 0.82) 100%)',
        }}
        aria-hidden
      />
    </>
  );
}

// ============================================
// ПОЛНОЭКРАННЫЙ ПОКАЗ СТИХА
// ============================================

interface PoemRevealProps {
  poem: Poem;
  intro?: string;
  onClose: () => void;
  /** Интро игры: терминальный chrome как в PoetryBook, надёжный тап по ✕ */
  introTerminalChrome?: boolean;
}

const getPoemTheme = (themes: string[]) => {
  if (themes.includes('смерть') || themes.includes('отчаяние')) {
    return { primary: '#ef4444', secondary: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.3)', name: 'dark' };
  }
  if (themes.includes('любовь') || themes.includes('надежда')) {
    return { primary: '#ec4899', secondary: '#831843', glow: 'rgba(236, 72, 153, 0.3)', name: 'love' };
  }
  if (themes.includes('космос') || themes.includes('звёзды')) {
    return { primary: '#8b5cf6', secondary: '#4c1d95', glow: 'rgba(139, 92, 246, 0.3)', name: 'cosmic' };
  }
  if (themes.includes('город') || themes.includes('одиночество')) {
    return { primary: '#f59e0b', secondary: '#78350f', glow: 'rgba(245, 158, 11, 0.3)', name: 'city' };
  }
  if (themes.includes('память') || themes.includes('детство')) {
    return { primary: '#06b6d4', secondary: '#164e63', glow: 'rgba(6, 182, 212, 0.3)', name: 'memory' };
  }
  return { primary: '#a855f7', secondary: '#581c87', glow: 'rgba(168, 85, 247, 0.3)', name: 'default' };
};

export const PoemReveal = memo(function PoemReveal({
  poem,
  intro,
  onClose,
  introTerminalChrome = false,
}: PoemRevealProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(!!intro);
  const [isComplete, setIsComplete] = useState(false);
  const [showInnerVoice, setShowInnerVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const theme = useMemo(() => getPoemTheme(poem.themes), [poem.themes]);

  const particles = useMemo(() => {
    const count = 60;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  const decorLines = useMemo(() => [
    { angle: 15, y: 10 },
    { angle: -15, y: 90 },
  ], []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayedLines, currentLineText, introTerminalChrome]);

  useEffect(() => {
    if (showIntro && intro) {
      const timer = setTimeout(() => setShowIntro(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showIntro, intro]);

  useEffect(() => {
    if (showIntro || showInnerVoice) return;
    
    if (currentLineIndex >= poem.lines.length) {
      const timer = setTimeout(() => setIsComplete(true), 0);
      return () => clearTimeout(timer);
    }

    const currentLine = poem.lines[currentLineIndex];
    
    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setCurrentLineText(currentLine.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [...prev, currentLine]);
        setCurrentLineText('');
        setCharIndex(0);
        setCurrentLineIndex(currentLineIndex + 1);
      }, currentLine === '' ? 300 : 500);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, charIndex, poem.lines, showIntro, showInnerVoice]);

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onClose]);
  
  const handleInnerVoice = useCallback(() => {
    if (intro) {
      setShowInnerVoice(true);
      setTimeout(() => setShowInnerVoice(false), 5000);
    }
  }, [intro]);

  const getLineColor = useCallback((line: string) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('смерть') || lowerLine.includes('умру') || lowerLine.includes('умер')) {
      return 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    }
    if (lowerLine.includes('верить') || lowerLine.includes('свет') || lowerLine.includes('надежда')) {
      return 'text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.5)]';
    }
    if (lowerLine.includes('любовь') || lowerLine.includes('любил') || lowerLine.includes('сердце')) {
      return 'text-pink-300 drop-shadow-[0_0_10px_rgba(249,168,212,0.5)]';
    }
    if (lowerLine.includes('дверь') || lowerLine.includes('город') || lowerLine.includes('окно')) {
      return 'text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]';
    }
    if (lowerLine.includes('звёзд') || lowerLine.includes('неб') || lowerLine.includes('космос')) {
      return 'text-purple-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]';
    }
    if (lowerLine.includes('боль') || lowerLine.includes('грусть') || lowerLine.includes('тоска')) {
      return 'text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]';
    }
    return 'text-white';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 flex flex-col items-center justify-center p-4 overflow-hidden ${
        introTerminalChrome ? 'z-[100]' : 'z-50'
      }`}
      onClick={() => isComplete && onClose()}
    >
      {/* Фон: интро-стих — как меню/проза; иначе тематический градиент */}
      {introTerminalChrome ? (
        <IntroStylePoemBackdrop />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${theme.glow} 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.8) 0%, transparent 50%),
                       radial-gradient(ellipse at 20% 70%, ${theme.glow} 0%, transparent 40%),
                       linear-gradient(180deg, #0a0a0f 0%, #0f0a15 50%, #0a0a0f 100%)`,
          }}
        />
      )}
      
      {/* Декоративные линии — в терминальном интро скрываем, чтобы не спорить с сеткой */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${introTerminalChrome ? 'opacity-0' : 'opacity-20'}`}
      >
        {decorLines.map((line, i) => (
          <motion.line
            key={i}
            x1="0"
            y1={`${line.y}%`}
            x2="100%"
            y2={`${line.y + Math.sin(line.angle * Math.PI / 180) * 20}%`}
            stroke={theme.primary}
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 3, delay: i * 0.5 }}
          />
        ))}
      </svg>

      {/* Частицы */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: introTerminalChrome ? 0.12 : 1 }}
      >
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: theme.primary,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${theme.primary}`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(p.id) * 20, 0],
              opacity: [p.opacity, p.opacity * 1.5, p.opacity],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Виньетка — для не-интро; в интро уже в IntroStylePoemBackdrop */}
      {!introTerminalChrome && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      )}

      {/* Интро */}
      <AnimatePresence>
        {showIntro && intro && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center p-8 z-10"
          >
            <div className="max-w-2xl text-center">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="w-32 h-0.5 mx-auto mb-8"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}
              />
              <p 
                className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light italic"
                style={{ textShadow: `0 0 30px ${theme.glow}` }}
              >
                {intro}
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-32 h-0.5 mx-auto mt-8"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Внутренний голос */}
      <AnimatePresence>
        {showInnerVoice && intro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-20 flex items-center justify-center p-6 sm:p-8 ${
              introTerminalChrome ? 'z-[125] bg-black/80 backdrop-blur-sm' : ''
            }`}
            style={introTerminalChrome ? undefined : { background: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className={
                introTerminalChrome
                  ? 'intro-recall-frame relative max-w-2xl border border-cyan-500/35 bg-black/90 p-6 font-mono shadow-[0_0_40px_rgba(0,255,255,0.12)] sm:p-8'
                  : 'max-w-2xl rounded-2xl p-8 text-center'
              }
              style={
                introTerminalChrome
                  ? {
                      clipPath:
                        'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                    }
                  : {
                      background: 'rgba(0,0,0,0.5)',
                      boxShadow: `0 0 60px ${theme.glow}, inset 0 0 30px rgba(255,255,255,0.05)`,
                      border: `1px solid ${theme.primary}30`,
                    }
              }
            >
              {introTerminalChrome && (
                <p className="mb-3 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-cyan-500/50">
                  volodka://memory/inner_echo
                </p>
              )}
              <p
                className={`leading-relaxed ${introTerminalChrome ? 'text-center text-base italic text-cyan-100/90 sm:text-lg' : 'text-xl font-light italic md:text-2xl'}`}
                style={introTerminalChrome ? undefined : { color: theme.primary }}
              >
                &ldquo;{intro}&rdquo;
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Стих */}
      {!showIntro && (
        <motion.div 
          className={`relative w-full max-w-4xl h-full max-h-[85dvh] flex flex-col ${
            introTerminalChrome ? 'max-w-2xl' : ''
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {introTerminalChrome ? (
            <div
              className="intro-recall-frame relative flex min-h-0 flex-1 flex-col overflow-hidden border border-emerald-500/25 bg-black/85 shadow-[0_0_40px_rgba(0,255,65,0.08),0_0_80px_rgba(0,255,255,0.05)] backdrop-blur-md"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.85]"
                aria-hidden
                style={{
                  background: [
                    'linear-gradient(165deg, rgba(0,255,65,0.07) 0%, transparent 42%)',
                    'linear-gradient(345deg, rgba(255,0,128,0.05) 0%, transparent 38%)',
                    'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,255,65,0.04) 3px, rgba(0,255,65,0.04) 4px)',
                    'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,255,255,0.02) 20px, rgba(0,255,255,0.02) 21px)',
                  ].join(', '),
                }}
              />
              <div className="pointer-events-none absolute top-2 left-2 z-[1] h-5 w-5 border-l border-t border-emerald-400/35" />
              <div className="pointer-events-none absolute top-2 right-2 z-[1] h-5 w-5 border-r border-t border-cyan-400/30" />
              <div className="pointer-events-none absolute bottom-2 left-2 z-[1] h-5 w-5 border-l border-b border-amber-400/25" />
              <div className="pointer-events-none absolute bottom-2 right-2 z-[1] h-5 w-5 border-r border-b border-fuchsia-500/20" />

              <IntroMemoryPoemChromeHeader
                uri={`volodka://memory/poem_${poem.id}`}
                rightSlot={
                  isComplete
                    ? 'LOCK'
                    : `LN ${String(Math.min(currentLineIndex + 1, poem.lines.length)).padStart(2, '0')}/${String(poem.lines.length).padStart(2, '0')}`
                }
              />

              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="relative z-[2] border-b border-cyan-500/10 px-4 py-4 text-center"
              >
                <h2 className="bg-gradient-to-r from-red-300/95 via-cyan-200 to-red-200/90 bg-clip-text font-mono text-lg font-bold uppercase leading-snug tracking-[0.12em] text-transparent drop-shadow-[0_0_18px_rgba(239,68,68,0.25)] sm:text-xl md:text-2xl">
                  {poem.title}
                </h2>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-500/55 sm:text-[11px]">
                  {poem.author} {'//'} FRAGMENT_0x{(poem.order ?? 0).toString(16).toUpperCase().padStart(2, '0')}
                </p>
              </motion.div>

              <div
                ref={scrollRef}
                className="relative z-[2] min-h-0 flex-1 overflow-y-auto px-3 py-3 pr-2 font-mono game-scrollbar sm:px-4 sm:py-4"
              >
                <div className="space-y-2">
                  {displayedLines.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.32 }}
                      className={`text-base leading-relaxed sm:text-lg ${getLineColor(line)}`}
                    >
                      <span className="mr-2 inline-block w-6 select-none text-right text-xs text-cyan-500/35 tabular-nums sm:text-[13px]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-cyan-500/40">&gt;</span> {line || '\u00A0'}
                    </motion.p>
                  ))}
                  {currentLineIndex < poem.lines.length && (
                    <motion.p
                      initial={{ opacity: 0.4, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`motion-safe:animate-[intro-line-glow_3.5s_ease-in-out_infinite] border-l-2 border-emerald-500/45 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent py-1 pl-2 text-base leading-relaxed sm:text-lg ${getLineColor(currentLineText)}`}
                    >
                      <span className="mr-2 inline-block w-6 select-none text-right text-xs text-emerald-400/50 tabular-nums sm:text-[13px]">
                        {String(currentLineIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="text-emerald-400/70">&gt;</span>{' '}
                      <span style={{ textShadow: '0 0 2px rgba(0,0,0,0.95)' }}>{currentLineText}</span>
                      <span className="ml-0.5 inline-block align-baseline font-mono text-emerald-300 motion-safe:animate-pulse drop-shadow-[0_0_6px_rgba(0,255,65,0.65)]">
                        █
                      </span>
                    </motion.p>
                  )}
                </div>
                <div className="h-2 shrink-0" aria-hidden />
              </div>

              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-[2] px-3 pb-5 pt-1 sm:px-4"
                  >
                    <div
                      className="relative mx-auto max-w-md overflow-hidden border-2 border-cyan-500/55 bg-gradient-to-r from-black via-cyan-950/90 to-black px-5 py-4 font-mono shadow-[0_0_24px_rgba(0,255,255,0.12)]"
                      style={{
                        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                      }}
                    >
                      <div className="pointer-events-none absolute inset-0 cyber-scan opacity-35" aria-hidden />
                      <div className="absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-cyan-400/55" />
                      <div className="absolute right-3 top-1 h-3 w-3 border-r-2 border-t-2 border-cyan-400/55" />
                      <div className="absolute bottom-1 left-1 h-3 w-3 border-l-2 border-b-2 border-cyan-400/40" />
                      <div className="absolute bottom-1 right-3 h-3 w-3 border-r-2 border-b-2 border-cyan-400/40" />
                      <p className="relative z-10 text-center text-xs uppercase tracking-[0.18em] text-cyan-200/90 sm:text-sm">
                        ✓ DATA_LOCKED // стих в коллекции
                      </p>
                      <motion.p
                        animate={{ opacity: [0.45, 1, 0.45] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="relative z-10 mt-2 text-center text-[10px] uppercase tracking-[0.28em] text-cyan-400/75"
                      >
                        Нажмите для продолжения…
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {intro && !showInnerVoice && !isComplete && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInnerVoice();
                  }}
                  className="relative z-[2] mx-auto mb-4 mt-1 w-[min(100%,320px)] overflow-hidden border-2 border-cyan-500/50 bg-gradient-to-r from-black via-cyan-950/85 to-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.18em] text-cyan-200 transition-colors hover:border-cyan-400/70 hover:text-cyan-100"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  <span className="pointer-events-none absolute inset-0 cyber-scan opacity-25" aria-hidden />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-base opacity-90">💭</span>
                    Внутренний голос
                  </span>
                </motion.button>
              )}
            </div>
          ) : (
            <>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  border: `1px solid ${theme.primary}20`,
                  borderRadius: '1rem',
                  boxShadow: `inset 0 0 100px ${theme.glow}, 0 0 50px ${theme.glow}`,
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 mb-4 pt-6 text-center"
              >
                <div className="mb-4 flex items-center justify-center gap-4">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                    className="h-px w-16"
                    style={{ background: `linear-gradient(90deg, transparent, ${theme.primary})` }}
                  />
                  <span style={{ color: theme.primary }} className="text-2xl">
                    ✦
                  </span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                    className="h-px w-16"
                    style={{ background: `linear-gradient(90deg, ${theme.primary}, transparent)` }}
                  />
                </div>
                <h2
                  className="mb-2 text-3xl font-bold tracking-wide md:text-4xl"
                  style={{
                    color: 'white',
                    textShadow: `0 0 30px ${theme.glow}`,
                  }}
                >
                  {poem.title}
                </h2>
                <p className="text-sm uppercase tracking-widest text-slate-400">{poem.author}</p>
              </motion.div>

              <div
                ref={scrollRef}
                className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/30 flex-1 overflow-y-auto px-4 pb-8 md:px-10"
              >
                <div className="space-y-2 py-4 font-serif">
                  {displayedLines.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`text-lg leading-relaxed tracking-wide md:text-xl lg:text-2xl ${getLineColor(line)}`}
                    >
                      {line || '\u00A0'}
                    </motion.p>
                  ))}
                  {currentLineIndex < poem.lines.length && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-lg leading-relaxed tracking-wide md:text-xl lg:text-2xl ${getLineColor(currentLineText)}`}
                    >
                      {currentLineText}
                      <span className="ml-1 inline-block animate-pulse" style={{ color: theme.primary }}>
                        |
                      </span>
                    </motion.p>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 pb-6 text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block rounded-full px-6 py-3"
                      style={{
                        background: `${theme.primary}20`,
                        border: `1px solid ${theme.primary}40`,
                      }}
                    >
                      <p className="text-sm text-slate-300">✓ Стих добавлен в коллекцию</p>
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mt-3 text-sm"
                      style={{ color: theme.primary }}
                    >
                      Нажмите для продолжения...
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {intro && !showInnerVoice && !isComplete && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInnerVoice();
                  }}
                  className="group relative mx-auto mb-4 overflow-hidden rounded-xl px-8 py-4 text-base font-medium transition-all duration-300"
                  style={{
                    background: `${theme.primary}30`,
                    border: `1px solid ${theme.primary}50`,
                    color: 'white',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-xl">💭</span>
                    Внутренний голос
                  </span>
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: theme.primary }}
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              )}
            </>
          )}

          {/* Кнопка закрытия — поверх всех слоёв, крупная зона тапа (мобильные) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`absolute top-2 right-2 z-[130] flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center border transition-colors ${
              introTerminalChrome
                ? 'border-cyan-500/35 bg-black/70 text-cyan-400/80 hover:border-cyan-400/60 hover:text-cyan-200'
                : 'rounded-full border-transparent text-white/50 hover:bg-white/10 hover:text-white'
            }`}
            style={
              introTerminalChrome
                ? {
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  }
                : undefined
            }
            aria-label="Закрыть"
          >
            <span className="text-lg font-mono leading-none">✕</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
});

// ============================================
// ПЕЧАТАЮЩИЙСЯ ТЕКСТ
// ============================================

export const PoemTypewriter = memo(function PoemTypewriter({ 
  lines, 
  onComplete,
  speed = 800 
}: { 
  lines: string[]; 
  onComplete: () => void;
  speed?: number;
}) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      setTimeout(onComplete, 1500);
      return;
    }

    const currentLine = lines[currentLineIndex];
    
    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setCurrentLineText(currentLine.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 40);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDisplayedLines([...displayedLines, currentLine]);
        setCurrentLineText('');
        setCharIndex(0);
        setCurrentLineIndex(currentLineIndex + 1);
      }, currentLine === '' ? 300 : speed);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, charIndex, lines, onComplete, speed, displayedLines]);

  return (
    <div className="space-y-2 font-serif">
      {displayedLines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-xl md:text-2xl leading-relaxed ${
            line.includes('смерть') || line.includes('достало') 
              ? 'text-red-400' 
              : line.includes('верить') || line.includes('свет') || line.includes('Sic')
              ? 'text-cyan-400'
              : 'text-white'
          }`}
        >
          {line || '\u00A0'}
        </motion.p>
      ))}
      {currentLineIndex < lines.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl md:text-2xl leading-relaxed text-white"
        >
          {currentLineText}
          <span className="animate-pulse text-purple-400">|</span>
        </motion.p>
      )}
    </div>
  );
});

// ============================================
// МИНИ-ИГРА СО СТИХАМИ
// ============================================

export const PoemGameComponent = memo(function PoemGameComponent({ 
  lines, 
  onComplete 
}: { 
  lines: PoemLine[]; 
  onComplete: (score: number) => void;
}) {
  const [selectedLines, setSelectedLines] = useState<PoemLine[]>([]);
  const [availableLines, setAvailableLines] = useState<PoemLine[]>(lines);
  const [isComplete, setIsComplete] = useState(false);

  const handleSelect = useCallback((line: PoemLine) => {
    if (selectedLines.length >= 3) return;
    
    const newSelected = [...selectedLines, line];
    setSelectedLines(newSelected);
    setAvailableLines(prev => prev.filter(l => l.id !== line.id));
    
    if (newSelected.length === 3) {
      setIsComplete(true);
      const score = newSelected.reduce((sum, l) => sum + l.value, 0);
      setTimeout(() => onComplete(score), 1500);
    }
  }, [selectedLines, onComplete]);

  return (
    <div className="space-y-4">
      <p className="text-slate-300 text-lg">Выбери строки в порядке, который создаст стих:</p>
      
      <div className="min-h-32 bg-slate-800/70 rounded-lg p-5 border border-slate-500/50">
        {selectedLines.length === 0 ? (
          <p className="text-slate-400 italic text-lg">Нажми на строки ниже...</p>
        ) : (
          <div className="space-y-3">
            {selectedLines.map((line, i) => (
              <motion.p 
                key={line.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xl ${
                  line.value > 2 ? 'text-purple-300' : 
                  line.value > 0 ? 'text-white' : 
                  'text-red-400'
                }`}
              >
                {line.text}
              </motion.p>
            ))}
          </div>
        )}
      </div>
      
      {!isComplete && (
        <div className="flex flex-wrap gap-3">
          {availableLines.map((line) => (
            <motion.button
              key={line.id}
              onClick={() => handleSelect(line)}
              className="px-4 py-3 bg-slate-700/90 hover:bg-slate-600/90 rounded-lg text-base text-left transition-colors text-white font-medium shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {line.text}
            </motion.button>
          ))}
        </div>
      )}
      
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className={`text-xl ${selectedLines.reduce((s, l) => s + l.value, 0) > 5 ? 'text-green-400' : 'text-amber-400'}`}>
            {selectedLines.reduce((s, l) => s + l.value, 0) > 5 ? '✨ Красиво!' : '📝 Интересно...'}
          </p>
        </motion.div>
      )}
    </div>
  );
});

// ============================================
// ИНТЕРПРЕТАЦИЯ СНОВ
// ============================================

export const InterpretationComponent = memo(function InterpretationComponent({ 
  interpretations, 
  onSelect 
}: { 
  interpretations: { text: string; effect: StoryEffect; insight?: string }[];
  onSelect: (effect: StoryEffect) => void;
}) {
  return (
    <div className="space-y-3">
      {interpretations.map((interp, i) => (
        <motion.button
          key={i}
          onClick={() => onSelect(interp.effect)}
          className="w-full text-left px-4 py-3 bg-slate-700/90 hover:bg-slate-600/90 rounded-lg border border-slate-400/50 hover:border-purple-400 transition-all text-white text-lg font-medium shadow-md"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {interp.text}
        </motion.button>
      ))}
    </div>
  );
});

export default PoemReveal;
