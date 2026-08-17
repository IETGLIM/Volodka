'use client';

/* ══════════════════════════════════════════════════════════════════════════════
   Volodka RPG — Enhanced Loading Screen
   Cyberpunk grid background · typewriter tips · circular progress · particles
   ══════════════════════════════════════════════════════════════════════════════ */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ── Scene-specific loading messages ──────────────────────────────────────── */

const SCENE_MESSAGES: Record<string, string[]> = {
  volodka_room:      ['Пробуждение в комнате Володьки...', 'Загрузка рабочего стола...'],
  street_night:      ['Ночной город готовится...', 'Неоновые огни загораются...'],
  street_winter:     ['Снежные улицы формируются...', 'Зима приходит в Володарск...'],
  cafe_evening:      ['Кафе «Чип» подаёт сигналы...', 'Аромат circuits brewing...'],
  office_day:        ['Офис корпорации загружается...', 'Данные синхронизируются...'],
  park_day:          ['Сад формируется из памяти...', 'Птицы возвращаются в код...'],
  library_day:       ['Библиотека открывает свои страницы...', 'Знания загружаются...'],
  factory_basement:  ['Подвал завода оживает...', 'Ржавчина и схемы...'],
  abandoned_factory: ['Заброшенный завод... Тишина и радиация...', 'Система защиты активна...'],
  chk_forest_zorge:  ['Лес ЗоргеMaterialising...', 'Древние деревья пробуждаются...'],
  rooftop_edge:      ['Крыша... Ветер и расстояние...', 'Город внизу мерцает...'],
  river_pier:        ['Причал реки формируется...', 'Вода течёт сквозь данные...'],
  battle:            ['Боевая система инициализация...', 'Подготовка к столкновению...'],
};

const DEFAULT_MESSAGES = ['Загрузка мира...', 'Инициализация систем...', 'Компиляция реальности...'];

/* ── Tips pool (Russian gameplay tips) ────────────────────────────────────── */

const TIPS = [
  'Используйте стихи, чтобы изменить реальность',
  'Нажмите Tab для журнала',
  'M — открыть карту мира',
  'WASD — движение, Shift — бег',
  'E — взаимодействие с объектами',
  'Карма влияет на доступные выборы',
  'Стресс ограничивает ваши возможности',
  'Поговорите с NPC несколько раз — реплики меняются',
  'Собранные стихи можно перечитывать в книге стихов',
  'Нажмите 1, 2, 3 для быстрого выбора в диалогах',
  'Исследуйте каждый уголок — скрытые стихи ждут',
  'У каждого NPC свой характер — подбирайте подход',
];

/* ── Circular progress ring ───────────────────────────────────────────────── */

const CIRCUMFERENCE = 2 * Math.PI * 54; // radius = 54

function CircularProgress({ progress }: { progress: number }) {
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  return (
    <svg width="140" height="140" viewBox="0 0 120 120" className="drop-shadow-lg">
      {/* Background ring */}
      <circle
        cx="60" cy="60" r="54"
        fill="none"
        stroke="rgba(0,229,255,0.08)"
        strokeWidth="3"
      />
      {/* Track marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 60 + Math.cos(angle) * 54;
        const y = 60 + Math.sin(angle) * 54;
        return (
          <circle
            key={i}
            cx={x} cy={y} r="1.2"
            fill={i / 12 <= progress / 100 ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.1)'}
          />
        );
      })}
      {/* Progress ring */}
      <motion.circle
        cx="60" cy="60" r="54"
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
      {/* Glow ring */}
      <motion.circle
        cx="60" cy="60" r="54"
        fill="none"
        stroke="rgba(0,229,255,0.15)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="60%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      {/* Center text */}
      <text
        x="60" y="56"
        textAnchor="middle"
        fill="#00e5ff"
        fontSize="22"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
        style={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}
      >
        {Math.round(progress)}%
      </text>
      <text
        x="60" y="72"
        textAnchor="middle"
        fill="rgba(0,229,255,0.4)"
        fontSize="8"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.15em"
      >
        ЗАГРУЗКА
      </text>
    </svg>
  );
}

/* ── Typewriter hook ──────────────────────────────────────────────────────── */

function useTypewriter(text: string, speed: number = 35) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return displayed;
}

/* ── Grid Background ──────────────────────────────────────────────────────── */

const CyberGrid = memo(function CyberGrid({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Horizontal lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${(i / 20) * 100}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(0,229,255,${0.03 + (progress / 100) * 0.05}) 30%, rgba(0,229,255,${0.03 + (progress / 100) * 0.05}) 70%, transparent 100%)`,
          }}
          animate={{ opacity: [0.3, 0.6 + (progress / 100) * 0.4, 0.3] }}
          transition={{
            duration: 2 + i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
      {/* Vertical lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${(i / 20) * 100}%`,
            background: `linear-gradient(180deg, transparent 0%, rgba(0,229,255,${0.02 + (progress / 100) * 0.04}) 30%, rgba(0,229,255,${0.02 + (progress / 100) * 0.04}) 70%, transparent 100%)`,
          }}
          animate={{ opacity: [0.2, 0.5 + (progress / 100) * 0.5, 0.2] }}
          transition={{
            duration: 2.5 + i * 0.12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        />
      ))}
      {/* Perspective transform for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(0,229,255,0.04) 0%, transparent 60%)',
        }}
      />
    </div>
  );
});

/* ── Progress-reactive particles ──────────────────────────────────────────── */

function LoadingParticles({ progress }: { progress: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
      threshold: Math.random() * 100,
      isAmber: Math.random() > 0.7,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {particles.map((p) => {
        const visible = progress >= p.threshold;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.isAmber
                ? 'radial-gradient(circle, rgba(251,191,36,0.6), transparent)'
                : 'radial-gradient(circle, rgba(0,229,255,0.5), transparent)',
            }}
            animate={visible
              ? {
                  y: [0, -20 - progress * 0.3],
                  opacity: [0, 0.8, 0.4, 0],
                }
              : { opacity: 0 }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeOut',
              delay: p.delay,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Exported Props ───────────────────────────────────────────────────────── */

export interface EnhancedLoadingScreenProps {
  progress?: number;
  message?: string;
  targetScene?: string;
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function EnhancedLoadingScreen({
  progress = 0,
  message,
  targetScene,
}: EnhancedLoadingScreenProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  /* Tip rotation */
  const [tipIndex, setTipIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tipIndex]);

  const currentTip = TIPS[tipIndex];
  const typedTip = useTypewriter(currentTip, 30);

  /* Scene-specific message */
  const sceneMessages = targetScene ? (SCENE_MESSAGES[targetScene] ?? DEFAULT_MESSAGES) : DEFAULT_MESSAGES;
  const sceneMsgIndex = Math.floor((clampedProgress / 100) * sceneMessages.length);
  const sceneMessage = message ?? sceneMessages[Math.min(sceneMsgIndex, sceneMessages.length - 1)] ?? DEFAULT_MESSAGES[0];
  const typedMessage = useTypewriter(sceneMessage, 40);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 overflow-hidden"
      style={{ zIndex: UI_LAYERS.LOADING }}
      aria-busy="true"
      aria-label="Загрузка"
    >
      {/* Cyberpunk grid background */}
      <CyberGrid progress={clampedProgress} />

      {/* Progress-reactive particles */}
      <LoadingParticles progress={clampedProgress} />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 4,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }}
      />

      {/* Glass panel content */}
      <motion.div
        className="relative flex flex-col items-center gap-6 p-8 rounded-lg"
        style={{
          zIndex: UI_LAYERS.LOADING,
          background: 'rgba(0, 8, 16, 0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,229,255,0.12)',
          boxShadow: '0 0 40px rgba(0,229,255,0.05), inset 0 0 30px rgba(0,0,0,0.4)',
          maxWidth: 'min(90vw, 400px)',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Title */}
        <motion.h1
          className="text-2xl sm:text-3xl font-bold tracking-[0.25em] uppercase"
          style={{
            color: '#00e5ff',
            textShadow: '0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15)',
            fontFamily: 'ui-monospace, monospace',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          ВОЛОДЬКА
        </motion.h1>

        {/* Circular progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <CircularProgress progress={clampedProgress} />
        </motion.div>

        {/* Scene message (typewriter) */}
        <div className="w-full text-center min-h-[20px]">
          <p
            className="text-xs font-mono tracking-wider"
            style={{ color: 'rgba(0,229,255,0.6)' }}
          >
            {typedMessage}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block ml-0.5"
              style={{ color: '#00e5ff' }}
            >
              ▌
            </motion.span>
          </p>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.2))' }} />\n          <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'rgba(251,191,36,0.5)' }}>
            Совет
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, transparent, rgba(251,191,36,0.2))' }} />
        </div>

        {/* Tip (typewriter) */}
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            className="text-sm text-center leading-relaxed max-w-xs"
            style={{ color: 'rgba(148,163,184,0.8)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {typedTip}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Corner decorations */}
      <motion.div className="absolute top-4 left-4 w-12 h-12 border-l border-t border-cyan-500/20 pointer-events-none" style={{ zIndex: UI_LAYERS.LOADING }} animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="absolute top-4 right-4 w-12 h-12 border-r border-t border-cyan-500/20 pointer-events-none" style={{ zIndex: UI_LAYERS.LOADING }} animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
      <motion.div className="absolute bottom-4 left-4 w-12 h-12 border-l border-b border-amber-500/15 pointer-events-none" style={{ zIndex: UI_LAYERS.LOADING }} animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
      <motion.div className="absolute bottom-4 right-4 w-12 h-12 border-r border-b border-amber-500/15 pointer-events-none" style={{ zIndex: UI_LAYERS.LOADING }} animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} />
    </div>
  );
}
