"use client";

import { memo, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// ТИПЫ
// ============================================

export type AnimeEffectType =
  | 'speed-lines'
  | 'impact-frame'
  | 'flash'
  | 'manga-panel'
  | 'emotional-burst'
  | 'dramatic-zoom'
  | 'concentric-circles'
  | 'petal-storm';

export interface AnimeEffectProps {
  type: AnimeEffectType;
  intensity?: number;
  color?: string;
  duration?: number;
  trigger?: boolean;
  onComplete?: () => void;
}

// ============================================
// SPEED LINES (СКОРОСТНЫЕ ЛИНИИ)
// ============================================

export const SpeedLines = memo(function SpeedLines({
  intensity = 1,
  color = 'white',
  direction = 'center',
}: {
  intensity?: number;
  color?: string;
  direction?: 'center' | 'left' | 'right' | 'up' | 'down';
}) {
  const lines = useMemo(() => Array.from({ length: Math.floor(30 * intensity) }, (_, i) => ({
    id: i,
    angle: (i / 30) * 360,
    length: Math.random() * 200 + 100,
    delay: Math.random() * 0.3,
    opacity: Math.random() * 0.5 + 0.3,
  })), [intensity]);

  const getLinePosition = useCallback((angle: number) => {
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * 50;
    const y = Math.sin(radians) * 50;
    return { x, y };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map(line => {
        const { x, y } = getLinePosition(line.angle);
        return (
          <motion.div
            key={line.id}
            className="absolute left-1/2 top-1/2 origin-center"
            style={{
              width: 2,
              height: line.length,
              backgroundColor: color,
              opacity: line.opacity,
              transform: `translate(-50%, -50%) rotate(${line.angle}deg)`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1.5, 1],
              opacity: [0, line.opacity, line.opacity * 0.5],
              y: [0, y * 5],
              x: [0, x * 5],
            }}
            transition={{
              duration: 0.5,
              delay: line.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
});

// ============================================
// IMPACT FRAME (УДАРНЫЙ КАДР)
// ============================================

export const ImpactFrame = memo(function ImpactFrame({
  intensity = 1,
  color = '#ff0000',
  trigger = true,
  onComplete,
}: {
  intensity?: number;
  color?: string;
  trigger?: boolean;
  onComplete?: () => void;
}) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Вспышка */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: color }}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Взрывные линии */}
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 bg-white"
              style={{
                width: 3,
                height: 100,
                transformOrigin: 'center top',
                transform: `translate(-50%, 0) rotate(${i * 22.5}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 2, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.4, delay: i * 0.01 }}
            />
          ))}

          {/* Центральный круг */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 150,
              height: 150,
              border: `4px solid ${color}`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Энергетические искры */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = Math.random() * 360;
            const distance = Math.random() * 200 + 100;
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle * Math.PI / 180) * distance,
                  y: Math.sin(angle * Math.PI / 180) * distance,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============================================
// MANGA PANELS (ПАНЕЛИ МАНГИ)
// ============================================

export interface MangaPanel {
  id: string;
  content: React.ReactNode;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full';
  size?: 'small' | 'medium' | 'large';
  borderColor?: string;
  focusEffect?: boolean;
}

export const MangaPanels = memo(function MangaPanels({
  panels,
  currentPanel = 0,
  animated = true,
}: {
  panels: MangaPanel[];
  currentPanel?: number;
  animated?: boolean;
}) {
  const getPositionStyle = (position: MangaPanel['position']) => {
    switch (position) {
      case 'top-left':
        return { top: 0, left: 0, width: '50%', height: '50%' };
      case 'top-right':
        return { top: 0, right: 0, width: '50%', height: '50%' };
      case 'bottom-left':
        return { bottom: 0, left: 0, width: '50%', height: '50%' };
      case 'bottom-right':
        return { bottom: 0, right: 0, width: '50%', height: '50%' };
      case 'center':
        return { top: '25%', left: '25%', width: '50%', height: '50%' };
      case 'full':
      default:
        return { top: 0, left: 0, width: '100%', height: '100%' };
    }
  };

  return (
    <div className="relative w-full h-full bg-white">
      {panels.map((panel, index) => (
        <motion.div
          key={panel.id}
          className="absolute overflow-hidden"
          style={{
            ...getPositionStyle(panel.position),
            border: `3px solid ${panel.borderColor || '#000'}`,
          }}
          initial={animated ? { opacity: 0, scale: 0.8 } : {}}
          animate={{
            opacity: index <= currentPanel ? 1 : 0,
            scale: index === currentPanel ? 1.02 : 1,
          }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {panel.content}

          {/* Эффект фокуса */}
          {panel.focusEffect && index === currentPanel && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                boxShadow: [
                  'inset 0 0 20px rgba(0,0,0,0.3)',
                  'inset 0 0 40px rgba(0,0,0,0.5)',
                  'inset 0 0 20px rgba(0,0,0,0.3)',
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
});

// ============================================
// EMOTIONAL BURST (ЭМОЦИОНАЛЬНЫЙ ВЗРЫВ)
// ============================================

export const EmotionalBurst = memo(function EmotionalBurst({
  emotion = 'shock',
  intensity = 1,
  color = '#ffcc00',
  trigger = true,
}: {
  emotion?: 'shock' | 'joy' | 'anger' | 'sadness' | 'love';
  intensity?: number;
  color?: string;
  trigger?: boolean;
}) {
  const [isActive, setIsActive] = useState(false);
  const prevTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTriggerRef.current) {
      // Trigger transitioned from false to true - this is intentional animation trigger
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true);
      const timer = setTimeout(() => setIsActive(false), 1500);
      return () => clearTimeout(timer);
    }
    prevTriggerRef.current = trigger;
  }, [trigger]);

  const getEmotionSymbol = useCallback(() => {
    switch (emotion) {
      case 'shock': return '!!';
      case 'joy': return '♪';
      case 'anger': return '💢';
      case 'sadness': return '💧';
      case 'love': return '💕';
      default: return '!!';
    }
  }, [emotion]);

  if (!isActive) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Фоновые лучи */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 4,
            height: 150,
            backgroundColor: color,
            transformOrigin: 'center bottom',
            transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
          transition={{ duration: 0.5, delay: i * 0.03 }}
        />
      ))}

      {/* Символ эмоции */}
      <motion.div
        className="relative z-10 text-8xl font-bold"
        style={{ color }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{
          scale: [0, 1.5, 1],
          rotate: [-30, 10, 0],
        }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {getEmotionSymbol()}
      </motion.div>

      {/* Концентрические круги */}
      {[1, 2, 3].map(i => (
        <motion.div
          key={`circle-${i}`}
          className="absolute rounded-full"
          style={{
            width: 100 * i,
            height: 100 * i,
            border: `3px solid ${color}`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.8, delay: i * 0.1 }}
        />
      ))}
    </motion.div>
  );
});

// ============================================
// DRAMATIC ZOOM (ДРАМАТИЧНЫЙ ЗУМ)
// ============================================

export const DramaticZoom = memo(function DramaticZoom({
  children,
  trigger = true,
  intensity = 1,
  duration = 0.5,
}: {
  children: React.ReactNode;
  trigger?: boolean;
  intensity?: number;
  duration?: number;
}) {
  return (
    <motion.div
      animate={trigger ? {
        scale: [1, 1 + 0.3 * intensity, 1 + 0.1 * intensity],
        opacity: [1, 1, 1],
      } : {}}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
});

// ============================================
// CONCENTRIC CIRCLES (КОНЦЕНТРИЧЕСКИЕ КРУГИ)
// ============================================

export const ConcentricCircles = memo(function ConcentricCircles({
  count = 5,
  color = 'white',
  speed = 1,
  pulseIntensity = 0.3,
}: {
  count?: number;
  color?: string;
  speed?: number;
  pulseIntensity?: number;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: (i + 1) * 60,
            height: (i + 1) * 60,
            border: `1px solid ${color}`,
            opacity: 0.3 - i * 0.05,
          }}
          animate={{
            scale: [1, 1 + pulseIntensity, 1],
            opacity: [0.3 - i * 0.05, 0.5 - i * 0.05, 0.3 - i * 0.05],
          }}
          transition={{
            duration: 2 / speed,
            delay: i * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// PETAL STORM (ШТОРМ ЛЕПЕСТКОВ)
// ============================================

export const PetalStorm = memo(function PetalStorm({
  type = 'sakura',
  intensity = 1,
}: {
  type?: 'sakura' | 'snow' | 'leaves' | 'stars';
  intensity?: number;
}) {
  const particles = useMemo(() => Array.from({ length: Math.floor(50 * intensity) }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 5 + 5,
    size: Math.random() * 10 + 5,
    rotation: Math.random() * 360,
    sway: Math.random() * 100 - 50,
  })), [intensity]);

  const getParticle = useCallback((type: string) => {
    switch (type) {
      case 'sakura':
        return '🌸';
      case 'snow':
        return '❄️';
      case 'leaves':
        return '🍃';
      case 'stars':
        return '✨';
      default:
        return '🌸';
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-10%',
            fontSize: p.size,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, p.sway, 0],
            rotate: [0, p.rotation * 2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {getParticle(type)}
        </motion.div>
      ))}
    </div>
  );
});

// ============================================
// FLASH EFFECT (ВСПЫШКА)
// ============================================

export const FlashEffect = memo(function FlashEffect({
  trigger = true,
  color = 'white',
  duration = 0.3,
  onComplete,
}: {
  trigger?: boolean;
  color?: string;
  duration?: number;
  onComplete?: () => void;
}) {
  const [isActive, setIsActive] = useState(false);
  const prevTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTriggerRef.current) {
      // Trigger transitioned from false to true - this is intentional animation trigger
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
    prevTriggerRef.current = trigger;
  }, [trigger, duration, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        />
      )}
    </AnimatePresence>
  );
});

// ============================================
// ANIME TEXT BOX (ТЕКСТОВОЕ ОКНО В СТИЛЕ АНИМЕ)
// ============================================

export const AnimeTextBox = memo(function AnimeTextBox({
  text,
  speaker,
  emotion = 'neutral',
  isVisible = true,
  onAdvance,
}: {
  text: string;
  speaker?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'shocked';
  isVisible?: boolean;
  onAdvance?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isVisible && text) {
      setDisplayedText('');
      setIsTyping(true);
      let charIndex = 0;

      if (typingRef.current) clearInterval(typingRef.current);

      typingRef.current = setInterval(() => {
        if (charIndex < text.length) {
          setDisplayedText(text.slice(0, charIndex + 1));
          charIndex++;
        } else {
          if (typingRef.current) clearInterval(typingRef.current);
          setIsTyping(false);
        }
      }, 40);

      return () => {
        if (typingRef.current) clearInterval(typingRef.current);
      };
    }
  }, [isVisible, text]);

  const getBorderColor = useCallback(() => {
    switch (emotion) {
      case 'happy': return '#f472b6';
      case 'sad': return '#60a5fa';
      case 'angry': return '#ef4444';
      case 'shocked': return '#fbbf24';
      default: return '#a855f7';
    }
  }, [emotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-8 left-4 right-4 z-40"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={onAdvance}
        >
          <div
            className="relative bg-black/90 backdrop-blur-sm rounded-lg p-4 md:p-6"
            style={{ borderLeft: `4px solid ${getBorderColor()}` }}
          >
            {speaker && (
              <div
                className="absolute -top-3 left-4 px-3 py-1 rounded text-sm font-bold"
                style={{
                  backgroundColor: getBorderColor(),
                  color: 'white',
                }}
              >
                {speaker}
              </div>
            )}

            <p className="text-lg md:text-xl text-white leading-relaxed">
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="ml-1"
                >
                  ▼
                </motion.span>
              )}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============================================
// КОМБИНИРОВАННЫЙ ЭФФЕКТ
// ============================================

export const AnimeEffect = memo(function AnimeEffect({
  type,
  intensity = 1,
  color = 'white',
  duration = 1,
  trigger = true,
  onComplete,
}: AnimeEffectProps) {
  switch (type) {
    case 'speed-lines':
      return <SpeedLines intensity={intensity} color={color} />;
    case 'impact-frame':
      return (
        <ImpactFrame
          intensity={intensity}
          color={color}
          trigger={trigger}
          onComplete={onComplete}
        />
      );
    case 'flash':
      return (
        <FlashEffect
          trigger={trigger}
          color={color}
          duration={duration}
          onComplete={onComplete}
        />
      );
    case 'emotional-burst':
      return <EmotionalBurst intensity={intensity} color={color} trigger={trigger} />;
    case 'concentric-circles':
      return <ConcentricCircles color={color} pulseIntensity={intensity * 0.3} />;
    case 'petal-storm':
      return <PetalStorm intensity={intensity} type="sakura" />;
    default:
      return null;
  }
});

export default AnimeEffect;
