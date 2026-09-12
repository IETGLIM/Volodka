/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Quick Time Event (QTE) Overlay
   
   Драматический оверлей для быстрых событий (QTE) в игре.
   Отображает промпт с клавишей, таймером и визуальной обратной связью
   для разных типов QTE: нажатие, удержание, последовательность, мashing.
   
   Features:
   - Центральный дисплей с большой иконкой клавиши / Central key prompt display with large key icon
   - Сужающееся/расширяющееся кольцо таймера / Shrinking/expanding ring timer by event type
   - Для 'sequence': показ предстоящих клавиш / For sequence: show upcoming keys trail
   - Для 'mash': счётчик нажатий / For mash: counter showing presses needed
   - Для 'hold': заполняющееся кольцо / For hold: fill-up ring while holding
   - Анимации успеха/неудачи / Success/failure feedback animations
   - Сложность влияет на скорость и окно / Difficulty affects ring speed and window size
   - Вспышка края экрана при почти-промахе / Screen edge flash on near-miss
   - Множитель комбо для последовательностей / Combo multiplier display for sequences
   - Триггеры звуков через callback / Sound effect triggers via callback
   
   @component QuickTimeEventOverlay
   @requires framer-motion – для драматических анимаций
────────────────────────────────────────────────────────────────────────────── */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard,
  Repeat,
  ArrowRight,
  Check,
  X,
  Volume2,
} from 'lucide-react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Type Definitions ─── */

/* v4.30: типы QTE перенесены в engine-слой (src/engine/qte/qteTypes.ts),
 * чтобы EventBus-домен qteEvents и этот оверлей зависели от одного
 * нейтрального источника. Экспорт сохранён для обратной совместимости. */
export type {
  QTEEventType,
  QTEKeyBinding,
  QTEDifficulty,
  QTEResult,
  QTEFinalResult,
} from '@/engine/qte/qteTypes';
import type { QTEEventType, QTEKeyBinding, QTEDifficulty, QTEResult, QTEFinalResult } from '@/engine/qte/qteTypes';

/**
 * Состояние QTE / QTE internal state
 */
interface QTEState {
  /** Текущий результат / Current result */
  result: QTEResult;
  /** Оставшееся время в мс / Remaining time in ms */
  timeRemaining: number;
  /** Прогресс выполнения (0–1) / Completion progress (0–1) */
  progress: number;
  /** Текущий индекс в последовательности / Current index in sequence */
  currentIndex: number;
  /** Счётчик нажатий (для mash) / Press counter for mash */
  pressCount: number;
  /** Множитель комбо / Combo multiplier */
  comboMultiplier: number;
  /** Был ли near-miss / Was there a near-miss */
  nearMiss: boolean;
}

/**
 * Пропсы компонента QuickTimeEventOverlay
 * Props for QuickTimeEventOverlay component
 */
export interface QuickTimeEventOverlayProps {
  /** Активен ли QTE / Whether QTE is active */
  isActive: boolean;
  /** Тип события QTE / Type of QTE event */
  eventType: QTEEventType;
  /** Привязки клавиш / Array of key bindings */
  keyBindings: QTEKeyBinding[];
  /** Длительность в мс / Duration in ms */
  duration: number;
  /** Callback при успешном выполнении / Success callback */
  onSuccess?: (result: QTEFinalResult) => void;
  /** Callback при неудаче / Failure callback */
  onFailure?: (result: QTEFinalResult) => void;
  /** Сложность события / Event difficulty */
  difficulty?: QTEDifficulty;
  /** Общее количество нажатий (для mash) / Total presses needed for mash */
  targetPresses?: number;
  /** Триггер звука / Sound effect trigger callback */
  onSoundTrigger?: (soundId: string) => void;
  /** Произвольные данные для передачи в callbacks / Custom data for callbacks */
  contextData?: Record<string, unknown>;
}

/* ─── Constants ─── */

/** Конфигурация сложности / Difficulty configuration */
const DIFFICULTY_CONFIG: Record<QTEDifficulty, {
  /** Множитель скорости кольца / Ring speed multiplier */
  speedMult: number;
  /** Размер окна успеха (0–1) / Success window size (0–1) */
  windowSize: number;
  /** Цвет акцента / Accent color */
  color: string;
  /** Цвет свечения / Glow color */
  glowColor: string;
  /** Метка сложности / Difficulty label */
  label: string;
}> = {
  easy: {
    speedMult: 0.7,
    windowSize: 0.5,
    color: '#44cc66',
    glowColor: 'rgba(68,204,102,0.5)',
    label: 'ЛЁГКО',
  },
  normal: {
    speedMult: 1.0,
    windowSize: 0.35,
    color: '#44aacc',
    glowColor: 'rgba(68,170,204,0.5)',
    label: 'НОРМАЛЬ',
  },
  hard: {
    speedMult: 1.3,
    windowSize: 0.22,
    color: '#ccaa44',
    glowColor: 'rgba(204,170,68,0.5)',
    label: 'СЛОЖНО',
  },
  extreme: {
    speedMult: 1.6,
    windowSize: 0.15,
    color: '#cc5544',
    glowColor: 'rgba(204,85,68,0.6)',
    label: 'ЭКСТРЕМ',
  },
  impossible: {
    speedMult: 2.0,
    windowSize: 0.08,
    color: '#ff0066',
    glowColor: 'rgba(255,0,102,0.7)',
    label: 'НЕВОЗМ.',
  },
};

/** Размеры элементов UI / UI element sizes */
const SIZES = {
  ringOuter: 160,
  ringInner: 120,
  keyDisplay: 80,
  trailItem: 48,
  flashDuration: 200,
};

/** Звуковые идентификаторы / Sound IDs */
const SOUNDS = {
  start: 'qte:start',
  success: 'qte:success',
  failure: 'qte:failure',
  nearMiss: 'qte:near_miss',
  press: 'qte:press',
  complete: 'qte:complete',
} as const;

/** Период тика таймера (v4.30): 10 Гц вместо 60 FPS-интервала —
 * рендеры поддерева падают с 60/с до ≤10/с, а кольцо сглаживает
 * framer-motion-интерполяцией (transition = TICK_MS). */
const TICK_MS = 100;
/** Время удержания для 'hold' (при speedMult 1.0), мс. */
const HOLD_FILL_MS = 1500;

/* ─── Utility Functions ─── */

/**
 * Получить конфигурацию сложности с fallback
 * Get difficulty config with fallback
 */
function getDifficultyConfig(difficulty: QTEDifficulty): typeof DIFFICULTY_CONFIG.easy {
  return DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.normal;
}

/**
 * Форматировать оставшееся время
 * Format remaining time display
 */
function formatTimeMs(ms: number): string {
  const seconds = Math.max(0, ms / 1000);
  return `${seconds.toFixed(2)}с`;
}

/**
 * Рассчитать прогресс кольца на основе типа события
 * Calculate ring progress based on event type
 */
function calculateRingProgress(
  eventType: QTEEventType,
  state: QTEState,
  totalDuration: number,
  targetPresses: number,
  sequenceLength: number,
): number {
  switch (eventType) {
    case 'press':
      // Для press – кольцо сжимается к центру / Ring shrinks inward
      return state.timeRemaining / totalDuration;

    case 'hold':
      // Для hold – кольцо заполняется / Ring fills up
      return state.progress;

    case 'mash':
      // FIX (v4.30): прогресс от targetPresses, а не магического «+10» —
      // кольцо теперь честно заполняется к моменту успеха.
      return state.pressCount / Math.max(1, targetPresses);

    case 'sequence':
      // Для sequence – прогресс по индексу / Progress by current index
      if (sequenceLength === 0) return 0;
      return state.currentIndex / sequenceLength;

    default:
      return 1;
  }
}

/* ─── Sub-Components ─── */

/**
 * Компонент отображения клавиши / Key display component
 */
interface KeyDisplayProps {
  binding: QTEKeyBinding;
  size: number;
  isActive: boolean;
  isSuccess: boolean;
  isFailure: boolean;
  accentColor: string;
  glowColor: string;
  reducedMotion: boolean;
}

const KeyDisplay = memo(function KeyDisplay({
  binding,
  size,
  isActive,
  isSuccess,
  isFailure,
  accentColor,
  glowColor,
  reducedMotion,
}: KeyDisplayProps) {
  return (
    <motion.div
      className="flex items-center justify-center rounded-xl font-bold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        fontFamily: "'JetBrains Mono', monospace",
        backgroundColor: isFailure
          ? 'rgba(255,50,50,0.2)'
          : isSuccess
            ? 'rgba(50,255,100,0.15)'
            : 'rgba(10,14,24,0.9)',
        border: `3px solid ${
          isFailure ? '#ff3333' : isSuccess ? '#33dd66' : accentColor
        }`,
        color: isFailure ? '#ff5555' : isSuccess ? '#44ff88' : '#ffffff',
        boxShadow: `
          0 0 ${isSuccess || isFailure ? 30 : 20}px ${
            isFailure ? 'rgba(255,50,50,0.4)' : isSuccess ? 'rgba(50,255,100,0.4)' : glowColor
          },
          inset 0 0 20px ${
            isFailure ? 'rgba(255,50,50,0.15)' : isSuccess ? 'rgba(50,255,100,0.1)' : 'transparent'
          }
        `,
        textShadow: `0 0 10px ${glowColor}`,
        userSelect: 'none',
      }}
      animate={
        isActive && !reducedMotion
          ? { scale: [1, 1.05, 1], boxShadow: [
              `0 0 20px ${glowColor}`,
              `0 0 40px ${glowColor}`,
              `0 0 20px ${glowColor}`,
            ]}
          : {}
      }
      transition={{
        scale: { duration: 0.8, repeat: Infinity },
        boxShadow: { duration: 1, repeat: Infinity },
      }}
    >
      {binding.icon ?? (
        <span className="flex flex-col items-center gap-1">
          <Keyboard size={size * 0.3} />
          {binding.display}
        </span>
      )}
    </motion.div>
  );
});

/**
 * Компонент кольца таймера / Timer ring component
 */
interface TimerRingProps {
  progress: number;
  eventType: QTEEventType;
  outerSize: number;
  innerSize: number;
  accentColor: string;
  glowColor: string;
  isWarning: boolean;
  reducedMotion: boolean;
}

const TimerRing = memo(function TimerRing({
  progress,
  eventType,
  outerSize,
  accentColor,
  glowColor,
  isWarning,
  reducedMotion,
}: TimerRingProps) {
  const radius = (outerSize - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Определяем тип анимации кольца / Determine ring animation type
  const isShrinking = eventType === 'press';
  const dashOffset = isShrinking 
    ? circumference * (1 - progress)
    : circumference * progress;

  return (
    <div
      className="absolute"
      style={{ width: outerSize, height: outerSize }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${outerSize} ${outerSize}`} className="-rotate-90">
        {/* Фоновое кольцо / Background ring */}
        <circle
          cx={outerSize / 2}
          cy={outerSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        
        {/* Активное кольцо / Active ring */}
        <motion.circle
          cx={outerSize / 2}
          cy={outerSize / 2}
          r={radius}
          fill="none"
          stroke={isWarning ? '#ff4444' : accentColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: isShrinking ? 0 : circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.1, ease: 'linear' }
          }
          style={{
            filter: `drop-shadow(0 0 8px ${isWarning ? 'rgba(255,68,68,0.6)' : glowColor})`,
          }}
        />

        {/* Окно успеха (зона попадания) / Success window zone */}
        {/* Это можно расширить для отображения зоны успеха */}
      </svg>
      
      {/* Предупреждающая пульсация Warning pulse */}
      {isWarning && !reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{
            background: `radial-gradient(circle, transparent 60%, rgba(255,50,50,0.15) 100%)`,
          }}
        />
      )}
    </div>
  );
});

/**
 * Компонент следа последовательности / Sequence trail component
 */
interface SequenceTrailProps {
  bindings: QTEKeyBinding[];
  currentIndex: number;
  itemSize: number;
  accentColor: string;
  glowColor: string;
  reducedMotion: boolean;
}

const SequenceTrail = memo(function SequenceTrail({
  bindings,
  currentIndex,
  itemSize,
  accentColor,
  glowColor,
  reducedMotion,
}: SequenceTrailProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6" aria-label="Последовательность клавиш">
      {bindings.map((binding, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        
        return (
          <motion.div
            key={`${binding.code}-${i}`}
            initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="relative"
          >
            {/* Соединительная линия / Connection line */}
            {i < bindings.length - 1 && (
              <ArrowRight
                size={16}
                className="absolute -right-4 top-1/2 -translate-y-1/2"
                style={{
                  color: isCompleted ? accentColor : 'rgba(150,160,170,0.3)',
                  zIndex: 0,
                }}
                aria-hidden="true"
              />
            )}
            
            {/* Элемент ключа / Key item */}
            <div
              className="flex items-center justify-center rounded-lg font-mono font-bold"
              style={{
                width: itemSize * 0.75,
                height: itemSize * 0.75,
                fontSize: itemSize * 0.25,
                backgroundColor: isCompleted
                  ? `${accentColor}20`
                  : isCurrent
                    ? `${accentColor}30`
                    : 'rgba(20,25,35,0.8)',
                border: `2px solid ${
                  isCompleted
                    ? accentColor
                    : isCurrent
                      ? `${accentColor}`
                      : 'rgba(80,90,100,0.4)'
                }`,
                color: isCompleted
                  ? accentColor
                  : isCurrent
                    ? '#ffffff'
                    : 'rgba(150,160,170,0.5)',
                boxShadow: isCurrent ? `0 0 12px ${glowColor}` : undefined,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {binding.display.charAt(0)}
              
              {/* Индикатор текущего / Current indicator */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-[-3px] rounded-lg border-2 pointer-events-none"
                  style={{ borderColor: accentColor }}
                  animate={!reducedMotion ? { opacity: [0.4, 1, 0.4] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  aria-hidden="true"
                />
              )}
              
              {/* Галочка завершённого / Completed checkmark */}
              {isCompleted && (
                <Check
                  size={12}
                  className="absolute -top-1 -right-1"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

/* ─── Main Component ─── */

/**
 * Оверлей быстрого события (QTE)
 * Quick Time Event overlay component
 *
 * Драматический полноэкранный оверлей для отображения и обработки
 * QTE событий различных типов. Поддерживает кастомизацию сложности,
 * звуковую обратную связь и различные режимы ввода.
 *
 * @example
 * ```tsx
 * <QuickTimeEventOverlay
 *   isActive={isQTEActive}
 *   eventType="press"
 *   keyBindings={[{ display: 'E', code: 'KeyE' }]}
 *   duration={3000}
 *   difficulty="normal"
 *   onSuccess={() => console.log('Успех!')}
 *   onFailure={() => console.log('Неудача...')}
 * />
 * ```
 */
export function QuickTimeEventOverlay({
  isActive,
  eventType,
  keyBindings = [],
  duration,
  onSuccess,
  onFailure,
  difficulty = 'normal',
  targetPresses = 10,
  onSoundTrigger,
  contextData: _contextData,
}: QuickTimeEventOverlayProps) {
  /* Hooks */
  const [state, setState] = useState<QTEState>({
    result: 'pending',
    timeRemaining: duration,
    progress: 0,
    currentIndex: 0,
    pressCount: 0,
    comboMultiplier: 1,
    nearMiss: false,
  });
  const [showResult, setShowResult] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const reducedMotion = useEffectiveReducedMotion();

  /* ── Refs-зеркала (v4.30) ──
   * Таймер и слушатели ввода регистрируются ОДИН раз на сессию (deps [isActive])
   * и читают актуальные значения через refs. Нестабильные пропсы (инлайн-массив
   * keyBindings, инлайн-коллбеки) больше НЕ перезапускают сессию и НЕ
   * перерегистрируют обработчики — сброс только по явному isActive-переходу. */
  const stateRef = useRef(state);
  stateRef.current = state;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  /** hold: клавиша/палец удерживается прямо сейчас (keydown/keyup, pointerdown/up). */
  const holdingRef = useRef(false);
  const latestRef = useRef({
    eventType,
    keyBindings,
    duration,
    difficulty,
    targetPresses,
    onSuccess,
    onFailure,
    onSoundTrigger,
  });
  latestRef.current = { eventType, keyBindings, duration, difficulty, targetPresses, onSuccess, onFailure, onSoundTrigger };
  /** Стабильные хэндлы для обработчиков, зарегистрированных один раз. */
  const inputRef = useRef<() => void>(() => {});
  const cancelRef = useRef<() => void>(() => {});

  /* Конфигурация / Configuration */
  const diffConfig = getDifficultyConfig(difficulty);
  const currentBinding = keyBindings[state.currentIndex] ?? keyBindings[0];
  const adjustedDuration = duration / diffConfig.speedMult;
  const isWarning = state.timeRemaining < adjustedDuration * 0.25;
  const isSuccess = state.result === 'success';
  const isFailure = state.result === 'failure' || state.result === 'timeout';

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Единая точка завершения сессии / Single resolution point.
   * success/failure/timeout — с драматическим экраном результата;
   * cancelled (Escape) — без него, оверлей закрывает хост сразу.
   */
  const resolveRef = useRef<(result: QTEFinalResult) => void>(() => {});
  resolveRef.current = (result: QTEFinalResult) => {
    stopTimer();
    const next = { ...stateRef.current, result };
    stateRef.current = next;
    setState(next);
    if (result === 'cancelled') {
      holdingRef.current = false;
      onFailure?.('cancelled');
      return;
    }
    setShowResult(true);
    onSoundTrigger?.(result === 'success' ? SOUNDS.success : SOUNDS.failure);
    if (result === 'success') {
      onSuccess?.('success');
    } else {
      onFailure?.(result);
    }
  };

  /**
   * Тик таймера (10 Гц): остаток времени + заполнение hold.
   * Читает refs — стабилен, переиспользуется сессией.
   */
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    if (stateRef.current.result !== 'pending') {
      stopTimer();
      return;
    }
    const latest = latestRef.current;
    const cfg = getDifficultyConfig(latest.difficulty);
    const adj = latest.duration / cfg.speedMult;
    const current = stateRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, adj - elapsed);

    // hold: прогресс копится по времени удержания (holdingRef), а не по
    // OS-автоповтору keydown — стабильно и на клавиатуре, и на таче.
    if (latest.eventType === 'hold' && holdingRef.current) {
      const holdMs = HOLD_FILL_MS / cfg.speedMult;
      const newProgress = Math.min(1, current.progress + TICK_MS / holdMs);
      const next = { ...current, timeRemaining: remaining, progress: newProgress };
      stateRef.current = next;
      setState(next);
      // FIX (v4.30): успех по уже вычисленному значению — прежний stale-check
      // читал состояние ДО обновления и срабатывал на нажатие позже порога.
      if (newProgress >= 1) {
        resolveRef.current('success');
        return;
      }
    } else {
      const next = { ...current, timeRemaining: remaining };
      stateRef.current = next;
      setState(next);
    }

    if (remaining <= 0) {
      resolveRef.current('timeout');
    }
  };

  /**
   * Обработка ввода / Process user input (press / mash / sequence).
   * Читает stateRef/latestRef и синхронно зеркалит их — быстрые нажатия
   * между рендерами не теряются.
   */
  inputRef.current = () => {
    const latest = latestRef.current;
    if (stateRef.current.result !== 'pending') return;
    onSoundTrigger?.(SOUNDS.press);

    switch (latest.eventType) {
      case 'press': {
        // Проверяем попадание в окно успеха / Check if within success window
        const cfg = getDifficultyConfig(latest.difficulty);
        const adj = latest.duration / cfg.speedMult;
        const windowStart = adj * (1 - cfg.windowSize);
        const elapsed = Date.now() - startTimeRef.current;

        if (elapsed >= windowStart) {
          // Попадание! / Hit!
          resolveRef.current('success');
        } else if (elapsed >= windowStart * 0.7) {
          // Near-miss! Почти попал!
          onSoundTrigger?.(SOUNDS.nearMiss);
          const next = { ...stateRef.current, nearMiss: true };
          stateRef.current = next;
          setState(next);
          setShowFlash(true);
          window.setTimeout(() => setShowFlash(false), SIZES.flashDuration);
        } else {
          // Рано! / Too early!
          resolveRef.current('failure');
        }
        break;
      }

      case 'hold':
        // Удержание обрабатывается тиками (holdingRef); keydown только запускает его.
        break;

      case 'mash': {
        const newCount = stateRef.current.pressCount + 1;
        const newCombo = newCount % 5 === 0
          ? stateRef.current.comboMultiplier + 0.5
          : stateRef.current.comboMultiplier;
        const next = { ...stateRef.current, pressCount: newCount, comboMultiplier: newCombo };
        stateRef.current = next;
        setState(next);
        if (newCount >= latest.targetPresses) {
          resolveRef.current('success');
        }
        break;
      }

      case 'sequence': {
        const nextIndex = stateRef.current.currentIndex + 1;
        if (nextIndex >= latest.keyBindings.length) {
          // Последовательность завершена! / Sequence complete!
          onSoundTrigger?.(SOUNDS.complete);
          resolveRef.current('success');
        } else {
          // Переход к следующей клавише / Move to next key
          const next = { ...stateRef.current, currentIndex: nextIndex };
          stateRef.current = next;
          setState(next);
        }
        break;
      }
    }
  };

  /** Отмена (Escape): без экрана результата — хост закрывает оверлей сразу. */
  cancelRef.current = () => {
    if (stateRef.current.result !== 'pending') return;
    resolveRef.current('cancelled');
  };

  /**
   * Сессия QTE: сброс + запуск 10 Гц-таймера. Зависимость только [isActive] —
   * смена identity коллбеков/массивов пропсов сессию не перезапускает.
   */
  useEffect(() => {
    if (!isActive) {
      stopTimer();
      return;
    }

    // Сброс состояния при активации / Reset state on activation
    const cfg = getDifficultyConfig(latestRef.current.difficulty);
    const adj = latestRef.current.duration / cfg.speedMult;
    const initial: QTEState = {
      result: 'pending',
      timeRemaining: adj,
      progress: 0,
      currentIndex: 0,
      pressCount: 0,
      comboMultiplier: 1,
      nearMiss: false,
    };
    stateRef.current = initial;
    setState(initial);
    setShowResult(false);
    setShowFlash(false);
    holdingRef.current = false;
    startTimeRef.current = Date.now();

    latestRef.current.onSoundTrigger?.(SOUNDS.start);

    timerRef.current = setInterval(() => tickRef.current(), TICK_MS);
    return () => {
      stopTimer();
      holdingRef.current = false;
    };
  }, [isActive, stopTimer]);
  /**
   * Глобальные обработчики клавиатуры (регистрация ОДИН раз на сессию;
   * фактические значения читаются через refs — никаких перерегистраций
   * на каждый инпут, как это было в прежнем коде).
   */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape — отмена события (фикс: 'cancelled' раньше был недостижим).
      if (e.code === 'Escape') {
        e.preventDefault();
        cancelRef.current();
        return;
      }
      // FIX (v4.30): OS-автоповтор не считается за честные нажатия.
      if (e.repeat) return;
      const latest = latestRef.current;
      const expectedCode = latest.keyBindings[stateRef.current.currentIndex]?.code
        ?? latest.keyBindings[0]?.code;
      if (!expectedCode || e.code !== expectedCode) return;
      e.preventDefault();
      e.stopPropagation();
      if (latest.eventType === 'hold') {
        holdingRef.current = true;
        return;
      }
      inputRef.current();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const latest = latestRef.current;
      const expectedCode = latest.keyBindings[stateRef.current.currentIndex]?.code
        ?? latest.keyBindings[0]?.code;
      if (latest.eventType === 'hold' && expectedCode && e.code === expectedCode) {
        holdingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive]);

  /**
   * Тач/мышь (v4.30): QTE проходим на мобильных — тап по центру считается
   * нажатием (press/mash/sequence), удержание пальцем — hold.
   */
  const handlePointerDown = useCallback(() => {
    const latest = latestRef.current;
    if (latest.eventType === 'hold') {
      holdingRef.current = true;
      return;
    }
    inputRef.current();
  }, []);
  const handlePointerUp = useCallback(() => {
    holdingRef.current = false;
  }, []);

  /* Вычисляемые значения / Computed values */
  const ringProgress = useMemo(
    () => calculateRingProgress(eventType, state, adjustedDuration, targetPresses, keyBindings.length),
    [eventType, state, adjustedDuration, targetPresses, keyBindings.length]
  );

  /* Не рендерим если неактивен / Don't render if not active */
  if (!isActive) return null;

  return (
    <>
      {/* ── Фоновый оверлей / Background overlay ── */}
      <AnimatePresence mode="wait">
        {(isActive || showResult) && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center hud-filmic-qte-urgency-pulse"
            style={{
              zIndex: UI_LAYERS.MINIGAME,
              background: 'radial-gradient(circle at center, rgba(0,0,0,0.85), rgba(0,0,0,0.95))',
              backdropFilter: 'blur(8px)',
              /* FIX (v4.30): корень принимает ввод — иначе внутри
               * pointer-events-none-родителя (HUD) тач-кнопки мертвы. */
              pointerEvents: 'auto',
            }}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Быстрое событие: ${eventType}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Вспышка near-miss / Near-miss flash ── */}
            <AnimatePresence>
              {showFlash && (
                <motion.div
                  className="fixed inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, transparent 40%, rgba(255,200,50,0.3) 100%)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: SIZES.flashDuration / 1000 }}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>

            {/* ── Основной контейнер QTE / Main QTE container ── */}
            <motion.div
              className="relative flex flex-col items-center hud-filmic-qte-pulse-ring touch-none"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
              animate={isSuccess || isFailure ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
            >
              {/* Метка типа и сложности / Type & difficulty label */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    color: diffConfig.color,
                    backgroundColor: diffConfig.glowColor,
                    border: `1px solid ${diffConfig.color}50`,
                  }}
                >
                  {eventType.toUpperCase()}
                </span>
                
                <Volume2
                  size={14}
                  className="opacity-40 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => latestRef.current.onSoundTrigger?.(SOUNDS.start)}
                  aria-label="Звуковой сигнал"
                />
              </div>

              {/* ── Кольцо таймера / Timer ring ── */}
              <TimerRing
                progress={ringProgress}
                eventType={eventType}
                outerSize={SIZES.ringOuter}
                innerSize={SIZES.ringInner}
                accentColor={diffConfig.color}
                glowColor={diffConfig.glowColor}
                isWarning={isWarning && !showResult}
                reducedMotion={reducedMotion}
              />

              {/* ── Дисплей клавиши / Key display ── */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  width: SIZES.ringOuter,
                  height: SIZES.ringOuter,
                }}
              >
                <KeyDisplay
                  binding={currentBinding ?? keyBindings[0] ?? { display: '?', code: '' }}
                  size={SIZES.keyDisplay}
                  isActive={!showResult}
                  isSuccess={isSuccess}
                  isFailure={isFailure}
                  accentColor={diffConfig.color}
                  glowColor={diffConfig.glowColor}
                  reducedMotion={reducedMotion}
                />
              </div>

              {/* ── Информация под дисплеем / Info below display ── */}
              {!showResult && (
                <motion.div
                  className="mt-6 text-center space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Инструкция / Instruction text */}
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'rgba(220,225,230,0.8)' }}
                  >
                    {eventType === 'press' && 'Нажмите клавишу вовремя!'}
                    {eventType === 'hold' && 'Удерживайте клавишу...'}
                    {eventType === 'mash' && 'Жмите быстро!'}
                    {eventType === 'sequence' && 'Нажимайте по порядку!'}
                  </p>

                  {/* Время / Time remaining */}
                  <p
                    className="text-xs font-mono tabular-nums"
                    style={{
                      color: isWarning ? '#ff6644' : 'rgba(180,190,200,0.6)',
                    }}
                  >
                    {formatTimeMs(state.timeRemaining)}
                  </p>

                  {/* Mash-счётчик / Mash counter */}
                  {eventType === 'mash' && (
                    <div className="flex items-center justify-center gap-2">
                      <Repeat size={14} style={{ color: diffConfig.color }} />
                      <span
                        className="text-lg font-mono font-bold tabular-nums"
                        style={{ color: diffConfig.color }}
                      >
                        {state.pressCount}
                      </span>
                      <span
                        className="text-sm font-mono"
                        style={{ color: 'rgba(180,190,200,0.5)' }}
                      >
                        /{targetPresses}
                      </span>
                      
                      {/* Множитель комбо / Combo multiplier */}
                      {state.comboMultiplier > 1 && (
                        <motion.span
                          className="text-xs font-mono px-1.5 py-0.5 rounded ml-2"
                          style={{
                            color: '#ffaa00',
                            backgroundColor: 'rgba(255,170,0,0.2)',
                            border: '1px solid rgba(255,170,0,0.4)',
                          }}
                          initial={false}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.3 }}
                          key={`combo-${state.comboMultiplier}`}
                        >
                          ×{state.comboMultiplier.toFixed(1)}
                        </motion.span>
                      )}
                    </div>
                  )}

                  {/* Прогресс для hold / Progress for hold */}
                  {eventType === 'hold' && (
                    <div className="w-40 h-2 rounded-full overflow-hidden mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: diffConfig.color,
                          width: `${state.progress * 100}%`,
                          boxShadow: `0 0 8px ${diffConfig.glowColor}`,
                        }}
                      />
                    </div>
                  )}

                  {/* Индекс последовательности / Sequence index */}
                  {eventType === 'sequence' && (
                    <p className="text-xs font-mono" style={{ color: 'rgba(180,190,200,0.5)' }}>
                      {state.currentIndex + 1} / {keyBindings.length}
                    </p>
                  )}

                  {/* Подсказка отмены / Cancel hint (v4.30) */}
                  <p
                    className="text-[10px] font-mono uppercase tracking-widest"
                    style={{ color: 'rgba(160,170,180,0.4)' }}
                  >
                    Esc — отмена
                  </p>
                </motion.div>
              )}

              {/* ── Результат / Result display ── */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    className="mt-8 flex flex-col items-center gap-3"
                    /* FIX (v4.30): итог события анонсируется скринридеру. */
                    aria-live="assertive"
                    initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reducedMotion ? {} : { opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {/* Иконка результата / Result icon */}
                    {isSuccess ? (
                      <motion.div
                        initial={reducedMotion ? {} : { rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                      >
                        <Check
                          size={64}
                          style={{
                            color: '#33ff77',
                            filter: 'drop-shadow(0 0 20px rgba(51,255,119,0.6))',
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={reducedMotion ? {} : { rotate: 180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                      >
                        <X
                          size={64}
                          style={{
                            color: '#ff3344',
                            filter: 'drop-shadow(0 0 20px rgba(255,51,68,0.6))',
                          }}
                        />
                      </motion.div>
                    )}

                    {/* Текст результата / Result text */}
                    <motion.p
                      className="text-2xl font-bold tracking-wider uppercase"
                      style={{
                        color: isSuccess ? '#33ff88' : '#ff4455',
                        textShadow: `0 0 20px ${isSuccess ? 'rgba(51,255,136,0.5)' : 'rgba(255,68,85,0.5)'}`,
                      }}
                      initial={reducedMotion ? {} : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isSuccess ? 'УСПЕХ!' : 'ПРОМАХ!'}
                    </motion.p>

                    {/* Комбо множитель финальный / Final combo multiplier */}
                    {eventType !== 'press' && state.comboMultiplier > 1 && (
                      <p
                        className="text-sm font-mono"
                        style={{ color: '#ffaa00' }}
                      >
                        Комбо ×{state.comboMultiplier.toFixed(1)}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── След последовательности / Sequence trail ── */}
              {eventType === 'sequence' && !showResult && (
                <SequenceTrail
                  bindings={keyBindings}
                  currentIndex={state.currentIndex}
                  itemSize={SIZES.trailItem}
                  accentColor={diffConfig.color}
                  glowColor={diffConfig.glowColor}
                  reducedMotion={reducedMotion}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Default Export ─── */

export default QuickTimeEventOverlay;

/* ─── Documentation ─── */

/**
 * @component QuickTimeEventOverlay
 * @description Драматический оверлей для быстрых событий (QTE) в стиле Volodka RPG.
 *
 * @remarks
 * Типы поддерживаемых событий:
 * - **press**: Однократное нажатие в правильный момент
 * - **hold**: Удержание клавиши для заполнения шкалы
 * - **mash**: Быстрые повторные нажатия до достижения цели
 * - **sequence**: Последовательное нажатие нескольких клавиш
 *
 * @accessibility
 * - role="dialog" с aria-modal
 * - ARIA-метки для состояний, aria-live="assertive" на блоке результата
 * - Поддержка клавиатурного ввода (включая Escape-отмену)
 * - Тач/мышь: тап = нажатие, удержание пальцем = hold (мобильные)
 *
 * @performance
 * - v4.30: таймер 10 Гц вместо 60 FPS-setInterval; refs-зеркала устраняют
 *   перерегистрацию window-слушателей на каждый инпут и перезапуск сессии
 *   от нестабильных пропсов; кольцо сглаживается framer-интерполяцией
 */
