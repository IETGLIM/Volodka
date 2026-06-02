'use client'

/* ─── Volodka RPG – StoryGuidanceHUD ─── */
/* Persistent HUD element that shows the player what to do next.
 * Top-center of screen, cyberpunk-styled with neon cyan text,
 * scanlines backdrop, matrix-green accents, and pulse animation. */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { eventBus } from '@/engine/EventBus'
import { getCurrentGuidance, type GuidanceInfo } from '@/engine/GuidedStoryManager'

export function StoryGuidanceHUD() {
  const [guidance, setGuidance] = useState<GuidanceInfo | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  // Listen for guidance updates
  useEffect(() => {
    // Get initial guidance
    const initial = getCurrentGuidance()
    if (initial) {
      setGuidance(initial)
      setVisible(true)
    }

    const unsub = eventBus.on('story:guidance_update', (payload) => {
      setGuidance(payload)
      setVisible(true)
    })

    return unsub
  }, [])

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  if (!guidance || !visible) return null

  const urgencyColor = guidance.urgency === 'required'
    ? '#00ffee'
    : guidance.urgency === 'recommended'
      ? '#66ffaa'
      : '#888888'

  const urgencyLabel = guidance.urgency === 'required'
    ? 'ОБЯЗАТЕЛЬНО'
    : guidance.urgency === 'recommended'
      ? 'РЕКОМЕНДОВАНО'
      : 'ОПЦИОНАЛЬНО'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        style={{ maxWidth: '400px', width: '90vw' }}
      >
        {/* Scanlines backdrop */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,238,0.03) 2px, rgba(0,255,238,0.03) 4px)',
            zIndex: 0,
          }}
        />

        {/* Main container */}
        <motion.div
          onClick={toggleExpand}
          className="relative cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(0,8,16,0.92), rgba(0,20,30,0.88))',
            border: `1px solid ${urgencyColor}44`,
            borderRadius: '8px',
            padding: '8px 14px',
            boxShadow: `0 0 15px ${urgencyColor}22, 0 0 4px ${urgencyColor}11, inset 0 0 8px rgba(0,255,238,0.05)`,
          }}
          whileHover={{
            boxShadow: `0 0 20px ${urgencyColor}33, 0 0 8px ${urgencyColor}22, inset 0 0 12px rgba(0,255,238,0.08)`,
          }}
        >
          {/* Corner brackets */}
          <div
            className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
            style={{
              borderTop: `2px solid ${urgencyColor}88`,
              borderLeft: `2px solid ${urgencyColor}88`,
              borderRadius: '2px 0 0 0',
            }}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 pointer-events-none"
            style={{
              borderTop: `2px solid ${urgencyColor}88`,
              borderRight: `2px solid ${urgencyColor}88`,
              borderRadius: '0 2px 0 0',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none"
            style={{
              borderBottom: `2px solid ${urgencyColor}88`,
              borderLeft: `2px solid ${urgencyColor}88`,
              borderRadius: '0 0 0 2px',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none"
            style={{
              borderBottom: `2px solid ${urgencyColor}88`,
              borderRight: `2px solid ${urgencyColor}88`,
              borderRadius: '0 0 2px 0',
            }}
          />

          {/* Header line */}
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* Act indicator */}
            <span
              className="text-[10px] font-mono tracking-wider"
              style={{
                color: '#00ff6688',
                textShadow: '0 0 4px rgba(0,255,102,0.3)',
              }}
            >
              АКТ {guidance.actNumber}
            </span>

            {/* Urgency badge */}
            <span
              className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: urgencyColor,
                background: `${urgencyColor}11`,
                border: `1px solid ${urgencyColor}33`,
                textShadow: `0 0 4px ${urgencyColor}44`,
              }}
            >
              {urgencyLabel}
            </span>
          </div>

          {/* Objective text with pulse */}
          <motion.div
            key={guidance.objectiveText}
            initial={{ opacity: 0.5, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            {/* Arrow indicator */}
            <motion.span
              className="text-sm font-bold flex-shrink-0"
              style={{
                color: urgencyColor,
                textShadow: `0 0 8px ${urgencyColor}66`,
              }}
              animate={{
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              ►
            </motion.span>

            <span
              className="text-sm font-mono leading-snug"
              style={{
                color: '#c0f0f0',
                textShadow: '0 0 6px rgba(0,255,238,0.2)',
              }}
            >
              {guidance.objectiveText}
            </span>
          </motion.div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${urgencyColor}22` }}>
                  <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: '#88aaaa' }}>
                    <span>Тип:</span>
                    <span style={{ color: urgencyColor }}>
                      {objectiveTypeLabel(guidance.objectiveType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono mt-1" style={{ color: '#88aaaa' }}>
                    <span>Глава:</span>
                    <span style={{ color: '#00ff66' }}>{guidance.chapterTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono mt-1" style={{ color: '#88aaaa' }}>
                    <span>Цель:</span>
                    <span style={{ color: '#66ccff' }}>{guidance.targetId}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand hint */}
          <div className="text-center mt-1">
            <span className="text-[9px] font-mono" style={{ color: `${urgencyColor}44` }}>
              {expanded ? '▼ свернуть' : '▼ подробнее'}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function objectiveTypeLabel(type: GuidanceInfo['objectiveType']): string {
  switch (type) {
    case 'talk_to_npc': return 'Разговор с NPC'
    case 'visit_location': return 'Посещение локации'
    case 'complete_quest': return 'Выполнение задания'
    case 'collect_item': return 'Сбор предметов'
    case 'make_choice': return 'Выбор решения'
    default: return type
  }
}
