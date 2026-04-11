"use client";

import { memo, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// ТИПЫ ДЛЯ АНИМЕ-ЗАСТАВОК
// ============================================

export interface AnimeCutsceneData {
  id: string;
  title: string;
  subtitle?: string;
  text: string[];
  theme: 'childhood' | 'love' | 'betrayal' | 'hope' | 'loneliness' | 'finale';
  duration?: number; // мс на строку (базовая пауза после печати)
  typingSpeed?: number; // мс на символ (по умолчанию 45)
  glitchEffect?: boolean; // добавить лёгкий глитч в стиле киберпанка
}

// ============================================
// ЦВЕТОВЫЕ ТЕМЫ (расширены для киберпанк-эстетики)
// ============================================

const THEME_CONFIG = {
  childhood: {
    bgGradient: 'from-amber-900/90 via-orange-800/80 to-yellow-900/90',
    accentColor: '#fbbf24',
    particleColor: '#fcd34d',
    titleColor: '#fef3c7',
    textColor: '#fef9c3',
    overlay: 'bg-gradient-to-b from-amber-500/10 to-orange-900/30',
    pattern: 'warm',
    glowColor: 'rgba(251, 191, 36, 0.2)',
  },
  love: {
    bgGradient: 'from-rose-900/90 via-pink-800/80 to-red-900/90',
    accentColor: '#f472b6',
    particleColor: '#fda4af',
    titleColor: '#fce7f3',
    textColor: '#fdf2f8',
    overlay: 'bg-gradient-to-b from-pink-500/10 to-rose-900/30',
    pattern: 'hearts',
    glowColor: 'rgba(244, 114, 182, 0.2)',
  },
  betrayal: {
    bgGradient: 'from-slate-900/95 via-gray-900/90 to-zinc-900/95',
    accentColor: '#ef4444',
    particleColor: '#f87171',
    titleColor: '#fca5a5',
    textColor: '#e5e7eb',
    overlay: 'bg-gradient-to-b from-red-900/20 to-black/50',
    pattern: 'shatter',
    glowColor: 'rgba(239, 68, 68, 0.15)',
  },
  hope: {
    bgGradient: 'from-violet-900/90 via-purple-800/80 to-indigo-900/90',
    accentColor: '#a78bfa',
    particleColor: '#c4b5fd',
    titleColor: '#ede9fe',
    textColor: '#f5f3ff',
    overlay: 'bg-gradient-to-b from-purple-500/10 to-violet-900/30',
    pattern: 'stars',
    glowColor: 'rgba(167, 139, 250, 0.2)',
  },
  loneliness: {
    bgGradient: 'from-slate-950/95 via-gray-900/90 to-slate-950/95',
    accentColor: '#64748b',
    particleColor: '#94a3b8',
    titleColor: '#cbd5e1',
    textColor: '#e2e8f0',
    overlay: 'bg-gradient-to-b from-slate-800/20 to-black/60',
    pattern: 'snow',
    glowColor: 'rgba(148, 163, 184, 0.1)',
  },
  finale: {
    bgGradient: 'from-indigo-950/90 via-violet-900/80 to-purple-950/90',
    accentColor: '#c084fc',
    particleColor: '#e9d5ff',
    titleColor: '#f3e8ff',
    textColor: '#faf5ff',
    overlay: 'bg-gradient-to-b from-violet-500/10 to-indigo-950/30',
    pattern: 'ascending',
    glowColor: 'rgba(192, 132, 252, 0.2)',
  },
};

// ============================================
// УЛУЧШЕННЫЕ ЧАСТИЦЫ ДЛЯ ФОНА
// ============================================

const ParticleField = memo(function ParticleField({
  theme,
  count = 40
}: {
  theme: keyof typeof THEME_CONFIG;
  count?: number;
}) {
  const config = THEME_CONFIG[theme];

  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 5 + 1,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 3,
    opacity: Math.random() * 0.4 + 0.1,
  })), [count]);

  return (
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
            backgroundColor: config.particleColor,
            boxShadow: `0 0 ${p.size * 2}px ${config.particleColor}`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.sin(p.id) * 15, 0],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// СЛОЖНЫЕ ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ
// ============================================

const DecorativeElements = memo(function DecorativeElements({
  theme
}: {
  theme: keyof typeof THEME_CONFIG;
}) {
  const config = THEME_CONFIG[theme];

  const renderPattern = useCallback(() => {
    switch (config.pattern) {
      case 'warm':
        return (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                className="absolute origin-top"
                style={{
                  width: 2,
                  height: '60%',
                  left: `${20 + i * 15}%`,
                  top: 0,
                  background: `linear-gradient(to bottom, ${config.accentColor}30, transparent)`,
                  transform: `rotate(${-10 + i * 5}deg)`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 1.5 }}
              />
            ))}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                className="absolute w-1 h-1 rounded-full bg-amber-300/40"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100],
                  x: [0, Math.random() * 40 - 20],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  delay: Math.random() * 3,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        );

      case 'hearts':
        return (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`heart-${i}`}
                className="absolute text-pink-300/20"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 60}%`,
                  fontSize: `${Math.random() * 30 + 15}px`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.2, 1],
                  opacity: [0, 0.3, 0.2],
                }}
                transition={{ delay: i * 0.3, duration: 1 }}
              >
                ♥
              </motion.div>
            ))}
            <motion.div
              className="absolute w-full h-px top-1/4"
              style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}30, transparent)` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 1.5 }}
            />
            <motion.div
              className="absolute w-full h-px bottom-1/3"
              style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}20, transparent)` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 1.5 }}
            />
          </>
        );

      case 'shatter':
        return (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`crack-${i}`}
                className="absolute bg-red-500/15"
                style={{
                  width: 1 + Math.random(),
                  height: Math.random() * 150 + 50,
                  left: `${10 + i * 12}%`,
                  top: `${Math.random() * 30}%`,
                  transform: `rotate(${Math.random() * 40 - 20}deg)`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              />
            ))}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`fragment-${i}`}
                className="absolute w-0.5 h-0.5 bg-red-400/50"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                }}
                animate={{
                  y: ['0vh', '110vh'],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, Math.random() * 360],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        );

      case 'stars':
        return (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute text-purple-300"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 70}%`,
                  fontSize: `${Math.random() * 15 + 8}px`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.6, 0.3],
                  scale: [0.5, 1.2, 1],
                }}
                transition={{
                  delay: 0.3 + i * 0.1,
                  duration: 0.8,
                }}
              >
                ✦
              </motion.div>
            ))}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`glow-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 200 + i * 100,
                  height: 200 + i * 100,
                  left: `${30 + i * 15}%`,
                  top: `${20 + i * 10}%`,
                  background: `radial-gradient(circle, ${config.accentColor}15, transparent 70%)`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        );

      case 'snow':
        return (
          <>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`snow-${i}`}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
                animate={{
                  y: ['0vh', '110vh'],
                  x: [0, Math.random() * 80 - 40],
                }}
                transition={{
                  duration: Math.random() * 8 + 5,
                  delay: Math.random() * 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(100,116,139,0.1), transparent)',
              }}
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
              }}
            />
          </>
        );

      case 'ascending':
        return (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`beam-${i}`}
                className="absolute bottom-0"
                style={{
                  width: 1,
                  height: '40%',
                  left: `${10 + i * 12}%`,
                  background: `linear-gradient(to top, transparent, ${config.accentColor}30, transparent)`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 1.5 }}
              />
            ))}
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={`vortex-${i}`}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: config.particleColor,
                  left: '50%',
                  bottom: '20%',
                }}
                animate={{
                  x: [0, Math.cos(i * 0.5) * 200],
                  y: [0, -200 - Math.random() * 100],
                  opacity: [0.5, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
            <motion.div
              className="absolute left-1/2 bottom-1/4 -translate-x-1/2"
              style={{
                width: 300,
                height: 300,
                background: `radial-gradient(circle, ${config.accentColor}30, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
            />
          </>
        );

      default:
        return null;
    }
  }, [config]);

  return <div className="absolute inset-0 overflow-hidden">{renderPattern()}</div>;
});

// ============================================
// ЭФФЕКТ ТИПИПАНИЯ С ВОЗМОЖНОСТЬЮ ГЛИТЧА
// ============================================

const TypewriterText = memo(function TypewriterText({
  text,
  color,
  accentColor,
  isTyping,
  glitchEffect = false,
}: {
  text: string;
  color: string;
  accentColor: string;
  isTyping: boolean;
  glitchEffect?: boolean;
}) {
  return (
    <motion.p
      className="text-2xl md:text-3xl leading-relaxed font-light"
      style={{ color, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
      animate={!isTyping && glitchEffect ? {
        textShadow: [
          `0 0 0 ${color}`,
          `2px 0 0 rgba(255,0,0,0.5), -2px 0 0 rgba(0,255,255,0.5)`,
          `0 0 0 ${color}`,
        ]
      } : undefined}
      transition={{ duration: 0.3, repeat: 1, repeatDelay: 0.5 }}
    >
      {text}
      {isTyping && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: accentColor }}
        >
          |
        </motion.span>
      )}
    </motion.p>
  );
});

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ ЗАСТАВКИ
// ============================================

interface AnimeCutsceneProps {
  cutscene: AnimeCutsceneData;
  onComplete: () => void;
  skipable?: boolean;
  onSoundEvent?: (event: string) => void; // колбэк для звуков
}

export const AnimeCutscene = memo(function AnimeCutscene({
  cutscene,
  onComplete,
  skipable = true,
  onSoundEvent,
}: AnimeCutsceneProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const config = THEME_CONFIG[cutscene.theme];
  const textRef = useRef<string>('');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Скорость печати по умолчанию 45 мс, можно переопределить в cutscene
  const typingSpeed = cutscene.typingSpeed || 45;
  const linePause = cutscene.duration || 3500;

  // Показ заголовка
  useEffect(() => {
    titleTimerRef.current = setTimeout(() => {
      setShowTitle(false);
      setCurrentLineIndex(0);
      onSoundEvent?.('title_end');
    }, 2800);
    onSoundEvent?.('cutscene_start');
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    };
  }, [onSoundEvent]);

  // Печатание текста
  useEffect(() => {
    if (currentLineIndex < 0 || currentLineIndex >= cutscene.text.length) return;

    const line = cutscene.text[currentLineIndex];
    textRef.current = line;
    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < line.length) {
        setDisplayedText(line.slice(0, charIndex + 1));
        charIndex++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
        onSoundEvent?.('line_complete');

        timeoutRef.current = setTimeout(() => {
          if (currentLineIndex < cutscene.text.length - 1) {
            setCurrentLineIndex(prev => prev + 1);
          } else {
            onSoundEvent?.('cutscene_end');
            setTimeout(onComplete, 1800);
          }
        }, linePause);
      }
    }, typingSpeed);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentLineIndex, cutscene.text, linePause, typingSpeed, onComplete, onSoundEvent]);

  // Пропуск
  const handleSkip = useCallback(() => {
    if (!skipable) return;
    onSoundEvent?.('skip');

    if (showTitle) {
      setShowTitle(false);
      setCurrentLineIndex(0);
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
        titleTimerRef.current = null;
      }
    } else if (isTyping) {
      setDisplayedText(textRef.current);
      setIsTyping(false);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (currentLineIndex < cutscene.text.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [skipable, showTitle, isTyping, currentLineIndex, cutscene.text.length, onComplete, onSoundEvent]);

  // Поддержка свайпа на мобильных
  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.changedTouches[0].screenX; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX - e.changedTouches[0].screenX > 50) handleSkip();
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleSkip]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={handleSkip}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Фон с анимацией */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Градиентное свечение */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${config.glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* Оверлей */}
      <div className={`absolute inset-0 ${config.overlay}`} />

      {/* Частицы */}
      <ParticleField theme={cutscene.theme} count={50} />

      {/* Декоративные элементы */}
      <DecorativeElements theme={cutscene.theme} />

      {/* Виньетка */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Контент */}
      <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
        <AnimatePresence mode="wait">
          {showTitle ? (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 1 }}
            >
              {/* Декоративный орнамент сверху */}
              <motion.div
                className="mx-auto mb-8 w-40 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
              />

              {/* Иконка темы */}
              <motion.div
                className="text-4xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
              >
                {cutscene.theme === 'childhood' && '🏠'}
                {cutscene.theme === 'love' && '💕'}
                {cutscene.theme === 'betrayal' && '💔'}
                {cutscene.theme === 'hope' && '✨'}
                {cutscene.theme === 'loneliness' && '❄️'}
                {cutscene.theme === 'finale' && '🌟'}
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-bold tracking-wide mb-4"
                style={{
                  color: config.titleColor,
                  textShadow: `0 0 40px ${config.accentColor}50, 0 0 80px ${config.accentColor}30`,
                }}
                initial={{ letterSpacing: '0.5em' }}
                animate={{ letterSpacing: '0.1em' }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                {cutscene.title}
              </motion.h1>

              {cutscene.subtitle && (
                <motion.p
                  className="text-xl opacity-80"
                  style={{ color: config.textColor }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {cutscene.subtitle}
                </motion.p>
              )}

              {/* Декоративный орнамент снизу */}
              <motion.div
                className="mx-auto mt-8 w-40 h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`line-${currentLineIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="min-h-[100px] flex items-center justify-center"
            >
              <TypewriterText
                text={displayedText}
                color={config.textColor}
                accentColor={config.accentColor}
                isTyping={isTyping}
                glitchEffect={cutscene.glitchEffect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Индикатор прогресса */}
      {!showTitle && (
        <motion.div
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-1.5">
            {cutscene.text.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentLineIndex ? 16 : 6,
                  height: 6,
                  backgroundColor: i <= currentLineIndex ? config.accentColor : `${config.accentColor}30`,
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: i === currentLineIndex ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Подсказка */}
      {skipable && (
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-sm"
          style={{ color: config.textColor }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          Нажмите или свайпните для продолжения
        </motion.div>
      )}
    </motion.div>
  );
});

export default AnimeCutscene;
