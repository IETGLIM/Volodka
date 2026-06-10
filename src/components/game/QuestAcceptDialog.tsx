
/* ─── Volodka RPG – QuestAcceptDialog (Enhanced) ─── */
/* Warcraft-style quest acceptance dialog with cyberpunk terminal styling.
 * Full-screen overlay, NPC portrait with holo-shimmer, quest details,
 * accept/decline buttons. Uses questGiverNpcId as fallback for portrait. */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { findNpcById } from '@/data/allNpcDefinitions'
import { resolveCanonicalNpcId } from '@/data/goldenPath'
import { eventBus } from '@/engine/EventBus'
import { UI_LAYERS } from '@/shared/constants/uiLayers'
import type { NPCDefinition, QuestDefinition, QuestObjective } from '@/shared/types/game'

interface QuestAcceptDialogProps {
  questId: string | null
  npcId?: string
  onClose: () => void
  onAccept: (questId: string) => void
}

export function QuestAcceptDialog({ questId, npcId, onClose, onAccept }: QuestAcceptDialogProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (questId) {
      setVisible(true)
    }
  }, [questId])

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

  const npcRelation = useGameStore((s) => {
    const rel = s.npcRelations.find((r) => r.npcId === resolvedNpcId)
    return rel?.value ?? 50
  })

  const handleAccept = () => {
    if (questId) {
      onAccept(questId)
    }
    setVisible(false)
    setTimeout(onClose, 400)
  }

  const handleDecline = () => {
    setVisible(false)
    setTimeout(onClose, 400)
  }

  const isMainQuest = questDef?.questType === 'main'

  if (!questDef) return null

  const difficultyDiamonds = questDef.difficulty === 'easy' ? 1 : questDef.difficulty === 'medium' ? 2 : 3
  const questTypeBadgeColor = questDef.questType === 'main'
    ? '#ff6644'
    : questDef.questType === 'side'
      ? '#66ccff'
      : questDef.questType === 'hidden'
        ? '#cc66ff'
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
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,238,0.015) 2px, rgba(0,255,238,0.015) 4px)',
              animation: 'scanline-drift 8s linear infinite',
            }}
          />

          {/* Dialog container */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex flex-col w-[95vw] max-w-[760px] max-h-[88vh] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,8,16,0.97), rgba(0,16,24,0.95))',
              border: '1px solid rgba(0,255,238,0.3)',
              borderRadius: '8px',
              boxShadow: '0 0 30px rgba(0,255,238,0.1), 0 0 8px rgba(0,255,238,0.05), inset 0 0 15px rgba(0,255,238,0.03)',
            }}
          >
            {/* Corner brackets */}
            <BracketCorners color="rgba(0,255,238,0.5)" size={6} />

            {/* Portrait + details row */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

            {/* Left side: NPC portrait */}
            <div
              className="flex-shrink-0 w-full md:w-[240px] flex flex-col items-center p-4 md:p-6"
              style={{
                borderRight: '1px solid rgba(0,255,238,0.15)',
                borderBottom: '1px solid rgba(0,255,238,0.15)',
                background: 'linear-gradient(180deg, rgba(0,20,30,0.5), rgba(0,8,16,0.3))',
              }}
            >
              {/* NPC SVG Portrait */}
              <NpcPortrait npcDef={npcDef} />

              {/* Name plate */}
              {npcDef ? (
                <div className="mt-3 text-center">
                  <div
                    className="text-sm font-mono font-bold tracking-wider"
                    style={{
                      color: npcDef.appearance?.accentColor ?? '#00ffee',
                      textShadow: `0 0 8px ${npcDef.appearance?.accentColor ?? '#00ffee'}44`,
                    }}
                  >
                    {npcDef.name}
                  </div>
                  {/* Relationship level */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] font-mono" style={{ color: '#888' }}>
                      Отношения:
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: npcRelation >= i * 20
                              ? '#00ff66'
                              : '#333',
                            boxShadow: npcRelation >= i * 20
                              ? '0 0 4px rgba(0,255,102,0.5)'
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: '#aaa' }}>
                      {npcRelation}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-center">
                  <div
                    className="text-xs font-mono tracking-wider"
                    style={{
                      color: '#557777',
                      textShadow: '0 0 4px rgba(0,255,238,0.1)',
                    }}
                  >
                    {questDef.questGiverNpcId ? 'ЗАКАЗЧИК НЕ НАЙДЕН' : 'САМОСТОЯТЕЛЬНОЕ ЗАДАНИЕ'}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Quest details */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-h-96 md:max-h-none"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffee33 transparent' }}
            >
              {/* Quest title */}
              <div className="mb-3">
                <h2
                  className="text-xl font-mono font-bold tracking-wide"
                  style={{
                    color: '#e0f8f8',
                    textShadow: '0 0 12px rgba(0,255,238,0.2)',
                  }}
                >
                  {questDef.title}
                </h2>
              </div>

              {/* Quest type badge + difficulty */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded"
                  style={{
                    color: questTypeBadgeColor,
                    background: `${questTypeBadgeColor}15`,
                    border: `1px solid ${questTypeBadgeColor}44`,
                    textShadow: `0 0 4px ${questTypeBadgeColor}44`,
                  }}
                >
                  {questTypeLabel}
                </span>

                {/* Difficulty diamonds */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono" style={{ color: '#888' }}>
                    Сложность:
                  </span>
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="text-xs"
                      style={{
                        color: i <= difficultyDiamonds ? '#ffaa00' : '#333',
                        textShadow: i <= difficultyDiamonds ? '0 0 4px rgba(255,170,0,0.5)' : 'none',
                      }}
                    >
                      ◆
                    </span>
                  ))}
                </div>
              </div>

              {/* Quest description */}
              <p
                className="text-sm font-mono leading-relaxed mb-4"
                style={{ color: '#aacccc' }}
              >
                {questDef.description}
              </p>

              {/* Objectives list */}
              <div className="mb-4">
                <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#00ffee88' }}>
                  ЦЕЛИ:
                </h3>
                <div className="space-y-1.5">
                  {questDef.objectives.map((obj, i) => (
                    <motion.div
                      key={obj.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                    >
                      <ObjectiveRow objective={obj} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Rewards list */}
              {questDef.rewards && questDef.rewards.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#ffaa4488' }}>
                    НАГРАДЫ:
                  </h3>
                  <div className="space-y-1">
                    {questDef.rewards.map((reward, i) => (
                      <RewardRow key={i} reward={reward} />
                    ))}
                  </div>
                </div>
              )}

              {/* Poem bypass indicator */}
              {questDef.objectives.some((o) => o.poemPowerBypass) && (
                <div
                  className="mb-4 px-3 py-2 rounded"
                  style={{
                    background: 'rgba(0,255,102,0.08)',
                    border: '1px solid rgba(0,255,102,0.2)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#00ff66', fontSize: '14px' }}>📜</span>
                    <span className="text-[11px] font-mono" style={{ color: '#66ffaa' }}>
                      Можно обойти с помощью стихотворения
                    </span>
                  </div>
                  {questDef.objectives
                    .filter((o) => o.poemPowerHint)
                    .map((o) => (
                      <div key={o.id} className="text-[10px] font-mono mt-1 ml-6" style={{ color: '#44aa66' }}>
                        {o.poemPowerHint}
                      </div>
                    ))}
                </div>
              )}

              {/* Hint */}
              {questDef.hint && (
                <div className="mb-4">
                  <div className="text-[11px] font-mono italic" style={{ color: '#668888' }}>
                    💡 {questDef.hint}
                  </div>
                </div>
              )}
            </div>

            </div>{/* end portrait + details row */}

            {/* Bottom buttons — full-width bar */}
            <div
              className="flex gap-3 px-4 py-3 md:px-6"
              style={{ borderTop: '1px solid rgba(0,255,238,0.15)' }}
            >
              <motion.button
                onClick={handleAccept}
                className="flex-1 py-3 rounded font-mono text-sm tracking-wider font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,238,0.18), rgba(0,255,238,0.08))',
                  color: '#00ffee',
                  border: '1px solid rgba(0,255,238,0.4)',
                  textShadow: '0 0 8px rgba(0,255,238,0.3)',
                }}
                whileHover={{
                  background: 'linear-gradient(135deg, rgba(0,255,238,0.28), rgba(0,255,238,0.15))',
                  boxShadow: '0 0 15px rgba(0,255,238,0.2)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                ПРИНЯТЬ
              </motion.button>

              {!isMainQuest && (
                <motion.button
                  onClick={handleDecline}
                  className="flex-1 py-3 rounded font-mono text-sm tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,100,68,0.1), rgba(255,100,68,0.05))',
                    color: '#ff6644',
                    border: '1px solid rgba(255,100,68,0.3)',
                    textShadow: '0 0 8px rgba(255,100,68,0.3)',
                  }}
                  whileHover={{
                    background: 'linear-gradient(135deg, rgba(255,100,68,0.2), rgba(255,100,68,0.1))',
                    boxShadow: '0 0 15px rgba(255,100,68,0.15)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  ОТКЛОНИТЬ
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Scanline drift animation */}
          <style>{`
            @keyframes scanline-drift {
              0% { background-position: 0 0; }
              100% { background-position: 0 100px; }
            }
            @keyframes holo-shimmer {
              0% { opacity: 0; transform: translateX(-100%) rotate(15deg); }
              40% { opacity: 0.5; }
              100% { opacity: 0; transform: translateX(200%) rotate(15deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── NPC Portrait SVG (Enhanced with silhouette variants, earring, holo-shimmer) ─── */
function NpcPortrait({ npcDef }: { npcDef: NPCDefinition | null }) {
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

  // If no NPC at all, show "?" silhouette
  if (!npcDef) {
    return (
      <div className="relative" style={{ width: '200px', height: '200px' }}>
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'radial-gradient(circle, rgba(100,100,120,0.1) 0%, transparent 70%)',
          }}
        />
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(100,100,120,0.3)" strokeWidth="1" />
          <circle cx="100" cy="100" r="90" fill="rgba(50,50,60,0.15)" />
          {/* Generic body silhouette */}
          <ellipse cx="100" cy="160" rx="40" ry="30" fill="rgba(100,100,120,0.3)" />
          <rect x="90" y="120" width="20" height="25" fill="rgba(100,100,120,0.4)" rx="4" />
          <ellipse cx="100" cy="90" rx="35" ry="40" fill="rgba(100,100,120,0.5)" />
          {/* Question mark */}
          <text x="100" y="98" textAnchor="middle" fontSize="40" fill="rgba(150,150,170,0.5)" fontWeight="bold">?</text>
        </svg>
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 20px rgba(100,100,120,0.05), 0 0 10px rgba(100,100,120,0.03)',
            border: '1px solid rgba(100,100,120,0.2)',
            borderRadius: '8px',
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ width: '200px', height: '200px' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(circle, ${glowColor}11 0%, transparent 70%)`,
        }}
      />

      {/* Holo-shimmer sweep effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(0,255,238,0.12) 45%, rgba(0,255,238,0.04) 50%, transparent 55%)',
          animation: 'holo-shimmer 4s ease-in-out infinite',
          zIndex: 2,
        }}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ position: 'relative', zIndex: 1 }}>
        {/* Background circle */}
        <circle cx="100" cy="100" r="95" fill="none" stroke={`${accentColor}44`} strokeWidth="1" />
        <circle cx="100" cy="100" r="90" fill={`${bodyColor}22`} />

        {/* Body silhouette */}
        <ellipse cx="100" cy="160" rx={bodyRx} ry={bodyRy} fill={bodyColor} opacity="0.6" />
        {/* Neck */}
        <rect x="90" y="120" width="20" height="25" fill={bodyColor} opacity="0.7" rx="4" />
        {/* Head */}
        <ellipse cx="100" cy="90" rx={headRx} ry={headRy} fill={bodyColor} opacity="0.8" />
        {/* Eyes */}
        <ellipse cx="87" cy="85" rx="5" ry="3" fill={accentColor} opacity="0.9" />
        <ellipse cx="113" cy="85" rx="5" ry="3" fill={accentColor} opacity="0.9" />
        {/* Eye glow */}
        <ellipse cx="87" cy="85" rx="3" ry="2" fill={glowColor} opacity="0.6" />
        <ellipse cx="113" cy="85" rx="3" ry="2" fill={glowColor} opacity="0.6" />

        {/* Head accessory: glasses */}
        {accessory === 'glasses' && (
          <>
            <rect x="75" y="78" width="20" height="10" rx="3" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.7" />
            <rect x="105" y="78" width="20" height="10" rx="3" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.7" />
            <line x1="95" y1="83" x2="105" y2="83" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
            {/* Lens reflection */}
            <line x1="78" y1="80" x2="82" y2="80" stroke={`${glowColor}44`} strokeWidth="1" />
            <line x1="108" y1="80" x2="112" y2="80" stroke={`${glowColor}44`} strokeWidth="1" />
          </>
        )}

        {/* Head accessory: hat */}
        {accessory === 'hat' && (
          <>
            <ellipse cx="100" cy="55" rx="42" ry="8" fill={accentColor} opacity="0.6" />
            <rect x="80" y="35" width="40" height="20" rx="5" fill={accentColor} opacity="0.7" />
            {/* Hat band */}
            <rect x="80" y="50" width="40" height="4" rx="1" fill={`${glowColor}44`} />
          </>
        )}

        {/* Head accessory: scarf */}
        {accessory === 'scarf' && (
          <>
            <path d="M 75 115 Q 100 130 125 115" fill="none" stroke={accentColor} strokeWidth="6" opacity="0.7" />
            {/* Scarf tail */}
            <path d="M 120 118 Q 130 135 125 150" fill="none" stroke={accentColor} strokeWidth="4" opacity="0.5" />
          </>
        )}

        {/* Head accessory: earring */}
        {accessory === 'earring' && (
          <>
            <circle cx="65" cy="95" r="3" fill={accentColor} opacity="0.8" />
            <circle cx="65" cy="100" r="2" fill={glowColor} opacity="0.6" />
            {/* Earring chain */}
            <line x1="67" y1="90" x2="65" y2="93" stroke={accentColor} strokeWidth="1" opacity="0.6" />
          </>
        )}

        {/* Data stream lines (cyberpunk flavor) */}
        <line x1="30" y1="40" x2="55" y2="40" stroke={`${accentColor}33`} strokeWidth="0.5" />
        <line x1="35" y1="55" x2="60" y2="55" stroke={`${accentColor}22`} strokeWidth="0.5" />
        <line x1="140" y1="45" x2="170" y2="45" stroke={`${accentColor}33`} strokeWidth="0.5" />
        <line x1="145" y1="60" x2="165" y2="60" stroke={`${accentColor}22`} strokeWidth="0.5" />

        {/* Cyberpunk jawline / implant lines */}
        <line x1="68" y1="105" x2="80" y2="115" stroke={`${accentColor}22`} strokeWidth="0.5" />
        <line x1="132" y1="105" x2="120" y2="115" stroke={`${accentColor}22`} strokeWidth="0.5" />
      </svg>

      {/* Glow border */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}11, 0 0 10px ${glowColor}08`,
          border: `1px solid ${accentColor}33`,
          borderRadius: '8px',
          zIndex: 3,
        }}
      />
    </div>
  )
}

/* ─── Objective row ─── */
function ObjectiveRow({ objective }: { objective: QuestObjective }) {
  const icon = objective.type === 'npc_talked'
    ? '💬'
    : objective.type === 'location_visited'
      ? '📍'
      : objective.type === 'item_collected'
        ? '📦'
        : objective.type === 'poem_collected'
          ? '📜'
          : objective.type === 'flag_set'
            ? '⚡'
            : objective.type === 'minigame_completed'
              ? '🎮'
              : '○'

  return (
    <div className="flex items-start gap-2">
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-[12px] font-mono" style={{ color: '#99bbbb' }}>
        {objective.description}
      </span>
    </div>
  )
}

/* ─── Reward row ─── */
function RewardRow({ reward }: { reward: QuestDefinition['rewards'] extends (infer R)[] | undefined ? R : never }) {
  const icon = reward.type === 'addSkill'
    ? '🧠'
    : reward.type === 'addKarma'
      ? '⚖️'
      : reward.type === 'addXp'
        ? '✨'
        : reward.type === 'addCredits'
          ? '💰'
          : reward.type === 'addItem'
          ? '🎁'
          : reward.type === 'setFlag'
            ? '⚡'
            : '◆'

  const label = reward.type === 'addSkill'
    ? `${reward.skill} +${reward.value}`
    : reward.type === 'addKarma'
      ? `Карма +${reward.value}`
      : reward.type === 'addXp'
        ? `Опыт +${reward.value}`
        : reward.type === 'addCredits'
          ? `Кредиты +${reward.value}`
          : reward.type === 'addItem'
          ? `Предмет: ${reward.itemId}`
          : reward.type === 'setFlag'
            ? `Флаг: ${reward.flag}`
            : reward.type

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-[12px] font-mono" style={{ color: '#ddaa66' }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Corner brackets decorative element ─── */
function BracketCorners({ color, size }: { color: string; size: number }) {
  return (
    <>
      <div className="absolute pointer-events-none" style={{ top: 0, left: 0, width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute pointer-events-none" style={{ top: 0, right: 0, width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div className="absolute pointer-events-none" style={{ bottom: 0, left: 0, width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute pointer-events-none" style={{ bottom: 0, right: 0, width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  )
}
