'use client'

/* ─── Volodka RPG – Inventory Tooltip ───
 * An enhanced inventory item tooltip that shows on hover.
 * Displays: item name, description, rarity, category, stats/effects.
 * Special badges for quest items. Cyberpunk styling with scanlines.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { getItemDefinition, getRarityColor, getRarityLabel, type ItemRarity } from '@/data/items'
import { QUEST_MINIGAME_MAP } from './MinigameQuestBridge'
import { CYBERPUNK_COLORS, cyberGlowText } from './CyberpunkTheme'
import type { InventoryItem, TrainablePlayerSkill } from '@/shared/types/game'

/* ─── Types ─── */

export interface InventoryTooltipProps {
  item: InventoryItem
  /** Whether the tooltip is visible */
  visible: boolean
  /** Position anchor ('above' | 'below' | 'right') — default: 'above' */
  position?: 'above' | 'below' | 'right'
  /** Optional quest name for quest items */
  linkedQuestName?: string
}

/* ─── Category Labels ─── */

const CATEGORY_LABELS: Record<string, string> = {
  consumable: 'Расходуемый',
  quest_item: 'Квестовый',
  key_item: 'Ключевой',
  book: 'Книга',
  equipment: 'Экипировка',
  poem_fragment: 'Фрагмент',
  misc: 'Разное',
  key: 'Ключевой',
  quest: 'Квестовый',
}

/* ─── Stat Labels ─── */

const STAT_LABELS: Record<string, string> = {
  energy: '⚡ Энергия',
  stress: '😰 Стресс',
  karma: '☯ Карма',
}

const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: '🧠 Логика',
  coding: '💻 Кодирование',
  empathy: '💛 Эмпатия',
  persuasion: '🗣️ Убеждение',
  intuition: '👁️ Интуиция',
  writing: '✍️ Письмо',
  rhythm: '🎵 Ритм',
}

/* ─── Rarity border colors for tooltip ─── */

const RARITY_BORDER: Record<ItemRarity, string> = {
  common: 'rgba(148, 163, 184, 0.2)',
  uncommon: 'rgba(52, 211, 153, 0.4)',
  rare: 'rgba(34, 211, 238, 0.4)',
  legendary: 'rgba(251, 191, 36, 0.5)',
}

const RARITY_GLOW: Record<ItemRarity, string> = {
  common: '',
  uncommon: '0 0 8px rgba(52, 211, 153, 0.15)',
  rare: '0 0 12px rgba(34, 211, 238, 0.2)',
  legendary: '0 0 16px rgba(251, 191, 36, 0.3)',
}

const RARITY_TEXT: Record<ItemRarity, string> = {
  common: 'text-slate-300',
  uncommon: 'text-emerald-300',
  rare: 'text-cyan-300',
  legendary: 'text-amber-300',
}

/* ─── Component ─── */

export function InventoryTooltip({
  item,
  visible,
  position = 'above',
  linkedQuestName,
}: InventoryTooltipProps) {
  const def = getItemDefinition(item.id)
  const rarity: ItemRarity = def?.rarity ?? 'common'
  const isQuestItem = def?.questRelated ?? false
  const isEquipment = def?.category === 'equipment'
  const isConsumable = def?.category === 'consumable'
  const isBook = def?.category === 'book'
  const equipmentSlot = def?.equipmentSlot

  // Build effect descriptions
  const effects: string[] = []
  if (def) {
    for (const eff of def.effects) {
      if (eff.stat && STAT_LABELS[eff.stat]) {
        const prefix = eff.value > 0 ? '+' : ''
        effects.push(`${STAT_LABELS[eff.stat]} ${prefix}${eff.value}`)
      } else if (eff.skill && SKILL_LABELS[eff.skill]) {
        effects.push(`${SKILL_LABELS[eff.skill]} +${eff.value}`)
      }
    }
  }

  // Position classes
  const positionClasses: Record<string, string> = {
    above: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    below: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`absolute z-50 pointer-events-none ${positionClasses[position]}`}
          initial={{ opacity: 0, scale: 0.92, y: position === 'above' ? 5 : position === 'below' ? -5 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: position === 'above' ? 5 : position === 'below' ? -5 : 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div
            className="w-64 rounded-lg border backdrop-blur-md overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.96) 0%, rgba(5, 8, 14, 0.98) 100%)',
              borderColor: RARITY_BORDER[rarity],
              boxShadow: RARITY_GLOW[rarity] || 'none',
            }}
          >
            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.01) 2px, rgba(0, 229, 255, 0.01) 4px)',
              }}
            />

            {/* Header with item name */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`font-mono text-sm font-bold leading-tight ${RARITY_TEXT[rarity]}`}>
                  {item.name}
                </h4>
                <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {getRarityLabel(rarity)}
                </span>
              </div>

              {/* Category badge */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {CATEGORY_LABELS[def?.category ?? item.category] ?? item.category}
                </span>
                {isQuestItem && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Предмет квеста
                  </span>
                )}
                {isEquipment && equipmentSlot && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {equipmentSlot === 'head' ? 'Голова' : equipmentSlot === 'body' ? 'Тело' : 'Аксессуар'}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-[1px] mx-3"
              style={{
                background: `linear-gradient(90deg, transparent, ${RARITY_BORDER[rarity]}, transparent)`,
              }}
            />

            {/* Description */}
            <div className="px-3 py-2">
              <p className="font-mono text-xs text-slate-400 leading-relaxed">
                {item.description || def?.description || 'Нет описания'}
              </p>
            </div>

            {/* Effects / Stats */}
            {effects.length > 0 && (
              <>
                <div
                  className="h-[1px] mx-3"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.15), transparent)',
                  }}
                />
                <div className="px-3 py-2 space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    {isEquipment ? 'Бонусы' : isConsumable ? 'Эффект' : isBook ? 'При изучении' : 'Эффекты'}
                  </p>
                  {effects.map((eff, i) => (
                    <p key={i} className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                      <span className="text-emerald-500">▸</span>
                      {eff}
                    </p>
                  ))}
                </div>
              </>
            )}

            {/* Linked quest */}
            {isQuestItem && linkedQuestName && (
              <>
                <div
                  className="h-[1px] mx-3"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.15), transparent)',
                  }}
                />
                <div className="px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/50 mb-0.5">Квест</p>
                  <p className="font-mono text-xs text-cyan-300">{linkedQuestName}</p>
                </div>
              </>
            )}

            {/* Quantity for stackable items */}
            {item.quantity > 1 && (
              <div className="px-3 pb-2">
                <p className="font-mono text-[10px] text-slate-500">
                  Количество: <span className="text-slate-300">{item.quantity}</span>
                </p>
              </div>
            )}

            {/* Corner glow dots */}
            {rarity === 'legendary' && (
              <>
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/40 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40 rounded-br-lg" />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
