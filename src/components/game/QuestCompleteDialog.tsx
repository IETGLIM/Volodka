'use client'

/* ─── Volodka RPG – QuestCompleteDialog ─── */
/* Quest completion dialog with green/gold color scheme, animated reward reveal,
 * objectives with checkmarks, and level-up check after closing. */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { NPC_DEFINITIONS } from '@/data/npcDefinitions'
import { eventBus } from '@/engine/EventBus'
import type { QuestDefinition } from '@/shared/types/game'

interface QuestCompleteDialogProps {
  questId: string | null
  npcId?: string
  onClose: () => void
}

export function QuestCompleteDialog({ questId, npcId, onClose }: QuestCompleteDialogProps) {
  const [visible, setVisible] = useState(false)
  const [revealedRewards, setRevealedRewards] = useState(0)

  const questDef = useMemo(
    () => questId ? QUEST_DEFINITIONS.find((d) => d.id === questId) ?? null : null,
    [questId],
  )

  const npcDef = useMemo(
    () => npcId ? NPC_DEFINITIONS.find((n) => n.id === npcId) ?? null : null,
    [npcId],
  )

  useEffect(() => {
    if (questId) {
      setVisible(true)
      setRevealedRewards(0)

      // Animate rewards appearing one by one
      if (questDef?.rewards) {
        questDef.rewards.forEach((_, i) => {
          setTimeout(() => {
            setRevealedRewards((prev) => prev + 1)
          }, 600 + i * 400)
        })
      }
    }
  }, [questId, questDef])

  const handleComplete = () => {
    setVisible(false)
    // Trigger level-up check after closing
    setTimeout(() => {
      onClose()
    }, 400)
  }

  if (!questDef) return null

  const questTypeBadgeColor = questDef.questType === 'main'
    ? '#ffcc00'
    : questDef.questType === 'side'
      ? '#66ffaa'
      : questDef.questType === 'hidden'
        ? '#cc88ff'
        : '#aaaaaa'

  const questTypeLabel = questDef.questType === 'main'
    ? 'ОСНОВНОЕ'
    : questDef.questType === 'side'
      ? 'ПОБОЧНОЕ'
      : questDef.questType === 'hidden'
        ? 'ТАЙНОЕ'
        : 'ЕЖЕДНЕВНОЕ'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,102,0.01) 2px, rgba(0,255,102,0.01) 4px)',
            }}
          />

          {/* Dialog container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex flex-col md:flex-row w-[95vw] max-w-[900px] max-h-[85vh] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,16,8,0.97), rgba(0,24,12,0.95))',
              border: '1px solid rgba(0,255,102,0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 30px rgba(0,255,102,0.1), 0 0 8px rgba(255,204,0,0.05), inset 0 0 15px rgba(0,255,102,0.03)',
            }}
          >
            {/* Corner brackets - gold */}
            <>
              <div className="absolute pointer-events-none" style={{ top: 0, left: 0, width: 6, height: 6, borderTop: '2px solid rgba(255,204,0,0.5)', borderLeft: '2px solid rgba(255,204,0,0.5)' }} />
              <div className="absolute pointer-events-none" style={{ top: 0, right: 0, width: 6, height: 6, borderTop: '2px solid rgba(255,204,0,0.5)', borderRight: '2px solid rgba(255,204,0,0.5)' }} />
              <div className="absolute pointer-events-none" style={{ bottom: 0, left: 0, width: 6, height: 6, borderBottom: '2px solid rgba(255,204,0,0.5)', borderLeft: '2px solid rgba(255,204,0,0.5)' }} />
              <div className="absolute pointer-events-none" style={{ bottom: 0, right: 0, width: 6, height: 6, borderBottom: '2px solid rgba(255,204,0,0.5)', borderRight: '2px solid rgba(255,204,0,0.5)' }} />
            </>

            {/* Left side: NPC portrait */}
            <div
              className="flex-shrink-0 w-full md:w-[220px] flex flex-col items-center p-4 md:p-6"
              style={{
                borderRight: '1px solid rgba(0,255,102,0.15)',
                borderBottom: '1px solid rgba(0,255,102,0.15)',
                background: 'linear-gradient(180deg, rgba(0,24,12,0.5), rgba(0,16,8,0.3))',
              }}
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="text-5xl mb-4"
                style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,102,0.5))' }}
              >
                ✓
              </motion.div>

              {/* Completion text */}
              <div
                className="text-lg font-mono font-bold tracking-wider text-center"
                style={{
                  color: '#66ffaa',
                  textShadow: '0 0 12px rgba(0,255,102,0.3)',
                }}
              >
                ЗАДАНИЕ
                <br />
                ВЫПОЛНЕНО
              </div>

              {/* NPC name */}
              {npcDef && (
                <div className="mt-3 text-center">
                  <div
                    className="text-xs font-mono"
                    style={{ color: '#88aa88' }}
                  >
                    от {npcDef.name}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Quest details */}
            <div
              className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-h-96 md:max-h-none"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ff6633 transparent' }}
            >
              {/* Quest title */}
              <div className="mb-3">
                <h2
                  className="text-xl font-mono font-bold tracking-wide"
                  style={{
                    color: '#f0ffe0',
                    textShadow: '0 0 12px rgba(0,255,102,0.2)',
                  }}
                >
                  {questDef.title}
                </h2>
              </div>

              {/* Quest type badge */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded"
                  style={{
                    color: questTypeBadgeColor,
                    background: `${questTypeBadgeColor}15`,
                    border: `1px solid ${questTypeBadgeColor}44`,
                  }}
                >
                  {questTypeLabel}
                </span>
              </div>

              {/* Objectives with checkmarks */}
              <div className="mb-4">
                <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#00ff6688' }}>
                  ЦЕЛИ:
                </h3>
                <div className="space-y-1.5">
                  {questDef.objectives.map((obj, i) => (
                    <motion.div
                      key={obj.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
                        className="text-sm flex-shrink-0 mt-0.5"
                        style={{ color: '#00ff66' }}
                      >
                        ✓
                      </motion.span>
                      <span className="text-[12px] font-mono line-through" style={{ color: '#88bb88' }}>
                        {obj.description}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Rewards with animated reveal */}
              {questDef.rewards && questDef.rewards.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#ffcc4488' }}>
                    НАГРАДЫ:
                  </h3>
                  <div className="space-y-2">
                    {questDef.rewards.map((reward, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                        animate={
                          i < revealedRewards
                            ? { opacity: 1, x: 0, scale: 1 }
                            : { opacity: 0, x: 20, scale: 0.8 }
                        }
                        transition={{ duration: 0.4, type: 'spring' }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded"
                        style={{
                          background: 'rgba(255,204,0,0.06)',
                          border: '1px solid rgba(255,204,0,0.15)',
                        }}
                      >
                        <span className="text-sm">{getRewardIcon(reward.type)}</span>
                        <span className="text-[12px] font-mono" style={{ color: '#ffcc66' }}>
                          {getRewardLabel(reward)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom button */}
            <div
              className="p-4 md:p-6"
              style={{ borderTop: '1px solid rgba(0,255,102,0.15)' }}
            >
              <motion.button
                onClick={handleComplete}
                className="w-full py-2.5 rounded font-mono text-sm tracking-wider font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,102,0.15), rgba(255,204,0,0.1))',
                  color: '#66ffaa',
                  border: '1px solid rgba(0,255,102,0.4)',
                  textShadow: '0 0 8px rgba(0,255,102,0.3)',
                }}
                whileHover={{
                  background: 'linear-gradient(135deg, rgba(0,255,102,0.25), rgba(255,204,0,0.15))',
                  boxShadow: '0 0 15px rgba(0,255,102,0.2)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                ЗАВЕРШИТЬ
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function getRewardIcon(type: string): string {
  switch (type) {
    case 'addSkill': return '🧠'
    case 'addKarma': return '⚖️'
    case 'addXp': return '✨'
    case 'addItem': return '🎁'
    case 'setFlag': return '⚡'
    default: return '◆'
  }
}

function getRewardLabel(reward: QuestDefinition['rewards'] extends (infer R)[] | undefined ? R : never): string {
  switch (reward.type) {
    case 'addSkill': return `${reward.skill} +${reward.value}`
    case 'addKarma': return `Карма +${reward.value}`
    case 'addXp': return `Опыт +${reward.value}`
    case 'addItem': return `Предмет: ${reward.itemId}`
    case 'setFlag': return `Флаг: ${reward.flag}`
    default: return reward.type
  }
}
