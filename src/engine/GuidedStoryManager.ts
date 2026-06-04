/* ─── Volodka RPG – GuidedStoryManager ─── */
/* Enforces linear story progression through the golden path.
 * Tracks which step the player is on, auto-advances on node visits
 * and quest completions, and emits events for UI guidance. */

import { GOLDEN_PATH_STORY_SPINE, GOLDEN_PATH_QUEST_SPINE, GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { NPC_DEFINITIONS } from '@/data/npcDefinitions'
import { eventBus } from '@/engine/EventBus'
import { useGameStore } from '@/store/gameStore'
import { areDependenciesMet } from '@/store/questStore'
import type { QuestDefinition, QuestObjective } from '@/shared/types/game'
import { getQuotesByAct } from '@/data/matrixQuotes'

/* ─── Act chapter titles ─── */
const ACT_CHAPTERS: Record<number, string> = {
  1: 'Пробуждение',
  2: 'Сеть',
  3: 'Война за правду',
  4: 'Революция',
  5: 'Финал',
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

/* ─── Internal state ─── */
let currentStepIndex = 0
let currentQuestSpineIndex = 0
let initialized = false
// Guard against double advanceAct() — both advanceStorySpine and
// advanceQuestSpine can trigger act transitions independently.
let lastAdvancedToAct = 0
let unsubVisitNode: (() => void) | null = null
let unsubQuestCompleted: (() => void) | null = null
let unsubNpcTalked: (() => void) | null = null
let unsubSceneEnter: (() => void) | null = null
let unsubFlagSet: (() => void) | null = null

/* ─── Get act number from story node position ─── */
function getActForNode(nodeId: string): number {
  const actTransitionNodes = [
    'start', // Act 1 begins
    'act2_transition', // Act 2 begins
    'act3_transition', // Act 3 begins
    'act4_transition', // Act 4 begins
    'act5_peaceful_path', // Act 5 begins
  ]
  const idx = actTransitionNodes.indexOf(nodeId)
  if (idx >= 0) return idx + 1

  // Find which act this node falls in based on spine position
  const spineIdx = GOLDEN_PATH_STORY_SPINE.indexOf(nodeId)
  if (spineIdx < 0) return 1

  for (let i = actTransitionNodes.length - 1; i >= 0; i--) {
    const transIdx = GOLDEN_PATH_STORY_SPINE.indexOf(actTransitionNodes[i])
    if (spineIdx >= transIdx) return i + 1
  }
  return 1
}

/* ─── Get act for a quest ─── */
function getActForQuest(questId: string): number {
  const def = QUEST_DEFINITIONS.find((d) => d.id === questId)
  return def?.act ?? 1
}

/* ─── Derive objective from current golden path step ─── */
function deriveObjectiveFromStep(stepIndex: number): GuidanceInfo | null {
  if (stepIndex >= GOLDEN_PATH_STORY_SPINE.length) return null

  const nodeId = GOLDEN_PATH_STORY_SPINE[stepIndex]
  const act = getActForNode(nodeId)
  const hint = GOLDEN_PATH_BRANCH_HINTS[nodeId]

  // Check if this step corresponds to a quest in the quest spine
  const questDef = findQuestForNode(nodeId)
  if (questDef) {
    // Find the first uncompleted objective for this quest
    const store = useGameStore.getState()
    const questState = store.quests.find((q) => q.questId === questDef.id)

    if (questState?.status === 'active') {
      const nextObj = questDef.objectives.find((o) => !questState.objectives[o.id])
      if (nextObj) {
        return buildGuidanceFromObjective(nextObj, questDef, act)
      }
    }

    // Quest not started yet — guide to start it
    return {
      objectiveText: hint ?? `Прими задание: ${questDef.title}`,
      objectiveType: 'complete_quest',
      targetId: questDef.id,
      urgency: questDef.questType === 'main' ? 'required' : 'recommended',
      actNumber: act,
      chapterTitle: ACT_CHAPTERS[act] ?? `Акт ${act}`,
    }
  }

  // No quest — use the branch hint or node name
  const objectiveText = hint ?? nodeToReadableText(nodeId)
  const objectiveType = inferObjectiveType(nodeId)

  return {
    objectiveText,
    objectiveType,
    targetId: nodeId,
    urgency: 'recommended',
    actNumber: act,
    chapterTitle: ACT_CHAPTERS[act] ?? `Акт ${act}`,
  }
}

/* ─── Find quest linked to a story node ─── */
function findQuestForNode(nodeId: string): QuestDefinition | null {
  return QUEST_DEFINITIONS.find((d) => d.linkedStoryNodeId === nodeId) ?? null
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
      const npc = NPC_DEFINITIONS.find((n) => n.id === obj.target)
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
    chapterTitle: ACT_CHAPTERS[act] ?? `Акт ${act}`,
  }
}

/* ─── Convert node ID to readable Russian text ─── */
function nodeToReadableText(nodeId: string): string {
  const hint = GOLDEN_PATH_BRANCH_HINTS[nodeId]
  if (hint) return hint

  // Attempt a simple mapping for common patterns
  const npcNames: Record<string, string> = {}
  for (const npc of NPC_DEFINITIONS) {
    npcNames[npc.id] = npc.name
  }

  // Check if node mentions an NPC
  for (const [npcId, name] of Object.entries(npcNames)) {
    if (nodeId.toLowerCase().includes(npcId.toLowerCase())) {
      return `Найди ${name}`
    }
  }

  // Check for scene references
  const sceneNames: Record<string, string> = {
    cafe: 'кафе «Синяя яма»',
    office: 'офис IT-гильдии',
    street: 'улица',
    park: 'парк',
    library: 'библиотека',
    rooftop: 'крыша',
    corridor: 'коридор',
    kitchen: 'кухня',
    room: 'комната',
    factory: 'заброшенная фабрика',
  }

  for (const [key, name] of Object.entries(sceneNames)) {
    if (nodeId.toLowerCase().includes(key)) {
      return `Отправляйся в ${name}`
    }
  }

  return `Продолжай путь: ${nodeId.replace(/_/g, ' ')}`
}

/* ─── Infer objective type from node name ─── */
function inferObjectiveType(nodeId: string): GuidanceInfo['objectiveType'] {
  if (nodeId.includes('talk') || nodeId.includes('meet') || nodeId.includes('maria') || nodeId.includes('albert') || nodeId.includes('dmitry') || nodeId.includes('zarema') || nodeId.includes('barista') || nodeId.includes('colleague') || nodeId.includes('alexander')) {
    return 'talk_to_npc'
  }
  if (nodeId.includes('visit') || nodeId.includes('enter') || nodeId.includes('go_to') || nodeId.includes('cafe') || nodeId.includes('office') || nodeId.includes('street') || nodeId.includes('park') || nodeId.includes('library') || nodeId.includes('rooftop') || nodeId.includes('factory')) {
    return 'visit_location'
  }
  if (nodeId.includes('choice') || nodeId.includes('decision')) {
    return 'make_choice'
  }
  if (nodeId.includes('collect') || nodeId.includes('poem') || nodeId.includes('item')) {
    return 'collect_item'
  }
  return 'complete_quest'
}

/* ─── Get the current guidance info ─── */
export function getCurrentGuidance(): GuidanceInfo | null {
  const store = useGameStore.getState()

  // First, check if there's an active quest from the quest spine with incomplete objectives
  for (let i = 0; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
    const questId = GOLDEN_PATH_QUEST_SPINE[i]
    const questState = store.quests.find((q) => q.questId === questId)

    if (questState?.status === 'active') {
      const questDef = QUEST_DEFINITIONS.find((d) => d.id === questId)
      if (!questDef) continue

      const nextObj = questDef.objectives.find((o) => !questState.objectives[o.id])
      if (nextObj) {
        const act = questDef.act ?? getActForQuest(questId)
        return buildGuidanceFromObjective(nextObj, questDef, act)
      }
    }
  }

  // Fall back to golden path story spine
  return deriveObjectiveFromStep(currentStepIndex)
}

/* ─── Get the next quest available in the quest spine ─── */
function getNextQuestInSpine(): { questId: string; def: QuestDefinition } | null {
  const store = useGameStore.getState()

  for (let i = currentQuestSpineIndex; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
    const questId = GOLDEN_PATH_QUEST_SPINE[i]
    const questState = store.quests.find((q) => q.questId === questId)

    // Skip if already completed or active
    if (questState?.status === 'completed' || questState?.status === 'active') {
      currentQuestSpineIndex = i + 1
      continue
    }

    const def = QUEST_DEFINITIONS.find((d) => d.id === questId)
    if (!def) continue

    // Check prerequisites
    const deps = areDependenciesMet(questId)
    if (!deps.met) continue

    // Check required flag
    if (def.requiredFlag && !store.playerState.flags[def.requiredFlag]) continue

    // Check act gating
    const questAct = def.act ?? 1
    if (questAct > store.playerState.progression.currentAct) continue

    return { questId, def }
  }

  return null
}

/* ─── Advance the golden path story spine ─── */
function advanceStorySpine(visitedNodeId: string) {
  const nodeIndex = GOLDEN_PATH_STORY_SPINE.indexOf(visitedNodeId)
  if (nodeIndex < 0) return
  if (nodeIndex < currentStepIndex) return

  const prevStep = currentStepIndex
  currentStepIndex = nodeIndex + 1

  // Check for act transitions
  const prevAct = getActForNode(GOLDEN_PATH_STORY_SPINE[prevStep])
  const newAct = currentStepIndex < GOLDEN_PATH_STORY_SPINE.length
    ? getActForNode(GOLDEN_PATH_STORY_SPINE[currentStepIndex])
    : prevAct

  if (newAct > prevAct) {
    // Guard: skip if this act was already advanced in this session
    if (newAct > lastAdvancedToAct) {
      lastAdvancedToAct = newAct
      const store = useGameStore.getState()
      store.advanceAct()

      eventBus.emit('story:act_transition', {
        fromAct: prevAct,
        toAct: newAct,
        chapterTitle: ACT_CHAPTERS[newAct] ?? `Акт ${newAct}`,
      })
    }
  }

  // Emit guidance update
  emitGuidanceUpdate()
}

/* ─── Advance the quest spine ─── */
function advanceQuestSpine(completedQuestId: string) {
  const spineIdx = GOLDEN_PATH_QUEST_SPINE.indexOf(completedQuestId)
  if (spineIdx >= 0 && spineIdx >= currentQuestSpineIndex) {
    currentQuestSpineIndex = spineIdx + 1
  }

  // Check if all quests in current act are done — trigger act transition
  const store = useGameStore.getState()
  const currentAct = store.playerState.progression.currentAct

  const actQuests = GOLDEN_PATH_QUEST_SPINE.filter((qId) => {
    const def = QUEST_DEFINITIONS.find((d) => d.id === qId)
    return def?.act === currentAct
  })

  const allActQuestsComplete = actQuests.every((qId) => {
    const qs = store.quests.find((q) => q.questId === qId)
    return qs?.status === 'completed'
  })

  if (allActQuestsComplete && currentAct < 5) {
    const nextAct = currentAct + 1
    // Guard: skip if this act was already advanced in this session
    if (nextAct > lastAdvancedToAct) {
      lastAdvancedToAct = nextAct
      store.advanceAct()
      eventBus.emit('story:act_transition', {
        fromAct: currentAct,
        toAct: nextAct,
        chapterTitle: ACT_CHAPTERS[nextAct] ?? `Акт ${nextAct}`,
      })
    }
  }

  // Offer next quest — emit both generic and chain-specific events
  const nextQuest = getNextQuestInSpine()
  if (nextQuest) {
    eventBus.emit('story:quest_available', {
      questId: nextQuest.questId,
      questTitle: nextQuest.def.title,
      questType: nextQuest.def.questType,
      npcId: findNpcForQuest(nextQuest.def),
    })

    if (nextQuest.def.questType === 'main') {
      // Main quests are shown via story:quest_available above
      // No separate event needed — story:quest_chain_unlock handles prominent notification
    }

    // Emit quest chain unlock event — this is a more prominent notification
    // that the next quest in the golden path is available after completing
    // the previous one. The UI can show a flashy notification for this.
    const isDirectChainSuccessor = spineIdx >= 0 && spineIdx < GOLDEN_PATH_QUEST_SPINE.length - 1
    if (isDirectChainSuccessor) {
      const prevQuestDef = QUEST_DEFINITIONS.find((d) => d.id === completedQuestId)
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

  emitGuidanceUpdate()
}

/* ─── Find the NPC associated with a quest ─── */
function findNpcForQuest(questDef: QuestDefinition): string | undefined {
  const npcObj = questDef.objectives.find((o) => o.type === 'npc_talked')
  return npcObj?.target
}

/* ─── Emit guidance update event ─── */
function emitGuidanceUpdate() {
  const guidance = getCurrentGuidance()
  if (guidance) {
    eventBus.emit('story:guidance_update', guidance)
  }
}

/* ─── Auto-start the first quest ─── */
function autoStartFirstQuest() {
  const store = useGameStore.getState()
  const firstQuestId = GOLDEN_PATH_QUEST_SPINE[0]
  if (!firstQuestId) return

  // Check specifically if the first quest is already active or completed,
  // rather than blocking on ANY active quest. The old guard
  //   if (store.quests.some((q) => q.status === 'active' || q.status === 'completed')) return
  // prevented first_reading from being activated when any other quest
  // existed (e.g. after loading a save with other quests active).
  const existing = store.quests.find((q) => q.questId === firstQuestId)
  if (existing && existing.status !== 'inactive' && existing.status !== 'failed') return

  const def = QUEST_DEFINITIONS.find((d) => d.id === firstQuestId)
  if (!def) return

  store.activateQuest(firstQuestId)
  currentQuestSpineIndex = 0

  eventBus.emit('story:quest_available', {
    questId: firstQuestId,
    questTitle: def.title,
    questType: def.questType,
    npcId: findNpcForQuest(def),
  })

  if (def.questType === 'main') {
    // Main quest — already announced via story:quest_available above
  }
}

/* ─── Check prerequisites for quest activation ─── */
export function canStartQuest(questId: string): boolean {
  const store = useGameStore.getState()

  // Already active or completed?
  const existing = store.quests.find((q) => q.questId === questId)
  if (existing && existing.status !== 'inactive') return false

  const def = QUEST_DEFINITIONS.find((d) => d.id === questId)
  if (!def) return false

  // Check required quests
  if (def.requiresQuests) {
    for (const reqId of def.requiresQuests) {
      const reqQuest = store.quests.find((q) => q.questId === reqId)
      if (!reqQuest || reqQuest.status !== 'completed') return false
    }
  }

  // Check required flag
  if (def.requiredFlag && !store.playerState.flags[def.requiredFlag]) return false

  // Check act gating
  const questAct = def.act ?? 1
  if (questAct > store.playerState.progression.currentAct) return false

  return true
}

/* ─── Initialize the guided story manager ─── */
export function initGuidedStoryManager() {
  if (initialized) return
  initialized = true

  // Sync state from store on init
  const store = useGameStore.getState()
  const visitedNodes = store.playerState.visitedNodes

  // Initialize lastAdvancedToAct from store so we don't re-advance
  // an act that was already advanced in a previous session
  lastAdvancedToAct = store.playerState.progression.currentAct

  // Find the highest visited node in the spine
  for (let i = GOLDEN_PATH_STORY_SPINE.length - 1; i >= 0; i--) {
    if (visitedNodes.includes(GOLDEN_PATH_STORY_SPINE[i])) {
      currentStepIndex = i + 1
      break
    }
  }

  // Find current quest spine position
  for (let i = 0; i < GOLDEN_PATH_QUEST_SPINE.length; i++) {
    const questId = GOLDEN_PATH_QUEST_SPINE[i]
    const questState = store.quests.find((q) => q.questId === questId)
    if (questState?.status === 'completed') {
      currentQuestSpineIndex = i + 1
    } else if (questState?.status === 'active') {
      currentQuestSpineIndex = i
      break
    } else {
      break
    }
  }

  // Auto-start first quest if none active
  autoStartFirstQuest()

  // Listen for node visits
  unsubVisitNode = useGameStore.subscribe((state) => {
    const nodes = state.playerState.visitedNodes
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1]
      advanceStorySpine(lastNode)
    }
  })

  // Listen for quest completions
  unsubQuestCompleted = eventBus.on('quest:completed', ({ questId }) => {
    if (GOLDEN_PATH_QUEST_SPINE.includes(questId)) {
      advanceQuestSpine(questId)
    }
  })

  // Listen for NPC talks (for story advancement)
  unsubNpcTalked = eventBus.on('npc:talked', ({ npcId }) => {
    // Check if any golden path node mentions this NPC
    const relevantNodes = GOLDEN_PATH_STORY_SPINE.filter(
      (n) => n.toLowerCase().includes(npcId.toLowerCase()) ||
             n.toLowerCase().includes(npcId.replace('_', '').toLowerCase()),
    )
    for (const node of relevantNodes) {
      if (GOLDEN_PATH_STORY_SPINE.indexOf(node) >= currentStepIndex) {
        advanceStorySpine(node)
        break
      }
    }
  })

  // Listen for scene enters
  unsubSceneEnter = eventBus.on('scene:enter', ({ sceneId }) => {
    const nodeMatch = GOLDEN_PATH_STORY_SPINE.find(
      (n) => n.toLowerCase().includes(sceneId.replace('_', '').toLowerCase()),
    )
    if (nodeMatch && GOLDEN_PATH_STORY_SPINE.indexOf(nodeMatch) >= currentStepIndex) {
      advanceStorySpine(nodeMatch)
    }
  })

  // Listen for flag changes (story-advancing flags like act transitions)
  unsubFlagSet = useGameStore.subscribe((state) => {
    const flags = state.activeTTLFlags
    // Check if any flag corresponds to a golden path story node
    const storyFlagKeywords = ['act', 'vault', 'guild', 'broadcast', 'rescue', 'defection', 'infiltrated']
    for (const flag of flags) {
      const flagKey = flag.key.toLowerCase()
      if (storyFlagKeywords.some((kw) => flagKey.includes(kw))) {
        const nodeMatch = GOLDEN_PATH_STORY_SPINE.find(
          (n) => n.toLowerCase().includes(flagKey.replace(/_/g, '')),
        )
        if (nodeMatch && GOLDEN_PATH_STORY_SPINE.indexOf(nodeMatch) >= currentStepIndex) {
          advanceStorySpine(nodeMatch)
        }
      }
    }
  })

  // Emit initial guidance
  emitGuidanceUpdate()
}

/* ─── Dispose the guided story manager ─── */
export function disposeGuidedStoryManager() {
  if (!initialized) return
  initialized = false

  unsubVisitNode?.()
  unsubQuestCompleted?.()
  unsubNpcTalked?.()
  unsubSceneEnter?.()
  unsubFlagSet?.()

  unsubVisitNode = null
  unsubQuestCompleted = null
  unsubNpcTalked = null
  unsubSceneEnter = null
  unsubFlagSet = null

  currentStepIndex = 0
  currentQuestSpineIndex = 0
  lastAdvancedToAct = 0
}

/* ─── Get the act quotes ─── */
export function getActQuote(actNumber: number): string | undefined {
  const actQuotes = getQuotesByAct(actNumber)
  return actQuotes.length > 0 ? actQuotes[0].text : undefined
}
