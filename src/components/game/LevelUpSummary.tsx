'use client'

/* ─── Volodka RPG – Level Up Summary ───
 * A detailed level-up screen that explains what changed when the
 * player levels up. Shows stat comparisons, new points, and
 * unlocked features. Gold/amber color scheme with particle effects.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { eventBus } from '@/engine/EventBus'
import { useGameStore } from '@/store/gameStore'
import { UI_LAYERS } from '@/shared/constants/uiLayers'
import { CYBERPUNK_COLORS } from './CyberpunkTheme'
import type { PlayerSkills, TrainablePlayerSkill } from '@/shared/types/game'

/* ─── Skill Labels ─── */

const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Кодирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
}

const SKILL_ICONS: Record<TrainablePlayerSkill, string> = {
  logic: '🧠',
  coding: '💻',
  empathy: '💛',
  persuasion: '🗣️',
  intuition: '👁️',
  writing: '✍️',
  rhythm: '🎵',
}

/* ─── Types ─── */

interface LevelUpData {
  newLevel: number
  prevLevel: number
  id: string
  prevSkills: PlayerSkills
  prevKarma: number
  prevXp: number
  prevSkillPoints: number
  prevPerkPoints: number
}

interface StatChange {
  label: string
  icon: string
  before: number
  after: number
  delta: number
}

/* ─── Particle count for gold burst ─── */
const PARTICLE_COUNT = 24

/* ─── Level unlock features (what's available at each level) ─── */

const LEVEL_UNLOCKS: Record<number, string> = {
  2: 'Навык «Базовый взлом» доступен',
  3: 'Очко черты получено! Новые черты разблокированы',
  5: 'Продвинутые навыки дерева разблокированы',
  6: 'Очко черты получено! Новые черты разблокированы',
  7: 'Доступ к торговле улучшенными предметами',
  9: 'Очко черты получено! Новые черты разблокированы',
  10: 'Мастерские навыки разблокированы',
  12: 'Очко черты получено! Новые черты разблокированы',
  15: 'Легендарные навыки разблокированы',
}

/* ─── Component ─── */

export function LevelUpSummary() {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Current player state
  const skills = useGameStore((s) => s.playerState.skills)
  const karma = useGameStore((s) => s.playerState.karma)
  const progression = useGameStore((s) => s.playerState.progression)

  const triggerLevelUp = useCallback((newLevel: number, prevLevel: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Snapshot previous state
    const prevSkills = { ...skills }
    const prevKarma = karma
    const prevXp = progression.xp
    const prevSkillPoints = progression.skillPoints - (newLevel - prevLevel)
    const prevPerkPoints = progression.perkPoints - (
      Array.from({ length: newLevel - prevLevel }, (_, i) => prevLevel + 1 + i)
        .filter((l) => l % 3 === 0).length
    )

    const id = `levelup-summary-${Date.now()}-${newLevel}`
    setLevelUpData({
      newLevel,
      prevLevel,
      id,
      prevSkills,
      prevKarma,
      prevXp,
      prevSkillPoints: Math.max(0, prevSkillPoints),
      prevPerkPoints: Math.max(0, prevPerkPoints),
    })
  }, [skills, karma, progression])

  // Watch EventBus for player:levelup
  useEffect(() => {
    const unsub = eventBus.on('player:levelup', (payload) => {
      triggerLevelUp(payload.newLevel, payload.prevLevel)
    })
    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [triggerLevelUp])

  // Also watch the store for level changes
  const storeLevel = progression.level
  const prevStoreLevel = useRef(storeLevel)

  useEffect(() => {
    if (storeLevel > prevStoreLevel.current) {
      const prev = prevStoreLevel.current
      prevStoreLevel.current = storeLevel
      const t = setTimeout(() => triggerLevelUp(storeLevel, prev), 50)
      return () => clearTimeout(t)
    } else if (storeLevel < prevStoreLevel.current) {
      prevStoreLevel.current = storeLevel
    }
  }, [storeLevel, triggerLevelUp])

  const handleContinue = useCallback(() => {
    setLevelUpData(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  // Compute stat changes
  const statChanges: StatChange[] = levelUpData
    ? (Object.entries(skills) as [TrainablePlayerSkill, number][])
        .map(([skill, currentVal]) => ({
          label: SKILL_LABELS[skill],
          icon: SKILL_ICONS[skill],
          before: levelUpData.prevSkills[skill],
          after: currentVal,
          delta: currentVal - levelUpData.prevSkills[skill],
        }))
        .filter((c) => c.delta !== 0)
    : []

  // Compute point changes
  const skillPointsGained = levelUpData
    ? progression.skillPoints - levelUpData.prevSkillPoints + (levelUpData.newLevel - levelUpData.prevLevel) // they spent some
    : 0
  const perkPointsGained = levelUpData
    ? (Array.from({ length: levelUpData.newLevel - levelUpData.prevLevel }, (_, i) => levelUpData.prevLevel + 1 + i)
        .filter((l) => l % 3 === 0).length)
    : 0

  // Level unlocks
  const unlocksInRange = levelUpData
    ? Array.from({ length: levelUpData.newLevel - levelUpData.prevLevel }, (_, i) => levelUpData.prevLevel + 1 + i)
        .map((l) => LEVEL_UNLOCKS[l])
        .filter(Boolean)
    : []

  return (
    <AnimatePresence>
      {levelUpData && (
        <motion.div
          key={levelUpData.id}
          className="fixed inset-0 flex items-center justify-center pointer-events-auto"
          style={{ zIndex: UI_LAYERS.LOADING }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Particle burst */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
              const angle = (360 / PARTICLE_COUNT) * i
              const distance = 100 + (i % 4) * 50
              const delay = i * 0.025
              const size = 3 + (i % 5)
              const isCyan = i % 3 === 0
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    background: isCyan
                      ? 'rgba(34, 211, 238, 0.9)'
                      : 'rgba(251, 191, 36, 0.9)',
                    boxShadow: isCyan
                      ? '0 0 8px rgba(34, 211, 238, 0.6)'
                      : '0 0 8px rgba(251, 191, 36, 0.6)',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * distance,
                    y: Math.sin((angle * Math.PI) / 180) * distance,
                    opacity: 0,
                    scale: 0.2,
                  }}
                  transition={{ duration: 1.5, delay, ease: 'easeOut' }}
                />
              )
            })}
          </div>

          {/* Main content card */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 rounded-xl border overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 12, 5, 0.95) 0%, rgba(10, 8, 3, 0.98) 100%)',
              borderColor: 'rgba(212, 146, 10, 0.4)',
              boxShadow: '0 0 40px rgba(212, 146, 10, 0.15), 0 0 80px rgba(212, 146, 10, 0.06), inset 0 0 20px rgba(212, 146, 10, 0.03)',
            }}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-500/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-500/50 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-500/50 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-500/50 rounded-br-xl" />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <motion.p
                className="font-mono text-xs tracking-[0.3em] uppercase text-amber-500/50 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Повышение уровня
              </motion.p>

              <motion.h2
                className="font-mono text-4xl sm:text-5xl font-black tracking-[0.1em]"
                style={{
                  color: CYBERPUNK_COLORS.amberGold,
                  textShadow: '0 0 20px rgba(212, 146, 10, 0.6), 0 0 40px rgba(212, 146, 10, 0.3), 0 0 60px rgba(212, 146, 10, 0.15)',
                }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                УРОВЕНЬ {levelUpData.newLevel}!
              </motion.h2>

              {/* Decorative line */}
              <motion.div
                className="mt-3 h-[1px] mx-auto"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(212, 146, 10, 0.5), transparent)',
                }}
                initial={{ width: 0 }}
                animate={{ width: 200 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="px-6 pb-4 space-y-4">
              {/* Point gains */}
              <motion.div
                className="flex items-center justify-center gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-amber-400">+1</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/50">Очко навыка</p>
                </div>
                {perkPointsGained > 0 && (
                  <div className="text-center">
                    <p className="font-mono text-2xl font-bold text-cyan-400">+{perkPointsGained}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/50">Очко черты</p>
                  </div>
                )}
              </motion.div>

              {/* Stat changes */}
              {statChanges.length > 0 && (
                <motion.div
                  className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/40 mb-2">Изменения</p>
                  <div className="space-y-1.5">
                    {statChanges.map((change) => (
                      <div key={change.label} className="flex items-center justify-between text-sm font-mono">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span>{change.icon}</span>
                          {change.label}
                        </span>
                        <span className="text-amber-400">
                          {change.before} → <span className="font-bold">{change.after}</span>
                          <span className="text-emerald-400 ml-1">+{change.delta}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Karma change */}
              {levelUpData && karma !== levelUpData.prevKarma && (
                <motion.div
                  className="flex items-center justify-between text-sm font-mono px-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-slate-400">☯ Карма</span>
                  <span className="text-amber-400">
                    {levelUpData.prevKarma} → <span className="font-bold">{karma}</span>
                    <span className="text-emerald-400 ml-1">+{karma - levelUpData.prevKarma}</span>
                  </span>
                </motion.div>
              )}

              {/* Level unlocks */}
              {unlocksInRange.length > 0 && (
                <motion.div
                  className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/40 mb-2">Разблокировано</p>
                  <div className="space-y-1">
                    {unlocksInRange.map((unlock, i) => (
                      <p key={i} className="font-mono text-sm text-cyan-300 flex items-center gap-1.5">
                        <span className="text-cyan-400">✦</span>
                        {unlock}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Available points summary */}
              <motion.div
                className="flex items-center justify-center gap-4 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-center px-3 py-1.5 rounded-md bg-slate-900/50 border border-slate-700/30">
                  <p className="font-mono text-xs text-slate-400">Очки навыков</p>
                  <p className="font-mono text-lg font-bold text-amber-400">{progression.skillPoints}</p>
                </div>
                <div className="text-center px-3 py-1.5 rounded-md bg-slate-900/50 border border-slate-700/30">
                  <p className="font-mono text-xs text-slate-400">Очки черт</p>
                  <p className="font-mono text-lg font-bold text-cyan-400">{progression.perkPoints}</p>
                </div>
              </motion.div>
            </div>

            {/* Continue button */}
            <motion.div
              className="px-6 pb-6 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <button
                onClick={handleContinue}
                className="w-full py-3 rounded-lg font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-200"
                style={{
                  color: CYBERPUNK_COLORS.amberGold,
                  background: 'rgba(212, 146, 10, 0.08)',
                  border: '1px solid rgba(212, 146, 10, 0.3)',
                  textShadow: '0 0 8px rgba(212, 146, 10, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 146, 10, 0.18)'
                  e.currentTarget.style.borderColor = 'rgba(212, 146, 10, 0.6)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 146, 10, 0.2), inset 0 0 12px rgba(212, 146, 10, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 146, 10, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(212, 146, 10, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Продолжить
              </button>
            </motion.div>

            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212, 146, 10, 0.015) 2px, rgba(212, 146, 10, 0.015) 4px)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
