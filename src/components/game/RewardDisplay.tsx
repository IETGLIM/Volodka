
/* ─── Volodka RPG – Reward Display ───
 * A reusable component for showing quest rewards clearly.
 * Each reward is a card with icon, value, label, and rarity color.
 * Animated entrance with stagger effect.
 */

import { motion } from 'framer-motion'
import { CYBERPUNK_COLORS, cyberGlowText, cyberBorderGlow } from './CyberpunkTheme'

/* ─── Types ─── */

export type RewardType = 'xp' | 'karma' | 'skill' | 'item' | 'flag' | 'poem'
export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface RewardItem {
  type: RewardType
  value: any
  label: string
  rarity?: RewardRarity
}

export interface RewardDisplayProps {
  rewards: RewardItem[]
  /** Title above the rewards (default: 'Награды') */
  title?: string
  /** Whether to show the scanlines overlay (default: true) */
  showScanlines?: boolean
  /** Accent color key for the header (default: 'neonCyan') */
  accentColor?: keyof typeof CYBERPUNK_COLORS
  /** Additional CSS class for the container */
  className?: string
}

/* ─── Icon Mapping ─── */

const REWARD_ICONS: Record<RewardType, string> = {
  xp: '⚡',
  karma: '☯',
  skill: '✦',
  item: '📦',
  flag: '🎖',
  poem: '✒',
}

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  xp: 'Опыт',
  karma: 'Карма',
  skill: 'Навык',
  item: 'Предмет',
  flag: 'Достижение',
  poem: 'Стихотворение',
}

/* ─── Rarity Colors ─── */

const RARITY_COLORS: Record<RewardRarity, { text: string; border: string; bg: string; glow: string }> = {
  common: {
    text: 'text-slate-200',
    border: 'border-slate-500/30',
    bg: 'bg-slate-800/40',
    glow: '',
  },
  uncommon: {
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/30',
    glow: 'shadow-[0_0_10px_rgba(52,211,153,0.12)]',
  },
  rare: {
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/30',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.15)]',
  },
  legendary: {
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/30',
    glow: 'shadow-[0_0_16px_rgba(251,191,36,0.2)]',
  },
}

const RARITY_LABELS: Record<RewardRarity, string> = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  legendary: 'Легендарный',
}

/* ─── Animation Variants ─── */

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.2,
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

/* ─── Single Reward Card ─── */

function RewardCard({ reward, index }: { reward: RewardItem; index: number }) {
  const rarity = reward.rarity ?? 'common'
  const colors = RARITY_COLORS[rarity]
  const icon = REWARD_ICONS[reward.type]
  const typeLabel = REWARD_TYPE_LABELS[reward.type]

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`relative rounded-lg border p-3 backdrop-blur-sm ${colors.bg} ${colors.border} ${colors.glow} transition-colors`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-xl"
          style={{
            background: rarity === 'legendary'
              ? 'rgba(251, 191, 36, 0.1)'
              : rarity === 'rare'
                ? 'rgba(34, 211, 238, 0.1)'
                : rarity === 'uncommon'
                  ? 'rgba(52, 211, 153, 0.1)'
                  : 'rgba(148, 163, 184, 0.06)',
          }}
        >
          {icon}
        </div>

        {/* Label & Value */}
        <div className="flex-1 min-w-0">
          <p className={`font-mono text-sm font-medium ${colors.text} truncate`}>
            {reward.label}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              {typeLabel}
            </span>
            {rarity !== 'common' && (
              <span className={`font-mono text-[10px] uppercase tracking-wider ${
                rarity === 'legendary' ? 'text-amber-400'
                  : rarity === 'rare' ? 'text-cyan-400'
                    : 'text-emerald-400'
              }`}>
                {RARITY_LABELS[rarity]}
              </span>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="flex-shrink-0 text-right">
          <p className={`font-mono text-lg font-bold ${colors.text}`}>
            {typeof reward.value === 'number'
              ? (reward.value > 0 ? `+${reward.value}` : `${reward.value}`)
              : reward.value}
          </p>
        </div>
      </div>

      {/* Scanlines on legendary */}
      {rarity === 'legendary' && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(251, 191, 36, 0.02) 2px, rgba(251, 191, 36, 0.02) 4px)',
          }}
        />
      )}
    </motion.div>
  )
}

/* ─── Main Component ─── */

export function RewardDisplay({
  rewards,
  title = 'Награды',
  showScanlines = true,
  accentColor = 'neonCyan',
  className = '',
}: RewardDisplayProps) {
  if (rewards.length === 0) return null

  const accentHex = CYBERPUNK_COLORS[accentColor]
  const accentRgb = `${parseInt(accentHex.slice(1, 3), 16)}, ${parseInt(accentHex.slice(3, 5), 16)}, ${parseInt(accentHex.slice(5, 7), 16)}`

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-[1px] flex-1"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${accentRgb}, 0.3))`,
          }}
        />
        <h3
          className="font-mono text-xs uppercase tracking-[0.2em]"
          style={{
            color: accentHex,
            textShadow: `0 0 8px rgba(${accentRgb}, 0.3)`,
          }}
        >
          {title}
        </h3>
        <div
          className="h-[1px] flex-1"
          style={{
            background: `linear-gradient(90deg, rgba(${accentRgb}, 0.3), transparent)`,
          }}
        />
      </div>

      {/* Reward Cards */}
      <div className="space-y-2">
        {rewards.map((reward, i) => (
          <RewardCard key={`${reward.type}-${reward.label}-${i}`} reward={reward} index={i} />
        ))}
      </div>

      {/* Scanlines overlay */}
      {showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.012) 2px, rgba(0, 255, 65, 0.012) 4px)',
          }}
        />
      )}
    </div>
  )
}
