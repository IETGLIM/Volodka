/* ─── Volodka RPG – GuidedStoryManager ─── */
/* Enforces linear story progression through the golden path.
 * Tracks which step the player is on, auto-advances on node visits
 * and quest completions, and emits events for UI guidance. */

import {
  GOLDEN_PATH_STORY_SPINE,
  GOLDEN_PATH_QUEST_SPINE,
  GOLDEN_PATH_BRANCH_HINTS,
  ACT_TRANSITIONS,
  ACT_CHAPTER_TITLES,
  STORY_NODE_TO_SCENE_LABEL,
  STORY_NODE_OBJECTIVE_TYPE,
  STORY_FLAG_TO_NODE_ID,
  getNpcIdForStoryNode,
} from '@/data/goldenPath'
import { getStoryNodes, getQuestDefinitions, findNpcById } from '@/data/gameDataLoader'
import { eventBus } from '@/engine/EventBus'
import {
  dispatchGameAction,
  getGameSnapshot,
  subscribeGameSnapshot,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher'
import { areDependenciesMet } from '@/store/questStore'
import type { QuestDefinition, QuestObjective } from '@/shared/types/game'
import { getQuotesByAct } from '@/data/matrixQuotes'

/* ─── Story node parent map (for quest-node fallback matching) ─── */
let storyNodeParentsCache: Map<string, string[]> | null = null

function getStoryNodeParents(): Map<string, string[]> {
  if (storyNodeParentsCache) return storyNodeParentsCache
  const parents = new Map<string, string[]>()
  for (const [nodeId, node] of Object.entries(getStoryNodes())) {
    for (const choice of node.choices ?? []) {
      if (!choice.next) continue
      const list = parents.get(choice.next) ?? []
      if (!list.includes(nodeId)) list.push(nodeId)
      parents.set(choice.next, list)
    }
  }
  storyNodeParentsCache = parents
  return parents
}

/** Slice of store state that GuidedStoryManager reacts to for node visits. */
function selectLastVisitedNode(snapshot: GameStoreSnapshot): string | null {
  const nodes = snapshot.playerState.visitedNodes
  return nodes.length > 0 ? nodes[nodes.length - 1] : null
}

/** Active TTL flag keys that can advance the golden-path story spine. */
function selectStoryRelevantTTLFlagKeys(snapshot: GameStoreSnapshot): string[] {
  return snapshot.activeTTLFlags
    .map((flag) => flag.key)
    .filter((key) => key in STORY_FLAG_TO_NODE_ID)
    .sort()
}

function stringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/* ─── Guidance info type ─── */
export interface GuidanceInfo {
  objectiveText: string
  objectiveType: 'talk_to_npc' | 'visit_location' | 'complete_quest' | 'collect_item' | 'make_choice'
  targetId: string
  urgency: 'optional' | 'recommended' | 'required'
  actNumber: number
  chapterTitle: string
}

/* ─── Get act number from story node position ─── */
function getActForNode(nodeId: string): number {
  const direct = ACT_TRANSITIONS.find((t) => t.entryNodeId === nodeId)
  if (direct) return direct.act

  const spineIdx = GOLDEN_PATH_STORY_SPINE.indexOf(nodeId)
  if (spineIdx < 0) return 1

  for (let i = ACT_TRANSITIONS.length - 1; i >= 0; i--) {
    const transIdx = GOLDEN_PATH_STORY_SPINE.indexOf(ACT_TRANSITIONS[i].entryNodeId)
    if (transIdx >= 0 && spineIdx >= transIdx) return ACT_TRANSITIONS[i].act
  }
  return 1
}

function getActTransition(act: number) {
  return ACT_TRANSITIONS.find((t) => t.act === act)
}

function getAncestorNodeIds(nodeId: string, maxDepth = 8): string[] {
  const ancestors: string[] = []
  const queue = [nodeId]
  const seen = new Set<string>()
  let depth = 0

  while (queue.length > 0 && depth < maxDepth) {
    const current = queue.shift()!
    const parents = getStoryNodeParents().get(current) ?? []
    for (const parent of parents) {
      if (seen.has(parent)) continue
      seen.add(parent)
      ancestors.push(parent)
      queue.push(parent)
    }
    depth++
  }

  return ancestors
}

function questMatchesNode(def: QuestDefinition, nodeId: string): boolean {
  if (def.linkedStoryNodeId === nodeId) return true
  return def.linkedStoryNodeIds?.includes(nodeId) ?? false
}

/* ─── Get act for a quest ─── */
function getActForQuest(questId: string): number {
  const def = getQuestDefinitions().find((d) => d.id === questId)
  return def?.act ?? 1
}

/* ─── Story graph: nodes reachable via choice.next from a hub/branch ─── */
const storyDescendantCache = new Map<string, Set<string>>()

function getStoryDescendants(nodeId: string): Set<string> {
  const cached = storyDescendantCache.get(nodeId)
  if (cached) return cached

  const descendants = new Set<string>()
  const queue = [nodeId]
  const visited = new Set<string>()

  while (queue.length > 0 && visited.size < 64) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    const node = getStoryNodes()[current]
    if (!node?.choices) continue

    for (const choice of node.choices) {
      const next = choice.next
      if (!next || next === nodeId || descendants.has(next)) continue
      descendants.add(next)
      queue.push(next)
    }
  }

  storyDescendantCache.set(nodeId, descendants)
  return descendants
}

function questLinkedNodes(def: QuestDefinition): string[] {
  const nodes: string[] = []
  if (def.linkedStoryNodeId) nodes.push(def.linkedStoryNodeId)
  if (def.linkedStoryNodeIds) nodes.push(...def.linkedStoryNodeIds)
  return nodes
}

function questLinkedOnSpine(def: QuestDefinition, spineIdx: number): boolean {
  return questLinkedNodes(def).some((linkedId) => {
    const linkedIdx = GOLDEN_PATH_STORY_SPINE.indexOf(linkedId)
    return linkedIdx >= spineIdx
  })
}

/* ─── Build guidance from a quest objective ─── */
function buildGuidanceFromObjective(
  obj: QuestObjective,
  questDef: QuestDefinition,
  act: number,
): GuidanceInfo {
  let objectiveType: GuidanceInfo['objectiveType'] = 'complete_quest'
  let targetId = obj.target ?? obj.id
  let objectiveText = obj.description

  switch (obj.type) {
    case 'npc_talked': {
      objectiveType = 'talk_to_npc'
      const npc = obj.target ? findNpcById(obj.target) : undefined
      if (npc) {
        objectiveText = `Поговори с ${npc.name}`
      }
      break
    }
    case 'location_visited':
      objectiveType = 'visit_location'
      break
    case 'item_collected':
      objectiveType = 'collect_item'
      break
    case 'poem_collected':
      objectiveType = 'collect_item'
      break
    case 'flag_set':
      objectiveType = 'complete_quest'
      break
    default:
      objectiveType = 'complete_quest'
  }

  return {
    objectiveText,
    objectiveType,
    targetId,
    urgency: questDef.questType === 'main' ? 'required' : 'recommended',
    actNumber: act,
    chapterTitle: ACT_CHAPTER_TITLES[act] ?? `Акт ${act}`,
  }
}

/* ─── Convert node ID to readable Russian text ─── */
function nodeToReadableText(nodeId: string): string {
  const hint = GOLDEN_PATH_BRANCH_HINTS[nodeId]
  if (hint) return hint

  const mappedNpcId = getNpcIdForStoryNode(nodeId)
  if (mappedNpcId) {
    const npc = findNpcById(mappedNpcId)
    if (npc) return `Найди ${npc.name}`
  }

  const sceneLabel = STORY_NODE_TO_SCENE_LABEL[nodeId]
  if (sceneLabel) return `Отправляйся в ${sceneLabel}`

  return `Продолжай путь: ${nodeId.replace(/_/g, ' ')}`
}

/* ─── Infer objective type from explicit node mapping ─── */
function inferObjectiveType(nodeId: string): GuidanceInfo['objectiveType'] {
  if (getNpcIdForStoryNode(nodeId)) return 'talk_to_npc'
  return STORY_NODE_OBJECTIVE_TYPE[nodeId] ?? 'complete_quest'
}

function findNpcForQuest(questDef: QuestDefinition): string | undefined {
  if (questDef.questGiverNpcId) return questDef.questGiverNpcId
  const npcObj = questDef.objectives.find((o) => o.type === 'npc_talked')
  return npcObj?.target
}

/* ─── GuidedStoryManager (instance state, testable / resettable) ─── */
export class GuidedStoryManager {
  private currentStepIndex = 0
  private currentQuestSpineIndex = 0
  private initialized = false
  // Guard against double advanceAct() — both advanceStorySpine and
  // advanceQuestSpine can trigger act transitions independently.
  private lastAdvancedToAct = 0
  private unsubVisitNode: (() => void) | null = null
  private unsubQuestCompleted: (() => void) | null = null
  private unsubNpcTalked: (() => void) | null = null
  private unsubSceneEnter: (() => void) | null = null
  private unsubFlagSet: (() => void) | null = null
  private unsubGameLoaded: (() => void) | null = null

  /* ─── Derive objective from current golden path step ─── */
  private deriveObjectiveFromStep(stepIndex: number): GuidanceInfo | null {
    if (stepIndex >= GOLDEN_PATH_STORY_SPINE.length) return null

    const nodeId = GOLDEN_PATH_STORY_SPINE[stepIndex]
    const act = getActForNode(nodeId)
    const hint = GOLDEN_PATH_BRANCH_HINTS[nodeId]

    const questDef = this.findQuestForNode(nodeId)
    if (questDef) {
      const store = getGameSnapshot()
      const questState = store.quests.find((q) => q.questId === questDef.id)

      if (questState?.status === 'active') {
        const nextObj = questDef.objectives.find((o) => !questState.objectives[o.id])
        if (nextObj) {
          return buildGuidanceFromObjective(nextObj, questDef, act)
        }
      }

      return {
        objectiveText: hint ?? `Прими задание: ${questDef.title}`,
        objectiveType: 'complete_quest',
        targetId: questDef.id,
        urgency: questDef.questType === 'main' ? 'required' : 'recommended',
        actNumber: act,
        chapterTitle: ACT_CHAPTER_TITLES[act] ?? `Акт ${act}`,
      }
    }

    const objectiveText = hint ?? nodeToReadableText(nodeId)
    const objectiveType = inferObjectiveType(nodeId)

    return {
      objectiveText,
      objectiveType,
      targetId: nodeId,
      urgency: 'recommended',
      actNumber: act,
      chapterTitle: ACT_CHAPTER_TITLES[act] ?? `Акт ${act}`,
    }
  }

  private pickQuestFromSpine(candidates: QuestDefinition[]): QuestDefinition | null {
    const store = getGameSnapshot()

    for (let i = this.currentQuestSpineIndex; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
      const questId = GOLDEN_PATH_QUEST_SPINE[i]
      const def = candidates.find((d) => d.id === questId)
      if (!def) continue

      const questState = store.quests.find((q) => q.questId === def.id)
      if (questState?.status === 'completed') continue
      return def
    }

    return null
  }

  /* ─── Find quest linked to a story node ─── */
  private findQuestForNode(nodeId: string): QuestDefinition | null {
    const spineIdx = GOLDEN_PATH_STORY_SPINE.indexOf(nodeId)

    const exactMatches = getQuestDefinitions().filter((d) => questMatchesNode(d, nodeId))
    if (exactMatches.length > 0) {
      return this.pickQuestFromSpine(exactMatches) ?? exactMatches[0]
    }

    const ancestors = getAncestorNodeIds(nodeId)
    const ancestorMatches = getQuestDefinitions().filter(
      (d) => GOLDEN_PATH_QUEST_SPINE.includes(d.id) && ancestors.some((a) => questMatchesNode(d, a)),
    )
    if (ancestorMatches.length > 0) {
      return this.pickQuestFromSpine(ancestorMatches) ?? ancestorMatches[0]
    }

    if (spineIdx < 0) return null

    const descendants = getStoryDescendants(nodeId)

    const graphMatches: QuestDefinition[] = []
    for (let i = this.currentQuestSpineIndex; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
      const questId = GOLDEN_PATH_QUEST_SPINE[i]
      const def = getQuestDefinitions().find((d) => d.id === questId)
      if (!def || questLinkedNodes(def).length === 0) continue

      const questState = getGameSnapshot().quests.find((q) => q.questId === def.id)
      if (questState?.status === 'completed') continue

      if (questLinkedNodes(def).some((linkedId) => descendants.has(linkedId))) {
        graphMatches.push(def)
        break
      }
    }
    if (graphMatches.length > 0) {
      return graphMatches[0]
    }

    for (let i = this.currentQuestSpineIndex; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
      const questId = GOLDEN_PATH_QUEST_SPINE[i]
      const def = getQuestDefinitions().find((d) => d.id === questId)
      if (!def || questLinkedNodes(def).length === 0) continue

      const questState = getGameSnapshot().quests.find((q) => q.questId === def.id)
      if (questState?.status === 'completed') continue

      if (questLinkedOnSpine(def, spineIdx)) return def

      const hasOffSpineLink = questLinkedNodes(def).every(
        (linkedId) => GOLDEN_PATH_STORY_SPINE.indexOf(linkedId) < 0,
      )
      if (hasOffSpineLink && i === this.currentQuestSpineIndex) return def
    }

    return null
  }

  getCurrentGuidance(): GuidanceInfo | null {
    const store = getGameSnapshot()

    for (let i = 0; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
      const questId = GOLDEN_PATH_QUEST_SPINE[i]
      const questState = store.quests.find((q) => q.questId === questId)

      if (questState?.status === 'active') {
        const questDef = getQuestDefinitions().find((d) => d.id === questId)
        if (!questDef) continue

        const nextObj = questDef.objectives.find((o) => !questState.objectives[o.id])
        if (nextObj) {
          const act = questDef.act ?? getActForQuest(questId)
          return buildGuidanceFromObjective(nextObj, questDef, act)
        }
      }
    }

    return this.deriveObjectiveFromStep(this.currentStepIndex)
  }

  private getNextQuestInSpine(): { questId: string; def: QuestDefinition } | null {
    const store = getGameSnapshot()

    for (let i = this.currentQuestSpineIndex; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
      const questId = GOLDEN_PATH_QUEST_SPINE[i]
      const questState = store.quests.find((q) => q.questId === questId)

      if (questState?.status === 'completed' || questState?.status === 'active') {
        this.currentQuestSpineIndex = i + 1
        continue
      }

      const def = getQuestDefinitions().find((d) => d.id === questId)
      if (!def) continue

      const deps = areDependenciesMet(questId)
      if (!deps.met) continue

      if (def.requiredFlag && !store.playerState.flags[def.requiredFlag]) continue

      const questAct = def.act ?? 1
      if (questAct > store.playerState.progression.currentAct) continue

      return { questId, def }
    }

    return null
  }

  private advanceStorySpine(visitedNodeId: string) {
    const nodeIndex = GOLDEN_PATH_STORY_SPINE.indexOf(visitedNodeId)
    if (nodeIndex < 0) return
    if (nodeIndex < this.currentStepIndex) return

    const prevStep = this.currentStepIndex
    this.currentStepIndex = nodeIndex + 1

    const prevAct = getActForNode(GOLDEN_PATH_STORY_SPINE[prevStep])
    const newAct = this.currentStepIndex < GOLDEN_PATH_STORY_SPINE.length
      ? getActForNode(GOLDEN_PATH_STORY_SPINE[this.currentStepIndex])
      : prevAct

    if (newAct > prevAct) {
      if (newAct > this.lastAdvancedToAct) {
        this.lastAdvancedToAct = newAct
        dispatchGameAction({ type: 'story/advanceAct' })

        eventBus.emit('story:act_transition', {
          fromAct: prevAct,
          toAct: newAct,
          chapterTitle: ACT_CHAPTER_TITLES[newAct] ?? `Акт ${newAct}`,
        })
      }
    }

    this.emitGuidanceUpdate()
  }

  private advanceQuestSpine(completedQuestId: string) {
    const spineIdx = GOLDEN_PATH_QUEST_SPINE.indexOf(completedQuestId)
    if (spineIdx >= 0 && spineIdx >= this.currentQuestSpineIndex) {
      this.currentQuestSpineIndex = spineIdx + 1
    }

    const store = getGameSnapshot()
    const currentAct = store.playerState.progression.currentAct

    const actTransition = getActTransition(currentAct)
    const actQuests = actTransition?.questSpineIds ?? []

    const allActQuestsComplete = actQuests.length > 0 && actQuests.every((qId) => {
      const qs = store.quests.find((q) => q.questId === qId)
      return qs?.status === 'completed'
    })

    const questAdvanceAllowed = actTransition?.advanceTrigger !== 'story_node'

    if (allActQuestsComplete && questAdvanceAllowed && currentAct < ACT_TRANSITIONS.length) {
      const nextAct = currentAct + 1
      if (nextAct > this.lastAdvancedToAct) {
        this.lastAdvancedToAct = nextAct
        dispatchGameAction({ type: 'story/advanceAct' })
        eventBus.emit('story:act_transition', {
          fromAct: currentAct,
          toAct: nextAct,
          chapterTitle: ACT_CHAPTER_TITLES[nextAct] ?? `Акт ${nextAct}`,
        })
      }
    }

    const nextQuest = this.getNextQuestInSpine()
    if (nextQuest) {
      eventBus.emit('story:quest_available', {
        questId: nextQuest.questId,
        questTitle: nextQuest.def.title,
        questType: nextQuest.def.questType,
        npcId: findNpcForQuest(nextQuest.def),
      })

      const isDirectChainSuccessor = spineIdx >= 0 && spineIdx < GOLDEN_PATH_QUEST_SPINE.length - 1
      if (isDirectChainSuccessor) {
        const prevQuestDef = getQuestDefinitions().find((d) => d.id === completedQuestId)
        const npcId = nextQuest.def.questGiverNpcId ?? findNpcForQuest(nextQuest.def)
        eventBus.emit('story:quest_chain_unlock', {
          completedQuestId,
          completedQuestTitle: prevQuestDef?.title ?? completedQuestId,
          nextQuestId: nextQuest.questId,
          nextQuestTitle: nextQuest.def.title,
          nextQuestType: nextQuest.def.questType,
          npcId,
          actNumber: nextQuest.def.act ?? currentAct,
        })
      }
    }

    this.emitGuidanceUpdate()
  }

  private emitGuidanceUpdate() {
    const guidance = this.getCurrentGuidance()
    if (guidance) {
      eventBus.emit('story:guidance_update', guidance)
    }
  }

  private autoStartFirstQuest() {
    const store = getGameSnapshot()
    const firstQuestId = GOLDEN_PATH_QUEST_SPINE[0]
    if (!firstQuestId) return

    const existing = store.quests.find((q) => q.questId === firstQuestId)
    if (existing && existing.status !== 'inactive' && existing.status !== 'failed') return

    const def = getQuestDefinitions().find((d) => d.id === firstQuestId)
    if (!def) return

    dispatchGameAction({ type: 'quest/activate', questId: firstQuestId })
    this.currentQuestSpineIndex = 0

    eventBus.emit('story:quest_available', {
      questId: firstQuestId,
      questTitle: def.title,
      questType: def.questType,
      npcId: findNpcForQuest(def),
    })
  }

  canStartQuest(questId: string): boolean {
    const store = getGameSnapshot()

    const existing = store.quests.find((q) => q.questId === questId)
    if (existing && existing.status !== 'inactive') return false

    const def = getQuestDefinitions().find((d) => d.id === questId)
    if (!def) return false

    if (def.requiresQuests) {
      for (const reqId of def.requiresQuests) {
        const reqQuest = store.quests.find((q) => q.questId === reqId)
        if (!reqQuest || reqQuest.status !== 'completed') return false
      }
    }

    if (def.requiredFlag && !store.playerState.flags[def.requiredFlag]) return false

    const questAct = def.act ?? 1
    if (questAct > store.playerState.progression.currentAct) return false

    return true
  }

  /** Sync spine indices from the current game store snapshot. */
  private syncFromStore() {
    const store = getGameSnapshot()
    const visitedNodes = store.playerState.visitedNodes

    this.lastAdvancedToAct = store.playerState.progression.currentAct

    this.currentStepIndex = 0
    for (let i = GOLDEN_PATH_STORY_SPINE.length - 1; i >= 0; i--) {
      if (visitedNodes.includes(GOLDEN_PATH_STORY_SPINE[i])) {
        this.currentStepIndex = i + 1
        break
      }
    }

    this.currentQuestSpineIndex = 0
    for (let i = 0; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
      const questId = GOLDEN_PATH_QUEST_SPINE[i]
      const questState = store.quests.find((q) => q.questId === questId)
      if (questState?.status === 'completed') {
        this.currentQuestSpineIndex = i + 1
      } else if (questState?.status === 'active') {
        this.currentQuestSpineIndex = i
        break
      } else {
        break
      }
    }
  }

  /** Reset session state and re-sync from store (keeps subscriptions if running). */
  resetState() {
    this.currentStepIndex = 0
    this.currentQuestSpineIndex = 0
    this.lastAdvancedToAct = 0

    if (!this.initialized) return

    this.syncFromStore()
    this.autoStartFirstQuest()
    this.emitGuidanceUpdate()
  }

  init() {
    if (this.initialized) return
    this.initialized = true

    this.syncFromStore()
    this.autoStartFirstQuest()

    this.unsubVisitNode = subscribeGameSnapshot(
      (snapshot) => {
        const lastNode = selectLastVisitedNode(snapshot)
        if (lastNode) {
          this.advanceStorySpine(lastNode)
        }
      },
      {
        selector: selectLastVisitedNode,
        equalityFn: (a, b) => a === b,
      },
    )

    this.unsubQuestCompleted = eventBus.on('quest:completed', ({ questId }) => {
      if (GOLDEN_PATH_QUEST_SPINE.includes(questId)) {
        this.advanceQuestSpine(questId)
      }
    })

    this.unsubNpcTalked = eventBus.on('npc:talked', ({ npcId }) => {
      for (let i = this.currentStepIndex; i < GOLDEN_PATH_STORY_SPINE.length; i++) {
        const nodeId = GOLDEN_PATH_STORY_SPINE[i]
        if (getNpcIdForStoryNode(nodeId) === npcId) {
          this.advanceStorySpine(nodeId)
          break
        }
      }
    })

    this.unsubSceneEnter = eventBus.on('scene:enter', ({ sceneId }) => {
      const stepNodeId = GOLDEN_PATH_STORY_SPINE[this.currentStepIndex]
      if (!stepNodeId) return
      const nodeSceneId = getStoryNodes()[stepNodeId]?.sceneId
      if (nodeSceneId === sceneId) {
        this.advanceStorySpine(stepNodeId)
      }
    })

    this.unsubFlagSet = subscribeGameSnapshot(
      (snapshot) => {
        for (const key of selectStoryRelevantTTLFlagKeys(snapshot)) {
          const nodeMatch = STORY_FLAG_TO_NODE_ID[key]
          if (nodeMatch && GOLDEN_PATH_STORY_SPINE.indexOf(nodeMatch) >= this.currentStepIndex) {
            this.advanceStorySpine(nodeMatch)
          }
        }
      },
      {
        selector: selectStoryRelevantTTLFlagKeys,
        equalityFn: stringArraysEqual,
      },
    )

    this.unsubGameLoaded = eventBus.on('game:loaded', () => {
      this.resetState()
    })

    this.emitGuidanceUpdate()
  }

  dispose() {
    if (!this.initialized) return
    this.initialized = false

    this.unsubVisitNode?.()
    this.unsubQuestCompleted?.()
    this.unsubNpcTalked?.()
    this.unsubSceneEnter?.()
    this.unsubFlagSet?.()
    this.unsubGameLoaded?.()

    this.unsubVisitNode = null
    this.unsubQuestCompleted = null
    this.unsubNpcTalked = null
    this.unsubSceneEnter = null
    this.unsubFlagSet = null
    this.unsubGameLoaded = null

    this.currentStepIndex = 0
    this.currentQuestSpineIndex = 0
    this.lastAdvancedToAct = 0
  }

  getActQuote(actNumber: number): string | undefined {
    const actQuotes = getQuotesByAct(actNumber)
    return actQuotes.length > 0 ? actQuotes[0].text : undefined
  }
}

/** Singleton instance */
export const guidedStoryManager = new GuidedStoryManager()

export function initGuidedStoryManager() {
  guidedStoryManager.init()
}

export function disposeGuidedStoryManager() {
  guidedStoryManager.dispose()
}

export function resetGuidedStoryManager() {
  storyNodeParentsCache = null
  guidedStoryManager.resetState()
}

export function getCurrentGuidance(): GuidanceInfo | null {
  return guidedStoryManager.getCurrentGuidance()
}

export function canStartQuest(questId: string): boolean {
  return guidedStoryManager.canStartQuest(questId)
}

export function getActQuote(actNumber: number): string | undefined {
  return guidedStoryManager.getActQuote(actNumber)
}
