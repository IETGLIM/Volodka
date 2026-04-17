"use client";

import { memo, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// ТИПЫ
// ============================================

export type TransitionType = 'fade' | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down' | 'dissolve' | 'zoom' | 'spin' | 'glitch' | 'split';

export interface CinematicConfig {
  letterbox?: boolean;
  letterboxRatio?: number; // 0.1 - 0.3
  filmGrain?: boolean;
  grainIntensity?: number; // 0.1 - 1
  vignette?: boolean;
  vignetteIntensity?: number; // 0.1 - 1
  scratches?: boolean;
  chromaticAberration?: number; // 0 - 1
  colorGrade?: 'none' | 'sepia' | 'noir' | 'cold' | 'warm' | 'dream';
}

export interface SceneTransitionProps {
  isActive: boolean;
  type: TransitionType;
  duration?: number;
  onComplete?: () => void;
}

// ============================================
// LETTERBOX ЭФФЕКТ (КИНОПОЛОСЫ)
// ============================================

export const Letterbox = memo(function Letterbox({
  ratio = 0.12,
  animated = false,
  visible = true
}: {
  ratio?: number;
  animated?: boolean;
  visible?: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="fixed left-0 right-0 top-0 bg-black z-40 pointer-events-none"
            initial={{ height: animated ? 0 : `${ratio * 100}%` }}
            animate={{ height: `${ratio * 100}%` }}
            exit={{ height: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.div
            className="fixed left-0 right-0 bottom-0 bg-black z-40 pointer-events-none"
            initial={{ height: animated ? 0 : `${ratio * 100}%` }}
            animate={{ height: `${ratio * 100}%` }}
            exit={{ height: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </>
      )}
    </AnimatePresence>
  );
});

// ============================================
// ПЛЁНОЧНОЕ ЗЕРНО
// ============================================

export const FilmGrain = memo(function FilmGrain({
  intensity = 0.5,
  animated = true,
  color = 'white',
  layout = 'fixed' as 'fixed' | 'absolute',
  className = '',
  zIndex = 30,
}: {
  intensity?: number;
  animated?: boolean;
  color?: 'white' | 'colored';
  /** absolute — внутри оболочки; fixed — поверх вьюпорта (по умолчанию) */
  layout?: 'fixed' | 'absolute';
  className?: string;
  zIndex?: number;
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      setOffset(Math.random() * 100);
    }, 100);
    return () => clearInterval(interval);
  }, [animated]);

  const posClass = layout === 'fixed' ? 'fixed inset-0' : 'absolute inset-0';

  return (
    <div
      className={`${posClass} pointer-events-none ${className}`}
      style={{
        zIndex,
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.5 + intensity * 0.5}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundPosition: `${offset}% ${offset}%`,
        opacity: intensity * 0.5,
      }}
    />
  );
});

// ============================================
// ЦАРАПИНЫ ПЛЁНКИ
// ============================================

export const FilmScratches = memo(function FilmScratches({
  intensity = 0.3
}: {
  intensity?: number;
}) {
  const scratches = useMemo(() => Array.from({ length: Math.floor(intensity * 10) }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    width: Math.random() * 2 + 0.5,
    height: Math.random() * 30 + 10,
    delay: Math.random() * 5,
    duration: Math.random() * 0.5 + 0.2,
  })), [intensity]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      {scratches.map(s => (
        <motion.div
          key={s.id}
          className="absolute bg-white/10"
          style={{
            left: `${s.x}%`,
            top: '-10%',
            width: s.width,
            height: `${s.height}%`,
          }}
          animate={{
            y: ['0vh', '120vh'],
            opacity: [0, intensity * 0.5, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 10 + 5,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// ВИНЬЕТКА
// ============================================

export const Vignette = memo(function Vignette({
  intensity = 0.5,
  color = 'black'
}: {
  intensity?: number;
  color?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at center, transparent 30%, ${color} ${70 + intensity * 30}%)`,
        opacity: intensity,
      }}
    />
  );
});

// ============================================
// CHROMATIC ABERRATION
// ============================================

export const ChromaticAberration = memo(function ChromaticAberration({
  intensity = 0
}: {
  intensity?: number;
}) {
  if (intensity <= 0) return null;

  /** Пиковое смещение в px: при intensity > 0.5 без clamp слой визуально «уезжает» за край. */
  const maxShiftPx = 2.5;
  const ampPos = Math.min(intensity * 5, maxShiftPx);
  const ampNeg = Math.min(intensity * 3, maxShiftPx);

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none overflow-hidden"
      style={{ clipPath: 'inset(0)' }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, ampPos, 0, -ampNeg, 0],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
        style={{
          background: `linear-gradient(90deg, rgba(255,0,0,${intensity * 0.1}) 0%, transparent 30%, transparent 70%, rgba(0,255,255,${intensity * 0.1}) 100%)`,
        }}
      />
    </div>
  );
});

// ============================================
// ПЕРЕХОДЫ МЕЖДУ СЦЕНАМИ
// ============================================

export const SceneTransition = memo(function SceneTransition({
  isActive,
  type,
  duration = 1,
  onComplete,
}: SceneTransitionProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'idle'>('idle');
  const prevIsActiveRef = useRef(isActive);

  useEffect(() => {
    // Only trigger when isActive transitions from false to true
    if (isActive && !prevIsActiveRef.current) {
      let cancelled = false;
      const stepMs = duration * 500;
      const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

      const run = async () => {
        setPhase('in');
        await sleep(stepMs);
        if (cancelled) {
          setPhase('idle');
          return;
        }
        setPhase('hold');
        await sleep(stepMs);
        if (cancelled) {
          setPhase('idle');
          return;
        }
        setPhase('out');
        onComplete?.();
        await sleep(stepMs);
        if (cancelled) {
          setPhase('idle');
          return;
        }
        setPhase('idle');
      };

      void run();

      return () => {
        cancelled = true;
      };
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, duration, onComplete]);

  const transitionVariants = useMemo(() => {
    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: phase === 'hold' ? 1 : phase === 'in' ? 1 : 0 },
          exit: { opacity: 0 },
        };
      case 'wipe-left':
        return {
          initial: { x: '-100%' },
          animate: { x: phase === 'in' || phase === 'hold' ? '0%' : '100%' },
          exit: { x: '100%' },
        };
      case 'wipe-right':
        return {
          initial: { x: '100%' },
          animate: { x: phase === 'in' || phase === 'hold' ? '0%' : '-100%' },
          exit: { x: '-100%' },
        };
      case 'wipe-up':
        return {
          initial: { y: '100%' },
          animate: { y: phase === 'in' || phase === 'hold' ? '0%' : '-100%' },
          exit: { y: '-100%' },
        };
      case 'wipe-down':
        return {
          initial: { y: '-100%' },
          animate: { y: phase === 'in' || phase === 'hold' ? '0%' : '100%' },
          exit: { y: '100%' },
        };
      case 'zoom':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: phase === 'hold' ? 1.2 : 1, opacity: phase === 'hold' ? 1 : 0 },
          exit: { scale: 2, opacity: 0 },
        };
      case 'spin':
        return {
          initial: { rotate: -180, scale: 0 },
          animate: { rotate: phase === 'hold' ? 0 : 180, scale: phase === 'hold' ? 1 : 0 },
          exit: { rotate: 180, scale: 0 },
        };
      case 'glitch':
        return {
          initial: { opacity: 0, x: -50 },
          animate: {
            opacity: phase === 'hold' ? 1 : 0,
            x: phase === 'in' ? [0, 20, -20, 10, -10, 0] : 0,
          },
          exit: { opacity: 0, x: 50 },
        };
      case 'split':
        return {
          initial: { clipPath: 'inset(50% 0 50% 0)' },
          animate: {
            clipPath: phase === 'hold'
              ? 'inset(0% 0% 0% 0%)'
              : phase === 'in'
                ? 'inset(0% 0% 0% 0%)'
                : 'inset(50% 0 50% 0)'
          },
          exit: { clipPath: 'inset(50% 0 50% 0)' },
        };
      case 'dissolve':
      default:
        return {
          initial: { opacity: 0, filter: 'blur(20px)' },
          animate: {
            opacity: phase === 'hold' ? 1 : 0,
            filter: phase === 'hold' ? 'blur(0px)' : 'blur(20px)',
          },
          exit: { opacity: 0, filter: 'blur(20px)' },
        };
    }
  }, [type, phase]);

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          className="fixed inset-0 z-50 bg-black"
          initial={transitionVariants.initial}
          animate={transitionVariants.animate}
          exit={transitionVariants.exit}
          transition={{ duration: duration / 2, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </AnimatePresence>
  );
});

// ============================================
// CAMERA SHAKE
// ============================================

export const CameraShake = memo(function CameraShake({
  intensity = 0,
  children
}: {
  intensity?: number;
  children?: React.ReactNode;
}) {
  if (intensity <= 0) return <>{children}</>;

  return (
    <motion.div
      animate={{
        x: [0, -intensity * 10, intensity * 8, -intensity * 6, intensity * 4, -intensity * 2, 0],
        y: [0, intensity * 6, -intensity * 4, intensity * 3, -intensity * 2, intensity * 1, 0],
        rotate: [0, -intensity * 2, intensity * 1.5, -intensity * 1, intensity * 0.5, 0],
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
});

// ============================================
// SPLIT SCREEN ЭФФЕКТ
// ============================================

export const SplitScreen = memo(function SplitScreen({
  leftContent,
  rightContent,
  ratio = 0.5,
  direction = 'horizontal',
  borderStyle = 'line',
  animated = true,
}: {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  ratio?: number;
  direction?: 'horizontal' | 'vertical';
  borderStyle?: 'line' | 'blur' | 'none';
  animated?: boolean;
}) {
  const isHorizontal = direction === 'horizontal';
  const sizeKey = isHorizontal ? 'width' : 'height';
  /** Пружина даёт плавное догоняние при смене ratio (например перетаскивание разделителя). */
  const ratioTransition = animated
    ? { type: 'spring' as const, stiffness: 320, damping: 32, mass: 0.85 }
    : { duration: 0 };

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 overflow-hidden ${isHorizontal ? 'flex-row' : 'flex-col'}`}
    >
      <motion.div
        className="min-h-0 min-w-0 shrink-0 overflow-hidden"
        initial={animated ? { [sizeKey]: '0%' } : undefined}
        animate={{ [sizeKey]: `${ratio * 100}%` }}
        transition={ratioTransition}
      >
        {leftContent}
      </motion.div>

      {borderStyle !== 'none' && (
        <div
          className={`shrink-0 bg-white/20 ${isHorizontal ? 'w-px self-stretch' : 'h-px self-stretch'} ${borderStyle === 'blur' ? 'blur-sm' : ''}`}
        />
      )}

      <motion.div
        className="min-h-0 min-w-0 shrink-0 overflow-hidden"
        initial={animated ? { [sizeKey]: '0%' } : undefined}
        animate={{ [sizeKey]: `${(1 - ratio) * 100}%` }}
        transition={ratioTransition}
      >
        {rightContent}
      </motion.div>
    </div>
  );
});

// ============================================
// ЦВЕТОКОРРЕКЦИЯ
// ============================================

export const ColorGrade = memo(function ColorGrade({
  grade = 'none'
}: {
  grade?: CinematicConfig['colorGrade'];
}) {
  const filterConfig = useMemo(() => {
    switch (grade) {
      case 'sepia':
        return 'sepia(0.4) contrast(1.1) brightness(0.95)';
      case 'noir':
        return 'grayscale(1) contrast(1.3) brightness(0.9)';
      case 'cold':
        return 'saturate(0.9) hue-rotate(20deg) brightness(1.05)';
      case 'warm':
        return 'saturate(1.1) sepia(0.15) brightness(1.05)';
      case 'dream':
        return 'saturate(1.2) brightness(1.1) contrast(0.9) blur(0.5px)';
      default:
        return 'none';
    }
  }, [grade]);

  if (grade === 'none') return null;

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none"
      style={{ filter: filterConfig, mixBlendMode: 'normal' }}
    />
  );
});

// ============================================
// КОМБИНИРОВАННЫЙ ЭФФЕКТ
// ============================================

export const CinematicOverlay = memo(function CinematicOverlay({
  config = {},
  children,
}: {
  config?: CinematicConfig;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-full">
      {children}

      {config.letterbox && (
        <Letterbox ratio={config.letterboxRatio || 0.12} />
      )}

      {config.filmGrain && (
        <FilmGrain intensity={config.grainIntensity || 0.5} />
      )}

      {config.scratches && (
        <FilmScratches intensity={config.vignetteIntensity || 0.3} />
      )}

      {config.vignette && (
        <Vignette intensity={config.vignetteIntensity || 0.5} />
      )}

      {(config.chromaticAberration || 0) > 0 && (
        <ChromaticAberration intensity={config.chromaticAberration} />
      )}

      {config.colorGrade && config.colorGrade !== 'none' && (
        <ColorGrade grade={config.colorGrade} />
      )}
    </div>
  );
});

// ============================================
// SLOW MOTION ИНДИКАТОР
// ============================================

export const SlowMotionIndicator = memo(function SlowMotionIndicator({
  isActive,
  text = 'SLOW MOTION',
}: {
  isActive: boolean;
  text?: string;
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          <div className="text-6xl font-bold text-white/20 tracking-widest">
            {text.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============================================
// DRAMATIC TEXT REVEAL
// ============================================

export const DramaticTextReveal = memo(function DramaticTextReveal({
  text,
  isVisible,
  onComplete,
}: {
  text: string;
  isVisible: boolean;
  onComplete?: () => void;
}) {
  const words = text.split(' ');

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mx-2 text-4xl md:text-6xl font-bold text-white"
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: i * 0.2,
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1]
                }}
                style={{ textShadow: '0 0 30px rgba(255,255,255,0.5)' }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/** Именованный экспорт для точечных импортов + default для совместимости с ленивыми импортами. */
export default CinematicOverlay;
