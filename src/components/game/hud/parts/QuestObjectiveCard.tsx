/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Quest Objective Card
   
   Детальная карточка отображения квеста с целями, прогрессом и наградами.
   Показывает полную информацию о квесте, включая список целей, прогресс
   выполнения и доступные награды.
   
   Features:
   - Название квеста с цветовой кодировкой сложности / Title with difficulty color coding
   - Чек-лист целей с состояниями завершения / Objective checklist with completion states
   - Прогресс-бар для частичных целей / Progress bar for partial objectives (e.g., 5/10)
   - Секция предпросмотра наград / Reward preview section (XP, items, currency)
   - Кнопка отслеживания/снятия / Track/untrack toggle button
   - Анимация пульсации для активного квеста / Active quest pulsing border animation
   - Анимация галочки для завершённого / Completed quest checkmark animation
   - Красный оттенок для проваленного / Failed quest red tint
   - Визуальное различие побочных и основных квестов / Side vs main quest distinction
   - Опциональный тайм-лимит с обратным отсчётом / Optional time limit with countdown
   
   @component QuestObjectiveCard
   @requires framer-motion – для анимаций переходов состояний
────────────────────────────────────────────────────────────────────────────── */

'use client';

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Star,
  Clock,
  Trophy,
  Coins,
  Package,
  Pin,
  PinOff,
  Target,
  Swords,
  BookOpen,
  Timer,
} from 'lucide-react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Type Definitions ─── */

/**
 * Тип квеста / Quest type enumeration
 */
export type QuestType = 'main' | 'side' | 'hidden' | 'daily' | 'weekly';

/**
 * Статус квеста / Quest status enumeration
 */
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'abandoned';

/**
 * Сложность квеста / Quest difficulty levels
 */
export type QuestDifficulty = 'trivial' | 'easy' | 'normal' | 'hard' | 'nightmare' | 'impossible';

/**
 * Данные о цели квеста / Quest objective data
 */
export interface QuestObjective {
  /** Уникальный идентификатор цели / Unique objective ID */
  id: string;
  /** Описание цели / Objective description */
  description: string;
  /** Текущий прогресс / Current progress value */
  current: number;
  /** Целевое значение / Target value */
  target: number;
  /** Выполнена ли цель / Whether objective is completed */
  isCompleted: boolean;
  /** Скрыта ли цель (для прогрессивного раскрытия) / Is hidden for progressive reveal */
  isHidden?: boolean;
  /** Необязательная цель / Optional objective flag */
  isOptional?: boolean;
}

/**
 * Награда за квест / Quest reward data
 */
export interface QuestReward {
  /** Тип награды / Reward type */
  type: 'xp' | 'currency' | 'item' | 'reputation' | 'skill_point' | 'title';
  /** Количество или ID / Amount or item ID */
  value: number | string;
  /** Название награды (опционально) / Reward name (optional) */
  name?: string;
  /** Иконка (React-элемент) / Icon element (optional) */
  icon?: React.ReactNode;
  /** Редкость (для предметов) / Rarity for items */
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * Полные данные кеста / Complete quest data structure
 */
export interface QuestData {
  /** Уникальный идентификатор квеста / Unique quest ID */
  id: string;
  /** Название квеста / Quest title */
  title: string;
  /** Описание квеста / Quest description */
  description: string;
  /** Тип квеста / Quest type */
  questType: QuestType;
  /** Статус квеста / Quest status */
  status: QuestStatus;
  /** Сложность квеста / Quest difficulty */
  difficulty: QuestDifficulty;
  /** Массив целей квеста / Array of quest objectives */
  objectives: QuestObjective[];
  /** Общий прогресс квеста (0–100) / Overall progress percentage */
  progress: number;
  /** Массив наград / Array of rewards */
  rewards: QuestReward[];
  /** Отслеживается ли игроком / Is tracked by player */
  isTracked?: boolean;
  /** Является ли активным квестом / Is active quest */
  isActive?: boolean;
  /** Ограничение по времени в мс (если есть) / Time limit in ms if applicable */
  timeLimit?: number;
  /// Оставшееся время в мс / Remaining time in ms */
  timeRemaining?: number;
  /** Минимальный уровень требования / Minimum level requirement */
  minLevel?: number;
  /** Рекомендуемый уровень / Recommended level */
  recommendedLevel?: number;
  /** ID цепочки предшественников / Prerequisite quest IDs */
  prerequisites?: string[];
}

/**
 * Пропсы компонента QuestObjectiveCard
 * Props for QuestObjectiveCard component
 */
export interface QuestObjectiveCardProps {
  /** Данные квеста / Quest data */
  quest: QuestData;
  /** Callback при переключении отслеживания / Track toggle callback */
  onTrackToggle?: (questId: string, isTracked: boolean) => void;
  /** Callback при клике по квесту / Click callback */
  onQuestClick?: (questId: string) => void;
  /** Компактный режим / Compact mode */
  compact?: boolean;
  /** Показывать ли награды / Show rewards section */
  showRewards?: boolean;
  /** Расширенное описание / Show full description */
  expanded?: boolean;
  /** Видимость компонента / Component visibility */
  visible?: boolean;
}

/* ─── Constants ─── */

/** Цветовые схемы для типов квестов / Color schemes by quest type */
const QUEST_TYPE_CONFIG: Record<QuestType, {
  color: string;
  glow: string;
  label: string;
  icon: typeof Star;
}> = {
  main: {
    color: '#ff6644',
    glow: 'rgba(255, 102, 68, 0.5)',
    label: 'ОСНОВНОЙ',
    icon: Swords,
  },
  side: {
    color: '#00d4e0',
    glow: 'rgba(0, 212, 224, 0.5)',
    label: 'ПОБОЧНЫЙ',
    icon: BookOpen,
  },
  hidden: {
    color: '#cc66ff',
    glow: 'rgba(204, 102, 255, 0.5)',
    label: 'СКРЫТЫЙ',
    icon: Star,
  },
  daily: {
    color: '#aaaaaa',
    glow: 'rgba(170, 170, 170, 0.4)',
    label: 'ЕЖЕДНЕВНЫЙ',
    icon: Clock,
  },
  weekly: {
    color: '#ffaa00',
    glow: 'rgba(255, 170, 0, 0.5)',
    label: 'ЕЖЕДЕЛЬНЫЙ',
    icon: Trophy,
  },
};

/** Цветовые схемы для сложности / Color schemes by difficulty */
const DIFFICULTY_CONFIG: Record<QuestDifficulty, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  trivial: { color: '#888888', bgColor: 'rgba(136,136,136,0.15)', label: 'ТРИВИАЛЬНЫЙ' },
  easy: { color: '#88cc44', bgColor: 'rgba(136,204,68,0.15)', label: 'ЛЁГКИЙ' },
  normal: { color: '#4488cc', bgColor: 'rgba(68,136,204,0.15)', label: 'ОБЫЧНЫЙ' },
  hard: { color: '#cc8844', bgColor: 'rgba(204,136,68,0.15)', label: 'СЛОЖНЫЙ' },
  nightmare: { color: '#cc4444', bgColor: 'rgba(204,68,68,0.15)', label: 'КОШМАР' },
  impossible: { color: '#aa00ff', bgColor: 'rgba(170,0,255,0.2)', label: 'НЕВОЗМОЖНЫЙ' },
};

/** Цветовые схемы для статусов / Color schemes by status */
const STATUS_STYLES: Record<QuestStatus, {
  tint: string;
  overlayColor: string;
  borderColor: string;
}> = {
  available: { tint: '', overlayColor: 'transparent', borderColor: 'rgba(100,120,140,0.3)' },
  active: { tint: '', overlayColor: 'transparent', borderColor: 'var(--quest-color, #00d4e0)' },
  completed: {
    tint: 'hue-rotate(90deg)',
    overlayColor: 'rgba(0,255,100,0.08)',
    borderColor: 'rgba(0,200,80,0.6)',
  },
  failed: {
    tint: '',
    overlayColor: 'rgba(255,50,50,0.12)',
    borderColor: 'rgba(255,60,60,0.7)',
  },
  abandoned: { tint: 'grayscale(0.5)', overlayColor: 'rgba(100,100,100,0.1)', borderColor: 'rgba(100,100,100,0.3)' },
};

/** Цвета редкости наград / Reward rarity colors */
const RARITY_COLORS: Record<string, string> = {
  common: '#aaaaaa',
  uncommon: '#4488cc',
  rare: '#6644cc',
  epic: '#cc44aa',
  legendary: '#ff8800',
};

/* ─── Utility Functions ─── */

/**
 * Форматировать оставшееся время / Format remaining time
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Время вышло!';
  
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}ч ${minutes.toString().padStart(2, '0')}м`;
  }
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}с`;
}

/**
 * Получить иконку типа награды / Get reward type icon
 */
function getRewardIcon(type: QuestReward['type']): typeof Coins {
  switch (type) {
    case 'xp': return Trophy;
    case 'currency': return Coins;
    case 'item': return Package;
    case 'reputation': return Star;
    case 'skill_point': return Target;
    case 'title': return BookOpen;
    default: return Coins;
  }
}

/* ─── Sub-Components ─── */

/**
 * Компонент отдельной цели квеста / Individual objective component
 */
interface ObjectiveItemProps {
  objective: QuestObjective;
  questColor: string;
  reducedMotion: boolean;
  index: number;
}

const ObjectiveItem = memo(function ObjectiveItem({
  objective,
  questColor,
  reducedMotion,
  index,
}: ObjectiveItemProps) {
  /* Скрытые цели не показываем до раскрытия / Hide hidden objectives */
  if (objective.isHidden && !objective.isCompleted) {
    return (
      <div
        className="flex items-center gap-2 py-1 px-2 text-xs"
        style={{ color: 'rgba(150,160,170,0.6)' }}
      >
        <span className="font-mono">???</span>
        <span>Цель скрыта</span>
      </div>
    );
  }
  
  const progress = objective.target > 0 
    ? Math.min(100, (objective.current / objective.target) * 100) 
    : (objective.isCompleted ? 100 : 0);
  
  const isPartial = !objective.isCompleted && objective.current > 0 && objective.current < objective.target;
  
  return (
    <motion.div
      className="flex items-start gap-2 py-1.5 px-2 rounded"
      initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: objective.isCompleted 
          ? 'rgba(0,200,80,0.06)' 
          : 'rgba(255,255,255,0.02)',
        opacity: objective.isOptional ? 0.75 : 1,
      }}
      role="listitem"
      aria-label={`${objective.description}: ${objective.current}/${objective.target}`}
    >
      {/* Галочка или кружок / Check or circle */}
      <motion.div
        className="flex-shrink-0 mt-0.5"
        initial={false}
        animate={
          objective.isCompleted && !reducedMotion
            ? { scale: [1, 1.3, 1], rotate: [0, 360] }
            : {}
        }
        transition={{ duration: 0.4 }}
      >
        {objective.isCompleted ? (
          <Check
            size={14}
            style={{ color: '#00cc66' }}
            strokeWidth={3}
          />
        ) : (
          <div
            className="w-3.5 h-3.5 rounded-full border"
            style={{
              borderColor: questColor + '80',
              backgroundColor: 'transparent',
            }}
          />
        )}
      </motion.div>

      {/* Текст и прогресс / Text and progress */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-mono leading-snug ${
            objective.isCompleted 
              ? 'line-through opacity-70' 
              : ''
          }`}
          style={{
            color: objective.isCompleted 
              ? 'rgba(0,200,80,0.9)' 
              : '#c8d0d8',
          }}
        >
          {objective.description}
          {objective.isOptional && (
            <span className="ml-1 opacity-50">(опционально)</span>
          )}
        </p>
        
        {/* Прогресс-бар для частичных целей / Progress bar */}
        {(isPartial || (!objective.isCompleted && objective.target > 1)) && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                maxWidth: 140,
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: questColor,
                  boxShadow: `0 0 6px ${QUEST_TYPE_CONFIG.main.glow}`,
                  width: `${progress}%`,
                }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span
              className="text-[10px] font-mono tabular-nums flex-shrink-0"
              style={{ color: questColor + 'cc', opacity: 0.85 }}
            >
              {objective.current}/{objective.target}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

/**
 * Компонент награды / Reward item component
 */
interface RewardItemProps {
  reward: QuestReward;
  index: number;
}

const RewardItem = memo(function RewardItem({ reward, index }: RewardItemProps) {
  const IconComponent = getRewardIcon(reward.type);
  const rarityColor = reward.rarity ? RARITY_COLORS[reward.rarity] ?? '#cccccc' : '#cccccc';
  
  return (
    <motion.div
      className="flex items-center gap-2 py-1 px-2 rounded"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderLeft: `2px solid ${rarityColor}`,
      }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Иконка награды / Reward icon */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded"
        style={{
          backgroundColor: rarityColor + '20',
          color: rarityColor,
        }}
      >
        {reward.icon ?? <IconComponent size={14} />}
      </div>
      
      {/* Информация / Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] truncate" style={{ color: '#d0d8e0' }}>
          {reward.name ?? reward.value}
        </p>
        {reward.type === 'item' && reward.rarity && (
          <p
            className="text-[9px] capitalize"
            style={{ color: rarityColor }}
          >
            {reward.rarity}
          </p>
        )}
      </div>
      
      {/* Значение / Value */}
      {typeof reward.value === 'number' && (
        <span
          className="text-[11px] font-mono"
          style={{ color: rarityColor }}
        >
          +{reward.value.toLocaleString()}
        </span>
      )}
    </motion.div>
  );
});

/* ─── Main Component ─── */

/**
 * Карточка целей квеста / Quest objective card component
 *
 * Детальное отображение информации о квесте со всеми целями,
 * прогрессом и наградами. Поддерживает различные визуальные
 * состояния для разных типов квестов.
 *
 * @example
 * ```tsx
 * <QuestObjectiveCard
 *   quest={{
 *     id: 'quest-001',
 *     title: 'Неоновая охота',
 *     description: 'Найдите пропавшего курьера...',
 *     questType: 'main',
 *     status: 'active',
 *     difficulty: 'hard',
 *     objectives: [...],
 *     progress: 65,
 *     rewards: [...],
 *     isTracked: true,
 *     isActive: true,
 *   }}
 *   showRewards={true}
 * />
 * ```
 */
export const QuestObjectiveCard = memo(function QuestObjectiveCard({
  quest,
  onTrackToggle,
  onQuestClick,
  compact = false,
  showRewards = true,
  expanded = true,
  visible = true,
}: QuestObjectiveCardProps) {
  /* Hooks */
  const [isExpanded, setIsExpanded] = useState(expanded);
  const reducedMotion = useEffectiveReducedMotion();

  /* Получаем конфигурацию типа квеста / Get quest type config */
  const typeConfig = QUEST_TYPE_CONFIG[quest.questType];
  const diffConfig = DIFFICULTY_CONFIG[quest.difficulty];
  const statusStyle = STATUS_STYLES[quest.status];

  /**
   * Переключить отслеживание / Toggle tracking
   */
  const handleTrackToggle = useCallback(() => {
    onTrackToggle?.(quest.id, !quest.isTracked);
  }, [onTrackToggle, quest.id, quest.isTracked]);

  /**
   * Клик по карточке / Card click handler
   */
  const handleClick = useCallback(() => {
    onQuestClick?.(quest.id);
  }, [onQuestClick, quest.id]);

  /* Проверки состояний / Status checks */
  const isCompleted = quest.status === 'completed';
  const isFailed = quest.status === 'failed';
  const isActive = quest.isActive && !isCompleted && !isFailed;

  /* Не рендерим если скрыто / Don't render if hidden */
  if (!visible) return null;

  /* Компактный режим – только заголовок и прогресс / Compact mode */
  if (compact) {
    return (
      <motion.div
        className="rounded-lg overflow-hidden cursor-pointer"
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: `linear-gradient(135deg, rgba(8,12,20,0.92), rgba(12,18,28,0.9))`,
          border: `1px solid ${statusStyle.borderColor}`,
          padding: '10px 14px',
          filter: statusStyle.tint || undefined,
        }}
        role="button"
        tabIndex={0}
        aria-label={`${quest.title} — прогресс ${quest.progress}%`}
      >
        <div className="flex items-center gap-2">
          <typeConfig.icon size={16} color={typeConfig.color} />
          <span
            className="text-sm font-semibold truncate flex-1"
            style={{ color: typeConfig.color }}
          >
            {quest.title}
          </span>
          
          {/* Прогресс / Progress indicator */}
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: isFailed ? '#ff3333' : typeConfig.color,
                width: `${quest.progress}%`,
              }}
            />
          </div>
          
          <span
            className="text-[10px] font-mono tabular-nums"
            style={{
              color: isFailed ? '#ff5555' : typeConfig.color,
              minWidth: 32,
            }}
          >
            {quest.progress}%
          </span>
        </div>
        
        {/* Таймер если есть / Timer if applicable */}
        {quest.timeLimit && quest.timeRemaining !== undefined && quest.timeRemaining > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Timer size={10} />
            <span
              className="text-[10px] font-mono"
              style={{ color: quest.timeRemaining < 60000 ? '#ff6644' : '#aaa' }}
            >
              {formatTimeRemaining(quest.timeRemaining)}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  /* Полный режим / Full mode */
  return (
    <motion.div
      className="rounded-lg overflow-hidden cursor-pointer relative"
      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={handleClick}
      style={{
        background: `
          linear-gradient(180deg,
            rgba(8,12,20,0.95) 0%,
            rgba(12,16,24,0.93) 100%
          )
        `,
        border: `1px solid ${statusStyle.borderColor}`,
        boxShadow: `
          0 4px 20px rgba(0,0,0,0.4),
          0 0 30px ${isActive ? typeConfig.glow : 'transparent'},
          inset 0 1px 0 rgba(255,255,255,0.05)
        `,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        width: 320,
        maxWidth: 'calc(100vw - 32px)',
        filter: statusStyle.tint || undefined,
        ['--quest-color' as string]: typeConfig.color,
      } as React.CSSProperties}
      role="article"
      aria-label={`Квест: ${quest.title}, статус: ${quest.status}, прогресс: ${quest.progress}%`}
    >
      {/* ── Оверлей статуса / Status overlay ── */}
      {isFailed && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: STATUS_STYLES.failed.overlayColor,
            border: `1px solid ${STATUS_STYLES.failed.borderColor}40`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          aria-hidden="true"
        >
          <div className="absolute top-2 right-2">
            <X size={16} style={{ color: '#ff4444' }} />
          </div>
        </motion.div>
      )}

      {isCompleted && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: STATUS_STYLES.completed.overlayColor,
            borderRadius: 'inherit',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute top-3 right-3"
            initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <Check size={20} style={{ color: '#00dd66' }} strokeWidth={3} />
          </motion.div>
        </motion.div>
      )}

      {/* ── Пульсация активного квеста / Active quest pulse ── */}
      {isActive && !reducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            border: `2px solid transparent`,
          }}
          animate={{
            boxShadow: [
              `inset 0 0 20px ${typeConfig.glow}10`,
              `inset 0 0 30px ${typeConfig.glow}25`,
              `inset 0 0 20px ${typeConfig.glow}10`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Заголовок / Header ── */}
      <div
        className="relative px-4 pt-3 pb-2"
        style={{
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
          background: `linear-gradient(90deg, ${typeConfig.color}08, transparent)`,
        }}
      >
        {/* Тип и сложность / Type and difficulty badges */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{
              color: typeConfig.color,
              backgroundColor: typeConfig.color + '18',
              border: `1px solid ${typeConfig.color}35`,
              letterSpacing: '0.05em',
            }}
          >
            {typeConfig.label}
          </span>
          
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              color: diffConfig.color,
              backgroundColor: diffConfig.bgColor,
            }}
          >
            {diffConfig.label}
          </span>

          {/* Уровень рекомендации / Recommended level */}
          {quest.recommendedLevel && (
            <span
              className="text-[9px] font-mono ml-auto"
              style={{ color: 'rgba(180,190,200,0.6)' }}
            >
              рек. ур. {quest.recommendedLevel}
            </span>
          )}
        </div>

        {/* Название / Title */}
        <h3
          className={`text-base font-bold mb-1 ${isActive ? 'hud-filmic-objective-pulse' : ''}`}
          style={{
            color: isFailed ? '#ff6666' : typeConfig.color,
            textShadow: `0 0 12px ${typeConfig.glow}`,
          }}
        >
          {quest.title}
        </h3>

        {/* Описание / Description */}
        <p
          className="text-[11px] leading-relaxed line-clamp-2"
          style={{ color: 'rgba(180,195,210,0.75)' }}
        >
          {quest.description}
        </p>
      </div>

      {/* ── Тайм-лимит / Time limit ── */}
      {quest.timeLimit && quest.timeRemaining !== undefined && (
        <div
          className="mx-4 mt-2 px-3 py-2 rounded-md flex items-center gap-2"
          style={{
            background: quest.timeRemaining < 60000
              ? 'rgba(255,50,50,0.12)'
              : 'rgba(255,200,50,0.08)',
            border: `1px solid ${
              quest.timeRemaining < 60000
                ? 'rgba(255,50,50,0.25)'
                : 'rgba(255,200,50,0.2)'
            }`,
          }}
        >
          <Clock
            size={14}
            style={{
              color: quest.timeRemaining < 60000 ? '#ff5555' : '#ffc832',
              ...(quest.timeRemaining < 60000 && !reducedMotion
                ? { animation: 'pulse 1s infinite' }
                : {}),
            }}
          />
          <span
            className="text-xs font-mono tabular-nums flex-1"
            style={{
              color: quest.timeRemaining < 60000 ? '#ff7777' : '#ffd666',
            }}
          >
            {formatTimeRemaining(quest.timeRemaining)}
          </span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${(quest.timeRemaining / quest.timeLimit) * 100}%`,
                backgroundColor: quest.timeRemaining < 60000 ? '#ff4444' : '#ffaa00',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Цели / Objectives ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={reducedMotion ? {} : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Общий прогресс / Overall progress */}
            <div className="px-4 py-2 flex items-center gap-3">
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: 'rgba(150,165,180,0.7)' }}
              >
                Прогресс:
              </span>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${typeConfig.color}88, ${typeConfig.color})`,
                    width: `${quest.progress}%`,
                    boxShadow: `0 0 8px ${typeConfig.glow}`,
                  }}
                  initial={false}
                  animate={{ width: `${quest.progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span
                className="text-xs font-mono font-bold tabular-nums"
                style={{ color: typeConfig.color, minWidth: 36 }}
              >
                {quest.progress}%
              </span>
            </div>

            {/* Список целей / Objective list */}
            <div
              className="px-2 pb-2 space-y-0.5 max-h-40 overflow-y-auto"
              role="list"
              aria-label={`Цели квеста: ${quest.objectives.length}`}
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${typeConfig.color}33 transparent` }}
            >
              {quest.objectives.map((obj, i) => (
                <ObjectiveItem
                  key={obj.id}
                  objective={obj}
                  questColor={typeConfig.color}
                  reducedMotion={reducedMotion}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Награды / Rewards ── */}
      {showRewards && quest.rewards.length > 0 && (
        <div
          className="px-4 pb-3 pt-2"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy size={12} style={{ color: '#ffaa44' }} />
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: 'rgba(180,160,100,0.8)' }}
            >
              Награды:
            </span>
          </div>
          
          <div className="space-y-1">
            {quest.rewards.map((reward, i) => (
              <RewardItem key={`${reward.type}-${i}`} reward={reward} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Футер с действиями / Footer with actions ── */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <button
          type="button"
          className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded hover:bg-white/10 transition-colors"
          style={{
            color: quest.isTracked ? '#ffaa00' : 'rgba(150,165,180,0.6)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleTrackToggle();
          }}
          aria-label={quest.isTracked ? 'Снять отслеживание' : 'Отслеживать'}
        >
          {quest.isTracked ? (
            <>
              <PinOff size={12} /> Снять
            </>
          ) : (
            <>
              <Pin size={12} /> Отслеж.
            </>
          )}
        </button>

        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(150,165,180,0.6)' }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          {isExpanded ? 'Свернуть ▲' : 'Развернуть ▼'}
        </button>
      </div>
    </motion.div>
  );
});

/* ─── Default Export ─── */

export default QuestObjectiveCard;

/* ─── Documentation ─── */

/**
 * @component QuestObjectiveCard
 * @description Карточка детального отображения информации о квесте.
 *
 * @remarks
 * Поддерживает все основные типы квестов с автоматическим определением
 * стилей на основе типа, сложности и текущего статуса.
 *
 * @accessibility
 * - Семантическая разметка role="article"
 * - ARIA-атрибуты для состояний и действий
 * - Поддержка клавиатурной навигации
 *
 * @performance
 * - Memoized sub-components
 * - Efficient animations via framer-motion
 */
