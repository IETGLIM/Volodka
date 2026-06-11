
/* ─── Volodka RPG – StoryGuidanceHUD ─── */
/* Single compact objective strip below the compass — no duplicate quest HUD. */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { eventBus } from '@/engine/EventBus'
import { getCurrentGuidance, type GuidanceInfo } from '@/engine/GuidedStoryManager'
import { getNextTrackedObjective, areDependenciesMet, getQuestMarker } from '@/store/questStore'
import { useQuests, useGameMode, useCurrentSceneId } from '@/store/selectors'
import { useInteractionOverlay } from '@/store/selectors'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath'
import { getSceneConfig } from '@/config/scenes'
import { UI_LAYERS } from '@/shared/constants/uiLayers'
import {
  EXPLORATION_HUD_LAYOUT,
  explorationObjectiveTopPx,
} from '@/shared/constants/hudLayout'
import { isInteractionLocked } from '@/components/3d/InteractionSystemBridge'
import type { SceneId } from '@/shared/types/game'

const GUIDANCE_DISMISS_KEY = 'volodka_guidance_dismissed_sig'

export function StoryGuidanceHUD() {
  const [guidance, setGuidance] = useState<GuidanceInfo | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [dismissedSig, setDismissedSig] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(GUIDANCE_DISMISS_KEY)
    } catch {
      return null
    }
  })

  const quests = useQuests()
  const mode = useGameMode()
  const currentSceneId = useCurrentSceneId()
  const { showStoryOverlay } = useInteractionOverlay()
  const [interactionLocked, setInteractionLocked] = useState(() => isInteractionLocked())

  useEffect(() => {
    const sync = () => setInteractionLocked(isInteractionLocked())
    sync()
    const unsub = eventBus.on('interaction:state_change', sync)
    return unsub
  }, [])

  const currentObjective = useMemo(() => {
    const activeQuests = quests.filter((q) => q.status === 'active')
    for (const aq of activeQuests) {
      const obj = getNextTrackedObjective(aq.questId)
      if (obj) {
        const questDef = QUEST_DEFINITIONS.find((d) => d.id === aq.questId)
        const marker = getQuestMarker(aq.questId)
        let directionHint: string | null = null
        let targetSceneId: SceneId | null = null
        if (marker) {
          targetSceneId = marker.sceneId
          if (marker.sceneId === currentSceneId) {
            directionHint = 'Идите к цели'
          } else {
            const sceneConfig = getSceneConfig(marker.sceneId)
            directionHint = `Перейдите в: ${sceneConfig.name}`
          }
        }
        return {
          text: obj.description,
          questTitle: questDef?.title ?? '',
          questType: questDef?.questType ?? 'main',
          objectiveType: 'active_quest' as const,
          directionHint,
          targetSceneId,
        }
      }
    }

    for (const questId of GOLDEN_PATH_QUEST_SPINE) {
      const questState = quests.find((q) => q.questId === questId)
      if (questState?.status === 'completed') continue
      if (questState?.status === 'active') continue

      const questDef = QUEST_DEFINITIONS.find((d) => d.id === questId)
      if (!questDef) continue

      const deps = areDependenciesMet(questId)
      if (!deps.met) continue

      return {
        text: `Прими задание: ${questDef.title}`,
        questTitle: questDef.title,
        questType: questDef.questType,
        objectiveType: 'available_quest' as const,
        directionHint: null as string | null,
        targetSceneId: null as SceneId | null,
      }
    }

    return null
  }, [quests, currentSceneId])

  useEffect(() => {
    const initial = getCurrentGuidance()
    if (initial) setGuidance(initial)

    const unsub = eventBus.on('story:guidance_update', (payload) => {
      setGuidance(payload)
    })
    return unsub
  }, [])

  const displayText = currentObjective?.text ?? guidance?.objectiveText ?? ''
  const objectiveSig = displayText
    ? `${currentObjective?.questTitle ?? ''}|${displayText}`
    : ''

  useEffect(() => {
    if (!objectiveSig) return
    if (dismissedSig && dismissedSig !== objectiveSig) {
      setDismissedSig(null)
      try {
        sessionStorage.removeItem(GUIDANCE_DISMISS_KEY)
      } catch { /* ignore */ }
    }
  }, [objectiveSig, dismissedSig])

  const actNumber = guidance?.actNumber ?? 1
  const urgency = currentObjective
    ? (currentObjective.questType === 'main' ? 'required' : 'recommended')
    : (guidance?.urgency ?? 'recommended')

  const urgencyColor = urgency === 'required'
    ? '#00ffee'
    : urgency === 'recommended'
      ? '#66ffaa'
      : '#888888'

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!objectiveSig) return
    setDismissedSig(objectiveSig)
    setExpanded(false)
    try {
      sessionStorage.setItem(GUIDANCE_DISMISS_KEY, objectiveSig)
    } catch { /* ignore */ }
  }, [objectiveSig])

  const handleRestore = useCallback(() => {
    setDismissedSig(null)
    try {
      sessionStorage.removeItem(GUIDANCE_DISMISS_KEY)
    } catch { /* ignore */ }
  }, [])

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const shouldShow =
    mode === 'exploration'
    && !showStoryOverlay
    && !interactionLocked
    && Boolean(displayText)

  if (!shouldShow) return null

  const isDismissed = Boolean(dismissedSig && dismissedSig === objectiveSig)
  const topPx = explorationObjectiveTopPx()

  if (isDismissed) {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-full border"
        style={{
          top: topPx,
          zIndex: UI_LAYERS.HUD + 2,
          color: urgencyColor,
          borderColor: `${urgencyColor}44`,
          background: 'rgba(0, 8, 16, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleRestore}
        aria-label="Показать текущую цель"
      >
        ► Цель
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        data-exploration-ui
        style={{
          top: topPx,
          zIndex: UI_LAYERS.HUD + 2,
          maxWidth: EXPLORATION_HUD_LAYOUT.OBJECTIVE_MAX_WIDTH,
          width: 'min(92vw, 360px)',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={toggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleExpand()
            }
          }}
          className="relative rounded-md cursor-pointer"
          style={{
            background: 'rgba(0, 10, 18, 0.82)',
            border: `1px solid ${urgencyColor}33`,
            boxShadow: `0 0 10px ${urgencyColor}12`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-start gap-2 px-3 py-2 pr-9">
            <span
              className="text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ color: urgencyColor, textShadow: `0 0 6px ${urgencyColor}44` }}
              aria-hidden
            >
              ►
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[9px] font-mono tracking-wider font-semibold"
                  style={{ color: '#00ffeeaa' }}
                >
                  ЦЕЛЬ · АКТ {actNumber}
                </span>
              </div>
              <p
                className={`text-xs font-mono leading-snug ${expanded ? '' : 'line-clamp-1'}`}
                style={{ color: '#c8e8e8' }}
              >
                {displayText}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Скрыть подсказку цели"
          >
            <X className="size-3.5" />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t px-3 py-2"
                style={{ borderColor: `${urgencyColor}22` }}
              >
                {currentObjective?.directionHint && (
                  <p className="text-[10px] font-mono mb-1" style={{ color: '#66ccff' }}>
                    → {currentObjective.directionHint}
                  </p>
                )}
                {currentObjective?.questTitle && (
                  <p className="text-[10px] font-mono" style={{ color: '#889999' }}>
                    Задание: <span style={{ color: '#ffaa88' }}>{currentObjective.questTitle}</span>
                  </p>
                )}
                {guidance && (
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#668888' }}>
                    {guidance.chapterTitle}
                  </p>
                )}
                <p className="text-[9px] font-mono mt-1.5" style={{ color: `${urgencyColor}66` }}>
                  Q — журнал заданий
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
