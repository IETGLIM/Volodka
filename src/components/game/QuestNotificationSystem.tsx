
/* ─── Volodka RPG – Quest Notification System ─── */
/* Comprehensive notification system for quest events.
   Handles: quest available, started, objective complete,
   quest complete, and quest failed notifications.
   Stack from bottom-right, max 3 visible, glass-morphism. */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { bottomQuestToastPx } from '@/shared/constants/hudLayout';
import { useMobileDetection } from './orchestrator/useMobileDetection';
import { eventBus } from '@/engine/EventBus'
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { useGamePhase } from '@/store/selectors'
import { useQuests } from '@/store/selectors'
import type { QuestState } from '@/shared/types/game'
import { formatQuestCompletionRewards } from '@/shared/utils/questRewards'

/* ─── Notification types ─── */

type QuestNotifType = 'available' | 'started' | 'objective' | 'complete' | 'failed'

interface QuestNotification {
  id: string
  type: QuestNotifType
  questId: string
  questTitle: string
  npcName?: string
  objectiveDescription?: string
  completedObjectives?: number
  totalObjectives?: number
  rewards?: string
  reason?: string
  canRetry?: boolean
  timestamp: number
}

/* ─── Style config per type ─── */

interface QuestNotifStyle {
  icon: string
  borderColor: string
  glowColor: string
  textColor: string
  iconBg: string
  label: string
}

const QUEST_NOTIF_STYLES: Record<QuestNotifType, QuestNotifStyle> = {
  available: {
    icon: '⚑',
    borderColor: '#ca8a04',
    glowColor: 'rgba(202, 138, 4, 0.4)',
    textColor: '#facc15',
    iconBg: 'rgba(202, 138, 4, 0.15)',
    label: 'Новый квест доступен!',
  },
  started: {
    icon: '▶',
    borderColor: '#0891b2',
    glowColor: 'rgba(8, 145, 178, 0.4)',
    textColor: 'var(--cyber-cyan)',
    iconBg: 'rgba(8, 145, 178, 0.15)',
    label: 'Квест начат',
  },
  objective: {
    icon: '✓',
    borderColor: '#16a34a',
    glowColor: 'rgba(22, 163, 74, 0.4)',
    textColor: '#4ade80',
    iconBg: 'rgba(22, 163, 74, 0.15)',
    label: 'Цель выполнена!',
  },
  complete: {
    icon: '★',
    borderColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    textColor: '#fbbf24',
    iconBg: 'rgba(217, 119, 6, 0.15)',
    label: 'Квест выполнен!',
  },
  failed: {
    icon: '✕',
    borderColor: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.4)',
    textColor: '#f87171',
    iconBg: 'rgba(220, 38, 38, 0.15)',
    label: 'Квест провален',
  },
}

/* ─── Auto-dismiss timings ─── */

const AUTO_DISMISS_MS: Record<QuestNotifType, number> = {
  available: 8000,
  started: 5000,
  objective: 4000,
  complete: 0, // stays until clicked
  failed: 0,   // stays until dismissed
}

const MAX_VISIBLE = 3

/* ─── Progress bar component ─── */

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(90deg, #4ade80, var(--cyber-cyan))' }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

/* ─── Animated checkmark ─── */

function AnimatedCheckmark() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
    >
      <motion.path
        d="M3 8.5L6.5 12L13 4"
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </motion.svg>
  )
}

/* ─── Retry button for failed quests ─── */

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="mt-2 px-3 py-1 text-xs font-semibold rounded
                 border border-red-500/40 text-red-400
                 bg-red-500/10 hover:bg-red-500/20
                 transition-colors duration-200"
    >
      Попробовать снова
    </motion.button>
  )
}

/* ─── Single notification card ─── */

interface QuestNotifCardProps {
  notif: QuestNotification
  onDismiss: (id: string) => void
  onQuestCompleteClick?: (questId: string) => void
}

function QuestNotifCard({ notif, onDismiss, onQuestCompleteClick }: QuestNotifCardProps) {
  const style = QUEST_NOTIF_STYLES[notif.type]
  const autoDismiss = AUTO_DISMISS_MS[notif.type]

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismiss === 0) return // stays until clicked
    const timer = setTimeout(() => onDismiss(notif.id), autoDismiss)
    return () => clearTimeout(timer)
  }, [notif.id, autoDismiss, onDismiss])

  // Visual flash on appear
  const [flashVisible, setFlashVisible] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setFlashVisible(false), 200)
    return () => clearTimeout(timer)
  }, [])

  const handleClick = useCallback(() => {
    if (notif.type === 'complete' && onQuestCompleteClick) {
      onQuestCompleteClick(notif.questId)
    }
    onDismiss(notif.id)
  }, [notif.id, notif.type, notif.questId, onDismiss, onQuestCompleteClick])

  return (
    <motion.div
      layout
      initial={{ x: 120, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 80, opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      onClick={handleClick}
      className="pointer-events-auto cursor-pointer w-full"
      style={{
        maxWidth: 340,
        background: 'rgba(10, 10, 20, 0.9)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderLeft: `3px solid ${style.borderColor}`,
        borderRadius: 10,
        boxShadow: `0 0 16px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.4)`,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 24px ${style.glowColor}, 0 2px 12px rgba(0,0,0,0.5)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 16px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.4)`
      }}
    >
      {/* Visual flash overlay */}
      <AnimatePresence>
        {flashVisible && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: style.glowColor }}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Top row: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            background: style.iconBg,
            color: style.textColor,
            fontSize: 14,
            flexShrink: 0,
            fontWeight: 700,
          }}
        >
          {notif.type === 'complete' ? <AnimatedCheckmark /> : style.icon}
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              color: style.textColor,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {style.label}
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {notif.questTitle}
          </span>
        </div>
      </div>

      {/* NPC name for available quests */}
      {notif.type === 'available' && notif.npcName && (
        <span
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            lineHeight: 1.3,
          }}
        >
          Подойти к <span style={{ color: style.textColor, fontWeight: 600 }}>{notif.npcName}</span> чтобы взять квест
        </span>
      )}

      {/* Objective description for started quests */}
      {notif.type === 'started' && notif.objectiveDescription && (
        <span
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            lineHeight: 1.3,
          }}
        >
          {notif.objectiveDescription}
        </span>
      )}

      {/* Progress for objective complete */}
      {notif.type === 'objective' && notif.completedObjectives !== undefined && notif.totalObjectives !== undefined && (
        <div>
          <span
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 11,
              lineHeight: 1.3,
            }}
          >
            {notif.objectiveDescription}
          </span>
          <ProgressBar completed={notif.completedObjectives} total={notif.totalObjectives} />
          <span
            style={{
              color: style.textColor,
              fontSize: 10,
              fontWeight: 600,
              marginTop: 2,
              display: 'block',
            }}
          >
            {notif.completedObjectives}/{notif.totalObjectives} целей
          </span>
        </div>
      )}

      {/* Rewards for complete quests */}
      {notif.type === 'complete' && (
        <span
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            lineHeight: 1.3,
          }}
        >
          Нажми чтобы увидеть награды
        </span>
      )}

      {/* Failure reason for failed quests */}
      {notif.type === 'failed' && (
        <div>
          {notif.reason && (
            <span
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 11,
                lineHeight: 1.3,
              }}
            >
              {notif.reason}
            </span>
          )}
          {notif.canRetry && <RetryButton onClick={() => onDismiss(notif.id)} />}
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT: QuestNotificationSystem
   ═══════════════════════════════════════════════════════════ */

export function QuestNotificationSystem() {
  const [notifications, setNotifications] = useState<QuestNotification[]>([])
  const shownIds = useRef(new Set<string>())
  const notifCounter = useRef(0)
  const isMobile = useMobileDetection();
  // High-priority slot claim — story/quest cards preempt loot/crafting/etc.
  const slotGranted = useNotificationSlot('quest', NOTIFY_PRIORITY.quest, notifications.length > 0);

  /* ── Dismiss handler ── */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  /* ── Add notification (deduped) ── */
  const addNotification = useCallback((notif: Omit<QuestNotification, 'id' | 'timestamp'>) => {
    const dedupeKey = `${notif.type}-${notif.questId}`
    if (shownIds.current.has(dedupeKey)) return
    shownIds.current.add(dedupeKey)

    const id = `quest-notif-${notifCounter.current++}`
    const fullNotif: QuestNotification = {
      ...notif,
      id,
      timestamp: Date.now(),
    }

    setNotifications((prev) => {
      const updated = [...prev, fullNotif]
      return updated.slice(-MAX_VISIBLE)
    })
  }, [])

  /* ── Quest complete click → reward dialog ── */
  const handleQuestCompleteClick = useCallback((questId: string) => {
    const def = QUEST_DEFINITIONS.find((d) => d.id === questId);
    eventBus.emit('quest:completed', { questId, npcId: def?.questGiverNpcId });
  }, []);

  /* ── Watch gameStore quest state changes ── */
  const quests = useQuests()
  const prevQuestsRef = useRef<QuestState[]>([])

  useEffect(() => {
    const prevQuests = prevQuestsRef.current
    const prevMap = new Map(prevQuests.map((q) => [q.questId, q]))

    for (const quest of quests) {
      const prev = prevMap.get(quest.questId)
      const def = QUEST_DEFINITIONS.find((d) => d.id === quest.questId)

      if (!def) continue

      // New quest activated (was inactive, now active)
      if ((!prev || prev.status === 'inactive') && quest.status === 'active') {
        // Check if this is a quest becoming "available" or "started"
        const firstObj = def.objectives[0]
        addNotification({
          type: 'started',
          questId: quest.questId,
          questTitle: def.title,
          objectiveDescription: firstObj?.description,
        })
      }

      // Objective completed
      if (prev && prev.status === 'active' && quest.status === 'active') {
        for (const [objId, completed] of Object.entries(quest.objectives)) {
          const prevCompleted = prev.objectives[objId]
          if (completed && !prevCompleted) {
            const objDef = def.objectives.find((o) => o.id === objId)
            const completedCount = Object.values(quest.objectives).filter(Boolean).length
            const totalCount = def.objectives.length

            addNotification({
              type: 'objective',
              questId: quest.questId,
              questTitle: def.title,
              objectiveDescription: objDef?.description,
              completedObjectives: completedCount,
              totalObjectives: totalCount,
            })
          }
        }
      }

      // Quest completed
      if (prev && prev.status === 'active' && quest.status === 'completed') {
        addNotification({
          type: 'complete',
          questId: quest.questId,
          questTitle: def.title,
          rewards: formatQuestCompletionRewards(def),
        })
      }

      // Quest failed
      if (prev && prev.status === 'active' && quest.status === 'failed') {
        addNotification({
          type: 'failed',
          questId: quest.questId,
          questTitle: def.title,
          reason: 'Время истекло',
          canRetry: def.canRetry,
        })
      }
    }

    prevQuestsRef.current = quests
  }, [quests, addNotification])

  /* ── Listen to EventBus quest events ── */
  useEffect(() => {
    const unsubs: (() => void)[] = []

    // quest:accepted — covered by store watcher (inactive → active, type 'started')

    // Quest objective updated
    unsubs.push(
      eventBus.on('quest:objective_updated', ({ questId, objectiveId }) => {
        const def = QUEST_DEFINITIONS.find((d) => d.id === questId)
        const questState = quests.find((q) => q.questId === questId)
        if (!def || !questState) return

        const objDef = def.objectives.find((o) => o.id === objectiveId)
        const completedCount = Object.values(questState.objectives).filter(Boolean).length
        const totalCount = def.objectives.length

        addNotification({
          type: 'objective',
          questId,
          questTitle: def.title,
          objectiveDescription: objDef?.description,
          completedObjectives: completedCount,
          totalObjectives: totalCount,
        })
      }),
    )

    // quest:completed toast — covered by store watcher (active → completed)

    // Quest failed event
    unsubs.push(
      eventBus.on('quest:failed', ({ questId, reason }) => {
        const def = QUEST_DEFINITIONS.find((d) => d.id === questId)
        if (!def) return

        addNotification({
          type: 'failed',
          questId,
          questTitle: def.title,
          reason,
          canRetry: def.canRetry,
        })
      }),
    )

    return () => unsubs.forEach((u) => u())
  }, [quests, addNotification])

  /* ── Clean up dedupe set periodically ── */
  useEffect(() => {
    const interval = setInterval(() => {
      if (shownIds.current.size > 30) {
        const entries = Array.from(shownIds.current)
        shownIds.current = new Set(entries.slice(-15))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  /* ── Only show in gameplay modes ── */
  const mode = useGamePhase()
  if (mode === 'menu' || mode === 'intro') return null
  if (!slotGranted) return null

  const visibleNotifs = notifications.slice(-MAX_VISIBLE)
  const latestNotif = visibleNotifs[visibleNotifs.length - 1]
  const latestNotifMessage = latestNotif
    ? `${QUEST_NOTIF_STYLES[latestNotif.type].label}: ${latestNotif.questTitle}${latestNotif.objectiveDescription ? `. ${latestNotif.objectiveDescription}` : ''}`
    : ''

  return (
    <div
      className="fixed right-3 sm:right-4 flex flex-col-reverse items-end gap-2 pointer-events-none"
      data-exploration-ui
      style={{ bottom: bottomQuestToastPx(isMobile), zIndex: UI_LAYERS.TOASTS, pointerEvents: 'none' }}
    >
      <AriaLiveRegion message={latestNotifMessage} priority="polite" />
      <AnimatePresence mode="popLayout">
        {visibleNotifs.map((notif) => (
          <QuestNotifCard
            key={notif.id}
            notif={notif}
            onDismiss={dismissNotification}
            onQuestCompleteClick={handleQuestCompleteClick}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
