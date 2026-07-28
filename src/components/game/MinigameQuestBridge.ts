
/* ─── Volodka RPG – Minigame Quest Bridge ───
 * Connects minigames to quests: maps quest IDs to the minigame
 * that must be completed to finish a quest objective.
 * Provides useMinigameForQuest() hook for automatic quest objective
 * completion when the associated minigame is beaten.
 */

import { useEffect, useCallback, useState } from 'react'
import { eventBus } from '@/engine/EventBus'
import { useGameStore } from '@/store/gameStore'
import { useQuests } from '@/store/selectors'
import type { MinigameType } from '@/shared/constants/minigames'
import { QUEST_MINIGAME_MAP, type QuestMinigameMapping } from '@/data/questMinigameMap'

export type { MinigameType } from '@/shared/constants/minigames'
export type { QuestMinigameMapping } from '@/data/questMinigameMap'
export { QUEST_MINIGAME_MAP } from '@/data/questMinigameMap'

/* ─── Quest-Minigame Mapping (re-exported from data layer) ─── */

/* ─── Reverse lookup: minigame type → quest mapping ─── */

const MINIGAME_TO_QUEST_MAP = new Map<MinigameType, QuestMinigameMapping[]>()
for (const mapping of Object.values(QUEST_MINIGAME_MAP)) {
  const existing = MINIGAME_TO_QUEST_MAP.get(mapping.minigameType) ?? []
  existing.push(mapping)
  MINIGAME_TO_QUEST_MAP.set(mapping.minigameType, existing)
}

/* ─── Helpers ─── */

/** Check if a quest has a minigame requirement */
export function questHasMinigame(questId: string): boolean {
  return questId in QUEST_MINIGAME_MAP
}

/** Get the minigame mapping for a quest */
export function getQuestMinigame(questId: string): QuestMinigameMapping | undefined {
  return QUEST_MINIGAME_MAP[questId]
}

/** Get all quests that require a specific minigame type */
export function getQuestsForMinigame(minigameType: MinigameType): QuestMinigameMapping[] {
  return MINIGAME_TO_QUEST_MAP.get(minigameType) ?? []
}

/** Check if a quest objective needs a minigame to complete */
export function objectiveNeedsMinigame(questId: string, objectiveId: string): boolean {
  const mapping = QUEST_MINIGAME_MAP[questId]
  return mapping?.objectiveId === objectiveId
}

/* ─── Hook Return Type ─── */

export interface MinigameForQuestResult {
  /** Whether the current active quest has a minigame requirement */
  hasMinigameRequirement: boolean
  /** The minigame mapping for the current quest, if any */
  currentMapping: QuestMinigameMapping | null
  /** Last minigame result text (success or failure) */
  lastResultText: string | null
  /** Whether the last minigame was successful */
  lastSuccess: boolean | null
  /** Launch the minigame for the current quest */
  launchMinigame: () => void
  /** Clear the last result */
  clearResult: () => void
}

/* ─── Hook: useMinigameForQuest ─── */

export function useMinigameForQuest(questId?: string): MinigameForQuestResult {
  const quests = useQuests()
  const completeQuestObjective = useGameStore((s) => s.completeQuestObjective)
  const pushNotification = useGameStore((s) => s.pushNotification)

  const [lastResultText, setLastResultText] = useState<string | null>(null)
  const [lastSuccess, setLastSuccess] = useState<boolean | null>(null)

  // Find the mapping for the given quest or any active quest
  const currentMapping = questId
    ? QUEST_MINIGAME_MAP[questId] ?? null
    : (() => {
        for (const q of quests) {
          if (q.status === 'active' && QUEST_MINIGAME_MAP[q.questId]) {
            // Check if the minigame objective is not yet completed
            const mapping = QUEST_MINIGAME_MAP[q.questId]
            if (mapping && !q.objectives[mapping.objectiveId]) {
              return mapping
            }
          }
        }
        return null
      })()

  const hasMinigameRequirement = currentMapping !== null

  // Listen for minigame completions and auto-complete quest objectives.
  // Do not apply payload.reward here — completeMinigame already applied once.
  useEffect(() => {
    const unsub = eventBus.on('minigame:complete', (payload) => {
      if (!currentMapping) return
      if (payload.gameType !== currentMapping.minigameType) return

      // Check that the quest is still active and objective incomplete
      const questState = quests.find((q) => q.questId === currentMapping.questId)
      if (!questState || questState.status !== 'active') return
      if (questState.objectives[currentMapping.objectiveId]) return // already complete

      if (payload.success) {
        // Auto-complete the quest objective
        completeQuestObjective(currentMapping.questId, currentMapping.objectiveId)
        setLastResultText(currentMapping.successText)
        setLastSuccess(true)
        pushNotification('quest', currentMapping.successText)
      } else {
        // Show failure toast, allow retry
        setLastResultText(currentMapping.failureText)
        setLastSuccess(false)
        pushNotification('stress', currentMapping.failureText)
      }
    })

    return unsub
  }, [currentMapping, quests, completeQuestObjective, pushNotification])

  const launchMinigame = useCallback(() => {
    if (!currentMapping) return
    eventBus.emit('minigame:open', { gameType: currentMapping.minigameType })
  }, [currentMapping])

  const clearResult = useCallback(() => {
    setLastResultText(null)
    setLastSuccess(null)
  }, [])

  return {
    hasMinigameRequirement,
    currentMapping,
    lastResultText,
    lastSuccess,
    launchMinigame,
    clearResult,
  }
}
