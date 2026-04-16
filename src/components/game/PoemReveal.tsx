"use client";

import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Poem } from '@/data/poems';

// ============================================
// ПОЛНОЭКРАННЫЙ ПОКАЗ СТИХА
// ============================================

interface PoemRevealProps {
  poem: Poem;
  intro?: string;
  onClose: () => void;
}

// Определяем цветовую схему на основе тем стиха
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
  // Default purple theme
  return { primary: '#a855f7', secondary: '#581c87', glow: 'rgba(168, 85, 247, 0.3)', name: 'default' };
};

export const PoemReveal = memo(function PoemReveal({ poem, intro, onClose }: PoemRevealProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(!!intro);
  const [isComplete, setIsComplete] = useState(false);
  const [showInnerVoice, setShowInnerVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Определяем тему стиха
  const theme = useMemo(() => getPoemTheme(poem.themes), [poem.themes]);

  // Генерация частиц на основе темы
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

  // Декоративные линии
  const decorLines = useMemo(() => [
    { angle: 15, y: 10 },
    { angle: -15, y: 90 },
  ], []);

  // Автопрокрутка
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLines, currentLineText]);

  // Показ интро
  useEffect(() => {
    if (showIntro && intro) {
      const timer = setTimeout(() => setShowIntro(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showIntro, intro]);

  // Печатание строк
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

  // Автозакрытие после завершения
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onClose]);
  
  // Функция для показа "Внутреннего голоса" (интро)
  const handleInnerVoice = useCallback(() => {
    if (intro) {
      setShowInnerVoice(true);
      setTimeout(() => setShowInnerVoice(false), 5000);
    }
  }, [intro]);

  // Определение цвета строки
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden"
      onClick={() => isComplete && onClose()}
    >
      {/* Анимированный градиентный фон */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${theme.glow} 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.8) 0%, transparent 50%),
                       radial-gradient(ellipse at 20% 70%, ${theme.glow} 0%, transparent 40%),
                       linear-gradient(180deg, #0a0a0f 0%, #0f0a15 50%, #0a0a0f 100%)`,
        }}
      />
      
      {/* Анимированные декоративные линии */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      {/* Виньетка по краям */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

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
            className="absolute inset-0 flex items-center justify-center p-8 z-20"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl text-center p-8 rounded-2xl"
              style={{ 
                background: 'rgba(0,0,0,0.5)',
                boxShadow: `0 0 60px ${theme.glow}, inset 0 0 30px rgba(255,255,255,0.05)`,
                border: `1px solid ${theme.primary}30`,
              }}
            >
              <p 
                className="text-xl md:text-2xl leading-relaxed font-light italic"
                style={{ color: theme.primary }}
              >
                "{intro}"
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Стих */}
      {!showIntro && (
        <motion.div 
          className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Декоративная рамка */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: `1px solid ${theme.primary}20`,
              boxShadow: `inset 0 0 100px ${theme.glow}, 0 0 50px ${theme.glow}`,
            }}
          />
          
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4 pt-6 relative z-10"
          >
            <h2 
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{ color: theme.primary, textShadow: `0 0 20px ${theme.glow}` }}
            >
              {poem.title}
            </h2>
            {poem.subtitle && (
              <p className="text-slate-400 text-sm">{poem.subtitle}</p>
            )}
          </motion.div>
          
          {/* Текст стиха */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-8 pb-8 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {displayedLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`text-lg md:text-xl leading-relaxed font-light ${getLineColor(line)}`}
              >
                {line}
              </motion.p>
            ))}
            
            {/* Текущая печатающаяся строка */}
            {currentLineText && (
              <p className={`text-lg md:text-xl leading-relaxed font-light ${getLineColor(currentLineText)}`}>
                {currentLineText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{ color: theme.primary }}
                >
                  |
                </motion.span>
              </p>
            )}
          </div>
          
          {/* Индикатор завершения */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pb-6 text-slate-400 text-sm"
            >
              Нажмите чтобы продолжить
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

export default PoemReveal;
