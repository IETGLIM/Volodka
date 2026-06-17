
/* ─── Volodka RPG – QuestCompleteDialog (Enhanced) ─── */
/* Quest completion dialog with green/gold color scheme, NPC portrait,
 * "Задание выполнено!" header with green glow, animated reward reveal
 * with staggered timing, objectives with checkmarks, and "Продолжить" button. */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { findNpcById } from '@/data/allNpcDefinitions'
import { resolveCanonicalNpcId } from '@/data/goldenPath'
import { UI_LAYERS } from '@/shared/constants/uiLayers'
import type { NPCDefinition, StoryEffect } from '@/shared/types/game';
import { computeQuestCreditReward, getDefaultQuestXp } from '@/shared/utils/questRewards'

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

  // Resolve NPC: prefer npcId prop, fall back to questGiverNpcId from quest definition
  const resolvedNpcId = useMemo(
    () => {
      const raw = npcId ?? questDef?.questGiverNpcId ?? undefined
      return raw ? resolveCanonicalNpcId(raw) : undefined
    },
    [npcId, questDef],
  )

  const npcDef = useMemo(
    () => resolvedNpcId ? findNpcById(resolvedNpcId) ?? null : null,
    [resolvedNpcId],
  )

  useEffect(() => {
    if (questId) {
      setVisible(true)
      setRevealedRewards(0)

      const explicitCount = questDef?.rewards?.length ?? 0
      const bonusCount = questDef ? 2 : 0
      const totalRewards = explicitCount + bonusCount
      for (let i = 0; i < totalRewards; i++) {
        setTimeout(() => {
          setRevealedRewards((prev) => prev + 1)
        }, 800 + i * 350)
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
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', zIndex: UI_LAYERS.PANEL }}
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

            {/* Left side: NPC portrait + completion header */}
            <div
              className="flex-shrink-0 w-full md:w-[240px] flex flex-col items-center p-4 md:p-6"
              style={{
                borderRight: '1px solid rgba(0,255,102,0.15)',
                borderBottom: '1px solid rgba(0,255,102,0.15)',
                background: 'linear-gradient(180deg, rgba(0,24,12,0.5), rgba(0,16,8,0.3))',
              }}
            >
              {/* NPC Portrait */}
              <CompletionNpcPortrait npcDef={npcDef} />

              {/* "Задание выполнено!" header with green glow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-4 text-center"
              >
                <div
                  className="text-lg font-mono font-bold tracking-wider"
                  style={{
                    color: '#66ffaa',
                    textShadow: '0 0 16px rgba(0,255,102,0.4), 0 0 32px rgba(0,255,102,0.15)',
                  }}
                >
                  Задание
                </div>
                <div
                  className="text-lg font-mono font-bold tracking-wider"
                  style={{
                    color: '#88ffcc',
                    textShadow: '0 0 16px rgba(0,255,102,0.5), 0 0 32px rgba(0,255,102,0.2)',
                  }}
                >
                  выполнено!
                </div>
              </motion.div>

              {/* NPC name / quest source */}
              {npcDef ? (
                <div className="mt-2 text-center">
                  <div
                    className="text-xs font-mono"
                    style={{ color: '#88aa88' }}
                  >
                    от {npcDef.name}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-center">
                  <div className="text-xs font-mono" style={{ color: '#668866' }}>
                    Самостоятельное задание
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
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex items-start gap-2"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.08, type: 'spring' }}
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
              <div className="mb-4">
                <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#ffcc4488' }}>
                  НАГРАДЫ:
                </h3>
                <div className="space-y-2">
                  {questDef.rewards?.map((reward, i) => (
                    <motion.div
                      key={`reward-${i}`}
                      initial={{ opacity: 0, x: 20, scale: 0.8 }}
                      animate={
                        i < revealedRewards
                          ? { opacity: 1, x: 0, scale: 1 }
                          : { opacity: 0, x: 20, scale: 0.8 }
                      }
                      transition={{ duration: 0.4, type: 'spring' }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded"
                      style={{
                        background: i < revealedRewards
                          ? 'rgba(255,204,0,0.08)'
                          : 'rgba(255,204,0,0.03)',
                        border: i < revealedRewards
                          ? '1px solid rgba(255,204,0,0.2)'
                          : '1px solid rgba(255,204,0,0.08)',
                        boxShadow: i < revealedRewards
                          ? '0 0 8px rgba(255,204,0,0.08)'
                          : 'none',
                      }}
                    >
                      <span className="text-sm">{getRewardIcon(reward.type)}</span>
                      <span className="text-[12px] font-mono" style={{ color: '#ffcc66' }}>
                        {getRewardLabel(reward)}
                      </span>
                    </motion.div>
                  ))}
                  {[
                    { type: 'addXp', value: getDefaultQuestXp(questDef.questType), label: `Опыт за задание +${getDefaultQuestXp(questDef.questType)}` },
                    { type: 'addCredits', value: computeQuestCreditReward(questDef), label: `Кредиты за задание +${computeQuestCreditReward(questDef)}` },
                  ].map((bonus, i) => {
                    const index = (questDef.rewards?.length ?? 0) + i;
                    return (
                      <motion.div
                        key={`bonus-${bonus.type}`}
                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                        animate={
                          index < revealedRewards
                            ? { opacity: 1, x: 0, scale: 1 }
                            : { opacity: 0, x: 20, scale: 0.8 }
                        }
                        transition={{ duration: 0.4, type: 'spring' }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded"
                        style={{
                          background: index < revealedRewards
                            ? 'rgba(255,204,0,0.08)'
                            : 'rgba(255,204,0,0.03)',
                          border: index < revealedRewards
                            ? '1px solid rgba(255,204,0,0.2)'
                            : '1px solid rgba(255,204,0,0.08)',
                          boxShadow: index < revealedRewards
                            ? '0 0 8px rgba(255,204,0,0.08)'
                            : 'none',
                        }}
                      >
                        <span className="text-sm">{getRewardIcon(bonus.type)}</span>
                        <span className="text-[12px] font-mono" style={{ color: '#ffcc66' }}>
                          {bonus.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
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
                  color: '#88ffcc',
                  border: '1px solid rgba(0,255,102,0.4)',
                  textShadow: '0 0 8px rgba(0,255,102,0.3)',
                }}
                whileHover={{
                  background: 'linear-gradient(135deg, rgba(0,255,102,0.25), rgba(255,204,0,0.15))',
                  boxShadow: '0 0 15px rgba(0,255,102,0.2)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                Продолжить
              </motion.button>
            </div>
          </motion.div>

          {/* Holo shimmer animation */}
          <style>{`
            @keyframes completion-holo-shimmer {
              0% { opacity: 0; transform: translateX(-100%) rotate(15deg); }
              40% { opacity: 0.4; }
              100% { opacity: 0; transform: translateX(200%) rotate(15deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Completion NPC Portrait (green-tinted for completion) ─── */
function CompletionNpcPortrait({ npcDef }: { npcDef: NPCDefinition | null }) {
  const bodyColor = npcDef?.appearance?.bodyColor ?? '#6a6a7a'
  const accentColor = npcDef?.appearance?.accentColor ?? '#9a9aaa'
  const glowColor = npcDef?.appearance?.glowColor ?? '#ffffff'
  const accessory = npcDef?.appearance?.headAccessory ?? 'none'
  const silhouette = npcDef?.appearance?.silhouette ?? 'average'

  // Silhouette-dependent body dimensions
  const bodyRx = silhouette === 'heavy' ? 48 : silhouette === 'slim' ? 32 : 40
  const bodyRy = silhouette === 'heavy' ? 35 : silhouette === 'slim' ? 28 : 30
  const headRx = silhouette === 'heavy' ? 38 : silhouette === 'slim' ? 30 : 35
  const headRy = silhouette === 'heavy' ? 42 : silhouette === 'slim' ? 38 : 40

  // If no NPC, show success checkmark portrait
  if (!npcDef) {
    return (
      <div className="relative overflow-hidden rounded-lg" style={{ width: '160px', height: '160px' }}>
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,102,0.08) 0%, transparent 70%)',
          }}
        />
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(0,255,102,0.3)" strokeWidth="1" />
          <circle cx="100" cy="100" r="90" fill="rgba(0,255,102,0.05)" />
          {/* Generic silhouette */}
          <ellipse cx="100" cy="160" rx="40" ry="30" fill="rgba(0,255,102,0.2)" />
          <rect x="90" y="120" width="20" height="25" fill="rgba(0,255,102,0.25)" rx="4" />
          <ellipse cx="100" cy="90" rx="35" ry="40" fill="rgba(0,255,102,0.3)" />
          {/* Success checkmark */}
          <motion.path
            d="M 70 95 L 90 115 L 135 70"
            fill="none"
            stroke="#00ff66"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </svg>
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 20px rgba(0,255,102,0.06), 0 0 10px rgba(0,255,102,0.04)',
            border: '1px solid rgba(0,255,102,0.25)',
            borderRadius: '8px',
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ width: '160px', height: '160px' }}
    >
      {/* Background glow - green tinted for completion */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(circle, ${glowColor}11 0%, rgba(0,255,102,0.06) 40%, transparent 70%)`,
        }}
      />

      {/* Holo-shimmer sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(0,255,102,0.1) 45%, rgba(0,255,102,0.03) 50%, transparent 55%)',
          animation: 'completion-holo-shimmer 5s ease-in-out infinite',
          zIndex: 2,
        }}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ position: 'relative', zIndex: 1 }}>
        {/* Background circle */}
        <circle cx="100" cy="100" r="95" fill="none" stroke={`${accentColor}44`} strokeWidth="1" />
        <circle cx="100" cy="100" r="90" fill={`${bodyColor}18`} />

        {/* Body silhouette */}
        <ellipse cx="100" cy="160" rx={bodyRx} ry={bodyRy} fill={bodyColor} opacity="0.6" />
        <rect x="90" y="120" width="20" height="25" fill={bodyColor} opacity="0.7" rx="4" />
        <ellipse cx="100" cy="90" rx={headRx} ry={headRy} fill={bodyColor} opacity="0.8" />
        {/* Eyes - green glow for completion */}
        <ellipse cx="87" cy="85" rx="5" ry="3" fill={accentColor} opacity="0.9" />
        <ellipse cx="113" cy="85" rx="5" ry="3" fill={accentColor} opacity="0.9" />
        <ellipse cx="87" cy="85" rx="3" ry="2" fill="#00ff66" opacity="0.5" />
        <ellipse cx="113" cy="85" rx="3" ry="2" fill="#00ff66" opacity="0.5" />

        {/* Accessories */}
        {accessory === 'glasses' && (
          <>
            <rect x="75" y="78" width="20" height="10" rx="3" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.7" />
            <rect x="105" y="78" width="20" height="10" rx="3" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.7" />
            <line x1="95" y1="83" x2="105" y2="83" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
          </>
        )}
        {accessory === 'hat' && (
          <>
            <ellipse cx="100" cy="55" rx="42" ry="8" fill={accentColor} opacity="0.6" />
            <rect x="80" y="35" width="40" height="20" rx="5" fill={accentColor} opacity="0.7" />
          </>
        )}
        {accessory === 'scarf' && (
          <path d="M 75 115 Q 100 130 125 115" fill="none" stroke={accentColor} strokeWidth="6" opacity="0.7" />
        )}
        {accessory === 'earring' && (
          <>
            <circle cx="65" cy="95" r="3" fill={accentColor} opacity="0.8" />
            <circle cx="65" cy="100" r="2" fill={glowColor} opacity="0.6" />
            <line x1="67" y1="90" x2="65" y2="93" stroke={accentColor} strokeWidth="1" opacity="0.6" />
          </>
        )}

        {/* Data stream lines */}
        <line x1="30" y1="40" x2="55" y2="40" stroke={`${accentColor}33`} strokeWidth="0.5" />
        <line x1="35" y1="55" x2="60" y2="55" stroke={`${accentColor}22`} strokeWidth="0.5" />
        <line x1="140" y1="45" x2="170" y2="45" stroke={`${accentColor}33`} strokeWidth="0.5" />
        <line x1="145" y1="60" x2="165" y2="60" stroke={`${accentColor}22`} strokeWidth="0.5" />

        {/* Completion checkmark overlay */}
        <motion.path
          d="M 65 95 L 85 115 L 135 65"
          fill="none"
          stroke="#00ff66"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,102,0.5))' }}
        />
      </svg>

      {/* Glow border */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0,255,102,0.08), 0 0 10px rgba(0,255,102,0.04)',
          border: '1px solid rgba(0,255,102,0.25)',
          borderRadius: '8px',
          zIndex: 3,
        }}
      />
    </div>
  )
}

function getRewardIcon(type: string): string {
  switch (type) {
    case 'addSkill': return '🧠'
    case 'addKarma': return '⚖️'
    case 'addXp': return '✨'
    case 'addCredits': return '💰'
    case 'addItem': return '🎁'
    case 'setFlag': return '⚡'
    default: return '◆'
  }
}

function getRewardLabel(reward: StoryEffect): string {
  switch (reward.type) {
    case 'addSkill': return `${reward.skill} +${reward.value}`
    case 'addKarma': return `Карма +${reward.value}`
    case 'addXp': return `Опыт +${reward.value}`
    case 'addCredits': return `Кредиты +${reward.value}`
    case 'addItem': return `Предмет: ${reward.itemId}`
    case 'setFlag': return `Флаг: ${reward.flag}`
    default: return reward.type
  }
}
